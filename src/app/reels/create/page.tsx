'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { VideoFile } from '@/types';
import { useRouter } from 'next/navigation';
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
import { ArrowLeft, Play, Palette, Zap, Database, MousePointer2, Sun, Moon, LogIn } from 'lucide-react';

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

export default function CreateReelPage() {
  const router = useRouter();
  const [previewVideo, setPreviewVideo] = useState<VideoFile | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [reelTitle, setReelTitle] = useState('');
  const [videoState, setVideoState] = useState<{ yourVideos: VideoFile[]; selects: VideoFile[] }>({ 
    yourVideos: [], 
    selects: [] 
  });
  const [titles, setTitles] = useState<TitleElement[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreatingReel, setIsCreatingReel] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  // Load reel data from localStorage on mount
  useEffect(() => {
    const reelData = localStorage.getItem('reelData');
    if (reelData) {
      try {
        const data = JSON.parse(reelData);
        setVideoState({
          yourVideos: [],
          selects: data.videos || []
        });
        setTitles(data.titles || []);
      } catch (error) {
        console.error('Error loading reel data:', error);
      }
    }
  }, []);

  // Custom collision detection for grid positioning
  const customCollisionDetection = useCallback((args: any) => {
    const { active, droppableContainers, pointerCoordinates } = args;
    
    // First check if we're over a container
    const pointerCollisions = pointerCoordinates ? droppableContainers.filter((container: any) => {
      if (container.id === 'yourVideos' || container.id === 'selects') {
        const rect = container.rect.current;
        if (rect) {
          const { x, y } = pointerCoordinates;
          return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        }
      }
      return false;
    }) : [];
    
    if (pointerCollisions.length > 0) {
      return [pointerCollisions[0]];
    }
    
    // Fallback to closest center
    return closestCenter(args);
  }, []);

  // Handler for drag end (cross-panel and reorder)
  const handleDragEnd = useCallback((e: { active: { id: string | number }; over: { id: string | number } | null }) => {
    setActiveId(null);
    const { active, over } = e;
    if (!active || !over) {
      return;
    }

    setVideoState(prev => {
      const newState = { yourVideos: [...prev.yourVideos], selects: [...prev.selects] };

      const sourceId = active.id;
      let sourceContainer: 'yourVideos' | 'selects' = 'selects'; // Since we only have selects in this view
      let sourceIndex = newState.selects.findIndex(v => v.id === sourceId);

      // For this page, we're only reordering within selects
      if (over.id === 'selects' || sourceContainer === 'selects') {
        let destIndex = newState.selects.length;
        
        if (over.id !== 'selects') {
          // Dropped on an item
          const destItemIndex = newState.selects.findIndex(v => v.id === over.id);
          if (destItemIndex !== -1) {
            destIndex = destItemIndex;
          }
        }

        if (sourceIndex !== -1 && sourceIndex !== destIndex) {
          newState.selects = arrayMove(newState.selects, sourceIndex, destIndex);
        }
      }

      return newState;
    });
  }, []);

  // For DragOverlay
  const allVideos = [...videoState.yourVideos, ...videoState.selects];
  const activeVideo = allVideos.find(v => v.id === activeId) || null;

  const handleVideoClick = (video: VideoFile, action?: VideoClickAction) => {
    console.log('[handleVideoClick] Video clicked:', video.name, 'Action:', action);
    setPreviewVideo(video);
  };

  const handleVideoDelete = (video: VideoFile) => {
    console.log('[handleVideoDelete] Deleting video:', video.name);
    
    setVideoState(prev => ({
      yourVideos: prev.yourVideos,
      selects: prev.selects.filter(v => v.id !== video.id)
    }));
  };

  const handleCreateReel = async () => {
    if (videoState.selects.length === 0) return;
    
    setIsCreatingReel(true);
    
    try {
      // Create the reel
      const response = await fetch('/api/reels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: reelTitle || 'Untitled Reel',
          videos: videoState.selects,
          titles: titles,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create reel');
      }
      
      const reel = await response.json();
      
      // Clear localStorage
      localStorage.removeItem('reelData');
      
      // Navigate to the created reel
      router.push(`/r/${reel.id}`);
      
    } catch (error) {
      console.error('Error creating reel:', error);
      alert('Failed to create reel. Please try again.');
    } finally {
      setIsCreatingReel(false);
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
            {/* Top bar with logo, theme toggle, and back button */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/')}
                  className="control-button flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>BACK</span>
                </button>
                <div>
                  <h1 className="text-2xl text-terminal">CREATE REEL</h1>
                  <div className="text-xs text-muted-foreground mt-1">
                    ARRANGE YOUR VIDEOS AND CREATE YOUR REEL
                  </div>
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
            
            {/* Reel Title Input */}
            <div className="mb-5">
              <input
                type="text"
                placeholder="Enter reel title..."
                value={reelTitle}
                onChange={(e) => setReelTitle(e.target.value)}
                className="w-full text-2xl font-mono font-bold uppercase tracking-wider bg-transparent border-2 border-terminal text-terminal placeholder-muted-foreground px-4 py-3 focus:outline-none focus:border-accent"
              />
            </div>

            {/* Button Grid */}
            <div className="flex gap-4 mb-5 items-stretch w-full">
              <button 
                className="brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2"
                onClick={() => router.push('/')}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ADD MORE VIDEOS</span>
              </button>
              <button 
                className="brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2"
                disabled
              >
                <Play className="w-4 h-4" />
                <span>PREVIEW REEL</span>
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
                disabled={videoState.selects.length === 0 || isCreatingReel}
                onClick={handleCreateReel}
              >
                <Zap className="w-4 h-4" />
                <span>{isCreatingReel ? 'CREATING...' : 'CREATE REEL'}</span>
              </button>
            </div>

            {/* Titles Display */}
            {titles.length > 0 && (
              <div className="mt-4 border-t border-terminal pt-4">
                <div className="text-xs text-terminal mb-2">TITLES TO INCLUDE:</div>
                <div className="flex flex-wrap gap-2">
                  {titles.map((title) => (
                    <div
                      key={title.id}
                      className="bg-muted border border-terminal px-2 py-1 text-xs text-terminal flex items-center gap-2"
                    >
                      <span>{title.text}</span>
                      <span className="text-muted-foreground">({title.size})</span>
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
            <div className="grid grid-cols-1 gap-4 items-stretch mt-5 max-w-4xl mx-auto">
              {/* Selected Videos for Reel */}
              <div className="panel" style={{ height: '500px' }}>
                <div className="panel-header px-6 py-4 flex items-center gap-2 flex-shrink-0 font-mono font-bold uppercase tracking-wider text-base">
                  <MousePointer2 className="w-5 h-5 mr-2" />
                  <span>YOUR REEL VIDEOS</span>
                  <div className="ml-auto flex items-center gap-2" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
                    <div className="text-xs font-mono px-2 py-1">
                      {videoState.selects.length} FILES
                    </div>
                  </div>
                </div>
                <div className="panel-content">
                  <div className="panel-scroll">
                    <SortableContext items={videoState.selects.map(v => v.id)} strategy={rectSortingStrategy}>
                      <DndKitVideoGrid
                        videos={videoState.selects}
                        onReorder={newOrder => setVideoState(s => ({ ...s, selects: newOrder }))}
                        gridId="selects"
                        emptyMessage="No videos selected. Go back to add videos to your reel."
                        onVideoClick={handleVideoClick}
                        onVideoDelete={handleVideoDelete}
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
      </div>
    </>
  );
}