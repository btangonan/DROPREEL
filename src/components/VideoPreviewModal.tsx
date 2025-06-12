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
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect video aspect ratio
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
      console.log(`[VideoPlayer] Detected aspect ratio: ${width}x${height} (${ratio.toFixed(2)}) - ${orientation}`);
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
    setIsPlaying(true);
    resetControlsTimer();
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
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      detectAspectRatio();
      setIsLoading(false);
      setIsVideoReady(true);
      console.log('[VideoPlayer] Video metadata loaded, ready to show');
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
      setAspectRatio(null);
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      console.log('[VideoPlayer] Modal opened, resetting state');
    }
  }, [isOpen, videoSrc]);

  // Don't render anything until we have a video source and it's ready
  if (!isOpen || !videoSrc) return null;
  
  // Show loading state until video is ready
  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div 
          className="relative bg-black flex items-center justify-center"
          style={{ width: '300px', height: '200px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
            <div className="text-sm font-mono uppercase tracking-wider">LOADING VIDEO...</div>
          </div>
          {/* Hidden video for metadata loading */}
          <video
            ref={videoRef}
            src={videoSrc}
            style={{ display: 'none' }}
            onLoadedMetadata={handleLoadedMetadata}
            preload="metadata"
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
          onPlay={handlePlay}
          onPause={handlePause}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onVolumeChange={handleVolumeChange}
          onClick={togglePlayPause}
          autoPlay
        >
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