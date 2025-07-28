import React from 'react';
import type { ImageMeta } from '../types';
import { API_BASE } from '../api';

interface Props {
  image: ImageMeta | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}

export function ImageModal({ image, onClose, onDelete }: Props) {
  if (!image) return null;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      await onDelete(image.uuid);
      onClose();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white truncate">
              {image.filename}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Image */}
          <div className="flex-1 p-6 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
            <img
              src={`${API_BASE}/images/${image.filename}`}
              alt={image.uuid}
              className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
            />
          </div>

          {/* Details */}
          <div className="w-full lg:w-80 p-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
              Image Details
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  UUID
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <code className="text-sm bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {image.uuid}
                  </code>
                  <button
                    onClick={() => copyToClipboard(image.uuid)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                    title="Copy UUID"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Filename
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <span className="text-sm text-slate-800 dark:text-white">
                    {image.filename}
                  </span>
                  <button
                    onClick={() => copyToClipboard(image.filename)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                    title="Copy filename"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Uploaded By
                </label>
                <p className="mt-1 text-sm text-slate-800 dark:text-white">
                  {image.uploaderName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ID: {image.uploaderId}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Upload Date
                </label>
                <p className="mt-1 text-sm text-slate-800 dark:text-white">
                  {new Date(image.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Hash
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded break-all">
                    {image.hash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(image.hash)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                    title="Copy hash"
                  >
                    📋
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">
                  Direct Link
                </label>
                <div className="mt-1 flex items-center space-x-2">
                  <a
                    href={`${API_BASE}/images/${image.filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 underline truncate"
                  >
                    Open in new tab
                  </a>
                  <button
                    onClick={() => copyToClipboard(`${API_BASE}/images/${image.filename}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                    title="Copy link"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={handleDelete}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
              >
                🗑️ Delete Image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 