import { VideoFile } from '@/types';

/**
 * Extracts video duration using browser HTML5 video element
 * @param streamUrl - Direct video stream URL
 * @returns Promise that resolves to duration string (e.g., "3:45") or null if failed
 */
export const extractDurationFromBrowser = async (streamUrl: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const videoElement = document.createElement('video');
    videoElement.crossOrigin = 'anonymous';
    videoElement.preload = 'metadata';
    videoElement.muted = true;
    
    let resolved = false;
    const resolveDuration = (duration: string | null) => {
      if (!resolved) {
        resolved = true;
        videoElement.remove();
        resolve(duration);
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
    
    videoElement.addEventListener('error', () => {
      resolveDuration(null);
    });
    
    // Timeout after 5 seconds
    setTimeout(() => {
      resolveDuration(null);
    }, 5000);
    
    videoElement.src = streamUrl;
  });
};

/**
 * Processes videos in background to extract durations without blocking UI
 * @param videos - Array of videos to process
 * @param updateCallback - Function called when a video's duration is extracted
 * @param batchDelay - Delay between processing videos (default 100ms)
 */
export const processVideoDurationsInBackground = async (
  videos: VideoFile[],
  updateCallback: (videoPath: string, duration: string) => void,
  batchDelay = 100
) => {
  console.log('🎬 [BACKGROUND DURATION] Starting processing for', videos.length, 'videos');
  
  for (const video of videos) {
    try {
      console.log(`🎬 [BACKGROUND DURATION] Processing ${video.name}...`);
      
      // Get stream URL if not available
      let streamUrl = video.streamUrl;
      if (!streamUrl || streamUrl.trim() === '') {
        try {
          const streamResponse = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(video.path)}`);
          const streamData = await streamResponse.json();
          streamUrl = streamData.streamUrl;
        } catch (error) {
          console.warn(`🎬 [BACKGROUND DURATION] Failed to get stream URL for ${video.name}:`, error);
          continue;
        }
      }
      
      if (streamUrl) {
        // Extract duration using browser
        const duration = await extractDurationFromBrowser(streamUrl);
        
        if (duration) {
          console.log(`🎬 [BACKGROUND DURATION] Extracted duration for ${video.name}: ${duration}`);
          updateCallback(video.path, duration);
        } else {
          console.log(`🎬 [BACKGROUND DURATION] Failed to extract duration for ${video.name}`);
        }
      }
      
      // Small delay between videos to avoid overwhelming the browser
      if (batchDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
      
    } catch (error) {
      console.error(`🎬 [BACKGROUND DURATION] Error processing ${video.name}:`, error);
    }
  }
  
  console.log('🎬 [BACKGROUND DURATION] Background processing complete');
};

/**
 * Starts background duration extraction for a list of videos
 * @param videos - Videos to process
 * @param setLoadedVideos - State setter for updating video list
 * @param delay - Initial delay before starting processing (default 500ms)
 */
export const startBackgroundDurationExtraction = (
  videos: VideoFile[],
  setLoadedVideos: React.Dispatch<React.SetStateAction<VideoFile[]>>,
  delay = 500
) => {
  // Filter videos that need duration extraction (no duration or have "0:00")
  const videosNeedingDuration = videos.filter(v => 
    !v.duration || v.duration === '0:00' || v.duration.trim() === ''
  );
  
  if (videosNeedingDuration.length === 0) {
    console.log('🎬 [BACKGROUND DURATION] No videos need duration extraction');
    return;
  }
  
  console.log(`🎬 [BACKGROUND DURATION] Scheduling extraction for ${videosNeedingDuration.length} videos in ${delay}ms`);
  
  setTimeout(() => {
    processVideoDurationsInBackground(
      videosNeedingDuration,
      (videoPath: string, duration: string) => {
        // Update the specific video's duration in state
        setLoadedVideos(prev => prev.map(v => 
          v.path === videoPath 
            ? { ...v, duration, needsDurationExtraction: false }
            : v
        ));
      }
    );
  }, delay);
};