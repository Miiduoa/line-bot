require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const webhookHandler = require('./api/webhook');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('LINE Bot Server is running!');
});

app.post('/api/webhook', async (req, res) => {
  await webhookHandler(req, res);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 