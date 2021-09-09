const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config({ path: process.cwd() + '/.env' });

const apiRoutes = require('./routes/api');

const app = express();

// Set up middleware
app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({ origin: '*' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Home route
app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Connect to database
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'Connection error'));
connection.once('open', () => {
  console.log('MongoDB database connected successfully');
});

// Create model
const Schema = mongoose.Schema;
const urlSchema = new Schema({ url: { type: String, required: true } }, { timestamps: true });
const Url = mongoose.model('Url', urlSchema);

apiRoutes(app, Url);

// Set up server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
