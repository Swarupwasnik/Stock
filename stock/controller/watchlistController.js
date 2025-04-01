import Watchlist from '../models/Watchlist.js';
import { getStockPrice } from '../services/stockService.js'; 
export const getWatchlist = async (req, res) => {
  try {
    const watchlist = await Watchlist.findOne({ user: req.user.id })
      .populate('user', ['username', 'email']);

    if (!watchlist) {
      return res.status(200).json({ stocks: [] });
    }

    
    const stocksWithPrices = await Promise.all(
      watchlist.stocks.map(async (stock) => {
        try {
          const price = await getStockPrice(stock.symbol);
          return { ...stock.toObject(), price }; 
        } catch (error) {
          console.error(`Failed to fetch price for ${stock.symbol}:`, error.message);
          return { ...stock.toObject(), price: null }; 
        }
      })
    );

    res.status(200).json(stocksWithPrices); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addToWatchlist = async (req, res) => {
  try {
    const { symbol, name } = req.body;

    console.log(`Validating stock symbol: ${symbol}`);

   
    try {
      const price = await getStockPrice(symbol);
      if (price === null) {
        return res.status(400).json({ message: `Invalid stock symbol: ${symbol}` });
      }
    } catch (error) {
      console.error(`Error validating stock symbol (${symbol}):`, error.message);
      return res.status(400).json({ message: `Invalid stock symbol: ${symbol}` });
    }

    let watchlist = await Watchlist.findOne({ user: req.user.id });

    if (!watchlist) {
      watchlist = new Watchlist({
        user: req.user.id,
        stocks: [{ symbol, name }]
      });
    } else {
      const exists = watchlist.stocks.some((stock) => stock.symbol === symbol);
      if (exists) {
        return res.status(400).json({ message: 'Stock already in watchlist' });
      }

      watchlist.stocks.push({ symbol, name });
    }

    await watchlist.save();
    res.status(201).json(watchlist.stocks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


