import React, { useRef, useEffect, type CSSProperties } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { VideoFile } from '@/types';
import './popout-animation.css';

interface DndKitVideoGridProps {
  videos: VideoFile[];
  onReorder: (videos: VideoFile[]) => void;
  gridId: string;
  onVideoClick?: (video: VideoFile, action?: { play?: boolean }) => void;
  emptyMessage?: string;
  inlinePreviewVideoId?: string;
  onCloseInlinePreview?: () => void;
}

function VideoGridItem({ video, listeners, attributes, isDragging, onClick, style, isInlinePreview, onCloseInlinePreview }: any) {
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
      className={`w-full flex flex-col items-center cursor-pointer transition-colors ${isDragging ? 'z-50' : ''}`}
      style={{ borderRadius: '0.5rem', padding: 0, ...style }}
      tabIndex={0}
    >
      <div
        ref={thumbnailRef}
        className={`relative w-full aspect-video rounded overflow-hidden ${isDragging ? 'shadow-lg' : ''} ${popOutClass}`}
        style={{ transition: 'none', background: 'rgba(255,255,255,0.10)' }}
      >
        {/* Play button overlay (no DnD listeners/attributes) */}
        {!isInlinePreview && (
          <button
            type="button"
            className="absolute inset-0 flex items-center justify-center focus:outline-none z-20"
            style={{ pointerEvents: 'auto', width: '40%', height: '40%', left: '30%', top: '30%' }}
            tabIndex={-1}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault();
              if (typeof onClick === 'function' && video) {
                // Get bounding rect of the thumbnail
                const rect = thumbnailRef.current?.getBoundingClientRect();
                onClick(video, { play: true, rect });
              }
            }}
          >
            <span className="bg-white/50 hover:bg-white/70 text-gray-900 rounded-full p-2 shadow flex items-center justify-center transition-colors" style={{ fontSize: 16, opacity: 0.95 }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="8,5 19,12 8,19" />
              </svg>
            </span>
          </button>
        )}
        {/* Drag handle overlay (covers everything except play button) */}
        {!isInlinePreview && (
          <div
            className="absolute inset-0 z-10"
            style={{ pointerEvents: 'auto' }}
            {...listeners}
            {...attributes}
            onClick={onClick}
          >
            {/* Exclude play button area from drag handle using pointer-events: none */}
            <div style={{ position: 'absolute', left: '30%', top: '30%', width: '40%', height: '40%', pointerEvents: 'none', zIndex: 30 }} />
          </div>
        )}
        {/* Video or thumbnail */}
        {isInlinePreview ? (
          <div className="w-full h-full relative group">
            <video
              ref={videoRef}
              src={video.streamUrl}
              controls
              autoPlay
              muted
              className="w-full h-full object-cover rounded cursor-pointer"
              style={{ background: '#000' }}
              onClick={e => {
                e.stopPropagation();
                if (videoRef.current) videoRef.current.play();
              }}
            />
            <button
              type="button"
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 focus:outline-none z-10"
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
          <img
            src={video.thumbnailUrl}
            alt={video.name}
            className="w-full h-full object-cover rounded"
            style={{ transition: 'none' }}
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        )}
      </div>
      <div className="truncate text-xs text-center mt-1 w-full" title={video.name}>{video.name}</div>
    </div>
  );
}

function EmptyDropZone({ gridId, isOver, children }: { gridId: string; isOver: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`flex items-center justify-center h-32 w-full col-span-full rounded-lg transition-colors`}
      style={{ minHeight: '6rem', background: 'transparent', border: 'none' }}
    >
      {children}
    </div>
  );
}

function SortableVideoGridItem({ video, onClick, isInlinePreview, onCloseInlinePreview }: any) {
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
  const { isOver, setNodeRef } = useDroppable({ id: gridId });
  // Debug output for gridId, video count, and IDs
  const itemIds = videos.map(v => v.id);
  console.log(`[DndKitVideoGrid] gridId: ${gridId}, video count: ${videos.length}, IDs:`, itemIds);

  return (
    <div ref={setNodeRef} className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 min-h-[100px]">
        {videos.length === 0 ? (
          <EmptyDropZone gridId={gridId} isOver={isOver}>
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