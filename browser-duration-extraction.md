# Browser-Based Video Duration Extraction Method

## Overview

This document describes the method for extracting accurate video durations using browser HTML5 video elements when videos are loaded into the YOUR VIDEOS panel. This approach was developed because Dropbox API metadata often doesn't contain duration information or returns `0:00` for video files.

## The Problem

- **Dropbox Metadata Limitation**: Dropbox API's `media_info` field often lacks duration data
- **Unreliable API Response**: Most videos return `{duration: '0:00', mediaInfo: {...}}` 
- **User Experience**: Videos showing "0:00" duration labels look broken
- **Background Processing Issues**: Previous attempts to fix durations in background were overwriting correct values

## The Solution: Browser-Based Duration Extraction

### Core Concept

Use the browser's native HTML5 video element to load video metadata and extract the actual duration without playing the video.

### Implementation Method

#### 1. Stream URL Acquisition
```typescript
// Get stream URL first
const streamResponse = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(video.path)}`);
const streamData = await streamResponse.json();
const streamUrl = streamData.streamUrl;
```

#### 2. Browser Video Element Creation
```typescript
// Extract duration using browser video element
const browserDuration = await new Promise<string>((resolve) => {
  const videoElement = document.createElement('video');
  videoElement.crossOrigin = 'anonymous';
  videoElement.preload = 'metadata';  // Only load metadata, not full video
  videoElement.muted = true;           // Ensure no audio playback
  
  let resolved = false;
  const resolveDuration = (dur: string) => {
    if (!resolved) {
      resolved = true;
      videoElement.remove(); // Clean up element
      resolve(dur);
    }
  };
```

#### 3. Event Listeners for Metadata
```typescript
  videoElement.addEventListener('loadedmetadata', () => {
    if (videoElement.duration && !isNaN(videoElement.duration) && videoElement.duration > 0) {
      const totalSeconds = Math.floor(videoElement.duration);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const durationStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      resolveDuration(durationStr);
    } else {
      resolveDuration('0:00');
    }
  });
  
  videoElement.addEventListener('error', (e) => {
    console.log('Browser duration extraction failed:', e);
    resolveDuration('0:00');
  });
```

#### 4. Timeout and Source Setting
```typescript
  // Timeout after 5 seconds
  setTimeout(() => {
    console.log('Browser duration extraction timeout after 5s');
    resolveDuration('0:00');
  }, 5000);
  
  videoElement.src = streamUrl; // This triggers metadata loading
});
```

### Complete Implementation Flow

#### For Individual Video Selection (page.tsx)
```typescript
// ALWAYS extract using browser for individual videos (more reliable than metadata)
try {
  // Get stream URL first
  const streamResponse = await fetch(`/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(item.path)}`);
  const streamData = await streamResponse.json();
  const streamUrl = streamData.streamUrl;
  
  if (streamUrl) {
    // Extract duration using browser video element
    const browserDuration = await new Promise<string>((resolve) => {
      const videoElement = document.createElement('video');
      videoElement.crossOrigin = 'anonymous';
      videoElement.preload = 'metadata';
      videoElement.muted = true;
      
      let resolved = false;
      const resolveDuration = (dur: string) => {
        if (!resolved) {
          resolved = true;
          videoElement.remove();
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
          resolveDuration('0:00');
        }
      });
      
      videoElement.addEventListener('error', (e) => {
        resolveDuration('0:00');
      });
      
      setTimeout(() => {
        resolveDuration('0:00');
      }, 5000);
      
      videoElement.src = streamUrl;
    });
    
    finalDuration = browserDuration;
  }
} catch (error) {
  console.error('Browser duration fetch error:', error);
}
```

#### For Folder Video Loading (useVideoManagement.ts)
```typescript
// Browser-based duration fetch using stream URL
const duration = await new Promise<string>((resolve) => {
  const videoElement = document.createElement('video');
  videoElement.crossOrigin = 'anonymous';
  videoElement.preload = 'metadata';
  videoElement.muted = true;
  
  let resolved = false;
  const resolveDuration = (dur: string) => {
    if (!resolved) {
      resolved = true;
      videoElement.remove(); // Clean up
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
      resolveDuration('0:00');
    }
  });
  
  videoElement.addEventListener('error', () => {
    resolveDuration('0:00');
  });
  
  // Timeout after 5 seconds
  setTimeout(() => {
    resolveDuration('0:00');
  }, 5000);
  
  videoElement.src = streamUrl;
});
```

## Key Technical Details

### Why This Works
1. **HTML5 Video Element**: Browser's native capability to read video metadata
2. **preload='metadata'**: Only loads video headers, not the entire file
3. **Cross-Origin Support**: `crossOrigin='anonymous'` allows Dropbox stream access
4. **Event-Driven**: Uses `loadedmetadata` event for accurate timing
5. **Memory Management**: Removes video element after use to prevent leaks

### Performance Considerations
- **Network Efficient**: Only downloads video metadata headers (~few KB)
- **Fast Extraction**: Typical metadata load time 100-500ms per video
- **Parallel Processing**: Can process multiple videos simultaneously
- **Timeout Protection**: 5-second timeout prevents hanging
- **Error Handling**: Graceful fallback to '0:00' on failures

### Browser Compatibility
- **Modern Browsers**: All modern browsers support HTML5 video metadata loading
- **Cross-Origin**: Works with Dropbox temporary URLs
- **Mobile Support**: Functions on mobile browsers with `muted` attribute

## Implementation Locations

### Files Modified
1. **`src/app/page.tsx`** - Individual video selection handler
2. **`src/hooks/useVideoManagement.ts`** - Folder video loading
3. **`src/types/index.ts`** - Added `needsDurationExtraction` flag

### Key Functions
- `handleVideoSelect()` - Processes individually selected videos
- `fetchVideos()` - Processes folder-loaded videos
- Browser duration extraction promise wrapper

## Debugging and Monitoring

### Console Logging
```typescript
console.log(`⏱️ [INDIVIDUAL DEBUG] Video ${index + 1}: ${item.name} - browser duration extracted:`, dur);
console.log(`⏱️ [FOLDER DEBUG] Video ${index + 1}: ${video.name} - browser duration extracted:`, dur);
```

### Performance Tracking
```typescript
const itemStart = performance.now();
// ... processing ...
const itemEnd = performance.now();
console.log(`Video processing completed in ${(itemEnd - itemStart).toFixed(2)}ms`);
```

## Known Issues and Solutions

### Issue: Background Processing Overwriting
- **Problem**: setTimeout background processes were resetting durations to '0:00'
- **Solution**: Disabled problematic background processing that overwrote good durations

### Issue: Slow Loading
- **Problem**: Browser extraction blocking UI updates
- **Solution**: Move to background processing or implement progressive enhancement

### Issue: CORS Errors
- **Problem**: Some Dropbox URLs may have CORS restrictions
- **Solution**: Use `crossOrigin='anonymous'` and handle errors gracefully

### Issue: Mobile Performance
- **Problem**: Mobile devices may struggle with multiple simultaneous extractions
- **Solution**: Process videos sequentially or in smaller batches

## Best Practices

1. **Always Clean Up**: Remove video elements after use to prevent memory leaks
2. **Handle Errors**: Graceful fallback to existing duration or '0:00'
3. **Use Timeouts**: Prevent indefinite hanging with reasonable timeouts
4. **Batch Processing**: Avoid overwhelming browser with too many simultaneous requests
5. **Progressive Enhancement**: Show videos immediately, enhance durations afterward

## Future Improvements

1. **Caching**: Cache extracted durations to avoid re-extraction
2. **Web Workers**: Move processing to web workers for better performance
3. **Retry Logic**: Implement retry mechanism for failed extractions
4. **User Feedback**: Show loading indicators during extraction
5. **Optimization**: Optimize for mobile devices and slower connections

This method provides reliable duration extraction while maintaining good user experience and browser performance.