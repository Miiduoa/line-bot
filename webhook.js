require('dotenv').config();
const { Client, middleware } = require('@line/bot-sdk');
const axios = require('axios');

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};
const client = new Client(lineConfig);

// In-memory session store
const sessions = new Map();

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  // LINE middleware for signature validation
  try {
    await middleware(lineConfig)(req, res, async () => {
      const events = req.body.events;
      await Promise.all(events.map(handleEvent));
    });
    if (!res.writableEnded) res.status(200).end();
  } catch (err) {
    console.error(err);
    if (!res.writableEnded) res.status(500).end();
  }
};

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const userId = event.source.userId;
  const text = event.message.text.trim();
  const history = sessions.get(userId) || [];
  let reply;

  if (/^天氣\s+/.test(text)) {
    const city = text.replace(/^天氣\s+/, '');
    reply = await getWeather(city);
  } else if (/^電影\s+/.test(text)) {
    const title = text.replace(/^電影\s+/, '');
    reply = await getMovieInfo(title);
  } else {
    history.push({ author: 'user', content: text });
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
  } catch {
    return '查詢天氣失敗，請確認城市名稱。';
  }
}

async function getMovieInfo(title) {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=zh-TW&query=${encodeURIComponent(title)}`;
    const { data } = await axios.get(url);
    if (!data.results.length) return '找不到相關電影。';
    const m = data.results[0];
    return `《${m.title}》 (${m.release_date})\n評分：${m.vote_average}\n${m.overview}`;
  } catch {
    return '查詢電影失敗。';
  }
}

async function askGemini(history) {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/chat-bison-001:generateMessage?key=${process.env.GEMINI_API_KEY}`;
    const payload = {
      model: 'models/chat-bison-001',
      prompt: { messages: history.map(m => ({ author: m.author, content: m.content })) },
      temperature: 0.7,
      maxOutputTokens: 512
    };
    const { data } = await axios.post(endpoint, payload);
    return data.candidates.length ? data.candidates[0].content : '沒有回應';
  } catch {
    return '無法連接到 Gemini API。';
  }
} 