import { VideoReel, VideoFile, DirectorInfo } from '@/types';
import { nanoid } from 'nanoid';

// In-memory storage for serverless compatibility (Vercel)
// Note: This will reset on each deployment, but works for MVP testing
// In production, you'd use a proper database like PostgreSQL, MongoDB, etc.
let reelsStorage: VideoReel[] = [];

export function getAllReels(): VideoReel[] {
  return reelsStorage;
}

export function getReelById(id: string): VideoReel | null {
  return reelsStorage.find(reel => reel.id === id) || null;
}

export function createReel(videos: VideoFile[], title?: string, description?: string, directorInfo?: DirectorInfo, editState?: any): VideoReel {
  const newReel: VideoReel = {
    id: nanoid(10), // Shorter ID for friendlier URLs
    videos,
    title: title || 'Untitled Reel',
    description: description || '',
    directorInfo,
    editState, // Save the editState for round-trip editing
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  reelsStorage.push(newReel);
  
  return newReel;
}

export function updateReel(id: string, updates: Partial<VideoReel>): VideoReel | null {
  const index = reelsStorage.findIndex(reel => reel.id === id);
  
  if (index === -1) return null;
  
  // Don't allow updating id, createdAt
  const { id: _, createdAt: __, ...allowedUpdates } = updates;
  
  const updatedReel = {
    ...reelsStorage[index],
    ...allowedUpdates,
    updatedAt: new Date().toISOString()
  };
  
  reelsStorage[index] = updatedReel;
  
  return updatedReel;
}

export function deleteReel(id: string): boolean {
  const initialLength = reelsStorage.length;
  
  reelsStorage = reelsStorage.filter(reel => reel.id !== id);
  
  // Check if a reel was actually removed
  return reelsStorage.length < initialLength;
}
