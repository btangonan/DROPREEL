'use client';

import { VideoFile } from '@/types';
import { useState } from 'react';

// Helper function to format file size
const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

interface VideoListProps {
  videos: VideoFile[];
  currentVideo?: VideoFile;
  selectedVideos?: string[];  // Array of video IDs that are selected for the reel
  onVideoSelect: (video: VideoFile) => void;
  onReorder: (videos: VideoFile[]) => void;
  onSelectionChange?: (selectedIds: string[]) => void;  // Callback when selection changes
  showCheckboxes?: boolean; // Whether to show checkboxes for selection
}

export default function VideoList({ 
  videos, 
  currentVideo, 
  selectedVideos = [], 
  onVideoSelect, 
  onReorder,
  onSelectionChange = () => {},
  showCheckboxes = true // Default to showing checkboxes
}: VideoListProps) {
  // Track the video being dragged
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  
  // Handle the start of dragging
  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };
  
  // Handle dropping the video
  const handleDrop = (dropIndex: number) => {
    if (draggedItem === null) return;
    
    const items = Array.from(videos);
    const [reorderedItem] = items.splice(draggedItem, 1);
    items.splice(dropIndex, 0, reorderedItem);
    
    setDraggedItem(null);
    onReorder(items);
  };
  
  // Handle dragging over a different video
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Allow drop
  };

  return (
    <div className="w-full space-y-2">
      {videos.map((video, index) => (
        <div
          key={video.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(index)}
          className={`p-4 rounded-lg cursor-pointer transition-colors ${
            currentVideo?.id === video.id
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          } ${draggedItem === index ? 'opacity-50' : ''}`}
          onClick={() => onVideoSelect(video)}
        >
          <div className="flex items-center space-x-4">
            {showCheckboxes && (
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  className="h-5 w-5 mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={selectedVideos.includes(video.id)}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    const newSelectedVideos = isChecked
                      ? [...selectedVideos, video.id]
                      : selectedVideos.filter(id => id !== video.id);
                    onSelectionChange(newSelectedVideos);
                    e.stopPropagation(); // Prevent triggering the div click
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent triggering the div click
                />
              </div>
            )}
            <div className="relative w-24 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
              {video.thumbnailUrl ? (
                <>
                  <img
                    src={video.thumbnailUrl}
                    alt={video.name}
                    className="w-full h-full object-cover rounded"
                    onError={(e) => {
                      // When image fails to load, hide it and show the fallback
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-30 transition-opacity">
                    <span className="text-white text-xs">▶ Play</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full w-full">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-black truncate">{video.name}</h3>
              <p className="text-xs text-gray-500 truncate">{formatFileSize(video.size)}</p>
              <div className="flex items-center mt-1">
                {selectedVideos.includes(video.id) ? (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">In Reel</span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Not in Reel</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
