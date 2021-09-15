const mongoose = require('mongoose');

const tradeSchema = mongoose.Schema({
  takeBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  giveBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
});

tradeSchema.pre('validate', function (next) {
  if (!this.takeBooks.length || !this.giveBooks.length)
    throw { message: 'Request must include at least one book to give and one book to take' };
  if (this.takeBooks.length !== this.giveBooks.length)
    throw { message: 'The number of books given must equal the number taken' };
  next();
});

module.exports = mongoose.model('Trade', tradeSchema);
