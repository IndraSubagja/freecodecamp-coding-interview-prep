const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  description: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Request' }],
});

module.exports = mongoose.model('Book', bookSchema);
