import React from 'react';

interface Props {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  totalResults: number;
}

export function SearchBar({ searchTerm, onSearchChange, totalResults }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Search Images
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-400">🔍</span>
            </div>
            <input
              id="search"
              type="text"
              placeholder="Search by filename, uploader, or UUID..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-sm text-slate-600 dark:text-slate-400">
            {totalResults} result{totalResults !== 1 ? 's' : ''}
          </div>
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 