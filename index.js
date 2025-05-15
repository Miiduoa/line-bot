require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the app
const app = express();

// LINE Bot configuration
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};

// Initialize LINE Bot client
const lineClient = new line.Client(lineConfig);

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Add error logging for initialization
console.log('LINE bot initializing with configuration:', {
  hasChannelSecret: !!process.env.LINE_CHANNEL_SECRET,
  hasAccessToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
  hasGeminiKey: !!process.env.GEMINI_API_KEY
});

// Memory storage for conversation context (in production, use a database)
const conversationHistory = {};

// Body parser for webhook validation
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Webhook validation middleware
function validateSignature(req, res, next) {
  if (!req.rawBody) {
    return res.status(400).send('Invalid request');
  }

  try {
    const signature = req.headers['x-line-signature'];
    const isValid = line.validateSignature(req.rawBody, lineConfig.channelSecret, signature);
    
    if (isValid) {
      next();
    } else {
      console.error('Invalid signature');
      res.status(401).send('Invalid signature');
    }
  } catch (error) {
    console.error('Error validating webhook:', error);
    res.status(500).send('Internal server error during validation');
  }
}

// LINE webhook endpoint with custom validation
app.post('/webhook', validateSignature, async (req, res) => {
  if (!req.body || !req.body.events) {
    return res.status(400).send('Invalid webhook payload');
  }

  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error('Error handling events:', err);
    res.status(500).end();
  }
});

// Event handler
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const userId = event.source.userId;
  
  // Initialize conversation history for this user if it doesn't exist
  if (!conversationHistory[userId]) {
    conversationHistory[userId] = [];
  }
  
  // Add user message to history
  conversationHistory[userId].push({
    role: "user",
    parts: [{ text: event.message.text }]
  });
  
  // Keep conversation history limited to prevent token limit issues
  // This is important for preventing context window overflow
  if (conversationHistory[userId].length > 10) {
    conversationHistory[userId] = conversationHistory[userId].slice(-10);
  }

  try {
    // Start a chat with the conversation history
    const chat = model.startChat({
      history: conversationHistory[userId],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      },
    });

    // Generate a response with timeout handling
    const result = await Promise.race([
      chat.sendMessage(event.message.text),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API timeout')), 20000)
      )
    ]);
    
    const botResponse = result.response.text();
    
    // Add bot response to conversation history
    conversationHistory[userId].push({
      role: "model",
      parts: [{ text: botResponse }]
    });

    // Reply to the user
    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: botResponse
    });
  } catch (error) {
    console.error('Error communicating with Gemini:', error);
    
    // Send error message
    return lineClient.replyMessage(event.replyToken, {
      type: 'text',
      text: '抱歉，我現在無法回應。請稍後再試。'
    });
  }
}

// Health check endpoint for Vercel
app.get('/', (req, res) => {
  // Test connection to APIs
  const status = {
    status: 'OK',
    line: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
    gemini: !!process.env.GEMINI_API_KEY
  };
  
  res.status(200).json(status);
});

// Testing endpoint for Gemini API (remove or secure this in production)
app.get('/test-gemini', async (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Missing Gemini API key' });
  }
  
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Hello, can you respond with a simple greeting?");
    res.json({ success: true, response: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 