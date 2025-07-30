import React from 'react';
import type { Tag } from '../types';

interface Props {
  tag: Tag;
  onRemove?: () => void;
  showRemove?: boolean;
  size?: 'sm' | 'md';
}

export function TagBadge({ tag, onRemove, showRemove = false, size = 'sm' }: Props) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm'
  };

  // Calculate text color based on background brightness
  const getTextColor = (hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 155 ? '#000000' : '#FFFFFF';
  };

  const textColor = getTextColor(tag.color);

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${sizeClasses[size]}
        ${showRemove ? 'pr-1' : ''}
      `}
      style={{
        backgroundColor: tag.color,
        color: textColor,
      }}
    >
      <span className="truncate max-w-[100px]">{tag.name}</span>
      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`
            ml-1 rounded-full transition-all duration-150 flex items-center justify-center
            bg-white/20 hover:bg-white/40 backdrop-blur-sm
            ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}
          `}
          title="Remove tag"
        >
          <span 
            className={`font-bold ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
            style={{ color: '#FFFFFF' }}
          >
            ×
          </span>
        </button>
      )}
    </span>
  );
} 