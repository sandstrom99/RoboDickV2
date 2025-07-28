import React from 'react';
import type { ImageMeta } from '../types';
import { API_BASE } from '../api';

interface Props {
  image: ImageMeta;
  onDelete: (id: string) => Promise<void>;
  onView: (image: ImageMeta) => void;
}

export function ImageCard({ image, onDelete, onView }: Props) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(image.uuid);
  };

  return (
    <div 
      className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 border border-slate-200 dark:border-slate-700 cursor-pointer group"
      onClick={() => onView(image)}
    >
      <div className="relative overflow-hidden">
        <img 
          src={`${API_BASE}/images/${image.filename}`} 
          alt={image.uuid} 
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-transparent group-hover:bg-black group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-slate-800 rounded-full p-2 shadow-lg pointer-events-auto">
            <span className="text-blue-600 text-lg">👁️</span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Filename
            </span>
          </div>
          <p className="text-sm font-medium text-slate-800 dark:text-white truncate" title={image.filename}>
            {image.filename}
          </p>
          
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>By {image.uploaderName}</span>
            <span>{new Date(image.createdAt).toLocaleDateString()}</span>
          </div>
          
          <div className="pt-1">
            <code className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
              {image.uuid.substring(0, 8)}...
            </code>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onView(image)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-1"
          >
            <span>👁️</span>
            <span>View</span>
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200"
            title="Delete image"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}
