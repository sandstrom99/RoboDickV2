import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import dbService, { MetadataRecord } from '../services/database';

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

// Helper function to calculate file hash (fallback for non-images)
async function calculateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}





// GET /api/images
export async function listImages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);
    const orderBy = req.query.orderBy as string || 'createdAt';
    const orderDirection = req.query.orderDirection as string || 'desc';
    const search = req.query.search as string || '';
    
    const offset = (page - 1) * limit;
    
    const { images: records, total } = await dbService.getImages({
      search,
      orderBy,
      orderDirection,
      limit,
      offset
    });
    
    // Format response to match current API
    const images = records.map(rec => ({
      uuid: rec.uuid,
      uploaderId: rec.uploaderId,
      uploaderName: rec.uploaderName,
      filename: rec.filename,
      url: rec.filename,
      createdAt: rec.createdAt,
      hash: rec.hash
    }));
    
    res.json({ total, page, images });
  } catch (err) {
    next(err as Error);
  }
}

// GET /api/images/count
export async function getImageCount(_req: Request, res: Response, next: NextFunction) {
  try {
    const count = await dbService.getImageCount();
    res.json({ count });
  } catch (err) {
    next(err as Error);
  }
}

// GET /api/images/:uuid
export async function getImageById(req: Request, res: Response, next: NextFunction) {
  try {
    const { uuid } = req.params;
    const record = await dbService.getImageByUuid(uuid);
    if (!record) return res.status(404).json({ error: 'Image not found' });
    res.json(record);
  } catch (err) {
    next(err as Error);
  }
}

// GET /api/images/random
export async function randomImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const count = Math.max(1, Math.min(parseInt(req.query.count as string) || 1, 9));
    const filenames = await dbService.getRandomImages(count);
    if (filenames.length === 0) {
      return res.status(404).json({ error: 'No images' });
    }
    // Construct URLs (assuming /images/ is the static path)
    const urls = filenames.map(filename => `/images/${filename}`);
    res.json({ urls });
  } catch (err) {
    next(err as Error);
  }
}

// GET /api/images/hashes (metadata list)
export async function getHashes(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const hashes = await dbService.getAllHashes();
    res.json(hashes);
  } catch (err) {
    next(err as Error);
  }
}

// POST /api/images
export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const uploaderId = req.body.uploaderId as string || 'unknown';
    const uploaderName = req.body.uploaderName as string || 'Unknown User';
    const filename = req.file.filename;
    const ext = path.extname(filename);
    const uuid = path.basename(filename, ext);
    const createdAt = new Date().toISOString();
    
    // Calculate hash if not provided
    const filePath = path.join(UPLOAD_DIR, filename);
    const hash = req.body.hash || await calculateFileHash(filePath);
    
    const newRecord: MetadataRecord = {
      uuid,
      filename,
      hash,
      createdAt,
      uploaderId,
      uploaderName,
    };
    
    await dbService.insertImage(newRecord);
    res.status(201).json({ uuid, filename, url: filename, createdAt, hash: newRecord.hash });
  } catch (err) {
    next(err as Error);
  }
}

// DELETE /api/images/:uuid
export async function deleteImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { uuid } = req.params;
    const record = await dbService.getImageByUuid(uuid);
    if (!record) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Try to remove file, but don't fail if file is missing/corrupted
    try {
      await fs.unlink(path.join(UPLOAD_DIR, record.filename));
      console.log(`✅ Deleted file: ${record.filename}`);
    } catch (fileErr) {
      console.warn(`⚠️  Could not delete file ${record.filename}:`, (fileErr as Error).message);
      // Continue anyway - we still want to remove the database entry
    }
    
    // Always remove from database (even if file deletion failed)
    await dbService.deleteImage(uuid);
    
    res.status(204).end();
  } catch (err) {
    next(err as Error);
  }
}