const axios = require('axios');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
require('dotenv').config();

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', (req, res) => res.sendFile(process.cwd() + '/views/index.html'));

let symbols = [];
let datasets = [];

io.on('connection', (socket) => {
  socket.emit('chart', symbols, datasets);

  socket.on('getStock', async (symbol) => {
    if (!symbols.find((sym) => sym === symbol)) {
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

        symbols.push(symbol);
        io.emit('chart', symbols, datasets);
      }
    }
  });
  socket.on('removeStock', (symbol) => {
    datasets = datasets.filter((dataset) => dataset.symbol !== symbol);
    symbols = symbols.filter((sym) => sym !== symbol);
    io.emit('chart', symbols, datasets);
  });
});

server.listen(8000, () => console.log('Server running on port 8000'));
