
import express from 'express';
import passport from 'passport';
import {getAlerts,createAlert,deleteAlert} from "../controller/alertController.js"
const router = express.Router();


router.use(passport.authenticate('jwt', { session: false }));


router.get('/alert', getAlerts);
router.post('/alert-post', createAlert);
router.delete('delete/:id', deleteAlert);

export default router;