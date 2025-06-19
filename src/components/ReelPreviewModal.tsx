'use client';

import { useEffect, useState } from 'react';
import { VideoFile } from '@/types';

interface ReelPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videos: VideoFile[];
  reelTitle: string;
  titles?: Array<{ text: string; size: string }>;
  editingReelId?: string | null;
}

export default function ReelPreviewModal({ 
  isOpen, 
  onClose, 
  videos, 
  reelTitle, 
  titles = []
}: ReelPreviewModalProps) {
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number } | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Function to map title sizes to header CSS classes
  const getTitleHeaderSize = (size: string) => {
    switch (size) {
      case 'small': return 'text-lg';
      case 'medium': return 'text-xl';
      case 'large': return 'text-2xl';
      case 'extra-large': return 'text-3xl';
      case 'huge': return 'text-4xl';
      default: return 'text-2xl';
    }
  };

  // Calculate fixed container dimensions (exactly like reel page - full browser size)
  const calculateFixedContainerDimensions = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Same calculations as reel page for authentic preview
    let baseWidth: number;
    let availableHeight: number;
    let maxSupportedAspectRatio: number;
    
    if (viewportWidth < 768) {
      // Mobile: prioritize portrait videos, tighter constraints
      baseWidth = viewportWidth * 0.9;
      availableHeight = viewportHeight * 0.6;
      maxSupportedAspectRatio = 2.0; // Less support for ultra-wide on mobile
    } else if (viewportWidth < 1024) {
      // Tablet: balanced approach
      baseWidth = viewportWidth * 0.85;
      availableHeight = viewportHeight * 0.65;
      maxSupportedAspectRatio = 2.2;
    } else {
      // Desktop: maximize video size
      baseWidth = viewportWidth * 0.8;
      availableHeight = viewportHeight * 0.7;
      maxSupportedAspectRatio = 2.5;
    }
    
    // Constrain width to match max-w-screen-xl (1280px) used by divider lines
    const availableWidth = Math.min(baseWidth, 1280);
    
    // Calculate safe height to prevent horizontal overflow
    const safeHeight = availableWidth / maxSupportedAspectRatio;
    
    // Use smaller of available height or safe height
    const containerHeight = Math.min(availableHeight, safeHeight);
    
    return {
      width: availableWidth,
      height: containerHeight
    };
  };

  // Initialize container dimensions on mount and resize
  useEffect(() => {
    if (!isOpen) return;

    const updateDimensions = () => {
      setContainerDimensions(calculateFixedContainerDimensions());
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [isOpen]);

  // Set initial video when modal opens
  useEffect(() => {
    if (isOpen && videos.length > 0) {
      setCurrentVideo(videos[0]);
      setCurrentIndex(0);
      setVideoAspectRatio(null);
      setIsVideoReady(false);
    }
  }, [isOpen, videos]);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleNext = () => {
    if (!videos.length) return;
    
    setVideoAspectRatio(null);
    setIsVideoReady(false);
    const nextIndex = (currentIndex + 1) % videos.length;
    setCurrentIndex(nextIndex);
    setCurrentVideo(videos[nextIndex]);
  };

  const handlePrevious = () => {
    if (!videos.length) return;
    
    setVideoAspectRatio(null);
    setIsVideoReady(false);
    const prevIndex = (currentIndex - 1 + videos.length) % videos.length;
    setCurrentIndex(prevIndex);
    setCurrentVideo(videos[prevIndex]);
  };

  const selectVideo = (index: number) => {
    if (!videos.length) return;
    
    setVideoAspectRatio(null);
    setIsVideoReady(false);
    setCurrentIndex(index);
    setCurrentVideo(videos[index]);
  };

  // Get fixed container style
  const getFixedContainerStyle = () => {
    if (!containerDimensions) {
      return {
        width: '75vw',
        height: '50vh'
      };
    }

    const { width, height } = containerDimensions;
    
    return {
      width: `${width}px`,
      height: `${height}px`
    };
  };

  // Get video container that matches exact aspect ratio
  const getVideoContainerStyle = () => {
    if (!containerDimensions || !videoAspectRatio) {
      return {
        width: '100%',
        height: '100%'
      };
    }

    const { width: maxWidth, height: maxHeight } = containerDimensions;
    
    const heightConstrainedWidth = maxHeight * videoAspectRatio;
    const widthConstrainedHeight = maxWidth / videoAspectRatio;
    
    if (heightConstrainedWidth <= maxWidth) {
      return {
        width: `${heightConstrainedWidth}px`,
        height: `${maxHeight}px`
      };
    } else {
      return {
        width: `${maxWidth}px`,
        height: `${widthConstrainedHeight}px`
      };
    }
  };

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    if (width && height) {
      const ratio = width / height;
      setVideoAspectRatio(ratio);
      setIsVideoReady(true);
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video error:', e.currentTarget.error);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 p-[10px] animate-in fade-in duration-200">
      <div className="w-full h-full bg-background text-foreground border-2 border-border overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="w-full max-w-screen-xl mx-auto h-full flex flex-col">
        {/* Close button - absolute positioned in upper right of entire modal */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 flex items-center justify-center hover:bg-black hover:text-background transition-colors duration-150 bg-background border-2 border-black rounded-sm"
          style={{
            color: document.documentElement.classList.contains('dark') ? '#00ff00' : '#000000'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="py-3 px-4 flex justify-center items-center border-b-2 border-border">
          {/* Reel title - centered */}
          <div className="h-10 flex items-center">
            <span className={`font-medium font-mono ${titles?.[0]?.size ? getTitleHeaderSize(titles[0].size) : 'text-xl'}`}>
              {reelTitle?.toUpperCase() || 'REEL PREVIEW'}
            </span>
          </div>
        </div>

        {/* Video Content */}
        <div className="w-full relative">
          {/* Navigation Arrows */}
          {currentVideo && videos.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 brutal-button p-3 z-20"
                aria-label="Previous video"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 brutal-button p-3 z-20"
                aria-label="Next video"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Video Container */}
          <div className="w-full">
            <div className="max-w-screen-xl mx-auto px-24 py-8 w-full">
              {currentVideo && (
                <div className="w-full flex items-center justify-center">
                  {/* Fixed outer container */}
                  <div 
                    className="relative flex items-center justify-center" 
                    style={getFixedContainerStyle()}
                  >
                    {/* Inner video container */}
                    <div 
                      className="relative" 
                      style={getVideoContainerStyle()}
                    >
                      <video
                        key={currentVideo.id}
                        src={currentVideo.streamUrl}
                        className={`w-full h-full object-contain transition-opacity duration-150 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}
                        controls
                        onEnded={handleNext}
                        onLoadedMetadata={handleVideoLoadedMetadata}
                        onError={handleVideoError}
                        crossOrigin="anonymous"
                        playsInline
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Project Info */}
        <div className="w-full border-t-2 border-b-2 border-border py-3 px-4">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between">
            <div className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
              <img 
                src="/images/reeldrop_logos-trans.png" 
                alt="ReelDrop" 
                className="h-4 w-auto"
              />
              | {reelTitle?.toUpperCase()} | {currentIndex + 1}/{videos.length}
            </div>
          </div>
        </div>
        
        {/* Video Carousel */}
        <div className="w-full max-w-screen-xl mx-auto px-4 py-4">
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-1">
              {videos.map((video, idx) => (
                <div 
                  key={video.id}
                  className={`flex-shrink-0 w-28 border-2 border-border overflow-hidden cursor-pointer hover:opacity-80 ${currentIndex === idx ? 'ring-2 ring-accent' : ''}`}
                  onClick={() => selectVideo(idx)}
                >
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl}
                      alt={video.name}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="bg-background w-full aspect-video flex items-center justify-center">
                      <p className="text-xs text-center p-2 truncate font-mono">{video.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}