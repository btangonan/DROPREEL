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
 * Quick compatibility check based on Dropbox metadata
 * This runs immediately without network requests
 */
export function checkVideoCompatibilityFromMetadata(video: { name: string; mediaInfo?: any }): VideoCompatibilityResult {
  // Known incompatible formats that browsers typically can't play
  const incompatibleFormats = [
    'prores', 'apple_prores', 'prores_ks',
    'h265', 'hevc', 'x265',
    'av1', 'vp9',
    'cinepak', 'mjpeg'
  ];
  
  const filename = video.name.toLowerCase();
  
  // Check file extension for obvious incompatible formats
  if (filename.includes('.prores') || filename.includes('prores')) {
    return {
      isCompatible: false,
      error: 'ProRes format not supported in browsers'
    };
  }
  
  // Check Dropbox media info if available
  if (video.mediaInfo?.metadata?.video) {
    const videoMeta = video.mediaInfo.metadata.video;
    const codec = videoMeta.codec?.toLowerCase() || '';
    
    console.log('[VideoCompatibility] Checking metadata for:', video.name, { codec, videoMeta });
    
    // Check for known incompatible codecs
    if (incompatibleFormats.some(format => codec.includes(format))) {
      return {
        isCompatible: false,
        error: `${codec} codec not supported in browsers`
      };
    }
    
    // If we have dimensions, include them
    if (videoMeta.dimensions) {
      return {
        isCompatible: true,
        dimensions: {
          width: videoMeta.dimensions.width,
          height: videoMeta.dimensions.height
        }
      };
    }
  }
  
  // Default to compatible if we can't determine from metadata
  // This will be verified later with browser-based checking
  return {
    isCompatible: true,
    error: undefined
  };
}

/**
 * Check compatibility for all videos using metadata first, then async browser checking
 * Returns all videos with immediate compatibility information
 */
export async function checkAllVideosCompatibility(videos: Array<{ id: string; streamUrl: string; name: string; mediaInfo?: any; [key: string]: any }>) {
  // First pass: immediate metadata-based checking
  const quickResults = videos.map(video => {
    const metadataCheck = checkVideoCompatibilityFromMetadata(video);
    return {
      ...video,
      isCompatible: metadataCheck.isCompatible,
      compatibilityError: metadataCheck.error || null,
      dimensions: metadataCheck.dimensions || null,
      checkedWithBrowser: false // Flag to track checking method
    };
  });
  
  // Second pass: async browser-based verification for videos that passed metadata check
  const finalResults = await Promise.all(
    quickResults.map(async (video) => {
      // Skip browser check if already marked incompatible by metadata
      if (!video.isCompatible) {
        return video;
      }
      
      // Do browser-based check for final verification
      try {
        const browserCheck = await checkVideoCompatibility(video.streamUrl);
        return {
          ...video,
          isCompatible: browserCheck.isCompatible,
          compatibilityError: browserCheck.error || video.compatibilityError,
          dimensions: browserCheck.dimensions || video.dimensions,
          checkedWithBrowser: true
        };
      } catch (error) {
        // If browser check fails, keep the metadata result
        console.warn('[VideoCompatibility] Browser check failed for:', video.name, error);
        return video;
      }
    })
  );

  const compatibleCount = finalResults.filter(v => v.isCompatible).length;
  const incompatibleCount = finalResults.filter(v => !v.isCompatible).length;

  console.log('[VideoCompatibility] Results:', {
    total: finalResults.length,
    compatible: compatibleCount,
    incompatible: incompatibleCount,
    metadataChecked: finalResults.filter(v => !v.checkedWithBrowser).length,
    browserChecked: finalResults.filter(v => v.checkedWithBrowser).length
  });

  return { 
    videos: finalResults, 
    compatibleCount, 
    incompatibleCount 
  };
}