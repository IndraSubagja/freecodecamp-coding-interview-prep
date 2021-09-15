const User = require('../schemas/userSchema');
const Book = require('../schemas/bookSchema');
const Request = require('../schemas/requestSchema');
const Trade = require('../schemas/tradeSchema');

module.exports = function (app) {
  app.post('/api/register', async (req, res) => {
    const { username, password, fullName, city, state } = req.body;

    const existedUser = await User.findOne({ username });

    if (existedUser) return res.json({ success: false, message: 'User already exists' });

    try {
      const newUser = new User({ username, password, fullName, city, state });
      await newUser.save();

      res.json({ success: true, message: 'Account created', userId: newUser._id });
    } catch (error) {
      res.json({ success: false, message: 'An error occured' });
    }
  });

  app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
      const user = await User.findOne({ username });
      user.comparePassword(password, (err, isMatch) => {
        if (err || !isMatch) return res.json({ success: false, message: "Username and password didn't match" });

        res.json({ success: true, message: 'Login successfully', userId: user._id });
      });
    } catch (error) {
      res.json({ success: false, message: "Username and password didn't match" });
    }
  });

  app
    .route('/api/user')
    .get(async (req, res) => {
      const { userId } = req.query;

      try {
        if (userId) {
          const user = await User.findById(userId).populate('incomingRequests');
          res.json({ success: true, user });
        } else {
          const users = await User.find({});
          res.json({ success: true, users });
        }
      } catch (error) {
        res.json({ success: false, message: 'An error occured' });
      }
    })

    .put(async (req, res) => {
      const { username, fullName, city, state, address, userId } = req.body;

      const existedUser = await User.findOne({ username });

      if (existedUser) return res.json({ success: false, message: 'Username already taken' });

      try {
        await User.findByIdAndUpdate(userId, { username, fullName, city, state, address });
        res.json({ success: true, message: 'Profile updated successfully' });
      } catch (error) {
        res.json({ success: false, message: 'An error occured' });
      }
    });

  app
    .route('/api/book')
    .post(async (req, res) => {
      const { title, author, description, userId } = req.body;

      try {
        const newBook = await new Book({ title, author, description, user: userId }).populate('user');
        await User.findByIdAndUpdate(userId, { $push: { books: newBook } });
        await newBook.save();

        res.json({ success: true, message: 'Book created successfully', book: newBook });
      } catch (error) {
        res.json({ success: false, message: 'An error occured' });
      }
    })

    .get(async (req, res) => {
      const { userId } = req.query;

      try {
        const books = await Book.find(userId ? { user: userId } : {})
          .populate('user')
          .populate({
            path: 'requests',
            model: 'Request',
            select: 'user',
            populate: {
              path: 'user',
              model: 'User',
              select: 'username',
            },
          });

        res.json({ success: true, books });
      } catch (error) {
        res.json({ success: false, message: 'An error occured' });
      }
    })

    .delete(async (req, res) => {
      const { bookId, userId } = req.body;

      try {
        await Book.findByIdAndDelete(bookId);
        await User.findByIdAndUpdate(userId, { $pull: { books: bookId } });

        const bookRequests = await Request.find({
          $or: [{ takeBooks: { $in: [bookId] } }, { giveBooks: { $in: [bookId] } }],
        });

        await Promise.all(
          bookRequests.map(async (request) => {
            const updatedRequest = await Request.findByIdAndUpdate(
              request._id,
              { $pull: { takeBooks: bookId, giveBooks: bookId } },
              { new: true }
            ).populate({
              path: 'takeBooks',
              model: 'Book',
            });

            if (!updatedRequest.takeBooks.length || !updatedRequest.giveBooks.length) {
              await User.findByIdAndUpdate(updatedRequest.user, { $pull: { requests: updatedRequest._id } });
              await updatedRequest.delete();
            }

            await Promise.all(
              updatedRequest.takeBooks.map(async (book) => {
                await User.findByIdAndUpdate(book.user, { $pull: { incomingRequests: updatedRequest._id } });
                await Book.findByIdAndUpdate(book._id, { $pull: { requests: updatedRequest._id } });
              })
            );
            await Promise.all(
              updatedRequest.giveBooks.map(async (book) => {
                await Book.findByIdAndUpdate(book._id, { $pull: { requests: updatedRequest._id } });
              })
            );
          })
        );

        res.json({ success: true, message: 'Book deleted successfully' });
      } catch (error) {
        res.json({ success: false, message: 'An error occured' });
      }
    });

  app
    .route('/api/request')
    .post(async (req, res) => {
      const { takeBooks, giveBooks, userId } = req.body;

      try {
        const newRequest = await new Request({ takeBooks, giveBooks, user: userId }).populate('takeBooks');
        await newRequest.save();
        await User.findByIdAndUpdate(userId, { $push: { requests: newRequest } });

        await Promise.all(
          takeBooks.map(async (book) => {
            await User.findByIdAndUpdate(book.user._id, { $addToSet: { incomingRequests: newRequest } });
            await Book.findByIdAndUpdate(book._id, { $push: { requests: newRequest } });
          })
        );

        res.json({ success: true, message: 'Request created successfully' });
      } catch (error) {
        res.json({ success: false, message: error?.message || 'An error occured' });
      }
    })

    .get(async (req, res) => {
      const { bookId, mode, userId, requestId } = req.query;

      try {
        if (requestId) {
          const request = await Request.findById(requestId)
            .populate({
              path: 'takeBooks',
              model: 'Book',
              select: 'user title description author requests',
              populate: {
                path: 'user',
                model: 'User',
              },
            })
            .populate({
              path: 'giveBooks',
              model: 'Book',
              select: 'user title description author requests',
              populate: {
                path: 'user',
                model: 'User',
              },
            })
            .populate('user');

          res.json({ success: true, request });
        } else {
          let user;
          let book;

          if (mode === 'incoming') {
            user = await User.findById(userId);
          }

          if (bookId) {
            book = await Book.findById(bookId);
          }

          const requests = await Request.find(
            bookId
              ? { takeBooks: { $in: [bookId] } }
              : mode === 'incoming'
              ? { _id: { $in: [...user.incomingRequests] } }
              : {}
          )
            .populate({
              path: 'takeBooks',
              model: 'Book',
              select: 'user title description author requests',
              populate: {
                path: 'user',
                model: 'User',
                select: 'username',
              },
            })
            .populate({
              path: 'giveBooks',
              model: 'Book',
              select: 'user title description author requests',
            })
            .populate('user');

          res.json({ success: true, requests, book });
        }
      } catch (error) {
        res.json({ success: false, message: 'An error occured' });
      }
    })

    .delete(async (req, res) => {
      const { requestId, userId } = req.body;

      try {
        const request = await Request.findById(requestId).populate('takeBooks');
        await request.delete();
        await User.findByIdAndUpdate(userId, { $pull: { requests: requestId } });

        await Promise.all(
          request.takeBooks.map(async (book) => {
            await Book.findByIdAndUpdate(book._id, { $pull: { requests: requestId } });
            await User.findByIdAndUpdate(book.user, { $pull: { incomingRequests: requestId } });
          })
        );

        res.json({ success: true, message: 'Request cancelled successfully' });
      } catch (error) {
        res.json({ success: false, message: 'An error occured' });
      }
    });

  app
    .route('/api/trade')
    .post(async (req, res) => {
      const { giveBooks, takeBooks, requestId } = req.body;

      try {
        let acceptedUsers = [];

        const newTrade = new Trade({
          giveBooks: [...takeBooks],
          takeBooks: [...giveBooks],
        });
        await newTrade.save();

        await Promise.all(
          [...Array(giveBooks.length).keys()].map(async (index) => {
            await User.findByIdAndUpdate(giveBooks[index].user._id, { $push: { books: takeBooks[index]._id } });
            await User.findByIdAndUpdate(giveBooks[index].user._id, { $pull: { books: giveBooks[index]._id } });
            await User.findByIdAndUpdate(takeBooks[index].user._id, { $push: { books: giveBooks[index]._id } });
            await User.findByIdAndUpdate(takeBooks[index].user._id, { $pull: { books: takeBooks[index]._id } });

            const acceptedUser = await User.findById(takeBooks[index].user._id);

            if (!acceptedUsers.find((user) => user === acceptedUser._id.toString())) {
              acceptedUsers.push(acceptedUser._id.toString());
            }

            await Book.findByIdAndUpdate(giveBooks[index]._id, {
              user: takeBooks[index].user._id,
              $pull: { requests: requestId },
            });
            await Book.findByIdAndUpdate(takeBooks[index]._id, {
              user: giveBooks[index].user._id,
              $pull: { requests: requestId },
            });
          })
        );

        const relatedRequests = await Request.find({
          $or: [
            { takeBooks: { $in: [...takeBooks.map((book) => book._id)] } },
            { giveBooks: { $in: [...takeBooks.map((book) => book._id)] } },
            { takeBooks: { $in: [...giveBooks.map((book) => book._id)] } },
            { giveBooks: { $in: [...giveBooks.map((book) => book._id)] } },
          ],
        });

        await Promise.all(
          relatedRequests.map(async (request) => {
            const requestDoc = await Request.findById(request._id).populate('takeBooks giveBooks');

            const updatedRequest = await Request.findByIdAndUpdate(
              request._id,
              {
                $pull: {
                  takeBooks: { $in: [...takeBooks.map((book) => book._id), ...giveBooks.map((book) => book._id)] },
                  giveBooks: { $in: [...takeBooks.map((book) => book._id), ...giveBooks.map((book) => book._id)] },
                },
              },
              { new: true }
            ).populate('takeBooks');

            if (!updatedRequest.takeBooks.length || !updatedRequest.giveBooks.length) {
              await User.findByIdAndUpdate(updatedRequest.user, { $pull: { requests: updatedRequest._id } });
              await Promise.all(
                acceptedUsers.map(async (user) => {
                  await User.findByIdAndUpdate(user, { $pull: { incomingRequests: requestId } });
                })
              );
              await updatedRequest.delete();

              await Promise.all(
                requestDoc.giveBooks.map(async (book) => {
                  if ([...takeBooks, ...giveBooks].find((giveBook) => giveBook._id === book._id.toString())) {
                    await User.findByIdAndUpdate(book.user, { $pull: { incomingRequests: updatedRequest._id } });
                  }
                })
              );
              await Promise.all(
                requestDoc.takeBooks.map(async (book) => {
                  if ([...takeBooks, ...giveBooks].find((takeBook) => takeBook._id === book._id.toString())) {
                    await User.findByIdAndUpdate(book.user, { $pull: { incomingRequests: updatedRequest._id } });
                  }
                })
              );
            }

            await Promise.all(
              requestDoc.takeBooks.map(async (book) => {
                if ([...takeBooks, ...giveBooks].find((takeBook) => takeBook._id === book._id.toString()))
                  await Book.findByIdAndUpdate(book._id, { $pull: { requests: updatedRequest._id } });
              })
            );
            await Promise.all(
              requestDoc.giveBooks.map(async (book) => {
                if ([...takeBooks, ...giveBooks].find((giveBook) => giveBook._id === book._id.toString()))
                  await Book.findByIdAndUpdate(book._id, { $pull: { requests: updatedRequest._id } });
              })
            );
          })
        );

        res.json({ success: true, message: 'Trade successful' });
      } catch (error) {
        res.json({ success: false, message: error?.message || 'An error occured' });
      }
    })

    .get(async (req, res) => {
      try {
        const trades = await Trade.find({})
          .populate({
            path: 'giveBooks',
            model: 'Book',
            populate: {
              path: 'user',
              model: 'User',
            },
          })
          .populate({
            path: 'takeBooks',
            model: 'Book',
            populate: {
              path: 'user',
              model: 'User',
            },
          });

        res.json({ success: true, trades });
      } catch (error) {
        res.json({ success: 'An error occured' });
      }
    });
};
