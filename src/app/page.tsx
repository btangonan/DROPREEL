'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoFile } from '@/types';
import { extractDropboxPath } from '@/lib/utils/dropboxUtils';
import FolderBrowser from '@/components/FolderBrowser/FolderBrowser';
import DropboxAuth from '@/components/DropboxAuth/DropboxAuth';
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

interface VideoClickAction {
  play?: boolean;
  rect?: DOMRect;
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

  // DnD state
  const [videoState, setVideoState] = useState<{ yourVideos: VideoFile[]; selects: VideoFile[] }>({ yourVideos: [], selects: [] });
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

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
      // Optionally, visually highlight the CONNECT button here
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

  // Keep the function but mark as unused to avoid breaking code
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const findVideoById = (id: string) => {
    return videoState.yourVideos.findIndex(v => v.id === id);
  };

  // Handler for drag end (cross-panel and reorder)
  const handleDragEnd = useCallback((e: any) => {
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

  return (
    <>
      <div className="min-h-screen p-2 md:p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={e => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-rows-[auto_1fr_auto] gap-2 md:gap-4 w-full max-w-screen-2xl mx-auto">
            {/* Top Row */}
            <div className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1 flex items-center justify-center min-h-[64px] md:h-24">
              <DropboxAuth
                isAuthenticated={isDropboxAuthenticated}
                isLoading={isDropboxAuthLoading}
                onConnectClick={handleDropboxConnect}
                highlight={!isDropboxAuthenticated}
              />
            </div>
            <button
              className={`glass-pane text-glass col-span-1 md:col-span-1 lg:col-span-1 row-span-1 flex items-center justify-center min-h-[64px] md:h-24 font-black text-xl md:text-2xl transition-all focus:outline-none w-full h-full
                ${isDropboxAuthenticated && loadedVideos.length === 0 ? 'animate-pulse !bg-blue-500/60 backdrop-blur-md border border-white/30 shadow-lg' :
                  isDropboxAuthenticated && loadedVideos.length > 0 ? '!bg-green-500/60 backdrop-blur-md border border-white/30 shadow-lg' :
                  (!isDropboxAuthenticated && getStepStatus('addVideos') !== 'next' ? 'opacity-50 pointer-events-none' : 'bg-white bg-opacity-80 hover:bg-opacity-100 active:opacity-100')}
              `}
              onClick={handleAddVideosClick}
              disabled={!isDropboxAuthenticated && getStepStatus('addVideos') !== 'next'}
              type="button"
            >
              ADD VIDEOS
            </button>
            <div className={`glass-pane text-gray-300 col-span-1 md:col-span-2 lg:col-span-2 row-span-1 flex items-center justify-center min-h-[64px] md:h-24 font-black text-3xl md:text-5xl lg:text-6xl text-center transition-opacity`}>
              ADD TITLE HERE
            </div>
            {/* Middle Row: DnD Panels */}
            <div className={`glass-pane col-span-1 md:col-span-1 lg:col-span-2 row-span-1 p-2 md:p-4 transition-opacity ${!isDropboxAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="font-black text-lg md:text-xl mb-2">YOUR VIDEOS</div>
              <div className="min-h-[128px] md:h-64 rounded overflow-y-auto p-2" style={{background: 'rgba(255,255,255,0.08)'}}>
                <SortableContext items={videoState.yourVideos.map(v => v.id)} strategy={rectSortingStrategy}>
                  <DndKitVideoGrid
                    videos={videoState.yourVideos}
                    onReorder={newOrder => setVideoState(s => ({ ...s, yourVideos: newOrder }))}
                    gridId="yourVideos"
                    emptyMessage={isFetchingVideos ? 'Loading videos...' : error ? error : 'No videos loaded.'}
                    onVideoClick={(video, action?: VideoClickAction) => {
                      const safeAction = action || {};
                      if (safeAction.play) {
                        setPopoutVideo(video);
                        setPopoutRect(safeAction.rect || null);
                      }
                    }}
                  />
                </SortableContext>
              </div>
            </div>
            <div className={`glass-pane col-span-1 md:col-span-1 lg:col-span-2 row-span-1 p-2 md:p-4 transition-opacity
              ${!isDropboxAuthenticated ? 'opacity-50 pointer-events-none' :
                (isDropboxAuthenticated && loadedVideos.length > 0 && videoState.selects.length === 0) ? 'animate-pulse !bg-blue-500/60 backdrop-blur-md border border-white/30 shadow-lg' :
                (isDropboxAuthenticated && loadedVideos.length > 0 && videoState.selects.length > 0) ? '!bg-green-500/60 backdrop-blur-md border border-white/30 shadow-lg' :
                ''}
            `}>
              <div className="font-black text-lg md:text-xl mb-2">SELECTS</div>
              <div className="min-h-[128px] md:h-64 rounded overflow-y-auto p-2" style={{background: 'rgba(255,255,255,0.08)'}}>
                <SortableContext items={videoState.selects.map(v => v.id)} strategy={rectSortingStrategy}>
                  <DndKitVideoGrid
                    videos={videoState.selects}
                    onReorder={newOrder => setVideoState(s => ({ ...s, selects: newOrder }))}
                    gridId="selects"
                    emptyMessage="No videos selected. Drag videos here."
                    onVideoClick={(video, action?: VideoClickAction) => {
                      const safeAction = action || {};
                      if (safeAction.play) {
                        setPopoutVideo(video);
                        setPopoutRect(safeAction.rect || null);
                      }
                    }}
                  />
                </SortableContext>
              </div>
            </div>
            {/* Bottom Row */}
            <div className={`glass-pane col-span-1 md:col-span-1 lg:col-span-2 row-span-1 flex items-center justify-center min-h-[48px] md:h-20 font-black text-2xl md:text-3xl transition-opacity ${!isDropboxAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}>THEME (MENU)</div>
            <button
              className={`glass-pane col-span-1 md:col-span-1 lg:col-span-2 row-span-1 flex items-center justify-center min-h-[48px] md:h-20 font-black text-2xl md:text-3xl transition-opacity ${(!isDropboxAuthenticated || videoState.selects.length === 0) ? 'opacity-50 pointer-events-none' : '!bg-blue-500/60 backdrop-blur-md border border-white/30 shadow-lg hover:opacity-90 cursor-pointer'}`}
              disabled={!isDropboxAuthenticated || videoState.selects.length === 0}
              onClick={async () => {
                if (!isDropboxAuthenticated || videoState.selects.length === 0) return;
                try {
                  const newReel = {
                    title: 'Untitled Reel',
                    videos: videoState.selects,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  };
                  const response = await fetch('/api/reels', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newReel)
                  });
                  if (!response.ok) throw new Error('Failed to create reel');
                  const createdReel = await response.json();
                  window.location.href = `/r/${createdReel.id}`;
                } catch (err) {
                  alert('Failed to create reel. Please try again.');
                }
              }}
            >
              MAKE REEL
            </button>
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
