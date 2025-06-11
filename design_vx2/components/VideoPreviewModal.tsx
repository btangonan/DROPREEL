import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { X, Monitor } from 'lucide-react';
import { useState } from 'react';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoSrc: string;
  title: string;
}

export function VideoPreviewModal({ isOpen, onClose, videoSrc, title }: VideoPreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full p-0 bg-background border-2 border-archive-primary">
        {/* Header */}
        <DialogHeader className="bg-archive-primary text-background px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <DialogTitle className="text-background font-mono text-sm uppercase">
                VIDEO PLAYER - {title}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={onClose}
                className="text-background hover:bg-background hover:text-archive-primary transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Video preview modal for {title}. Use controls to play, pause, and adjust volume.
          </DialogDescription>
        </DialogHeader>
        
        {/* Video container */}
        <div className="relative bg-background">
          {/* Video element */}
          <div className="aspect-video w-full p-4">
            <video
              src={videoSrc}
              controls
              autoPlay
              className="w-full h-full border border-archive-primary"
              style={{ maxHeight: '70vh' }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              Your browser does not support the video tag.
            </video>
          </div>
          
          {/* Status bar */}
          <div className="bg-archive-primary text-background px-4 py-2 text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>STATUS: {isPlaying ? 'PLAYING' : 'PAUSED'}</span>
                <span>FORMAT: MP4</span>
              </div>
              <div className="flex items-center gap-2">
                <span>READY</span>
                <div className="w-2 h-2 status-danger animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}