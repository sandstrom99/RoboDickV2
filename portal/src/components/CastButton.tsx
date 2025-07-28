import React, { useEffect, useState, useRef } from 'react';
import { castManager, type CastImage } from '../utils/castManager';

interface Props {
  currentImage?: string;
  imagePool?: string[];
  onCastStatusChange?: (isConnected: boolean, deviceName?: string) => void;
}

export function CastButton({ currentImage, imagePool = [], onCastStatusChange }: Props) {
  const [isCastAvailable, setIsCastAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const castButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeCast();
  }, []);

  useEffect(() => {
    // Notify parent of cast status changes
    if (onCastStatusChange) {
      onCastStatusChange(isConnected, deviceName);
    }
  }, [isConnected, deviceName, onCastStatusChange]);

  const initializeCast = async () => {
    try {
      setIsInitializing(true);
      const initialized = await castManager.initialize();
      
      if (initialized) {
        setIsCastAvailable(castManager.isCastAvailable());
        setIsConnected(castManager.isConnected());
        setDeviceName(castManager.getReceiverName());
        
        // Create the native Cast button
        if (castButtonRef.current && window.cast) {
          const castButton = document.createElement('google-cast-launcher-element');
          castButtonRef.current.appendChild(castButton);
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize Cast:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCastClick = async () => {
    try {
      if (isConnected) {
        // If connected, cast current image
        if (currentImage) {
          const castImage: CastImage = {
            url: currentImage,
            title: `Image from RoboDickV2`,
            subtitle: `Image ${imagePool.indexOf(currentImage) + 1} of ${imagePool.length}`
          };
          
          const success = await castManager.castImage(castImage);
          if (success) {
            console.log('📺 Image cast to', deviceName);
          }
        }
      } else {
        // If not connected, request session
        await castManager.requestSession();
      }
    } catch (error) {
      console.error('❌ Cast operation failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await castManager.endSession();
      setIsConnected(false);
      setDeviceName('');
    } catch (error) {
      console.error('❌ Failed to disconnect:', error);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        <span className="text-sm text-slate-300">Loading Cast...</span>
      </div>
    );
  }

  if (!isCastAvailable) {
    return (
      <div className="text-sm text-slate-400">
        📺 No Cast devices found
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Custom Cast Button */}
      <button
        onClick={handleCastClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer ${
          isConnected
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        title={isConnected ? `Cast to ${deviceName}` : 'Connect to Cast device'}
      >
        <span className="text-lg">📺</span>
        <span className="text-sm">
          {isConnected ? 'Cast Image' : 'Cast'}
        </span>
      </button>

      {/* Connection Status */}
      {isConnected && (
        <>
          <div className="text-sm text-slate-300">
            Connected to <span className="font-medium text-white">{deviceName}</span>
          </div>
          
          <button
            onClick={handleDisconnect}
            className="text-red-400 hover:text-red-300 text-sm underline cursor-pointer"
            title="Disconnect from Cast device"
          >
            Disconnect
          </button>
        </>
      )}

      {/* Hidden native Cast button (for SDK integration) */}
      <div ref={castButtonRef} className="hidden" />
    </div>
  );
} 