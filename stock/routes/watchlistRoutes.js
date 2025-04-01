
import express from 'express';
import passport from 'passport';
import { getWatchlist, addToWatchlist } from '../controller/watchlistController.js';

const router = express.Router();

router.get(
  '/watch',
  passport.authenticate('jwt', { session: false }),
  getWatchlist 
);

router.post(
  '/watchlist',
  passport.authenticate('jwt', { session: false }),
  addToWatchlist 
);

export default router;
