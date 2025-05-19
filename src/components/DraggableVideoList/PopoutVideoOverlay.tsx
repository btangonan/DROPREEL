import React, { useEffect, useRef, useState } from 'react';
import { VideoFile } from '@/types';

interface PopoutVideoOverlayProps {
  video: VideoFile;
  rect: DOMRect | null;
  onClose: () => void;
}

const MAX_WIDTH = 640; // px
const MAX_HEIGHT = 360; // px
const FINAL_TOP_VH = 25; // 25vh for vertical alignment

const PopoutVideoOverlay: React.FC<PopoutVideoOverlayProps> = ({ video, rect, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 480, height: 270 });
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
      videoRef.current.focus();
    }
  }, [video]);

  // Read video natural size and set popout dimensions
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const v = videoRef.current;
      let width = v.videoWidth;
      let height = v.videoHeight;
      // Scale to fit max dimensions
      const aspect = width / height;
      if (width > MAX_WIDTH) {
        width = MAX_WIDTH;
        height = Math.round(width / aspect);
      }
      if (height > MAX_HEIGHT) {
        height = MAX_HEIGHT;
        width = Math.round(height * aspect);
      }
      setDimensions({ width, height });
    }
  };

  // Animate in
  useEffect(() => {
    setTimeout(() => setAnimate(true), 10);
    // Focus the overlay container on open
    overlayRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    // Force focus back to overlay or video on blur/focusout
    const video = videoRef.current;
    const handleBlur = () => {
      // Try to refocus overlay, then video
      if (overlayRef.current) {
        overlayRef.current.focus();
      } else if (videoRef.current) {
        videoRef.current.focus();
      }
    };
    if (video) {
      video.addEventListener('blur', handleBlur);
      video.addEventListener('focusout', handleBlur);
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      if (video) {
        video.removeEventListener('blur', handleBlur);
        video.removeEventListener('focusout', handleBlur);
      }
    };
  }, [onClose]);

  // Focus video on click inside overlay (except close overlay)
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    } else {
      // Refocus video for keyboard accessibility
      videoRef.current?.focus();
    }
  };

  // Play/pause toggle
  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>) => {
    e.preventDefault();
    if (e.target === videoRef.current) {
      if (videoRef.current?.paused) {
        videoRef.current.play();
      } else {
        videoRef.current?.pause();
      }
    }
  };

  // ESC key handler for video element
  const handleVideoKeyDown = (e: React.KeyboardEvent<HTMLVideoElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Visually hidden close button for accessibility
  const handleCloseButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClose();
    }
  };

  // Calculate animation start (from rect) and end (centered, scaled)
  const startRect = rect;
  const endWidth = dimensions.width;
  const endHeight = dimensions.height;

  // Clamp the final position so the player never extends beyond the viewport
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
  let unclampedLeft = startRect
    ? startRect.left + startRect.width / 2 - endWidth / 2
    : viewportWidth / 2 - endWidth / 2;
  let unclampedTop = startRect
    ? startRect.top + startRect.height / 2 - endHeight / 2
    : viewportHeight * (FINAL_TOP_VH / 100);
  // Clamp so the player stays fully in view
  const endLeft = Math.max(8, Math.min(unclampedLeft, viewportWidth - endWidth - 8));
  const endTop = Math.max(8, Math.min(unclampedTop, viewportHeight - endHeight - 8));

  const style: React.CSSProperties = animate && startRect
    ? {
        position: 'fixed',
        left: endLeft,
        top: endTop,
        width: endWidth,
        height: endHeight,
        zIndex: 1001,
        transition: 'all 250ms cubic-bezier(.4,2,.6,1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        borderRadius: 16,
        background: 'rgba(30,30,40,0.7)',
        pointerEvents: 'auto',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    : startRect
    ? {
        position: 'fixed',
        left: startRect.left,
        top: startRect.top,
        width: startRect.width,
        height: startRect.height,
        zIndex: 1001,
        transition: 'all 250ms cubic-bezier(.4,2,.6,1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        borderRadius: 8,
        background: 'rgba(30,30,40,0.3)',
        pointerEvents: 'auto',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }
    : {};

  // Local backdrop
  const backdropStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: '100%',
    height: '100%',
    zIndex: 1000,
    background: 'rgba(30,30,40,0.15)',
    backdropFilter: 'blur(12px)',
    pointerEvents: 'auto',
  };

  return (
    <>
      {/* Transparent overlay to block interaction and allow click-to-close */}
      <div
        ref={overlayRef}
        tabIndex={-1}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'transparent',
          pointerEvents: 'auto',
        }}
        onClick={handleOverlayClick}
        aria-label="Close video preview"
      />
      {/* Popout video with local backdrop */}
      <div style={style}>
        <div style={backdropStyle} />
        <video
          ref={videoRef}
          src={video.streamUrl}
          controls
          tabIndex={0}
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 16,
            background: '#111',
            zIndex: 1002,
            pointerEvents: 'auto',
            objectFit: 'contain',
          }}
          onClick={handleVideoClick}
          onLoadedMetadata={handleLoadedMetadata}
          onKeyDown={handleVideoKeyDown}
        />
        {/* Visually hidden close button for accessibility */}
        <button
          tabIndex={0}
          aria-label="Close video preview"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: 'auto',
            zIndex: 1003,
          }}
          onClick={onClose}
          onKeyDown={handleCloseButtonKeyDown}
        >
          Close
        </button>
      </div>
    </>
  );
};

export default PopoutVideoOverlay; 