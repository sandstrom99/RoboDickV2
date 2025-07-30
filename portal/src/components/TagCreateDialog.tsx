import React, { useState } from 'react';
import type { CreateTagRequest } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateTag: (tagData: CreateTagRequest) => Promise<void>;
}

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#A569BD', '#D7BDE2'
];

export function TagCreateDialog({ isOpen, onClose, onCreateTag }: Props) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter a tag name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreateTag({
        name: name.trim(),
        color
      });
      
      // Reset form
      setName('');
      setColor(PRESET_COLORS[0]);
      onClose();
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag. Please try again.');
      // Don't close the dialog on error so user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          Create New Tag
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tag Name Input */}
          <div>
            <label htmlFor="tagName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tag Name
            </label>
            <input
              id="tagName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name..."
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg 
                         bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={50}
              autoFocus
            />
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Color
            </label>
            
            {/* Preset Colors */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={`
                    w-full h-8 rounded-lg border-2 transition-all duration-150
                    ${color === presetColor 
                      ? 'border-slate-400 ring-2 ring-blue-500' 
                      : 'border-slate-300 hover:border-slate-400'
                    }
                  `}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>

            {/* Custom Color Input */}
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-8 rounded border border-slate-300 dark:border-slate-600"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#FF6B6B"
                className="flex-1 px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded 
                           bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Preview
            </label>
            <div className="flex items-center">
              {name.trim() ? (
                <span
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: color,
                    color: (() => {
                      const r = parseInt(color.slice(1, 3), 16);
                      const g = parseInt(color.slice(3, 5), 16);
                      const b = parseInt(color.slice(5, 7), 16);
                      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
                      return brightness > 155 ? '#000000' : '#FFFFFF';
                    })()
                  }}
                >
                  {name.trim()}
                </span>
              ) : (
                <span className="text-slate-500 dark:text-slate-400 text-sm italic">
                  Enter a name to see preview
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 
                         rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 
                         text-white rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Tag'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 