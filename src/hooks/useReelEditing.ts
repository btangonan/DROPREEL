import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { VideoFile } from '@/types';
import { checkVideoCompatibilityInstant } from '@/lib/utils/videoCompatibility';

interface TitleElement {
  id: string;
  text: string;
  size: string;
  timestamp: number;
}

interface VideoState {
  yourVideos: VideoFile[];
  selects: VideoFile[];
}

export function useReelEditing() {
  const router = useRouter();
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [isLoadingReel, setIsLoadingReel] = useState(false);
  const [titles, setTitles] = useState<TitleElement[]>([]);

  const loadReelForEditing = useCallback((reelId: string) => {
    setIsLoadingReel(true);
    return fetch(`/api/reels?id=${reelId}`)
      .then(response => response.json())
      .then(data => {
        
        let loadedVideos: VideoFile[] = [];
        let videoState: VideoState = { yourVideos: [], selects: [] };
        let folderPath = '';
        
        // Restore the complete edit state if available
        if (data.editState) {
          const { allOriginalVideos, selectedVideos, folderPath: savedFolderPath, currentYourVideos, currentSelects } = data.editState;
          
          
          // Try to use the saved current panel state first (most accurate)
          if (currentYourVideos && currentSelects) {
            loadedVideos = [...currentYourVideos, ...currentSelects];
            videoState = {
              yourVideos: currentYourVideos,
              selects: currentSelects
            };
          } else if (allOriginalVideos && selectedVideos) {
            // Reconstruct the exact state: 
            // YOUR VIDEOS = all original videos MINUS the ones that were selected
            const selectedVideoIds = new Set(selectedVideos.map((v: VideoFile) => v.id));
            const unselectedVideos = allOriginalVideos.filter((v: VideoFile) => !selectedVideoIds.has(v.id));
            
            loadedVideos = allOriginalVideos;
            videoState = {
              yourVideos: unselectedVideos, // Videos that remained unselected
              selects: selectedVideos // Videos that were selected for the reel
            };
          }
          
          if (savedFolderPath) {
            folderPath = savedFolderPath;
          }
        } else if (data.videos) {
          // Fallback for older reels without editState
          videoState = {
            yourVideos: [],
            selects: data.videos
          };
        }
        
        // Restore titles from editState if available, otherwise use the basic title
        if (data.editState && data.editState.titles && data.editState.titles.length > 0) {
          setTitles(data.editState.titles);
        } else if (data.title) {
          setTitles([{ id: '1', text: data.title, size: 'large', timestamp: Date.now() }]);
        }
        
        setIsLoadingReel(false);
        
        return { loadedVideos, videoState, folderPath };
      })
      .catch(error => {
        console.error('Error loading reel for editing:', error);
        setIsLoadingReel(false);
        throw error;
      });
  }, []);

  const createOrUpdateReel = useCallback(async (
    videoState: VideoState, 
    loadedVideos: VideoFile[], 
    folderPath: string,
    titles: TitleElement[]
  ) => {
    if (videoState.selects.length === 0) return;

    // Filter out incompatible videos before creating reel
    const compatibleVideos = videoState.selects.filter(video => {
      // Only filter out videos that have been browser-tested and confirmed incompatible
      if (video.checkedWithBrowser && video.isCompatible === false) {
        console.warn('Filtering out browser-verified incompatible video from reel:', video.name, {
          reason: video.compatibilityError
        });
        return false;
      }
      
      // Allow all other videos through - they'll be checked during playback
      return true;
    });

    // If no compatible videos left, throw error
    if (compatibleVideos.length === 0) {
      throw new Error('Cannot create reel: No compatible videos selected');
    }

    // Warn if some videos were filtered out
    if (compatibleVideos.length < videoState.selects.length) {
      const removedCount = videoState.selects.length - compatibleVideos.length;
      console.warn(`Removed ${removedCount} incompatible video(s) from reel`);
    }

    const isEditing = editingReelId !== null;
    

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const requestBody = {
        videos: compatibleVideos, // Use filtered compatible videos
        title: titles.length > 0 ? titles[0].text : `Reel ${new Date().toLocaleDateString()}`,
        description: `Created with ${compatibleVideos.length} videos`,
        // Save the complete state for editing
        editState: {
          folderPath,
          allOriginalVideos: loadedVideos, // All videos originally loaded from Dropbox
          selectedVideos: videoState.selects, // The videos that were selected for the reel
          // Also save current panel state as backup
          currentYourVideos: videoState.yourVideos,
          currentSelects: videoState.selects,
          // Save title data for restoration
          titles: titles
        },
        // Include ID in body for PUT requests
        ...(isEditing && { id: editingReelId })
      };
      
      const response = await fetch('/api/reels', {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? 'update' : 'create'} reel`);
      }

      const updatedReel = await response.json();
      const reelId = isEditing ? editingReelId : updatedReel.id;
      
      // Store the current edit state for browser back navigation
      localStorage.setItem('lastReelEditState', JSON.stringify({
        reelId: reelId,
        editState: {
          folderPath,
          allOriginalVideos: loadedVideos,
          selectedVideos: videoState.selects,
          currentYourVideos: videoState.yourVideos,
          currentSelects: videoState.selects
        }
      }));
      
      // Navigate to reel page
      router.push(`/r/${reelId}`);
      
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} reel:`, error);
      throw new Error(`Failed to ${isEditing ? 'update' : 'create'} reel. Please try again.`);
    }
  }, [editingReelId, router]);

  const handleAddTitle = useCallback((text: string, size: string) => {
    const newTitle: TitleElement = {
      id: Date.now().toString(),
      text: text.toUpperCase(),
      size,
      timestamp: Date.now()
    };
    // Replace existing title instead of adding to array
    setTitles([newTitle]);
  }, []);

  const checkEditState = useCallback(() => {
    // Only run on client side
    if (typeof window === 'undefined') return null;
    
    const urlParams = new URLSearchParams(window.location.search);
    const editReelId = urlParams.get('edit');
    
    // Check localStorage for browser back navigation from reel view
    const lastReelEditState = localStorage.getItem('lastReelEditState');
    let shouldRestoreFromBack = false;
    let backReelId = null;
    
    if (lastReelEditState && !editReelId) {
      try {
        const stored = JSON.parse(lastReelEditState);
        backReelId = stored.reelId;
        // Only restore if we're on the main page without edit parameter
        shouldRestoreFromBack = window.location.pathname === '/' && !editReelId;
      } catch (e) {
        console.error('Error parsing stored edit state:', e);
      }
    }
    
    
    if (editReelId && editReelId !== editingReelId) {
      // Edit via URL parameter (from EDIT REEL button)
      setEditingReelId(editReelId);
      // Return the loading promise so caller can handle the state updates
      return { type: 'url-edit', reelId: editReelId };
    } else if (shouldRestoreFromBack && backReelId) {
      // Browser back navigation - restore from localStorage
      
      setEditingReelId(backReelId);
      
      // Update URL to include edit parameter for consistency
      const newUrl = `${window.location.pathname}?edit=${backReelId}`;
      window.history.replaceState(null, '', newUrl);
      
      // Return stored state for caller to handle
      const stored = JSON.parse(lastReelEditState!);
      // Clear the stored state after using it
      localStorage.removeItem('lastReelEditState');
      
      return { type: 'back-navigation', reelId: backReelId, storedState: stored };
    }
    
    return null;
  }, [editingReelId]);

  // Check for edit parameter and load reel data, OR restore from browser back navigation
  useEffect(() => {
    checkEditState();
  }, [checkEditState]);

  return {
    editingReelId,
    setEditingReelId,
    isLoadingReel,
    setIsLoadingReel,
    titles,
    setTitles,
    loadReelForEditing,
    createOrUpdateReel,
    handleAddTitle,
    checkEditState
  };
}