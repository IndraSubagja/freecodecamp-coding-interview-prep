const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config({ path: process.cwd() + '/.env' });

const apiRoutes = require('./routes/api');
const pageRoutes = require('./routes/page');

const app = express();

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.redirect('/books');
});

mongoose.connect(process.env.MONGO_URI);

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'Connection error'));
connection.once('open', () => console.log('MongoDB database connected successfully'));

apiRoutes(app);
pageRoutes(app);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
