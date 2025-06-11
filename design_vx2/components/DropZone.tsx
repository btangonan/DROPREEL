import { useState } from 'react';
import { VideoThumbnail } from './VideoThumbnail';
import { Terminal, FolderOpen, Trash2 } from 'lucide-react';

interface Video {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  videoSrc: string;
}

interface DropZoneProps {
  selectedVideos: Video[];
  onVideoClick: (video: Video) => void;
  onDrop: (videoId: string) => void;
  onRemoveVideo: (videoId: string) => void;
}

export function DropZone({ selectedVideos, onVideoClick, onDrop, onRemoveVideo }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const videoId = e.dataTransfer.getData('text/plain');
    if (videoId) {
      onDrop(videoId);
    }
  };

  return (
    <div className="flex flex-col bg-background border-2 border-archive-primary" style={{ height: '500px' }}>
      {/* Header */}
      <div className="bg-archive-primary text-background px-4 py-2 flex items-center gap-2 flex-shrink-0">
        <Terminal className="w-4 h-4" />
        <span className="text-sm font-mono">SELECTED VIDEOS</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="text-xs">
            {selectedVideos.length} FILES
          </div>
        </div>
      </div>
      
      {/* Drop zone content */}
      <div
        className={`flex-1 p-4 transition-all duration-100 overflow-hidden ${
          isDragOver 
            ? 'bg-archive-primary bg-opacity-10 border-dashed' 
            : 'bg-background'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {selectedVideos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <FolderOpen className="w-16 h-16 text-archive-primary mb-4 opacity-50" />
            <div className="text-archive-primary font-mono text-sm">
              <div>NO VIDEOS SELECTED</div>
              <div className="text-archive-secondary mt-2">
                DRAG VIDEO FILES HERE
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Video grid */}
            <div className="grid grid-cols-3 gap-3 flex-1 overflow-y-auto">
              {selectedVideos.map((video) => (
                <div key={video.id} className="relative group">
                  <VideoThumbnail
                    {...video}
                    onClick={() => onVideoClick(video)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', video.id);
                    }}
                  />
                  {/* Remove button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveVideo(video.id);
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-archive-danger border-2 border-archive-primary text-background hover:bg-archive-primary hover:text-background transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            
            {/* Status footer */}
            <div className="border-t border-archive-primary pt-2 mt-4 flex-shrink-0">
              <div className="text-xs text-archive-primary font-mono">
                {selectedVideos.length} VIDEOS READY
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}