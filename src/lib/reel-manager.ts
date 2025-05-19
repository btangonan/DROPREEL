import { VideoReel, VideoFile, DirectorInfo } from '@/types';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

// In a production app, we would use a proper database
// For MVP, we'll use a JSON file to store reels
const DATA_DIR = path.join(process.cwd(), 'data');
const REELS_FILE = path.join(DATA_DIR, 'reels.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize reels file if it doesn't exist
if (!fs.existsSync(REELS_FILE)) {
  fs.writeFileSync(REELS_FILE, JSON.stringify([], null, 2));
}

export function getAllReels(): VideoReel[] {
  try {
    const data = fs.readFileSync(REELS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading reels:', error);
    return [];
  }
}

export function getReelById(id: string): VideoReel | null {
  const reels = getAllReels();
  return reels.find(reel => reel.id === id) || null;
}

export function createReel(videos: VideoFile[], title?: string, description?: string, directorInfo?: DirectorInfo): VideoReel {
  const reels = getAllReels();
  
  const newReel: VideoReel = {
    id: nanoid(10), // Shorter ID for friendlier URLs
    videos,
    title: title || 'Untitled Reel',
    description: description || '',
    directorInfo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  reels.push(newReel);
  saveReels(reels);
  
  return newReel;
}

export function updateReel(id: string, updates: Partial<VideoReel>): VideoReel | null {
  const reels = getAllReels();
  const index = reels.findIndex(reel => reel.id === id);
  
  if (index === -1) return null;
  
  // Don't allow updating id, createdAt
  const { id: _, createdAt: __, ...allowedUpdates } = updates;
  
  const updatedReel = {
    ...reels[index],
    ...allowedUpdates,
    updatedAt: new Date().toISOString()
  };
  
  reels[index] = updatedReel;
  saveReels(reels);
  
  return updatedReel;
}

function saveReels(reels: VideoReel[]): void {
  try {
    fs.writeFileSync(REELS_FILE, JSON.stringify(reels, null, 2));
  } catch (error) {
    console.error('Error saving reels:', error);
  }
}

export function deleteReel(id: string): boolean {
  const reels = getAllReels();
  const initialLength = reels.length;
  
  const filteredReels = reels.filter(reel => reel.id !== id);
  
  // Check if a reel was actually removed
  if (filteredReels.length === initialLength) {
    return false; // No reel was deleted
  }
  
  // Save the updated reels list
  saveReels(filteredReels);
  return true;
}
