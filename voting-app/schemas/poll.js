const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  question: { type: String, required: true },
  options: [
    {
      value: { type: String, required: true },
      total: { type: Number, default: 0 },
    },
  ],
});

module.exports = mongoose.model('Poll', pollSchema);
