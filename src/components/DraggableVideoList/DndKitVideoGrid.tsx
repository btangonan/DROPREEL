import React, { useRef, useEffect, type CSSProperties } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, MousePointer2, X } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { VideoFile } from '@/types';
import './popout-animation.css';

interface VideoGridItemProps {
  video: VideoFile;
  listeners: any; // TODO: Replace with proper type from dnd-kit
  attributes: any; // TODO: Replace with proper type from dnd-kit
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

  return (
    <div
      className={`video-card group ${isDragging ? 'z-50' : ''}`}
      style={{ ...style }}
      tabIndex={0}
      {...listeners}
      {...attributes}
    >
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
            className="w-5 h-5 bg-white text-black border-2 border-black opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-gray-100 focus:outline-none flex-shrink-0 ml-2"
            title="Remove video"
          >
            <X className="w-3 h-3" strokeWidth={3} />
          </button>
        )}
      </div>
      
      {/* Image preview */}
      <div 
        ref={thumbnailRef}
        className={`relative aspect-video ${popOutClass} cursor-pointer group`}
        style={{ background: 'var(--video-bg)' }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          if (typeof onClick === 'function' && video) {
            console.log('[VideoGridItem] Thumbnail clicked:', video.name);
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
            {/* Duration overlay - bottom right corner */}
            <div className="matrix-video-duration">
              {video.duration || '0:00'}
            </div>
            {/* Play overlay - very translucent to see video clearly underneath */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center" style={{ background: 'rgba(0, 255, 0, 0.1)' }}>
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
                className="text-center drop-shadow-lg focus:outline-none"
                style={{ color: 'var(--video-header-text)' }}
              >
                <Play className="w-8 h-8 mx-auto mb-2" fill="currentColor" />
                <div className="text-xs text-white font-mono uppercase tracking-wider">PLAY</div>
              </button>
            </div>
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

function EmptyDropZone({ children }: { children: React.ReactNode }) {
  return (
    <div className="matrix-empty-state">
      <div className="mb-6">
        <MousePointer2 
          size={80}
          strokeWidth={1}
          className="opacity-50"
          style={{ color: '#000000' }}
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
  } = useSortable({ id: video.id });

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
  const { setNodeRef, isOver } = useDroppable({ id: gridId });
  // Debug output for gridId, video count, and IDs
  const itemIds = videos.map(v => v.id);
  console.log(`[DndKitVideoGrid] gridId: ${gridId}, video count: ${videos.length}, IDs:`, itemIds, 'isOver:', isOver);

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
        <div className="grid grid-cols-3 gap-3 w-full box-border">
          {videos.map(video => (
            <SortableVideoGridItem
              key={video.id}
              video={video}
              onClick={onVideoClick}
              onDelete={onVideoDelete}
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