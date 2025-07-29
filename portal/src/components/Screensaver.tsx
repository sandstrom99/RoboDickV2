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
  const [nextImage, setNextImage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showNextImage, setShowNextImage] = useState(false);
  const [nextImageVisible, setNextImageVisible] = useState(false);
  const [currentDisplayImage, setCurrentDisplayImage] = useState<string | null>(null);
  const [nextDisplayImage, setNextDisplayImage] = useState<string | null>(null);
  const [nextImageReady, setNextImageReady] = useState(false);
  const [intervalSeconds, setIntervalSeconds] = useState(10);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [imagePool, setImagePool] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCastConnected, setIsCastConnected] = useState(false);
  const [castDeviceName, setCastDeviceName] = useState('');
  const [currentImageLoaded, setCurrentImageLoaded] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const isTransitioningRef = useRef(false);
  const imagePoolRef = useRef<string[]>([]);
  const currentIndexRef = useRef(0);
  const preloadCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const lastTransitionedImageRef = useRef<string | null>(null);
  const lastTransitionTimeRef = useRef<number>(0);

  // Update refs when state changes
  useEffect(() => {
    imagePoolRef.current = imagePool;
  }, [imagePool]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Update current image ref when it changes
  useEffect(() => {
    if (currentImage) {
      console.log('🖼️ Current image updated:', currentImage.split('/').pop());
    }
  }, [currentImage]);

  // Preload an image and ensure it's fully loaded
  const preloadImage = useCallback((url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      // Check if already preloaded and fully loaded
      const existing = preloadCache.current.get(url);
      if (existing && existing.complete && existing.naturalWidth > 0) {
        console.log(`✅ Image already preloaded: ${url.split('/').pop()}`);
        resolve(existing);
        return;
      }

      const img = new Image();
      img.onload = () => {
        // Verify the image is actually loaded
        if (img.complete && img.naturalWidth > 0) {
          preloadCache.current.set(url, img);
          console.log(`✅ Preloaded image: ${url.split('/').pop()} (${img.naturalWidth}x${img.naturalHeight})`);
          resolve(img);
        } else {
          console.error(`❌ Image loaded but incomplete: ${url.split('/').pop()}`);
          reject(new Error(`Image incomplete: ${url}`));
        }
      };
      img.onerror = () => {
        console.error(`❌ Failed to preload image: ${url.split('/').pop()}`);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });
  }, []);

  // Preload next few images from the pool (silent version to avoid visual interference)
  const preloadNextImages = useCallback(async (fromIndex: number, count: number = 5) => {
    const pool = imagePoolRef.current;
    if (pool.length === 0) return;

    const imagesToPreload: string[] = [];
    for (let i = 1; i <= count && i < pool.length; i++) {
      const nextIndex = (fromIndex + i) % pool.length;
      const imageUrl = pool[nextIndex];
      if (imageUrl) {
        // Only preload if not already cached to avoid unnecessary work
        if (!preloadCache.current.has(imageUrl)) {
          imagesToPreload.push(imageUrl);
        }
      }
    }

    // Only log if there are actually images to preload
    if (imagesToPreload.length > 0) {
      console.log(`🔄 Silently preloading ${imagesToPreload.length} images...`);
    }

    // Preload images silently without updating state
    const preloadPromises = imagesToPreload.map(async (url) => {
      try {
        // Use a silent preload that doesn't update React state
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => {
            if (img.complete && img.naturalWidth > 0) {
              preloadCache.current.set(url, img);
              resolve(img);
            } else {
              reject(new Error(`Image incomplete: ${url}`));
            }
          };
          img.onerror = () => reject(new Error(`Failed to load: ${url}`));
          img.src = url;
        });
        return { success: true, url };
      } catch (err) {
        console.warn(`⚠️ Silent preload failed for ${url.split('/').pop()}:`, err);
        return { success: false, url, error: err };
      }
    });
    
    if (preloadPromises.length > 0) {
      const results = await Promise.allSettled(preloadPromises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      console.log(`✅ Silently preloaded ${successful}/${imagesToPreload.length} images`);
    }
  }, []);

  // Fetch random images
  const fetchImagePool = useCallback(async () => {
    try {
      console.log('🔄 Fetching new image pool...');
      const response = await axios.get<{ urls: string[] }>(`${API_BASE}/api/images/random?count=9`);
      const fullUrls = response.data.urls.map(url => `${API_BASE}${url}`);
      console.log('✅ Fetched images:', fullUrls.length);
      
      // Clear old preload cache when fetching new images
      preloadCache.current.clear();
      
      setImagePool(fullUrls);
      setCurrentIndex(0);
      
      if (fullUrls.length > 0) {
        // Set the first image and preload the next ones
        setCurrentImage(fullUrls[0]);
        setCurrentDisplayImage(fullUrls[0]);
        // Preload the first image if not already loaded
        preloadImage(fullUrls[0]).catch(console.warn);
        // Preload next few images
        setTimeout(() => preloadNextImages(0), 100);
      }
    } catch (error) {
      console.error('❌ Failed to fetch images for screensaver:', error);
    }
  }, [preloadImage, preloadNextImages]);

  // Move to next image with smooth transition
  const goToNextImage = useCallback(async () => {
    if (isTransitioningRef.current) {
      console.log('⏭️ Transition in progress, skipping...');
      return;
    }

    // Check if enough time has passed since last transition (only if we've had a previous transition)
    if (lastTransitionTimeRef.current > 0) {
      const timeSinceLastTransition = Date.now() - lastTransitionTimeRef.current;
      const minTimeBetweenTransitions = 1500; // 1.5 seconds minimum
      if (timeSinceLastTransition < minTimeBetweenTransitions) {
        console.log(`⏭️ Too soon since last transition (${timeSinceLastTransition}ms < ${minTimeBetweenTransitions}ms), skipping...`);
        return;
      }
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

    let nextIndex = (currentIndexRef.current + 1) % imagePoolRef.current.length;
    let nextImageUrl = imagePoolRef.current[nextIndex];
    
    if (!nextImageUrl) {
      console.error('❌ No next image available');
      return;
    }

    // Handle case where next image is the same as current
    if (nextImageUrl === currentImage) {
      if (imagePoolRef.current.length > 1) {
        console.log('🔄 Next image is the same as current, finding different image...');
        // Find the next different image
        for (let i = 1; i < imagePoolRef.current.length; i++) {
          const testIndex = (currentIndexRef.current + i) % imagePoolRef.current.length;
          const testUrl = imagePoolRef.current[testIndex];
          if (testUrl && testUrl !== currentImage) {
            nextIndex = testIndex;
            nextImageUrl = testUrl;
            console.log(`🔄 Found different image at index ${testIndex}: ${testUrl.split('/').pop()}`);
            break;
          }
        }
        
        // If we still have the same image, all images are identical
        if (nextImageUrl === currentImage) {
          console.log('🔄 All images are identical, fetching new pool...');
          fetchImagePool();
          return;
        }
      } else {
        console.log('🔄 Only one image available, fetching new pool...');
        fetchImagePool();
        return;
      }
    }

    // Additional safety check - ensure we have a valid current image
    if (!currentImage) {
      console.log('🔄 No current image available, skipping transition');
      return;
    }

    console.log(`🔄 Transitioning from image ${currentIndexRef.current + 1} to ${nextIndex + 1} of ${imagePoolRef.current.length}`);
    console.log(`🖼️ Current image: ${currentImage?.split('/').pop()}`);
    console.log(`🖼️ Next image: ${nextImageUrl.split('/').pop()}`);

    isTransitioningRef.current = true;
    setIsTransitioning(true);
    lastTransitionedImageRef.current = nextImageUrl;
    lastTransitionTimeRef.current = Date.now();

    try {
      // Ensure the next image is fully preloaded before starting transition
      console.log('⏳ Ensuring next image is preloaded before transition...');
      await preloadImage(nextImageUrl);
      console.log('✅ Next image is ready for transition');

      // Start crossfade: clean up any previous next image and set up new one
      console.log('🔄 Starting crossfade transition...');
      
      // Clean up any leftover next image first
      setNextDisplayImage(null);
      setShowNextImage(false);
      setNextImageVisible(false);
      setNextImageReady(false);
      
             // Small delay to ensure cleanup, then set up new next image
       setTimeout(() => {
         setNextDisplayImage(nextImageUrl);
         setShowNextImage(true);
         setNextImageVisible(false); // Start invisible
         setNextImageReady(true); // Now ready to show in DOM
         
         // Small delay to ensure DOM is ready
         setTimeout(() => {
           console.log('🔄 Starting simultaneous crossfade...');
           setIsTransitioning(true); // Fade out current image
           setNextImageVisible(true); // Fade in next image
         }, 50); // Very short delay just to ensure DOM is ready
       }, 100); // Cleanup delay
      
      // After crossfade completes, swap images
      setTimeout(async () => {
        console.log('🔄 Crossfade complete, swapping images...');
        
        // Simply update current image and hide next image
        setCurrentDisplayImage(nextImageUrl);
        setCurrentImage(nextImageUrl);
        setCurrentIndex(nextIndex);
        setNextImageVisible(false);
        
        // Don't remove next image from DOM to prevent flash - let next transition clean it up
        
                // If we've cycled through all images, fetch new ones
        if (nextIndex === 0) {
          console.log('🔄 Reached end of pool, fetching new images...');
          fetchImagePool();
        }
      }, 1300); // 1 second crossfade + 100ms cleanup + 50ms delay + extra buffer
      
      // Preload next images after transition is complete to avoid visual interference
      // This prevents any preloading activity from causing a black flash
      setTimeout(() => {
        preloadNextImages(nextIndex);
      }, 2000); // Longer delay to ensure transition is completely finished
        
        // Complete the transition after the full duration
        setTimeout(() => {
          setIsTransitioning(false);
          // Allow next transition
          isTransitioningRef.current = false;
          lastTransitionedImageRef.current = null;
          console.log('✅ Transition completed, ready for next image');
        }, 1400); // 1 second crossfade + 100ms cleanup + 50ms delay + buffer

    } catch (error) {
      console.error('❌ Failed to transition to next image:', error);
      isTransitioningRef.current = false;
      setIsTransitioning(false);
    }
  }, [currentImage, preloadImage, fetchImagePool, preloadNextImages]);

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
        // Only proceed if not currently transitioning and we have images
        if (!isTransitioningRef.current && imagePoolRef.current.length > 0) {
          // Check timing only if we've had a previous transition
          if (lastTransitionTimeRef.current > 0) {
            const timeSinceLastTransition = Date.now() - lastTransitionTimeRef.current;
            const minTimeBetweenTransitions = 1500; // 1.5 seconds minimum
            if (timeSinceLastTransition > minTimeBetweenTransitions) {
              goToNextImage();
            } else {
              console.log(`⏭️ Skipping interval tick - too soon since last transition: ${timeSinceLastTransition}ms < ${minTimeBetweenTransitions}ms`);
            }
          } else {
            // First transition, no timing restriction
            goToNextImage();
          }
        } else {
          console.log(`⏭️ Skipping interval tick - transition in progress: ${isTransitioningRef.current}, no images: ${imagePoolRef.current.length === 0}`);
        }
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
        // Only proceed if not currently transitioning and we have images
        if (!isTransitioningRef.current && imagePoolRef.current.length > 0) {
          // Check timing only if we've had a previous transition
          if (lastTransitionTimeRef.current > 0) {
            const timeSinceLastTransition = Date.now() - lastTransitionTimeRef.current;
            const minTimeBetweenTransitions = 1500; // 1.5 seconds minimum
            if (timeSinceLastTransition > minTimeBetweenTransitions) {
              goToNextImage();
            } else {
              console.log(`⏭️ Skipping new interval tick - too soon since last transition: ${timeSinceLastTransition}ms < ${minTimeBetweenTransitions}ms`);
            }
          } else {
            // First transition, no timing restriction
            goToNextImage();
          }
        } else {
          console.log(`⏭️ Skipping new interval tick - transition in progress: ${isTransitioningRef.current}, no images: ${imagePoolRef.current.length === 0}`);
        }
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
    
    // Auto-cast current image when connection is established
    if (isConnected && currentImage && deviceName) {
      console.log(`📺 Cast connected to ${deviceName}, auto-casting current image`);
      // Small delay to ensure the cast session is fully established
      setTimeout(() => {
        // The CastButton will handle the actual casting
      }, 1000);
    }
  }, [currentImage]);

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
      // Clear preload cache
      preloadCache.current.clear();
    };
  }, []); // Empty dependency array - only run once

  // Start autoplay after first image is loaded
  useEffect(() => {
    if (currentImage && !intervalRef.current) {
      console.log('🚀 First image loaded, starting autoplay with', intervalSeconds, 'seconds interval');
      intervalRef.current = window.setInterval(() => {
        console.log('⏰ AUTOPLAY INTERVAL TICK! - Pool length:', imagePoolRef.current.length, 'Index:', currentIndexRef.current);
        // Only proceed if not currently transitioning and we have images
        if (!isTransitioningRef.current && imagePoolRef.current.length > 0) {
          // Check timing only if we've had a previous transition
          if (lastTransitionTimeRef.current > 0) {
            const timeSinceLastTransition = Date.now() - lastTransitionTimeRef.current;
            const minTimeBetweenTransitions = 1500; // 1.5 seconds minimum
            if (timeSinceLastTransition > minTimeBetweenTransitions) {
              goToNextImage();
            } else {
              console.log(`⏭️ Skipping autoplay tick - too soon since last transition: ${timeSinceLastTransition}ms < ${minTimeBetweenTransitions}ms`);
            }
          } else {
            // First transition, no timing restriction
            goToNextImage();
          }
        } else {
          console.log(`⏭️ Skipping autoplay tick - transition in progress: ${isTransitioningRef.current}, no images: ${imagePoolRef.current.length === 0}`);
        }
      }, intervalSeconds * 1000);
      console.log('▶️ Autoplay started with interval ID:', intervalRef.current);
    }
  }, [currentImage, intervalSeconds, goToNextImage]);

  // No cleanup needed with single image approach

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex items-center justify-center"
      onMouseMove={handleMouseMove}
    >
      {/* Current Image */}
      {currentDisplayImage && (
        <img
          src={currentDisplayImage}
          alt="Screensaver"
          className={`absolute max-w-full max-h-full object-contain transition-opacity duration-1000 ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setCurrentImageLoaded(true)}
          onError={() => setCurrentImageLoaded(true)}
        />
      )}

      {/* Next Image (for crossfade) */}
      {nextDisplayImage && showNextImage && nextImageReady && (
        <img
          src={nextDisplayImage}
          alt="Screensaver"
          className={`absolute max-w-full max-h-full object-contain transition-opacity duration-1000 ease-in-out ${
            nextImageVisible ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setCurrentImageLoaded(true)}
          onError={() => setCurrentImageLoaded(true)}
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
              {currentImage && <div className="text-xs mt-1">Current: {currentImage.split('/').pop()}</div>}
              {isTransitioning && (
                <div className="text-xs mt-1 text-yellow-300">
                  🔄 Crossfading...
                </div>
              )}
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
          {/* Desktop Controls */}
          <div className="hidden sm:block">
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
                {isCastConnected && (
                  <div className="text-xs text-green-400 mt-1">
                    📺 Casting to {castDeviceName}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="sm:hidden">
            <div className="bg-black bg-opacity-50 backdrop-blur-sm text-white px-4 py-3 rounded-lg">
              {/* Top Row - Main Controls */}
              <div className="flex items-center justify-center space-x-4 mb-3">
                <button
                  onClick={togglePlayback}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors text-lg cursor-pointer"
                  title="Play/Pause (SPACE)"
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>

                <button
                  onClick={goToNextImage}
                  className="bg-slate-600 hover:bg-slate-700 text-white p-2 rounded-lg transition-colors text-lg cursor-pointer"
                  title="Next Image (→)"
                >
                  ⏭️
                </button>

                <div className="border-l border-slate-600 pl-4">
                  <CastButton
                    currentImage={currentImage || undefined}
                    imagePool={imagePool}
                    onCastStatusChange={handleCastStatusChange}
                  />
                </div>
              </div>

              {/* Bottom Row - Interval Controls */}
              <div className="flex flex-col items-center space-y-2">
                <span className="text-xs font-medium">Interval:</span>
                <div className="flex items-center space-x-1">
                  {[2, 5, 10, 15, 30].map(seconds => (
                    <button
                      key={seconds}
                      onClick={() => handleIntervalChange(seconds)}
                      className={`px-2 py-1 rounded text-xs transition-colors cursor-pointer ${
                        intervalSeconds === seconds
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-600 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {seconds}s
                    </button>
                  ))}
                </div>
                
                {/* Status */}
                <div className="text-xs text-slate-300 text-center">
                  {isPlaying ? `Auto-playing every ${intervalSeconds}s` : 'Paused'}
                  {isCastConnected && (
                    <div className="text-xs text-green-400 mt-1">
                      📺 Casting to {castDeviceName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="absolute bottom-6 right-6 hidden sm:block">
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