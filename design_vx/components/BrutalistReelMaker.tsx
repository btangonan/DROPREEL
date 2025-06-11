'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Upload, Plus, Palette, Wand2, X, User, Contrast } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { VideoPreviewModal } from './VideoPreviewModal';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  videoUrl?: string;
}

const mockVideos: Video[] = [
  {
    id: '1',
    title: 'URBAN ENERGY',
    thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=225&fit=crop',
    duration: '0:45',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '2',
    title: 'NEON NIGHTS',
    thumbnail: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
    duration: '1:20',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '3',
    title: 'TECH FLOW',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=225&fit=crop',
    duration: '2:15',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '4',
    title: 'DIGITAL PULSE',
    thumbnail: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=225&fit=crop',
    duration: '0:30',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '5',
    title: 'ELECTRIC DREAMS',
    thumbnail: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=225&fit=crop',
    duration: '1:45',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '6',
    title: 'CYBER VISION',
    thumbnail: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=400&h=225&fit=crop',
    duration: '3:00',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  }
];

export function BrutalistReelMaker() {
  const [isConnected, setIsConnected] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [draggedVideo, setDraggedVideo] = useState<Video | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [isAddingTitle, setIsAddingTitle] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showLogoTooltip, setShowLogoTooltip] = useState(false);
  const [isGrayscaleMode, setIsGrayscaleMode] = useState(false);

  const handleDragStart = (video: Video) => {
    setDraggedVideo(video);
  };

  const handleDragEnd = () => {
    setDraggedVideo(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedVideo && !selectedVideos.find(v => v.id === draggedVideo.id)) {
      setSelectedVideos([...selectedVideos, draggedVideo]);
    }
    setDraggedVideo(null);
  };

  const removeFromSelection = (videoId: string) => {
    setSelectedVideos(selectedVideos.filter(v => v.id !== videoId));
  };

  const openVideoPreview = (video: Video) => {
    setPreviewVideo(video);
    setIsPreviewOpen(true);
  };

  const closeVideoPreview = () => {
    setIsPreviewOpen(false);
    setPreviewVideo(null);
  };

  const handleLogin = () => {
    // Handle login functionality
    console.log('Login clicked');
  };

  const toggleGrayscaleMode = () => {
    setIsGrayscaleMode(!isGrayscaleMode);
  };

  return (
    <div className={`min-h-screen bg-white ${isGrayscaleMode ? 'grayscale-mode' : ''}`}>
      {/* Header */}
      <motion.header
        className="brutalist-header"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="header-brand">
          <div className="relative">
            <motion.a
              href="#"
              className="brutalist-logo"
              onMouseEnter={() => setShowLogoTooltip(true)}
              onMouseLeave={() => setShowLogoTooltip(false)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              DROPREEL
            </motion.a>
            
            {/* Logo Tooltip */}
            <AnimatePresence>
              {showLogoTooltip && (
                <motion.div
                  className="logo-tooltip"
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <div className="logo-tooltip-content">
                    DROP IN. CUT FAST. LOOK GOOD.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="header-tagline">
            DROP IN. CUT FAST. LOOK GOOD.
          </div>
        </div>
        
        <div className="header-buttons">
          <motion.button
            className="theme-toggle-button"
            onClick={toggleGrayscaleMode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title={isGrayscaleMode ? "Switch to Color Mode" : "Switch to Grayscale Mode"}
          >
            <Contrast className="theme-icon" />
            <span>{isGrayscaleMode ? 'COLOR' : 'GRAY'}</span>
          </motion.button>

          <motion.button
            className="login-button"
            onClick={handleLogin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <User className="login-icon" />
            <span>LOGIN</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="reel-maker-container">
        <div className="reel-maker-content">
          {/* Top Controls Container - Aligned with video sections */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="lg:col-span-2">
              <motion.div 
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <button 
                  className={`control-button ${isConnected ? 'connected' : ''}`}
                  onClick={() => setIsConnected(!isConnected)}
                >
                  {isConnected ? 'CONNECTED' : 'CONNECT'}
                </button>
                
                <button className="control-button add-videos">
                  <Upload className="inline mr-2 w-4 h-4" />
                  ADD VIDEOS
                </button>
                
                <button 
                  className={`control-button add-title ${isAddingTitle ? 'active' : ''}`}
                  onClick={() => setIsAddingTitle(!isAddingTitle)}
                >
                  <Plus className="inline mr-2 w-4 h-4" />
                  ADD TITLE &amp; TEXT
                </button>

                <button className="control-button theme">
                  <Palette className="inline mr-2 w-4 h-4" />
                  THEME
                </button>
                
                <button 
                  className="control-button make-reel"
                  disabled={selectedVideos.length === 0}
                >
                  <Wand2 className="inline mr-2 w-4 h-4" />
                  MAKE REEL
                </button>
              </motion.div>
            </div>
          </div>

          {/* Title Input Section */}
          <AnimatePresence>
            {isAddingTitle && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="title-input-container mb-8"
              >
                <input
                  type="text"
                  placeholder="ENTER YOUR REEL TITLE..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="title-input"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Video Sections */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Your Videos Section */}
            <motion.div
              className="video-section your-videos"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="section-title">YOUR VIDEOS</h2>
              <div className="video-grid">
                {mockVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    className="video-thumbnail"
                    draggable
                    onDragStart={() => handleDragStart(video)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openVideoPreview(video)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.4 + (index * 0.1) }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ImageWithFallback
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="play-overlay">
                      <div className="play-button">
                        <Play className="w-6 h-6 ml-1" />
                      </div>
                    </div>
                    <div className="video-title">{video.title}</div>
                    <div className="duration">{video.duration}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Selects Section */}
            <motion.div
              className={`video-section selects ${isDragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <h2 className="section-title">SELECTS</h2>
              {selectedVideos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <Plus className="w-8 h-8" />
                  </div>
                  <div className="empty-state-text">NO VIDEOS SELECTED</div>
                  <div className="empty-state-text" style={{ fontSize: '1rem', fontWeight: 400, marginTop: '0.5rem' }}>
                    DRAG VIDEOS HERE
                  </div>
                </div>
              ) : (
                <div className="video-grid">
                  {selectedVideos.map((video, index) => (
                    <motion.div
                      key={`${video.id}-selected`}
                      className="video-thumbnail"
                      onClick={() => openVideoPreview(video)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      layout
                      draggable
                      onDragStart={() => setDraggedVideo(video)}
                      onDragEnd={handleDragEnd}
                    >
                      <ImageWithFallback
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="play-overlay">
                        <div className="play-button">
                          <Play className="w-6 h-6 ml-1" />
                        </div>
                      </div>
                      <div 
                        className="remove-button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromSelection(video.id);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </div>
                      <div className="video-title">{video.title}</div>
                      <div className="duration">{video.duration}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      <VideoPreviewModal
        video={previewVideo}
        isOpen={isPreviewOpen}
        onClose={closeVideoPreview}
      />
    </div>
  );
}