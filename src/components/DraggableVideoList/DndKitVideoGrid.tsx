import React, { useRef, useEffect, type CSSProperties } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play } from 'lucide-react';
import { ImageWithFallback } from '@/components/figma/ImageWithFallback';
import { VideoFile } from '@/types';
import './popout-animation.css';

interface VideoGridItemProps {
  video: VideoFile;
  listeners: any; // TODO: Replace with proper type from dnd-kit
  attributes: any; // TODO: Replace with proper type from dnd-kit
  isDragging: boolean;
  onClick?: (video: VideoFile, action?: { play?: boolean; rect?: DOMRect }) => void;
  style?: CSSProperties;
  isInlinePreview?: boolean;
  onCloseInlinePreview?: () => void;
}

interface SortableVideoGridItemProps {
  video: VideoFile;
  onClick?: (video: VideoFile, action?: { play?: boolean; rect?: DOMRect }) => void;
  isInlinePreview?: boolean;
  onCloseInlinePreview?: () => void;
}

interface DndKitVideoGridProps {
  videos: VideoFile[];
  onReorder: (videos: VideoFile[]) => void;
  gridId: string;
  onVideoClick?: (video: VideoFile, action?: { play?: boolean }) => void;
  emptyMessage?: string;
  inlinePreviewVideoId?: string;
  onCloseInlinePreview?: () => void;
}

function VideoGridItem({ 
  video, 
  listeners, 
  attributes, 
  isDragging, 
  onClick, 
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
      className={`group cursor-pointer bg-background border-2 border-terminal hover:border-accent transition-all duration-100 hover:matrix-glow ${isDragging ? 'z-50' : ''}`}
      style={{ ...style }}
      tabIndex={0}
      {...listeners}
      {...attributes}
    >
      {/* File header bar */}
      <div className="bg-foreground text-background px-2 py-1 flex items-center text-xs">
        <span className="truncate uppercase">{video.name}</span>
      </div>
      
      {/* Image preview */}
      <div 
        ref={thumbnailRef}
        className={`relative aspect-video bg-muted ${popOutClass}`}
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
            <div className="absolute bottom-2 right-2 bg-foreground bg-opacity-90 text-background px-2 py-1 text-xs">
              {video.duration || '0:00'}
            </div>
            {/* Play overlay - very translucent to see video clearly underneath */}
            <div className="absolute inset-0 bg-foreground bg-opacity-15 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
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
                className="text-background text-center drop-shadow-lg focus:outline-none"
              >
                <Play className="w-8 h-8 mx-auto mb-2" fill="currentColor" />
                <div className="text-xs">PLAY</div>
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
    <div
      className="flex flex-col items-center justify-center h-64 w-full col-span-full text-terminal transition-colors"
      style={{ minHeight: '16rem' }}
    >
      <div className="text-center">
        <div className="text-6xl mb-4 opacity-30">📁</div>
        <div className="text-lg uppercase tracking-wide mb-2">NO VIDEOS SELECTED</div>
        <div className="text-sm text-accent uppercase tracking-wide">DRAG VIDEO FILES HERE</div>
      </div>
    </div>
  );
}

function SortableVideoGridItem({ 
  video, 
  onClick, 
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
  } = useSortable({ id: video.id });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Hide the item while dragging
    visibility: isDragging ? 'hidden' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="w-full">
      <VideoGridItem
        video={video}
        listeners={listeners}
        attributes={attributes}
        isDragging={isDragging}
        onClick={onClick}
        isInlinePreview={isInlinePreview}
        onCloseInlinePreview={onCloseInlinePreview}
      />
    </div>
  );
}

export default function DndKitVideoGrid({ videos, gridId, onVideoClick, emptyMessage, inlinePreviewVideoId, onCloseInlinePreview }: DndKitVideoGridProps) {
  const { setNodeRef } = useDroppable({ id: gridId });
  // Debug output for gridId, video count, and IDs
  const itemIds = videos.map(v => v.id);
  console.log(`[DndKitVideoGrid] gridId: ${gridId}, video count: ${videos.length}, IDs:`, itemIds);

  return (
    <div ref={setNodeRef} className="w-full">
      <div className="grid grid-cols-3 gap-3 min-h-[100px]">
        {videos.length === 0 ? (
          <EmptyDropZone>
            {emptyMessage}
          </EmptyDropZone>
        ) : (
          videos.map(video => (
            <SortableVideoGridItem
              key={video.id}
              video={video}
              onClick={onVideoClick}
              isInlinePreview={inlinePreviewVideoId === video.id}
              onCloseInlinePreview={onCloseInlinePreview}
            />
          ))
        )}
      </div>
    </div>
  );
}

export { VideoGridItem }; 