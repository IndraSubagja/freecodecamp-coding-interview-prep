const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(cookieParser());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', (req, res) => res.sendFile(process.cwd() + '/views/index.html'));

mongoose.connect(process.env.MONGO_URI);
const connection = mongoose.connection;
connection.on('error', () => console.error.bind(console, 'Connection error'));
connection.once('open', () => console.log('MongoDB Database connected successfully'));

const picSchema = new mongoose.Schema({
  url: { type: String, required: true },
  description: { type: String },
  stars: [{ type: Number }],
  avatar: { type: String, required: true },
  uploader: { type: String, required: true },
  userId: { type: Number, required: true },
});
const Pic = mongoose.model('Pic', picSchema);

app.get('/client-id', (req, res) => {
  res.json({ CLIENT_ID: process.env.CLIENT_ID });
});

app.get('/login', async (req, res) => {
  const { code } = req.query;

  try {
    const { data } = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        code,
        redirect_uri: 'http://localhost:8000',
      },
      {
        headers: {
          accept: 'application/json',
        },
      }
    );

    res.cookie('token', data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: true,
    });

    res.redirect('http://localhost:8000');
  } catch (error) {
    res.status(400).send('An error occured');
  }
});

app.get('/user', async (req, res) => {
  try {
    if (req.cookies.token) {
      const { data } = await axios.get('https://api.github.com/user', {
        headers: {
          authorization: `Bearer ${req.cookies.token}`,
        },
      });

      res.json({ user: { login: data.login, avatar_url: data.avatar_url, id: data.id } });
    } else {
      res.json({ message: 'Unauthenticated user' });
    }
  } catch (error) {
    res.status(401).json({ message: 'An error occured' });
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('token', { domain: 'localhost', path: '/' });
  res.json({ message: 'Logout successfully' });
});

app
  .route('/pic')
  .post(async (req, res) => {
    const { url, description, uploader, avatar, userId } = req.body;

    try {
      const newPic = new Pic({ url, description, uploader, avatar, userId });
      await newPic.save();
      res.json({ message: 'New picture uploaded' });
    } catch (error) {
      res.status(400).json({ message: 'An error occured' });
    }
  })

  .get(async (req, res) => {
    const { userId } = req.query;

    try {
      const pics = await Pic.find(userId ? { userId } : {});
      res.json(pics);
    } catch (error) {
      res.status(400).json({ message: 'An error occured' });
    }
  })

  .put(async (req, res) => {
    const { picId, userId } = req.body;

    try {
      const pic = await Pic.findByIdAndUpdate(picId);
      pic.stars.indexOf(userId) >= 0 ? pic.stars.splice(pic.stars.indexOf(userId), 1) : pic.stars.push(userId);
      await pic.save();
      res.json({ message: 'Updated successfully' });
    } catch (error) {
      res.status(400).json({ message: 'An error occured' });
    }
  })

  .delete(async (req, res) => {
    const { picId } = req.body;

    try {
      await Pic.findByIdAndDelete(picId);
      res.json({ message: 'Deleted successfully' });
    } catch (error) {
      res.status(400).json({ message: 'An error occured' });
    }
  });

const PORT = process.env.PORT || 8000;
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
