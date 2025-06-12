'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoFile } from '@/types';
import { extractDropboxPath } from '@/lib/utils/dropboxUtils';
import FolderBrowser from '@/components/FolderBrowser/FolderBrowser';
import VideoPreviewModal from '@/components/VideoPreviewModal';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import DndKitVideoGrid, { VideoGridItem } from '@/components/DraggableVideoList/DndKitVideoGrid';
import PopoutVideoOverlay from '@/components/DraggableVideoList/PopoutVideoOverlay';
import { Wifi, Plus, FileText, Palette, Zap, Database, Star, Sun, Moon, LogIn } from 'lucide-react';

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
  const [isDropboxAuthenticated, setIsDropboxAuthenticated] = useState(false);
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

  // DnD state
  const [videoState, setVideoState] = useState<{ yourVideos: VideoFile[]; selects: VideoFile[] }>({ yourVideos: [], selects: [] });
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

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

  const fetchVideos = async (path: string) => {
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
              thumbnailUrl
            };
          })
        );
        setLoadedVideos(videosWithUrls);
      } else {
        setLoadedVideos([]);
        setError('No video files found in the specified folder');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setError(`Error loading videos: ${errorMessage}`);
      setLoadedVideos([]);
    } finally {
      setIsFetchingVideos(false);
    }
  };

  // When loadedVideos changes, put all videos in yourVideos and clear selects
  useEffect(() => {
    setVideoState({ yourVideos: loadedVideos, selects: [] });
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

    setVideoState(prev => {
      // Helper to get array by container name
      const getArray = (state: { yourVideos: VideoFile[]; selects: VideoFile[] }, key: 'yourVideos' | 'selects') =>
        key === 'yourVideos' ? state.yourVideos : state.selects;
      const setArray = (state: { yourVideos: VideoFile[]; selects: VideoFile[] }, key: 'yourVideos' | 'selects', arr: VideoFile[]) => {
        return key === 'yourVideos'
          ? { ...state, yourVideos: arr }
          : { ...state, selects: arr };
      };

      let newState = { yourVideos: [...prev.yourVideos], selects: [...prev.selects] };

      const sourceId = active.id;
      let sourceContainer: 'yourVideos' | 'selects' = 'yourVideos';
      let sourceIndex = newState.yourVideos.findIndex(v => v.id === sourceId);
      if (sourceIndex === -1) {
        sourceContainer = 'selects';
        sourceIndex = newState.selects.findIndex(v => v.id === sourceId);
      }

      // If dropped on a container, append to end
      let destContainer: 'yourVideos' | 'selects' | null = null;
      let destIndex: number = -1;
      if (over.id === 'yourVideos' || over.id === 'selects') {
        destContainer = over.id;
      } else {
        // Dropped on an item
        destContainer = newState.yourVideos.find(v => v.id === over.id) ? 'yourVideos' : 'selects';
      }

      // Guard: only proceed if destContainer is valid
      if (!destContainer) {
        console.log('[handleDragEnd] No valid destContainer found');
        return newState;
      }

      // Now it's safe to use newState[destContainer]
      if (over.id === 'yourVideos' || over.id === 'selects') {
        // Dropped directly on a container - append to the end
        destIndex = newState[destContainer].length;
      } else {
        // Dropped on an item
        destIndex = newState[destContainer].findIndex(v => v.id === over.id);
        
        // Fix for when destIndex is -1 (dropped outside any item)
        if (destIndex === -1) {
          console.log('[handleDragEnd] destIndex is -1, setting to end of list');
          destIndex = newState[destContainer].length;
        }
        
        // If dropping after self in the same container, adjust the destination index
        if (sourceContainer === destContainer && sourceIndex < destIndex) {
          // When removing the source item, all items after it shift up by 1
          // So we need to decrease the destination index by 1 to account for this
          destIndex--;
        }
      }

      console.log('[handleDragEnd] Before move:', {
        sourceContainer,
        sourceIndex,
        destContainer,
        destIndex,
        sourceItems: getArray(newState, sourceContainer).map(v => v.id),
        destItems: getArray(newState, destContainer).map(v => v.id)
      });

      if (sourceContainer === destContainer) {
        // Reorder within same container
        const reordered = arrayMove(
          getArray(newState, sourceContainer),
          sourceIndex,
          destIndex
        );
        newState = setArray(newState, sourceContainer, reordered);
      } else {
        // Check if the item already exists in the destination container
        const itemExists = newState[destContainer].some(v => v.id === sourceId);
        if (itemExists) {
          console.log('[handleDragEnd] Item already exists in destination, cancelling move');
          return newState;
        }
        
        // Move between containers
        const sourceArr = [...getArray(newState, sourceContainer)];
        const destArr = [...getArray(newState, destContainer)];
        const [movedItem] = sourceArr.splice(sourceIndex, 1);
        destArr.splice(destIndex, 0, movedItem);
        newState = setArray(newState, sourceContainer, sourceArr);
        newState = setArray(newState, destContainer, destArr);
      }

      console.log('[handleDragEnd] After move:', {
        yourVideosIds: newState.yourVideos.map(v => v.id),
        selectsIds: newState.selects.map(v => v.id)
      });
      
      return newState;
    });
  }, []);

  // For DragOverlay
  const allVideos = [...videoState.yourVideos, ...videoState.selects];
  const activeVideo = allVideos.find(v => v.id === activeId) || null;

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


  const handleAddTitle = (text: string, size: string) => {
    const newTitle: TitleElement = {
      id: Date.now().toString(),
      text: text.toUpperCase(),
      size,
      timestamp: Date.now()
    };
    setTitles([...titles, newTitle]);
  };

  const handleVideoClick = (video: VideoFile, action?: VideoClickAction) => {
    const safeAction = action || {};
    if (safeAction.play) {
      setPopoutVideo(video);
      setPopoutRect(safeAction.rect || null);
    } else {
      setPreviewVideo(video);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={e => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          {/* Header */}
          <div className="matrix-header pt-6 pr-6 pl-6 pb-0">
            {/* Top bar with logo, theme toggle, and login */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl text-terminal">DROPREEL</h1>
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
              <button 
                className="brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2"
                onClick={() => {
                  const text = prompt('Enter title text:');
                  const size = prompt('Enter size (small/medium/large):') || 'medium';
                  if (text) handleAddTitle(text, size);
                }}
              >
                <FileText className="w-4 h-4" />
                <span>ADD TITLE</span>
              </button>
              <button 
                className="brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2"
                disabled
              >
                <Palette className="w-4 h-4" />
                <span>THEME MENU</span>
              </button>
              <button 
                className="brutal-button-accent flex-1 inline-flex px-4 py-3 items-center gap-2"
                disabled={videoState.selects.length === 0}
                onClick={() => {
                  if (videoState.selects.length > 0) {
                    alert(`Making reel with ${videoState.selects.length} videos!`);
                  }
                }}
              >
                <Zap className="w-4 h-4" />
                <span>MAKE REEL</span>
              </button>
            </div>

            {/* Titles Display */}
            {titles.length > 0 && (
              <div className="mt-4 border-t border-terminal pt-4">
                <div className="text-xs text-terminal mb-2">ADDED TITLES:</div>
                <div className="flex flex-wrap gap-2">
                  {titles.map((title) => (
                    <div
                      key={title.id}
                      className="bg-muted border border-terminal px-2 py-1 text-xs text-terminal flex items-center gap-2"
                    >
                      <span>{title.text}</span>
                      <span className="text-muted-foreground">({title.size})</span>
                      <button
                        onClick={() => setTitles(titles.filter(t => t.id !== title.id))}
                        className="text-destructive hover:text-muted-foreground transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                  <div className="h-full overflow-y-auto">
                    {videoState.yourVideos.length === 0 ? (
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
                    ) : (
                      // Show videos when they exist
                      <SortableContext items={videoState.yourVideos.map(v => v.id)} strategy={rectSortingStrategy}>
                        <DndKitVideoGrid
                          videos={videoState.yourVideos}
                          onReorder={newOrder => setVideoState(s => ({ ...s, yourVideos: newOrder }))}
                          gridId="yourVideos"
                          emptyMessage={isFetchingVideos ? 'Loading videos...' : error ? error : 'No videos loaded.'}
                          onVideoClick={handleVideoClick}
                        />
                      </SortableContext>
                    )}
                  </div>
                </div>
              </div>
              {/* Reel Constructor */}
              <div className="panel" style={{ height: '500px' }}>
                <div className="panel-header px-6 py-4 flex items-center gap-2 flex-shrink-0 font-mono font-bold uppercase tracking-wider text-base">
                  <Star className="w-5 h-5 mr-2" />
                  <span>SELECTED VIDEOS</span>
                  <div className="ml-auto flex items-center gap-2" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                    <div className="text-xs font-mono px-2 py-1">
                      {videoState.selects.length} FILES
                    </div>
                  </div>
                </div>
                <div className="panel-content">
                  <div className="h-full overflow-y-auto">
                    <SortableContext items={videoState.selects.map(v => v.id)} strategy={rectSortingStrategy}>
                      <DndKitVideoGrid
                        videos={videoState.selects}
                        onReorder={newOrder => setVideoState(s => ({ ...s, selects: newOrder }))}
                        gridId="selects"
                        emptyMessage="No videos selected. Drag videos from the left panel to get started."
                        onVideoClick={handleVideoClick}
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
              fetchVideos(path);
            }}
            onClose={() => setShowFolderBrowser(false)}
            initialPath={folderPath}
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
      </div>
    </>
  );
}