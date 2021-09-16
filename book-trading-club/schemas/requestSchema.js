const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  takeBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  giveBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

requestSchema.pre('validate', function (next) {
  if (!this.takeBooks.length || !this.giveBooks.length)
    throw { message: 'Request must include at least one book to give and one book to take' };
  next();
});

module.exports = mongoose.model('Request', requestSchema);
