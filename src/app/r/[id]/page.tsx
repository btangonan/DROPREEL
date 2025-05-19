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
    <div className="min-h-screen bg-white text-black">
      <div className="w-full max-w-screen-xl mx-auto">
        <div className="py-3 px-4 flex justify-between items-center border-b">
          <Link href="/reels" className="text-sm hover:underline">← Back to My Reels</Link>
          {/* Logo placeholder - can be replaced with custom logo */}
          <div className="h-10 flex items-center">
            <span className="text-xl font-medium">DropReel</span>
          </div>
          <Link 
            href={`/reels/edit/${reelId}`} 
            className="flex items-center text-sm bg-blue-500 hover:bg-blue-600 text-white px-4 py-1.5 rounded transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Reel
          </Link>
        </div>

        <div className="w-full">
          <div className="max-w-screen-xl mx-auto px-16 py-8">
            {/* Display director bio if available and showDirectorBio is true */}
            {reel.directorInfo && showDirectorBio ? (
              <div className="bg-gray-900 text-white py-8 mx-auto">
                <div className="grid grid-cols-2 gap-8 items-start">
                  {reel.directorInfo.image && (
                    <div className="col-span-1">
                      <img 
                        src={reel.directorInfo.image} 
                        alt="Director" 
                        className="w-full h-auto rounded-sm"
                      />
                    </div>
                  )}
                  <div className="col-span-1 flex flex-col justify-center h-full">
                    <div className="text-center sm:text-left">
                      <h2 className="text-lg font-bold uppercase mb-2 tracking-wider">Bradley Tangonan</h2>
                      <p className="text-sm text-gray-300">Director</p>
                      <button 
                        onClick={() => setShowDirectorBio(false)}
                        className="mt-6 border border-white hover:bg-white hover:text-black text-white py-1 px-4 text-sm transition duration-200"
                      >
                        View Work
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Show video player when not showing director bio */
              currentVideo && (
                <div className="relative bg-transparent">
                  {/* Left Arrow */}
                  <button
                    onClick={handlePrevious}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full z-20"
                    aria-label="Previous video"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Video Player */}
                  <div className="w-full max-w-5xl mx-auto bg-transparent rounded-lg overflow-hidden relative mb-4">
                    <VideoPlayer
                      video={currentVideo}
                      onEnded={handleNext}
                    />
                  </div>
                  
                  {/* Right Arrow */}
                  <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/40 hover:bg-black/70 text-white p-3 rounded-full z-20"
                    aria-label="Next video"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  
                  {/* Counter - Moved to bottom right */}
                  <div className="absolute bottom-5 right-5 bg-black/70 px-3 py-1 rounded-full text-white text-sm z-10">
                    {currentIndex + 1} / {reel.videos.length}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
        
        {/* Project title and info */}
        <div className="w-full border-t border-b py-3 px-4">
          <div className="max-w-screen-xl mx-auto flex items-center justify-between">
            <div className="text-sm">
              DropReel | {reel.title} | {currentIndex + 1}/{reel.videos.length}
            </div>
            {!showDirectorBio && (
              <button 
                onClick={() => setShowDirectorBio(true)}
                className="text-sm hover:underline"
              >
                Director Bio
              </button>
            )}
          </div>
        </div>
        
        {/* Video carousel at the bottom */}
        <div className="w-full max-w-screen-xl mx-auto px-4 py-4">
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-1">
              {/* Director bio card if available */}
              {reel.directorInfo && (
                <div 
                  className={`flex-shrink-0 w-28 border overflow-hidden relative ${showDirectorBio ? 'ring-1 ring-black' : 'cursor-pointer hover:opacity-80'}`}
                  onClick={() => setShowDirectorBio(true)}
                >
                  {reel.directorInfo.image ? (
                    <img 
                      src={reel.directorInfo.image} 
                      alt="Director"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-gray-200 w-full aspect-video flex items-center justify-center text-center p-2">
                      <p className="text-xs">Director Bio</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Video thumbnails */}
              {reel.videos.map((video, idx) => (
                <div 
                  key={video.id}
                  className={`flex-shrink-0 w-28 border overflow-hidden cursor-pointer hover:opacity-80 ${currentIndex === idx && !showDirectorBio ? 'ring-1 ring-black' : ''}`}
                  onClick={() => selectVideo(idx)}
                >
                  {video.thumbnailUrl ? (
                    <img 
                      src={video.thumbnailUrl}
                      alt={video.name}
                      className="w-full aspect-video object-cover"
                    />
                  ) : (
                    <div className="bg-gray-200 w-full aspect-video flex items-center justify-center">
                      <p className="text-xs text-center p-2 truncate">{video.name}</p>
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
