const axios = require('axios');

async function chatWithGemini(history, cfg) {
  const url = 'https://gemini.googleapis.com/v1/chat:complete';
  const headers = {
    'Authorization': `Bearer ${cfg.GEMINI_API_KEY}`,
    'Content-Type': 'application/json'
  };
  
  const payload = {
    model: 'gemini-1.5-turbo',
    messages: history
  };
  
  try {
    const response = await axios.post(url, payload, { headers });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Gemini API error:', error);
    return '抱歉，我現在無法回應，請稍後再試。';
  }
}

module.exports = {
  chatWithGemini
}; 