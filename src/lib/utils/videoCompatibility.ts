/**
 * Video compatibility checking utilities
 * Checks if videos can be played in the browser before adding them to the UI
 */

export interface VideoCompatibilityResult {
  isCompatible: boolean;
  error?: string;
  dimensions?: { width: number; height: number; duration?: number };
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
        console.log('⏰ [DEEP CHECK] Timeout reached for:', videoPath, '- assuming compatible (metadata load slow)');
        resolveResult({
          isCompatible: true,
          error: null
        });
      }
    }, 3000); // 3 second timeout - assume compatible if metadata takes too long

    const cleanup = () => {
      clearTimeout(timeout);
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
    };

    const resolveResult = (result: VideoCompatibilityResult) => {
      if (!hasResolved) {
        // If this is an incompatible result, resolve immediately
        if (!result.isCompatible) {
          console.log('🚫 [DEEP CHECK] Marking as incompatible and resolving:', videoPath, result.error);
          hasResolved = true;
          cleanup();
          resolve(result);
          return;
        }
        
        // This is a compatible result
        console.log('✅ [DEEP CHECK] Marking as compatible:', videoPath);
        hasResolved = true;
        cleanup();
        resolve(result);
      }
    };

    // Handle successful metadata loading
    video.addEventListener('loadedmetadata', () => {
      console.log('🔍 [COMPATIBILITY] Metadata loaded for', videoPath || 'unknown', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        duration: video.duration,
        durationFormatted: !isNaN(video.duration) ? `${Math.floor(video.duration / 60)}:${(Math.floor(video.duration % 60)).toString().padStart(2, '0')}` : 'N/A'
      });
      
      // Only check for the essential issue: no video dimensions (audio-only files)
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        console.log('🚫 [COMPATIBILITY] REJECTING - No video dimensions (audio-only file):', videoPath);
        resolveResult({
          isCompatible: false,
          error: 'Audio-only file - no video content'
        });
        return;
      }

      // If we have any video dimensions, consider it compatible
      console.log('✅ [COMPATIBILITY] Video has dimensions, marking compatible:', videoPath);
      resolveResult({
        isCompatible: true,
        dimensions: { 
          width: video.videoWidth, 
          height: video.videoHeight,
          duration: !isNaN(video.duration) ? video.duration : undefined
        }
      });
    });

    // We only need the loadedmetadata event for fast compatibility checking
    // If metadata loads with valid dimensions, it's compatible
    // If metadata loads with no dimensions, it's incompatible (audio-only)
    // If metadata fails to load, it's incompatible (format not supported)

    // Handle video errors - be less aggressive, only mark as incompatible for definitive format issues
    video.addEventListener('error', (e) => {
      console.log('[VideoCompatibility] Video error for', videoPath || 'unknown', {
        errorCode: video.error?.code,
        errorMessage: video.error?.message
      });

      if (video.error) {
        switch (video.error.code) {
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
            // For network errors, aborted loads, etc. - assume compatible (likely temporary issues)
            console.log('[VideoCompatibility] Non-format error - assuming compatible (likely network/temporary issue)');
            resolveResult({
              isCompatible: true,
              error: null
            });
            return;
        }
      }
      
      // If no specific error code, assume compatible
      console.log('[VideoCompatibility] Unknown error - assuming compatible');
      resolveResult({
        isCompatible: true,
        error: null
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
  
  // Only block definitely incompatible formats - be very conservative here
  // Audio files
  if (filename.endsWith('.m4a') || filename.endsWith('.mp3') || filename.endsWith('.wav') || 
      filename.endsWith('.aac') || filename.endsWith('.flac') || filename.endsWith('.ogg')) {
    return {
      isCompatible: false,
      error: 'Audio file - no video content'
    };
  }
  
  // ProRes (definitely not supported in browsers)
  if (filename.includes('prores') || filename.includes('pro_res') || filename.endsWith('.prores')) {
    return {
      isCompatible: false,
      error: 'ProRes format not supported in browsers'
    };
  }
  
  // Default to compatible - let browser testing determine actual compatibility
  // This includes common formats like .mp4, .mov, .avi, .mkv, etc.
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
export async function checkAllVideosCompatibility(
  videos: Array<{ id: string; streamUrl: string; name: string; mediaInfo?: any; [key: string]: any }>,
  onVideoChecked?: (video: any) => void
) {
  console.log('🔍 [COMPATIBILITY] Starting browser-only compatibility check for', videos.length, 'videos');
  
  // Skip metadata checking - do only accurate browser-based verification
  const finalResults = await Promise.all(
    videos.map(async (video) => {
      try {
        console.log('[VideoCompatibility] Running browser check for:', video.name);
        const browserCheck = await checkVideoCompatibility(video.streamUrl, video.path);
        console.log('[VideoCompatibility] Browser check result for', video.name, ':', browserCheck);
        
        const result = {
          ...video,
          isCompatible: browserCheck.isCompatible,
          compatibilityError: browserCheck.error,
          dimensions: browserCheck.dimensions,
          checkedWithBrowser: true
        };
        
        // Immediately notify caller of this video's result for instant UI update
        if (onVideoChecked) {
          console.log('🚀 [COMPATIBILITY] Immediately updating UI for:', video.name, result.isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE');
          onVideoChecked(result);
        }
        
        return result;
      } catch (error) {
        console.warn('[VideoCompatibility] Browser check failed for:', video.name, error);
        const result = {
          ...video,
          isCompatible: false,
          compatibilityError: 'Could not verify video compatibility',
          checkedWithBrowser: false
        };
        
        // Also notify for failed checks
        if (onVideoChecked) {
          console.log('🚀 [COMPATIBILITY] Immediately updating UI for failed check:', video.name);
          onVideoChecked(result);
        }
        
        return result;
      }
    })
  );

  const compatibleCount = finalResults.filter(v => v.isCompatible).length;
  const incompatibleCount = finalResults.filter(v => !v.isCompatible).length;
  
  console.log('🔍 [COMPATIBILITY] Final results:', { 
    total: videos.length, 
    compatible: compatibleCount, 
    incompatible: incompatibleCount 
  });
  
  // Log which videos are incompatible for debugging
  const incompatibleVideos = finalResults.filter(v => !v.isCompatible);
  if (incompatibleVideos.length > 0) {
    console.log('🚫 [COMPATIBILITY] Incompatible videos:', incompatibleVideos.map(v => ({ 
      name: v.name, 
      error: v.compatibilityError 
    })));
  }

  return { 
    videos: finalResults, 
    compatibleCount, 
    incompatibleCount 
  };
}