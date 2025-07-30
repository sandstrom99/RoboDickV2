import React, { useState, useEffect } from 'react';
import type { ImageMeta, Tag, CreateTagRequest } from '../types';
import { TagBadge } from './TagBadge';
import { TagSearchBar } from './TagSearchBar';
import { fetchTags, fetchImageById, createTag, addTagToImage, removeTagFromImage } from '../api';

interface Props {
  image: ImageMeta | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  showDelete?: boolean;
  onImageUpdate?: (updatedImage: ImageMeta) => void;
}

// Global scroll manager to avoid React lifecycle issues
class ScrollManager {
  private static scrollY = 0;
  private static isLocked = false;

  static lockScroll() {
    if (this.isLocked) return;
    
    this.scrollY = window.scrollY;
    this.isLocked = true;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollY}px`;
    document.body.style.width = '100%';
  }

  static unlockScroll() {
    if (!this.isLocked) return;
    
    this.isLocked = false;
    
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    window.scrollTo(0, this.scrollY);
  }
}

export function ImageModal({ image, onClose, onDelete, showDelete = false, onImageUpdate }: Props) {
  const [currentImage, setCurrentImage] = useState<ImageMeta | null>(image);

  // Update currentImage when image prop changes
  useEffect(() => {
    setCurrentImage(image);
  }, [image]);

  // Manage scroll lock based on image presence using a stable effect
  React.useEffect(() => {
    if (currentImage) {
      // Lock scroll when an image is provided (modal opens)
      ScrollManager.lockScroll();
      return () => {
        // Unlock when image changes or modal unmounts
        ScrollManager.unlockScroll();
      };
    }
  }, [currentImage]);

  // Refresh the current image data from the server
  const refreshImageData = async () => {
    if (!currentImage) return;
    
    try {
      const updatedImage = await fetchImageById(currentImage.uuid);
      setCurrentImage(updatedImage);
      if (onImageUpdate) {
        onImageUpdate(updatedImage);
      }
    } catch (error) {
      console.error('❌ Failed to refresh image data:', error);
    }
  };

  // If there's no image, render nothing (after hooks have run)
  if (!currentImage) return null;

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${currentImage.filename}? This action cannot be undone.`)) {
      onDelete(currentImage.uuid);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here if you have one
      console.log(`${label} copied to clipboard`);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const handleRemoveTag = async (tag: Tag) => {
    try {
      await removeTagFromImage(currentImage.uuid, tag.id);
      // Refresh image data to get updated tags
      await refreshImageData();
    } catch (error) {
      console.error('❌ Failed to remove tag:', error);
      alert('Failed to remove tag. Please try again.');
    }
  };

  const handleTagAdded = async () => {
    // Refresh image data when a tag is added via the search bar
    await refreshImageData();
  };

  const fullImageUrl = `${import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000'}/images/${currentImage.filename}`;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-2 sm:p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-4xl h-full max-h-[95vh] bg-white dark:bg-slate-800 rounded-lg sm:rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-2 sm:pr-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-white break-words">
              {currentImage.filename}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Uploaded by {currentImage.uploaderName} on {new Date(currentImage.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {showDelete && (
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center space-x-1 sm:space-x-2"
                title="Delete image (Admin only)"
              >
                <span>🗑️</span>
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xl sm:text-2xl p-1 sm:p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative flex-1 min-h-0 overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900">
          <img
            src={fullImageUrl}
            alt={currentImage.filename}
            className="max-w-full max-h-full object-contain"
          />
          
          {/* Tags Overlay on Image */}
          {currentImage.tags && currentImage.tags.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex flex-wrap gap-2">
                {currentImage.tags.map(tag => (
                  <TagBadge
                    key={tag.id}
                    tag={tag}
                    size="md"
                    showRemove={true}
                    onRemove={() => handleRemoveTag(tag)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Tag Section - Full Width */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div className="p-3 sm:p-4">
            <TagSearchBar
              imageUuid={currentImage.uuid}
              onTagAdded={handleTagAdded}
              excludeTagIds={currentImage.tags?.map(tag => tag.id) || []}
            />
          </div>
        </div>

        {/* Footer with metadata */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="space-y-4">
            {/* Metadata */}
            <div className="flex gap-3 justify-center">
              {/* Copy UUID */}
              <button
                onClick={() => copyToClipboard(currentImage.uuid, 'UUID')}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 
                           text-slate-700 dark:text-slate-300 rounded-lg transition-colors duration-200"
                title="Copy UUID to clipboard"
              >
                <span>📋</span>
                <span className="text-sm font-medium">Copy UUID</span>
              </button>
              
              {/* Copy Image URL */}
              <button
                onClick={() => copyToClipboard(fullImageUrl, 'Image URL')}
                className="flex items-center space-x-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 
                           text-slate-700 dark:text-slate-300 rounded-lg transition-colors duration-200"
                title="Copy image URL to clipboard"
              >
                <span>🔗</span>
                <span className="text-sm font-medium">Copy URL</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 