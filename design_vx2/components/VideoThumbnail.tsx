import { Play } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface VideoThumbnailProps {
  id: string;
  thumbnail: string;
  title: string;
  duration: string;
  videoSrc: string;
  onClick: () => void;
  onDragStart?: (e: React.DragEvent) => void;
}

export function VideoThumbnail({ 
  id, 
  thumbnail, 
  title, 
  duration, 
  videoSrc, 
  onClick, 
  onDragStart 
}: VideoThumbnailProps) {
  return (
    <div
      className="group cursor-pointer bg-background border-2 border-archive-primary hover:border-archive-secondary transition-all duration-100 hover:brutal-shadow"
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      data-video-id={id}
    >
      {/* File header bar - simplified without icon and duration */}
      <div className="bg-archive-primary text-background px-2 py-1 flex items-center text-xs">
        <span className="truncate">{title.toUpperCase()}</span>
      </div>
      
      {/* Image preview */}
      <div className="relative aspect-video bg-archive-light-gray">
        <ImageWithFallback
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-all duration-200"
        />
        
        {/* Duration overlay - bottom right corner */}
        <div className="absolute bottom-2 right-2 bg-archive-primary bg-opacity-90 text-background px-2 py-1 text-xs font-mono">
          {duration}
        </div>
        
        {/* Play overlay - more translucent to see video underneath */}
        <div className="absolute inset-0 bg-archive-primary bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          <div className="text-background text-center">
            <Play className="w-8 h-8 mx-auto mb-2" fill="currentColor" />
            <div className="text-xs">PLAY</div>
          </div>
        </div>
      </div>
    </div>
  );
}