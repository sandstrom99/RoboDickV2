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

  // Initialize Google Cast
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) return true;

      // Wait for Cast API to load
      await this.waitForCastApi();

      // Configure Cast context
      const castContext = window.cast.framework.CastContext.getInstance();
      castContext.setOptions({
        receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
        autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      });

      // Set up remote player
      this.remotePlayer = new window.cast.framework.RemotePlayer();
      this.remotePlayerController = new window.cast.framework.RemotePlayerController(this.remotePlayer);

      // Listen for session state changes
      castContext.addEventListener(
        window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        (event: any) => this.onSessionStateChanged(event)
      );

      this.castContext = castContext;
      this.isInitialized = true;
      
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
      if (window.cast && window.cast.framework) {
        resolve();
        return;
      }

      const checkInterval = setInterval(() => {
        if (window.cast && window.cast.framework) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Cast API not available'));
      }, 10000);
    });
  }

  // Handle session state changes
  private onSessionStateChanged(event: any) {
    const session = this.castContext.getCurrentSession();
    this.currentSession = session;
    
    if (session) {
      console.log('🔗 Connected to Cast device:', session.getReceiverFriendlyName());
    } else {
      console.log('🔌 Disconnected from Cast device');
    }
  }

  // Check if Cast is available
  isCastAvailable(): boolean {
    if (!this.isInitialized) return false;
    return this.castContext.getCastState() !== window.cast.framework.CastState.NO_DEVICES_AVAILABLE;
  }

  // Check if connected to a Cast device
  isConnected(): boolean {
    return this.currentSession !== null;
  }

  // Get the Cast button element (handled by Cast SDK)
  getCastButtonElement(): HTMLElement | null {
    return document.querySelector('google-cast-launcher-element');
  }

  // Cast an image to the connected device
  async castImage(image: CastImage): Promise<boolean> {
    try {
      if (!this.currentSession) {
        console.warn('⚠️ No active Cast session');
        return false;
      }

      const mediaInfo = new window.chrome.cast.media.MediaInfo(image.url, 'image/jpeg');
      mediaInfo.metadata = new window.chrome.cast.media.GenericMediaMetadata();
      mediaInfo.metadata.title = image.title;
      mediaInfo.metadata.subtitle = image.subtitle || '';
      
      // Add image as metadata
      mediaInfo.metadata.images = [{
        url: image.url
      }];

      const request = new window.chrome.cast.media.LoadRequest(mediaInfo);
      request.autoplay = true;

      await this.currentSession.loadMedia(request);
      console.log('📺 Image cast successfully:', image.title);
      return true;
    } catch (error) {
      console.error('❌ Failed to cast image:', error);
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
      if (this.currentSession) {
        await this.currentSession.endSession(true);
      }
    } catch (error) {
      console.error('❌ Failed to end Cast session:', error);
    }
  }

  // Get receiver friendly name
  getReceiverName(): string {
    if (this.currentSession) {
      return this.currentSession.getReceiverFriendlyName();
    }
    return '';
  }
}

// Export singleton instance
export const castManager = new CastManager(); 