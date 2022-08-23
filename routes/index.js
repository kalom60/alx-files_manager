import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

// routes to AppContoller
router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

// routes to UsersController
router.post('/users', UsersController.postNew);
router.get('/users/me', UsersController.getMe);

// routes to AuthController
router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

// routes to FileController
router.post('/files', FilesController.postUpload);
router.get('/files/:id', FilesController.getShow);
router.get('/files', FilesController.getIndex);
router.put('/files/:id/publish', FilesController.putPublish);
router.put('/files/:id/unpublish', FilesController.putUnpublish);
router.get('/files/:id/data', FilesController.getFile);

export default router;
