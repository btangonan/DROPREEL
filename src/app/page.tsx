'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoFile } from '@/types';
import { extractDropboxPath } from '@/lib/utils/dropboxUtils';
import { checkAllVideosCompatibility } from '@/lib/utils/videoCompatibility';
import FolderBrowser from '@/components/FolderBrowser/FolderBrowser';
import VideoPreviewModal from '@/components/VideoPreviewModal';
import TitleEditor from '@/components/TitleEditor/TitleEditor';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import DndKitVideoGrid, { VideoGridItem } from '@/components/DraggableVideoList/DndKitVideoGrid';
import PopoutVideoOverlay from '@/components/DraggableVideoList/PopoutVideoOverlay';
import { Wifi, Plus, FileText, Palette, Zap, Database, Star, Sun, Moon, LogIn, MousePointer2 } from 'lucide-react';

interface VideoClickAction {
  play?: boolean;
  rect?: DOMRect;
}

interface TitleElement {
  id: string;
  text: string;
  size: string;
  timestamp: number;
}

export default function Home() {
  const router = useRouter();
  const [isDropboxAuthenticated, setIsDropboxAuthenticated] = useState(false);
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [isLoadingReel, setIsLoadingReel] = useState(false);
  const [isDropboxAuthLoading, setIsDropboxAuthLoading] = useState(true);
  const [, setDropboxAuthStatus] = useState<string | null>(null);
  const [, setDropboxAuthErrorCode] = useState<string | null>(null);
  const [, setDropboxAuthRetryable] = useState<boolean>(false);
  const [, setDropboxAuthSuggestedAction] = useState<string | null>(null);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [folderPath, setFolderPath] = useState('');
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [loadedVideos, setLoadedVideos] = useState<VideoFile[]>([]);
  const [error, setError] = useState('');
  const [titles, setTitles] = useState<TitleElement[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode for brutalist theme
  const [previewVideo, setPreviewVideo] = useState<VideoFile | null>(null);
  const [showTitleEditor, setShowTitleEditor] = useState(false);

  // Custom collision detection for grid positioning
  const customCollisionDetection = useCallback((args: any) => {
    const { active, droppableContainers, pointerCoordinates } = args;
    
    // First check if we're over a container
    const pointerCollisions = pointerWithin(args);
    const containerCollision = pointerCollisions.find(collision => 
      collision.id === 'yourVideos' || collision.id === 'selects'
    );
    
    if (containerCollision && pointerCollisions.length === 1) {
      // Only container collision, append to end
      return [containerCollision];
    }
    
    // For items within containers, use a custom grid-aware detection
    if (pointerCoordinates) {
      const videoCollisions = [];
      
      for (const container of droppableContainers) {
        const { id, rect } = container;
        
        // Skip container-level droppables
        if (id === 'yourVideos' || id === 'selects') continue;
        
        if (rect.current) {
          const { top, left, width, height } = rect.current;
          const { x, y } = pointerCoordinates;
          
          // Check if pointer is within this video's bounds
          if (x >= left && x <= left + width && y >= top && y <= top + height) {
            // Calculate which quadrant for better positioning
            const centerX = left + width / 2;
            const centerY = top + height / 2;
            const isLeft = x < centerX;
            const isTop = y < centerY;
            
            videoCollisions.push({
              id,
              data: { 
                quadrant: { isLeft, isTop },
                bounds: { top, left, width, height }
              }
            });
          }
        }
      }
      
      if (videoCollisions.length > 0) {
        // Return the most relevant collision
        return [videoCollisions[0]];
      }
    }
    
    // Fallback to rect intersection
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    
    // Final fallback
    return closestCenter(args);
  }, []);

  // DnD state
  const [videoState, setVideoState] = useState<{ yourVideos: VideoFile[]; selects: VideoFile[] }>({ yourVideos: [], selects: [] });
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced distance for more responsive dragging
      },
    })
  );

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Check for edit parameter and load reel data, OR restore from browser back navigation
  useEffect(() => {
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
    
    console.log('Navigation detection:', {
      editReelId,
      currentURL: window.location.href,
      editingReelId,
      shouldRestoreFromBack,
      backReelId,
      hasStoredState: !!lastReelEditState
    });
    
    if (editReelId && editReelId !== editingReelId) {
      // Edit via URL parameter (from EDIT REEL button)
      setEditingReelId(editReelId);
      setIsLoadingReel(true);
      
      console.log('Loading reel for editing via URL parameter:', editReelId);
      loadReelForEditing(editReelId);
    } else if (shouldRestoreFromBack && backReelId) {
      // Browser back navigation - restore from localStorage
      console.log('Detected browser back navigation, restoring reel:', backReelId);
      
      setEditingReelId(backReelId);
      setIsLoadingReel(true);
      
      // Load from stored state first, then supplement with API data if needed
      const stored = JSON.parse(lastReelEditState!);
      if (stored.editState) {
        const { currentYourVideos, currentSelects, folderPath: savedFolderPath } = stored.editState;
        
        console.log('Restoring from localStorage:', {
          yourVideos: currentYourVideos?.length,
          selects: currentSelects?.length,
          folderPath: savedFolderPath
        });
        
        if (currentYourVideos && currentSelects) {
          setLoadedVideos([...currentYourVideos, ...currentSelects]);
          setVideoState({
            yourVideos: currentYourVideos,
            selects: currentSelects
          });
          
          if (savedFolderPath) {
            setFolderPath(savedFolderPath);
          }
          
          setIsLoadingReel(false);
        }
      }
      
      // Update URL to include edit parameter for consistency
      const newUrl = `${window.location.pathname}?edit=${backReelId}`;
      window.history.replaceState(null, '', newUrl);
      
      // Clear the stored state after using it
      localStorage.removeItem('lastReelEditState');
    } else {
      console.log('No reel editing detected');
    }
  }, [editingReelId]);

  // Extracted function to load reel data for editing
  const loadReelForEditing = (reelId: string) => {
    fetch(`/api/reels?id=${reelId}`)
      .then(response => response.json())
      .then(data => {
        console.log('Loading reel for editing:', data);
        
        // Restore the complete edit state if available
        if (data.editState) {
          const { allOriginalVideos, selectedVideos, folderPath: savedFolderPath, currentYourVideos, currentSelects } = data.editState;
          
          console.log('EditState found:', {
            allOriginalVideos: allOriginalVideos?.length,
            selectedVideos: selectedVideos?.length,
            currentYourVideos: currentYourVideos?.length,
            currentSelects: currentSelects?.length
          });
          
          // Try to use the saved current panel state first (most accurate)
          if (currentYourVideos && currentSelects) {
            console.log('Using saved panel state');
            setLoadedVideos([...currentYourVideos, ...currentSelects]); // Restore the original loaded videos
            setVideoState({
              yourVideos: currentYourVideos,
              selects: currentSelects
            });
          } else if (allOriginalVideos && selectedVideos) {
            console.log('Using reconstructed state from original videos');
            // Reconstruct the exact state: 
            // YOUR VIDEOS = all original videos MINUS the ones that were selected
            const selectedVideoIds = new Set(selectedVideos.map((v: VideoFile) => v.id));
            const unselectedVideos = allOriginalVideos.filter((v: VideoFile) => !selectedVideoIds.has(v.id));
            
            setLoadedVideos(allOriginalVideos); // Restore the original loaded videos
            setVideoState({
              yourVideos: unselectedVideos, // Videos that remained unselected
              selects: selectedVideos // Videos that were selected for the reel
            });
          }
          
          if (savedFolderPath) {
            setFolderPath(savedFolderPath);
          }
        } else if (data.videos) {
          console.log('Fallback: using videos only');
          // Fallback for older reels without editState
          setVideoState({
            yourVideos: [],
            selects: data.videos
          });
        }
        
        // Restore titles from editState if available, otherwise use the basic title
        if (data.editState && data.editState.titles && data.editState.titles.length > 0) {
          setTitles(data.editState.titles);
        } else if (data.title) {
          setTitles([{ id: '1', text: data.title, size: 'large', timestamp: Date.now() }]);
        }
        setIsLoadingReel(false);
      })
      .catch(error => {
        console.error('Error loading reel for editing:', error);
        setIsLoadingReel(false);
      });
  };

  // Centralized user flow state
  type Step = 'connect' | 'addVideos' | 'addTitle';
  let currentStep: Step = 'connect';
  if (isDropboxAuthenticated && !loadedVideos.length) {
    currentStep = 'addVideos';
  } else if (isDropboxAuthenticated && loadedVideos.length) {
    currentStep = 'addTitle';
  }
  const getStepStatus = (step: Step) => {
    if (step === currentStep) return 'next';
    if (
      (step === 'connect' && (currentStep === 'addVideos' || currentStep === 'addTitle')) ||
      (step === 'addVideos' && currentStep === 'addTitle')
    ) return 'complete';
    return 'default';
  };

  const latestAuthState = useRef(isDropboxAuthenticated);

  useEffect(() => {
    latestAuthState.current = isDropboxAuthenticated;
    console.log('[page] isDropboxAuthenticated:', isDropboxAuthenticated);
  }, [isDropboxAuthenticated]);

  useEffect(() => {
    console.log('[page] isDropboxAuthLoading:', isDropboxAuthLoading);
  }, [isDropboxAuthLoading]);

  // Helper function to get video duration
  const getVideoDuration = (videoUrl: string): Promise<string> => {
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
  };

  const handleAddVideosClick = async () => {
    console.log('[handleAddVideosClick] Called');
    if (await checkDropboxAuth()) {
      setShowFolderBrowser(true);
      console.log('[handleAddVideosClick] Authenticated, opening FolderBrowser');
    } else {
      setError('Authentication required. Please click CONNECT to continue.');
      console.log('[handleAddVideosClick] Not authenticated, showing error');
    }
  };

  const fetchVideos = async (path: string, appendToExisting = false) => {
    if (!path) {
      setError('Please enter a Dropbox folder path or link');
      return;
    }
    setIsFetchingVideos(true);
    setError('');
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
          console.log(`[fetchVideos] Added ${newVideos.length} new videos instantly`);
        } else {
          setLoadedVideos(videosWithDefaults);
          console.log(`[fetchVideos] Loaded ${videosWithDefaults.length} videos instantly`);
        }
        
        // Check compatibility in the background and update as needed
        setTimeout(async () => {
          console.log(`[fetchVideos] Starting background compatibility check for ${videosWithDefaults.length} videos...`);
          
          const { videos: videosWithCompatibility } = await checkAllVideosCompatibility(videosWithDefaults);
          
          const compatibleCount = videosWithCompatibility.filter(v => v.isCompatible).length;
          const incompatibleCount = videosWithCompatibility.filter(v => !v.isCompatible).length;
          
          console.log(`[fetchVideos] Background compatibility results: ${compatibleCount} compatible, ${incompatibleCount} incompatible`);
          
          if (incompatibleCount > 0) {
            const incompatibleVideos = videosWithCompatibility.filter(v => !v.isCompatible);
            console.log('[fetchVideos] Incompatible videos:', incompatibleVideos.map(v => ({ name: v.name, error: v.compatibilityError })));
            setError(`${incompatibleCount} video(s) have incompatible format. ${compatibleCount} videos are playable.`);
          } else {
            setError(''); // Clear any existing error
          }
          
          // Update videos with compatibility info and durations
          const videosWithDurations = await Promise.all(
            videosWithCompatibility.map(async (video) => {
              try {
                const duration = await getVideoDuration(video.streamUrl);
                console.log(`[fetchVideos] Got duration for ${video.name}: ${duration}`);
                return { ...video, duration };
              } catch (error) {
                console.warn(`[fetchVideos] Failed to get duration for ${video.name}:`, error);
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
        }, 100); // Start background check after UI update
      } else {
        if (!appendToExisting) {
          setLoadedVideos([]);
        }
        setError('No video files found in the specified folder');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Error loading videos: ${errorMessage}`);
      if (!appendToExisting) {
        setLoadedVideos([]);
      }
    } finally {
      setIsFetchingVideos(false);
    }
  };

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

  // Handler for drag end (cross-panel and reorder)
  const handleDragEnd = useCallback((e: { active: { id: string | number; data: { current: { droppableId: string } } }; over: { id: string | number; data: { current: { droppableId: string } } } | null }) => {
    setActiveId(null);
    const { active, over } = e;
    if (!active || !over) {
      console.log('[handleDragEnd] No active or over, cancelling drag');
      return;
    }

    console.log('[handleDragEnd] Drag ended:', { activeId: active.id, overId: over.id });

    // Find the video being dragged to check compatibility
    const activeIdStr = String(active.id);
    let sourceVideo: VideoFile | undefined;
    const allVideos = [...videoState.yourVideos, ...videoState.selects];
    sourceVideo = allVideos.find(v => 
      `yourVideos-${v.id}` === activeIdStr || 
      `selects-${v.id}` === activeIdStr || 
      v.id === activeIdStr
    );

    // Prevent dragging incompatible videos to the selects panel
    if (sourceVideo && sourceVideo.isCompatible === false) {
      const destContainer = String(over.id);
      const isMovingToSelects = destContainer === 'selects' || destContainer.startsWith('selects-');
      
      if (isMovingToSelects) {
        console.log('[handleDragEnd] Preventing incompatible video from being added to selects:', sourceVideo.name);
        setError(`Cannot add "${sourceVideo.name}" to reel: ${sourceVideo.compatibilityError || 'Video format not supported'}`);
        return;
      }
    }

    setVideoState(prev => {
      const newState = { yourVideos: [...prev.yourVideos], selects: [...prev.selects] };

      // Find the video item by looking for the active.id which might be a compound key
      const activeIdStr = String(active.id);
      let sourceVideo: VideoFile | undefined;
      let sourceContainer: 'yourVideos' | 'selects' = 'yourVideos';
      let sourceIndex = -1;

      // Check yourVideos first
      sourceIndex = newState.yourVideos.findIndex(v => `yourVideos-${v.id}` === activeIdStr || v.id === activeIdStr);
      if (sourceIndex !== -1) {
        sourceVideo = newState.yourVideos[sourceIndex];
        sourceContainer = 'yourVideos';
      } else {
        // Check selects
        sourceIndex = newState.selects.findIndex(v => `selects-${v.id}` === activeIdStr || v.id === activeIdStr);
        if (sourceIndex !== -1) {
          sourceVideo = newState.selects[sourceIndex];
          sourceContainer = 'selects';
        }
      }

      if (!sourceVideo) {
        console.log('[handleDragEnd] Source video not found');
        return newState;
      }

      // Determine destination container and index
      let destContainer: 'yourVideos' | 'selects' | null = null;
      let destIndex: number = -1;
      
      if (over.id === 'yourVideos' || over.id === 'selects') {
        // Dropped on container - append to end
        destContainer = over.id as 'yourVideos' | 'selects';
        destIndex = newState[destContainer].length;
        console.log('[handleDragEnd] Dropped on container:', destContainer);
      } else {
        // Dropped on an item - find which container it belongs to
        const overIdStr = String(over.id);
        const foundInYourVideos = newState.yourVideos.find(v => `yourVideos-${v.id}` === overIdStr || v.id === overIdStr);
        const foundInSelects = newState.selects.find(v => `selects-${v.id}` === overIdStr || v.id === overIdStr);
        
        if (foundInYourVideos) {
          destContainer = 'yourVideos';
          destIndex = newState.yourVideos.findIndex(v => `yourVideos-${v.id}` === overIdStr || v.id === overIdStr);
          console.log('[handleDragEnd] Dropped on item in yourVideos at index:', destIndex);
        } else if (foundInSelects) {
          destContainer = 'selects';
          destIndex = newState.selects.findIndex(v => `selects-${v.id}` === overIdStr || v.id === overIdStr);
          console.log('[handleDragEnd] Dropped on item in selects at index:', destIndex);
        }
      }

      // Guard: only proceed if destContainer is valid
      if (!destContainer || destIndex === -1) {
        console.log('[handleDragEnd] No valid destination found');
        return newState;
      }

      if (sourceContainer === destContainer) {
        // Reorder within same container using arrayMove
        const reordered = arrayMove(newState[sourceContainer], sourceIndex, destIndex);
        if (sourceContainer === 'yourVideos') {
          newState.yourVideos = reordered;
        } else {
          newState.selects = reordered;
        }
        console.log('[handleDragEnd] Reordered within container:', sourceContainer);
      } else {
        // Move between containers
        const sourceArr = [...newState[sourceContainer]];
        const destArr = [...newState[destContainer]];
        const [movedItem] = sourceArr.splice(sourceIndex, 1);
        destArr.splice(destIndex, 0, movedItem);
        
        if (sourceContainer === 'yourVideos') {
          newState.yourVideos = sourceArr;
          newState.selects = destArr;
        } else {
          newState.selects = sourceArr;
          newState.yourVideos = destArr;
        }
        console.log('[handleDragEnd] Moved between containers:', { from: sourceContainer, to: destContainer });
      }

      console.log('[handleDragEnd] Final state:', {
        yourVideosIds: newState.yourVideos.map(v => v.id),
        selectsIds: newState.selects.map(v => v.id)
      });
      
      return newState;
    });
  }, []);

  // For DragOverlay
  const allVideos = [...videoState.yourVideos, ...videoState.selects];
  const activeVideo = allVideos.find(v => {
    const activeIdStr = String(activeId);
    return v.id === activeIdStr || `yourVideos-${v.id}` === activeIdStr || `selects-${v.id}` === activeIdStr;
  }) || null;

  // Check Dropbox authentication status
  const checkDropboxAuth = async () => {
    setIsDropboxAuthLoading(true);
    try {
      const response = await fetch('/api/auth/dropbox/status');
      if (!response.ok) throw new Error('Auth check failed');
      const data = await response.json();
      const isAuth = !!data.isAuthenticated;
      setIsDropboxAuthenticated(isAuth);
      setDropboxAuthStatus(data.status || '');
      setDropboxAuthErrorCode(data.errorCode);
      setDropboxAuthRetryable(data.retryable);
      setDropboxAuthSuggestedAction(data.suggestedAction);
      if (!isAuth && data.suggestedAction) {
        setError(data.suggestedAction);
      }
      console.log('[checkDropboxAuth] Auth status:', isAuth, data.status, data.errorCode, data.suggestedAction);
      return isAuth;
    } catch (err) {
      console.error('[checkDropboxAuth] Error:', err);
      setIsDropboxAuthenticated(false);
      setDropboxAuthStatus('unknown_error');
      setDropboxAuthErrorCode('unknown_error');
      setDropboxAuthRetryable(false);
      setDropboxAuthSuggestedAction('Please try reconnecting your Dropbox account.');
      setError('Unable to check Dropbox authentication. Please try again.');
      return false;
    } finally {
      setIsDropboxAuthLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = () => {
      console.log('Periodic auth check');
      checkDropboxAuth();
    };
    checkAuth(); // Check immediately
    const interval = setInterval(checkAuth, 2 * 60 * 1000); // Every 2 minutes
    return () => clearInterval(interval);
  }, []);

  // Handler for connect button
  const handleDropboxConnect = () => {
    window.location.href = '/api/auth/dropbox';
  };

  const [popoutVideo, setPopoutVideo] = useState<VideoFile | null>(null);
  const [popoutRect, setPopoutRect] = useState<DOMRect | null>(null);

  // Function to map size IDs to CSS classes
  const getTitleSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'text-xs';
      case 'medium': return 'text-sm';
      case 'large': return 'text-base';
      case 'extra-large': return 'text-lg';
      case 'huge': return 'text-xl';
      default: return 'text-base';
    }
  };

  const handleAddTitle = (text: string, size: string) => {
    const newTitle: TitleElement = {
      id: Date.now().toString(),
      text: text.toUpperCase(),
      size,
      timestamp: Date.now()
    };
    // Replace existing title instead of adding to array
    setTitles([newTitle]);
  };

  const handleVideoClick = (video: VideoFile, action?: VideoClickAction) => {
    const safeAction = action || {};
    console.log('[handleVideoClick] Video clicked:', video.name, 'Action:', safeAction);
    
    // Always use the VideoPreviewModal for both play and preview
    setPreviewVideo(video);
    
    // Clear any existing popout state
    setPopoutVideo(null);
    setPopoutRect(null);
  };

  const handleVideoDelete = (video: VideoFile, sourcePanel: 'yourVideos' | 'selects') => {
    console.log('[handleVideoDelete] Deleting video:', video.name, 'from:', sourcePanel);
    
    setVideoState(prev => {
      const newState = { ...prev };
      
      if (sourcePanel === 'yourVideos') {
        newState.yourVideos = prev.yourVideos.filter(v => v.id !== video.id);
      } else {
        newState.selects = prev.selects.filter(v => v.id !== video.id);
      }
      
      console.log('[handleVideoDelete] Updated state:', {
        yourVideosCount: newState.yourVideos.length,
        selectsCount: newState.selects.length
      });
      
      return newState;
    });
  };

  const handleMakeReel = async () => {
    if (videoState.selects.length === 0) return;

    const isEditing = editingReelId !== null;
    const actionText = isEditing ? 'Updating' : 'Creating';
    
    console.log(`${actionText} reel with state:`, {
      reelId: editingReelId,
      folderPath,
      loadedVideos: loadedVideos.length,
      videoState,
      editStateToSave: {
        folderPath,
        allOriginalVideos: loadedVideos,
        selectedVideos: videoState.selects,
        currentYourVideos: videoState.yourVideos,
        currentSelects: videoState.selects
      }
    });

    try {
      const method = isEditing ? 'PUT' : 'POST';
      const requestBody = {
        videos: videoState.selects,
        title: titles.length > 0 ? titles[0].text : `Reel ${new Date().toLocaleDateString()}`,
        description: `Created with ${videoState.selects.length} videos`,
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
      setError(`Failed to ${isEditing ? 'update' : 'create'} reel. Please try again.`);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragStart={e => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          {/* Header */}
          <div className="matrix-header pt-6 pr-6 pl-6 pb-0">
            {/* Top bar with logo, theme toggle, and login */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl text-terminal">REELDROP</h1>
                <div className="text-xs text-muted-foreground mt-1">
                  DROP IT. SEND IT. BOOK IT.
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="control-button flex items-center gap-2"
                >
                  {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>{isDarkMode ? 'LIGHT' : 'DARK'}</span>
                </button>
                <button className="control-button flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>LOGIN</span>
                </button>
              </div>
            </div>
            
            {/* Button Grid */}
            <div className="flex gap-4 mb-5 items-stretch w-full">
              <button 
                className={`brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2 ${
                  isDropboxAuthenticated ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}
                onClick={isDropboxAuthenticated ? undefined : handleDropboxConnect}
                disabled={isDropboxAuthLoading}
              >
                <Wifi className="w-4 h-4" />
                <span>{isDropboxAuthLoading ? 'CHECKING...' : isDropboxAuthenticated ? 'CONNECTED' : 'CONNECT'}</span>
              </button>
              <button 
                className="brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2"
                onClick={handleAddVideosClick}
                disabled={!isDropboxAuthenticated}
              >
                <Plus className="w-4 h-4" />
                <span>ADD VIDEOS</span>
              </button>
              {titles.length > 0 ? (
                <button 
                  className="brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2 bg-green-500 text-white hover:opacity-80"
                  onClick={() => setShowTitleEditor(true)}
                >
                  <FileText className="w-4 h-4" />
                  <span className={getTitleSizeClass(titles[0].size)}>{titles[0].text}</span>
                </button>
              ) : (
                <button 
                  className="brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2"
                  onClick={() => setShowTitleEditor(true)}
                >
                  <FileText className="w-4 h-4" />
                  <span>ADD TITLE</span>
                </button>
              )}
              <button 
                className="brutal-button-accent flex-1 inline-flex px-4 py-3 items-center gap-2"
                disabled={videoState.selects.length === 0}
                onClick={handleMakeReel}
              >
                <Zap className="w-4 h-4" />
                <span>{editingReelId ? 'UPDATE REEL' : 'MAKE REEL'}</span>
              </button>
            </div>

          </div>
          
          {/* Horizontal Divider - Full Width */}
          <div className="horizontal-divider" />

          {/* Main Interface */}
          <div className="pt-0 pb-0 px-6">
            <div className="grid grid-cols-[1fr_1fr] gap-4 items-stretch mt-5">
              {/* Video Archive */}
              <div className="panel" style={{ height: '500px' }}>
                {/* Header */}
                <div className="panel-header px-6 py-4 flex items-center gap-2 flex-shrink-0 font-mono font-bold uppercase tracking-wider text-base">
                  <Database className="w-5 h-5 mr-2" />
                  <span>YOUR VIDEOS</span>
                  <div className="ml-auto flex items-center gap-2" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                    <div className="text-xs font-mono px-2 py-1">
                      {videoState.yourVideos.length} FILES
                    </div>
                  </div>
                </div>
                {/* Video content with scroll */}
                <div className="panel-content">
                  <div className="panel-scroll">
                    <SortableContext items={videoState.yourVideos.map(v => `yourVideos-${v.id}`)} strategy={rectSortingStrategy}>
                      <DndKitVideoGrid
                        videos={videoState.yourVideos}
                        onReorder={newOrder => setVideoState(s => ({ ...s, yourVideos: newOrder }))}
                        gridId="yourVideos"
                        emptyMessage=""
                        onVideoClick={handleVideoClick}
                        onVideoDelete={(video) => handleVideoDelete(video, 'yourVideos')}
                        customEmptyContent={
                          // Add Videos Button - Small Dotted Square
                          <div className="flex flex-col items-center justify-center h-full text-center">
                            <button
                              onClick={handleAddVideosClick}
                              className="flex flex-col items-center justify-center transition-all duration-200 hover:opacity-80"
                              disabled={!isDropboxAuthenticated}
                            >
                              {/* Dotted Square with Plus */}
                              <div 
                                className="w-24 h-24 border-2 border-dashed flex items-center justify-center mb-4 hover:border-solid transition-all duration-200"
                                style={{ 
                                  borderColor: 'var(--border)',
                                  background: 'transparent'
                                }}
                              >
                                <Plus 
                                  className="w-8 h-8" 
                                  strokeWidth={2}
                                  style={{ color: 'var(--foreground)' }}
                                />
                              </div>
                              {/* Black Text Below */}
                              <div className="font-mono font-bold uppercase tracking-wider text-lg" style={{ color: 'var(--foreground)' }}>
                                ADD VIDEOS
                              </div>
                            </button>
                          </div>
                        }
                      />
                    </SortableContext>
                  </div>
                </div>
              </div>
              {/* Reel Constructor */}
              <div className="panel" style={{ height: '500px' }}>
                <div className="panel-header px-6 py-4 flex items-center gap-2 flex-shrink-0 font-mono font-bold uppercase tracking-wider text-base">
                  <MousePointer2 className="w-5 h-5 mr-2" />
                  <span>SELECTED VIDEOS</span>
                  <div className="ml-auto flex items-center gap-2" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                    <div className="text-xs font-mono px-2 py-1">
                      {videoState.selects.length} FILES
                    </div>
                  </div>
                </div>
                <div className="panel-content">
                  <div className="panel-scroll">
                    <SortableContext items={videoState.selects.map(v => `selects-${v.id}`)} strategy={rectSortingStrategy}>
                      <DndKitVideoGrid
                        videos={videoState.selects}
                        onReorder={newOrder => setVideoState(s => ({ ...s, selects: newOrder }))}
                        gridId="selects"
                        emptyMessage="No videos selected. Drag videos from the left panel to get started."
                        onVideoClick={handleVideoClick}
                        onVideoDelete={(video) => handleVideoDelete(video, 'selects')}
                      />
                    </SortableContext>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DragOverlay>
            {activeVideo ? (
              <div style={{ width: '100%' }}>
                <VideoGridItem
                  video={activeVideo}
                  isDragging={true}
                  listeners={{}}
                  attributes={{}}
                  style={{ width: '100%' }}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {showFolderBrowser && (
          <FolderBrowser
            onFolderSelect={path => {
              setFolderPath(path);
              setShowFolderBrowser(false);
              // If we already have videos, append new ones; otherwise replace
              const shouldAppend = loadedVideos.length > 0;
              fetchVideos(path, shouldAppend);
            }}
            onClose={() => setShowFolderBrowser(false)}
            initialPath={folderPath}
            isAddingToExisting={loadedVideos.length > 0}
            onAuthError={() => {
              setIsDropboxAuthenticated(false);
              setShowFolderBrowser(false);
              checkDropboxAuth();
            }}
          />
        )}

        {/* Video Preview Modal */}
        {previewVideo && (
          <VideoPreviewModal
            isOpen={!!previewVideo}
            onClose={() => setPreviewVideo(null)}
            videoSrc={previewVideo.streamUrl || ''}
            title={previewVideo.name || previewVideo.title || ''}
            isCompatible={previewVideo.isCompatible}
            compatibilityError={previewVideo.compatibilityError}
          />
        )}

        {/* Popout Video Overlay */}
        {popoutVideo && (
          <PopoutVideoOverlay
            video={popoutVideo}
            rect={popoutRect}
            onClose={() => {
              setPopoutVideo(null);
              setPopoutRect(null);
            }}
          />
        )}

        {/* Title Editor Modal */}
        <TitleEditor
          isOpen={showTitleEditor}
          onClose={() => setShowTitleEditor(false)}
          onAddTitle={handleAddTitle}
          initialTitle={titles.length > 0 ? titles[0].text : ''}
          initialSize={titles.length > 0 ? titles[0].size : 'large'}
        />
      </div>
    </>
  );
}