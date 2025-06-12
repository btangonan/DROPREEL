/**
 * Video compatibility checking utilities
 * Checks if videos can be played in the browser before adding them to the UI
 */

export interface VideoCompatibilityResult {
  isCompatible: boolean;
  error?: string;
  dimensions?: { width: number; height: number };
}

/**
 * Fast compatibility check - just tests if first frames can be rendered
 * Much faster than full metadata loading
 */
export function checkVideoCompatibility(videoUrl: string): Promise<VideoCompatibilityResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.style.display = 'none';
    video.muted = true;
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';
    video.currentTime = 0;
    
    let hasResolved = false;
    let frameCheckCount = 0;
    
    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        // On timeout, assume compatible
        resolve({
          isCompatible: true,
          error: null
        });
      }
    }, 2000); // Much shorter timeout

    const cleanup = () => {
      clearTimeout(timeout);
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
    };

    const resolveResult = (result: VideoCompatibilityResult) => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        resolve(result);
      }
    };

    // Fast frame test - check if we can actually decode frames
    const testFrameRendering = () => {
      try {
        // Quick dimension check
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          resolveResult({
            isCompatible: false,
            error: 'No video content - file contains only audio'
          });
          return;
        }

        // Try to draw current frame to canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          // If no canvas support, assume compatible
          resolveResult({
            isCompatible: true,
            dimensions: { width: video.videoWidth, height: video.videoHeight }
          });
          return;
        }

        canvas.width = 16; // Very small for speed
        canvas.height = 16;
        
        ctx.drawImage(video, 0, 0, 16, 16);
        
        // If we got here without error, it's compatible
        resolveResult({
          isCompatible: true,
          dimensions: { width: video.videoWidth, height: video.videoHeight }
        });
        
      } catch (error) {
        console.log('[VideoCompatibility] Frame test failed:', error);
        resolveResult({
          isCompatible: false,
          error: 'Video codec not supported'
        });
      }
    };

    // When metadata is loaded, test frame rendering
    video.addEventListener('loadedmetadata', () => {
      console.log('[VideoCompatibility] Testing frame rendering for:', videoUrl);
      testFrameRendering();
    });

    // When first frame is loaded, also test
    video.addEventListener('loadeddata', () => {
      if (!hasResolved) {
        testFrameRendering();
      }
    });

    // Handle video errors - only fail on serious format issues
    video.addEventListener('error', (e) => {
      if (video.error) {
        switch (video.error.code) {
          case video.error.MEDIA_ERR_DECODE:
          case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            resolveResult({
              isCompatible: false,
              error: 'Video format not supported'
            });
            break;
          default:
            // For network/other errors, assume compatible
            resolveResult({
              isCompatible: true,
              error: null
            });
        }
      } else {
        // Unknown error, assume compatible
        resolveResult({
          isCompatible: true,
          error: null
        });
      }
    });

    // Start loading
    document.body.appendChild(video);
    video.src = videoUrl;
  });
}

/**
 * Check compatibility for all videos with concurrency limit for better performance
 * Returns all videos with compatibility information attached
 */
export async function checkAllVideosCompatibility(videos: Array<{ id: string; streamUrl: string; name: string; [key: string]: any }>) {
  // Process videos in batches to avoid overwhelming the browser
  const BATCH_SIZE = 3; // Check 3 videos at a time
  const results = [];
  
  for (let i = 0; i < videos.length; i += BATCH_SIZE) {
    const batch = videos.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(
      batch.map(async (video) => {
        try {
          const compatibility = await checkVideoCompatibility(video.streamUrl);
          return {
            ...video,
            isCompatible: compatibility.isCompatible,
            compatibilityError: compatibility.error || null,
            dimensions: compatibility.dimensions || null
          };
        } catch (error) {
          // If check fails, assume compatible to avoid false negatives
          console.warn('[VideoCompatibility] Check failed for', video.name, error);
          return {
            ...video,
            isCompatible: true,
            compatibilityError: null,
            dimensions: null
          };
        }
      })
    );
    
    results.push(...batchResults);
    
    // Small delay between batches to prevent browser overload
    if (i + BATCH_SIZE < videos.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const compatibleCount = results.filter(v => v.isCompatible).length;
  const incompatibleCount = results.filter(v => !v.isCompatible).length;

  return { 
    videos: results, 
    compatibleCount, 
    incompatibleCount 
  };
}