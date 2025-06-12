import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Monitor, Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title: string;
}

interface VideoAspectRatio {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}

export default function VideoPreviewModal({ isOpen, onClose, videoSrc, title }: VideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isAudioOnly, setIsAudioOnly] = useState(false);
  const [hasCheckedContent, setHasCheckedContent] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect video aspect ratio and check if video track exists
  const detectAspectRatio = () => {
    if (!videoRef.current || hasCheckedContent) return;
    
    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    // Check if this is audio-only (no video dimensions) - treat as unsupported
    if ((!width || !height || width === 0 || height === 0) && video.duration > 0) {
      console.log('[VideoPlayer] Detected audio-only content - treating as unsupported format');
      setVideoError('No video content found - File contains only audio or video codec is not supported');
      setIsLoading(false);
      setIsVideoReady(false);
      setIsAudioOnly(false);
      setAspectRatio(null);
      setHasCheckedContent(true);
      return;
    }
    
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
      setIsAudioOnly(false);
      setHasCheckedContent(true);
      console.log(`[VideoPlayer] Detected aspect ratio: ${width}x${height} (${ratio.toFixed(2)}) - ${orientation}`);
    } else if (!hasCheckedContent) {
      // Video dimensions not available yet, might be audio-only - single delayed check
      if (contentCheckTimeoutRef.current) {
        clearTimeout(contentCheckTimeoutRef.current);
      }
      contentCheckTimeoutRef.current = setTimeout(() => {
        if (videoRef.current && videoRef.current.duration > 0 && !hasCheckedContent) {
          const delayedWidth = videoRef.current.videoWidth;
          const delayedHeight = videoRef.current.videoHeight;
          if (!delayedWidth || !delayedHeight || delayedWidth === 0 || delayedHeight === 0) {
            console.log('[VideoPlayer] Confirmed no video content after delay - treating as unsupported');
            setVideoError('No video content found - File contains only audio or video codec is not supported');
            setIsLoading(false);
            setIsVideoReady(false);
            setIsAudioOnly(false);
            setAspectRatio(null);
          }
          setHasCheckedContent(true);
        }
      }, 2000);
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

  // Video event handlers
  const handlePlay = () => {
    // CRITICAL: Check for video content BEFORE allowing playback
    if (videoRef.current) {
      const video = videoRef.current;
      
      // If no video dimensions at play time, stop immediately and show error
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('[VideoPlayer] No video dimensions at play start - blocking playback');
        video.pause();
        video.currentTime = 0; // Reset to beginning
        setVideoError('No video content found - File contains only audio');
        setIsPlaying(false);
        setIsLoading(false);
        setIsVideoReady(false);
        setHasCheckedContent(true);
        return;
      }
    }
    
    setIsPlaying(true);
    resetControlsTimer();
    
    // Schedule immediate canvas-based content check for files that report dimensions but show black
    if (!hasCheckedContent) {
      setTimeout(() => {
        if (videoRef.current && !hasCheckedContent && !videoError && isPlaying) {
          checkForActualVideoFrames();
        }
      }, 100); // Check very soon after play starts
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
      controlsTimeoutRef.current = null;
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      setCurrentTime(video.currentTime);
      
      // Additional safety check: if video is playing but has no visual content, stop it
      if (video.currentTime > 0.1 && !hasCheckedContent && (video.videoWidth === 0 || video.videoHeight === 0)) {
        console.log('[VideoPlayer] Video playing without dimensions - stopping immediately');
        video.pause();
        video.currentTime = 0;
        setVideoError('No video content found - File contains only audio');
        setIsPlaying(false);
        setIsLoading(false);
        setIsVideoReady(false);
        setHasCheckedContent(true);
      }
    }
  };

  // Handle when video element actually starts playing
  const handleVideoPlay = () => {
    console.log('[VideoPlayer] Video element started playing');
    
    // EMERGENCY STOP: if video started playing but has no dimensions, stop it immediately
    if (videoRef.current) {
      const video = videoRef.current;
      console.log('[VideoPlayer] Play event - dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('[VideoPlayer] EMERGENCY STOP - Video playing without visual content');
        video.pause();
        video.currentTime = 0;
        setVideoError('No video content found - File contains only audio');
        setIsPlaying(false);
        setIsLoading(false);
        setIsVideoReady(false);
        setHasCheckedContent(true);
        return;
      }
      
      // Check for black frames immediately when playback starts
      setTimeout(() => {
        if (video && !hasCheckedContent) {
          checkForActualVideoFrames();
        }
      }, 10); // Immediate check
      
      // Also schedule a backup check
      setTimeout(() => {
        if (video && !hasCheckedContent) {
          checkForActualVideoFrames();
        }
      }, 100);
    }
    
    // Call the normal play handler
    handlePlay();
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      setDuration(video.duration);
      
      console.log('[VideoPlayer] Metadata loaded - dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      // CRITICAL: Stop video immediately if no visual content detected in metadata
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('[VideoPlayer] No video dimensions in metadata - blocking playback');
        video.pause();
        video.currentTime = 0;
        setVideoError('No video content found - File contains only audio');
        setIsLoading(false);
        setIsVideoReady(false);
        setHasCheckedContent(true);
        return;
      }
      
      detectAspectRatio();
      checkVideoTracks();
      
      // If no error was set by previous checks, proceed
      if (!videoError) {
        setIsLoading(false);
        setIsVideoReady(true);
        setVideoError(null);
        console.log('[VideoPlayer] Video metadata loaded, ready to show');
      }
    }
  };

  const checkVideoTracks = () => {
    if (!videoRef.current || hasCheckedContent) return;
    
    const video = videoRef.current;
    
    // Check if video element reports having video tracks
    try {
      // For browsers that support videoTracks API
      if ('videoTracks' in video && video.videoTracks) {
        console.log('[VideoPlayer] Video tracks count:', video.videoTracks.length);
        if (video.videoTracks.length === 0) {
          console.log('[VideoPlayer] No video tracks found');
          setVideoError('No video content found - File contains only audio');
          setIsLoading(false);
          setIsVideoReady(false);
          setHasCheckedContent(true);
          return;
        }
      }
      
    } catch (error) {
      console.log('[VideoPlayer] Video track check failed:', error);
    }
  };

  const checkForActualVideoFrames = () => {
    if (!videoRef.current || hasCheckedContent || videoError) return;
    
    const video = videoRef.current;
    console.log('[VideoPlayer] Checking for actual video frames - time:', video.currentTime, 'dimensions:', video.videoWidth, 'x', video.videoHeight);
    
    // Check as soon as video has any time progression
    if (video.currentTime >= 0 && video.videoWidth > 0 && video.videoHeight > 0) {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          canvas.width = Math.min(video.videoWidth, 32); // Smaller sample for faster check
          canvas.height = Math.min(video.videoHeight, 32);
          
          // Draw current video frame to canvas
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Check if all pixels are essentially black
          let nonBlackPixels = 0;
          let totalBrightness = 0;
          const totalPixels = data.length / 4;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            totalBrightness += brightness;
            
            // Count pixels that aren't essentially black
            if (brightness > 10) { // Lower threshold for more sensitive detection
              nonBlackPixels++;
            }
          }
          
          const percentageNonBlack = (nonBlackPixels / totalPixels) * 100;
          const avgBrightness = totalBrightness / totalPixels;
          
          console.log(`[VideoPlayer] Frame analysis - Non-black pixels: ${percentageNonBlack.toFixed(2)}%, Avg brightness: ${avgBrightness.toFixed(2)}`);
          
          // More aggressive detection: if less than 2% non-black pixels OR very low average brightness
          if (percentageNonBlack < 2 || avgBrightness < 5) {
            console.log('[VideoPlayer] DETECTED: No meaningful video content - stopping playback immediately');
            video.pause();
            video.currentTime = 0;
            setVideoError('Format not supported - File contains only audio or video cannot be decoded');
            setIsLoading(false);
            setIsVideoReady(false);
            setIsPlaying(false);
            setHasCheckedContent(true);
          } else {
            console.log('[VideoPlayer] Video content detected, proceeding normally');
            setHasCheckedContent(true);
          }
        }
      } catch (error) {
        console.log('[VideoPlayer] Canvas frame check failed - treating as unsupported:', error);
        // If canvas fails, it's likely an unsupported format
        video.pause();
        video.currentTime = 0;
        setVideoError('Format not supported - Video codec cannot be decoded by browser');
        setIsLoading(false);
        setIsVideoReady(false);
        setIsPlaying(false);
        setHasCheckedContent(true);
      }
    } else if (video.currentTime > 0.2) {
      // If video has been playing but still no dimensions, it's audio-only
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('[VideoPlayer] Video playing but no visual dimensions - stopping');
        video.pause();
        video.currentTime = 0;
        setVideoError('No video content found - File contains only audio');
        setIsLoading(false);
        setIsVideoReady(false);
        setIsPlaying(false);
        setHasCheckedContent(true);
      }
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
    console.log('[VideoPlayer] Video can play');
    
    // Double-check dimensions when video can play
    if (videoRef.current) {
      const video = videoRef.current;
      console.log('[VideoPlayer] Can play - dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('[VideoPlayer] Can play but no dimensions - stopping');
        video.pause();
        video.currentTime = 0;
        setVideoError('No video content found - File contains only audio');
        setIsLoading(false);
        setIsVideoReady(false);
        setHasCheckedContent(true);
        return;
      }
    }
    
    setVideoError(null);
  };

  const handleWaiting = () => {
    console.log('[VideoPlayer] Video is waiting for data');
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
      setVideoError(null);
      setIsRetrying(false);
      setIsAudioOnly(false);
      setHasCheckedContent(false);
      setAspectRatio(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      // Clear any pending timeouts
      if (contentCheckTimeoutRef.current) {
        clearTimeout(contentCheckTimeoutRef.current);
        contentCheckTimeoutRef.current = null;
      }
      console.log('[VideoPlayer] Modal opened, resetting state');
    }
  }, [isOpen, videoSrc]);

  // Don't render anything until we have a video source and it's ready
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
                <div className="space-y-3">
                  {!videoError.includes('ProRes') && (
                    <button 
                      onClick={retryVideo}
                      disabled={isRetrying}
                      className="bg-white text-black px-4 py-2 font-mono text-xs uppercase tracking-wider hover:bg-gray-200 disabled:opacity-50"
                    >
                      {isRetrying ? 'RETRYING...' : 'RETRY'}
                    </button>
                  )}
                  <div className="text-xs text-gray-400 space-y-1">
                    {videoError.includes('ProRes') ? (
                      <>
                        <div>• Open in Final Cut Pro, DaVinci Resolve, or Adobe Premiere</div>
                        <div>• Convert to MP4 using HandBrake or similar tool</div>
                        <div>• Use QuickTime Player on Mac</div>
                      </>
                    ) : (
                      <>
                        <div>• Convert to MP4 format</div>
                      </>
                    )}
                  </div>
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
          {/* Hidden video for metadata loading */}
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
        {/* Video element */}
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-contain"
          onLoadStart={() => console.log('[VideoPlayer] Load started')}
          onPlay={handleVideoPlay}
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

        {/* Custom Controls Overlay */}
        <div 
          className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/70 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
                className="text-white hover:bg-white hover:text-black transition-colors p-2 border border-white hover:border-black"
              >
                <X className="w-4 h-4" />
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