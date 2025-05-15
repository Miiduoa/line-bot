require('dotenv').config();
const axios = require('axios');

async function testGemini() {
  try {
    console.log('測試Gemini API連接...');
    console.log('使用的API金鑰:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
    
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const headers = { 'Content-Type': 'application/json' };
    const payload = {
      contents: [
        {
          parts: [
            { text: '你好，請用繁體中文簡短介紹自己' }
          ]
        }
      ]
    };
    
    console.log('發送請求到Gemini API...');
    const { data } = await axios.post(endpoint, payload, { headers });
    
    const resp = data.candidates && data.candidates.length > 0
      ? data.candidates[0].content.parts.map(p => p.text).join('\n')
      : '沒有收到回應';
    
    console.log('=====================');
    console.log('Gemini回應:');
    console.log(resp);
    console.log('=====================');
    console.log('測試完成！');
  } catch (err) {
    console.error('Gemini API錯誤:', err.response?.data || err.message);
  }
}

testGemini(); 