import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const META_FILE = path.join(__dirname, '..', '..', 'data', 'metadata.json');

interface MetadataRecord {
  uuid: string;
  filename: string;
  hash: string;
  createdAt: string;
  uploaderId: string;
  uploaderName: string;
}

// Helper function to calculate file hash (fallback for non-images)
async function calculateFileHash(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  return crypto.createHash('md5').update(fileBuffer).digest('hex');
}



// Read metadata.json or return empty
async function readMetadata(): Promise<MetadataRecord[]> {
  try {
    const raw = await fs.readFile(META_FILE, 'utf-8');
    return JSON.parse(raw) as MetadataRecord[];
  } catch {
    return [];
  }
}

// Write metadata array back to file
async function writeMetadata(records: MetadataRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(META_FILE), { recursive: true });
  await fs.writeFile(META_FILE, JSON.stringify(records, null, 2));
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
    
    const metadata = await readMetadata();
    
    // Sort the metadata based on orderBy and orderDirection
    const sortedMetadata = [...metadata].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (orderBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'filename':
          aValue = a.filename.toLowerCase();
          bValue = b.filename.toLowerCase();
          break;
        case 'uploaderName':
          aValue = a.uploaderName.toLowerCase();
          bValue = b.uploaderName.toLowerCase();
          break;
        case 'uuid':
          aValue = a.uuid;
          bValue = b.uuid;
          break;
        default:
          // Default to createdAt
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }
      
      if (orderDirection === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
    
    const total = sortedMetadata.length;
    const start = (page - 1) * limit;
    const pageRecords = sortedMetadata.slice(start, start + limit);
    
    // Prepend URL path
    const images = pageRecords.map(rec => ({
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
    const metadata = await readMetadata();
    res.json({ count: metadata.length });
  } catch (err) {
    next(err as Error);
  }
}

// GET /api/images/:uuid
export async function getImageById(req: Request, res: Response, next: NextFunction) {
  try {
    const { uuid } = req.params;
    const metadata = await readMetadata();
    const record = metadata.find(r => r.uuid === uuid);
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
    const metadata = await readMetadata();
    if (metadata.length === 0) {
      return res.status(404).json({ error: 'No images' });
    }
    // Shuffle and pick random images
    const shuffled = metadata.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    // Construct URLs (assuming /images/ is the static path)
    const urls = selected.map(rec => `/images/${rec.filename}`);
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
    const metadata = await readMetadata();
    // return minimal info
    res.json(metadata.map(rec => ({ uuid: rec.uuid, hash: rec.hash, filename: rec.filename, createdAt: rec.createdAt })));
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
    
    const metadata = await readMetadata();
    const newRecord: MetadataRecord = {
      uuid,
      filename,
      hash,
      createdAt,
      uploaderId,
      uploaderName,
    };
    metadata.push(newRecord);
    await writeMetadata(metadata);
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
    const metadata = await readMetadata();
    const recordIndex = metadata.findIndex(r => r.uuid === uuid);
    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }
    const record = metadata[recordIndex];
    // remove file
    await fs.unlink(path.join(UPLOAD_DIR, record.filename));
    // update metadata
    metadata.splice(recordIndex, 1);
    await writeMetadata(metadata);
    res.status(204).end();
  } catch (err) {
    next(err as Error);
  }
}