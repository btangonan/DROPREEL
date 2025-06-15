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
export function checkVideoCompatibility(videoUrl: string, videoPath?: string): Promise<VideoCompatibilityResult> {
  return new Promise(async (resolve) => {
    // Check if videoUrl is valid
    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
      console.warn('[VideoCompatibility] Invalid or empty video URL provided for:', videoPath || 'unknown video');
      
      // If we have a videoPath, try to get a fresh URL
      if (videoPath) {
        try {
          const response = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(videoPath)}`);
          if (response.ok) {
            const data = await response.json();
            if (data.streamUrl || data.url) {
              // Got a fresh URL, proceed with compatibility check
              videoUrl = data.streamUrl || data.url;
            } else {
              resolve({
                isCompatible: false,
                error: 'Could not get video stream URL'
              });
              return;
            }
          } else {
            resolve({
              isCompatible: false,
              error: 'Could not access video'
            });
            return;
          }
        } catch (error) {
          console.error('[VideoCompatibility] Failed to get fresh URL for:', videoPath, error);
          resolve({
            isCompatible: false,
            error: 'Could not access video'
          });
          return;
        }
      } else {
        resolve({
          isCompatible: false,
          error: 'Invalid video URL'
        });
        return;
      }
    }

    // If we have a videoPath, try to get a fresh URL in case the current one is expired
    let urlToTest = videoUrl;
    if (videoPath && videoUrl.includes('dropbox')) {
      try {
        const response = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(videoPath)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.streamUrl || data.url) {
            urlToTest = data.streamUrl || data.url;
          }
        }
      } catch (error) {
        console.warn('[VideoCompatibility] Could not refresh URL for', videoPath, 'using original URL');
      }
    }

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
    }, 3000); // Faster timeout - 3 seconds for quicker results

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
      console.log('[VideoCompatibility] Metadata loaded for', videoPath || 'unknown', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        duration: video.duration
      });
      
      // Reject if no video dimensions (audio-only files)
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('[VideoCompatibility] Rejecting audio-only file:', videoPath);
        resolveResult({
          isCompatible: false,
          error: 'Audio-only file - no video content'
        });
        return;
      }

      // Reject if unreasonable dimensions (likely corrupted or invalid)
      if (video.videoWidth < 16 || video.videoHeight < 16 || 
          video.videoWidth > 8192 || video.videoHeight > 8192) {
        console.log('[VideoCompatibility] Rejecting file with invalid dimensions:', videoPath);
        resolveResult({
          isCompatible: false,
          error: 'Invalid video dimensions'
        });
        return;
      }

      // For speed, just validate dimensions - skip frame rendering test
      // The metadata loading itself proves the file is readable
      resolveResult({
        isCompatible: true,
        dimensions: { width: video.videoWidth, height: video.videoHeight }
      });
    });

    // Handle successful seek - means we can render frames
    video.addEventListener('seeked', () => {
      console.log('[VideoCompatibility] Successfully seeked, video can render frames');
      resolveResult({
        isCompatible: true,
        dimensions: { width: video.videoWidth, height: video.videoHeight }
      });
    });

    // Handle when video can start playing (first frame ready)
    video.addEventListener('canplay', () => {
      console.log('[VideoCompatibility] Video can play, marking as compatible');
      // If we haven't resolved yet and video can play, it's compatible
      if (!hasResolved) {
        resolveResult({
          isCompatible: true,
          dimensions: { width: video.videoWidth, height: video.videoHeight }
        });
      }
    });

    // Handle video errors
    video.addEventListener('error', (e) => {
      console.log('[VideoCompatibility] Video error for', videoPath || 'unknown', {
        errorCode: video.error?.code,
        errorMessage: video.error?.message,
        urlWasRefreshed: urlToTest !== videoUrl
      });

      if (video.error) {
        switch (video.error.code) {
          case video.error.MEDIA_ERR_NETWORK:
            // Network errors could be expired URLs, but let's be more careful
            console.log('[VideoCompatibility] Network error - checking if URL was refreshed');
            if (urlToTest !== videoUrl) {
              // We already tried with a fresh URL and still got network error
              console.log('[VideoCompatibility] Network error even with fresh URL - marking incompatible');
              resolveResult({
                isCompatible: false,
                error: 'Cannot access video file'
              });
            } else {
              // Original URL failed, might be expired - assume compatible
              console.log('[VideoCompatibility] Network error with original URL - assuming compatible (likely expired URL)');
              resolveResult({
                isCompatible: true,
                error: null
              });
            }
            return;
          case video.error.MEDIA_ERR_ABORTED:
            // Aborted loads don't mean the format is incompatible
            console.log('[VideoCompatibility] Load aborted - assuming compatible');
            resolveResult({
              isCompatible: true,
              error: null
            });
            return;
          case video.error.MEDIA_ERR_DECODE:
            console.log('[VideoCompatibility] Decode error - marking incompatible');
            resolveResult({
              isCompatible: false,
              error: 'Video codec not supported by browser'
            });
            return;
          case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            console.log('[VideoCompatibility] Source not supported - marking incompatible');
            resolveResult({
              isCompatible: false,
              error: 'Video format not supported by browser'
            });
            return;
          default:
            console.log('[VideoCompatibility] Unknown error code:', video.error.code, '- marking incompatible to be safe');
            resolveResult({
              isCompatible: false,
              error: 'Video cannot be played'
            });
            return;
        }
      }
      
      // If no specific error code, mark as incompatible
      console.log('[VideoCompatibility] Error with no error code - marking incompatible');
      resolveResult({
        isCompatible: false,
        error: 'Video cannot be played'
      });
    });

    // Start loading
    document.body.appendChild(video);
    video.src = urlToTest;
  });
}

/**
 * Instant compatibility check for drag & drop operations
 * Uses filename and basic heuristics for immediate results
 */
export function checkVideoCompatibilityInstant(video: { name: string; mediaInfo?: any }): VideoCompatibilityResult {
  const filename = video.name.toLowerCase();
  
  // Quick file extension check
  const incompatibleExtensions = ['.prores', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4a', '.mp3', '.wav', '.aac'];
  const hasIncompatibleExt = incompatibleExtensions.some(ext => filename.endsWith(ext));
  
  if (hasIncompatibleExt) {
    return {
      isCompatible: false,
      error: 'File format likely incompatible with browsers'
    };
  }
  
  // Check for ProRes in filename
  if (filename.includes('prores') || filename.includes('pro_res')) {
    return {
      isCompatible: false,
      error: 'ProRes format not supported in browsers'
    };
  }
  
  // Default to compatible for common formats
  return {
    isCompatible: true,
    error: undefined
  };
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
  console.log('[VideoCompatibility] Starting compatibility check for', videos.length, 'videos');
  
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
  
  console.log('[VideoCompatibility] Metadata check complete. Starting browser verification...');
  
  // Second pass: async browser-based verification for videos that passed metadata check
  const finalResults = await Promise.all(
    quickResults.map(async (video) => {
      // Skip browser check if already marked incompatible by metadata
      if (!video.isCompatible) {
        console.log('[VideoCompatibility] Skipping browser check for', video.name, '- already marked incompatible by metadata');
        return video;
      }
      
      // Do browser-based check for final verification
      try {
        console.log('[VideoCompatibility] Running browser check for:', video.name);
        const browserCheck = await checkVideoCompatibility(video.streamUrl, video.path);
        console.log('[VideoCompatibility] Browser check result for', video.name, ':', browserCheck);
        
        return {
          ...video,
          isCompatible: browserCheck.isCompatible,
          compatibilityError: browserCheck.error || video.compatibilityError,
          dimensions: browserCheck.dimensions || video.dimensions,
          checkedWithBrowser: true
        };
      } catch (error) {
        // If browser check fails completely, assume incompatible to be safe
        console.warn('[VideoCompatibility] Browser check failed for:', video.name, error);
        return {
          ...video,
          isCompatible: false,
          compatibilityError: 'Could not verify video compatibility',
          checkedWithBrowser: false
        };
      }
    })
  );

  const compatibleCount = finalResults.filter(v => v.isCompatible).length;
  const incompatibleCount = finalResults.filter(v => !v.isCompatible).length;
  
  console.log('[VideoCompatibility] Final results:', { 
    total: videos.length, 
    compatible: compatibleCount, 
    incompatible: incompatibleCount 
  });

  return { 
    videos: finalResults, 
    compatibleCount, 
    incompatibleCount 
  };
}