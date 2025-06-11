'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { VideoFile, VideoReel } from '@/types';
// extractDropboxPath is intentionally left for future implementation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { extractDropboxPath } from '@/lib/utils/dropboxUtils';
import FolderBrowser from '@/components/FolderBrowser/FolderBrowser';
import DropboxAuth from '@/components/DropboxAuth/DropboxAuth';

export default function EditReelPage() {
  const router = useRouter();
  const params = useParams();
  const reelId = params.id as string;
  
  const [reel, setReel] = useState<VideoReel | null>(null);
  // currentVideo is intentionally left for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  // These are intentionally left for future implementation
  const [, setIsSaving] = useState(false);
  const [, setSaveSuccess] = useState(false);
  const [isDropboxAuthenticated] = useState(false);
  
  const [folderPath, setFolderPath] = useState('');
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [loadedVideos, setLoadedVideos] = useState<VideoFile[]>([]);
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  const hasVideos = loadedVideos.length > 0;
  const _connectState = !isDropboxAuthenticated ? 'next' : 'complete';
  const _addVideosState = isDropboxAuthenticated && !hasVideos ? 'next' : (hasVideos ? 'complete' : 'default');
  
  // Suppress unused variable warnings
  void _connectState;
  void _addVideosState;
  void showVideoPlayer;
  void setShowVideoPlayer;

  // Centralized user flow state
  type Step = 'connect' | 'addVideos' | 'addTitle';
  const getCurrentStep = (): Step => {
    if (isDropboxAuthenticated) {
      return loadedVideos.length > 0 ? 'addTitle' : 'addVideos';
    }
    return 'connect';
  };
  const currentStep = getCurrentStep();

  // Helper to get status for each step
  const getStepStatus = (step: Step) => {
    if (step === currentStep) return 'next';
    if (
      (step === 'connect' && (currentStep === 'addVideos' || currentStep === 'addTitle')) ||
      (step === 'addVideos' && currentStep === 'addTitle')
    ) return 'complete';
    return 'default';
  };

  // Load reel data on mount
  const fetchReel = useCallback(async () => {
    if (!reelId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/reels/${reelId}`);
      if (!response.ok) throw new Error('Failed to fetch reel');
      
      const data = await response.json();
      setReel(data);
      setTitle(data.title || '');
      
      // If there are videos, load the first one
      if (data.videos && data.videos.length > 0) {
        setCurrentVideo(data.videos[0]);
        console.log(`First video path: ${data.videos[0].path}`);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error loading reel';
      setError(errorMessage);
      console.error('Error fetching reel:', err);
    } finally {
      setIsLoading(false);
    }
  }, [reelId]);

  useEffect(() => {
    fetchReel();
  }, [fetchReel]);

  const fetchVideos = useCallback(async (path: string) => {
    try {
      setIsFetchingVideos(true);
      setError(null);
      
      const response = await fetch(`/api/dropbox?path=${encodeURIComponent(path)}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch videos');
      }
      
      setLoadedVideos(data.files);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load videos';
      setError(errorMessage);
    } finally {
      setIsFetchingVideos(false);
    }
  }, []);

  // Auto-load videos when folder path is set
  useEffect(() => {
    if (folderPath && !isLoading && reel) {
      console.log(`Auto-loading videos from folder: ${folderPath}`);
      fetchVideos(folderPath);
    }
  }, [folderPath, isLoading, reel, fetchVideos]);

  // handleReorder is intentionally left for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleReorder = useCallback((reorderedVideos: VideoFile[]) => {
    setLoadedVideos(reorderedVideos);
  }, []);

  // addSelectedVideosToReel is intentionally left for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const addSelectedVideosToReel = useCallback(() => {
    if (!reel || selectedVideoIds.length === 0) return;
    
    const selectedVideos = loadedVideos.filter(video => 
      selectedVideoIds.includes(video.id)
    );
    
    setReel({
      ...reel,
      videos: [...reel.videos, ...selectedVideos]
    });
    
    // Clear selection
    setSelectedVideoIds([]);
  }, [reel, selectedVideoIds, loadedVideos]);

  // handleVideoSelect is intentionally left for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleVideoSelect = useCallback((videoId: string, isSelected: boolean) => {
    setSelectedVideoIds(prev => 
      isSelected 
        ? [...prev, videoId]
        : prev.filter(id => id !== videoId)
    );
  }, []);

  // handleSave is intentionally left for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSave = useCallback(async () => {
    if (!reel) return;
    
    setIsSaving(true);
    
    try {
      const response = await fetch(`/api/reels/${reel.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          videos: reel.videos,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to save reel');
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reel');
    } finally {
      setIsSaving(false);
    }
  }, [reel, title]);

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
                <div className="relative w-full aspect-video rounded bg-gray-100 border overflow-hidden">
                  <Image
                    src={video.thumbnailUrl || '/file.svg'}
                    alt={video.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/file.svg'; // fallback icon in public/
                    }}
                    unoptimized={!video.thumbnailUrl?.startsWith('/')}
                  />
                </div>
                <div className="truncate text-xs text-center mt-1 w-full" title={video.name}>
                  {video.name}
                </div>
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
