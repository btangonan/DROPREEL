'use client';

import { useState, useEffect } from 'react';
import { VideoFile } from '@/types';
import FolderBrowser from '@/components/FolderBrowser/FolderBrowser';
import VideoPreviewModal from '@/components/VideoPreviewModal';
import TitleEditor from '@/components/TitleEditor/TitleEditor';
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

  const handleMakeReel = async () => {
    try {
      await reel.createOrUpdateReel(videos.videoState, videos.loadedVideos, videos.folderPath, reel.titles);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create reel');
    }
  };

  // Handle individual video selection from FolderBrowser
  const handleVideoSelect = async (selectedVideos: Array<{ name: string; path: string; type: string; isVideo: boolean }>) => {
    try {
      setShowFolderBrowser(false);
      
      // Convert FolderItems to VideoFiles format
      const videoPromises = selectedVideos.map(async (item) => {
        // Get stream URL for each video
        const response = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(item.path)}`);
        const streamData = await response.json();
        
        const videoFile: VideoFile = {
          id: nanoid(),
          name: item.name,
          path: item.path,
          streamUrl: streamData.url || '',
          thumbnailUrl: `/api/dropbox/thumbnail?path=${encodeURIComponent(item.path)}`,
          isCompatible: true, // Will be checked later
          checkedWithBrowser: false
        };
        
        return videoFile;
      });
      
      const newVideos = await Promise.all(videoPromises);
      
      // Check compatibility for the new videos
      const compatibilityResult = await videos.checkCompatibility(newVideos);
      const compatibleVideos = compatibilityResult.videos;
      
      // Add to existing videos or replace based on context
      const shouldAppend = videos.loadedVideos.length > 0;
      if (shouldAppend) {
        videos.setLoadedVideos(prev => [...prev, ...compatibleVideos]);
        videos.setVideoState(prev => ({
          ...prev,
          yourVideos: [...prev.yourVideos, ...compatibleVideos]
        }));
      } else {
        videos.setLoadedVideos(compatibleVideos);
        videos.setVideoState({
          yourVideos: compatibleVideos,
          selects: []
        });
      }
      
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
      <div className="min-h-screen bg-background text-foreground">
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
              onMakeReel={handleMakeReel}
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
      </div>
    </>
  );
}