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