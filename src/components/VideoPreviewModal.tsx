'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  videoUrl?: string;
  path?: string;
  size?: number;
}

interface VideoPreviewModalProps {
  video: Video | null;
  isOpen: boolean;
  onClose: () => void;
  isLoadingVideo?: boolean;
}

export function VideoPreviewModal({ video, isOpen, onClose, isLoadingVideo = false }: VideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [volume, setVolume] = React.useState(1);
  const [videoAspectRatio, setVideoAspectRatio] = React.useState<number | null>(null);

  // Calculate modal size based on video aspect ratio
  const getModalSize = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Base dimensions for different screen sizes
    let maxWidth, maxHeight, minWidth, minHeight;
    
    if (screenWidth < 640) { // Mobile
      maxWidth = screenWidth * 0.95;
      maxHeight = screenHeight * 0.7;
      minWidth = 300;
      minHeight = 200;
    } else if (screenWidth < 1024) { // Tablet
      maxWidth = screenWidth * 0.85;
      maxHeight = screenHeight * 0.75;
      minWidth = 400;
      minHeight = 250;
    } else { // Desktop
      maxWidth = Math.min(screenWidth * 0.8, 1000);
      maxHeight = screenHeight * 0.75;
      minWidth = 500;
      minHeight = 300;
    }
    
    // If we have video aspect ratio, calculate dimensions to match it
    if (videoAspectRatio) {
      // Add space for controls (approximately 120px)
      const controlsHeight = 120;
      
      // Try width-first approach
      let width = maxWidth;
      let videoHeight = width / videoAspectRatio;
      let totalHeight = videoHeight + controlsHeight;
      
      // If height exceeds max, constrain by height instead
      if (totalHeight > maxHeight) {
        totalHeight = maxHeight;
        videoHeight = totalHeight - controlsHeight;
        width = videoHeight * videoAspectRatio;
      }
      
      // Ensure minimums
      width = Math.max(width, minWidth);
      totalHeight = Math.max(totalHeight, minHeight);
      
      return {
        width: `${width}px`,
        height: `${totalHeight}px`
      };
    }
    
    // Fallback for when we don't have aspect ratio yet
    return {
      width: `${maxWidth}px`,
      height: `${maxHeight}px`,
      minWidth: `${minWidth}px`,
      minHeight: `${minHeight}px`
    };
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (videoRef.current && video) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    }
    // Reset aspect ratio when video changes
    setVideoAspectRatio(null);
  }, [video]);

  // Try to get aspect ratio from thumbnail image
  useEffect(() => {
    if (video && !videoAspectRatio && !video.videoUrl) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        setVideoAspectRatio(aspectRatio);
      };
      img.src = video.thumbnail;
    }
  }, [video, videoAspectRatio]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
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
      // Calculate and store video aspect ratio
      const aspectRatio = videoRef.current.videoWidth / videoRef.current.videoHeight;
      setVideoAspectRatio(aspectRatio);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const newTime = (clickX / width) * duration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!isOpen || !video) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4"
        style={{ 
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: '2rem', // Add some top padding to account for header
          paddingBottom: '2rem'
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-black border-4 flex flex-col"
          style={{ 
            boxShadow: '6px 6px 0 rgba(255, 255, 0, 0.3)',
            backgroundColor: 'var(--pure-black)',
            borderColor: 'var(--neon-yellow)',
            ...getModalSize()
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 z-10 bg-black border-2 border-white text-white p-2 hover:bg-white hover:text-black transition-colors"
            onClick={onClose}
            title="Close Video (Esc)"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex-1 flex items-center justify-center relative bg-black overflow-hidden">
            {isLoadingVideo ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
                    <div className="text-white font-black text-xl mb-2">LOADING VIDEO...</div>
                    <div className="text-white font-bold">Please wait</div>
                  </div>
                </div>
              </div>
            ) : video.videoUrl ? (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                poster={video.thumbnail}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
                onClick={togglePlayPause}
              >
                <source src={video.videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
                  <div className="text-center">
                    <div className="bg-white text-black rounded-full p-4 mb-4 mx-auto w-20 h-20 flex items-center justify-center">
                      <Play className="w-10 h-10 ml-1" />
                    </div>
                    <div className="text-white font-black text-xl mb-2">PREVIEW MODE</div>
                    <div className="text-white font-bold">Click to simulate playback</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div className="bg-black border-t-2 border-white p-3 flex-shrink-0">
            <div className="text-white font-black text-base uppercase mb-2">{video.title}</div>
            
            {/* Progress Bar */}
            <div 
              className="w-full h-1 bg-gray-600 cursor-pointer relative mb-2"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-white transition-all"
                style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  className="flex items-center gap-1 bg-white text-black px-2 py-1 font-black hover:bg-gray-200 transition-colors text-sm"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                  <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                </button>

                <button
                  className="flex items-center gap-1 bg-white text-black px-2 py-1 font-black hover:bg-gray-200 transition-colors text-sm"
                  onClick={handleRestart}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>RESTART</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3 text-white" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1"
                    title="Volume"
                  />
                </div>

                <div className="text-white font-bold text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}