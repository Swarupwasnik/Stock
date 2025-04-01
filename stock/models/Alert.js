import mongoose from 'mongoose';

const AlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: String,
  targetPrice: Number,
  condition: { type: String, enum: ['above', 'below'] },
  triggered: { type: Boolean, default: false }
});

export default mongoose.model('Alert', AlertSchema);
