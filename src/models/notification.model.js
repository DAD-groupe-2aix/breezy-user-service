const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipientId: { type: Number, required: true },
  senderId:    { type: Number, required: true },
  type:        { type: String, enum: ['like', 'follow'], required: true },
  postId:      { type: String, default: null },
  read:        { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
