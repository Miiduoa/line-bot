require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API connection...');
    console.log('API Key available:', !!process.env.GEMINI_API_KEY);
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('Error: GEMINI_API_KEY not found in environment variables');
      return;
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log('Sending test request to Gemini API...');
    const result = await model.generateContent("Hello, please respond with a simple greeting");
    const response = result.response.text();
    
    console.log('Gemini API Response:', response);
    console.log('Test successful!');
  } catch (error) {
    console.error('Error testing Gemini API:', error);
  }
}

testGeminiAPI(); 