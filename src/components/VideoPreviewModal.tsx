import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Monitor, Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title: string;
  isCompatible?: boolean;
  compatibilityError?: string;
  shouldPlay?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

interface VideoAspectRatio {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}

export default function VideoPreviewModal({ isOpen, onClose, videoSrc, title, isCompatible = true, compatibilityError, shouldPlay, onPlayStateChange }: VideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  console.log('VideoPreviewModal: Render with props', { shouldPlay, isPlaying, isOpen });
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect video aspect ratio (simplified since compatibility is checked upfront)
  const detectAspectRatio = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    if (width && height) {
      const ratio = width / height;
      let orientation: 'landscape' | 'portrait' | 'square';
      
      if (ratio > 1.1) {
        orientation = 'landscape';
      } else if (ratio < 0.9) {
        orientation = 'portrait';
      } else {
        orientation = 'square';
      }
      
      setAspectRatio({ width, height, aspectRatio: ratio, orientation });
    }
  };

  // Auto-hide controls using ref to avoid dependency issues
  const resetControlsTimer = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Handle ESC key to close modal and cleanup
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
      // Start controls timer when modal opens
      resetControlsTimer();
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    };
  }, [isOpen, onClose, resetControlsTimer]);

  // Reset loading state when modal opens or video source changes
  useEffect(() => {
    if (isOpen && videoSrc) {
      console.log('VideoPreviewModal: Starting to load new video:', videoSrc);
      setIsLoading(true);
      setIsVideoReady(false);
      setVideoError(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setAspectRatio(null);
    }
  }, [isOpen, videoSrc]);

  // Handle external play/pause control
  useEffect(() => {
    console.log('VideoPreviewModal: External control effect triggered', { 
      hasVideoRef: !!videoRef.current, 
      isVideoReady, 
      shouldPlay, 
      isPlaying 
    });
    
    if (!videoRef.current) {
      console.log('VideoPreviewModal: No video ref yet');
      return;
    }
    
    if (!isVideoReady) {
      console.log('VideoPreviewModal: Video not ready yet');
      return;
    }

    const video = videoRef.current;
    console.log('VideoPreviewModal: External control processing', { shouldPlay, isPlaying });
    
    if (shouldPlay !== undefined) {
      if (shouldPlay && !isPlaying) {
        console.log('VideoPreviewModal: Attempting to play video');
        video.play().then(() => {
          console.log('VideoPreviewModal: Video play succeeded');
          setIsPlaying(true);
          onPlayStateChange?.(true);
        }).catch((error) => {
          console.error('VideoPreviewModal: Video play failed', error);
        });
      } else if (!shouldPlay && isPlaying) {
        console.log('VideoPreviewModal: Attempting to pause video');
        video.pause();
        console.log('VideoPreviewModal: Video pause succeeded');
        setIsPlaying(false);
        onPlayStateChange?.(false);
      }
    }
  }, [shouldPlay, isVideoReady, isPlaying]);

  const handlePause = () => {
    setIsPlaying(false);
    onPlayStateChange?.(false);
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Handle when video element starts playing (simplified)
  const handlePlay = () => {
    setIsPlaying(true);
    onPlayStateChange?.(true);
    resetControlsTimer();
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      setDuration(video.duration);
      detectAspectRatio();
      
      // Small delay to ensure smooth transition from loading to video
      setTimeout(() => {
        setIsLoading(false);
        setIsVideoReady(true);
        setVideoError(null);
      }, 100);
    }
  };


  const detectVideoFormat = (src: string) => {
    const url = src.toLowerCase();
    if (url.includes('.prores') || url.includes('prores')) return 'ProRes';
    if (url.includes('.mov')) return 'MOV (QuickTime)';
    if (url.includes('.avi')) return 'AVI';
    if (url.includes('.mkv')) return 'MKV';
    if (url.includes('.webm')) return 'WebM';
    if (url.includes('.mp4')) return 'MP4';
    return 'Unknown format';
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.currentTarget;
    const videoFormat = detectVideoFormat(videoSrc);
    let errorMessage = 'Unknown video error';
    let detailedMessage = '';
    
    if (video.error) {
      switch (video.error.code) {
        case video.error.MEDIA_ERR_ABORTED:
          errorMessage = 'Video loading was aborted';
          detailedMessage = 'The video download was interrupted.';
          break;
        case video.error.MEDIA_ERR_NETWORK:
          errorMessage = 'Network error while loading video';
          detailedMessage = 'Check your internet connection and try again.';
          break;
        case video.error.MEDIA_ERR_DECODE:
          errorMessage = `Cannot decode ${videoFormat} video`;
          detailedMessage = videoFormat === 'ProRes' 
            ? 'ProRes videos are not supported in web browsers. Try opening in a native video player or convert to MP4.'
            : 'This video codec is not supported by your browser.';
          break;
        case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = `${videoFormat} format not supported`;
          detailedMessage = videoFormat === 'ProRes'
            ? 'ProRes is a professional codec not supported by web browsers. Use a video editing app or convert to MP4.'
            : 'This video format is not supported by your browser.';
          break;
        default:
          errorMessage = `Video error (code: ${video.error.code})`;
          detailedMessage = `Format detected: ${videoFormat}`;
      }
    }
    
    console.error('[VideoPlayer] Video error:', errorMessage, video.error, 'Format:', videoFormat);
    setVideoError(`${errorMessage}${detailedMessage ? ` - ${detailedMessage}` : ''}`);
    setIsLoading(false);
    setIsVideoReady(false);
  };

  const handleCanPlay = () => {
    setVideoError(null);
  };

  const handleWaiting = () => {
  };

  const retryVideo = async () => {
    if (!videoRef.current || !videoSrc) return;
    
    setIsRetrying(true);
    setVideoError(null);
    setIsLoading(true);
    setIsVideoReady(false);
    
    try {
      // Force reload the video
      const video = videoRef.current;
      video.load();
      
      // Wait a bit before trying to play
      setTimeout(() => {
        setIsRetrying(false);
      }, 1000);
    } catch (error) {
      console.error('[VideoPlayer] Retry failed:', error);
      setIsRetrying(false);
      setVideoError('Retry failed');
    }
  };

  const handleVolumeChange = () => {
    if (videoRef.current) {
      setVolume(videoRef.current.volume);
      setIsMuted(videoRef.current.muted);
    }
  };

  // Control handlers
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const seekTime = (parseFloat(e.target.value) / 100) * duration;
    videoRef.current.currentTime = seekTime;
  };

  const handleVolumeSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVolume = parseFloat(e.target.value) / 100;
    videoRef.current.volume = newVolume;
    if (newVolume === 0) {
      videoRef.current.muted = true;
    } else if (videoRef.current.muted) {
      videoRef.current.muted = false;
    }
  };

  const restart = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate container dimensions based on aspect ratio (smaller sizes)
  const getVideoContainerStyle = () => {
    if (!aspectRatio) {
      return { aspectRatio: '16 / 9', maxWidth: '70vw', maxHeight: '60vh' };
    }

    const { orientation, aspectRatio: ratio } = aspectRatio;
    
    if (orientation === 'portrait') {
      // Portrait videos: limit height and let width adjust (smaller)
      return {
        maxHeight: '70vh',
        maxWidth: `calc(70vh * ${ratio})`,
        aspectRatio: `${aspectRatio.width} / ${aspectRatio.height}`
      };
    } else {
      // Landscape and square: limit width and let height adjust (smaller)
      return {
        maxWidth: '70vw',
        maxHeight: `calc(70vw / ${ratio})`,
        aspectRatio: `${aspectRatio.width} / ${aspectRatio.height}`
      };
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && videoSrc) {
      setIsVideoReady(false);
      setIsLoading(true);
      setIsRetrying(false);
      setAspectRatio(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      
      // Check compatibility immediately
      if (!isCompatible && compatibilityError) {
        setVideoError(compatibilityError);
        setIsLoading(false);
        setIsVideoReady(false);
      } else {
        setVideoError(null);
      }
      
    }
  }, [isOpen, videoSrc, isCompatible, compatibilityError]);

  // Don't render anything until we have a video source
  if (!isOpen || !videoSrc) return null;
  
  // Show loading state or error state
  if (isLoading || videoError) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="relative bg-black flex items-center justify-center"
          style={{ width: '400px', height: '300px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-white text-center p-6">
            {videoError ? (
              <>
                <div className="text-red-400 text-2xl mb-4">⚠</div>
                <div className="text-sm font-mono uppercase tracking-wider mb-2">VIDEO ERROR</div>
                <div className="text-xs text-gray-300 mb-4 max-w-md text-center leading-relaxed">INCOMPATIBLE FORMAT</div>
                <div className="text-xs text-gray-400">
                  Convert to H.264
                </div>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                <div className="text-sm font-mono uppercase tracking-wider">
                  {isRetrying ? 'RETRYING VIDEO...' : 'LOADING VIDEO...'}
                </div>
              </>
            )}
          </div>
          {/* Hidden video for metadata loading - only for compatible videos */}
          {isCompatible && (
            <video
              ref={videoRef}
              src={videoSrc}
              style={{ display: 'none' }}
              onLoadedMetadata={handleLoadedMetadata}
              onError={handleVideoError}
              onCanPlay={handleCanPlay}
              onWaiting={handleWaiting}
              preload="metadata"
              crossOrigin="anonymous"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="relative bg-black" 
        style={getVideoContainerStyle()}
        onClick={(e) => e.stopPropagation()}
        onMouseMove={resetControlsTimer}
      >
        {/* Video element - only for compatible videos, hidden during loading */}
        {isCompatible ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className={`w-full h-full object-contain ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onVolumeChange={handleVolumeChange}
            onError={handleVideoError}
            onCanPlay={handleCanPlay}
            onWaiting={handleWaiting}
            onClick={togglePlayPause}
            crossOrigin="anonymous"
            autoPlay
            playsInline
          >
            <source src={videoSrc} type="video/mp4" />
            <source src={videoSrc} type="video/webm" />
            <source src={videoSrc} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <div className="text-white text-center">
              <div className="text-red-400 text-4xl mb-4">⚠</div>
              <div className="text-sm font-mono uppercase tracking-wider mb-2">INCOMPATIBLE FORMAT</div>
              <div className="text-xs text-gray-300">{compatibilityError || 'Video format not supported'}</div>
            </div>
          </div>
        )}

        {/* Loading overlay - shown while video is loading */}
        {isLoading && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
            <div className="text-white text-center">
              {/* Spinner animation */}
              <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
              <div className="text-sm font-mono uppercase tracking-wider">LOADING VIDEO...</div>
            </div>
          </div>
        )}

        {/* Error overlay - shown when video fails to load */}
        {videoError && !isLoading && (
          <div className="absolute inset-0 bg-black flex items-center justify-center z-40">
            <div className="text-white text-center max-w-md p-6">
              <div className="text-red-400 text-4xl mb-4">⚠</div>
              <div className="text-sm font-mono uppercase tracking-wider mb-2">VIDEO ERROR</div>
              <div className="text-xs text-gray-300 mb-4">{videoError}</div>
              <button 
                onClick={retryVideo}
                disabled={isRetrying}
                className="px-4 py-2 bg-white text-black font-mono text-xs uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isRetrying ? 'RETRYING...' : 'RETRY'}
              </button>
            </div>
          </div>
        )}

        {/* Custom Controls Overlay - hidden during loading */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/70 transition-opacity duration-300 ${
            showControls && !isLoading && !videoError ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-mono uppercase font-bold tracking-wider">{title}</span>
                {aspectRatio && (
                  <span className="text-xs opacity-75">
                    {aspectRatio.width}x{aspectRatio.height} ({aspectRatio.orientation})
                  </span>
                )}
              </div>
              <button 
                onClick={onClose}
                className="hover:bg-white hover:text-black transition-colors p-2 border hover:border-black"
                style={{
                  color: document.documentElement.classList.contains('dark') ? '#00ff00' : '#ffffff',
                  borderColor: document.documentElement.classList.contains('dark') ? '#00ff00' : '#ffffff'
                }}
              >
                <X className="w-4 h-4" style={{ color: 'inherit' }} />
              </button>
            </div>
          </div>

          {/* Center play button (when paused) */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button 
                onClick={togglePlayPause}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Play className="w-16 h-16" fill="currentColor" />
              </button>
            </div>
          )}

          {/* Bottom controls */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            {/* Progress bar */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max="100"
                value={duration ? (currentTime / duration) * 100 : 0}
                onChange={handleSeek}
                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer video-progress"
              />
            </div>

            {/* Control buttons */}
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                <button onClick={restart} className="hover:text-gray-300 transition-colors">
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button onClick={togglePlayPause} className="hover:text-gray-300 transition-colors">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" fill="currentColor" />}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={toggleMute} className="hover:text-gray-300 transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume * 100}
                    onChange={handleVolumeSlider}
                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer video-volume"
                  />
                </div>
                <div className="text-sm font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}