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
        const videosWithUrls = await Promise.all(
          data.videos.map(async (video: VideoFile) => {
            try {
              const streamResponse = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(video.path)}`);
              const streamData = await streamResponse.json();
              const thumbnailUrl = `/api/dropbox/thumbnail?path=${encodeURIComponent(video.path)}`;
              const streamUrl = streamData.streamUrl || streamData.url || '';
              
              // Get real duration from browser metadata immediately
              let realDuration = '0:00';
              if (streamUrl) {
                try {
                  realDuration = await getVideoDuration(streamUrl);
                } catch (error) {
                  console.warn('Failed to get duration for', video.name, error);
                }
              }
              
              return {
                ...video,
                streamUrl,
                thumbnailUrl,
                duration: realDuration // Use real duration from browser metadata
              };
            } catch (error) {
              console.error('Failed to get stream URL for video:', video.name, error);
              return {
                ...video,
                streamUrl: '', // Empty string as fallback
                thumbnailUrl: `/api/dropbox/thumbnail?path=${encodeURIComponent(video.path)}`,
                duration: '0:00'
              };
            }
          })
        );
        
        // Do instant compatibility check before adding to UI (preserve all existing data including duration)
        const videosWithInstantCheck = videosWithUrls.map(video => {
          const instantCheck = checkVideoCompatibilityInstant(video);
          return {
            ...video, // This includes the duration that was already set
            isCompatible: instantCheck.isCompatible,
            compatibilityError: instantCheck.error || null,
            dimensions: null
          };
        });
        
        if (appendToExisting) {
          // Filter out duplicates based on video path AND don't add incompatible videos
          const existingPaths = new Set(loadedVideos.map(v => v.path));
          const newVideos = videosWithInstantCheck.filter(v => 
            !existingPaths.has(v.path) && v.isCompatible !== false
          );
          setLoadedVideos(prev => [...prev, ...newVideos]);
        } else {
          // Only add compatible videos
          const compatibleVideos = videosWithInstantCheck.filter(v => v.isCompatible !== false);
          setLoadedVideos(compatibleVideos);
        }
        
        // Count the videos we actually added vs total attempted
        const totalAttempted = videosWithUrls.length;
        const compatibleAdded = appendToExisting ? 
          videosWithInstantCheck.filter(v => !new Set(loadedVideos.map(v => v.path)).has(v.path) && v.isCompatible !== false).length :
          videosWithInstantCheck.filter(v => v.isCompatible !== false).length;
        const incompatibleSkipped = totalAttempted - compatibleAdded;
        
        // Show message if we skipped incompatible videos
        if (incompatibleSkipped > 0) {
          console.warn(`Skipped ${incompatibleSkipped} incompatible video(s). ${compatibleAdded} compatible videos added.`);
        }
        
        // Optional: Run deeper compatibility check in background for added videos only
        setTimeout(async () => {
          // Get current loaded videos for deeper checking
          const currentVideos = appendToExisting ? 
            loadedVideos.concat(videosWithInstantCheck.filter(v => 
              !new Set(loadedVideos.map(v => v.path)).has(v.path) && v.isCompatible !== false
            )) :
            videosWithInstantCheck.filter(v => v.isCompatible !== false);
            
          if (currentVideos.length > 0) {
            const { videos: videosWithDeepCheck } = await checkAllVideosCompatibility(currentVideos);
            setLoadedVideos(videosWithDeepCheck);
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