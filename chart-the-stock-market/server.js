const axios = require('axios');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
require('dotenv').config();

let symbols = [];
let datasets = [];

app.use('/public', express.static(process.cwd() + '/public'));

const getStock = async (symbol) => {
  const { data } = await axios.get('https://www.alphavantage.co/query', {
    params: {
      function: 'TIME_SERIES_DAILY',
      symbol,
      apikey: process.env.API_KEY,
    },
  });

  if (!data['Error Message']) {
    datasets.push({
      symbol: data['Meta Data']['2. Symbol'],
      data: [
        ...Object.entries(data['Time Series (Daily)']).map((entry) => [
          new Date(entry[0]).getTime(),
          parseFloat(entry[1]['4. close']),
        ]),
      ],
    });

    return data;
  }
};

app.get('/', async (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

io.on('connection', async (socket) => {
  socket.emit('chart', symbols, datasets);

  socket.on('getStock', async (symbol) => {
    if (!symbols.find((sym) => sym === symbol)) {
      const data = await getStock(symbol, false);

      if (data) {
        symbols.push(symbol);
        io.emit('chart', symbols, datasets);
      }
    }
  });
  socket.on('removeStock', async (symbol) => {
    datasets = datasets.filter((dataset) => dataset.symbol !== symbol);
    symbols = symbols.filter((sym) => sym !== symbol);
    io.emit('chart', symbols, datasets);
  });
});

server.listen(8000, () => console.log('Server running on port 8000'));
