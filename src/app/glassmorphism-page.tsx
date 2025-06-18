'use client';

import { useState, useEffect } from 'react';
import { VideoFile } from '@/types';
import { useRouter } from 'next/navigation';
import { extractDropboxPath } from '@/lib/utils/dropboxUtils';
import FolderBrowser from '@/components/FolderBrowser/FolderBrowser';
import { nanoid } from 'nanoid';

// Import our Glass UI components
import {
  GlassBackground,
  GlassContainer,
  GlassButton,
  GlassCard,
  GlassInput
} from '@/components/GlassUI';
import VideoList from '@/components/VideoList/VideoList';

export default function GlassmorphismCreateReelPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoFile>();
  const [error, setError] = useState('');
  const [reelTitle, setReelTitle] = useState('');
  const [isCreatingReel, setIsCreatingReel] = useState(false);
  
  // For selecting videos to include in the reel
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  // For managing selected videos for the reel
  const [selectedVideos, setSelectedVideos] = useState<VideoFile[]>([]);
  
  // Don't use any default path
  const [folderPath, setFolderPath] = useState<string>('');
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  
  // Dropbox connection state
  const [isConnectedToDropbox, setIsConnectedToDropbox] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);

  // Check Dropbox connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setIsCheckingConnection(true);
        const response = await fetch('/api/auth/dropbox/status');
        const data = await response.json();
        setIsConnectedToDropbox(data.connected);
      } catch (err) {
        console.error('Error checking Dropbox connection:', err);
        setIsConnectedToDropbox(false);
      } finally {
        setIsCheckingConnection(false);
      }
    };
    
    checkConnection();
  }, []);

  const fetchVideos = async (path: string) => {
    if (!path && !folderPath) {
      setError('Please enter a Dropbox folder path or link');
      return;
    }
    
    // Parse the path or Dropbox link to get a valid path
    const finalPath = extractDropboxPath(path || folderPath);
    
    console.log(`Fetching videos from Dropbox path: "${finalPath}"`);
    
    setIsFetchingVideos(true);
    setError('');
    setVideos([]);
    setCurrentVideo(undefined);
    
    try {
      // Try listing the directory first to validate it exists
      const listRootResponse = await fetch('/api/dropbox?action=listRoot');
      const rootData = await listRootResponse.json();
      
      if (listRootResponse.ok && rootData.folders) {
        console.log('Available folders:', rootData.folders.map((f: { path: string }) => f.path).join(', '));
      }
      
      // Now fetch videos from the specified path
      const response = await fetch(`/api/dropbox?action=listVideos&folderPath=${encodeURIComponent(finalPath)}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404 || (data.error && data.error.includes('not found'))) {
          throw new Error(`Folder "${finalPath}" not found. Please make sure it exists in your Dropbox account. Try checking your folder path or using one of the available folders.`);
        }
        throw new Error(data.error || 'Failed to load videos');
      }
      
      if (data.videos && data.videos.length > 0) {
        console.log(`Found ${data.videos.length} videos in the folder`);
        
        // Get streaming URLs and thumbnails for each video
        const videosWithUrls = await Promise.all(
          data.videos.map(async (video: VideoFile) => {
            const streamResponse = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(video.path)}`);
            const streamData = await streamResponse.json();
            
            // Use the API endpoint as thumbnail URL
            const thumbnailUrl = `/api/dropbox/thumbnail?path=${encodeURIComponent(video.path)}`;
            
            return {
              ...video,
              id: video.id || nanoid(), // Ensure each video has an ID
              streamUrl: streamData.url,
              thumbnailUrl
            };
          })
        );

        setVideos(videosWithUrls);
        if (videosWithUrls.length > 0) {
          setCurrentVideo(videosWithUrls[0]);
        }
      } else {
        setError('No video files found in the specified folder');
      }
    } catch (err) {
      const error = err as Error;
      setError(`Error loading videos: ${error.message || 'Please check your Dropbox configuration.'}`);
      console.error('Error:', err);
    } finally {
      setIsFetchingVideos(false);
    }
  };

  const handleVideoSelect = (video: VideoFile) => {
    setCurrentVideo(video);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedVideoIds(selectedIds);
  };

  // Add selected videos to the reel
  const addSelectedVideosToReel = () => {
    if (selectedVideoIds.length === 0) return;
    
    // Get the selected videos
    const videosToAdd = videos.filter(video => selectedVideoIds.includes(video.id));
    
    // Add to selected videos array (avoiding duplicates)
    const newSelectedVideos = [...selectedVideos];
    
    videosToAdd.forEach(video => {
      if (!newSelectedVideos.some(v => v.id === video.id)) {
        newSelectedVideos.push(video);
      }
    });
    
    setSelectedVideos(newSelectedVideos);
    
    // Reset selection
    setSelectedVideoIds([]);
  };

  // Remove video from the selected videos
  const removeVideoFromReel = (videoId: string) => {
    setSelectedVideos(prev => prev.filter(v => v.id !== videoId));
    
    // Update current video if it was removed
    if (currentVideo && currentVideo.id === videoId) {
      setCurrentVideo(selectedVideos.length > 0 ? selectedVideos[0] : undefined);
    }
  };

  // Connect to Dropbox
  const connectToDropbox = () => {
    window.location.href = '/api/auth/dropbox';
  };

  // Create the reel
  const handleCreateReel = async () => {
    if (selectedVideos.length === 0) {
      setError('Please select at least one video for your reel');
      return;
    }
    if (!reelTitle.trim()) {
      setError('Please enter a title for your reel');
      return;
    }
    try {
      setIsCreatingReel(true);
      const newReel = {
        title: reelTitle.trim(),
        videos: selectedVideos,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const response = await fetch('/api/reels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReel)
      });
      if (!response.ok) throw new Error('Failed to create reel');
      const createdReel = await response.json();
      // Immediately navigate to the view page for the new reel
      router.push(`/r/${createdReel.id}`);
    } catch (err) {
      console.error('Error creating reel:', err);
      const error = err as Error;
      setError(`Failed to create reel: ${error.message}`);
    } finally {
      setIsCreatingReel(false);
    }
  };

  // Navigate to edit the newly created reel (unused)
  // const handleEditReel = () => {
  //   if (reelCreated) {
  //     router.push(`/reels/edit/${reelCreated.id}`);
  //   }
  // };

  // Browse button click handler
  const handleBrowse = () => {
    setShowFolderBrowser(true);
  };

  // Reorder videos in the reel
  const handleReorder = (reorderedVideos: VideoFile[]) => {
    setSelectedVideos(reorderedVideos);
  };

  // Handle folder selection
  const handleFolderSelect = (path: string) => {
    setFolderPath(path);
    setShowFolderBrowser(false);
    fetchVideos(path);
  };

  // Main grid layout for the create reel page
  return (
    <GlassBackground>
      <div className="container mx-auto px-4 py-8">
        {/* Main grid layout based on the wireframe */}
        <div className="grid grid-cols-12 gap-4">
          {/* Top row: CONNECT and ADD VIDEOS buttons */}
          <div className="col-span-12 grid grid-cols-12 gap-4 mb-4 border-b-2 border-foreground pb-4">
            <div className="col-span-3">
              <GlassButton
                onClick={connectToDropbox}
                className="h-full w-full flex items-center justify-center py-4 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
                state={isConnectedToDropbox ? 'default' : 'highlighted'}
                fullWidth
                disabled={isCheckingConnection}
              >
                {isCheckingConnection ? 'CONNECTING...' : 'CONNECT'}
              </GlassButton>
            </div>
            <div className="col-span-3">
              <GlassButton
                onClick={handleBrowse}
                className="h-full w-full flex items-center justify-center py-4 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
                state={isConnectedToDropbox ? (videos.length > 0 ? 'default' : 'highlighted') : 'inactive'}
                fullWidth
                disabled={!isConnectedToDropbox}
              >
                ADD VIDEOS
              </GlassButton>
            </div>
            <div className="col-span-3">
              <GlassButton
                onClick={() => alert('Theme selection coming soon!')}
                className="h-full w-full flex items-center justify-center py-4 border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
                state="inactive"
                fullWidth
              >
                THEME (MENU)
              </GlassButton>
            </div>
            <div className="col-span-3">
              <GlassButton
                onClick={handleCreateReel}
                className={`h-full w-full flex items-center justify-center py-4 border-2 border-foreground transition-colors ${
                  isConnectedToDropbox && reelTitle.trim() && selectedVideos.length 
                    ? 'hover:bg-foreground hover:text-background' 
                    : 'opacity-50 cursor-not-allowed'
                }`}
                state={isConnectedToDropbox && reelTitle.trim() && selectedVideos.length ? 'highlighted' : 'inactive'}
                fullWidth
                disabled={isCreatingReel || !isConnectedToDropbox || !reelTitle.trim() || selectedVideos.length === 0}
              >
                {isCreatingReel ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    MAKING REEL...
                  </>
                ) : (
                  'MAKE REEL'
                )}
              </GlassButton>
            </div>
          </div>
          
          {/* Title row */}
          <div className="col-span-12 mb-6">
            <GlassContainer className="p-4 flex items-center justify-center border-2 border-foreground">
              <GlassInput
                value={reelTitle}
                onChange={setReelTitle}
                placeholder="ADD TITLE HERE"
                large={true}
                className="text-center font-bold text-2xl tracking-wider uppercase w-full max-w-2xl"
              />
            </GlassContainer>
          </div>
          
          {/* Main content row: YOUR VIDEOS and SELECTS */}
          <div className="col-span-6 min-h-[500px]">
            <GlassCard
              title="YOUR VIDEOS"
              scrollable={true}
              maxHeight="500px"
            >
              {isFetchingVideos ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : videos.length > 0 ? (
                <div className="space-y-2">
                  <VideoList
                    videos={videos}
                    selectedVideos={selectedVideoIds}
                    onVideoSelect={handleVideoSelect}
                    onReorder={() => {}} // We don't reorder loaded videos
                    onSelectionChange={handleSelectionChange}
                    showCheckboxes={true}
                  />
                  <div className="pt-4 flex justify-center">
                    <GlassButton
                      onClick={addSelectedVideosToReel}
                      disabled={selectedVideoIds.length === 0}
                      state={selectedVideoIds.length > 0 ? 'highlighted' : 'inactive'}
                    >
                      Add Selected Videos to Reel
                    </GlassButton>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <p className="text-gray-500 mb-4">No videos loaded. Click &quot;ADD VIDEOS&quot; to browse your Dropbox.</p>
                  <GlassButton onClick={handleBrowse} state="highlighted">
                    Browse Dropbox Folders
                  </GlassButton>
                </div>
              )}
              
              {error && (
                <div className="bg-red-50 p-3 mt-4 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
            </GlassCard>
          </div>
          
          <div className="col-span-6 min-h-[500px]">
            <GlassCard
              title="SELECTS"
              scrollable={true}
              maxHeight="500px"
            >
              {selectedVideos.length > 0 ? (
                <div className="space-y-4">
                  <VideoList
                    videos={selectedVideos}
                    currentVideo={currentVideo || undefined}
                    selectedVideos={selectedVideos.map(v => v.id)}
                    onVideoSelect={handleVideoSelect}
                    onReorder={handleReorder}
                    onSelectionChange={() => {}}
                    showCheckboxes={false}
                  />
                  
                  {currentVideo && (
                    <div className="pt-4 border-t border-gray-200">
                      <GlassButton
                        onClick={() => removeVideoFromReel(currentVideo.id)}
                        className="w-full justify-center"
                        state="default"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remove Selected Video
                      </GlassButton>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <p className="text-gray-500">No videos added to your reel yet.</p>
                  <p className="text-gray-500">Select videos from &quot;YOUR VIDEOS&quot; to add them here.</p>
                </div>
              )}
            </GlassCard>
          </div>
          
          {/* Bottom row buttons are now moved to the top row */}
        </div>
      </div>
      
      {/* Folder Browser Modal */}
      {showFolderBrowser && (
        <FolderBrowser
          onFolderSelect={handleFolderSelect}
          onClose={() => setShowFolderBrowser(false)}
          initialPath={folderPath}
        />
      )}
    </GlassBackground>
  );
}
