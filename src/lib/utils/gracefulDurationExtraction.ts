import { VideoFile } from '@/types';

/**
 * Enhanced browser-based duration extraction with graceful error handling
 * @param streamUrl - Direct video stream URL
 * @returns Promise that resolves to duration string or null
 */
export const extractDurationFromBrowser = async (streamUrl: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const videoElement = document.createElement('video');
    videoElement.crossOrigin = 'anonymous';
    videoElement.preload = 'metadata';  // Only load metadata, not full video
    videoElement.muted = true;           // Ensure no audio playback
    
    let resolved = false;
    const resolveDuration = (dur: string | null) => {
      if (!resolved) {
        resolved = true;
        videoElement.remove(); // Clean up element
        resolve(dur);
      }
    };

    videoElement.addEventListener('loadedmetadata', () => {
      if (videoElement.duration && !isNaN(videoElement.duration) && videoElement.duration > 0) {
        const totalSeconds = Math.floor(videoElement.duration);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        resolveDuration(durationStr);
      } else {
        resolveDuration(null);
      }
    });
    
    videoElement.addEventListener('error', (e) => {
      console.log('🎬 [DURATION] Browser duration extraction failed:', e);
      resolveDuration(null);
    });

    // Timeout after 2 seconds for faster processing
    setTimeout(() => {
      console.log('🎬 [DURATION] Browser duration extraction timeout after 2s');
      resolveDuration(null);
    }, 2000);
    
    videoElement.src = streamUrl; // This triggers metadata loading
  });
};

/**
 * Enhanced duration extraction for a single video
 * Gets stream URL and extracts duration using browser
 */
export const extractVideoDetails = async (video: VideoFile): Promise<{ streamUrl?: string; duration?: string }> => {
  try {
    console.log(`🎬 [DURATION] Processing ${video.name}...`);
    
    // Get stream URL first
    const streamResponse = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(video.path)}`);
    const streamData = await streamResponse.json();
    const streamUrl = streamData.streamUrl;
    
    if (!streamUrl) {
      console.warn(`🎬 [DURATION] No stream URL for ${video.name}`);
      return {};
    }

    // Extract duration using browser
    const duration = await extractDurationFromBrowser(streamUrl);
    
    if (duration && duration !== '0:00') {
      console.log(`🎬 [DURATION] Extracted duration for ${video.name}: ${duration}`);
      return { streamUrl, duration };
    } else {
      console.log(`🎬 [DURATION] Could not extract duration for ${video.name}`);
      return { streamUrl };
    }
    
  } catch (error) {
    console.error(`🎬 [DURATION] Error processing ${video.name}:`, error);
    return {};
  }
};

/**
 * Enhanced background duration extraction for videos already in YOUR VIDEOS panel
 * Updates videos one by one with fade-in effect
 */
export const enhanceVideosWithDurations = async (
  videos: VideoFile[],
  updateVideoCallback: (videoPath: string, updates: { streamUrl?: string; duration?: string }) => void,
  options: {
    batchDelay?: number;
    startDelay?: number;
    onProgress?: (processed: number, total: number) => void;
  } = {}
) => {
  const { batchDelay = 50, startDelay = 100, onProgress } = options;
  
  // Filter videos that need enhancement (missing duration or have 0:00)
  const videosToEnhance = videos.filter(v => 
    !v.duration || v.duration === '0:00' || v.duration.trim() === ''
  );
  
  if (videosToEnhance.length === 0) {
    console.log('🎬 [DURATION] No videos need duration enhancement');
    return;
  }
  
  console.log(`🎬 [DURATION] Starting graceful enhancement for ${videosToEnhance.length} videos`);
  
  // Short delay to let UI settle
  if (startDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, startDelay));
  }
  
  let processed = 0;
  
  for (const video of videosToEnhance) {
    try {
      const details = await extractVideoDetails(video);
      
      if (details.duration || details.streamUrl) {
        // Update the video with extracted details
        updateVideoCallback(video.path, details);
      }
      
      processed++;
      onProgress?.(processed, videosToEnhance.length);
      
      // Small delay between videos to avoid overwhelming the browser
      if (batchDelay > 0 && processed < videosToEnhance.length) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
      
    } catch (error) {
      console.error(`🎬 [DURATION] Error enhancing ${video.name}:`, error);
      processed++;
      onProgress?.(processed, videosToEnhance.length);
    }
  }
  
  console.log('🎬 [DURATION] Background enhancement complete');
};