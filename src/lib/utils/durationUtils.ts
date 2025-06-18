/**
 * Duration extraction utilities
 * Handles duration extraction from multiple sources with fallbacks
 */

import { VideoFile } from '@/types';

/**
 * Format duration from seconds to MM:SS format
 */
export function formatDuration(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) {
    return '0:00';
  }
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Fast duration extraction for immediate UI display
 * Only checks the most common Dropbox duration field to avoid delays
 */
export function extractDropboxDurationFast(mediaInfo: any): string {
  if (!mediaInfo) return '0:00';
  
  // Only check the most common duration field for speed
  if (mediaInfo.duration && typeof mediaInfo.duration === 'number' && mediaInfo.duration > 0) {
    const durationSeconds = mediaInfo.duration / 1000;
    return formatDuration(durationSeconds);
  }
  
  return '0:00';
}

/**
 * Comprehensive duration extraction from Dropbox mediaInfo
 * Searches all possible locations - use for background processing only
 */
export function extractDropboxDuration(mediaInfo: any): string {
  if (!mediaInfo) {
    console.log('🟡 [DURATION] No mediaInfo provided');
    return '0:00';
  }

  try {
    // Check direct duration field (Dropbox provides this in milliseconds)
    if (mediaInfo.duration && typeof mediaInfo.duration === 'number' && mediaInfo.duration > 0) {
      const durationSeconds = mediaInfo.duration / 1000;
      const formatted = formatDuration(durationSeconds);
      console.log('✅ [DURATION] Found duration in mediaInfo.duration:', mediaInfo.duration, 'ms →', formatted);
      return formatted;
    }
    
    // Check nested metadata structures
    if (mediaInfo.metadata?.video?.duration && typeof mediaInfo.metadata.video.duration === 'number' && mediaInfo.metadata.video.duration > 0) {
      const durationSeconds = mediaInfo.metadata.video.duration / 1000;
      const formatted = formatDuration(durationSeconds);
      console.log('✅ [DURATION] Found duration in mediaInfo.metadata.video.duration:', mediaInfo.metadata.video.duration, 'ms →', formatted);
      return formatted;
    }
    
    // Check alternative nested structure
    if (mediaInfo.video?.duration && typeof mediaInfo.video.duration === 'number' && mediaInfo.video.duration > 0) {
      const durationSeconds = mediaInfo.video.duration / 1000;
      const formatted = formatDuration(durationSeconds);
      console.log('✅ [DURATION] Found duration in mediaInfo.video.duration:', mediaInfo.video.duration, 'ms →', formatted);
      return formatted;
    }
    
    // Check if it's in dimensions object
    if (mediaInfo.dimensions?.duration && typeof mediaInfo.dimensions.duration === 'number' && mediaInfo.dimensions.duration > 0) {
      const durationSeconds = mediaInfo.dimensions.duration / 1000;
      const formatted = formatDuration(durationSeconds);
      console.log('✅ [DURATION] Found duration in mediaInfo.dimensions.duration:', mediaInfo.dimensions.duration, 'ms →', formatted);
      return formatted;
    }
    
    // More thorough search through any nested objects
    const searchForDuration = (obj: any, path: string = ''): number | null => {
      if (!obj || typeof obj !== 'object') return null;
      
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if this key is 'duration' and has a valid number value
        if (key === 'duration' && typeof value === 'number' && value > 0) {
          console.log('🔍 [DURATION] Found duration at path:', currentPath, '=', value);
          return value;
        }
        
        // Recursively search nested objects (but limit depth to avoid infinite recursion)
        if (typeof value === 'object' && value !== null && path.split('.').length < 4) {
          const found = searchForDuration(value, currentPath);
          if (found) return found;
        }
      }
      return null;
    };
    
    const foundDuration = searchForDuration(mediaInfo);
    if (foundDuration) {
      const durationSeconds = foundDuration / 1000;
      const formatted = formatDuration(durationSeconds);
      console.log('✅ [DURATION] Found duration via deep search:', foundDuration, 'ms →', formatted);
      return formatted;
    }
    
    console.log('🟡 [DURATION] No duration found in Dropbox mediaInfo. Available keys:', Object.keys(mediaInfo));
    console.log('🟡 [DURATION] Full mediaInfo structure:', JSON.stringify(mediaInfo, null, 2));
  } catch (error) {
    console.warn('🟡 [DURATION] Error extracting duration from Dropbox metadata:', error);
  }
  
  return '0:00'; // Fallback - will be updated by browser extraction
}

/**
 * Extract duration from browser video element metadata
 * This is the most reliable method but requires network access
 */
export function extractBrowserDuration(videoUrl: string): Promise<string> {
  return new Promise((resolve) => {
    // Handle empty or invalid URLs
    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
      resolve('0:00');
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true; // Prevent audio during metadata loading
    
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('error', onError);
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      video.src = '';
      video.load();
    };
    
    const onLoadedMetadata = () => {
      const duration = video.duration;
      const fileName = videoUrl.split('/').pop() || 'unknown';
      
      console.log('🔍 [DURATION] Browser metadata loaded for', fileName, {
        duration: duration,
        isNaN: isNaN(duration),
        isFinite: isFinite(duration),
        isPositive: duration > 0,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });
      
      cleanup();
      
      if (isNaN(duration) || !isFinite(duration) || duration <= 0) {
        console.log('🟡 [DURATION] Browser metadata invalid for', fileName, '- duration:', duration);
        resolve('0:00');
        return;
      }
      
      const formattedDuration = formatDuration(duration);
      console.log('✅ [DURATION] Browser extracted duration:', formattedDuration, 'for', fileName);
      resolve(formattedDuration);
    };
    
    const onError = () => {
      console.log('🟡 [DURATION] Browser metadata extraction failed for:', videoUrl.split('/').pop());
      cleanup();
      resolve('0:00');
    };
    
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('error', onError);
    
    // Timeout after 3 seconds to avoid hanging
    setTimeout(() => {
      cleanup();
      resolve('0:00');
    }, 3000);
    
    // Add to DOM hidden to trigger loading
    video.style.display = 'none';
    document.body.appendChild(video);
    video.src = videoUrl;
  });
}

/**
 * Multi-source duration extraction with priority order:
 * 1. Existing valid duration (skip if already has non-zero duration)
 * 2. Dropbox mediaInfo (fastest, but sometimes missing)
 * 3. Browser metadata (slower but most reliable)
 */
export async function extractVideoDuration(video: VideoFile): Promise<string> {
  // Skip extraction if video already has valid duration
  if (video.duration && video.duration !== '0:00') {
    console.log('✅ [DURATION] Already has valid duration for:', video.name, '→', video.duration);
    return video.duration;
  }
  
  // First try Dropbox metadata (instant)
  if (video.mediaInfo) {
    const dropboxDuration = extractDropboxDuration(video.mediaInfo);
    if (dropboxDuration !== '0:00') {
      console.log('✅ [DURATION] Used Dropbox metadata for:', video.name, '→', dropboxDuration);
      return dropboxDuration;
    }
  }
  
  // Fallback to browser extraction if we have a stream URL
  if (video.streamUrl && video.streamUrl.trim() !== '') {
    console.log('🟡 [DURATION] Dropbox metadata unavailable, using browser extraction for:', video.name);
    return await extractBrowserDuration(video.streamUrl);
  }
  
  console.log('🟡 [DURATION] No metadata or stream URL available for:', video.name);
  return '0:00';
}

/**
 * Batch duration extraction for multiple videos
 * Uses parallel processing with rate limiting to avoid overwhelming the browser
 */
export async function extractMultipleDurations(videos: VideoFile[], batchSize: number = 5): Promise<VideoFile[]> {
  const videosNeedingDuration = videos.filter(v => !v.duration || v.duration === '0:00');
  const videosWithDuration = videos.filter(v => v.duration && v.duration !== '0:00');
  
  console.log(`🔍 [DURATION] Starting batch duration extraction:`);
  console.log(`  - ${videosWithDuration.length} videos already have duration`);
  console.log(`  - ${videosNeedingDuration.length} videos need duration extraction`);
  console.log(`  - Batch size: ${batchSize}`);
  
  if (videosNeedingDuration.length === 0) {
    console.log('✅ [DURATION] All videos already have duration data!');
    return videos;
  }
  
  const results: VideoFile[] = [...videosWithDuration]; // Keep videos that already have duration
  
  // Process only videos that need duration extraction in batches
  for (let i = 0; i < videosNeedingDuration.length; i += batchSize) {
    const batch = videosNeedingDuration.slice(i, i + batchSize);
    console.log(`🟡 [DURATION] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(videosNeedingDuration.length / batchSize)} (${batch.length} videos)`);
    
    const batchResults = await Promise.all(
      batch.map(async (video) => {
        const duration = await extractVideoDuration(video);
        return { ...video, duration };
      })
    );
    
    results.push(...batchResults);
    
    // Smaller delay between batches since this is background processing
    if (i + batchSize < videosNeedingDuration.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  const totalWithDuration = results.filter(v => v.duration && v.duration !== '0:00').length;
  const newlyExtracted = totalWithDuration - videosWithDuration.length;
  console.log(`✅ [DURATION] Batch extraction complete:`);
  console.log(`  - ${newlyExtracted} new durations extracted`);
  console.log(`  - ${totalWithDuration}/${videos.length} total videos have duration data`);
  
  return results;
}

/**
 * Debug utility to log all available mediaInfo fields
 */
export function debugMediaInfo(mediaInfo: any, videoName: string) {
  console.log('🔍 [DEBUG] MediaInfo structure for', videoName, ':', {
    hasMediaInfo: !!mediaInfo,
    topLevelKeys: mediaInfo ? Object.keys(mediaInfo) : [],
    duration: mediaInfo?.duration,
    metadata: mediaInfo?.metadata ? Object.keys(mediaInfo.metadata) : null,
    video: mediaInfo?.video ? Object.keys(mediaInfo.video) : null,
    dimensions: mediaInfo?.dimensions,
    fullStructure: JSON.stringify(mediaInfo, null, 2)
  });
}

/**
 * Test duration extraction for a single video (for debugging)
 */
export async function testDurationExtraction(video: VideoFile): Promise<void> {
  console.log('🧪 [TEST] Testing duration extraction for:', video.name);
  console.log('🧪 [TEST] Video has streamUrl:', !!video.streamUrl);
  console.log('🧪 [TEST] Video has mediaInfo:', !!video.mediaInfo);
  console.log('🧪 [TEST] Current duration:', video.duration);
  
  if (video.mediaInfo) {
    const dropboxResult = extractDropboxDuration(video.mediaInfo);
    console.log('🧪 [TEST] Dropbox extraction result:', dropboxResult);
  }
  
  if (video.streamUrl) {
    console.log('🧪 [TEST] Testing browser extraction...');
    const browserResult = await extractBrowserDuration(video.streamUrl);
    console.log('🧪 [TEST] Browser extraction result:', browserResult);
  }
  
  const finalResult = await extractVideoDuration(video);
  console.log('🧪 [TEST] Final duration result:', finalResult);
}