import axios from 'axios';
import type { ImageMeta, Tag, CreateTagRequest } from './types';
import { computeHash, hammingDistance } from './utils/imageHash';

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}`;
const API_IMAGES = `${API_BASE}/api/images`;

export async function fetchImages(page: number, limit: number, orderBy: string = 'createdAt', orderDirection: string = 'desc', search: string = ''): Promise<{ total: number; page: number; images: ImageMeta[] }> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    orderBy,
    orderDirection,
  });
  
  if (search.trim()) {
    params.append('search', search.trim());
  }
  
  const res = await axios.get(`${API_IMAGES}?${params.toString()}`);
  return res.data;
}

export async function fetchImageById(uuid: string): Promise<ImageMeta> {
  const res = await axios.get(`${API_IMAGES}/${uuid}`);
  return res.data;
}

export async function deleteImage(uuid: string): Promise<void> {
  await axios.delete(`${API_IMAGES}/${uuid}`);
}

export async function getTotalImageCount(): Promise<number> {
  const res = await axios.get(`${API_IMAGES}/count`);
  return res.data.count;
}

export async function uploadImage(file: File, username: string = 'Portal User'): Promise<ImageMeta> {
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
  formData.append('uploaderName', username);
  
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

// ================================
// TAG API FUNCTIONS
// ================================

export async function fetchTags(): Promise<Tag[]> {
  const res = await axios.get(`${API_BASE}/api/tags`);
  return res.data;
}

export async function fetchPopularTags(search: string = '', limit: number = 10): Promise<Tag[]> {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.append('search', search.trim());
  }
  params.append('limit', limit.toString());
  
  const res = await axios.get(`${API_BASE}/api/tags/popular?${params.toString()}`);
  return res.data;
}

export async function createTag(tagData: CreateTagRequest): Promise<Tag> {
  const res = await axios.post(`${API_BASE}/api/tags`, tagData);
  return res.data;
}

export async function deleteTag(tagId: number): Promise<void> {
  await axios.delete(`${API_BASE}/api/tags/${tagId}`);
}

export async function addTagToImage(imageUuid: string, tagId: number): Promise<void> {
  await axios.post(`${API_BASE}/api/tags/${tagId}/images/${imageUuid}`);
}

export async function removeTagFromImage(imageUuid: string, tagId: number): Promise<void> {
  await axios.delete(`${API_BASE}/api/tags/${tagId}/images/${imageUuid}`);
}

export async function fetchImageTags(imageUuid: string): Promise<Tag[]> {
  const res = await axios.get(`${API_BASE}/api/tags/image/${imageUuid}`);
  return res.data;
}

export { API_BASE, API_IMAGES };