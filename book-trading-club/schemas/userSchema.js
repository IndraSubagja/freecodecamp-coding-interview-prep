const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
  fullName: { type: String },
  city: { type: String },
  state: { type: String },
  address: { type: String },
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
  requests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Request' }],
  incomingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Request' }],
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.methods.comparePassword = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

module.exports = mongoose.model('User', userSchema);
