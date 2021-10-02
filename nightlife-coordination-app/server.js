require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const helmet = require('helmet');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(helmet({ contentSecurityPolicy: false }));
app.use('/public', express.static(process.cwd() + '/public'));
app.use('/script', express.static(process.cwd() + '/node_modules/axios/dist'));

mongoose.connect(process.env.MONGO_URI);
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'Connection error'));
connection.once('open', () => console.log('MongoDB Database connected successfully'));

const destinationSchema = mongoose.Schema({
  userId: { type: Number, required: true },
  id: { type: String, required: true },
  name: { type: String, required: true },
  rating: { type: Number },
  review_counts: { type: Number },
  display_phone: { type: String },
  location: { display_address: [{ type: String }] },
  image_url: { type: String },
  url: { type: String },
  is_closed: { type: Boolean },
});
const Destination = mongoose.model('Destination', destinationSchema);

app.get('/', (req, res) => res.sendFile(process.cwd() + '/views/index.html'));
app.get('/api/client-id', (req, res) => res.send({ clientId: process.env.CLIENT_ID }));

app.get('/api/login', async (req, res) => {
  const { code } = req.query;

  try {
    const {
      data: { access_token },
    } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        code,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: 'http://localhost:8000',
      },
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

    res.cookie('token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: true,
    });

    res.redirect('/');
  } catch (error) {
    res.status(400);
  }
});

app.get('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.send('Public');
});

app.get('/api/user', async (req, res) => {
  try {
    if (req.cookies.token) {
      const { data } = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${req.cookies.token}` },
      });

      res.json(data);
    } else {
      res.send('Public');
    }
  } catch (error) {
    res.status(400);
  }
});

app.get('/api/place', async (req, res) => {
  try {
    const { data } = await axios.get('https://api.yelp.com/v3/businesses/search', {
      params: { ...req.query, radius: 20000, term: 'nightlife' },
      headers: {
        Authorization: `Bearer ${process.env.API_KEY}`,
      },
    });

    res.json(data);
  } catch (error) {
    res.json([]);
  }
});

app
  .route('/api/destination')
  .post(async (req, res) => {
    try {
      const newDestination = new Destination({ ...req.body });
      await newDestination.save();

      res.json({ message: 'Destination added', destination: newDestination });
    } catch (error) {
      res.status(400);
    }
  })
  .get(async (req, res) => {
    const { userId } = req.query;

    try {
      const destination = await Destination.find({ userId });
      res.json(destination);
    } catch (error) {
      res.status(400);
    }
  })
  .delete(async (req, res) => {
    const { id } = req.body;

    try {
      await Destination.findByIdAndDelete(id);
      res.json({ message: 'Destination removed' });
    } catch (error) {
      res.status(400);
    }
  });

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
