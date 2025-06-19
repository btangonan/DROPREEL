'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface VideoThumbnailProps {
  streamUrl: string;
  name: string;
  className?: string;
  fallbackSrc?: string;
}

export function VideoThumbnail({ streamUrl, name, className, fallbackSrc }: VideoThumbnailProps) {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!streamUrl || error) return;

    const generateThumbnail = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth || 320;
      canvas.height = video.videoHeight || 180;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to data URL
      try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setThumbnailSrc(dataUrl);
      } catch (err) {
        console.warn('Failed to generate thumbnail:', err);
        setError(true);
      }
    };

    const handleLoadedData = () => {
      const video = videoRef.current;
      if (!video) return;

      // Seek to 1 second or 10% of video duration, whichever is smaller
      const seekTime = Math.min(1, video.duration * 0.1);
      video.currentTime = seekTime;
    };

    const handleSeeked = () => {
      // Small delay to ensure frame is rendered
      setTimeout(generateThumbnail, 100);
    };

    const handleError = () => {
      console.warn('Video thumbnail generation failed for:', streamUrl);
      setError(true);
    };

    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('seeked', handleSeeked);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('seeked', handleSeeked);
        video.removeEventListener('error', handleError);
      };
    }
  }, [streamUrl, error]);

  // If we have a generated thumbnail, use it
  if (thumbnailSrc) {
    return (
      <ImageWithFallback
        src={thumbnailSrc}
        alt={name}
        className={className}
      />
    );
  }

  // If error or no stream URL, use fallback
  if (error || !streamUrl) {
    return (
      <ImageWithFallback
        src={fallbackSrc || ''}
        alt={name}
        className={className}
      />
    );
  }

  // While generating, show the video elements (hidden) and a loading state
  return (
    <>
      {/* Hidden video for thumbnail generation */}
      <video
        ref={videoRef}
        src={streamUrl}
        className="hidden"
        muted
        playsInline
        crossOrigin="anonymous"
        preload="metadata"
      />
      
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Loading placeholder */}
      <div className={`bg-gray-200 dark:bg-gray-800 animate-pulse flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    </>
  );
}