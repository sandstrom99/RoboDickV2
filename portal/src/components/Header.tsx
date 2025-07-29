import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Props {
  onUploadClick: () => void;
  currentTab?: 'gallery' | 'screensaver'; // Optional since we now use location-based logic
  onTabChange?: (tab: 'gallery' | 'screensaver') => void; // Optional since we now use navigation
  onLogout: () => void;
  username: string;
}

export function Header({ onUploadClick, currentTab, onTabChange, onLogout, username }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine current route for navigation highlighting
  const isGalleryRoute = location.pathname === '/' || location.pathname === '/home';
  const isCastRoute = location.pathname === '/cast';
  
  const handleLogoClick = () => {
    navigate('/home');
  };
  
  const handleGalleryClick = () => {
    navigate('/home');
  };
  
  const handleCastClick = () => {
    navigate('/cast');
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-lg border-b border-slate-200 dark:border-slate-700">
      <div className="container mx-auto px-4 py-4">
        {/* Mobile Layout - Stacked */}
        <div className="block sm:hidden">
          {/* Top Row - Title and Actions */}
          <div className="flex items-center justify-between mb-4">
            <div 
              className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            >
              <div className="text-xl">🖼️</div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 dark:text-white">
                  Image Portal
                </h1>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  RoboDickV2
                </p>
                {username && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    👤 {username}
                  </p>
                )}
              </div>
            </div>
            
            {/* Action Buttons - Compact */}
            <div className="flex items-center space-x-2">
              {isGalleryRoute && (
                <button
                  onClick={onUploadClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                  title="Upload Images"
                >
                  <span className="text-sm">📤</span>
                </button>
              )}
              
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                <span className="text-sm">🔓</span>
              </button>
            </div>
          </div>
          
          {/* Bottom Row - Navigation Tabs */}
          <nav className="flex space-x-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
            <button
              onClick={handleGalleryClick}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isGalleryRoute
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              📚 Gallery
            </button>
            <button
              onClick={handleCastClick}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isCastRoute
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              🎬 Screensaver
            </button>
          </nav>
        </div>

        {/* Desktop Layout - Horizontal */}
        <div className="hidden sm:flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div 
              className="flex items-center space-x-4 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
            >
              <div className="text-2xl">🖼️</div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                  Image Portal
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  RoboDickV2 Image Management
                </p>
                {username && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    👤 {username}
                  </p>
                )}
              </div>
            </div>
            
            {/* Navigation Tabs */}
            <nav className="flex space-x-1 bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
              <button
                onClick={handleGalleryClick}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isGalleryRoute
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                📚 Gallery
              </button>
              <button
                onClick={handleCastClick}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  isCastRoute
                    ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                🎬 Screensaver
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            {isGalleryRoute && (
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