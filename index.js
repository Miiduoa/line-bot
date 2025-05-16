// index.js
require('dotenv').config();
const express = require('express');
const webhook = require('./api/webhook');

const app = express();
app.use(express.json());

app.post('/api/webhook', async (req, res) => {
  await webhook(req, res);
});

app.get('/', (req, res) => {
  res.send('LINE Bot API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 