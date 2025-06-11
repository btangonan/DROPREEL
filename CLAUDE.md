# DropReel MVP - Claude Context Guide

## What the App Does

DropReel is a video reel creation application that integrates with Dropbox to help users create video presentations. Users can:

1. **Connect to Dropbox** - Authenticate with their Dropbox account
2. **Browse and Select Videos** - Navigate Dropbox folders and select video files
3. **Organize Videos** - Drag and drop videos between "YOUR VIDEOS" and "SELECTS" panels
4. **Preview Videos** - Watch videos in a full-screen modal player with controls
5. **Create Reels** - Combine selected videos into presentation reels (planned feature)

## Design Philosophy

- **Brutalist Design**: Bold, high-contrast colors (neon yellow, electric blue, pure black/white)
- **Tactile Interactions**: Videos feel like physical objects you can pick up and move
- **Responsive**: Works on desktop, tablet, and mobile devices
- **Visual Feedback**: Rich animations and hover effects throughout

## Architecture Overview

### Tech Stack
- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Framer Motion** for animations
- **Tailwind CSS** + custom CSS for styling
- **Dropbox API** for file integration
- **Lucide React** for icons

### Key Files Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/dropbox/         # Dropbox authentication
│   │   └── dropbox/              # Dropbox file operations
│   ├── globals.css               # Main CSS with brutalist design
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page (redirect to reel maker)
├── components/
│   ├── BrutalistReelMaker.tsx    # MAIN COMPONENT - core app logic
│   ├── VideoPreviewModal.tsx     # Video player modal
│   ├── FolderBrowser/            # Dropbox folder navigation
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── auth/                     # Authentication utilities
│   ├── dropbox/                  # Dropbox API client
│   └── storage/                  # Data management
└── types/                        # TypeScript type definitions
```

## Core Components Deep Dive

### BrutalistReelMaker.tsx (Main Component)

**State Management:**
- `isConnected` - Dropbox authentication status
- `videos` - Array of videos in "YOUR VIDEOS" panel
- `selectedVideos` - Array of videos in "SELECTS" panel  
- `draggedVideo` - Currently dragged video object
- `isDraggingVideo` - ID of video being dragged (for visual feedback)
- `dragPosition` - Mouse coordinates during drag
- `dragDirection` - 'clockwise' or 'counterclockwise' rotation

**Key Functions:**
- `handleDragStart()` - Initiates drag with custom drag image and mouse tracking
- `handleDrop()` - Moves videos between panels with unique selection IDs
- `handleRemoveDrop()` - Moves videos back from SELECTS to YOUR VIDEOS
- `openVideoPreview()` - Opens modal and fetches streaming URLs if needed
- `loadVideosFromDropbox()` - Fetches videos from selected Dropbox folder

**Drag & Drop Logic:**
- Videos get unique `selectionId` when moved to SELECTS panel
- Original videos are removed from source panel (move, not copy)
- Floating drag preview follows mouse cursor with rotation animation
- Direction-aware rotation: clockwise when moving forward, counterclockwise when moving back

### VideoPreviewModal.tsx

**Features:**
- Dynamic aspect ratio detection from video metadata or thumbnails
- Responsive modal sizing with device-specific constraints
- Custom video player controls (play/pause, seek, volume, restart)
- Loading states with thumbnail previews
- Keyboard shortcuts (Esc to close)

**Aspect Ratio Logic:**
```typescript
// Tries video metadata first, falls back to thumbnail image dimensions
const aspectRatio = video.videoWidth / video.videoHeight;
// Modal dimensions calculated to maintain video aspect ratio + controls space
```

## Styling System

### CSS Architecture
Located in `src/app/globals.css`:

**Color Variables:**
```css
:root {
  --neon-yellow: #ffff00;
  --electric-blue: #0066ff;
  --fluorescent-green: #00ff00;
  --hot-pink: #ff0066;
  --pure-black: #000000;
  --pure-white: #ffffff;
  --brutal-gray: #666666;
}
```

**Key Classes:**
- `.brutalist-header` - Top navigation bar
- `.control-button` - Action buttons with hover effects
- `.video-section` - Panel containers for videos
- `.video-thumbnail` - Individual video item styling
- `.video-grid` - Responsive grid layout

**Responsive Breakpoints:**
- Desktop: Default styles
- Tablet: `@media (max-width: 1024px)`
- Mobile: `@media (max-width: 768px)`

### Grid System
```css
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}
```
- `auto-fit` makes thumbnails expand to fill available space
- `minmax(200px, 1fr)` sets minimum size but allows growth
- Different breakpoints use different minimum sizes

## Animation System

### Framer Motion Patterns

**Layout Animations:**
```typescript
<motion.div
  layout
  transition={{
    layout: {
      type: "tween",
      ease: [0.25, 0.46, 0.45, 0.94],
      duration: 0.4
    }
  }}
>
```
- Uses tween animations to avoid spring recoil effects
- Custom ease curve for smooth row transitions

**Drag Visual Feedback:**
- Original thumbnail opacity goes to 0 during drag
- Floating preview follows cursor with `requestAnimationFrame`
- Rotation indicates direction: +8° clockwise, -8° counterclockwise

**Hover Effects:**
- Scale transformations on hover: `whileHover={{ scale: 1.02 }}`
- Color transitions via CSS for performance
- Staggered animations on initial load

## API Integration

### Dropbox Authentication Flow
1. User clicks CONNECT button
2. Redirects to `/api/auth/dropbox`
3. Dropbox OAuth flow completes
4. Callback handled at `/api/auth/dropbox/callback`
5. Access tokens stored and status updated

### File Operations
- **List Videos**: `GET /api/dropbox?action=listVideos&folderPath={path}`
- **Get Stream URL**: `GET /api/dropbox?action=getStreamUrl&path={path}`
- **Get Thumbnails**: `GET /api/dropbox/thumbnail?path={path}`

### Authentication Check
- `GET /api/auth/dropbox/status` - Returns `{isAuthenticated: boolean}`
- Called on component mount to restore login state

## Development Workflow

### Adding New Features

1. **State Management**: Add new state variables to BrutalistReelMaker.tsx
2. **UI Components**: Create new components in `/components` directory
3. **Styling**: Add CSS classes in `globals.css` following brutalist design patterns
4. **Animation**: Use Framer Motion with consistent transition patterns
5. **API**: Add new routes in `/app/api` if backend functionality needed

### Modifying Existing Features

**Drag & Drop:**
- Modify `handleDragStart`, `handleDrop`, `handleRemoveDrop` functions
- Update drag visual feedback in floating preview animation
- Adjust grid layout animations in transition configs

**Video Player:**
- Edit VideoPreviewModal.tsx for player controls
- Modify aspect ratio calculation logic for different video formats
- Update modal sizing constraints for better responsiveness

**Styling Changes:**
- Update CSS variables in `:root` for color scheme changes
- Modify `.video-grid` for different layout behaviors
- Adjust responsive breakpoints for device-specific experiences

### Common Patterns

**Adding a New Button:**
```typescript
<button className="control-button [modifier-class]" onClick={handleFunction}>
  <Icon className="inline mr-2 w-4 h-4" />
  BUTTON TEXT
</button>
```

**Adding a New Animation:**
```typescript
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.15, delay: index * 0.02 }}
  layout
>
```

**Adding a New Panel:**
```typescript
<motion.div className="video-section [color-class]">
  <h2 className="section-title">PANEL NAME</h2>
  <div className="video-grid">
    {/* video thumbnails */}
  </div>
</motion.div>
```

## Debugging Tips

### Common Issues

**Drag & Drop Not Working:**
- Check if `draggedVideo` state is being set correctly
- Verify `selectionId` generation for moved videos
- Ensure `handleDragEnd` cleanup is being called

**Animations Too Aggressive:**
- Reduce `stiffness` values in spring animations
- Increase `damping` to reduce oscillation
- Switch to tween animations for more control

**Modal Sizing Issues:**
- Check aspect ratio calculation in `getModalSize()`
- Verify video metadata is loading correctly
- Adjust constraints for different screen sizes

**Responsive Layout Problems:**
- Test grid behavior at different breakpoints
- Check `minmax` values in CSS grid definitions
- Verify thumbnail sizing on mobile devices

### Performance Optimization

**Animation Performance:**
- Use `willChange: 'transform'` for frequently animated elements
- Prefer CSS transitions for simple hover effects
- Use `requestAnimationFrame` for smooth cursor tracking

**Image Loading:**
- Implement lazy loading for video thumbnails
- Add fallback images for failed loads
- Optimize thumbnail sizes for faster rendering

## Implementation Plan: Add Videos from Additional Folders

### Feature Overview
Allow users to add videos from multiple Dropbox folders to the "YOUR VIDEOS" panel, rather than replacing the current videos each time a new folder is selected. This enables building a collection of videos from different locations.

### UI/UX Changes Required

**1. Button Modification**
- Change "ADD VIDEOS" button behavior from "replace" to "add more"
- Add visual indicator when videos are being added vs. initial load
- Consider adding a "CLEAR ALL" button for starting fresh

**2. Visual Feedback**
- Show folder path indicators for videos from different sources
- Add loading states that don't disrupt existing videos
- Highlight newly added videos briefly after loading

**3. Folder Management**
- Display breadcrumb or indicator showing source folder for each video
- Option to group/filter videos by source folder
- Prevent duplicate videos from same path

### Technical Implementation

**State Management Changes (BrutalistReelMaker.tsx):**

```typescript
// Add new state for tracking video sources and loading
const [videoSources, setVideoSources] = useState<Map<string, string>>(new Map()); // videoId -> folderPath
const [isAddingVideos, setIsAddingVideos] = useState(false); // distinguish from initial load
const [loadedFolders, setLoadedFolders] = useState<Set<string>>(new Set()); // track loaded folders

// Modify existing state
const [currentFolderPath, setCurrentFolderPath] = useState<string>(''); // becomes lastSelectedPath
```

**Modified Functions:**

```typescript
// Update handleAddVideos to indicate "add more" mode
const handleAddVideos = () => {
  if (!isConnected) {
    alert('Please connect to Dropbox first');
    return;
  }
  console.log('Opening folder browser to add more videos');
  setIsAddingVideos(true); // Set flag for "add mode"
  setShowFolderBrowser(true);
};

// Modify loadVideosFromDropbox to append instead of replace
const loadVideosFromDropbox = async (folderPath: string, appendMode = false) => {
  setIsLoadingVideos(true);
  try {
    // ... existing API call logic ...
    
    const dropboxVideos: Video[] = data.videos.map((video: any) => ({
      id: video.id,
      title: video.name.replace(/\.[^/.]+$/, '').toUpperCase(),
      thumbnail: video.thumbnailUrl || '/placeholder-video.jpg',
      duration: '0:00',
      videoUrl: '',
      path: video.path,
      size: video.size,
      sourceFolder: folderPath // Add source folder tracking
    }));

    if (appendMode) {
      // Filter out duplicates based on video ID
      const existingIds = new Set(videos.map(v => v.id));
      const newVideos = dropboxVideos.filter(v => !existingIds.has(v.id));
      
      // Append new videos to existing collection
      setVideos(prevVideos => [...prevVideos, ...newVideos]);
      
      // Update source tracking
      const newSources = new Map(videoSources);
      newVideos.forEach(video => {
        newSources.set(video.id, folderPath);
      });
      setVideoSources(newSources);
      
      // Track loaded folders
      setLoadedFolders(prev => new Set([...prev, folderPath]));
    } else {
      // Replace mode (initial load)
      setVideos(dropboxVideos);
      setVideoSources(new Map(dropboxVideos.map(v => [v.id, folderPath])));
      setLoadedFolders(new Set([folderPath]));
    }
    
    setCurrentFolderPath(folderPath);
  } catch (error) {
    console.error('Error loading videos:', error);
    alert('Failed to load videos from Dropbox');
  } finally {
    setIsLoadingVideos(false);
    setIsAddingVideos(false);
  }
};

// Update handleFolderSelect to use append mode when appropriate
const handleFolderSelect = (folderPath: string) => {
  console.log('Selected folder:', folderPath);
  setShowFolderBrowser(false);
  
  // Check if this is additional folder selection
  const appendMode = videos.length > 0 && isAddingVideos;
  loadVideosFromDropbox(folderPath, appendMode);
};
```

**UI Updates:**

```typescript
// Update button text and styling
<button 
  className="control-button add-videos"
  onClick={handleAddVideos}
  disabled={isLoadingVideos}
>
  <Upload className="inline mr-2 w-4 h-4" />
  {videos.length === 0 ? 'ADD VIDEOS' : 'ADD MORE VIDEOS'}
</button>

// Add clear button when videos exist
{videos.length > 0 && (
  <button 
    className="control-button clear-videos"
    onClick={handleClearVideos}
  >
    <X className="inline mr-2 w-4 h-4" />
    CLEAR ALL
  </button>
)}

// Add folder indicator to video thumbnails
<div className="video-folder-indicator">
  {videoSources.get(video.id)?.split('/').pop() || 'Unknown'}
</div>
```

**CSS Additions (globals.css):**

```css
/* Folder indicator styling */
.video-folder-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--hot-pink);
  color: var(--pure-white);
  padding: 2px 6px;
  font-size: 0.5rem;
  font-weight: 900;
  text-transform: uppercase;
  border: 1px solid var(--pure-black);
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Clear button styling */
.control-button.clear-videos {
  background: var(--hot-pink);
  color: var(--pure-white);
  border-color: var(--pure-black);
}

.control-button.clear-videos:hover {
  background: var(--pure-white);
  color: var(--hot-pink);
  box-shadow: 4px 4px 0 var(--pure-black);
}

/* Loading state for adding videos */
.control-button.add-videos.adding {
  background: var(--fluorescent-green);
  color: var(--pure-black);
}
```

### Data Structure Updates

**Enhanced Video Interface:**

```typescript
interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  videoUrl?: string;
  path?: string;
  size?: number;
  selectionId?: string;
  sourceFolder?: string; // NEW: Track source folder
  addedAt?: Date; // NEW: Track when video was added
}
```

### Error Handling & Edge Cases

**Duplicate Prevention:**
- Check video IDs before adding to prevent duplicates
- Option to allow same video from different folders (different IDs)
- Handle videos that may have been moved/deleted between sessions

**Memory Management:**
- Consider pagination for large video collections
- Implement virtual scrolling if performance becomes an issue
- Add limits on total number of videos

**State Persistence:**
- Consider saving video collection to localStorage
- Restore video sources and folder indicators on page reload
- Handle authentication expiry with existing video collections

### Testing Scenarios

1. **Add videos from multiple folders** - Verify they appear together
2. **Add duplicate videos** - Ensure they're filtered out appropriately  
3. **Clear all videos** - Reset to empty state correctly
4. **Authentication expires** - Handle gracefully with existing videos
5. **Network errors during add** - Don't lose existing videos
6. **Large folder additions** - Performance and memory usage
7. **Mixed video formats** - Ensure all types display correctly

### Future Enhancements

- **Folder organization**: Group videos by source folder in UI
- **Search and filter**: Find videos across all loaded folders
- **Bulk operations**: Select multiple folders at once
- **Recent folders**: Quick access to previously loaded folders
- **Video metadata**: Enhanced information about source and date added

This implementation maintains the current user experience while adding the flexibility to build video collections from multiple Dropbox locations.