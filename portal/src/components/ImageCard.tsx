import React from 'react';
import type { ImageMeta } from '../types';
import { TagBadge } from './TagBadge';

interface Props {
  image: ImageMeta;
  onDelete: (id: string) => void;
  onView: (image: ImageMeta) => void;
  showDelete?: boolean;
}

export function ImageCard({ image, onDelete, onView, showDelete = false }: Props) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete ${image.filename}?`)) {
      onDelete(image.uuid);
    }
  };

  const handleView = () => {
    onView(image);
  };

  return (
    <div 
      className="group relative bg-white dark:bg-slate-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={handleView}
    >
      {/* Image */}
      <div className="aspect-square overflow-hidden">
        <img
          src={`${import.meta.env.VITE_IMAGE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000'}/images/${image.filename}`}
          alt={image.filename}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Admin Delete Button */}
      {showDelete && (
        <button
          onClick={handleDelete}
          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          title="Delete image (Admin only)"
        >
          🗑️
        </button>
      )}

      {/* Tags Overlay */}
      {image.tags && image.tags.length > 0 && (
        <div className="absolute top-2 left-2 right-2">
          <div className="flex flex-wrap gap-1">
            {image.tags.slice(0, 3).map(tag => (
              <TagBadge key={tag.id} tag={tag} size="sm" />
            ))}
            {image.tags.length > 3 && (
              <span className="px-2 py-1 text-xs bg-black/60 text-white rounded-full">
                +{image.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Image Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="text-white">
          <div className="text-sm font-medium truncate">{image.filename}</div>
          <div className="text-xs text-gray-300">
            By {image.uploaderName} • {new Date(image.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <div className="bg-white/90 dark:bg-slate-800/90 rounded-lg px-4 py-2">
          <span className="text-sm font-medium text-slate-800 dark:text-white">Click to view</span>
        </div>
      </div>
    </div>
  );
}
