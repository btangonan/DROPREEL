import React, { useRef, useEffect, type CSSProperties } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable, type SyntheticListenerMap } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { type DraggableAttributes } from '@dnd-kit/core';
import { Play, MousePointer2, X } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { VideoFile } from '@/types';
import './popout-animation.css';

interface VideoGridItemProps {
  video: VideoFile;
  listeners: SyntheticListenerMap | undefined;
  attributes: DraggableAttributes;
  isDragging: boolean;
  onClick?: (video: VideoFile, action?: { play?: boolean; rect?: DOMRect }) => void;
  onDelete?: (video: VideoFile) => void;
  style?: CSSProperties;
  isInlinePreview?: boolean;
  onCloseInlinePreview?: () => void;
}

interface SortableVideoGridItemProps {
  video: VideoFile;
  onClick?: (video: VideoFile, action?: { play?: boolean; rect?: DOMRect }) => void;
  onDelete?: (video: VideoFile) => void;
  isInlinePreview?: boolean;
  onCloseInlinePreview?: () => void;
}

interface DndKitVideoGridProps {
  videos: VideoFile[];
  onReorder: (videos: VideoFile[]) => void;
  gridId: string;
  onVideoClick?: (video: VideoFile, action?: { play?: boolean }) => void;
  onVideoDelete?: (video: VideoFile) => void;
  emptyMessage?: string;
  inlinePreviewVideoId?: string;
  onCloseInlinePreview?: () => void;
  customEmptyContent?: React.ReactNode;
}

function VideoGridItem({ 
  video, 
  listeners, 
  attributes, 
  isDragging, 
  onClick, 
  onDelete,
  style, 
  isInlinePreview, 
  onCloseInlinePreview 
}: VideoGridItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isInlinePreview && videoRef.current) {
      videoRef.current.play().catch(() => {});
      videoRef.current.focus();
    }
  }, [isInlinePreview]);
  const popOutClass = isInlinePreview ? 'animate-popout shadow-2xl z-50' : '';

  // Handle clicks on incompatible videos (only block if definitively incompatible)
  const handleIncompatibleClick = (e: React.MouseEvent) => {
    console.log('VideoGridItem click for', video.name, '- isCompatible:', video.isCompatible, 'compatibilityError:', video.compatibilityError);
    if (video.isCompatible === false) {
      console.log('Blocking click for incompatible video:', video.name);
      e.stopPropagation();
      e.preventDefault();
      // Show tooltip or error message
      return false;
    }
    // Allow clicks for undefined (checking) or true (compatible) states
  };

  return (
    <div
      className={`video-card group ${isDragging ? 'z-50' : ''} ${video.isCompatible === false ? 'select-none' : ''} relative`}
      style={{ 
        ...style,
        cursor: video.isCompatible === false ? 'not-allowed' : 'grab',
        userSelect: video.isCompatible === false ? 'none' : 'auto',
        opacity: video.isCompatible === false ? 0.8 : 1
      }}
      tabIndex={video.isCompatible === false ? -1 : 0}
      {...(video.isCompatible === false ? {} : listeners)}
      {...(video.isCompatible === false ? {} : attributes)}
      onClick={handleIncompatibleClick}
    >
      {/* GLOBAL OVERLAY - positioned relative to video-card, not aspect-video */}
      <div className="absolute inset-0 pointer-events-none z-50">
        {/* Dark hover overlay - positioned relative to entire card, only show on hover for compatible videos */}
        {video.isCompatible !== false && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10" style={{ background: 'rgba(0, 0, 0, 0.3)' }}>
          </div>
        )}

        {/* Play button - with explicit bright styling */}
        {video.isCompatible !== false && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100]" style={{ isolation: 'isolate' }}>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                if (typeof onClick === 'function' && video) {
                  // Get bounding rect of the thumbnail
                  const rect = thumbnailRef.current?.getBoundingClientRect();
                  onClick(video, { play: true, rect });
                }
              }}
              className="drop-shadow-lg focus:outline-none"
              style={{ 
                color: document.documentElement.classList.contains('dark') ? '#00ff00' : '#ffffff',
                filter: 'brightness(1.2) contrast(1.1)',
                textShadow: '0 0 10px currentColor'
              }}
            >
              <Play className="w-8 h-8 mb-2" fill="currentColor" />
              <div className="text-xs font-mono uppercase tracking-wider">PLAY</div>
            </button>
          </div>
        )}

        {/* Duration label - with explicit bright styling */}
        {video.duration && video.duration !== '0:00' && (
          <div 
            className="absolute bottom-3 right-2 px-2 py-1 text-xs font-bold font-mono pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-[100]"
            style={{ 
              backgroundColor: document.documentElement.classList.contains('dark') ? '#00ff00' : '#000000',
              color: document.documentElement.classList.contains('dark') ? '#000000' : '#ffffff',
              isolation: 'isolate',
              filter: 'brightness(1.1)'
            }}
          >
            {video.duration}
          </div>
        )}

        {/* Incompatible warning - positioned INSIDE overlay container like other bright elements */}
        {video.isCompatible === false && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-[100]" style={{ marginTop: '0.5rem', isolation: 'isolate' }}>
            <div>
              <div 
                className="text-4xl mb-2"
                style={{ 
                  color: document.documentElement.classList.contains('dark') ? '#00ff00' : '#ef4444'
                }}
              >⚠</div>
              <div 
                className="text-xs font-mono uppercase tracking-wider font-bold" 
                style={{ 
                  color: document.documentElement.classList.contains('dark') ? '#00ff00' : '#ffffff' 
                }}
              >INCOMPATIBLE</div>
              <div 
                className="text-xs font-mono uppercase tracking-wider font-bold" 
                style={{ 
                  color: document.documentElement.classList.contains('dark') ? '#00ff00' : '#ffffff' 
                }}
              >FORMAT</div>
            </div>
          </div>
        )}

      </div>
      {/* File header bar */}
      <div className="video-header flex items-center justify-between">
        <span className="truncate flex-1 mr-2 overflow-hidden whitespace-nowrap text-ellipsis">{video.name}</span>
        {/* Delete button - top right corner */}
        {onDelete && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              onDelete(video);
            }}
            className="w-5 h-5 bg-white dark:bg-black text-black border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-900 focus:outline-none flex-shrink-0 ml-2"
            title="Remove video"
            style={{ 
              color: document.documentElement.classList.contains('dark') ? '#00ff00' : '#000000'
            }}
          >
            <X className="w-3 h-3" strokeWidth={3} />
          </button>
        )}
      </div>
      
      {/* Image preview */}
      <div 
        ref={thumbnailRef}
        className={`relative aspect-video ${popOutClass} ${video.isCompatible === false ? 'cursor-not-allowed pointer-events-none' : 'cursor-pointer'} group`}
        style={{ background: 'var(--video-bg)', containerType: 'inline-size' }}
        onClick={(e) => {
          if (video.isCompatible === false) {
            e.stopPropagation();
            e.preventDefault();
            return;
          }
          e.stopPropagation();
          e.preventDefault();
          if (typeof onClick === 'function' && video) {
            onClick(video, { play: true });
          }
        }}
      >
        {isInlinePreview ? (
          <div className="w-full h-full relative group">
            <video
              ref={videoRef}
              src={video.streamUrl}
              controls
              autoPlay
              muted
              className="w-full h-full object-cover cursor-pointer"
              style={{ background: '#000' }}
              onClick={e => {
                e.stopPropagation();
                if (videoRef.current) videoRef.current.play();
              }}
            />
            <button
              type="button"
              className="absolute top-2 right-2 bg-foreground text-background p-1 hover:bg-accent focus:outline-none z-10"
              onClick={e => {
                e.stopPropagation();
                if (onCloseInlinePreview) onCloseInlinePreview();
              }}
              aria-label="Close preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : video.thumbnailUrl ? (
          <>
            <ImageWithFallback
              src={video.thumbnailUrl}
              alt={video.name}
              className="w-full h-full object-cover transition-all duration-200"
            />
          </>
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <svg className="w-8 h-8 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function EmptyDropZone({ children }: { children: React.ReactNode }) {
  return (
    <div className="matrix-empty-state">
      <div className="mb-6">
        <MousePointer2 
          size={80}
          strokeWidth={1}
          className="text-black dark:text-green-500"
        />
      </div>
      <div className="matrix-empty-title">NO VIDEOS SELECTED</div>
      <div className="matrix-empty-subtitle">DRAG VIDEO FILES HERE</div>
    </div>
  );
}

function SortableVideoGridItem({ 
  video, 
  onClick, 
  onDelete,
  isInlinePreview, 
  onCloseInlinePreview 
}: SortableVideoGridItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ 
    id: video.id, // Use the video ID directly
    disabled: video.isCompatible === false // Only disable dragging for definitively incompatible videos
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hide the dragged item but show displacement preview for others
    visibility: isDragging ? 'hidden' : undefined,
    // Show displacement preview when another item is being dragged over this one
    opacity: isOver && !isDragging ? 0.5 : 1,
    background: isOver && !isDragging ? 'var(--accent)' : undefined,
    borderRadius: isOver && !isDragging ? '4px' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full min-w-0 overflow-hidden">
      <VideoGridItem
        video={video}
        listeners={listeners}
        attributes={attributes}
        isDragging={isDragging}
        onClick={onClick}
        onDelete={onDelete}
        isInlinePreview={isInlinePreview}
        onCloseInlinePreview={onCloseInlinePreview}
      />
    </div>
  );
}

export default function DndKitVideoGrid({ videos, gridId, onVideoClick, onVideoDelete, emptyMessage, inlinePreviewVideoId, onCloseInlinePreview, customEmptyContent }: DndKitVideoGridProps) {
  const { setNodeRef } = useDroppable({ id: gridId });
  // Debug output for gridId, video count, and IDs

  return (
    <div 
      ref={setNodeRef} 
      className="w-full overflow-hidden"
      style={{ 
        minHeight: videos.length === 0 ? '100%' : 'fit-content',
        alignSelf: videos.length === 0 ? 'stretch' : 'flex-start' 
      }}
    >
      {videos.length === 0 ? (
        <div className="w-full h-full flex items-center justify-center">
          {customEmptyContent || (
            <EmptyDropZone>
              {emptyMessage}
            </EmptyDropZone>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full box-border">
          {videos.map(video => (
            <SortableVideoGridItem
              key={`${gridId}-${video.id}`}
              video={{ ...video, id: `${gridId}-${video.id}` }}
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              onClick={(clickedVideo) => onVideoClick?.(video)} // Use original video for callback
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              onDelete={(deletedVideo) => onVideoDelete?.(video)} // Use original video for callback
              isInlinePreview={inlinePreviewVideoId === video.id}
              onCloseInlinePreview={onCloseInlinePreview}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export { VideoGridItem }; 