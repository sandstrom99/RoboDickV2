import axios from 'axios';
import type { ImageMeta } from './types';

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
  const formData = new FormData();
  formData.append('image', file);
  formData.append('uploaderId', 'portal-user');
  formData.append('uploaderName', 'Portal User');
  
  const res = await axios.post(API_IMAGES, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return res.data;
}

export async function fetchRandomImages(count: number = 9): Promise<{ urls: string[] }> {
  const res = await axios.get(`${API_IMAGES}/random?count=${count}`);
  return res.data;
}

export { API_BASE, API_IMAGES };