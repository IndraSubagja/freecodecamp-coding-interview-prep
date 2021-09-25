const User = require('../schemas/user');
const Poll = require('../schemas/poll');

module.exports = function (app) {
  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await User.findOne({ username });

      if (!user) return res.status(401).json({ message: 'Incorrect username or password provided' });

      user.comparePassword(password, (error, isMatch) => {
        if (error || !isMatch) return res.status(401).json({ message: 'Incorrect username or password provided' });

        res.cookie('userId', user._id, {
          httpOnly: true,
          secure: true,
          sameSite: true,
        });
        res.json(user);
      });
    } catch (error) {
      res.status(400);
    }
  });

  app.post('/api/signup', async (req, res) => {
    const { fullName, username, password } = req.body;

    try {
      const existedUser = await User.findOne({ username });

      if (existedUser) return res.status(401).json({ message: 'Username already taken' });

      const user = new User({ fullName, username, password });
      await user.save();

      res.cookie('userId', user._id, {
        httpOnly: true,
        secure: true,
        sameSite: true,
      });
      res.json(user);
    } catch (error) {
      res.status(400);
    }
  });

  app.get('/api/logout', (req, res) => {
    res.clearCookie('userId');
    res.json({ message: 'Logout successfully' });
  });

  app.route('/api/user').get(async (req, res) => {
    try {
      if (req.cookies.userId) {
        const user = await User.findById(req.cookies.userId);
        res.json(user);
      } else {
        res.json('Public');
      }
    } catch (error) {
      res.status(400);
    }
  });

  app
    .route('/api/poll')
    .post(async (req, res) => {
      const { userId, question, options } = req.body;

      try {
        const poll = new Poll({ user: userId, question, options });
        const user = await User.findByIdAndUpdate(userId, { $push: { polls: poll._id } }, { new: true });
        await poll.save();

        res.json(user);
      } catch (error) {
        res.status(400);
      }
    })
    .get(async (req, res) => {
      const { userId, pollId } = req.query;

      try {
        const polls = await Poll.find(userId ? { user: userId } : pollId ? { _id: pollId } : {}).populate({
          path: 'user',
          model: 'User',
          select: 'username',
        });
        res.json(polls);
      } catch (error) {
        res.status(400);
      }
    })
    .put(async (req, res) => {
      const { pollId, value } = req.body;

      try {
        const poll = await Poll.findById(pollId);
        const index = poll.options.findIndex((option) => option.value === value);

        if (index >= 0) {
          poll.options[index].total += 1;
        } else {
          poll.options.push({ value, total: 1 });
        }

        await poll.save();

        res.json({ message: 'Vote submitted successfully' });
      } catch (error) {
        console.log(error);
        res.status(400);
      }
    })
    .delete(async (req, res) => {
      const { pollId, userId } = req.body;

      try {
        const user = await User.findByIdAndUpdate(userId, { $pull: { polls: pollId } });
        await Poll.findByIdAndDelete(pollId);

        res.json(user);
      } catch (error) {
        res.status(400);
      }
    });
};
