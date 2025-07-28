import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE } from '../api';
import axios from 'axios';
import type { ImageMeta } from '../types';
import { CastButton } from './CastButton';

interface Props {
  onExit: () => void;
}

export function Screensaver({ onExit }: Props) {
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [imagePool, setImagePool] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCastConnected, setIsCastConnected] = useState(false);
  const [castDeviceName, setCastDeviceName] = useState('');
  
  const intervalRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const imagePoolRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);

  // Update refs when state changes
  useEffect(() => {
    imagePoolRef.current = imagePool;
  }, [imagePool]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Fetch random images
  const fetchImagePool = useCallback(async () => {
    try {
      console.log('🔄 Fetching new image pool...');
      const response = await axios.get<{ urls: string[] }>(`${API_BASE}/api/images/random?count=9`);
      const fullUrls = response.data.urls.map(url => `${API_BASE}${url}`);
      console.log('✅ Fetched images:', fullUrls.length);
      
      setImagePool(fullUrls);
      setCurrentIndex(0);
      
      if (fullUrls.length > 0) {
        setCurrentImage(fullUrls[0]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch images for screensaver:', error);
    }
  }, []);

  // Move to next image (synchronous, no async/await)
  const goToNextImage = useCallback(() => {
    if (isTransitioningRef.current) {
      console.log('⏭️ Transition in progress, skipping...');
      return;
    }

    if (imagePoolRef.current.length === 0) {
      console.log('📷 No images in pool, fetching...');
      fetchImagePool();
      return;
    }

    if (imagePoolRef.current.length === 1) {
      console.log('📷 Only one image in pool, fetching new batch...');
      fetchImagePool();
      return;
    }

    isTransitioningRef.current = true;
    setIsTransitioning(true);
    
    const nextIndex = (currentIndexRef.current + 1) % imagePoolRef.current.length;
    console.log(`🔄 Transitioning from image ${currentIndexRef.current + 1} to ${nextIndex + 1} of ${imagePoolRef.current.length}`);
    console.log(`🖼️ Current image: ${currentImage?.split('/').pop()}`);
    console.log(`🖼️ Next image: ${imagePoolRef.current[nextIndex]?.split('/').pop()}`);
    
    // Always transition after fade duration
    setTimeout(() => {
      // If we've cycled through all images, fetch new ones
      if (nextIndex === 0) {
        console.log('🔄 Reached end of pool, fetching new images...');
        fetchImagePool();
      } else {
        console.log(`✅ Setting new image: ${imagePoolRef.current[nextIndex]?.split('/').pop()}`);
        setCurrentIndex(nextIndex);
        setCurrentImage(imagePoolRef.current[nextIndex]);
      }
      
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }, 500);
  }, [fetchImagePool]);

  // Toggle play/pause
  const togglePlayback = useCallback(() => {
    console.log('▶️ Toggle playback, currently playing:', isPlaying);
    console.log('📊 Current state - imagePool length:', imagePoolRef.current.length, 'currentIndex:', currentIndexRef.current);
    
    if (isPlaying) {
      // Stop
      if (intervalRef.current) {
        console.log('🛑 Clearing interval:', intervalRef.current);
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
      console.log('⏸️ Paused');
    } else {
      // Start
      if (intervalRef.current) {
        console.log('🧹 Clearing existing interval before starting new one');
        window.clearInterval(intervalRef.current);
      }
      
      console.log('🚀 Starting new interval with', intervalSeconds, 'seconds');
      intervalRef.current = window.setInterval(() => {
        console.log('⏰ INTERVAL TICK! - Pool length:', imagePoolRef.current.length, 'Index:', currentIndexRef.current);
        goToNextImage();
      }, intervalSeconds * 1000);
      
      setIsPlaying(true);
      console.log('▶️ Playing with interval ID:', intervalRef.current, 'interval:', intervalSeconds, 'seconds');
    }
  }, [isPlaying, intervalSeconds, goToNextImage]);

  // Change interval
  const handleIntervalChange = useCallback((newInterval: number) => {
    console.log('⏱️ Changing interval to:', newInterval, 'seconds');
    setIntervalSeconds(newInterval);
    
    // If playing, restart with new interval
    if (isPlaying && intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = window.setInterval(() => {
        console.log('⏰ New interval tick');
        goToNextImage();
      }, newInterval * 1000);
    }
  }, [isPlaying, goToNextImage]);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Handle mouse movement
  const handleMouseMove = useCallback(() => {
    resetControlsTimeout();
  }, [resetControlsTimeout]);

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    console.log('⌨️ Key pressed:', e.code, e.key);
    
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        e.stopPropagation();
        togglePlayback();
        resetControlsTimeout();
        break;
      case 'ArrowRight':
        e.preventDefault();
        e.stopPropagation();
        goToNextImage();
        resetControlsTimeout();
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        onExit();
        break;
    }
  }, [togglePlayback, goToNextImage, onExit, resetControlsTimeout]);

  // Handle cast status changes
  const handleCastStatusChange = useCallback((isConnected: boolean, deviceName?: string) => {
    setIsCastConnected(isConnected);
    setCastDeviceName(deviceName || '');
  }, []);

  // Initialize
  useEffect(() => {
    console.log('🚀 Screensaver initializing...');
    fetchImagePool();
    resetControlsTimeout();
    
    document.addEventListener('keydown', handleKeyPress);
    
    return () => {
      console.log('🧹 Screensaver cleanup');
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, []); // Empty dependency array - only run once

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onMouseMove={handleMouseMove}
    >
      {/* Main Image */}
      {currentImage && (
        <img
          src={currentImage}
          alt="Screensaver"
          className={`max-w-full max-h-full object-contain transition-opacity duration-500 ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        />
      )}

      {/* Controls Overlay */}
      <div className={`absolute inset-0 transition-opacity duration-300 ${
        showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        {/* Top Controls */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
            <h2 className="text-xl font-bold">🎬 Image Screensaver</h2>
            <div className="text-sm text-slate-300">
              Image {currentIndex + 1} of {imagePool.length}
              {currentImage && <div className="text-xs mt-1">Current: {currentImage.split('/').pop()}</div>}
            </div>
          </div>
          
          <button
            onClick={onExit}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors cursor-pointer"
            title="Exit (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm text-white px-6 py-4 rounded-lg flex items-center space-x-6">
            {/* Play/Pause */}
            <button
              onClick={togglePlayback}
              className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg transition-colors text-xl cursor-pointer"
              title="Play/Pause (SPACE)"
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            {/* Next Image */}
            <button
              onClick={goToNextImage}
              className="bg-slate-600 hover:bg-slate-700 text-white p-3 rounded-lg transition-colors text-xl cursor-pointer"
              title="Next Image (→)"
            >
              ⏭️
            </button>

            {/* Interval Controls */}
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">Interval:</span>
              <div className="flex items-center space-x-2">
                {[2, 5, 10, 15, 30].map(seconds => (
                  <button
                    key={seconds}
                    onClick={() => handleIntervalChange(seconds)}
                    className={`px-3 py-1 rounded text-sm transition-colors cursor-pointer ${
                      intervalSeconds === seconds
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-600 hover:bg-slate-700 text-white'
                    }`}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>

            {/* Cast Button */}
            <div className="border-l border-slate-600 pl-6">
              <CastButton
                currentImage={currentImage || undefined}
                imagePool={imagePool}
                onCastStatusChange={handleCastStatusChange}
              />
            </div>

            {/* Status */}
            <div className="text-sm text-slate-300">
              {isPlaying ? `Auto-playing every ${intervalSeconds}s` : 'Paused'}
              {isTransitioning && ' (Transitioning...)'}
              {isCastConnected && (
                <div className="text-xs text-green-400 mt-1">
                  📺 Casting to {castDeviceName}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="absolute bottom-6 right-6">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm text-white px-4 py-3 rounded-lg text-sm">
            <div className="font-medium mb-2">Keyboard Shortcuts:</div>
            <div className="space-y-1 text-xs">
              <div><kbd className="bg-slate-700 px-1 rounded">SPACE</kbd> Play/Pause</div>
              <div><kbd className="bg-slate-700 px-1 rounded">→</kbd> Next Image</div>
              <div><kbd className="bg-slate-700 px-1 rounded">ESC</kbd> Exit</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading indicator */}
      {!currentImage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-lg">Loading images...</p>
          </div>
        </div>
      )}
    </div>
  );
} 