import React from 'react';

interface Props {
  onUploadClick: () => void;
  currentTab: 'gallery' | 'screensaver';
  onTabChange: (tab: 'gallery' | 'screensaver') => void;
  onLogout: () => void;
}

export function Header({ onUploadClick, currentTab, onTabChange, onLogout }: Props) {
  return (
    <header className="bg-white dark:bg-slate-800 shadow-lg border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <div className="text-2xl">🖼️</div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  Image Portal
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  RoboDickV2 Image Management
                </p>
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <nav className="flex space-x-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={() => onTabChange('gallery')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentTab === 'gallery'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📚 Gallery
              </button>
              <button
                onClick={() => onTabChange('screensaver')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentTab === 'screensaver'
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🎬 Screensaver
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {currentTab === 'gallery' && (
              <button
                onClick={onUploadClick}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
              >
                <span>📤</span>
                <span>Upload Images</span>
              </button>
            )}
            
            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              title="Logout"
            >
              <span>🔓</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 