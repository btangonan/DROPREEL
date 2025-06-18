import { Database, MousePointer2, Plus } from 'lucide-react';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import DndKitVideoGrid from '@/components/DraggableVideoList/DndKitVideoGrid';
import { VideoFile } from '@/types';

interface VideoClickAction {
  play?: boolean;
  rect?: DOMRect;
}

interface VideoPanelsProps {
  videoState: { yourVideos: VideoFile[]; selects: VideoFile[] };
  onVideoClick: (video: VideoFile, action?: VideoClickAction) => void;
  onVideoDelete: (video: VideoFile, panel: 'yourVideos' | 'selects') => void;
  onAddVideos: () => void;
  isAuthenticated: boolean;
  setVideoState: React.Dispatch<React.SetStateAction<{ yourVideos: VideoFile[]; selects: VideoFile[] }>>;
}

export function VideoPanels({
  videoState,
  onVideoClick,
  onVideoDelete,
  onAddVideos,
  isAuthenticated,
  setVideoState
}: VideoPanelsProps) {
  return (
    <div className="pt-0 pb-0 px-3 md:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4 items-stretch mt-5">
        {/* YOUR VIDEOS Panel */}
        <div className="panel" style={{ height: 'min(500px, 60vh)' }}>
          {/* Header */}
          <div className="panel-header px-3 md:px-6 py-4 flex items-center gap-2 flex-shrink-0 font-mono font-bold uppercase tracking-wider text-sm md:text-base">
            <Database className="w-5 h-5 mr-2" />
            <span>YOUR VIDEOS</span>
            <div className="ml-auto flex items-center gap-2">
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
                  onVideoClick={onVideoClick}
                  onVideoDelete={(video) => onVideoDelete(video, 'yourVideos')}
                  customEmptyContent={
                    // Add Videos Button - Small Dotted Square
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <button
                        onClick={onAddVideos}
                        className="flex flex-col items-center justify-center transition-all duration-200 hover:opacity-80"
                        disabled={!isAuthenticated}
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
        
        {/* SELECTED VIDEOS Panel */}
        <div className="panel" style={{ height: 'min(500px, 60vh)' }}>
          <div className="panel-header px-3 md:px-6 py-4 flex items-center gap-2 flex-shrink-0 font-mono font-bold uppercase tracking-wider text-sm md:text-base">
            <MousePointer2 className="w-5 h-5 mr-2" />
            <span>SELECTED VIDEOS</span>
            <div className="ml-auto flex items-center gap-2">
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
                  onVideoClick={onVideoClick}
                  onVideoDelete={(video) => onVideoDelete(video, 'selects')}
                />
              </SortableContext>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}