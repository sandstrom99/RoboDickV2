import { Request, Response, NextFunction } from 'express';
import dbService from '../services/database';

// GET /api/tags
export async function getAllTags(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tags = await dbService.getAllTags();
    res.json(tags);
  } catch (err) {
    next(err as Error);
  }
}

// GET /api/tags/popular
export async function getPopularTags(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const search = req.query.search as string || '';
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    
    const tags = await dbService.getPopularTags(search, limit);
    res.json(tags);
  } catch (err) {
    next(err as Error);
  }
}

// POST /api/tags
export async function createTag(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Generate random color if not provided
    const tagColor = color || generateRandomColor();

    // Validate color format (should be hex)
    if (!/^#[0-9A-Fa-f]{6}$/.test(tagColor)) {
      return res.status(400).json({ error: 'Color must be in hex format (#RRGGBB)' });
    }

    const tag = await dbService.createTag({ name, color: tagColor });
    res.status(201).json(tag);
  } catch (err) {
    next(err as Error);
  }
}

// Helper function to generate random hex color
function generateRandomColor(): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#A569BD', '#D7BDE2',
    '#5DADE2', '#58D68D', '#F7DC6F', '#EC7063', '#AF7AC5'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// DELETE /api/tags/:id
export async function deleteTag(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tagId = parseInt(req.params.id);
    
    if (isNaN(tagId)) {
      return res.status(400).json({ error: 'Invalid tag ID' });
    }

    const deleted = await dbService.deleteTag(tagId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.status(204).end();
  } catch (err) {
    next(err as Error);
  }
}

// GET /api/tags/image/:uuid
export async function getImageTags(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { uuid } = req.params;
    const tags = await dbService.getImageTags(uuid);
    res.json(tags);
  } catch (err) {
    next(err as Error);
  }
}

// POST /api/tags/:tagId/images/:uuid
export async function addTagToImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tagId = parseInt(req.params.tagId);
    const { uuid } = req.params;
    
    if (isNaN(tagId)) {
      return res.status(400).json({ error: 'Invalid tag ID' });
    }

    await dbService.addTagToImage(uuid, tagId);
    res.status(201).json({ message: 'Tag added to image' });
  } catch (err) {
    next(err as Error);
  }
}

// DELETE /api/tags/:tagId/images/:uuid
export async function removeTagFromImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tagId = parseInt(req.params.tagId);
    const { uuid } = req.params;
    
    if (isNaN(tagId)) {
      return res.status(400).json({ error: 'Invalid tag ID' });
    }

    await dbService.removeTagFromImage(uuid, tagId);
    res.status(204).end();
  } catch (err) {
    next(err as Error);
  }
} 