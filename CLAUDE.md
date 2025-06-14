# DropReel MVP - Claude Context Guide

## What the App Does

DropReel is a video reel creation application that integrates with Dropbox to help users create video presentations. Users can:

1. **Connect to Dropbox** - Authenticate with their Dropbox account
2. **Browse and Select Videos** - Navigate Dropbox folders and select video files
3. **Organize Videos** - Drag and drop videos between "YOUR VIDEOS" and "SELECTS" panels
4. **Preview Videos** - Watch videos in a full-screen modal player with controls
5. **Create Reels** - Combine selected videos into presentation reels (planned feature)

## Design System: MATRIX Theme

### Core Aesthetic
- **Cyberpunk Influence**: Inspired by digital interfaces from sci-fi
- **Monospace Typography**: Uses JetBrains Mono for a technical, code-like feel
- **High Contrast**: Maximizes readability and visual impact
- **Glowing Elements**: Subtle glows on interactive elements for depth

### Color Schemes

#### Dark Theme (Default)
- **Background**: Pure black (#0a0a0a)
- **Text/UI**: Neon green (#00ff00)
- **Accents**: Bright magenta (#ff00ff)
- **Destructive**: Bright red (#ff0000)
- **Success**: Neon green (#00ff00)
- **Warning**: Bright magenta (#ff00ff)
- **Borders**: Neon green (#00ff00)
- **Input Background**: Dark gray (#111111)

#### Light Theme
- **Background**: Off-white (#fafafa)
- **Text/UI**: Pure black (#1a1a1a)
- **Accents**: Bright magenta (#d946ef)
- **Secondary**: Light gray (#e5e5e5)
- **Input Background**: Off-white (#f8f8f8)
- **Borders**: Black (#1a1a1a)

### Typography
- **Font Family**: 'JetBrains Mono', monospace
- **Base Size**: 14px
- **Weights**: 
  - Regular (400)
  - Medium (500)
  - Bold (700)

### UI Components
- **Buttons**: Flat, rectangular with sharp corners
- **Cards**: No rounded corners, solid borders
- **Inputs**: Minimal borders, focused state with glow
- **Modals**: Full-bleed with border accents
- **Scrollbars**: Thin, custom-styled for dark/light modes

### Interactive States
- **Hover**: Slight brightness increase
- **Active**: Inverted colors
- **Focus**: Glowing outline
- **Disabled**: 50% opacity

### Motion
- **Transitions**: Fast (100-200ms)
- **Easing**: Linear for digital feel
- **Micro-interactions**: Subtle glows and opacity changes

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

**Theme Variables:**
```css
:root {
  /* Light Theme (default) */
  --background: #fafafa;
  --foreground: #1a1a1a;
  --primary: #1a1a1a;
  --primary-foreground: #fafafa;
  --accent: #d946ef;
  --accent-foreground: #fafafa;
  --border: #1a1a1a;
  --input: #fafafa;
  --input-background: #f8f8f8;
  --muted: #f5f5f5;
  --muted-foreground: #666666;
  --destructive: #dc2626;
  --destructive-foreground: #fafafa;
}

.dark {
  /* Dark Theme (MATRIX) */
  --background: #0a0a0a;
  --foreground: #00ff00;
  --primary: #fafafa;
  --primary-foreground: #0a0a0a;
  --accent: #ffff00;
  --accent-foreground: #0a0a0a;
  --border: #00ff00;
  --input: #0a0a0a;
  --input-background: #111111;
  --muted: #1a1a1a;
  --muted-foreground: #888888;
  --destructive: #ff0000;
  --destructive-foreground: #fafafa;
}
```

**Key Components:**
- `.matrix-header` - Top navigation with digital aesthetic
- `.control-button` - Flat buttons with hover glow
- `.video-grid` - Grid layout for video thumbnails
- `.video-card` - Individual video items with border accents
- `.modal-overlay` - Full-bleed modals with glowing borders

**Responsive Breakpoints:**
- Desktop: `@media (min-width: 1024px)`
- Tablet: `@media (min-width: 768px)`
- Mobile: Default styles

### Grid System
```css
.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.25rem;
  padding: 1rem;
  border: 1px solid var(--border);
  background-color: var(--background);
}
```
- `auto-fill` creates as many columns as fit the container
- `minmax(240px, 1fr)` ensures items don't get too narrow
- Consistent gaps and padding for digital alignment
- Border and background adapt to theme

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

## Future Development

### Planned Features
- Reel creation and export functionality
- Video editing capabilities (trim, transitions)
- Multiple reel management
- Sharing and collaboration features
- Cloud storage beyond Dropbox

### Technical Debt
- Implement proper error boundaries
- Add comprehensive loading states
- Improve accessibility (ARIA labels, keyboard navigation)
- Add unit tests for core functionality
- Optimize bundle size and performance

This guide should provide enough context to understand, modify, and extend the DropReel application after losing session context.

---

## 2024 UI/UX Debugging & Lessons Learned (Session Log)

### Tailwind Setup & Fixes
- Resolved missing Tailwind utility classes by:
  - Ensuring `tailwindcss` was installed and the CLI binary was present in `node_modules/.bin`.
  - Running `npx tailwindcss init -p` to generate config files.
  - Updating `tailwind.config.js` to include all source files in the `content` array.
  - Installing missing dependencies: `lucide-react`, `autoprefixer`, and `postcss`.

### Button Row & Panel Layout
- Ensured button row uses `flex gap-4` for visible spacing between buttons.
- Removed all `w-full`, `flex-1`, and min-width from buttons to prevent stretching.
- Used browser inspector to confirm no conflicting styles were present.

### Divider & Panel Spacing
- Added a thin horizontal divider below the button row using `<div className="w-full h-0.5 bg-black" />`.
- Replaced thick vertical bar between panels with a thin divider or removed it for a clean gap.
- Used `gap-4` (16px) and later `gap-5` (20px) for consistent spacing between panels.
- Balanced vertical spacing by:
  - Adjusting margin and padding above/below the divider and panels.
  - Removing bottom padding from `.matrix-header` to eliminate extra gap.
  - Ensuring the grid's `mt-5` (20px) sets the gap below the divider.

### Panel Borders
- Restored original panel borders (`border-2 border-black` on all sides) for both panels after testing border removal.
- Confirmed that panel borders do not add extra visual gap when spacing is set correctly.

### Error Message Handling
- Discovered that error messages rendered between the divider and panels caused unexpected large gaps.
- Solution: Removed error message display from the main UI and rely on the CONNECT button for user feedback.

### Debugging Process
- Used browser inspector to check for margin, padding, and border issues.
- Verified all spacing utilities in JSX and CSS.
- Iteratively adjusted layout and confirmed changes visually after each step.

### Key Takeaways
- Always check for hidden error messages or conditional UI that may affect layout spacing.
- Panel borders and divider lines should be managed independently for clean, predictable spacing.
- Tailwind config and dependency setup is critical for utility classes to work as expected.
- Use the inspector and remove/add classes live to debug persistent UI issues.

---

## Video Playback & Aspect Ratio Management (December 2024)

### The Challenge: Perfect Video Sizing Without Black Bars

**Problem**: Video players often add letterboxing (black bars) when the video aspect ratio doesn't match the container. This was happening inconsistently between the VideoPreviewModal (which worked perfectly) and the reels page (which had black bars).

**Root Cause**: Most video players, including Video.js, apply their own sizing logic that can override CSS and create letterboxing. The key insight was that the VideoPreviewModal worked because it used a simple `<video>` element with dynamic container sizing.

### The Solution: Dynamic Container Sizing + Native Video Element

#### Core Approach
Instead of forcing videos into fixed containers, we calculate the container size to **exactly match each video's aspect ratio**, then use a native `<video>` element with `object-contain`.

#### Implementation Steps

1. **Aspect Ratio Detection**
```typescript
const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
  const video = e.currentTarget;
  const width = video.videoWidth;
  const height = video.videoHeight;
  
  if (width && height) {
    const ratio = width / height;
    let orientation: 'landscape' | 'portrait' | 'square';
    
    if (ratio > 1.1) orientation = 'landscape';
    else if (ratio < 0.9) orientation = 'portrait';
    else orientation = 'square';
    
    setVideoAspectRatio({ width, height, aspectRatio: ratio, orientation });
  }
};
```

2. **Dynamic Container Calculation**
```typescript
const getVideoContainerStyle = () => {
  if (!videoAspectRatio) {
    return { aspectRatio: '16 / 9', maxWidth: '80vw', maxHeight: '60vh' };
  }

  const { orientation, aspectRatio: ratio } = videoAspectRatio;
  
  if (orientation === 'portrait') {
    // Portrait: constrain height, calculate width
    return {
      maxHeight: '60vh',
      maxWidth: `calc(60vh * ${ratio})`,
      aspectRatio: `${videoAspectRatio.width} / ${videoAspectRatio.height}`
    };
  } else {
    // Landscape/Square: constrain width, calculate height  
    return {
      maxWidth: '80vw',
      maxHeight: `calc(80vw / ${ratio})`,
      aspectRatio: `${videoAspectRatio.width} / ${videoAspectRatio.height}`
    };
  }
};
```

3. **Native Video Element Implementation**
```tsx
<div className="w-full flex items-center justify-center" style={{ minHeight: '60vh' }}>
  <div className="relative bg-black" style={getVideoContainerStyle()}>
    <video
      key={currentVideo.id}
      src={currentVideo.streamUrl}
      className="w-full h-full object-contain"
      controls
      autoPlay
      onEnded={handleNext}
      onLoadedMetadata={handleVideoLoadedMetadata}
      crossOrigin="anonymous"
      playsInline
    />
  </div>
</div>
```

### Why This Works

1. **No Fixed Containers**: Instead of forcing videos into rigid containers (like `height: 60vh`), the container resizes to match the video
2. **Native Video Element**: Using `<video>` instead of Video.js eliminates player-imposed sizing constraints
3. **object-contain**: Ensures the video fills its perfectly-sized container without cropping or letterboxing
4. **Dynamic Detection**: `onLoadedMetadata` gets the actual video dimensions, not guessed metadata
5. **Responsive Constraints**: `maxWidth: 80vw` and `maxHeight: 60vh` prevent videos from exceeding viewport bounds

### Video Streaming Architecture

#### Dropbox Integration
- **Authentication**: OAuth flow stores access tokens for API calls
- **File Discovery**: `/api/dropbox?action=listVideos` returns video file metadata
- **Stream URL Generation**: `/api/dropbox?action=getStreamUrl` creates temporary download links
- **URL Processing**: Converts Dropbox share links to direct streaming URLs

#### Stream URL Processing
```typescript
function getProcessedUrl(url: string | undefined): string {
  if (!url) return '';
  
  // Convert Dropbox URLs to direct download format
  if (url.includes('dropbox.com') || url.includes('dropboxusercontent.com')) {
    let processedUrl = url
      .replace('www.dropbox.com/s/', 'dl.dropboxusercontent.com/s/')
      .replace('?dl=0', '?raw=1&dl=1');
    
    // Add cache-busting parameter to prevent expired link caching
    const cacheBuster = `&cb=${Date.now()}`;
    processedUrl += processedUrl.includes('?') ? cacheBuster : `?${cacheBuster.substring(1)}`;
    
    return processedUrl;
  }
  
  return url;
}
```

#### Video Player Optimization
- **Key-based Remounting**: `key={currentVideo.id}` forces clean transitions between videos
- **Cross-Origin Support**: `crossOrigin="anonymous"` enables cross-domain video access
- **Mobile Optimization**: `playsInline` prevents fullscreen on iOS
- **Auto-progression**: `onEnded={handleNext}` automatically advances to next video

### Aspect Ratio Handling by Type

#### Portrait Videos (< 0.9 ratio)
- **Container**: `maxHeight: 60vh`, `maxWidth: calc(60vh * ratio)`
- **Result**: Height-constrained, width adjusts proportionally
- **Example**: 9:16 TikTok-style videos

#### Standard Landscape (0.9 - 2.2 ratio)  
- **Container**: `maxWidth: 80vw`, `maxHeight: calc(80vw / ratio)`
- **Result**: Width-constrained, height adjusts proportionally
- **Example**: 16:9 YouTube videos, 4:3 traditional videos

#### Anamorphic/Ultra-wide (> 2.2 ratio)
- **Container**: `maxWidth: 80vw`, `maxHeight: calc(80vw / ratio)`
- **Result**: Fills edge-to-edge width, minimal height
- **Example**: 2.35:1 cinematic, 2.73:1 ultra-wide

### Performance Optimizations

#### Smooth Video Transitions
- **Key Remounting**: Forces React to completely recreate video element on change
- **Metadata Preloading**: `onLoadedMetadata` fires before full video load
- **Container Pre-sizing**: Container calculates before video renders, eliminating resize flicker

#### Memory Management
- **URL Cache Busting**: Prevents browsers from caching expired Dropbox links
- **Component Cleanup**: Key-based remounting automatically cleans up previous video instances
- **Lazy Calculation**: Container sizing only calculates after metadata loads

### Key Learnings

1. **Never Force Aspect Ratios**: Let the video's natural dimensions drive container sizing
2. **Native Elements > Complex Players**: Simple `<video>` often performs better than feature-rich players
3. **Metadata Detection is Critical**: Always detect actual video dimensions rather than guessing
4. **Responsive Constraints**: Use max-width/max-height instead of fixed dimensions
5. **Clean State Management**: Key-based remounting eliminates transition glitches

This approach ensures every video—from vertical phone recordings to ultra-wide cinematic shots—displays perfectly without black bars or cropping, matching the quality of professional video platforms.

---

## Recent Feature Enhancements (Current Session 2025)

### Title Management System
**Implemented comprehensive title functionality with size support and persistence:**

#### Title Size Mapping
- **Button Display**: Maps size IDs to appropriate CSS classes for consistent UI
- **Reel Page Headers**: Uses larger header classes for proper visual hierarchy
- **Editor Preview**: Shows actual size selection in modal

```typescript
// Button size mapping (for buttons/UI)
const getTitleSizeClass = (size: string) => {
  switch (size) {
    case 'small': return 'text-xs';
    case 'medium': return 'text-sm';
    case 'large': return 'text-base';
    case 'extra-large': return 'text-lg';
    case 'huge': return 'text-xl';
    default: return 'text-base';
  }
};

// Header size mapping (for page titles)
const getTitleHeaderSize = (size: string) => {
  switch (size) {
    case 'small': return 'text-lg';     // h4 equivalent
    case 'medium': return 'text-xl';    // h3 equivalent
    case 'large': return 'text-2xl';    // h2 equivalent
    case 'extra-large': return 'text-3xl'; // h1 equivalent
    case 'huge': return 'text-4xl';     // Large h1 equivalent
    default: return 'text-2xl';
  }
};
```

#### Title Persistence Architecture
- **Database Storage**: Titles saved in `editState.titles` with full metadata
- **Cross-Session Persistence**: Titles restored when editing reels
- **Size Preservation**: Both text and size settings maintained
- **Update vs Create**: Smart detection for edit vs new title scenarios

#### Dynamic Button Behavior
- **Context-Aware Text**: "ADD TITLE" vs "UPDATE TITLE" based on state
- **Visual Indicators**: Green background for existing titles, pink accent for updates
- **Size Display**: Title buttons show actual title text with appropriate sizing

### Reel Management Enhancements

#### Create vs Update Intelligence
```typescript
const handleMakeReel = async () => {
  const isEditing = editingReelId !== null;
  const method = isEditing ? 'PUT' : 'POST';
  const url = isEditing ? `/api/reels?id=${editingReelId}` : '/api/reels';
  
  // Dynamic request body with proper ID handling
  const requestBody = {
    videos: videoState.selects,
    title: titles.length > 0 ? titles[0].text : `Reel ${new Date().toLocaleDateString()}`,
    editState: {
      // Complete state preservation
      folderPath,
      allOriginalVideos: loadedVideos,
      selectedVideos: videoState.selects,
      currentYourVideos: videoState.yourVideos,
      currentSelects: videoState.selects,
      titles: titles // Title persistence
    },
    ...(isEditing && { id: editingReelId })
  };
};
```

#### Reel Title Display
- **Dynamic Page Headers**: Reel pages show actual title instead of "DROPREEL"
- **Size-Aware Display**: Respects title size settings from editor
- **Fallback Handling**: Graceful degradation for legacy reels

### Navigation Arrow Improvements
- **Better Positioning**: Moved arrows further from video content for cleaner UI
- **Responsive Spacing**: Maintains proper distance across screen sizes
- **Visual Balance**: Improved overall page composition

### Theme System Overhaul

#### Persistent Theme State
**Implemented site-wide theme persistence using localStorage:**

```typescript
// src/lib/theme.ts - Centralized theme management
export const initializeTheme = (): boolean => {
  const savedTheme = getStoredTheme();
  applyTheme(savedTheme);
  return savedTheme;
};

export const toggleTheme = (currentTheme: boolean): boolean => {
  const newTheme = !currentTheme;
  setStoredTheme(newTheme);
  applyTheme(newTheme);
  return newTheme;
};
```

#### Cross-Page Theme Consistency
- **Main Page**: Theme toggle with localStorage persistence
- **Reel View Page**: Automatic theme restoration on load
- **Reels List Page**: Consistent theme across navigation
- **Modal Components**: Theme-aware styling

#### MATRIX Theme Refinements
- **Green Accents**: Updated border colors to use CSS variables
- **Dark Mode Polish**: Proper green borders and UI elements
- **Light/Dark Switching**: Seamless transitions between themes

### Modal & Interaction Enhancements

#### Universal ESC Key Support
**Added ESC key handling to all modal components:**

- **TitleEditor**: ESC triggers `handleCancel()` with proper cleanup
- **VideoPreviewModal**: Already had ESC support (was working correctly)
- **FolderBrowser**: Added ESC handler for modal dismissal
- **PopoutVideoOverlay**: Already had comprehensive ESC handling

```typescript
// Standard ESC handler pattern
useEffect(() => {
  const handleEscKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  };

  if (isOpen) {
    document.addEventListener('keydown', handleEscKey);
  }

  return () => {
    document.removeEventListener('keydown', handleEscKey);
  };
}, [isOpen, onClose]);
```

#### Title Editor Improvements
- **Dynamic Button Styling**: Pink accent colors for update mode
- **Sample Text Colors**: Consistent pink accent across size previews
- **Pre-population**: Existing titles load into editor for seamless editing
- **Hover States**: All size buttons turn black on hover

### Video State Management
**Comprehensive video panel state preservation:**

#### Complete State Saving
```typescript
editState: {
  folderPath,                    // Dropbox folder context
  allOriginalVideos: loadedVideos,  // All loaded videos
  selectedVideos: videoState.selects, // Reel content
  currentYourVideos: videoState.yourVideos, // Panel state
  currentSelects: videoState.selects,       // Panel state backup
  titles: titles                 // Title information
}
```

#### Restoration Strategy
1. **Primary**: Use `currentYourVideos` and `currentSelects` for exact panel states
2. **Fallback**: Reconstruct from `allOriginalVideos` and `selectedVideos`
3. **Legacy**: Handle older reels without full edit state

### Complete Reel State Management Flow

#### Cross-Session State Persistence
**The app implements a sophisticated multi-layer state management system:**

#### 1. Database Persistence (Primary Storage)
```typescript
// When creating/updating reels via handleMakeReel()
const requestBody = {
  videos: videoState.selects,
  title: titles.length > 0 ? titles[0].text : `Reel ${new Date().toLocaleDateString()}`,
  description: `Created with ${videoState.selects.length} videos`,
  editState: {
    folderPath,                           // Dropbox folder context
    allOriginalVideos: loadedVideos,      // Complete video library
    selectedVideos: videoState.selects,   // Final reel content
    currentYourVideos: videoState.yourVideos,  // Left panel state
    currentSelects: videoState.selects,   // Right panel state
    titles: titles                        // Title configuration
  },
  ...(isEditing && { id: editingReelId })
};
```

#### 2. Browser Navigation State (localStorage)
```typescript
// Stored when navigating TO reel view (for back button support)
localStorage.setItem('lastReelEditState', JSON.stringify({
  reelId: reelId,
  editState: {
    folderPath,
    allOriginalVideos: loadedVideos,
    selectedVideos: videoState.selects,
    currentYourVideos: videoState.yourVideos,
    currentSelects: videoState.selects
  }
}));

// Retrieved when navigating BACK to edit page
const lastReelEditState = localStorage.getItem('lastReelEditState');
if (lastReelEditState && !editReelId) {
  const stored = JSON.parse(lastReelEditState);
  // Restore complete edit context
}
```

#### 3. URL Parameter State (Edit Mode Detection)
```typescript
// URL-based edit mode: /?edit={reelId}
const urlParams = new URLSearchParams(window.location.search);
const editReelId = urlParams.get('edit');

if (editReelId && editReelId !== editingReelId) {
  setEditingReelId(editReelId);
  loadReelForEditing(editReelId);
}
```

#### State Flow Scenarios

#### Scenario 1: Create New Reel
1. User organizes videos in panels
2. User adds title and configures settings
3. User clicks "MAKE REEL"
4. Complete state saved to database via POST
5. Navigation to reel view with localStorage backup
6. User can return to edit with full context

#### Scenario 2: Edit Existing Reel
1. User clicks "EDIT REEL" from reel view
2. Navigation to `/?edit={reelId}` 
3. `loadReelForEditing()` fetches complete `editState`
4. All panels, videos, and settings restored
5. User makes changes
6. User clicks "UPDATE REEL"
7. Updated state saved to database via PUT

#### Scenario 3: Browser Back Navigation
1. User navigates from edit page to reel view
2. `lastReelEditState` stored in localStorage
3. User presses browser back button
4. App detects main page without edit parameter
5. localStorage checked for recent edit state
6. Complete context restored from localStorage
7. URL updated to include edit parameter

#### Data Recovery Hierarchy
```typescript
// Primary: Use saved panel states (most accurate)
if (currentYourVideos && currentSelects) {
  setVideoState({
    yourVideos: currentYourVideos,
    selects: currentSelects
  });
}
// Fallback: Reconstruct from video relationships
else if (allOriginalVideos && selectedVideos) {
  const selectedVideoIds = new Set(selectedVideos.map(v => v.id));
  const unselectedVideos = allOriginalVideos.filter(v => !selectedVideoIds.has(v.id));
  setVideoState({
    yourVideos: unselectedVideos,
    selects: selectedVideos
  });
}
// Legacy: Handle old reels without editState
else if (data.videos) {
  setVideoState({
    yourVideos: [],
    selects: data.videos
  });
}
```

#### State Consistency Guarantees
- **Complete Context**: Every edit session preserves full video library
- **Panel Integrity**: Exact panel organization maintained across sessions
- **Title Persistence**: Custom titles with sizing survive navigation
- **Folder Context**: Dropbox folder path preserved for adding more videos
- **Seamless Transitions**: No data loss between create, edit, and view modes

#### Technical Implementation Notes
- **localStorage Cleanup**: Temporary navigation state cleared after use
- **URL Synchronization**: Browser history properly reflects edit state
- **Memory Management**: Large video arrays efficiently stored and retrieved
- **Error Recovery**: Multiple fallback strategies prevent data loss
- **Compatibility**: Handles both new reels and legacy reel formats

### Architecture & Code Quality

#### Refactoring Plan Documentation
**Created comprehensive refactoring strategy in `refactoring.md`:**

- **Problem Analysis**: Identified 1087-line monolithic component issues
- **5-Phase Approach**: Hooks → Components → Services → State → Structure
- **Detailed Implementation**: Specific code examples for each extraction
- **Migration Strategy**: Low-risk incremental approach

#### Key Refactoring Opportunities
1. **Custom Hooks**: Extract auth, video management, drag & drop logic
2. **Component Breakdown**: Smaller, focused UI components  
3. **Service Layer**: Centralized API and business logic
4. **State Management**: Context/reducer for complex state
5. **Testing Strategy**: Unit testable isolated logic

### Performance & UX Improvements

#### Smart Button States
- **Context Awareness**: Buttons show appropriate text based on state
- **Visual Feedback**: Color coding for different action types
- **Loading States**: Proper feedback during async operations

#### Seamless Navigation
- **Theme Persistence**: No flash of wrong theme on page load
- **State Restoration**: Complete edit context preserved across navigation
- **Error Handling**: Graceful degradation and user feedback

### Development Guidelines

#### Theme Implementation
- **CSS Variables**: Use `var(--accent-bg)` for consistent theming
- **localStorage**: Persist user preferences across sessions
- **SSR Safety**: Handle server-side rendering edge cases

#### Modal Development
- **ESC Support**: Always include ESC key handling for dismissal
- **Focus Management**: Proper keyboard navigation and accessibility
- **Cleanup**: Remove event listeners on component unmount

#### State Management
- **Persistence**: Save complete edit state for seamless editing
- **Restoration**: Multiple fallback strategies for data recovery
- **Consistency**: Maintain UI state across navigation and refreshes

This session focused on polish, user experience improvements, and architectural planning for future development. All changes maintain backward compatibility while significantly improving the overall user experience.