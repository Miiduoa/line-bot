// api/webhook.js
const { Client, middleware } = require('@line/bot-sdk');
const config = require('../config');
const weatherHandler = require('../handlers/weather');
const movieHandler = require('../handlers/movie');
const newsHandler = require('../handlers/news');
const chatgptHandler = require('../handlers/chatgpt');

// 簡易上下文儲存（正式建議 Redis/DB）
const sessions = {};

const lineConfig = {
  channelSecret: config.LINE_CHANNEL_SECRET,
  channelAccessToken: config.LINE_CHANNEL_ACCESS_TOKEN
};

const client = new Client(lineConfig);

module.exports = async (req, res) => {
  // 驗證 LINE 的簽名
  const signature = req.headers['x-line-signature'];
  
  // 如果沒有簽名，返回 400
  if (!signature) {
    return res.status(400).send('Bad Request');
  }
  
  // 驗證簽名
  const body = JSON.stringify(req.body);
  const events = req.body.events;
  
  // 如果沒有事件，返回 200
  if (!events || !events.length) {
    return res.status(200).send('OK');
  }
  
  // 處理每個事件
  await Promise.all(
    events.map(async (event) => {
      if (event.type !== 'message' || event.message.type !== 'text') {
        return;
      }
      
      const userId = event.source.userId;
      const groupId = event.source.groupId || userId;
      const text = event.message.text.trim();
      
      // 初始化 session
      if (!sessions[groupId]) {
        sessions[groupId] = [];
      }
      
      let reply;
      
      // 指令判斷
      if (text.toLowerCase().startsWith('天氣') || text.toLowerCase().startsWith('weather')) {
        reply = await weatherHandler.getWeather(text, config);
      } else if (text.toLowerCase().startsWith('電影') || text.toLowerCase().startsWith('movie')) {
        reply = await movieHandler.getMovie(text, config);
      } else if (text.toLowerCase().startsWith('新聞') || text.toLowerCase().startsWith('news')) {
        reply = await newsHandler.getNews(text, config);
      } else {
        // 搭訕對話
        sessions[groupId].push({ role: 'user', content: text });
        reply = await chatgptHandler.chatWithGemini(sessions[groupId], config);
        sessions[groupId].push({ role: 'assistant', content: reply });
        
        // 限制歷史長度
        if (sessions[groupId].length > 20) {
          sessions[groupId].shift();
        }
      }
      
      // 回覆訊息
      return client.replyMessage(event.replyToken, {
        type: 'text',
        text: reply
      });
    })
  );
  
  return res.status(200).send('OK');
}; 