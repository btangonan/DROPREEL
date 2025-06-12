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
 * Check if a video URL is compatible with browser playback
 * This function creates a hidden video element to test compatibility
 */
export function checkVideoCompatibility(videoUrl: string): Promise<VideoCompatibilityResult> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.style.display = 'none';
    video.muted = true; // Prevent audio during testing
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';
    
    let hasResolved = false;
    const timeout = setTimeout(() => {
      if (!hasResolved) {
        hasResolved = true;
        cleanup();
        // On timeout, assume compatible rather than rejecting
        resolve({
          isCompatible: true,
          error: null
        });
      }
    }, 5000); // 5 second timeout, assume compatible on timeout

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

    // Handle successful metadata loading
    video.addEventListener('loadedmetadata', () => {
      console.log('[VideoCompatibility] Metadata loaded for:', videoUrl);
      console.log('[VideoCompatibility] Dimensions:', video.videoWidth, 'x', video.videoHeight);
      
      // Only reject if completely no video dimensions (true audio-only files)
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        resolveResult({
          isCompatible: false,
          error: 'No video content - file contains only audio'
        });
        return;
      }

      // If we have dimensions, assume it's compatible
      // Only do additional testing for obvious problem cases
      resolveResult({
        isCompatible: true,
        dimensions: { width: video.videoWidth, height: video.videoHeight }
      });
    });

    // Handle video errors
    video.addEventListener('error', (e) => {
      console.log('[VideoCompatibility] Video error:', video.error);
      let errorMessage = 'Video format not supported';
      
      if (video.error) {
        switch (video.error.code) {
          case video.error.MEDIA_ERR_DECODE:
            errorMessage = 'Video codec not supported';
            break;
          case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Video format not supported';
            break;
          case video.error.MEDIA_ERR_NETWORK:
            // Network errors don't mean the format is incompatible
            resolveResult({
              isCompatible: true,
              error: null
            });
            return;
          case video.error.MEDIA_ERR_ABORTED:
            // Aborted loads don't mean the format is incompatible
            resolveResult({
              isCompatible: true,
              error: null
            });
            return;
          default:
            errorMessage = 'Cannot load video';
        }
      }
      
      resolveResult({
        isCompatible: false,
        error: errorMessage
      });
    });

    // Start loading
    document.body.appendChild(video);
    video.src = videoUrl;
  });
}

/**
 * Check compatibility for all videos and mark them accordingly
 * Returns all videos with compatibility information attached
 */
export async function checkAllVideosCompatibility(videos: Array<{ id: string; streamUrl: string; name: string; [key: string]: any }>) {
  const results = await Promise.all(
    videos.map(async (video) => {
      const compatibility = await checkVideoCompatibility(video.streamUrl);
      return {
        ...video,
        isCompatible: compatibility.isCompatible,
        compatibilityError: compatibility.error || null,
        dimensions: compatibility.dimensions || null
      };
    })
  );

  const compatibleCount = results.filter(v => v.isCompatible).length;
  const incompatibleCount = results.filter(v => !v.isCompatible).length;

  return { 
    videos: results, 
    compatibleCount, 
    incompatibleCount 
  };
}