import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { uploadLimiter } from '../middleware/security';
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

// GET /api/images/random?count=
router.get('/random', randomImage);

// GET /api/images/count
router.get('/count', getImageCount);

// GET /api/images/hashes (MUST come before /:uuid)
router.get('/hashes', getHashes);

// GET /api/images/:uuid (parameterized routes go last)
router.get('/:uuid', getImageById);

// upload
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (_req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only one file at a time
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// POST /api/images (with upload rate limiting)
router.post('/', uploadLimiter, upload.single('image'), uploadImage);

// DELETE /api/images/:uuid
router.delete('/:uuid', deleteImage);

export default router;
