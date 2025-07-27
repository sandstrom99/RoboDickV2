import { Router } from 'express';
import upload from '../middlewares/upload';
import {
  listImages,
  randomImage,
  uploadImage
} from '../controllers/imagesController';

const router = Router();

router.get('/', listImages);
router.get('/random', randomImage);
router.post('/', upload.single('image'), uploadImage);

export default router;
