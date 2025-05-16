require('dotenv').config();
const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET
};
const client = new line.Client(lineConfig);
const app = express();
app.use(express.json());

// In-memory session store for context
const sessions = new Map();

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events;
    await Promise.all(events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const userText = event.message.text.trim();
  const history = sessions.get(userId) || [];

  let reply;
  if (/^天氣\s+/.test(userText)) {
    const city = userText.replace(/^天氣\s+/, '');
    reply = await getWeather(city);
  } else if (/^電影\s+/.test(userText)) {
    const title = userText.replace(/^電影\s+/, '');
    reply = await getMovieInfo(title);
  } else {
    history.push({ author: 'user', content: userText });
    reply = await askGemini(history);
    history.push({ author: 'assistant', content: reply });
    if (history.length > 20) history.splice(0, history.length - 20);
    sessions.set(userId, history);
  }

  await client.replyMessage(event.replyToken, { type: 'text', text: reply });
}

async function getWeather(city) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=zh_tw&appid=${process.env.WEATHER_API_KEY}`;
    const { data } = await axios.get(url);
    return `${data.name} 天氣：${data.weather[0].description}，氣溫：${data.main.temp}°C`;
  } catch (err) {
    console.error(err);
    return '查詢天氣失敗，請確認城市名稱是否正確。';
  }
}

async function getMovieInfo(title) {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=zh-TW&query=${encodeURIComponent(title)}`;
    const { data } = await axios.get(url);
    if (!data.results.length) return '找不到相關電影。';
    const m = data.results[0];
    return `《${m.title}》 (${m.release_date})\n評分：${m.vote_average}\n簡介：${m.overview}`;
  } catch (err) {
    console.error(err);
    return '查詢電影失敗。';
  }
}

async function askGemini(history) {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/chat-bison-001:generateMessage?key=${process.env.GEMINI_API_KEY}`;
    const payload = {
      model: 'models/chat-bison-001',
      prompt: { messages: history.map(msg => ({ author: msg.author, content: msg.content })) },
      temperature: 0.7,
      maxOutputTokens: 512
    };
    const { data } = await axios.post(endpoint, payload);
    return data.candidates[0].content;
  } catch (err) {
    console.error('Gemini API error:', err.response?.data || err.message);
    return '無法連接到 Gemini API。';
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`LINE Bot running on port ${port}`)); 