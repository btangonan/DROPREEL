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
import DropboxAuth from '@/components/DropboxAuth/DropboxAuth';

export default function EditReelPage() {
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
  const [isDropboxAuthenticated, setIsDropboxAuthenticated] = useState(false);

  const hasVideos = loadedVideos.length > 0;
  const connectState = !isDropboxAuthenticated ? 'next' : 'complete';
  const addVideosState = isDropboxAuthenticated && !hasVideos ? 'next' : (hasVideos ? 'complete' : 'default');

  // Centralized user flow state
  type Step = 'connect' | 'addVideos' | 'addTitle';
  let currentStep: Step = 'connect';
  if (isDropboxAuthenticated && !loadedVideos.length) {
    currentStep = 'addVideos';
  } else if (isDropboxAuthenticated && loadedVideos.length) {
    currentStep = 'addTitle';
  }

  // Helper to get status for each step
  const getStepStatus = (step: Step) => {
    if (step === currentStep) return 'next';
    if (
      (step === 'connect' && (currentStep === 'addVideos' || currentStep === 'addTitle')) ||
      (step === 'addVideos' && currentStep === 'addTitle')
    ) return 'complete';
    return 'default';
  };

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
          // Just log the video path for debugging
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
          // Exclude videos that have the same ID or path as existing reel videos
          return !existingVideoIds.includes(video.id) && !existingVideoPaths.includes(video.path);
        });
        
        console.log(`Filtered ${data.videos.length - filteredVideos.length} videos that are already in the reel`);
        
        // Process videos to get streaming URLs and thumbnails
        const videosWithUrls = await Promise.all(
          filteredVideos.map(async (video: VideoFile) => {
            const streamResponse = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(video.path)}`);
            const streamData = await streamResponse.json();
            
            const thumbnailUrl = `/api/dropbox/thumbnail?path=${encodeURIComponent(video.path)}`;
            
            return {
              ...video,
              streamUrl: streamData.url,
              thumbnailUrl
            };
          })
        );
        
        setLoadedVideos(videosWithUrls);
        setSelectedVideoIds([]);
      } else {
        setError('No video files found in the specified folder');
      }
    } catch (err: any) {
      setError(`Error loading videos: ${err.message}`);
      console.error('Error:', err);
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
    
    // Find videos to add (that aren't already in the reel)
    const videosToAdd = loadedVideos.filter(video => 
      selectedVideoIds.includes(video.id) && 
      !reel.videos.some(v => v.id === video.id)
    );
    
    if (videosToAdd.length === 0) {
      setError('All selected videos are already in the reel');
      return;
    }
    
    // Add the selected videos to the reel
    setReel({
      ...reel,
      videos: [...reel.videos, ...videosToAdd]
    });
    
    // Clear selection
    setSelectedVideoIds([]);
  };
  
  // Remove a video from the reel
  const removeVideoFromReel = (videoId: string) => {
    if (!reel) return;
    
    const updatedVideos = reel.videos.filter(video => video.id !== videoId);
    
    setReel({
      ...reel,
      videos: updatedVideos
    });
    
    // If the removed video was the current video, reset currentVideo
    if (currentVideo && currentVideo.id === videoId) {
      setCurrentVideo(updatedVideos.length > 0 ? updatedVideos[0] : null);
    }
  };

  const handleSave = async () => {
    if (!reel) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const updatedReel = {
        ...reel,
        id: reelId,
        title,
        // Keep existing description and directorInfo from the original reel
        description: reel.description,
        directorInfo: reel.directorInfo
      };
      
      const response = await fetch('/api/reels', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedReel)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update reel');
      }
      
      // Show success message that disappears after a few seconds
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      setError(`Error saving changes: ${err.message}`);
      console.error('Error updating reel:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVideosClick = () => {
    if (isDropboxAuthenticated) setShowFolderBrowser(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error || 'This reel could not be loaded.'}</p>
          <button 
            onClick={() => router.push('/reels')}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            Back to Reels
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-rows-[auto_1fr_auto] gap-2 md:gap-4 w-full max-w-screen-2xl mx-auto">
        {/* Top Row */}
        <div className="col-span-1 md:col-span-1 lg:col-span-1 row-span-1 flex items-center justify-center min-h-[64px] md:h-24">
          <DropboxAuth
            isAuthenticated={isDropboxAuthenticated}
            isLoading={false}
            onConnectClick={async () => {
              try {
                const response = await fetch('/api/auth/dropbox');
                const { url } = await response.json();
                window.location.href = url;
              } catch (error) {
                console.error('Error initiating Dropbox auth:', error);
              }
            }}
            highlight={getStepStatus('connect') === 'next'}
          />
        </div>
        <button
          className={`col-span-1 md:col-span-1 lg:col-span-1 row-span-1 flex items-center justify-center min-h-[64px] md:h-24 font-black text-xl md:text-2xl transition-all focus:outline-none rounded-lg w-full h-full
            ${getStepStatus('addVideos') === 'next' ? 'bg-yellow-300 text-yellow-900 animate-pulse' : getStepStatus('addVideos') === 'complete' ? 'bg-green-400 text-white' : 'bg-gray-300 text-gray-700'}
            ${!isDropboxAuthenticated && getStepStatus('addVideos') !== 'next' ? 'opacity-50 pointer-events-none' : 'hover:bg-blue-200 cursor-pointer'}`}
          onClick={handleAddVideosClick}
          disabled={!isDropboxAuthenticated && getStepStatus('addVideos') !== 'next'}
          type="button"
        >
          ADD VIDEOS
        </button>
        <div className={`col-span-1 md:col-span-2 lg:col-span-2 row-span-1 flex items-center justify-center min-h-[64px] md:h-24 font-black text-3xl md:text-5xl lg:text-6xl text-center transition-opacity bg-gray-300 rounded-lg`}>
          ADD TITLE HERE
        </div>
        {/* Middle Row */}
        <div className={`col-span-1 md:col-span-1 lg:col-span-2 row-span-1 bg-gray-300 rounded-lg p-2 md:p-4 transition-opacity ${!isDropboxAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="font-black text-lg md:text-xl mb-2">YOUR VIDEOS</div>
          <div className="min-h-[128px] md:h-64 bg-gray-200 rounded flex flex-wrap gap-2 overflow-y-auto p-2">
            {isFetchingVideos && <div className="w-full text-center text-gray-500">Loading videos...</div>}
            {error && <div className="w-full text-center text-red-500">{error}</div>}
            {!isFetchingVideos && !error && loadedVideos.length === 0 && <div className="w-full text-center text-gray-400">No videos loaded.</div>}
            {loadedVideos.map(video => (
              <div key={video.id} className="w-32 flex flex-col items-center">
                <img
                  src={video.thumbnailUrl}
                  alt={video.name}
                  className="w-full aspect-video object-cover rounded bg-gray-100 border"
                  onError={e => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/file.svg'; // fallback icon in public/
                  }}
                />
                <div className="truncate text-xs text-center mt-1 w-full" title={video.name}>{video.name}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={`col-span-1 md:col-span-1 lg:col-span-2 row-span-1 bg-gray-300 rounded-lg p-2 md:p-4 transition-opacity ${!isDropboxAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="font-black text-lg md:text-xl mb-2">SELECTS</div>
          <div className="min-h-[128px] md:h-64 bg-gray-200 rounded"></div>
        </div>
        {/* Bottom Row */}
        <div className={`col-span-1 md:col-span-1 lg:col-span-2 row-span-1 bg-gray-300 rounded-lg flex items-center justify-center min-h-[48px] md:h-20 font-black text-2xl md:text-3xl transition-opacity ${!isDropboxAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}>THEME (MENU)</div>
        <div className={`col-span-1 md:col-span-1 lg:col-span-2 row-span-1 bg-gray-300 rounded-lg flex items-center justify-center min-h-[48px] md:h-20 font-black text-2xl md:text-3xl transition-opacity ${!isDropboxAuthenticated ? 'opacity-50 pointer-events-none' : ''}`}>PREVIEW REEL</div>
      </div>
      {showFolderBrowser && (
        <FolderBrowser
          onFolderSelect={path => {
            setFolderPath(path);
            setShowFolderBrowser(false);
            fetchVideos(path);
          }}
          onClose={() => setShowFolderBrowser(false)}
          initialPath={folderPath}
        />
      )}
    </div>
  );
}
