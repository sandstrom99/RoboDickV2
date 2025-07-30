import { useState, useEffect, useCallback } from 'react';
import { fetchImages, deleteImage, getTotalImageCount, uploadImage } from '../api';
import type { ImageMeta } from '../types';

export function useImages() {
  const [images, setImages] = useState<ImageMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalImages, setTotalImages] = useState(0);

  const loadPage = useCallback(async (p: number, search: string = '') => {
    setLoading(true);
    try {
      const data = await fetchImages(p, limit, 'createdAt', 'desc', search);
      
      setImages(data.images);
      setTotal(data.total);
      
    } catch (error) {
      console.error('❌ Failed to load images:', error);
      alert('Failed to connect to image service. Make sure it\'s running on http://localhost:3000');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const loadTotalStats = useCallback(async () => {
    try {
      const count = await getTotalImageCount();
      setTotalImages(count);
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    // Note: Confirmation should be handled by the calling component (ImageModal, ImageCard, etc.)
    try {
      await deleteImage(id);
      await loadPage(page, searchTerm);
      await loadTotalStats();
      return true;
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image. Please try again.');
      return false;
    }
  }, [page, searchTerm, loadPage, loadTotalStats]);

  const handleUpload = useCallback(async (files: FileList, username: string) => {
    let uploaded = 0;
    let duplicates = 0;
    let errors = 0;
    
    try {
      for (const file of Array.from(files)) {
        try {
          await uploadImage(file, username);
          uploaded++;
        } catch (error) {
          if (error instanceof Error && error.message.includes('Duplicate image detected')) {
            duplicates++;
          } else {
            errors++;
            console.error(`❌ Failed to upload ${file.name}:`, error);
          }
        }
      }
      
      // Show results
      let message = '';
      if (uploaded > 0) message += `✅ Uploaded ${uploaded} new image(s). `;
      if (duplicates > 0) message += `🚫 Skipped ${duplicates} duplicate(s). `;
      if (errors > 0) message += `❌ Failed to upload ${errors} image(s). `;
      
      if (message) {
        alert(message.trim());
      }
      
      // Only refresh if we uploaded something new
      if (uploaded > 0) {
        await loadPage(page, searchTerm);
        await loadTotalStats();
      }
      
      return { uploaded, duplicates, errors };
    } catch (error) {
      console.error('Upload process failed:', error);
      alert('Upload process failed. Please try again.');
      throw error;
    }
  }, [page, searchTerm, loadPage, loadTotalStats]);

  // Load page data when page or search changes
  useEffect(() => {
    loadPage(page, searchTerm);
    loadTotalStats();
  }, [page, searchTerm, loadPage, loadTotalStats]);

  // Handle search changes - reset to page 1 when search term changes
  useEffect(() => {
    if (page !== 1) {
      setPage(1); // This will trigger the useEffect above to call loadPage(1, searchTerm)
    }
    // Don't call loadPage directly here - let the page dependency handle it
  }, [searchTerm]);

  // No need for client-side filtering since we now have server-side search
  const filteredImages = images;

  const updateImageInList = useCallback((updatedImage: ImageMeta) => {
    setImages(prevImages => 
      prevImages.map(img => 
        img.uuid === updatedImage.uuid ? updatedImage : img
      )
    );
  }, []);

  return {
    images,
    filteredImages,
    total,
    page,
    limit,
    loading,
    searchTerm,
    totalImages,
    setPage,
    setSearchTerm,
    loadPage: (p: number) => loadPage(p, searchTerm),
    loadTotalStats,
    refresh: () => loadPage(page, searchTerm),
    updateImageInList,
    handleDelete,
    handleUpload,
  };
} 