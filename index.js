require('dotenv').config();
const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.Client(lineConfig);
const app = express();
app.use(express.json());

// 增加根路徑的回應，用於Vercel健康檢查
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'LINE Bot is running!' });
});

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
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  const userText = event.message.text.trim();

  // 幫助命令
  if (userText === '幫助' || userText === 'help') {
    await client.replyMessage(event.replyToken, createHelpMessage());
    return;
  }

  if (/^天氣\s+/.test(userText)) {
    const location = userText.replace(/^天氣\s+/, '');
    const weatherData = await getCWAWeatherData(location);
    if (weatherData.error) {
      await client.replyMessage(event.replyToken, { type: 'text', text: weatherData.error });
    } else {
      await client.replyMessage(event.replyToken, createWeatherFlexMessage(weatherData));
    }
    return;
  }

  if (/^電影\s+/.test(userText)) {
    const title = userText.replace(/^電影\s+/, '');
    const movieData = await getMovieData(title);
    if (movieData.error) {
      await client.replyMessage(event.replyToken, { type: 'text', text: movieData.error });
    } else {
      await client.replyMessage(event.replyToken, createMovieFlexMessage(movieData));
    }
    return;
  }

  const reply = await askGemini(userText);
  await client.replyMessage(event.replyToken, { type: 'text', text: reply });
}

function createHelpMessage() {
  return {
    type: 'flex',
    altText: '機器人功能使用說明',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '機器人使用指南',
            weight: 'bold',
            size: 'xl',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#27ACB2'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '可用的命令：',
            weight: 'bold',
            size: 'lg',
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '天氣 [城市]',
                    weight: 'bold',
                    flex: 0,
                    margin: 'sm'
                  },
                  {
                    type: 'text',
                    text: '查詢指定城市的天氣',
                    size: 'sm',
                    color: '#666666',
                    margin: 'md'
                  }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '電影 [片名]',
                    weight: 'bold',
                    flex: 0,
                    margin: 'sm' 
                  },
                  {
                    type: 'text',
                    text: '查詢電影資訊',
                    size: 'sm',
                    color: '#666666',
                    margin: 'md'
                  }
                ],
                margin: 'md'
              }
            ]
          },
          {
            type: 'text',
            text: '其他訊息將透過 AI 自動回應',
            margin: 'xxl',
            size: 'md',
            color: '#aaaaaa',
            wrap: true
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'message',
              label: '天氣 臺北',
              text: '天氣 臺北'
            },
            style: 'primary'
          },
          {
            type: 'button',
            action: {
              type: 'message',
              label: '電影 復仇者聯盟',
              text: '電影 復仇者聯盟'
            },
            style: 'secondary',
            margin: 'md'
          }
        ]
      }
    }
  };
}

// 縣市對應表，用於將使用者輸入轉換為API需要的地區代碼
const locationMap = {
  '基隆': { city: '基隆市', code: '10017' },
  '基隆市': { city: '基隆市', code: '10017' },
  '台北': { city: '臺北市', code: '63' },
  '臺北': { city: '臺北市', code: '63' },
  '台北市': { city: '臺北市', code: '63' },
  '臺北市': { city: '臺北市', code: '63' },
  '新北': { city: '新北市', code: '65' },
  '新北市': { city: '新北市', code: '65' },
  '桃園': { city: '桃園市', code: '68' },
  '桃園市': { city: '桃園市', code: '68' },
  '新竹': { city: '新竹縣', code: '10004' },
  '新竹市': { city: '新竹市', code: '10018' },
  '新竹縣': { city: '新竹縣', code: '10004' },
  '苗栗': { city: '苗栗縣', code: '10005' },
  '苗栗縣': { city: '苗栗縣', code: '10005' },
  '台中': { city: '臺中市', code: '66' },
  '臺中': { city: '臺中市', code: '66' },
  '台中市': { city: '臺中市', code: '66' },
  '臺中市': { city: '臺中市', code: '66' },
  '彰化': { city: '彰化縣', code: '10007' },
  '彰化縣': { city: '彰化縣', code: '10007' },
  '南投': { city: '南投縣', code: '10008' },
  '南投縣': { city: '南投縣', code: '10008' },
  '雲林': { city: '雲林縣', code: '10009' },
  '雲林縣': { city: '雲林縣', code: '10009' },
  '嘉義': { city: '嘉義縣', code: '10010' },
  '嘉義市': { city: '嘉義市', code: '10020' },
  '嘉義縣': { city: '嘉義縣', code: '10010' },
  '台南': { city: '臺南市', code: '67' },
  '臺南': { city: '臺南市', code: '67' },
  '台南市': { city: '臺南市', code: '67' },
  '臺南市': { city: '臺南市', code: '67' },
  '高雄': { city: '高雄市', code: '64' },
  '高雄市': { city: '高雄市', code: '64' },
  '屏東': { city: '屏東縣', code: '10013' },
  '屏東縣': { city: '屏東縣', code: '10013' },
  '宜蘭': { city: '宜蘭縣', code: '10002' },
  '宜蘭縣': { city: '宜蘭縣', code: '10002' },
  '花蓮': { city: '花蓮縣', code: '10015' },
  '花蓮縣': { city: '花蓮縣', code: '10015' },
  '台東': { city: '臺東縣', code: '10014' },
  '臺東': { city: '臺東縣', code: '10014' },
  '台東縣': { city: '臺東縣', code: '10014' },
  '臺東縣': { city: '臺東縣', code: '10014' },
  '澎湖': { city: '澎湖縣', code: '10016' },
  '澎湖縣': { city: '澎湖縣', code: '10016' },
  '金門': { city: '金門縣', code: '09020' },
  '金門縣': { city: '金門縣', code: '09020' },
  '連江': { city: '連江縣', code: '09007' },
  '連江縣': { city: '連江縣', code: '09007' },
  '馬祖': { city: '連江縣', code: '09007' }
};

// 使用中央氣象署API取得天氣資料
async function getCWAWeatherData(location) {
  try {
    // 檢查用戶輸入的地點是否在對應表中
    const locationInfo = locationMap[location];
    if (!locationInfo) {
      return { error: `無法找到「${location}」的天氣資料，請輸入正確的縣市名稱。` };
    }

    // 1. 取得天氣預報資料
    const forecastURL = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${process.env.WEATHER_API_KEY}&locationName=${encodeURIComponent(locationInfo.city)}`;
    const forecastResponse = await axios.get(forecastURL);
    const forecastData = forecastResponse.data;

    if (!forecastData.success || !forecastData.records || !forecastData.records.location || forecastData.records.location.length === 0) {
      return { error: `無法取得「${location}」的天氣預報資料。` };
    }

    const locationData = forecastData.records.location[0];
    const weatherElements = locationData.weatherElement;

    // 2. 取得觀測站資料（如果有需要實時溫度等資料）
    let observationData = null;
    try {
      const observationURL = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${process.env.WEATHER_API_KEY}&locationName=${encodeURIComponent(locationInfo.city)}`;
      const observationResponse = await axios.get(observationURL);
      if (observationResponse.data.success && observationResponse.data.records && observationResponse.data.records.location && observationResponse.data.records.location.length > 0) {
        observationData = observationResponse.data.records.location[0];
      }
    } catch (observationErr) {
      console.error('無法取得觀測站資料', observationErr);
      // 繼續處理，因為即使沒有觀測站數據，仍可以使用預報數據
    }

    // 從API回應中提取所需數據
    const wx = weatherElements.find(item => item.elementName === 'Wx'); // 天氣現象
    const pop = weatherElements.find(item => item.elementName === 'PoP'); // 降雨機率
    const minT = weatherElements.find(item => item.elementName === 'MinT'); // 最低溫度
    const maxT = weatherElements.find(item => item.elementName === 'MaxT'); // 最高溫度
    const ci = weatherElements.find(item => item.elementName === 'CI'); // 舒適度

    // 用於取得當前時間區間的索引（0：今天白天，1：今天晚上，2：明天白天）
    const currentTime = new Date();
    const hour = currentTime.getHours();
    const timeIndex = (hour >= 6 && hour < 18) ? 0 : 1;

    // 獲取天氣圖示代碼
    const weatherDescription = wx.time[timeIndex].parameter.parameterName;
    const weatherCode = wx.time[timeIndex].parameter.parameterValue;
    
    // 獲取目前溫度（如果有觀測資料）
    let currentTemp = null;
    if (observationData && observationData.weatherElement) {
      const tempElement = observationData.weatherElement.find(item => item.elementName === 'TEMP');
      if (tempElement) {
        currentTemp = tempElement.elementValue;
      }
    }

    // 如果沒有實時溫度，使用預報的溫度範圍取中間值
    if (currentTemp === null) {
      const minTemp = parseInt(minT.time[timeIndex].parameter.parameterName);
      const maxTemp = parseInt(maxT.time[timeIndex].parameter.parameterName);
      currentTemp = Math.round((minTemp + maxTemp) / 2);
    }

    // 返回整理後的天氣資料
    return {
      cityName: locationInfo.city,
      description: weatherDescription,
      weatherCode: weatherCode,
      temp: currentTemp,
      minTemp: parseInt(minT.time[timeIndex].parameter.parameterName),
      maxTemp: parseInt(maxT.time[timeIndex].parameter.parameterName),
      rainProb: pop.time[timeIndex].parameter.parameterName,
      comfort: ci.time[timeIndex].parameter.parameterName,
      observationTime: observationData ? observationData.time.obsTime : null
    };
  } catch (err) {
    console.error('取得天氣資料錯誤', err);
    return { error: '查詢天氣失敗，請稍後再試。' };
  }
}

// 根據中央氣象署的天氣代碼，獲取對應的圖標URL
function getWeatherIconUrl(weatherCode) {
  // 簡單映射常見的天氣代碼到圖標
  // 這裡使用的是自訂邏輯，您可以根據需要調整圖標
  const iconMap = {
    // 晴天
    '1': 'https://cdn-icons-png.flaticon.com/512/979/979585.png',
    // 晴時多雲
    '2': 'https://cdn-icons-png.flaticon.com/512/1779/1779807.png',
    '3': 'https://cdn-icons-png.flaticon.com/512/1779/1779807.png',
    // 多雲時晴
    '4': 'https://cdn-icons-png.flaticon.com/512/1146/1146869.png',
    '5': 'https://cdn-icons-png.flaticon.com/512/1146/1146869.png',
    // 多雲
    '6': 'https://cdn-icons-png.flaticon.com/512/414/414927.png',
    '7': 'https://cdn-icons-png.flaticon.com/512/414/414927.png',
    // 多雲時陰
    '8': 'https://cdn-icons-png.flaticon.com/512/1779/1779827.png',
    '9': 'https://cdn-icons-png.flaticon.com/512/1779/1779827.png',
    // 陰天
    '10': 'https://cdn-icons-png.flaticon.com/512/1779/1779827.png',
    '11': 'https://cdn-icons-png.flaticon.com/512/1779/1779827.png',
    // 短暫陣雨
    '12': 'https://cdn-icons-png.flaticon.com/512/3222/3222800.png',
    '13': 'https://cdn-icons-png.flaticon.com/512/3222/3222800.png',
    '14': 'https://cdn-icons-png.flaticon.com/512/3222/3222800.png',
    // 短暫雨
    '15': 'https://cdn-icons-png.flaticon.com/512/3222/3222800.png',
    '16': 'https://cdn-icons-png.flaticon.com/512/3222/3222800.png',
    '17': 'https://cdn-icons-png.flaticon.com/512/3222/3222800.png',
    // 雨天
    '18': 'https://cdn-icons-png.flaticon.com/512/1146/1146858.png',
    '19': 'https://cdn-icons-png.flaticon.com/512/1146/1146858.png',
    '20': 'https://cdn-icons-png.flaticon.com/512/1146/1146858.png',
    '21': 'https://cdn-icons-png.flaticon.com/512/1146/1146858.png',
    // 雷雨
    '22': 'https://cdn-icons-png.flaticon.com/512/1779/1779859.png',
    '23': 'https://cdn-icons-png.flaticon.com/512/1779/1779859.png',
    '24': 'https://cdn-icons-png.flaticon.com/512/1779/1779859.png',
    // 下雪
    '25': 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
    '26': 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
    '27': 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
    '28': 'https://cdn-icons-png.flaticon.com/512/642/642000.png',
  };

  return iconMap[weatherCode] || 'https://cdn-icons-png.flaticon.com/512/1163/1163661.png'; // 默認圖標
}

function createWeatherFlexMessage(data) {
  const iconUrl = getWeatherIconUrl(data.weatherCode);
  
  return {
    type: 'flex',
    altText: `${data.cityName} 天氣資訊`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: `${data.cityName} 天氣預報`,
            weight: 'bold',
            size: 'xl',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#0B5ED7'
      },
      hero: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'image',
            url: iconUrl,
            size: 'lg',
            aspectMode: 'fit',
            aspectRatio: '1:1',
            gravity: 'center'
          },
          {
            type: 'text',
            text: `${data.temp}°C`,
            weight: 'bold',
            size: '3xl',
            align: 'center'
          },
          {
            type: 'text',
            text: data.description,
            align: 'center',
            size: 'lg'
          }
        ]
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '溫度範圍',
                flex: 1,
                size: 'sm',
                color: '#aaaaaa'
              },
              {
                type: 'text',
                text: `${data.minTemp}°C ~ ${data.maxTemp}°C`,
                flex: 1,
                size: 'sm',
                align: 'end'
              }
            ]
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '降雨機率',
                flex: 1,
                size: 'sm',
                color: '#aaaaaa'
              },
              {
                type: 'text',
                text: `${data.rainProb}%`,
                flex: 1,
                size: 'sm',
                align: 'end'
              }
            ],
            margin: 'md'
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '舒適度',
                flex: 1,
                size: 'sm',
                color: '#aaaaaa'
              },
              {
                type: 'text',
                text: data.comfort,
                flex: 1,
                size: 'sm',
                align: 'end',
                wrap: true
              }
            ],
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '資料來源: 中央氣象署',
            size: 'xs',
            color: '#aaaaaa',
            align: 'center'
          }
        ]
      }
    }
  };
}

async function getMovieData(title) {
  try {
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&language=zh-TW&query=${encodeURIComponent(title)}`;
    const { data } = await axios.get(url);
    if (!data.results.length) return { error: '找不到相關電影。' };
    
    const movie = data.results[0];
    return {
      title: movie.title,
      originalTitle: movie.original_title,
      releaseDate: movie.release_date,
      overview: movie.overview || '無簡介',
      rating: movie.vote_average,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    };
  } catch (err) {
    console.error(err);
    return { error: '查詢電影失敗。' };
  }
}

function createMovieFlexMessage(movie) {
  return {
    type: 'flex',
    altText: `電影資訊: ${movie.title}`,
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: movie.poster || 'https://via.placeholder.com/500x750?text=No+Image',
        size: 'full',
        aspectRatio: '2:3',
        aspectMode: 'cover'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: movie.title,
            weight: 'bold',
            size: 'xl',
            wrap: true
          },
          {
            type: 'text',
            text: movie.originalTitle,
            size: 'md',
            color: '#888888',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '上映日期',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: movie.releaseDate,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5
                  }
                ]
              },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  {
                    type: 'text',
                    text: '評分',
                    color: '#aaaaaa',
                    size: 'sm',
                    flex: 2
                  },
                  {
                    type: 'text',
                    text: `${movie.rating} / 10`,
                    wrap: true,
                    color: '#666666',
                    size: 'sm',
                    flex: 5
                  }
                ],
                margin: 'sm'
              }
            ]
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            contents: [
              {
                type: 'text',
                text: '簡介',
                weight: 'bold',
                size: 'md'
              },
              {
                type: 'text',
                text: movie.overview,
                margin: 'sm',
                wrap: true,
                size: 'sm',
                color: '#666666'
              }
            ]
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '資料來源: TMDB',
            size: 'xs',
            color: '#aaaaaa',
            align: 'center'
          }
        ]
      }
    }
  };
}

async function askGemini(text) {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const headers = { 'Content-Type': 'application/json' };
    const payload = {
      contents: [
        {
          parts: [
            { text: text }
          ]
        }
      ]
    };
    const { data } = await axios.post(endpoint, payload, { headers });
    const resp = data.candidates && data.candidates.length > 0
      ? data.candidates[0].content.parts.map(p => p.text).join('\n')
      : '沒有收到回應';
    return resp;
  } catch (err) {
    console.error('Gemini API error:', err.response?.data || err.message);
    return '無法連接到 Gemini API。';
  }
}

// 為了支援Vercel serverless函數，需要匯出app
const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`LINE Bot running on port ${port}`);
  });
}

// 匯出Express應用程式給Vercel
module.exports = app; 