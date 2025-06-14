import { useState, useEffect, useCallback } from 'react';
import { VideoFile } from '@/types';
import { extractDropboxPath } from '@/lib/utils/dropboxUtils';
import { checkAllVideosCompatibility } from '@/lib/utils/videoCompatibility';

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
            const streamResponse = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(video.path)}`);
            const streamData = await streamResponse.json();
            const thumbnailUrl = `/api/dropbox/thumbnail?path=${encodeURIComponent(video.path)}`;
            return {
              ...video,
              streamUrl: streamData.url,
              thumbnailUrl,
              duration: '0:00' // Will be updated asynchronously
            };
          })
        );
        
        // Add videos to UI immediately with default compatibility (assume compatible)
        const videosWithDefaults = videosWithUrls.map(video => ({
          ...video,
          isCompatible: true, // Default to compatible
          compatibilityError: null,
          dimensions: null
        }));
        
        if (appendToExisting) {
          // Filter out duplicates based on video path
          const existingPaths = new Set(loadedVideos.map(v => v.path));
          const newVideos = videosWithDefaults.filter(v => !existingPaths.has(v.path));
          setLoadedVideos(prev => [...prev, ...newVideos]);
        } else {
          setLoadedVideos(videosWithDefaults);
        }
        
        // Check compatibility in the background and update as needed
        setTimeout(async () => {
          
          const { videos: videosWithCompatibility } = await checkAllVideosCompatibility(videosWithDefaults);
          
          const compatibleCount = videosWithCompatibility.filter(v => v.isCompatible).length;
          const incompatibleCount = videosWithCompatibility.filter(v => !v.isCompatible).length;
          
          
          let compatibilityError = '';
          if (incompatibleCount > 0) {
            const incompatibleVideos = videosWithCompatibility.filter(v => !v.isCompatible);
            compatibilityError = `${incompatibleCount} video(s) have incompatible format. ${compatibleCount} videos are playable.`;
          }
          
          // Update videos with compatibility info and durations
          const videosWithDurations = await Promise.all(
            videosWithCompatibility.map(async (video) => {
              try {
                const duration = await getVideoDuration(video.streamUrl);
                return { ...video, duration };
              } catch (error) {
                return { ...video, duration: video.isCompatible ? '0:00' : 'N/A' };
              }
            })
          );
          
          // Update the loaded videos with compatibility and durations
          if (appendToExisting) {
            setLoadedVideos(prev => {
              const existingPaths = new Set(prev.map(v => v.path));
              const newVideosWithDurations = videosWithDurations.filter(v => !existingPaths.has(v.path));
              // Replace any videos that already exist with updated versions
              const updatedExisting = prev.map(existingVideo => {
                const updated = videosWithDurations.find(v => v.path === existingVideo.path);
                return updated || existingVideo;
              });
              return [...updatedExisting, ...newVideosWithDurations];
            });
          } else {
            setLoadedVideos(videosWithDurations);
          }
          
          return { error: compatibilityError || undefined };
        }, 100); // Start background check after UI update
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
    setLoadedVideos
  };
}