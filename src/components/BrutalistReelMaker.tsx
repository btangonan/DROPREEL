'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Upload, Plus, Palette, Wand2, X, User, Contrast } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { VideoPreviewModal } from './VideoPreviewModal';
import FolderBrowser from './FolderBrowser/FolderBrowser';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  videoUrl?: string;
  path?: string; // Add Dropbox path
  size?: number; // Add file size
  selectionId?: string; // Add unique selection ID for multiple instances
}

export function BrutalistReelMaker() {
  const [isConnected, setIsConnected] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [videos, setVideos] = useState<Video[]>([]); // Real Dropbox videos
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Video[]>([]);
  const [draggedVideo, setDraggedVideo] = useState<Video | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [title, setTitle] = useState('');
  const [isAddingTitle, setIsAddingTitle] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showLogoTooltip, setShowLogoTooltip] = useState(false);
  const [isGrayscaleMode, setIsGrayscaleMode] = useState(false);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [currentFolderPath, setCurrentFolderPath] = useState<string>('');
  const [isLoadingVideoStream, setIsLoadingVideoStream] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const [dragDirection, setDragDirection] = useState<'clockwise' | 'counterclockwise'>('clockwise');

  // Check authentication status on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const response = await fetch('/api/auth/dropbox/status');
      console.log('Auth status response:', response.status);
      const data = await response.json();
      console.log('Auth status data:', data);
      setIsConnected(data.isAuthenticated);
      console.log('Set isConnected to:', data.isAuthenticated);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsConnected(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleConnect = () => {
    console.log('Connect button clicked. isConnected:', isConnected);
    if (isConnected) {
      console.log('Already connected, showing disconnect modal');
      setShowDisconnectModal(true);
      return;
    }
    console.log('Redirecting to Dropbox auth...');
    // Redirect to Dropbox authentication
    window.location.href = '/api/auth/dropbox';
  };

  const handleDisconnect = () => {
    // Simple disconnect - just set state to false for testing
    setIsConnected(false);
    setShowDisconnectModal(false);
    console.log('Disconnected (local state only)');
  };

  const handleCancelDisconnect = () => {
    setShowDisconnectModal(false);
  };

  const handleDragStart = (video: Video, e: React.DragEvent) => {
    setDraggedVideo(video);
    setIsDraggingVideo(video.selectionId || video.id);
    
    // Determine drag direction based on source panel
    // If video has selectionId, it's coming from SELECTS panel (going back to YOUR VIDEOS) - counterclockwise
    // If video has no selectionId, it's coming from YOUR VIDEOS panel (going to SELECTS) - clockwise
    setDragDirection(video.selectionId ? 'counterclockwise' : 'clockwise');
    
    // Set initial drag position
    setDragPosition({ x: e.clientX, y: e.clientY });
    
    // Create a transparent drag image to hide the default browser drag preview
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.globalAlpha = 0;
    }
    e.dataTransfer.setDragImage(canvas, 0, 0);
    
    // Track mouse position during drag with high frequency updates
    const handleMouseMove = (event: MouseEvent) => {
      requestAnimationFrame(() => {
        setDragPosition({ x: event.clientX, y: event.clientY });
      });
    };
    
    // Add event listeners for drag tracking
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('dragover', handleMouseMove, { passive: true });
    
    // Clean up on drag end
    const cleanup = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('dragover', handleMouseMove);
      setDragPosition(null);
    };
    
    // Store cleanup function for later use
    (e.target as any)._dragCleanup = cleanup;
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedVideo(null);
    setIsDraggingVideo(null);
    setDragPosition(null);
    
    // Call cleanup function if it exists
    if ((e.target as any)._dragCleanup) {
      (e.target as any)._dragCleanup();
      delete (e.target as any)._dragCleanup;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  // Handle dragging videos back to YOUR VIDEOS (to remove from selection)
  const handleRemoveDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemoveDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    if (draggedVideo && draggedVideo.selectionId) {
      // Remove the video from selected videos
      removeFromSelection(draggedVideo.selectionId);
      
      // Add the video back to YOUR VIDEOS (without selectionId)
      const originalVideo = {
        ...draggedVideo,
        selectionId: undefined // Remove the selectionId to make it a "your videos" item again
      };
      delete originalVideo.selectionId; // Completely remove the property
      
      // Check if this video is already in YOUR VIDEOS to avoid duplicates
      if (!videos.find(v => v.id === draggedVideo.id)) {
        setVideos([...videos, originalVideo]);
      }
    }
    setDraggedVideo(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (draggedVideo) {
      // If this video doesn't have a selectionId, it's coming from YOUR VIDEOS
      if (!draggedVideo.selectionId) {
        // Create a new video object with a unique selection ID
        const selectedVideo = {
          ...draggedVideo,
          selectionId: `${draggedVideo.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        // Add to selected videos
        setSelectedVideos([...selectedVideos, selectedVideo]);
        
        // Remove from your videos (move, don't copy)
        setVideos(videos.filter(v => v.id !== draggedVideo.id));
      }
    }
    setDraggedVideo(null);
  };

  const removeFromSelection = (selectionId: string) => {
    // Find the video being removed
    const videoToRemove = selectedVideos.find(v => v.selectionId === selectionId);
    
    // Remove from selected videos
    setSelectedVideos(selectedVideos.filter(v => v.selectionId !== selectionId));
    
    // Add back to YOUR VIDEOS if not already there
    if (videoToRemove && !videos.find(v => v.id === videoToRemove.id)) {
      const originalVideo = { ...videoToRemove };
      delete originalVideo.selectionId; // Remove the selectionId
      setVideos([...videos, originalVideo]);
    }
  };

  const openVideoPreview = async (video: Video) => {
    setPreviewVideo(video);
    setIsPreviewOpen(true);
    
    // If video has a Dropbox path but no videoUrl, get the streaming URL
    if (video.path && !video.videoUrl) {
      setIsLoadingVideoStream(true);
      try {
        console.log('Getting streaming URL for:', video.path);
        const url = new URL('/api/dropbox', window.location.origin);
        url.searchParams.append('action', 'getStreamUrl');
        url.searchParams.append('path', video.path);

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
          console.log('Got streaming URL:', data.url);
          
          // Update the video object with the streaming URL
          const updatedVideo = { ...video, videoUrl: data.url };
          setPreviewVideo(updatedVideo);
          
          // Also update the video in the main videos array
          setVideos(prevVideos => 
            prevVideos.map(v => v.id === video.id ? updatedVideo : v)
          );
        } else {
          console.error('Failed to get streaming URL:', response.status);
          alert('Failed to load video stream');
        }
      } catch (error) {
        console.error('Error getting streaming URL:', error);
        alert('Error loading video stream');
      } finally {
        setIsLoadingVideoStream(false);
      }
    }
  };

  const closeVideoPreview = () => {
    setIsPreviewOpen(false);
    setPreviewVideo(null);
    setIsLoadingVideoStream(false);
  };

  const handleLogin = () => {
    // Handle user login (separate from Dropbox connection)
    console.log('Login clicked - implement user authentication');
  };

  const handleAddVideos = () => {
    if (!isConnected) {
      alert('Please connect to Dropbox first');
      return;
    }
    console.log('Opening folder browser to select videos');
    setShowFolderBrowser(true);
  };

  const handleFolderSelect = (folderPath: string) => {
    console.log('Selected folder:', folderPath);
    setShowFolderBrowser(false);
    loadVideosFromDropbox(folderPath);
  };

  const handleCloseFolderBrowser = () => {
    setShowFolderBrowser(false);
  };

  const loadVideosFromDropbox = async (folderPath: string) => {
    setIsLoadingVideos(true);
    try {
      console.log('Loading videos from folder:', folderPath);
      const url = new URL('/api/dropbox', window.location.origin);
      url.searchParams.append('action', 'listVideos');
      url.searchParams.append('folderPath', folderPath);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to load videos: ${response.status}`);
      }

      const data = await response.json();
      console.log('Loaded videos from Dropbox:', data.videos);

      // Convert Dropbox videos to our Video format
      const dropboxVideos: Video[] = data.videos.map((video: any) => ({
        id: video.id,
        title: video.name.replace(/\.[^/.]+$/, '').toUpperCase(), // Remove extension and uppercase
        thumbnail: video.thumbnailUrl || '/placeholder-video.jpg',
        duration: '0:00', // TODO: Get actual duration from media info
        videoUrl: '', // Will be loaded when needed
        path: video.path,
        size: video.size
      }));

      setVideos(dropboxVideos);
      setCurrentFolderPath(folderPath);
    } catch (error) {
      console.error('Error loading videos:', error);
      alert('Failed to load videos from Dropbox');
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleMakeReel = () => {
    if (!isConnected) {
      alert('Please connect to Dropbox first');
      return;
    }
    if (selectedVideos.length === 0) {
      alert('Please select at least one video');
      return;
    }
    // TODO: Implement reel creation functionality
    console.log('Make reel clicked with videos:', selectedVideos);
  };

  const handleTheme = () => {
    // TODO: Implement theme selection functionality
    console.log('Theme clicked');
  };

  const toggleGrayscaleMode = () => {
    setIsGrayscaleMode(!isGrayscaleMode);
  };

  // Debug: log current state
  console.log('Render state:', { isConnected, isCheckingAuth });

  return (
    <div className={`min-h-screen bg-white relative ${isGrayscaleMode ? 'grayscale-mode' : ''}`} style={{ margin: 0, padding: 0 }}>
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
                  onClick={handleConnect}
                  disabled={isCheckingAuth}
                  style={{ pointerEvents: 'auto', zIndex: 10 }}
                >
                  {isCheckingAuth ? 'CHECKING...' : (isConnected ? 'CONNECTED' : 'CONNECT')}
                </button>
                
                <button 
                  className="control-button add-videos"
                  onClick={handleAddVideos}
                  disabled={isLoadingVideos}
                >
                  <Upload className="inline mr-2 w-4 h-4" />
                  {isLoadingVideos ? 'LOADING...' : 'ADD VIDEOS'}
                </button>
                
                <button 
                  className={`control-button add-title ${isAddingTitle ? 'active' : ''}`}
                  onClick={() => setIsAddingTitle(!isAddingTitle)}
                >
                  <Plus className="inline mr-2 w-4 h-4" />
                  ADD TITLE &amp; TEXT
                </button>

                <button 
                  className="control-button theme"
                  onClick={handleTheme}
                >
                  <Palette className="inline mr-2 w-4 h-4" />
                  THEME
                </button>
                
                <button 
                  className="control-button make-reel"
                  onClick={handleMakeReel}
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
              onDragOver={handleRemoveDragOver}
              onDrop={handleRemoveDrop}
            >
              <h2 className="section-title">YOUR VIDEOS</h2>
              <div className="video-grid">
                {isLoadingVideos ? (
                  <div className="col-span-full flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black"></div>
                    <span className="ml-3 font-bold text-black">LOADING VIDEOS...</span>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <div className="text-black font-bold text-lg mb-2">NO VIDEOS FOUND</div>
                    <div className="text-gray-600 font-medium">Click "ADD VIDEOS" to select a folder</div>
                  </div>
                ) : (
                  videos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    className={`video-thumbnail ${isDraggingVideo === video.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(video, e)}
                    onDragEnd={handleDragEnd}
                    onClick={() => openVideoPreview(video)}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: isDraggingVideo === video.id ? 0 : 1, 
                      scale: isDraggingVideo === video.id ? 0.8 : 1 
                    }}
                    transition={{ 
                      duration: 0.15, 
                      delay: index * 0.02,
                      layout: {
                        type: "tween",
                        ease: [0.25, 0.46, 0.45, 0.94],
                        duration: 0.4
                      }
                    }}
                    whileHover={{ scale: isDraggingVideo === video.id ? 0.8 : 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    layout
                    layoutDependency={videos.length}
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
                  ))
                )}
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
                      key={video.selectionId || `${video.id}-selected-${index}`}
                      className={`video-thumbnail ${isDraggingVideo === video.selectionId ? 'dragging' : ''}`}
                      onClick={() => openVideoPreview(video)}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: isDraggingVideo === video.selectionId ? 0 : 1,
                        scale: isDraggingVideo === video.selectionId ? 0.8 : 1 
                      }}
                      transition={{ 
                        duration: 0.15, 
                        delay: index * 0.02,
                        layout: {
                          type: "tween",
                          ease: [0.25, 0.46, 0.45, 0.94],
                          duration: 0.4
                        }
                      }}
                      layout
                      layoutDependency={selectedVideos.length}
                      draggable
                      onDragStart={(e) => handleDragStart(video, e)}
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
                          removeFromSelection(video.selectionId || video.id);
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
        isLoadingVideo={isLoadingVideoStream}
      />

      {/* Folder Browser Modal */}
      {showFolderBrowser && (
        <FolderBrowser
          onFolderSelect={handleFolderSelect}
          onClose={handleCloseFolderBrowser}
          onAuthError={() => {
            setIsConnected(false);
            setShowFolderBrowser(false);
            alert('Authentication error. Please reconnect to Dropbox.');
          }}
        />
      )}

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {showDisconnectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <motion.div
              className="bg-white border-4 border-black p-8 max-w-md w-full mx-4"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <h2 className="text-2xl font-black uppercase text-black mb-4 text-center">
                DISCONNECT DROPBOX?
              </h2>
              <p className="text-lg font-bold text-black mb-8 text-center">
                YOU ARE ALREADY CONNECTED TO DROPBOX.
                <br />
                DO YOU WANT TO DISCONNECT?
              </p>
              <div className="flex gap-4">
                <motion.button
                  className="flex-1 bg-gray-200 hover:bg-gray-300 border-2 border-black text-black font-black text-lg py-3 px-6 uppercase transition-all"
                  onClick={handleCancelDisconnect}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  CANCEL
                </motion.button>
                <motion.button
                  className="flex-1 bg-red-500 hover:bg-red-600 border-2 border-black text-white font-black text-lg py-3 px-6 uppercase transition-all"
                  onClick={handleDisconnect}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  DISCONNECT
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Drag Preview */}
      <AnimatePresence>
        {isDraggingVideo && draggedVideo && dragPosition && (
          <motion.div
            className="fixed pointer-events-none z-50"
            style={{
              left: dragPosition.x - 100, // Center the preview on cursor
              top: dragPosition.y - 56,   // Adjust for thumbnail aspect ratio
              width: '200px',
              height: '112px',
              willChange: 'transform' // Optimize for frequent position changes
            }}
            initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
            animate={{ 
              opacity: 0.95, 
              scale: 1.05, 
              rotate: dragDirection === 'clockwise' ? 8 : -8,
              x: 0,
              y: 0
            }}
            exit={{ opacity: 0, scale: 0.8, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 500,
              damping: 30,
              duration: 0.05
            }}
          >
            <div 
              className="video-thumbnail" 
              style={{ 
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                border: '3px solid var(--neon-yellow)',
                transform: 'none' // Remove individual transform since parent handles rotation
              }}
            >
              <ImageWithFallback
                src={draggedVideo.thumbnail}
                alt={draggedVideo.title}
                className="w-full h-full object-cover"
              />
              <div className="video-title" style={{ fontSize: '0.7rem' }}>{draggedVideo.title}</div>
              <div className="duration">{draggedVideo.duration}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}