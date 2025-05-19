'use client';

import { useState, useEffect } from 'react';
import { nanoid } from 'nanoid';
import { useRouter, useParams } from 'next/navigation';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import VideoList from '@/components/VideoList/VideoList';
import Link from 'next/link';
import { VideoFile, VideoReel } from '@/types';
import { extractDropboxPath } from '@/lib/utils/dropboxUtils';
import FolderBrowser from '@/components/FolderBrowser/FolderBrowser';

// Import our Glass UI components
import {
  GlassBackground,
  GlassContainer,
  GlassButton,
  GlassCard,
  GlassInput
} from '@/components/GlassUI';

export default function GlassmorphismEditReelPage() {
  const router = useRouter();
  const params = useParams();
  const reelId = params.id as string;
  
  const [reel, setReel] = useState<VideoReel | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Video loading variables
  const [folderPath, setFolderPath] = useState('');
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [loadedVideos, setLoadedVideos] = useState<VideoFile[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
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

  useEffect(() => {
    const fetchReel = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reels?id=${reelId}`);
        
        if (!response.ok) {
          throw new Error('Reel not found');
        }
        
        const data = await response.json();
        setReel(data);
        setTitle(data.title || '');
        
        if (data.videos && data.videos.length > 0) {
          setCurrentVideo(data.videos[0]);
          
          // No longer automatically set folder path from first video
          if (data.videos[0].path) {
            console.log(`First video path: ${data.videos[0].path}`);
          }
        }
      } catch (err: any) {
        setError(`Error loading reel: ${err.message}`);
        console.error('Error fetching reel:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (reelId) {
      fetchReel();
    }
  }, [reelId]);

  // Auto-load videos when folder path is set
  useEffect(() => {
    if (folderPath && !isLoading && reel) {
      console.log(`Auto-loading videos from folder: ${folderPath}`);
      fetchVideos(folderPath);
    }
  }, [folderPath, isLoading, reel]);

  const handleReorder = (reorderedVideos: VideoFile[]) => {
    if (!reel) return;
    setReel({
      ...reel,
      videos: reorderedVideos
    });
  };

  const handleVideoSelect = (video: VideoFile) => {
    setCurrentVideo(video);
  };
  
  // Connect to Dropbox
  const connectToDropbox = () => {
    window.location.href = '/api/auth/dropbox';
  };
  
  // Fetch videos from Dropbox folder or link
  const fetchVideos = async (path: string) => {
    if (!path) {
      setError('Please enter a Dropbox folder path or link');
      return;
    }
    
    setIsFetchingVideos(true);
    setError('');
    
    try {
      // Parse the Dropbox link or path
      const finalPath = extractDropboxPath(path);
      
      console.log(`Fetching videos from: ${finalPath}`);
      
      // Call the API to fetch videos from Dropbox
      const response = await fetch(`/api/dropbox?action=listVideos&folderPath=${encodeURIComponent(finalPath)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Folder "${finalPath}" not found in Dropbox`);
        }
        throw new Error('Failed to load videos');
      }
      
      const data = await response.json();
      
      if (data.videos && data.videos.length > 0) {
        // Filter out videos that are already in the reel
        const existingVideoIds = reel ? reel.videos.map(v => v.id) : [];
        const existingVideoPaths = reel ? reel.videos.map(v => v.path) : [];
        
        const filteredVideos = data.videos.filter((video: VideoFile) => {
          // Check if the video is already in the reel by path
          const alreadyInReel = existingVideoPaths.some(path => path === video.path);
          return !alreadyInReel;
        });
        
        console.log(`Got ${data.videos.length} videos, ${filteredVideos.length} new ones`);
        
        // Add IDs to videos that don't have them yet
        const videosWithIds = filteredVideos.map((video: VideoFile) => ({
          ...video,
          id: video.id || nanoid(),
        }));
        
        setLoadedVideos(videosWithIds);
        setSelectedVideoIds([]);  // Reset selection
      } else {
        setLoadedVideos([]);
        setError('No videos found in this folder');
      }
    } catch (err: any) {
      console.error('Error loading videos:', err);
      setError(err.message || 'Failed to load videos from Dropbox');
      setLoadedVideos([]);
    } finally {
      setIsFetchingVideos(false);
    }
  };

  // Handle video selection from the loaded videos
  const handleVideoSelection = (videoId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedVideoIds(prev => [...prev, videoId]);
    } else {
      setSelectedVideoIds(prev => prev.filter(id => id !== videoId));
    }
  };

  // Add selected videos to the reel
  const addSelectedVideosToReel = () => {
    if (!reel || selectedVideoIds.length === 0) return;
    
    // Get the selected videos from loadedVideos
    const videosToAdd = loadedVideos.filter(video => selectedVideoIds.includes(video.id));
    
    // Add to reel
    const updatedVideos = [...reel.videos, ...videosToAdd];
    setReel({
      ...reel,
      videos: updatedVideos
    });
    
    // Set the current video to the first new one if none is selected
    if (!currentVideo && videosToAdd.length > 0) {
      setCurrentVideo(videosToAdd[0]);
    }
    
    // Remove added videos from the loaded list to avoid duplicates
    setLoadedVideos(prev => prev.filter(video => !selectedVideoIds.includes(video.id)));
    setSelectedVideoIds([]);  // Clear selection
  };

  // Remove a video from the reel
  const removeVideoFromReel = (videoId: string) => {
    if (!reel) return;
    
    // Find the video to remove
    const videoToRemove = reel.videos.find(v => v.id === videoId);
    if (!videoToRemove) return;
    
    // Update reel videos
    const updatedVideos = reel.videos.filter(v => v.id !== videoId);
    setReel({
      ...reel,
      videos: updatedVideos
    });
    
    // Update current video if it was removed
    if (currentVideo && currentVideo.id === videoId) {
      setCurrentVideo(updatedVideos.length > 0 ? updatedVideos[0] : null);
    }
  };

  // Save changes to the reel
  const handleSave = async () => {
    if (!reel) return;
    
    try {
      setIsSaving(true);
      
      // Make API call to save the reel
      const response = await fetch(`/api/reels?id=${reelId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...reel,
          title: title.trim(),
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save changes');
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving reel:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview reel
  const previewReel = () => {
    router.push(`/r/${reelId}`);
  };
  
  // Save and preview
  const saveAndPreview = async () => {
    await handleSave();
    previewReel();
  };

  // Handle browse button click
  const handleBrowse = () => {
    setShowFolderBrowser(true);
  };

  if (isLoading) {
    return (
      <GlassBackground>
        <div className="flex items-center justify-center min-h-screen">
          <GlassContainer className="p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-center mt-4">Loading reel...</p>
          </GlassContainer>
        </div>
      </GlassBackground>
    );
  }

  if (error && !reel) {
    return (
      <GlassBackground>
        <div className="flex items-center justify-center min-h-screen">
          <GlassContainer className="p-6 max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-center">Error</h2>
            <p className="text-red-500 text-center mb-4">{error}</p>
            <div className="flex justify-center">
              <GlassButton 
                onClick={() => router.push('/reels')}
                state="default"
              >
                Back to Reels
              </GlassButton>
            </div>
          </GlassContainer>
        </div>
      </GlassBackground>
    );
  }

  // Main grid layout for the edit reel page
  return (
    <GlassBackground>
      <div className="container mx-auto px-4 py-8">
        {/* Main grid layout based on the wireframe */}
        <div className="grid grid-cols-12 gap-4">
          {/* Top row: CONNECT and ADD VIDEOS buttons */}
          <div className="col-span-2">
            <GlassButton
              onClick={connectToDropbox}
              className="h-full w-full flex items-center justify-center py-4"
              state={isConnectedToDropbox ? 'default' : 'highlighted'}
              fullWidth
              disabled={isCheckingConnection}
            >
              CONNECT
            </GlassButton>
          </div>
          <div className="col-span-2">
            <GlassButton
              onClick={handleBrowse}
              className="h-full w-full flex items-center justify-center py-4"
              state={isConnectedToDropbox ? (loadedVideos.length > 0 ? 'default' : 'highlighted') : 'inactive'}
              fullWidth
              disabled={!isConnectedToDropbox}
            >
              ADD VIDEOS
            </GlassButton>
          </div>
          
          {/* Title row */}
          <div className="col-span-8">
            <GlassContainer className="p-4 flex items-center justify-center">
              <GlassInput
                value={title}
                onChange={setTitle}
                placeholder="ADD TITLE HERE"
                large={true}
                className="text-center font-bold"
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
              {loadedVideos.length > 0 ? (
                <div className="space-y-2">
                  <VideoList
                    videos={loadedVideos}
                    selectedVideos={selectedVideoIds}
                    onVideoSelect={handleVideoSelect}
                    onReorder={() => {}} // We don't reorder loaded videos
                    onSelectionChange={(ids) => setSelectedVideoIds(ids)}
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
                  <p className="text-gray-500 mb-4">No videos loaded. Click "ADD VIDEOS" to browse your Dropbox.</p>
                  <GlassButton onClick={handleBrowse} state="highlighted">
                    Browse Dropbox Folders
                  </GlassButton>
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
              {reel && reel.videos.length > 0 ? (
                <div className="space-y-4">
                  <VideoList
                    videos={reel.videos}
                    currentVideo={currentVideo || undefined}
                    selectedVideos={reel.videos.map(v => v.id)}
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
                  <p className="text-gray-500">Select videos from "YOUR VIDEOS" to add them here.</p>
                </div>
              )}
            </GlassCard>
          </div>
          
          {/* Bottom row: THEME and PREVIEW REEL */}
          <div className="col-span-2">
            <GlassButton
              onClick={() => alert('Theme selection coming soon!')}
              className="h-full w-full flex items-center justify-center py-4"
              state="inactive"
              fullWidth
            >
              THEME (MENU)
            </GlassButton>
          </div>
          
          <div className="col-span-10 flex justify-end">
            <div className="w-full max-w-xs">
              <GlassButton
                onClick={saveAndPreview}
                className="h-full w-full flex items-center justify-center py-4"
                state={reel?.videos.length ? 'highlighted' : 'inactive'}
                fullWidth
                disabled={isSaving || !reel?.videos.length}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    SAVING...
                  </>
                ) : (
                  'PREVIEW REEL'
                )}
              </GlassButton>
            </div>
          </div>
        </div>
        
        {/* Success notification */}
        {saveSuccess && (
          <div className="fixed top-4 right-4 z-50">
            <GlassContainer className="bg-green-50 bg-opacity-90 text-green-800 px-4 py-2">
              Changes saved successfully!
            </GlassContainer>
          </div>
        )}
      </div>
      
      {/* Folder Browser Modal */}
      {showFolderBrowser && (
        <FolderBrowser
          onFolderSelect={(path) => {
            setFolderPath(path);
            setShowFolderBrowser(false);
            // Auto-load videos when a folder is selected
            fetchVideos(path);
          }}
          onClose={() => setShowFolderBrowser(false)}
          initialPath={folderPath}
        />
      )}
    </GlassBackground>
  );
}
