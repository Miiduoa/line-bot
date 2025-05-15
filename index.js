require('dotenv').config();
const express = require('express');
const line = require('@line/bot-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the app
const app = express();

// Enable JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Memory storage for conversation context (in production, use a database)
const conversationHistory = {};

// Health check endpoint for Vercel
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'LINE Bot is running' });
});

// LINE webhook middleware
app.post('/webhook', async (req, res) => {
  try {
    // Verify signature
    const signature = req.headers['x-line-signature'];
    if (!signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (!line.validateSignature(JSON.stringify(req.body), lineConfig.channelSecret, signature)) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Process events
    const events = req.body.events || [];
    await Promise.all(events.map(handleEvent));
    return res.status(200).json({ status: 'OK' });
  } catch (err) {
    console.error('Error handling events:', err);
    return res.status(500).json({ error: err.message });
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

    // Generate a response
    const result = await chat.sendMessage(event.message.text);
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

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// For Vercel serverless deployment
module.exports = app; 