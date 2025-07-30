import express from 'express';
import { 
  getAllTags, 
  createTag, 
  deleteTag, 
  getImageTags, 
  addTagToImage, 
  removeTagFromImage,
  getPopularTags
} from '../controllers/tagsController';

const router = express.Router();

// GET /api/tags - Get all tags
router.get('/', getAllTags);

// GET /api/tags/popular - Get most used tags with optional search
router.get('/popular', getPopularTags);

// POST /api/tags - Create a new tag
router.post('/', createTag);

// DELETE /api/tags/:id - Delete a tag
router.delete('/:id', deleteTag);

// GET /api/tags/image/:uuid - Get tags for a specific image
router.get('/image/:uuid', getImageTags);

// POST /api/tags/:tagId/images/:uuid - Add tag to image
router.post('/:tagId/images/:uuid', addTagToImage);

// DELETE /api/tags/:tagId/images/:uuid - Remove tag from image
router.delete('/:tagId/images/:uuid', removeTagFromImage);

export default router; 