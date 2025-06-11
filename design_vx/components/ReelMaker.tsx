'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Upload, Plus, Palette, Wand2, X } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { VideoPreviewModal } from './VideoPreviewModal';
import exampleImage from 'figma:asset/6c3040908ae73c88f95c316bbdcdf7b2defee7ec.png';

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
    title: 'Sunset Beach Walk',
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=225&fit=crop',
    duration: '0:45',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '2',
    title: 'City Night Lights',
    thumbnail: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=225&fit=crop',
    duration: '1:20',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '3',
    title: 'Mountain Hiking',
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=225&fit=crop',
    duration: '2:15',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '4',
    title: 'Coffee Shop Vibes',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=225&fit=crop',
    duration: '0:30',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  },
  {
    id: '5',
    title: 'Ocean Waves',
    thumbnail: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400&h=225&fit=crop',
    duration: '1:45',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4'
  },
  {
    id: '6',
    title: 'Forest Path',
    thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=225&fit=crop',
    duration: '3:00',
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4'
  }
];

export function ReelMaker() {
  const [isConnected, setIsConnected] = useState(true);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [draggedVideo, setDraggedVideo] = useState<Video | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [isAddingTitle, setIsAddingTitle] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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

  return (
    <div className="reel-maker-bg p-6">
      <div className="max-w-7xl mx-auto">
        {/* Top Controls */}
        <motion.div 
          className="flex flex-wrap gap-4 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <button 
            className="btn-connected"
            onClick={() => setIsConnected(!isConnected)}
          >
            {isConnected ? 'CONNECTED' : 'CONNECT'}
          </button>
          
          <button className="btn-add-videos">
            ADD VIDEOS
          </button>
          
          <button 
            className={`btn-add-title ${isAddingTitle ? 'active' : ''}`}
            onClick={() => setIsAddingTitle(!isAddingTitle)}
          >
            ADD TITLE &amp; TEXT
          </button>
        </motion.div>

        {/* Title Input Section */}
        <AnimatePresence>
          {isAddingTitle && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="glass-card p-6">
                <input
                  type="text"
                  placeholder="Enter your reel title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-transparent text-white placeholder-white/60 border-none outline-none text-xl"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Your Videos Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-card-orange p-6"
          >
            <h3 className="section-header">YOUR VIDEOS</h3>
            <div className="grid grid-cols-2 gap-4">
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
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ImageWithFallback
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="video-play-button">
                    <Play className="w-6 h-6 text-gray-800 ml-1" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                    {video.duration}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Selects Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className={`glass-card-blue p-6 drop-zone ${isDragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <h3 className="section-header">SELECTS</h3>
            {selectedVideos.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <Plus className="w-8 h-8" />
                </div>
                <p>No videos selected. Drag videos here</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {selectedVideos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    className="video-thumbnail group"
                    onClick={() => openVideoPreview(video)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    layout
                  >
                    <ImageWithFallback
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="video-play-button">
                      <Play className="w-6 h-6 text-gray-800 ml-1" />
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromSelection(video.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500/80 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-600 hover:scale-110"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {video.duration}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Controls */}
        <motion.div 
          className="grid lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <button className="btn-theme">
            THEME (MENU)
          </button>
          
          <button 
            className="btn-make-reel"
            disabled={selectedVideos.length === 0}
          >
            MAKE REEL
          </button>
        </motion.div>
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