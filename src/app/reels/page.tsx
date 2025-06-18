'use client';

import { useState, useEffect } from 'react';
import { VideoReel } from '@/types';
import Link from 'next/link';
import { initializeTheme } from '@/lib/theme';

export default function ReelsPage() {
  const [reels, setReels] = useState<VideoReel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Initialize theme from localStorage on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/reels');
        if (!response.ok) {
          throw new Error('Failed to load reels');
        }
        const data = await response.json();
        setReels(data);
      } catch (err) {
        const error = err as Error;
        setError(`Error loading reels: ${error.message}`);
        console.error('Error fetching reels:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReels();
  }, []);

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="w-full max-w-screen-xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          {/* Logo placeholder - can be replaced with custom logo */}
          <div className="h-10 flex items-center">
            <span className="text-xl font-medium">DropReel</span>
          </div>
          <Link href="/" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
            Create New Reel
          </Link>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">My Reels</h2>

          {isLoading ? (
            <div className="flex justify-center my-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center my-12">{error}</div>
          ) : reels.length === 0 ? (
            <div className="text-center bg-white p-8 rounded-lg shadow my-8">
              <p className="text-gray-500 mb-4">You haven&apos;t created any reels yet.</p>
              <Link href="/" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
                Create Your First Reel
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reels.map((reel) => (
                <div key={reel.id} className="border rounded-lg overflow-hidden shadow-md bg-white">
                  {/* Thumbnail - first video in reel if available */}
                  <div className="h-40 bg-gray-200 relative">
                    {reel.videos.length > 0 && reel.videos[0].thumbnailUrl ? (
                      <img 
                        src={reel.videos[0].thumbnailUrl} 
                        alt={reel.title || 'Reel thumbnail'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {reel.videos.length} video{reel.videos.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-xl mb-1 truncate">{reel.title || 'Untitled Reel'}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Created {formatDate(reel.createdAt)}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex justify-between mt-2">
                      <Link href={`/r/${reel.id}`} className="inline-block bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-3 rounded text-sm">
                        View
                      </Link>
                      <div className="flex justify-center space-x-2">
                        <Link href={`/reels/edit/${reel.id}`} className="inline-block bg-blue-50 hover:bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm text-center">
                          Edit
                        </Link>
                        <button 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this reel? This action cannot be undone.')) {
                              // Call delete API endpoint
                              fetch(`/api/reels?id=${reel.id}`, {
                                method: 'DELETE'
                              })
                              .then(response => {
                                if (response.ok) {
                                  // Remove the deleted reel from state
                                  setReels(prevReels => prevReels.filter(r => r.id !== reel.id));
                                } else {
                                  throw new Error('Failed to delete reel');
                                }
                              })
                              .catch(err => {
                                console.error('Error deleting reel:', err);
                                alert('Failed to delete reel. Please try again.');
                              });
                            }
                          }} 
                          className="inline-block bg-red-50 hover:bg-red-100 text-red-700 py-1 px-3 rounded text-sm text-center"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
