import { useState, useEffect, useCallback } from 'react';
import { VideoFile } from '@/types';
import { extractDropboxPath } from '@/lib/utils/dropboxUtils';
import { checkAllVideosCompatibility, checkVideoCompatibilityInstant } from '@/lib/utils/videoCompatibility';

// Helper function to extract duration from Dropbox metadata
// Note: Dropbox mediaInfo often doesn't contain duration, so we rely on browser metadata
const getDurationFromMetadata = (mediaInfo: any): string => {
  try {
    // Check for video metadata with duration
    if (mediaInfo?.metadata?.video?.duration) {
      const durationMs = mediaInfo.metadata.video.duration;
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // Check alternative structure
    if (mediaInfo?.dimensions?.duration) {
      const durationMs = mediaInfo.dimensions.duration;
      const totalSeconds = Math.floor(durationMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  } catch (error) {
    console.warn('Error extracting duration from metadata:', error);
  }
  
  return '0:00'; // Fallback - will be updated by browser metadata
};

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
        
        // PRELOAD: Create videos and preload thumbnails before displaying
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
            
            return {
              ...video,
              streamUrl: '', // Will be fetched in background
              thumbnailUrl,
              duration: '0:00' // Will be extracted in background
            };
          })
        );
        
        const preloadEnd = performance.now();
        console.log('🟢 [FOLDER PERF] Thumbnail preloading took:', (preloadEnd - preloadStart).toFixed(2), 'ms');
        
        // Do instant compatibility check before adding to UI (preserve all existing data including duration)
        const videosWithInstantCheck = videosWithPreloadedThumbnails.map(video => {
          const instantCheck = checkVideoCompatibilityInstant(video);
          return {
            ...video, // This includes the duration that was already set
            isCompatible: instantCheck.isCompatible,
            compatibilityError: instantCheck.error || null,
            dimensions: null
          };
        });
        
        if (appendToExisting) {
          // Filter out duplicates based on video path but INCLUDE incompatible videos for display
          const existingPaths = new Set(loadedVideos.map(v => v.path));
          const newVideos = videosWithInstantCheck.filter(v => 
            !existingPaths.has(v.path)
          );
          setLoadedVideos(prev => [...prev, ...newVideos]);
        } else {
          // Add ALL videos including incompatible ones for proper display with labels
          setLoadedVideos(videosWithInstantCheck);
        }
        
        // Count the videos we actually added vs total attempted
        const totalAttempted = videosWithPreloadedThumbnails.length;
        const compatibleCount = videosWithInstantCheck.filter(v => v.isCompatible !== false).length;
        const incompatibleCount = videosWithInstantCheck.filter(v => v.isCompatible === false).length;
        
        // Show summary of what was loaded
        if (incompatibleCount > 0) {
          console.warn(`Loaded ${totalAttempted} videos: ${compatibleCount} compatible, ${incompatibleCount} incompatible (will show with warning labels)`);
        } else {
          console.log(`Loaded ${compatibleCount} compatible videos`);
        }
        
        // Run background processing for stream URLs, real durations and compatibility
        setTimeout(async () => {
          console.log('🟡 [FOLDER BACKGROUND] Starting background processing for ALL videos (including potentially incompatible)...', videosWithInstantCheck.map(v => v.name));
          try {
            // Process ALL videos - we need to test incompatible ones too to confirm they're really incompatible
            const videosToProcess = videosWithInstantCheck;
            
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
            const { videos: videosWithRealData } = await checkAllVideosCompatibility(videosWithStreamUrls);
            
            // Extract durations and update compatibility
            const videosWithRealDurations = videosWithRealData.map(video => {
              let finalDuration = '0:00';
              if (video.dimensions?.duration && video.dimensions.duration > 0) {
                const totalSeconds = Math.floor(video.dimensions.duration);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                finalDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
              }
              
              return {
                ...video,
                duration: finalDuration,
                checkedWithBrowser: true
              };
            });
            
            // Update the videos in state with real data
            if (appendToExisting) {
              setLoadedVideos(prev => {
                const existingVideos = prev.filter(v => !videosToProcess.some(newV => newV.path === v.path));
                return [...existingVideos, ...videosWithRealDurations];
              });
            } else {
              setLoadedVideos(videosWithRealDurations);
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