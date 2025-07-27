
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  listImages,
  randomImage,
  uploadImage,
  getHashes
} from '../controllers/imagesController';






const router = Router();

// GET /api/images => list
router.get('/', listImages);
// GET /api/images/random => random
router.get('/random', randomImage);
// GET /api/images/hashes => return stored hashes
router.get('/hashes', getHashes);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage });

// POST /api/images => accepts multipart form: field 'image' and optional 'hash'
router.post('/', upload.single('image'), uploadImage);

export default router;

export default router;
