import express from 'express';
import { register,login ,getProfile} from '../controller/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', getProfile); 

export default router;
