import React from 'react';
import type { ImageMeta } from '../types';

interface Props {
  image: ImageMeta | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  showDelete?: boolean;
}

export function ImageModal({ image, onClose, onDelete, showDelete = false }: Props) {
  if (!image) return null;

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${image.filename}? This action cannot be undone.`)) {
      onDelete(image.uuid);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white truncate">
              {image.filename}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Uploaded by {image.uploaderName} on {new Date(image.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 ml-4">
            {showDelete && (
              <button
                onClick={handleDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
                title="Delete image (Admin only)"
              >
                <span>🗑️</span>
                <span>Delete</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl p-2"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="relative max-h-[70vh] overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-900">
          <img
            src={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/images/${image.filename}`}
            alt={image.filename}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        {/* Footer with metadata */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-slate-600 dark:text-slate-400">UUID:</span>
              <p className="text-slate-800 dark:text-white font-mono text-xs break-all">
                {image.uuid}
              </p>
            </div>
            <div>
              <span className="font-medium text-slate-600 dark:text-slate-400">Uploader:</span>
              <p className="text-slate-800 dark:text-white">{image.uploaderName}</p>
            </div>
            <div>
              <span className="font-medium text-slate-600 dark:text-slate-400">Created:</span>
              <p className="text-slate-800 dark:text-white">
                {new Date(image.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 