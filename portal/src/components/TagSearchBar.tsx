import React, { useState, useEffect, useRef } from 'react';
import type { Tag } from '../types';
import { fetchPopularTags, createTag, addTagToImage } from '../api';
import { TagBadge } from './TagBadge';

interface Props {
  imageUuid: string;
  onTagAdded: () => void;
  excludeTagIds: number[];
}

export function TagSearchBar({ imageUuid, onTagAdded, excludeTagIds }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [popularTags, setPopularTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial popular tags when expanded
  useEffect(() => {
    if (isExpanded) {
      loadPopularTags('');
      // Focus input after a brief delay to ensure it's rendered
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isExpanded]);

  // Search tags with debouncing
  useEffect(() => {
    if (!isExpanded) return;

    const timeoutId = setTimeout(() => {
      loadPopularTags(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, isExpanded, excludeTagIds]);

  const loadPopularTags = async (search: string) => {
    try {
      setLoading(true);
      const tags = await fetchPopularTags(search, 8);
      // Filter out tags already on the image
      const filteredTags = tags.filter(tag => !excludeTagIds.includes(tag.id));
      setPopularTags(filteredTags);
    } catch (error) {
      console.error('Failed to load popular tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExistingTag = async (tag: Tag) => {
    try {
      await addTagToImage(imageUuid, tag.id);
      onTagAdded();
      // Clear search term but keep expanded for adding more tags
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to add tag:', error);
      alert('Failed to add tag. Please try again.');
    }
  };

  const handleCreateAndAddTag = async () => {
    if (!searchTerm.trim() || isCreating) return;

    try {
      setIsCreating(true);
      // Create tag with random color (backend will assign)
      const newTag = await createTag({ name: searchTerm.trim(), color: '' });
      // Add to image
      await addTagToImage(imageUuid, newTag.id);
      onTagAdded();
      // Clear search term but keep expanded for adding more tags
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to create and add tag:', error);
      alert('Failed to create tag. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (popularTags.length === 1) {
        // If there's exactly one match, add it
        handleAddExistingTag(popularTags[0]);
      } else if (popularTags.length === 0 && searchTerm.trim()) {
        // If no matches, create new tag
        handleCreateAndAddTag();
      }
    } else if (e.key === 'Escape') {
      setSearchTerm('');
      setIsExpanded(false);
    }
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsExpanded(false);
      setSearchTerm('');
    }
  };

  if (!isExpanded) {
    return (
      <div className="min-h-[120px] flex items-start justify-center">
        <button
          onClick={() => setIsExpanded(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
        >
          + Add Tag
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[120px] space-y-3">
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search existing tags or create new..."
          className="w-full px-4 py-3 text-sm border border-slate-300 dark:border-slate-600 rounded-lg 
                     bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100
                     focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="absolute right-3 top-3 flex items-center space-x-2">
          {loading && (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
          <button
            onClick={() => {
              setIsExpanded(false);
              setSearchTerm('');
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-lg"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Popular Tags */}
      {popularTags.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {searchTerm ? 'Matching tags:' : 'Popular tags:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {popularTags.map(tag => (
              <button
                key={tag.id}
                onClick={() => handleAddExistingTag(tag)}
                className="hover:scale-105 transition-transform"
              >
                <TagBadge tag={tag} size="sm" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create New Tag Option */}
      {searchTerm.trim() && popularTags.length === 0 && !loading && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No matches found:</p>
          <button
            onClick={handleCreateAndAddTag}
            disabled={isCreating}
            className="flex items-center justify-between w-full px-4 py-3 text-left text-sm border-2 border-dashed 
                       border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 
                       transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="font-medium">
              {isCreating ? 'Creating...' : `Create "${searchTerm.trim()}"`}
            </span>
            <span className="text-green-600 text-lg">✓</span>
          </button>
        </div>
      )}

      {/* Hint Text */}
      <div className="flex justify-between items-center text-xs text-slate-400">
        <span>
          Press Enter to {popularTags.length === 1 ? 'add tag' : 'create new'} • Esc to cancel
        </span>
        {searchTerm && (
          <span className="text-slate-500">
            {popularTags.length} result{popularTags.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  );
} 