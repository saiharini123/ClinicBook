const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['booking', 'token_update', 'cancellation', 'general', 'payment'],
      default: 'booking'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
