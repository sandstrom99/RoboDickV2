import fs from 'fs/promises';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const HASH_FILE = path.join(__dirname, '..', '..', 'data', 'hashes.json');

interface HashRecord { hash: string }

async function readHashes(): Promise<HashRecord[]> {
  try {
    const raw = await fs.readFile(HASH_FILE, 'utf-8');
    return JSON.parse(raw) as HashRecord[];
  } catch (err) {
    // if file missing, return empty
    return [];
  }
}

async function writeHashes(records: HashRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(HASH_FILE), { recursive: true });
  await fs.writeFile(HASH_FILE, JSON.stringify(records, null, 2));
}

export async function getHashes(_req: Request, res: Response, next: NextFunction) {
  try {
    const hashes = await readHashes();
    res.json(hashes);
  } catch (err) {
    next(err as Error);
  }
}

export async function listImages(req: Request, res: Response, next: NextFunction) {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit as string) || 10, 1);
    const start = (page - 1) * limit;
    const images = files.slice(start, start + limit).map(fn => fn);
    res.json({ total: files.length, page, images });
  } catch (err) {
    next(err as Error);
  }
}

export async function randomImage(_req: Request, res: Response, next: NextFunction) {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    const choice = files[Math.floor(Math.random() * files.length)];
    res.sendFile(path.join(UPLOAD_DIR, choice));
  } catch (err) {
    next(err as Error);
  }
}

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file' });
    }
    // read existing hashes
    const records = await readHashes();
    // if hash present, append
    const incomingHash = req.body.hash;
    if (incomingHash) {
      records.push({ hash: incomingHash });
      await writeHashes(records);
    }
    res.status(201).json({ filename: req.file.filename, url: `/images/${req.file.filename}` });
  } catch (err) {
    next(err as Error);
  }
}
