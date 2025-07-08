const mongoose = require('mongoose');

const checkinSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    energy: {
      type: Number,
      required: true,
    },
    clarity: {
      type: Number,
      required: true,
    },
    emotion: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Checkin', checkinSchema);
