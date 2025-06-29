'use client';

import { useEffect, useState } from 'react';
import { VideoFile, VideoReel } from '@/types';
import { useParams } from 'next/navigation';
import { initializeTheme } from '@/lib/theme';

export default function ReelPage() {
  const params = useParams();
  const reelId = params.id as string;
  
  const [reel, setReel] = useState<VideoReel | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDirectorBio, setShowDirectorBio] = useState(true); // To toggle between bio and video
  const [isDownloading, setIsDownloading] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number } | null>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Function to map title sizes to header CSS classes (larger than button sizes)
  const getTitleHeaderSize = (size: string) => {
    switch (size) {
      case 'small': return 'text-lg';     // h4 equivalent
      case 'medium': return 'text-xl';    // h3 equivalent
      case 'large': return 'text-2xl';    // h2 equivalent
      case 'extra-large': return 'text-3xl'; // h1 equivalent
      case 'huge': return 'text-4xl';     // Large h1 equivalent
      default: return 'text-2xl';
    }
  };

  // Calculate fixed container dimensions that prevent thumbnails from moving
  const calculateFixedContainerDimensions = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Responsive breakpoint calculations
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

  // Initialize theme and container dimensions on mount
  useEffect(() => {
    initializeTheme();
    
    const updateDimensions = () => {
      setContainerDimensions(calculateFixedContainerDimensions());
    };

    // Set initial dimensions
    updateDimensions();

    // Update on window resize
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const fetchReel = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reels?id=${reelId}`);
        
        if (!response.ok) {
          throw new Error('Reel not found');
        }
        
        const data = await response.json();
        setReel(data);
        
        if (data.videos && data.videos.length > 0) {
          setCurrentVideo(data.videos[0]);
          // If no director info, show videos directly instead of bio
          if (!data.directorInfo) {
            setShowDirectorBio(false);
          }
        }
      } catch (err) {
        setError('Error loading reel. It may have expired or been removed.');
        console.error('Error fetching reel:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (reelId) {
      fetchReel();
    }
  }, [reelId]);

  const handleNext = () => {
    if (!reel || !reel.videos.length) return;
    
    setVideoAspectRatio(null); // Reset aspect ratio for new video
    setIsVideoReady(false); // Hide video until ready
    const nextIndex = (currentIndex + 1) % reel.videos.length;
    setCurrentIndex(nextIndex);
    setCurrentVideo(reel.videos[nextIndex]);
  };

  const handlePrevious = () => {
    if (!reel || !reel.videos.length) return;
    
    setVideoAspectRatio(null); // Reset aspect ratio for new video
    setIsVideoReady(false); // Hide video until ready
    const prevIndex = (currentIndex - 1 + reel.videos.length) % reel.videos.length;
    setCurrentIndex(prevIndex);
    setCurrentVideo(reel.videos[prevIndex]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Reel Not Found</h2>
          <p>{error || 'This reel could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  // Function to select a specific video by index
  const selectVideo = (index: number) => {
    if (!reel || !reel.videos.length) return;
    
    setVideoAspectRatio(null); // Reset aspect ratio for new video
    setIsVideoReady(false); // Hide video until ready
    setCurrentIndex(index);
    setCurrentVideo(reel.videos[index]);
    setShowDirectorBio(false); // Switch to video view
  };


  // Get fixed container style - NEVER changes height to keep thumbnails in place
  const getFixedContainerStyle = () => {
    if (!containerDimensions) {
      return {
        width: '80vw',
        height: '60vh'
      };
    }

    const { width, height } = containerDimensions;
    
    return {
      width: `${width}px`,
      height: `${height}px` // This NEVER changes - keeps thumbnails stable
    };
  };

  // Get video container that matches exact aspect ratio within fixed bounds
  const getVideoContainerStyle = () => {
    if (!containerDimensions || !videoAspectRatio) {
      // Hide container until proper dimensions are calculated to prevent empty container flash
      return {
        display: 'none'
      };
    }

    const { width: maxWidth, height: maxHeight } = containerDimensions;
    
    // Calculate video dimensions constrained by both width and height
    const heightConstrainedWidth = maxHeight * videoAspectRatio;
    const widthConstrainedHeight = maxWidth / videoAspectRatio;
    
    // Use whichever constraint gives the largest video that fits within bounds
    if (heightConstrainedWidth <= maxWidth) {
      // Height is the limiting constraint - use full height
      return {
        display: 'block',
        width: `${heightConstrainedWidth}px`,
        height: `${maxHeight}px`
      };
    } else {
      // Width is the limiting constraint - use full width (ultra-wide case)
      return {
        display: 'block',
        width: `${maxWidth}px`,
        height: `${widthConstrainedHeight}px`
      };
    }
  };

  // Detect video aspect ratio and show video when ready
  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    if (width && height) {
      const ratio = width / height;
      setVideoAspectRatio(ratio);
      setIsVideoReady(true); // Show video now that it's ready
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video error:', e.currentTarget.error);
  };

  const handleDownloadCurrentVideo = async () => {
    if (!currentVideo || isDownloading) return;

    setIsDownloading(true);
    
    // Function to trigger download with URL
    const triggerDownload = (url: string) => {
      const downloadUrl = url.replace('?raw=1', '?dl=1').replace('&raw=1', '&dl=1');
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = currentVideo.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => document.body.removeChild(link), 100);
    };

    try {
      console.log('Starting instant download for:', currentVideo.name);
      
      // Try using existing streamUrl first (instant if valid)
      if (currentVideo.streamUrl) {
        console.log('Using existing streamUrl for instant download');
        triggerDownload(currentVideo.streamUrl);
        setIsDownloading(false);
        return;
      }
      
      // If no existing URL, fetch a fresh one
      console.log('Fetching fresh download URL...');
      const response = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(currentVideo.path)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }
      
      const data = await response.json();
      triggerDownload(data.streamUrl);
      
      console.log('Download triggered successfully');
      
    } catch (error) {
      console.error('Download error:', error);
      alert(`Failed to download video: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="py-3 px-4 flex justify-center items-center border-b-2 border-border">
          {/* Reel title */}
          <div className="h-10 flex items-center">
            <span className={`font-medium font-mono ${reel?.editState?.titles?.[0]?.size ? getTitleHeaderSize(reel.editState.titles[0].size) : 'text-xl'}`}>
              {reel?.title?.toUpperCase() || 'DROPREEL'}
            </span>
          </div>
        </div>

        <div className="w-full relative">
          {/* Navigation Arrows - positioned at sides of video */}
          {!showDirectorBio && currentVideo && (
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

          {/* Video container with intelligent sizing */}
          <div className="w-full">
            <div className="max-w-screen-xl mx-auto px-24 py-8 w-full">
              {/* Display director bio if available and showDirectorBio is true */}
              {reel.directorInfo && showDirectorBio ? (
                <div className="bg-background border-2 border-black py-8 mx-auto">
                  <div className="grid grid-cols-2 gap-8 items-start">
                    {reel.directorInfo.image && (
                      <div className="col-span-1">
                        <img 
                          src={reel.directorInfo.image} 
                          alt="Director" 
                          className="w-full h-auto border-2 border-black"
                        />
                      </div>
                    )}
                    <div className="col-span-1 flex flex-col justify-center h-full">
                      <div className="text-center sm:text-left">
                        <h2 className="text-lg font-bold uppercase mb-2 tracking-wider font-mono">BRADLEY TANGONAN</h2>
                        <p className="text-sm text-muted-foreground font-mono uppercase">DIRECTOR</p>
                        <button 
                          onClick={() => setShowDirectorBio(false)}
                          className="mt-6 brutal-button-accent text-sm"
                        >
                          VIEW WORK
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Show video player when not showing director bio */
                currentVideo && (
                  <div className="w-full flex items-center justify-center">
                    {/* Fixed outer container - NEVER changes height */}
                    <div 
                      className="relative flex items-center justify-center" 
                      style={getFixedContainerStyle()}
                    >
                      {/* Loading state while calculating video dimensions */}
                      {(!containerDimensions || !videoAspectRatio) && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black">
                          <div className="text-white text-center">
                            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                            <div className="text-sm font-mono uppercase tracking-wider">LOADING VIDEO...</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Inner video container - exact aspect ratio */}
                      <div 
                        className="relative" 
                        style={getVideoContainerStyle()}
                      >
                        <video
                          key={currentVideo.id}
                          src={currentVideo.streamUrl}
                          className="w-full h-full object-contain"
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
                )
              )}
            </div>
          </div>
        </div>
        
        {/* Project title and info */}
        <div className="w-full border-t-2 border-b-2 border-border py-3 px-4">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between">
            <div className="text-sm font-mono uppercase tracking-wider flex items-center gap-2">
              <img 
                src="/images/reeldrop_logos-trans.png" 
                alt="ReelDrop" 
                className="h-4 w-auto"
              />
              | {reel.title?.toUpperCase()} | {currentIndex + 1}/{reel.videos.length}
            </div>
            <button
              onClick={handleDownloadCurrentVideo}
              disabled={isDownloading}
              className="brutal-button-accent text-sm flex items-center gap-2 disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  DOWNLOADING...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  DOWNLOAD
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* Video carousel at the bottom */}
        <div className="w-full max-w-screen-xl mx-auto px-4 py-4">
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-1">
              {/* Director bio card if available */}
              {reel.directorInfo && (
                <div 
                  className={`flex-shrink-0 w-28 border-2 border-border overflow-hidden relative ${showDirectorBio ? 'ring-2 ring-accent' : 'cursor-pointer hover:opacity-80'}`}
                  onClick={() => setShowDirectorBio(true)}
                >
                  {reel.directorInfo.image ? (
                    <img 
                      src={reel.directorInfo.image} 
                      alt="Director"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-background w-full aspect-video flex items-center justify-center text-center p-2">
                      <p className="text-xs font-mono uppercase">DIRECTOR BIO</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Video thumbnails */}
              {reel.videos.map((video, idx) => (
                <div 
                  key={video.id}
                  className={`flex-shrink-0 w-28 border-2 border-border overflow-hidden cursor-pointer hover:opacity-80 ${currentIndex === idx && !showDirectorBio ? 'ring-2 ring-accent' : ''}`}
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
  );
}
