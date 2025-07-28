import axios from 'axios';
import type { ImageMeta } from './types';
import { computeHash, hammingDistance } from './utils/imageHash';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`;
const API_IMAGES = `${API_BASE}/api/images`;

export async function fetchImages(page: number, limit: number): Promise<{ total: number; page: number; images: ImageMeta[] }> {
  const res = await axios.get(`${API_IMAGES}?page=${page}&limit=${limit}`);
  return res.data;
}

export async function deleteImage(uuid: string): Promise<void> {
  await axios.delete(`${API_IMAGES}/${uuid}`);
}

export async function getTotalImageCount(): Promise<number> {
  const res = await axios.get(`${API_IMAGES}/count`);
  return res.data.count;
}

export async function uploadImage(file: File): Promise<ImageMeta> {
  // First, get existing hashes to check for duplicates
  const { data: existingHashes } = await axios.get<{ uuid: string; hash: string; filename: string }[]>(`${API_IMAGES}/hashes`);
  
  // Calculate hash of the new image
  const fileBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(fileBuffer);
  const newHash = await computeHash(buffer);
  
  console.log(`🔍 Calculated hash for ${file.name}: ${newHash}`);
  
  // Check for duplicates using hamming distance
  const HASH_THRESHOLD = 3// Same as discord bot default
  const duplicate = existingHashes.find(existing => 
    hammingDistance(existing.hash, newHash) <= HASH_THRESHOLD
  );
  
  if (duplicate) {
    const distance = hammingDistance(duplicate.hash, newHash);
    console.log(`🚫 Duplicate detected! Similar to: ${duplicate.filename} (distance: ${distance})`);
    throw new Error(`Duplicate image detected! Similar to: ${duplicate.filename} (similarity: ${HASH_THRESHOLD - distance}/${HASH_THRESHOLD})`);
  }
  
  // Upload with hash
  const formData = new FormData();
  formData.append('image', file);
  formData.append('hash', newHash);
  formData.append('uploaderId', 'portal-user');
  formData.append('uploaderName', 'Portal User');
  
  console.log(`📤 Uploading ${file.name} with hash: ${newHash}`);
  
  const res = await axios.post(API_IMAGES, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  console.log(`✅ Successfully uploaded ${file.name}`);
  return res.data;
}

export async function fetchRandomImages(count: number = 9): Promise<{ urls: string[] }> {
  const res = await axios.get(`${API_IMAGES}/random?count=${count}`);
  return res.data;
}

export { API_BASE, API_IMAGES };