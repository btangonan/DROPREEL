import { useState, useEffect, useCallback } from 'react';
import { VideoFile } from '@/types';
import { extractDropboxPath } from '@/lib/utils/dropboxUtils';
import { checkAllVideosCompatibility, checkVideoCompatibilityInstant } from '@/lib/utils/videoCompatibility';
import { extractDropboxDuration, extractDropboxDurationFast, extractMultipleDurations, debugMediaInfo, testDurationExtraction } from '@/lib/utils/durationUtils';

// Note: Duration extraction is now handled by dedicated utilities

interface VideoState {
  yourVideos: VideoFile[];
  selects: VideoFile[];
}

export function useVideoManagement() {
  const [loadedVideos, setLoadedVideos] = useState<VideoFile[]>([]);
  const [videoState, setVideoState] = useState<VideoState>({ yourVideos: [], selects: [] });
  const [isFetching, setIsFetching] = useState(false);
  const [folderPath, setFolderPath] = useState('');

  // Helper function to get video duration
  const getVideoDuration = useCallback((videoUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      // Handle empty or invalid URLs
      if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
        resolve('0:00');
        return;
      }

      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
        video.src = '';
        video.load();
      };
      
      const onLoadedMetadata = () => {
        const duration = video.duration;
        cleanup();
        
        if (isNaN(duration) || duration === 0) {
          resolve('0:00');
          return;
        }
        
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
      
      const onError = () => {
        cleanup();
        resolve('0:00');
      };
      
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        cleanup();
        resolve('0:00');
      }, 5000);
      
      video.src = videoUrl;
    });
  }, []);

  const fetchVideos = useCallback(async (path: string, appendToExisting = false): Promise<{ error?: string }> => {
    if (!path) {
      return { error: 'Please enter a Dropbox folder path or link' };
    }
    setIsFetching(true);
    try {
      const finalPath = extractDropboxPath(path);
      const response = await fetch(`/api/dropbox?action=listVideos&folderPath=${encodeURIComponent(finalPath)}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Folder "${finalPath}" not found in Dropbox`);
        }
        throw new Error('Failed to load videos');
      }
      const data = await response.json();
      if (data.videos && data.videos.length > 0) {
        console.log('🟢 [FOLDER PERF] Processing', data.videos.length, 'videos - PRELOAD THUMBNAILS MODE');
        const folderStart = performance.now();
        
        // PRELOAD: Create videos with fast duration extraction and preload thumbnails before displaying
        const preloadStart = performance.now();
        const videosWithPreloadedThumbnails = await Promise.all(
          data.videos.map(async (video: VideoFile) => {
            const thumbnailUrl = `/api/dropbox/thumbnail?path=${encodeURIComponent(video.path)}`;
            
            // Preload thumbnail to avoid piecemeal loading
            try {
              await new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve(); // Continue even if thumbnail fails
                setTimeout(() => resolve(), 1000); // Timeout after 1 second
                img.src = thumbnailUrl;
              });
            } catch (error) {
              console.warn('🟡 [FOLDER PERF] Thumbnail preload failed for:', video.name);
            }
            
            // Ultra-fast duration check for immediate UI display
            const quickDuration = extractDropboxDurationFast(video.mediaInfo);
            
            return {
              ...video,
              streamUrl: '', // Will be fetched in background
              thumbnailUrl,
              duration: quickDuration // Quick check only, full extraction in background
            };
          })
        );
        
        const preloadEnd = performance.now();
        console.log('🟢 [FOLDER PERF] Thumbnail preloading + fast duration extraction took:', (preloadEnd - preloadStart).toFixed(2), 'ms');
        
        // Count how many got immediate duration vs need background extraction
        const immediateCount = videosWithPreloadedThumbnails.filter(v => v.duration !== '0:00').length;
        console.log('🟢 [FOLDER PERF] Duration stats: immediate =', immediateCount, ', need background =', (videosWithPreloadedThumbnails.length - immediateCount));
        
        // Skip instant compatibility check - only use accurate deep checking in background
        // This prevents confusing user experience where videos flash from incompatible to compatible
        const videosWithoutInstantCheck = videosWithPreloadedThumbnails.map(video => ({
          ...video,
          isCompatible: undefined, // Will be determined by deep check in background
          compatibilityError: null,
          dimensions: null
        }));
        
        if (appendToExisting) {
          // Filter out duplicates based on video path
          const existingPaths = new Set(loadedVideos.map(v => v.path));
          const newVideos = videosWithoutInstantCheck.filter(v => 
            !existingPaths.has(v.path)
          );
          setLoadedVideos(prev => [...prev, ...newVideos]);
        } else {
          // Add ALL videos - compatibility will be determined in background
          setLoadedVideos(videosWithoutInstantCheck);
        }
        
        // Show simple loading summary
        const totalAttempted = videosWithPreloadedThumbnails.length;
        console.log(`Loaded ${totalAttempted} videos - compatibility checking in background...`);
        
        // Run background processing for stream URLs, real durations and compatibility
        setTimeout(async () => {
          console.log('🟡 [FOLDER BACKGROUND] Starting background processing for ALL videos...', videosWithoutInstantCheck.map(v => v.name));
          try {
            // Process ALL videos - compatibility will be determined accurately  
            const videosToProcess = videosWithoutInstantCheck;
            
            if (videosToProcess.length === 0) {
              console.log('🟡 [FOLDER BACKGROUND] No videos to process');
              return;
            }
            
            // First, fetch stream URLs for videos that don't have them
            const backgroundStart = performance.now();
            console.log('🟡 [FOLDER BACKGROUND] Fetching stream URLs for', videosToProcess.length, 'videos...');
            const videosWithStreamUrls = await Promise.all(
              videosToProcess.map(async (video) => {
                if (!video.streamUrl || video.streamUrl.trim() === '') {
                  try {
                    const response = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(video.path)}`);
                    const streamData = await response.json();
                    const streamUrl = streamData.streamUrl || streamData.url || '';
                    console.log('🟡 [FOLDER BACKGROUND] Fetched stream URL for', video.name);
                    return { ...video, streamUrl };
                  } catch (error) {
                    console.warn('🟡 [FOLDER BACKGROUND] Failed to fetch stream URL for', video.name, error);
                    return video; // Keep original video if fetch fails
                  }
                }
                return video; // Already has stream URL
              })
            );
            const urlsEnd = performance.now();
            console.log('🟡 [FOLDER BACKGROUND] Stream URLs fetched in', (urlsEnd - backgroundStart).toFixed(2), 'ms');
            
            // Then run compatibility check with stream URLs
            console.log('🟡 [FOLDER BACKGROUND] Running compatibility checks...');
            
            // Create a callback to immediately update individual videos as they're checked
            const handleVideoChecked = (checkedVideo: VideoFile) => {
              console.log('🚀 [IMMEDIATE UPDATE] Updating UI for:', checkedVideo.name, 'compatible:', checkedVideo.isCompatible);
              setLoadedVideos(prev => 
                prev.map(video => 
                  video.path === checkedVideo.path ? checkedVideo : video
                )
              );
            };
            
            const { videos: videosWithRealData } = await checkAllVideosCompatibility(videosWithStreamUrls, handleVideoChecked);
            
            // Extract durations using the new efficient system (background only)
            console.log('🟡 [FOLDER BACKGROUND] Extracting durations for videos...');
            
            // Debug mediaInfo structure for first few videos (only if needed for debugging)
            if (process.env.NODE_ENV === 'development') {
              videosWithRealData.slice(0, 2).forEach(video => {
                if (video.mediaInfo) {
                  debugMediaInfo(video.mediaInfo, video.name);
                }
              });
              
              // Test duration extraction on the first video for debugging
              if (videosWithRealData.length > 0) {
                await testDurationExtraction(videosWithRealData[0]);
              }
            }
            
            const videosWithRealDurations = await extractMultipleDurations(videosWithRealData, 5); // Increased batch size since it's background
            
            // Mark all as browser-checked
            const finalVideos = videosWithRealDurations.map(video => ({
              ...video,
              checkedWithBrowser: true
            }));
            
            // Update the videos in state with real data
            if (appendToExisting) {
              setLoadedVideos(prev => {
                const existingVideos = prev.filter(v => !videosToProcess.some(newV => newV.path === v.path));
                return [...existingVideos, ...finalVideos];
              });
            } else {
              setLoadedVideos(finalVideos);
            }
            
            console.log('🟡 [FOLDER BACKGROUND] Background processing complete - videos updated with real durations and compatibility');
          } catch (error) {
            console.warn('🟡 [FOLDER BACKGROUND] Background processing failed:', error);
          }
        }, 100);
      } else {
        if (!appendToExisting) {
          setLoadedVideos([]);
        }
        return { error: 'No video files found in the specified folder' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      if (!appendToExisting) {
        setLoadedVideos([]);
      }
      return { error: `Error loading videos: ${errorMessage}` };
    } finally {
      setIsFetching(false);
    }
    return {};
  }, [loadedVideos, getVideoDuration]);

  const checkCompatibility = useCallback(async (videos: VideoFile[]) => {
    return checkAllVideosCompatibility(videos);
  }, []);

  const deleteVideo = useCallback((video: VideoFile, panel: 'yourVideos' | 'selects') => {
    
    setVideoState(prev => {
      const newState = { ...prev };
      
      if (panel === 'yourVideos') {
        newState.yourVideos = prev.yourVideos.filter(v => v.id !== video.id);
      } else {
        newState.selects = prev.selects.filter(v => v.id !== video.id);
      }
      
      
      return newState;
    });
  }, []);

  // When loadedVideos changes, update videos while preserving panel assignments
  useEffect(() => {
    setVideoState(prev => {
      // Get IDs of videos currently in selects panel
      const selectedVideoIds = new Set(prev.selects.map(v => v.id));
      
      // Only put videos in yourVideos if they're NOT already in selects
      const updatedYourVideos = loadedVideos.filter(v => !selectedVideoIds.has(v.id));
      
      // Update any selected videos that have new duration/compatibility info
      const updatedSelects = prev.selects.map(selectedVideo => {
        const updatedVideo = loadedVideos.find(v => v.id === selectedVideo.id);
        return updatedVideo || selectedVideo;
      });
      
      return {
        yourVideos: updatedYourVideos,
        selects: updatedSelects
      };
    });
  }, [loadedVideos]);

  return {
    loadedVideos,
    videoState,
    setVideoState,
    isFetching,
    folderPath,
    setFolderPath,
    fetchVideos,
    checkCompatibility,
    deleteVideo,
    setLoadedVideos,
    getVideoDuration
  };
}