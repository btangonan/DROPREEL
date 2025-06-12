'use client';

import { useEffect, useRef, useState } from 'react';
import { VideoFile } from '@/types';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoPlayerProps {
  video: VideoFile;
  onEnded?: () => void;
}

export default function VideoPlayer({ video, onEnded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  // Type for the Video.js player instance
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Try to get aspect ratio from video metadata first, then fall back to detection
  const getInitialAspectRatio = () => {
    // Check if video has dimensions in mediaInfo
    if (video.mediaInfo?.dimensions?.width && video.mediaInfo?.dimensions?.height) {
      return video.mediaInfo.dimensions.width / video.mediaInfo.dimensions.height;
    }
    // Check for other metadata sources
    if ((video as any).videoWidth && (video as any).videoHeight) {
      return (video as any).videoWidth / (video as any).videoHeight;
    }
    // Default to a common cinematic ratio for wide videos, will be corrected when metadata loads
    return 2.35; // Common cinematic ratio, better than 16:9 default
  };
  
  const [aspectRatio, setAspectRatio] = useState<number>(getInitialAspectRatio());

  // Process video URLs and handle special cases like Dropbox
  function getProcessedUrl(url: string | undefined): string {
    if (!url) return '';
    
    // Handle Dropbox URLs - add cache busting parameter to avoid caching issues
    if (url.includes('dropbox.com') || url.includes('dropboxusercontent.com')) {
      // Make sure we're using dl.dropboxusercontent.com for direct download
      let processedUrl = url
        .replace('www.dropbox.com/s/', 'dl.dropboxusercontent.com/s/')
        .replace('?dl=0', '?raw=1&dl=1');
      
      // Add cache-busting parameter to prevent browser caching of expired links
      const cacheBuster = `&cb=${Date.now()}`;
      processedUrl += processedUrl.includes('?') ? cacheBuster : `?${cacheBuster.substring(1)}`;
      
      console.log('Processed Dropbox URL:', processedUrl);
      return processedUrl;
    }
    
    return url;
  }

  // Determine the appropriate MIME type based on file extension
  function determineVideoType(url: string): string {
    let mimeType = 'video/mp4';
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: {[key: string]: string} = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'ogg': 'video/ogg',
      'mov': 'video/quicktime',
      'avi': 'video/x-msvideo',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'mkv': 'video/x-matroska',
      '3gp': 'video/3gpp',
      'm4v': 'video/mp4'
    };
    
    if (extension && mimeTypes[extension]) {
      mimeType = mimeTypes[extension];
    }
    
    return mimeType;
  }

  useEffect(() => {
    if (!videoRef.current) return;
    
    // Reset aspect ratio to initial value for new video
    setAspectRatio(getInitialAspectRatio());
    
    // Clean up previous player
    if (playerRef.current) {
      playerRef.current.dispose();
      playerRef.current = null;
    }
    
    setIsLoading(true);
    setError(false);
    
    const videoUrl = getProcessedUrl(video.streamUrl);
    console.log(`Initializing video player with URL: ${videoUrl ? '[valid url]' : '[missing]'}`);
    
    if (!videoUrl) {
      console.error('Invalid or missing video URL');
      setError(true);
      setIsLoading(false);
      return;
    }

    // Pre-load video metadata to get dimensions before initializing Video.js
    const preloadVideo = document.createElement('video');
    preloadVideo.crossOrigin = 'anonymous';
    preloadVideo.preload = 'metadata';
    preloadVideo.src = videoUrl;
    
    const initializePlayer = (detectedAspectRatio?: number) => {
      if (detectedAspectRatio) {
        console.log(`Pre-detected aspect ratio: ${detectedAspectRatio}`);
        setAspectRatio(detectedAspectRatio);
      }
      
      // Small delay to allow aspect ratio state to update
      setTimeout(() => {
        initVideoJS();
      }, 50);
    };

    // Set up preload events
    preloadVideo.addEventListener('loadedmetadata', () => {
      const { videoWidth, videoHeight } = preloadVideo;
      if (videoWidth && videoHeight && videoWidth > 0 && videoHeight > 0) {
        const detectedRatio = videoWidth / videoHeight;
        initializePlayer(detectedRatio);
      } else {
        initializePlayer();
      }
    });

    preloadVideo.addEventListener('error', () => {
      console.warn('Could not preload video metadata, proceeding with default ratio');
      initializePlayer();
    });

    // Timeout fallback
    setTimeout(() => {
      initializePlayer();
    }, 2000);

    const initVideoJS = () => {
      if (!videoRef.current) return;
      
    try {
      // Create video element
      const videoElement = document.createElement('video');
      videoElement.className = 'video-js vjs-big-play-centered';
      videoElement.style.width = '100%';
      
      // Add direct event listener for video dimensions as backup
      videoElement.addEventListener('loadedmetadata', () => {
        const { videoWidth, videoHeight } = videoElement;
        if (videoWidth && videoHeight && videoWidth > 0 && videoHeight > 0) {
          const newAspectRatio = videoWidth / videoHeight;
          console.log(`Direct video element dimensions: ${videoWidth}x${videoHeight}, aspect ratio: ${newAspectRatio}`);
          setAspectRatio(newAspectRatio);
        }
      });
      
      // Clear and append
      videoRef.current.innerHTML = '';
      videoRef.current.appendChild(videoElement);
      
      // Set video element styles for exact aspect ratio matching
      videoElement.style.width = '100%';
      videoElement.style.height = '100%';
      videoElement.style.objectFit = 'contain'; // Contain the video without cutting off
      
      // Initialize player with dynamic aspect ratio
      const player = videojs(videoElement, {
        autoplay: false,
        controls: true,
        preload: 'auto',
        poster: video.thumbnailUrl || '',
        fluid: true, // Enable fluid for responsive behavior
        responsive: true,
        // Remove fixed aspect ratio to allow dynamic sizing
        // Error handling options
        errorDisplay: true,
        liveui: false,
        html5: {
          hls: {
            overrideNative: true
          },
          nativeAudioTracks: false,
          nativeVideoTracks: false
        },
        // Control bar is always visible
        controlBar: {
          // Make sure the control bar visibility doesn't timeout
          fadeTime: 0
        },
        sources: [
          {
            src: videoUrl,
            type: determineVideoType(video.streamUrl || '')
          }
        ]
      });
      
      // Store player reference
      playerRef.current = player;
      
      // Handle events
      player.ready(() => {
        console.log('Player ready');
        setIsLoading(false);
        
        // Get video dimensions and update aspect ratio
        player.on('loadedmetadata', () => {
          const videoWidth = player.videoWidth();
          const videoHeight = player.videoHeight();
          
          if (videoWidth && videoHeight && videoWidth > 0 && videoHeight > 0) {
            const newAspectRatio = videoWidth / videoHeight;
            console.log(`Video dimensions: ${videoWidth}x${videoHeight}, aspect ratio: ${newAspectRatio}`);
            setAspectRatio(newAspectRatio);
          } else {
            console.log('Video dimensions not available from player, using default aspect ratio');
          }
        });

        // Also try to get dimensions when video can play
        player.on('canplay', () => {
          const videoWidth = player.videoWidth();
          const videoHeight = player.videoHeight();
          
          if (videoWidth && videoHeight && videoWidth > 0 && videoHeight > 0) {
            const newAspectRatio = videoWidth / videoHeight;
            console.log(`Video dimensions from canplay: ${videoWidth}x${videoHeight}, aspect ratio: ${newAspectRatio}`);
            setAspectRatio(newAspectRatio);
          }
        });
        
        // Force controls to be visible and interactive
        const controlBar = player.el().querySelector('.vjs-control-bar');
        if (controlBar instanceof HTMLElement) {
          controlBar.style.opacity = '1';
          controlBar.style.visibility = 'visible';
          controlBar.style.zIndex = '10';
        }
        
        // Ensure big play button is clickable
        const bigPlayButton = player.el().querySelector('.vjs-big-play-button');
        if (bigPlayButton instanceof HTMLElement) {
          bigPlayButton.style.zIndex = '11';
          bigPlayButton.style.pointerEvents = 'auto';
        }
        
        // Enhanced error handling
        player.on('error', () => {
          const error = player.error();
          console.error('Video player error:', error);
          
          // Check for specific error codes
          if (error && error.code === 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
            console.warn('Video source not supported or temporary link expired');
            // We could potentially implement a mechanism to refresh the temporary link here
            // For now, just show a more specific error message
          }
          
          setError(true);
          setIsLoading(false);
        });
        
        player.on('ended', () => {
          if (onEnded) onEnded();
        });
        
      });
      
    } catch (error) {
      console.error('Error initializing video player:', error);
      setError(true);
      setIsLoading(false);
    }
    };

    // Start the preload process
    // The preload events will trigger initialization
    
    // Cleanup on unmount
    return () => {
      preloadVideo.src = '';
      preloadVideo.load();
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [video, onEnded]);

  // Calculate container dimensions based on aspect ratio - ensure minimum size for very wide videos
  const getVideoContainerStyle = () => {
    if (!aspectRatio) {
      return { width: '100%', height: '100%', aspectRatio: '16 / 9' };
    }

    const orientation = aspectRatio > 1.1 ? 'landscape' : aspectRatio < 0.9 ? 'portrait' : 'square';
    
    if (orientation === 'portrait') {
      // Portrait videos: limit height and let width adjust
      return {
        height: '60vh',
        width: `calc(60vh * ${aspectRatio})`,
        maxWidth: '100%',
        aspectRatio: aspectRatio.toString(),
        position: 'relative' as const,
      };
    } else {
      // Landscape and square: ensure minimum height for very wide videos
      const calculatedHeight = `calc(80vw / ${aspectRatio})`;
      return {
        width: '80vw',
        height: calculatedHeight,
        minHeight: '30vh', // Minimum height for very wide videos
        aspectRatio: aspectRatio.toString(),
        position: 'relative' as const,
      };
    }
  };
  
  const containerStyle = getVideoContainerStyle();
  
  return (
    <div style={containerStyle}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black bg-opacity-50">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10 text-white text-center p-4">
          <div>
            <p className="text-xl font-semibold mb-2">Unable to play video</p>
            <p className="text-sm mb-3">The video link may have expired or the format is not supported by your browser.</p>
            <button 
              onClick={() => {
                setError(false);
                setIsLoading(true);
                // Force a re-render with a new cache-busting URL
                const refreshedUrl = getProcessedUrl(video.streamUrl);
                if (videoRef.current) {
                  // Re-initialize the player with the new URL
                  setTimeout(() => {
                    if (videoRef.current) {
                      // The useEffect will handle the rest
                      videoRef.current.innerHTML = '';
                      const videoElement = document.createElement('video');
                      videoElement.className = 'video-js vjs-big-play-centered';
                      videoRef.current.appendChild(videoElement);
                      setIsLoading(false);
                    }
                  }, 500);
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
      
      <div ref={videoRef} className="w-full h-full relative"></div>
    </div>
  );
}
