import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversationId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  content: { type: String, required: true },
  contentType: { type: String, enum: ['text', 'image', 'location'], default: 'text' },
  isEncrypted: { type: Boolean, default: true },
  expiresAt: { type: Date, index: { expireAfterSeconds: 0 } },
  readBy: [{ userId: String, readAt: Date }],
  createdAt: { type: Date, default: Date.now, index: true },
});

messageSchema.index({ conversationId: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);
