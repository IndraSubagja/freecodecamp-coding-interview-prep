const stocks = document.querySelector('.stocks');
const chart = document.querySelector('.chart');
const form = document.querySelector('form');

const socket = io();

socket.on('chart', (symbols, datasets) => {
  Highcharts.stockChart('chart', {
    title: {
      text: 'Stock Price',
    },
    series: [
      ...datasets.map((dataset) => ({
        name: dataset.symbol,
        data: dataset.data,
        tooltip: {
          valueDecimals: 2,
        },
      })),
    ],
  });

  stocks.innerHTML = '';
  symbols.forEach((symbol) => {
    const button = document.createElement('button');
    button.innerText = symbol;

    button.addEventListener('click', () => {
      socket.emit('removeStock', symbol);
    });

    stocks.appendChild(button);
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();

  socket.emit('getStock', stock.value.toUpperCase());

  event.target.reset();
});
