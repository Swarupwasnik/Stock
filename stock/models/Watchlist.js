import mongoose from 'mongoose';

const WatchlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stocks: [{
    symbol: String,
    name: String
  }]
});

export default mongoose.model('Watchlist', WatchlistSchema);
