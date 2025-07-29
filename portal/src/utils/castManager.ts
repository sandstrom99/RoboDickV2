// Cast Manager for Google Cast API integration
declare global {
  interface Window {
    cast: any;
    chrome: any;
  }
}

export interface CastImage {
  url: string;
  title: string;
  subtitle?: string;
}

export class CastManager {
  private castContext: any = null;
  private remotePlayer: any = null;
  private remotePlayerController: any = null;
  private isInitialized = false;
  private currentSession: any = null;

  // Convert localhost URLs to network-accessible URLs for Cast
  private makeCastableURL(url: string): string {
    const networkIP = '192.168.0.199'; // Your actual network IP
    
    // Replace localhost/127.0.0.1 with network IP
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      const castableURL = url.replace(/localhost|127\.0\.0\.1/g, networkIP);
      console.log(`🔄 Converted for Cast: ${url} → ${castableURL}`);
      return castableURL;
    }
    
    // If relative URL, construct full URL with network IP
    if (url.startsWith('/')) {
      const protocol = window.location.protocol;
      const castableURL = `${protocol}//${networkIP}:3000${url}`;
      console.log(`🔄 Made absolute for Cast: ${url} → ${castableURL}`);
      return castableURL;
    }
    
    return url;
  }

  // Initialize Google Cast
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      // Wait for Cast API to load
      await this.waitForCastApi();

      // Check if Cast API is properly loaded
      if (!window.cast || !window.cast.framework || !window.chrome || !window.chrome.cast) {
        console.error('❌ Cast API not properly loaded');
        return false;
      }

      console.log('🔧 Configuring Cast context...');
      
      // Configure Cast context
      const castContext = window.cast.framework.CastContext.getInstance();
      castContext.setOptions({
        receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.PAGE_SCOPED
      });

      console.log('🎯 Cast context configured with receiver ID:', window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);

      // Set up remote player
      this.remotePlayer = new window.cast.framework.RemotePlayer();
      this.remotePlayerController = new window.cast.framework.RemotePlayerController(this.remotePlayer);

      // Listen for remote player events
      this.remotePlayerController.addEventListener(
        window.cast.framework.RemotePlayerEventType.IS_CONNECTED_CHANGED,
        () => {
          const isConnected = this.remotePlayer.isConnected;
          console.log('📺 Remote player connection changed:', isConnected);
        }
      );

      this.remotePlayerController.addEventListener(
        window.cast.framework.RemotePlayerEventType.IS_MEDIA_LOADED_CHANGED,
        () => {
          const isLoaded = this.remotePlayer.isMediaLoaded;
          console.log('📺 Media loaded status changed:', isLoaded);
          if (isLoaded) {
            console.log('📺 Media title:', this.remotePlayer.mediaInfo?.metadata?.title || 'Unknown');
          }
        }
      );

      // Listen for session state changes
      castContext.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event: any) => this.onSessionStateChanged(event)
      );

      // Listen for Cast state changes (device availability)
      castContext.addEventListener(
        window.cast.framework.CastContextEventType.CAST_STATE_CHANGED,
        (event: any) => {
          const castState = event.castState;
          console.log('📡 Cast state changed:', castState);
          
          switch (castState) {
            case window.cast.framework.CastState.NO_DEVICES_AVAILABLE:
              console.log('❌ No Cast devices available');
              break;
            case window.cast.framework.CastState.NOT_CONNECTED:
              console.log('🔌 Cast devices available but not connected');
              break;
            case window.cast.framework.CastState.CONNECTING:
              console.log('🔄 Connecting to Cast device...');
              break;
            case window.cast.framework.CastState.CONNECTED:
              console.log('✅ Connected to Cast device');
              break;
          }
        }
      );

      this.castContext = castContext;
      this.isInitialized = true;
      
      // Log initial Cast state
      const initialState = castContext.getCastState();
      console.log('📡 Initial Cast state:', initialState);
      console.log('🔍 Checking for available devices...');
      
      // Force device discovery
      setTimeout(() => {
        const currentState = castContext.getCastState();
        console.log('📡 Cast state after 2 seconds:', currentState);
        console.log('📱 Available devices:', this.isCastAvailable());
      }, 2000);
      
      console.log('✅ Cast API initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Cast API:', error);
      return false;
    }
  }

  // Wait for Cast API to be available
  private waitForCastApi(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log('🔍 Checking for Cast API...');
      console.log('window.cast:', !!window.cast);
      console.log('window.chrome:', !!window.chrome);
      
      if (window.cast && window.cast.framework && window.chrome && window.chrome.cast) {
        console.log('✅ Cast API already available');
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 100; // 10 seconds
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        // Log every 10 attempts (every second)
        if (attempts % 10 === 0) {
          console.log(`🔄 Cast API check attempt ${attempts}/100`);
          console.log('  - window.cast:', !!window.cast);
          console.log('  - window.cast.framework:', !!(window.cast && window.cast.framework));
          console.log('  - window.chrome:', !!window.chrome);
          console.log('  - window.chrome.cast:', !!(window.chrome && window.chrome.cast));
        }
        
        if (window.cast && window.cast.framework && window.chrome && window.chrome.cast) {
          console.log('✅ Cast API detected after', attempts, 'attempts');
          clearInterval(checkInterval);
          resolve();
        } else if (attempts >= maxAttempts) {
          console.error('❌ Cast API timeout after', attempts, 'attempts');
          console.log('Final state:');
          console.log('  - window.cast:', !!window.cast);
          console.log('  - window.cast.framework:', !!(window.cast && window.cast.framework));
          console.log('  - window.chrome:', !!window.chrome);
          console.log('  - window.chrome.cast:', !!(window.chrome && window.chrome.cast));
          clearInterval(checkInterval);
          reject(new Error('Cast API not available after 10 seconds'));
        }
      }, 100);
    });
  }

  // Handle session state changes
  private onSessionStateChanged(event: any) {
    try {
      const session = this.castContext.getCurrentSession();
      const eventType = event.sessionState;
      
      console.log('📡 Session state changed:', eventType);
      
      // Handle different session states
      switch (eventType) {
        case window.cast.framework.SessionState.SESSION_STARTING:
          console.log('🔄 Cast session starting...');
          break;
          
        case window.cast.framework.SessionState.SESSION_STARTED:
          this.currentSession = session;
          if (session) {
            const deviceName = typeof session.getReceiverFriendlyName === 'function' 
              ? session.getReceiverFriendlyName() 
              : 'Unknown Device';
            console.log('🔗 Connected to Cast device:', deviceName);
            console.log('📺 Cast session established successfully');
          }
          break;
          
        case window.cast.framework.SessionState.SESSION_ENDING:
          console.log('🔌 Cast session ending...');
          break;
          
        case window.cast.framework.SessionState.SESSION_ENDED:
          console.log('🔌 Disconnected from Cast device');
          this.currentSession = null;
          break;
          
        default:
          // Handle any other states
          this.currentSession = session;
          break;
      }
    } catch (error) {
      console.error('❌ Error in session state change handler:', error);
      this.currentSession = null;
    }
  }

  // Check if Cast is available
  isCastAvailable(): boolean {
    if (!this.isInitialized || !this.castContext) return false;
    const castState = this.castContext.getCastState();
    const isAvailable = castState !== window.cast.framework.CastState.NO_DEVICES_AVAILABLE;
    console.log(`📡 Cast availability check: state=${castState}, available=${isAvailable}`);
    return isAvailable;
  }

  // Force device discovery
  async forceDeviceDiscovery(): Promise<void> {
    try {
      if (!this.isInitialized || !this.castContext) {
        console.warn('⚠️ Cast not initialized, cannot force discovery');
        return;
      }
      
      console.log('🔍 Forcing Cast device discovery...');
      
      // Trigger device discovery by temporarily requesting a session (this will scan for devices)
      // We'll catch the error if user cancels, but the scan will still happen
      try {
        await this.castContext.requestSession();
      } catch (error) {
        // User cancelled or no devices - this is expected, the scan still happened
        console.log('📡 Device discovery scan completed (user may have cancelled)');
      }
      
      // Check state after discovery attempt
      setTimeout(() => {
        const newState = this.castContext.getCastState();
        console.log('📡 Cast state after forced discovery:', newState);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Failed to force device discovery:', error);
    }
  }

  // Check if connected to a Cast device
  isConnected(): boolean {
    try {
      // First check our stored session
      if (this.currentSession) {
        return true;
      }
      
      // Fallback: check current session from cast context
      if (this.castContext) {
        const session = this.castContext.getCurrentSession();
        if (session) {
          // Update our stored session if we found one
          this.currentSession = session;
          return true;
        }
      }
      
      // Also check cast state
      if (this.castContext) {
        const castState = this.castContext.getCastState();
        return castState === window.cast.framework.CastState.CONNECTED;
      }
    } catch (error) {
      console.warn('⚠️ Error checking connection status:', error);
    }
    
    return false;
  }

  // Get the Cast button element (handled by Cast SDK)
  getCastButtonElement(): HTMLElement | null {
    return document.querySelector('google-cast-launcher-element');
  }

  // Cast an image to the connected device
  async castImage(image: CastImage): Promise<boolean> {
    try {
      // Validate session
      if (!this.currentSession) {
        console.warn('⚠️ No active Cast session');
        return false;
      }

      // Double-check session validity
      if (!this.isConnected()) {
        console.warn('⚠️ Cast session appears to be disconnected');
        return false;
      }

      // Convert URL to be accessible by Chromecast devices
      const imageUrl = this.makeCastableURL(image.url);

      // Detect content type from URL extension
      const getContentType = (url: string): string => {
        const extension = url.split('.').pop()?.toLowerCase();
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            return 'image/jpeg';
          case 'png':
            return 'image/png';
          case 'gif':
            return 'image/gif';
          case 'webp':
            return 'image/webp';
          case 'bmp':
            return 'image/bmp';
          case 'svg':
            return 'image/svg+xml';
          default:
            return 'image/jpeg'; // Default fallback
        }
      };

      const contentType = getContentType(imageUrl);
      console.log(`📺 Casting image to Chromecast:`);
      console.log(`   Original URL: ${image.url}`);
      console.log(`   Cast URL: ${imageUrl}`);
      console.log(`   Content Type: ${contentType}`);

      const mediaInfo = new window.chrome.cast.media.MediaInfo(imageUrl, contentType);
      mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = image.title;
      mediaInfo.metadata.subtitle = image.subtitle || '';
      
      // Add image as metadata with absolute URL
      mediaInfo.metadata.images = [{
        url: imageUrl
      }];

      // Add CORS headers for media requests
      mediaInfo.customData = {
        crossOrigin: 'anonymous'
      };

      const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
      request.autoplay = true;

      console.log('📺 Sending media to Cast device...');
      const result = await this.currentSession.loadMedia(request);
      
      if (result && result.errorCode) {
        console.error('❌ Cast error:', result.errorCode, result.errorDescription);
        return false;
      }
      
      console.log('📺 Image cast successfully:', image.title);
      return true;
    } catch (error) {
      console.error('❌ Failed to cast image:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('LOAD_FAILED')) {
          console.error('❌ Media load failed - check image URL and format');
        } else if (error.message.includes('SESSION_ERROR')) {
          console.error('❌ Cast session error - try reconnecting');
        }
      }
      
      return false;
    }
  }

  // Cast a slideshow (series of images)
  async castSlideshow(images: CastImage[], interval: number = 5000): Promise<boolean> {
    try {
      if (!this.currentSession) {
        console.warn('⚠️ No active Cast session');
        return false;
      }

      // For slideshow, we'll send a custom message to a custom receiver
      // For now, we'll cast the first image and handle slideshow logic locally
      if (images.length > 0) {
        await this.castImage(images[0]);
        
        // TODO: Implement custom receiver for slideshow functionality
        console.log('🎬 Slideshow cast initiated with', images.length, 'images');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to cast slideshow:', error);
      return false;
    }
  }

  // Request a Cast session
  async requestSession(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      await this.castContext.requestSession();
      return true;
    } catch (error) {
      console.error('❌ Failed to request Cast session:', error);
      return false;
    }
  }

  // End the current Cast session
  async endSession(): Promise<void> {
    try {
      console.log('🔌 Ending Cast session...');
      
      if (this.currentSession) {
        // End the session and stop media
        await this.currentSession.endSession(true);
        this.currentSession = null;
      }
      
      // Also ensure the cast context is properly reset
      if (this.castContext) {
        const currentSession = this.castContext.getCurrentSession();
        if (currentSession) {
          await currentSession.endSession(true);
        }
      }
      
      console.log('✅ Cast session ended successfully');
    } catch (error) {
      console.error('❌ Failed to end Cast session:', error);
      // Force clear the session even if ending failed
      this.currentSession = null;
    }
  }

  // Get receiver friendly name
  getReceiverName(): string {
    try {
      if (this.currentSession && typeof this.currentSession.getReceiverFriendlyName === 'function') {
        return this.currentSession.getReceiverFriendlyName();
      }
      
      // Fallback: try to get from current cast context
      if (this.castContext) {
        const session = this.castContext.getCurrentSession();
        if (session && typeof session.getReceiverFriendlyName === 'function') {
          return session.getReceiverFriendlyName();
        }
      }
    } catch (error) {
      console.warn('⚠️ Error getting receiver name:', error);
    }
    
    return '';
  }
}

// Export singleton instance
export const castManager = new CastManager(); 