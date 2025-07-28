import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  listImages,
  randomImage,
  getHashes,
  uploadImage,
  deleteImage,
  getImageCount,
  getImageById
} from '../controllers/imagesController';

const router = Router();


// GET /api/images?page=&limit=
router.get('/', listImages);
// GET /api/images/count
router.get('/count', getImageCount);
// GET /api/images/random
router.get('/random', randomImage);
// GET /api/images/hashes
router.get('/hashes', getHashes);
// GET /api/images/:uuid
router.get('/:uuid', getImageById);

// upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });
router.post('/', upload.single('image'), uploadImage);
// delete by uuid (filename)
router.delete('/:uuid', deleteImage);

export default router;
