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
  const [autoCastEnabled, setAutoCastEnabled] = useState(false);
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

  // Auto-cast current image when it changes (if connected and auto-cast is enabled)
  useEffect(() => {
    if (isConnected && currentImage && autoCastEnabled) {
      console.log('📺 Auto-casting new image to', deviceName);
      const castImage = async () => {
        try {
          const castImageData: CastImage = {
            url: currentImage,
            title: `Image from RoboDickV2`,
            subtitle: `Image ${imagePool.indexOf(currentImage) + 1} of ${imagePool.length}`
          };
          
          await castManager.castImage(castImageData);
        } catch (error) {
          console.error('❌ Auto-cast failed:', error);
        }
      };
      
      // Small delay to ensure smooth transitions
      const timeout = setTimeout(castImage, 500);
      return () => clearTimeout(timeout);
    }
  }, [currentImage, isConnected, deviceName, imagePool, autoCastEnabled]);

  const initializeCast = async () => {
    try {
      setIsInitializing(true);
      const initialized = await castManager.initialize();
      
      if (initialized) {
        // Check initial states
        const initialAvailable = castManager.isCastAvailable();
        const initialConnected = castManager.isConnected();
        const initialDeviceName = castManager.getReceiverName();
        
        console.log('📊 Initial Cast states:');
        console.log('  - Available:', initialAvailable);
        console.log('  - Connected:', initialConnected);
        console.log('  - Device:', initialDeviceName || 'None');
        
        setIsCastAvailable(initialAvailable);
        setIsConnected(initialConnected);
        setDeviceName(initialDeviceName);
        
        // Create the native Cast button
        if (castButtonRef.current && window.cast) {
          const castButton = document.createElement('google-cast-launcher-element');
          castButtonRef.current.appendChild(castButton);
        }
        
        // Set up periodic checks for device availability (in case devices come online later)
        const checkDevices = () => {
          const available = castManager.isCastAvailable();
          const connected = castManager.isConnected();
          const deviceName = castManager.getReceiverName();
          
          if (available !== isCastAvailable) {
            // console.log('📡 Cast availability changed:', available);
            setIsCastAvailable(available);
          }
          
          if (connected !== isConnected) {
            console.log('📺 Cast connection changed:', connected);
            setIsConnected(connected);
          }
          
          if (deviceName !== deviceName) {
            setDeviceName(deviceName);
          }
        };
        
        // Check every 3 seconds for the first 30 seconds, then every 10 seconds
        const shortInterval = setInterval(checkDevices, 3000);
        setTimeout(() => {
          clearInterval(shortInterval);
          const longInterval = setInterval(checkDevices, 10000);
          
          // Clear after 5 minutes
          setTimeout(() => clearInterval(longInterval), 300000);
        }, 30000);
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
        // If connected, toggle auto-cast mode
        setAutoCastEnabled(!autoCastEnabled);
        console.log('📺 Auto-cast', !autoCastEnabled ? 'enabled' : 'disabled');
        
        // If enabling auto-cast, cast the current image immediately
        if (!autoCastEnabled && currentImage) {
          const castImage: CastImage = {
            url: currentImage,
            title: `Image from RoboDickV2`,
            subtitle: `Image ${imagePool.indexOf(currentImage) + 1} of ${imagePool.length}`
          };
          
          const success = await castManager.castImage(castImage);
          if (success) {
            console.log('📺 Initial image cast to', deviceName);
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
      console.log('🔌 User requested disconnect');
      
      // Immediately update UI to prevent multiple clicks
      setIsConnected(false);
      setDeviceName('');
      setAutoCastEnabled(false); // Disable auto-cast when disconnecting
      
      // End the Cast session
      await castManager.endSession();
      
      // Double-check state after disconnect
      setTimeout(() => {
        const stillConnected = castManager.isConnected();
        if (stillConnected) {
          console.warn('⚠️ Still showing as connected after disconnect attempt');
        } else {
          console.log('✅ Disconnect confirmed');
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to disconnect:', error);
      // Ensure UI is still updated even if disconnect failed
      setIsConnected(false);
      setDeviceName('');
      setAutoCastEnabled(false);
    }
  };

  const handleRefreshDevices = async () => {
    try {
      console.log('🔄 Manually refreshing Cast devices...');
      setIsInitializing(true);
      
      // Force device discovery
      await castManager.forceDeviceDiscovery();
      
      // Check for devices after discovery
      setTimeout(() => {
        const available = castManager.isCastAvailable();
        const connected = castManager.isConnected();
        const deviceName = castManager.getReceiverName();
        
        console.log('📊 After refresh:');
        console.log('  - Available:', available);
        console.log('  - Connected:', connected);
        console.log('  - Device:', deviceName || 'None');
        
        setIsCastAvailable(available);
        setIsConnected(connected);
        setDeviceName(deviceName);
        setIsInitializing(false);
      }, 2000);
      
    } catch (error) {
      console.error('❌ Failed to refresh devices:', error);
      setIsInitializing(false);
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
      <div className="flex items-center space-x-3">
        <div className="text-sm text-slate-400">
          📺 No Cast devices found
        </div>
        <button
          onClick={handleRefreshDevices}
          className="text-xs text-blue-400 hover:text-blue-300 underline cursor-pointer"
          title="Refresh Cast devices"
          disabled={isInitializing}
        >
          🔄 Refresh
        </button>
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
            ? autoCastEnabled 
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
        title={isConnected 
          ? autoCastEnabled 
            ? `Auto-casting to ${deviceName} (click to disable)` 
            : `Connected to ${deviceName} (click to enable auto-cast)`
          : 'Connect to Cast device'
        }
      >
        <span className="text-lg">📺</span>
        <span className="text-sm">
          {isConnected 
            ? autoCastEnabled 
              ? 'Auto-Casting' 
              : 'Enable Auto-Cast'
            : 'Cast'
          }
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