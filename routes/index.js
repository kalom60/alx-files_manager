import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const router = express.Router();

// route to AppContoller
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// route to UsersController
router.post('/users', UsersController.postNew);

export default router;
