import { useEffect, useCallback } from 'react';
import { VideoFile } from '@/types';
import { enhanceVideosWithDurations } from '@/lib/utils/gracefulDurationExtraction';

/**
 * Hook for gracefully enhancing videos with durations after they're loaded
 * Works with existing video management without breaking functionality
 */
export const useDurationEnhancement = (
  videos: VideoFile[],
  updateVideos: (updater: (prev: VideoFile[]) => VideoFile[]) => void
) => {
  
  const enhanceDurations = useCallback(async (videosToEnhance: VideoFile[]) => {
    if (videosToEnhance.length === 0) return;

    console.log('🎬 [ENHANCEMENT] Starting duration enhancement for', videosToEnhance.length, 'videos');

    await enhanceVideosWithDurations(
      videosToEnhance,
      (videoPath: string, updates: { streamUrl?: string; duration?: string }) => {
        // Update the specific video in state
        updateVideos(prev => prev.map(v => 
          v.path === videoPath 
            ? { 
                ...v, 
                ...(updates.streamUrl && { streamUrl: updates.streamUrl }),
                ...(updates.duration && { duration: updates.duration })
              }
            : v
        ));
        
        console.log(`🎬 [ENHANCEMENT] Updated ${videoPath.split('/').pop()} with:`, updates);
      },
      {
        batchDelay: 50,       // 50ms between videos (much faster)
        startDelay: 100,      // 100ms delay before starting
        onProgress: (processed, total) => {
          console.log(`🎬 [ENHANCEMENT] Progress: ${processed}/${total} videos enhanced`);
        }
      }
    );
  }, [updateVideos]);

  // Auto-enhance videos when they're added (but only videos that truly need it)
  useEffect(() => {
    const videosNeedingEnhancement = videos.filter(v => {
      // Only enhance if duration is missing, empty, or exactly "0:00"
      const needsEnhancement = !v.duration || v.duration === '0:00' || v.duration.trim() === '';
      if (needsEnhancement) {
        console.log(`🎬 [ENHANCEMENT] Video ${v.name} needs enhancement - current duration: "${v.duration}"`);
      }
      return needsEnhancement;
    });

    if (videosNeedingEnhancement.length > 0) {
      console.log(`🎬 [ENHANCEMENT] Starting enhancement for ${videosNeedingEnhancement.length} videos`);
      // Quick start - minimal delay
      const timer = setTimeout(() => {
        enhanceDurations(videosNeedingEnhancement);
      }, 50);

      return () => clearTimeout(timer);
    } else {
      console.log('🎬 [ENHANCEMENT] No videos need enhancement');
    }
  }, [videos.length, videos, enhanceDurations]); // Run when videos change

  return {
    enhanceDurations,
    // Helper to manually trigger enhancement for specific videos
    enhanceSpecificVideos: enhanceDurations
  };
};