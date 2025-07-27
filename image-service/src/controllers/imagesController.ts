import { Request, Response, NextFunction } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { getPagination } from '../utils/paginate';

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

export async function listImages(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const { start, limit } = getPagination(
      req.query.page as string,
      req.query.limit as string
    );
    const total = files.length;
    const slice = files.slice(start, start + limit);

    // Map filenames → full URLs
    const host = `${req.protocol}://${req.get('host')}`;
    const images = slice.map((fn) => `${host}/images/${fn}`);

    res.json({
      total,
      page: Number(req.query.page) || 1,
      images,
    });
  } catch (err) {
    next(err);
  }
}

export async function randomImage(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    if (files.length === 0) {
      return res.status(404).send('No images available');
    }

    const choice = files[Math.floor(Math.random() * files.length)];
    const filePath = path.join(UPLOAD_DIR, choice);

    return res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

export async function uploadImage(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    return res
      .status(201)
      .json({ filename: req.file.filename, url: `/images/${req.file.filename}` });
  } catch (err) {
    next(err);
  }
}
