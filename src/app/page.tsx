'use client';

import { useState, useEffect } from 'react';
import { VideoFile } from '@/types';
import FolderBrowser from '@/components/FolderBrowser/FolderBrowser';
import VideoPreviewModal from '@/components/VideoPreviewModal';
import TitleEditor from '@/components/TitleEditor/TitleEditor';
import ReelPreviewModal from '@/components/ReelPreviewModal';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import { VideoGridItem } from '@/components/DraggableVideoList/DndKitVideoGrid';
import PopoutVideoOverlay from '@/components/DraggableVideoList/PopoutVideoOverlay';
import { initializeTheme, toggleTheme } from '@/lib/theme';
import { nanoid } from 'nanoid';

// Import custom hooks
import { useDropboxAuth } from '@/hooks/useDropboxAuth';
import { useVideoManagement } from '@/hooks/useVideoManagement';
import { useReelEditing } from '@/hooks/useReelEditing';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { checkVideoCompatibilityInstant } from '@/lib/utils/videoCompatibility';

// Import components
import { ReelMakerHeader } from '@/components/ReelMaker/ReelMakerHeader';
import { ActionButtons } from '@/components/ReelMaker/ActionButtons';
import { VideoPanels } from '@/components/ReelMaker/VideoPanels';



export default function Home() {
  // Custom hooks for separated concerns
  const auth = useDropboxAuth();
  const videos = useVideoManagement();  
  const reel = useReelEditing();
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState('');
  
  // Clear error when it's set (auto-dismiss)
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Drag and drop hook
  const dnd = useDragAndDrop(videos.videoState, videos.setVideoState, setError);
  
  // Modal states
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [showTitleEditor, setShowTitleEditor] = useState(false);
  const [showReelPreview, setShowReelPreview] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoFile | null>(null);
  const [popoutVideo, setPopoutVideo] = useState<VideoFile | null>(null);
  const [popoutRect, setPopoutRect] = useState<DOMRect | null>(null);


  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = initializeTheme();
    setIsDarkMode(savedTheme);
  }, []);

  // Handle theme toggle
  const handleThemeToggle = () => {
    const newTheme = toggleTheme(isDarkMode);
    setIsDarkMode(newTheme);
  };

  // Handle reel editing initialization
  useEffect(() => {
    const editInfo = reel.checkEditState();
    if (editInfo) {
      if (editInfo.type === 'url-edit') {
        reel.setIsLoadingReel(true);
        reel.loadReelForEditing(editInfo.reelId)
          .then(({ loadedVideos, videoState, folderPath }) => {
            videos.setLoadedVideos(loadedVideos);
            videos.setVideoState(videoState);
            videos.setFolderPath(folderPath);
          })
          .catch(() => {});
      } else if (editInfo.type === 'back-navigation') {
        const { storedState } = editInfo;
        if (storedState.editState) {
          const { currentYourVideos, currentSelects, folderPath: savedFolderPath } = storedState.editState;
          
          if (currentYourVideos && currentSelects) {
            videos.setLoadedVideos([...currentYourVideos, ...currentSelects]);
            videos.setVideoState({
              yourVideos: currentYourVideos,
              selects: currentSelects
            });
            
            if (savedFolderPath) {
              videos.setFolderPath(savedFolderPath);
            }
            
            reel.setIsLoadingReel(false);
          }
        }
      }
    }
  }, [reel, videos]);


  // Handler functions
  const handleAddVideosClick = async () => {
    if (await auth.checkAuth()) {
      setShowFolderBrowser(true);
    } else {
      setError('Authentication required. Please click CONNECT to continue.');
    }
  };

  const handleVideoClick = (video: VideoFile) => {
    // Always use the VideoPreviewModal for both play and preview
    setPreviewVideo(video);
    
    // Clear any existing popout state
    setPopoutVideo(null);
    setPopoutRect(null);
  };

  const handlePreviewReel = () => {
    if (videos.videoState.selects.length === 0) return;
    setShowReelPreview(true);
  };

  const handleUpdateReel = async () => {
    try {
      await reel.createOrUpdateReel(videos.videoState, videos.loadedVideos, videos.folderPath, reel.titles);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create reel');
    }
  };

  // Helper function to extract duration from Dropbox metadata
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getDurationFromMetadata = (mediaInfo: Record<string, unknown>): string => {
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
    
    return '0:00'; // Fallback
  };

  // Handle individual video selection from FolderBrowser
  const handleVideoSelect = async (selectedVideos: Array<{ name: string; path: string; type: string; isVideo: boolean; mediaInfo?: Record<string, unknown> }>) => {
    console.log('🚨 FUNCTION CALLED - handleVideoSelect with', selectedVideos.length, 'videos');
    console.log('🚨 Videos:', selectedVideos.map(v => v.name));
    
    const startTime = performance.now();
    console.log('🟢 [PERF] handleVideoSelect START:', selectedVideos.length, 'videos at', startTime);
    
    try {
      const step1 = performance.now();
      setShowFolderBrowser(false);
      console.log('🟡 [PERF] Step 1 - Close folder browser:', (step1 - startTime).toFixed(2), 'ms');
      
      const step2 = performance.now();
      console.log('🟡 [PERF] Step 2 - Starting video processing:', (step2 - startTime).toFixed(2), 'ms');
      
      // Convert FolderItems to VideoFiles format - INSTANT (no stream URL fetching)
      const newVideos = selectedVideos.map((item, index) => {
        const itemStart = performance.now();
        console.log(`🔵 [PERF] Video ${index + 1}/${selectedVideos.length} (${item.name}) - START processing (INSTANT)`);
        
        // Use instant compatibility check for immediate feedback
        const compatStart = performance.now();
        const instantCheck = checkVideoCompatibilityInstant(item);
        const compatEnd = performance.now();
        console.log(`🔵 [PERF] Video ${index + 1} - Compatibility check: ${(compatEnd - compatStart).toFixed(2)}ms`);
        
        // Skip stream URL fetching - will be done on-demand when video is played
        console.log(`🔵 [PERF] Video ${index + 1} - Skipping stream URL fetch for instant display`);
        
        const createStart = performance.now();
        const videoFile: VideoFile = {
          id: nanoid(),
          name: item.name,
          path: item.path,
          streamUrl: '', // Will be fetched when user tries to play video
          thumbnailUrl: `/api/dropbox/thumbnail?path=${encodeURIComponent(item.path)}`,
          duration: '0:00', // Will be updated in background
          mediaInfo: item.mediaInfo,
          isCompatible: instantCheck.isCompatible,
          compatibilityError: instantCheck.error || null,
          checkedWithBrowser: false // Will be updated in background
        };
        const createEnd = performance.now();
        
        const itemEnd = performance.now();
        console.log(`🔵 [PERF] Video ${index + 1} (${item.name}) - COMPLETE: ${(itemEnd - itemStart).toFixed(2)}ms total (object creation: ${(createEnd - createStart).toFixed(2)}ms)`);
        
        return videoFile;
      });
      
      const step3 = performance.now();
      console.log('🟡 [PERF] Step 3 - Video processing complete (INSTANT):', (step3 - step2).toFixed(2), 'ms');
      const step4 = performance.now();
      console.log('🟡 [PERF] Step 4 - Starting duplicate filtering:', (step4 - startTime).toFixed(2), 'ms');
      
      // Filter out duplicates but INCLUDE incompatible videos (they should show with warning labels)
      const shouldAppend = videos.loadedVideos.length > 0;
      const existingPaths = shouldAppend ? new Set(videos.loadedVideos.map(v => v.path)) : new Set();
      const videosToAdd = newVideos.filter(video => !existingPaths.has(video.path));
      
      const step5 = performance.now();
      console.log('🟡 [PERF] Step 5 - Duplicate filtering complete:', (step5 - startTime).toFixed(2), 'ms');
      console.log('Videos to add after duplicate filter:', videosToAdd.map(v => ({ name: v.name, isCompatible: v.isCompatible })));
      
      // Count skipped duplicates for user feedback
      const totalAttempted = newVideos.length;
      const duplicatesSkipped = newVideos.filter(v => existingPaths.has(v.path)).length;
      const incompatibleCount = videosToAdd.filter(v => v.isCompatible === false).length;
      console.log('🟡 [PERF] Incompatible count:', incompatibleCount, 'Total to add:', videosToAdd.length);
      
      const errorStart = performance.now();
      if (duplicatesSkipped > 0) {
        setError(`Skipped ${duplicatesSkipped} duplicate video(s). ${videosToAdd.length} videos added.`);
      } else if (incompatibleCount > 0) {
        setError(`${videosToAdd.length} videos added (${incompatibleCount} incompatible - will show warning labels).`);
      }
      const errorEnd = performance.now();
      console.log('🟡 [PERF] Step 6 - Error message set:', (errorEnd - startTime).toFixed(2), 'ms');
      
      // Add to existing videos or replace based on context
      const stateStart = performance.now();
      if (shouldAppend) {
        videos.setLoadedVideos(prev => [...prev, ...videosToAdd]);
        videos.setVideoState(prev => ({
          ...prev,
          yourVideos: [...prev.yourVideos, ...videosToAdd]
        }));
      } else {
        videos.setLoadedVideos(videosToAdd);
        videos.setVideoState({
          yourVideos: videosToAdd,
          selects: []
        });
      }
      const stateEnd = performance.now();
      console.log('🟢 [PERF] Step 7 - State updated (VIDEOS SHOULD NOW BE VISIBLE):', (stateEnd - startTime).toFixed(2), 'ms');
      console.log('🟢 [PERF] TOTAL TIME FROM BUTTON PRESS TO UI UPDATE:', (stateEnd - startTime).toFixed(2), 'ms');
      
      // Run background processing for stream URLs, real durations and compatibility
      setTimeout(async () => {
        console.log('🟡 [BACKGROUND] Starting background processing for individually selected videos...', videosToAdd.map(v => v.name));
        try {
          // First, fetch stream URLs for videos that don't have them
          const backgroundStart = performance.now();
          console.log('🟡 [BACKGROUND] Fetching stream URLs...');
          const videosWithStreamUrls = await Promise.all(
            videosToAdd.map(async (video) => {
              if (!video.streamUrl || video.streamUrl.trim() === '') {
                try {
                  const response = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(video.path)}`);
                  const streamData = await response.json();
                  const streamUrl = streamData.streamUrl || streamData.url || '';
                  console.log('🟡 [BACKGROUND] Fetched stream URL for', video.name);
                  return { ...video, streamUrl };
                } catch (error) {
                  console.warn('🟡 [BACKGROUND] Failed to fetch stream URL for', video.name, error);
                  return video; // Keep original video if fetch fails
                }
              }
              return video; // Already has stream URL
            })
          );
          const urlsEnd = performance.now();
          console.log('🟡 [BACKGROUND] Stream URLs fetched in', (urlsEnd - backgroundStart).toFixed(2), 'ms');
          
          // Then run compatibility check with stream URLs
          console.log('🟡 [BACKGROUND] Running compatibility checks...');
          const { checkAllVideosCompatibility } = await import('@/lib/utils/videoCompatibility');
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
          if (shouldAppend) {
            videos.setLoadedVideos(prev => {
              const existingVideos = prev.filter(v => !videosToAdd.some(newV => newV.path === v.path));
              return [...existingVideos, ...videosWithRealDurations];
            });
          } else {
            videos.setLoadedVideos(videosWithRealDurations);
          }
          
          console.log('Background processing complete - videos updated with real durations and compatibility');
        } catch (error) {
          console.warn('Background processing failed:', error);
        }
      }, 100);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add selected videos');
    }
  };

  // Utility functions
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


  return (
    <>
      <div className="min-h-screen bg-background text-foreground px-2 sm:px-0">
        <DndContext {...dnd.dndContextProps}>
          {/* Header */}
          <ReelMakerHeader 
            isDarkMode={isDarkMode}
            onThemeToggle={handleThemeToggle}
          />
          
          {/* Action Buttons */}
          <div className="matrix-header px-6">
            <ActionButtons
              isAuthenticated={auth.isAuthenticated}
              isAuthLoading={auth.isLoading}
              onConnect={auth.connect}
              onAddVideos={handleAddVideosClick}
              titles={reel.titles}
              onShowTitleEditor={() => setShowTitleEditor(true)}
              videoState={videos.videoState}
              onPreviewReel={handlePreviewReel}
              onUpdateReel={handleUpdateReel}
              editingReelId={reel.editingReelId}
              getTitleSizeClass={getTitleSizeClass}
            />
          </div>
          
          {/* Horizontal Divider - Full Width */}
          <div className="horizontal-divider" />

          {/* Video Panels */}
          <VideoPanels
            videoState={videos.videoState}
            onVideoClick={handleVideoClick}
            onVideoDelete={videos.deleteVideo}
            onAddVideos={handleAddVideosClick}
            isAuthenticated={auth.isAuthenticated}
            setVideoState={videos.setVideoState}
          />

          <DragOverlay>
            {dnd.activeVideo ? (
              <div style={{ width: '100%' }}>
                <VideoGridItem
                  video={dnd.activeVideo}
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
            onFolderSelect={async (path) => {
              videos.setFolderPath(path);
              setShowFolderBrowser(false);
              // If we already have videos, append new ones; otherwise replace
              const shouldAppend = videos.loadedVideos.length > 0;
              const result = await videos.fetchVideos(path, shouldAppend);
              if (result.error) {
                setError(result.error);
              }
            }}
            onVideoSelect={handleVideoSelect}
            onClose={() => setShowFolderBrowser(false)}
            initialPath={videos.folderPath}
            isAddingToExisting={videos.loadedVideos.length > 0}
            onAuthError={() => {
              setShowFolderBrowser(false);
              auth.checkAuth();
            }}
          />
        )}

        {/* Video Preview Modal */}
        {previewVideo && (
          <VideoPreviewModal
            isOpen={!!previewVideo}
            onClose={() => setPreviewVideo(null)}
            videoSrc={previewVideo.streamUrl || ''}
            title={previewVideo.name || ''}
            isCompatible={previewVideo.isCompatible}
            compatibilityError={previewVideo.compatibilityError || undefined}
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
          onAddTitle={reel.handleAddTitle}
          initialTitle={reel.titles.length > 0 ? reel.titles[0].text : ''}
          initialSize={reel.titles.length > 0 ? reel.titles[0].size : 'large'}
        />

        {/* Reel Preview Modal */}
        <ReelPreviewModal
          isOpen={showReelPreview}
          onClose={() => setShowReelPreview(false)}
          videos={videos.videoState.selects}
          reelTitle={reel.titles.length > 0 ? reel.titles[0].text : `Reel ${new Date().toLocaleDateString()}`}
          titles={reel.titles}
          editingReelId={reel.editingReelId}
        />
      </div>
    </>
  );
}