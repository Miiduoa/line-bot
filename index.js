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

// Memory storage for conversation context (in production, use a database)
const conversationHistory = {};

// LINE webhook middleware
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
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

// Health check endpoint for Vercel
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 