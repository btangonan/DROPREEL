import { useState, useEffect } from 'react';
import { X, Monitor } from 'lucide-react';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title: string;
}

export default function VideoPreviewModal({ isOpen, onClose, videoSrc, title }: VideoPreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent background scrolling
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-7xl w-full">
        {/* Header */}
        <div className="bg-foreground text-background px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <h2 className="text-background text-sm uppercase">
                VIDEO PLAYER - {title}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="text-background hover:bg-background hover:text-foreground transition-colors p-1 border border-transparent hover:border-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Video container */}
        <div className="relative bg-background">
          {/* Video element */}
          <div className="aspect-video w-full p-6">
            {videoSrc ? (
              <video
                src={videoSrc}
                controls
                autoPlay
                className="w-full h-full border border-terminal"
                style={{ maxHeight: '85vh' }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="w-full h-full border border-terminal flex items-center justify-center text-terminal">
                NO VIDEO SELECTED
              </div>
            )}
          </div>
          
          {/* Status bar */}
          <div className="bg-foreground text-background px-4 py-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>STATUS: {isPlaying ? 'PLAYING' : 'PAUSED'}</span>
                <span>FORMAT: MP4</span>
              </div>
              <div className="flex items-center gap-2">
                <span>READY</span>
                <div className="w-2 h-2 bg-destructive animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}