'use client';

import { useEffect, useState } from 'react';
import { VideoFile, VideoReel } from '@/types';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ReelPage() {
  const params = useParams();
  const router = useRouter();
  const reelId = params.id as string;
  
  const [reel, setReel] = useState<VideoReel | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoFile | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDirectorBio, setShowDirectorBio] = useState(true); // To toggle between bio and video

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
        
        if (data.videos && data.videos.length > 0) {
          setCurrentVideo(data.videos[0]);
        }
      } catch (err) {
        setError('Error loading reel. It may have expired or been removed.');
        console.error('Error fetching reel:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (reelId) {
      fetchReel();
    }
  }, [reelId]);

  const handleNext = () => {
    if (!reel || !reel.videos.length) return;
    
    const nextIndex = (currentIndex + 1) % reel.videos.length;
    setCurrentIndex(nextIndex);
    setCurrentVideo(reel.videos[nextIndex]);
  };

  const handlePrevious = () => {
    if (!reel || !reel.videos.length) return;
    
    const prevIndex = (currentIndex - 1 + reel.videos.length) % reel.videos.length;
    setCurrentIndex(prevIndex);
    setCurrentVideo(reel.videos[prevIndex]);
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
          <h2 className="text-2xl font-bold mb-4">Reel Not Found</h2>
          <p>{error || 'This reel could not be loaded.'}</p>
        </div>
      </div>
    );
  }

  // Function to select a specific video by index
  const selectVideo = (index: number) => {
    if (!reel || !reel.videos.length) return;
    
    setCurrentIndex(index);
    setCurrentVideo(reel.videos[index]);
    setShowDirectorBio(false); // Switch to video view
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="py-3 px-4 flex justify-between items-center border-b-2 border-black">
          <Link 
            href={`/reels/edit/${reelId}`} 
            className="brutal-button-accent text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            EDIT REEL
          </Link>
          {/* Logo placeholder - can be replaced with custom logo */}
          <div className="h-10 flex items-center">
            <span className="text-xl font-medium font-mono">DROPREEL</span>
          </div>
          <Link href="/reels" className="brutal-button text-sm">← ALL REELS</Link>
        </div>

        <div className="w-full relative">
          {/* Navigation Arrows - positioned at page edges */}
          {!showDirectorBio && currentVideo && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 brutal-button p-2 z-20"
                aria-label="Previous video"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 brutal-button p-2 z-20"
                aria-label="Next video"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Video container with intelligent sizing */}
          <div className="w-full">
            <div className="max-w-screen-xl mx-auto px-16 py-8 w-full">
              {/* Display director bio if available and showDirectorBio is true */}
              {reel.directorInfo && showDirectorBio ? (
                <div className="bg-background border-2 border-black py-8 mx-auto">
                  <div className="grid grid-cols-2 gap-8 items-start">
                    {reel.directorInfo.image && (
                      <div className="col-span-1">
                        <img 
                          src={reel.directorInfo.image} 
                          alt="Director" 
                          className="w-full h-auto border-2 border-black"
                        />
                      </div>
                    )}
                    <div className="col-span-1 flex flex-col justify-center h-full">
                      <div className="text-center sm:text-left">
                        <h2 className="text-lg font-bold uppercase mb-2 tracking-wider font-mono">BRADLEY TANGONAN</h2>
                        <p className="text-sm text-muted-foreground font-mono uppercase">DIRECTOR</p>
                        <button 
                          onClick={() => setShowDirectorBio(false)}
                          className="mt-6 brutal-button-accent text-sm"
                        >
                          VIEW WORK
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Show video player when not showing director bio */
                currentVideo && (
                  <div className="w-full flex items-center justify-center" style={{ height: '60vh', overflow: 'hidden' }}>
                    <VideoPlayer
                      video={currentVideo}
                      onEnded={handleNext}
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </div>
        
        {/* Project title and info */}
        <div className="w-full border-t-2 border-b-2 border-black py-3 px-4">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between">
            <div className="text-sm font-mono uppercase tracking-wider">
              DROPREEL | {reel.title?.toUpperCase()} | {currentIndex + 1}/{reel.videos.length}
            </div>
          </div>
        </div>
        
        {/* Video carousel at the bottom */}
        <div className="w-full max-w-screen-xl mx-auto px-4 py-4">
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-1">
              {/* Director bio card if available */}
              {reel.directorInfo && (
                <div 
                  className={`flex-shrink-0 w-28 border-2 border-black overflow-hidden relative ${showDirectorBio ? 'ring-2 ring-accent' : 'cursor-pointer hover:opacity-80'}`}
                  onClick={() => setShowDirectorBio(true)}
                >
                  {reel.directorInfo.image ? (
                    <img 
                      src={reel.directorInfo.image} 
                      alt="Director"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-background w-full aspect-video flex items-center justify-center text-center p-2">
                      <p className="text-xs font-mono uppercase">DIRECTOR BIO</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Video thumbnails */}
              {reel.videos.map((video, idx) => (
                <div 
                  key={video.id}
                  className={`flex-shrink-0 w-28 border-2 border-black overflow-hidden cursor-pointer hover:opacity-80 ${currentIndex === idx && !showDirectorBio ? 'ring-2 ring-accent' : ''}`}
                  onClick={() => selectVideo(idx)}
                >
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl}
                      alt={video.name}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="bg-background w-full aspect-video flex items-center justify-center">
                      <p className="text-xs text-center p-2 truncate font-mono">{video.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
