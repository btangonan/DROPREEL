# Page.tsx Refactoring Plan

## Current Issues Identified

The main `page.tsx` file has grown to **1087 lines** and suffers from several architectural issues:

1. **Massive Component** - Far exceeds recommended component size (should be < 300 lines)
2. **Too Many Responsibilities** - Handles auth, DnD, video management, UI state, reel creation
3. **Excessive State (20+ useState hooks)** - Creates complex interdependencies  
4. **Large Functions** - Some functions span 50+ lines
5. **Mixed Concerns** - Business logic mixed with UI rendering
6. **Complex Drag & Drop Logic** - Custom collision detection in main component
7. **No Separation of Concerns** - API calls, state management, and UI all in one place

## Refactoring Strategy

### Phase 1: Extract Custom Hooks

#### 1.1 Authentication Hook (`useDropboxAuth`)
```typescript
// src/hooks/useDropboxAuth.ts
export function useDropboxAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const checkAuth = useCallback(async () => {
    // Extract checkDropboxAuth logic
  }, []);
  
  const connect = useCallback(() => {
    window.location.href = '/api/auth/dropbox';
  }, []);
  
  return {
    isAuthenticated,
    isLoading,
    authStatus,
    authError,
    checkAuth,
    connect
  };
}
```

#### 1.2 Video Management Hook (`useVideoManagement`)
```typescript
// src/hooks/useVideoManagement.ts  
export function useVideoManagement() {
  const [loadedVideos, setLoadedVideos] = useState<VideoFile[]>([]);
  const [videoState, setVideoState] = useState({ 
    yourVideos: [], 
    selects: [] 
  });
  const [isFetching, setIsFetching] = useState(false);
  const [folderPath, setFolderPath] = useState('');
  
  const fetchVideos = useCallback(async (path: string, append = false) => {
    // Extract fetchVideos logic
  }, []);
  
  const checkCompatibility = useCallback(async (videos: VideoFile[]) => {
    // Extract compatibility checking logic
  }, []);
  
  return {
    loadedVideos,
    videoState,
    setVideoState,
    isFetching,
    folderPath,
    setFolderPath,
    fetchVideos,
    checkCompatibility
  };
}
```

#### 1.3 Reel Editing Hook (`useReelEditing`)
```typescript
// src/hooks/useReelEditing.ts
export function useReelEditing() {
  const [editingReelId, setEditingReelId] = useState<string | null>(null);
  const [isLoadingReel, setIsLoadingReel] = useState(false);
  const [titles, setTitles] = useState<TitleElement[]>([]);
  
  const loadReelForEditing = useCallback(async (reelId: string) => {
    // Extract loadReelForEditing logic
  }, []);
  
  const createOrUpdateReel = useCallback(async (videoState, titles) => {
    // Extract handleMakeReel logic
  }, [editingReelId]);
  
  return {
    editingReelId,
    setEditingReelId,
    isLoadingReel,
    titles,
    setTitles,
    loadReelForEditing,
    createOrUpdateReel
  };
}
```

#### 1.4 Drag & Drop Hook (`useDragAndDrop`)
```typescript
// src/hooks/useDragAndDrop.ts
export function useDragAndDrop(videoState, setVideoState) {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const customCollisionDetection = useCallback((args: any) => {
    // Extract custom collision detection logic
  }, []);
  
  const handleDragEnd = useCallback((e) => {
    // Extract handleDragEnd logic
  }, [videoState, setVideoState]);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    })
  );
  
  return {
    activeId,
    setActiveId,
    customCollisionDetection,
    handleDragEnd,
    sensors,
    dndContextProps: {
      sensors,
      collisionDetection: customCollisionDetection,
      onDragStart: (e) => setActiveId(e.active.id as string),
      onDragEnd: handleDragEnd,
      onDragCancel: () => setActiveId(null)
    }
  };
}
```

### Phase 2: Extract Components

#### 2.1 Header Component
```typescript
// src/components/ReelMaker/Header.tsx
interface HeaderProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  isAuthenticated: boolean;
}

export function ReelMakerHeader({ 
  isDarkMode, 
  onThemeToggle,
  isAuthenticated 
}: HeaderProps) {
  return (
    <div className="matrix-header pt-6 pr-6 pl-6 pb-0">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl text-terminal">REELDROP</h1>
          <div className="text-xs text-muted-foreground mt-1">
            DROP IT. SEND IT. BOOK IT.
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={onThemeToggle}
            className="control-button flex items-center gap-2"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDarkMode ? 'LIGHT' : 'DARK'}</span>
          </button>
          <button className="control-button flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            <span>LOGIN</span>
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### 2.2 Action Buttons Component
```typescript
// src/components/ReelMaker/ActionButtons.tsx
interface ActionButtonsProps {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  onConnect: () => void;
  onAddVideos: () => void;
  titles: TitleElement[];
  onShowTitleEditor: () => void;
  videoState: { selects: VideoFile[] };
  onMakeReel: () => void;
  editingReelId: string | null;
  getTitleSizeClass: (size: string) => string;
}

export function ActionButtons({
  isAuthenticated,
  isAuthLoading,
  onConnect,
  onAddVideos,
  titles,
  onShowTitleEditor,
  videoState,
  onMakeReel,
  editingReelId,
  getTitleSizeClass
}: ActionButtonsProps) {
  return (
    <div className="flex gap-4 mb-5 items-stretch w-full">
      {/* CONNECT Button */}
      <button 
        className={`brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2 ${
          isAuthenticated ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}
        onClick={isAuthenticated ? undefined : onConnect}
        disabled={isAuthLoading}
      >
        <Wifi className="w-4 h-4" />
        <span>{isAuthLoading ? 'CHECKING...' : isAuthenticated ? 'CONNECTED' : 'CONNECT'}</span>
      </button>
      
      {/* ADD VIDEOS Button */}
      <button 
        className="brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2"
        onClick={onAddVideos}
        disabled={!isAuthenticated}
      >
        <Plus className="w-4 h-4" />
        <span>ADD VIDEOS</span>
      </button>
      
      {/* ADD/UPDATE TITLE Button */}
      {titles.length > 0 ? (
        <button 
          className="brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2 bg-green-500 text-white hover:opacity-80"
          onClick={onShowTitleEditor}
        >
          <FileText className="w-4 h-4" />
          <span className={getTitleSizeClass(titles[0].size)}>{titles[0].text}</span>
        </button>
      ) : (
        <button 
          className="brutal-button flex-1 inline-flex px-4 py-3 items-center gap-2"
          onClick={onShowTitleEditor}
        >
          <FileText className="w-4 h-4" />
          <span>ADD TITLE</span>
        </button>
      )}
      
      {/* MAKE/UPDATE REEL Button */}
      <button 
        className="brutal-button-accent flex-1 inline-flex px-4 py-3 items-center gap-2"
        disabled={videoState.selects.length === 0}
        onClick={onMakeReel}
      >
        <Zap className="w-4 h-4" />
        <span>{editingReelId ? 'UPDATE REEL' : 'MAKE REEL'}</span>
      </button>
    </div>
  );
}
```

#### 2.3 Video Panels Component
```typescript
// src/components/ReelMaker/VideoPanels.tsx
interface VideoPanelsProps {
  videoState: { yourVideos: VideoFile[]; selects: VideoFile[] };
  onVideoClick: (video: VideoFile, action?: VideoClickAction) => void;
  onVideoDelete: (video: VideoFile, panel: 'yourVideos' | 'selects') => void;
  onAddVideos: () => void;
  isAuthenticated: boolean;
}

export function VideoPanels({
  videoState,
  onVideoClick,
  onVideoDelete,
  onAddVideos,
  isAuthenticated
}: VideoPanelsProps) {
  return (
    <div className="pt-0 pb-0 px-6">
      <div className="grid grid-cols-[1fr_1fr] gap-4 items-stretch mt-5">
        {/* YOUR VIDEOS Panel */}
        <VideoPanel
          id="yourVideos"
          title="YOUR VIDEOS"
          icon={Database}
          videos={videoState.yourVideos}
          onVideoClick={onVideoClick}
          onVideoDelete={(video) => onVideoDelete(video, 'yourVideos')}
          emptyContent={
            <AddVideosEmptyState 
              onAddVideos={onAddVideos}
              isAuthenticated={isAuthenticated}
            />
          }
        />
        
        {/* SELECTED VIDEOS Panel */}
        <VideoPanel
          id="selects"
          title="SELECTED VIDEOS"
          icon={MousePointer2}
          videos={videoState.selects}
          onVideoClick={onVideoClick}
          onVideoDelete={(video) => onVideoDelete(video, 'selects')}
          emptyMessage="No videos selected. Drag videos from the left panel to get started."
        />
      </div>
    </div>
  );
}
```

### Phase 3: Extract Services

#### 3.1 Reel Service
```typescript
// src/services/reelService.ts
export interface CreateReelData {
  videos: VideoFile[];
  title: string;
  description: string;
  editState: any;
}

export interface UpdateReelData extends CreateReelData {
  id: string;
}

export class ReelService {
  static async createReel(data: CreateReelData) {
    const response = await fetch('/api/reels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create reel');
    }
    
    return response.json();
  }
  
  static async updateReel(data: UpdateReelData) {
    const response = await fetch('/api/reels', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update reel');
    }
    
    return response.json();
  }
  
  static async loadReelForEditing(id: string) {
    const response = await fetch(`/api/reels?id=${id}`);
    
    if (!response.ok) {
      throw new Error('Reel not found');
    }
    
    return response.json();
  }
}
```

#### 3.2 Video Service  
```typescript
// src/services/videoService.ts
export class VideoService {
  static async fetchVideos(path: string): Promise<VideoFile[]> {
    const finalPath = extractDropboxPath(path);
    const response = await fetch(
      `/api/dropbox?action=listVideos&folderPath=${encodeURIComponent(finalPath)}`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Folder "${finalPath}" not found in Dropbox`);
      }
      throw new Error('Failed to load videos');
    }
    
    const data = await response.json();
    return this.processVideos(data.videos || []);
  }
  
  private static async processVideos(videos: VideoFile[]): Promise<VideoFile[]> {
    return Promise.all(
      videos.map(async (video) => {
        const streamResponse = await fetch(
          `/api/dropbox?action=getStreamUrl&path=${encodeURIComponent(video.path)}`
        );
        const streamData = await streamResponse.json();
        const thumbnailUrl = `/api/dropbox/thumbnail?path=${encodeURIComponent(video.path)}`;
        
        return {
          ...video,
          streamUrl: streamData.url,
          thumbnailUrl,
          duration: '0:00',
          isCompatible: true,
          compatibilityError: null,
          dimensions: null
        };
      })
    );
  }
  
  static async getVideoDuration(videoUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
        video.src = '';
        video.load();
      };
      
      const onLoadedMetadata = () => {
        const duration = video.duration;
        cleanup();
        
        if (isNaN(duration) || duration === 0) {
          resolve('0:00');
          return;
        }
        
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      };
      
      const onError = () => {
        cleanup();
        resolve('0:00');
      };
      
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);
      
      setTimeout(() => {
        cleanup();
        resolve('0:00');
      }, 5000);
      
      video.src = videoUrl;
    });
  }
  
  static async checkCompatibility(videos: VideoFile[]): Promise<{ videos: VideoFile[] }> {
    return checkAllVideosCompatibility(videos);
  }
}
```

### Phase 4: State Management

#### 4.1 Consider Context/Reducer for Complex State
```typescript
// src/context/ReelMakerContext.tsx
interface ReelMakerState {
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  };
  videos: {
    loaded: VideoFile[];
    state: { yourVideos: VideoFile[]; selects: VideoFile[] };
    isFetching: boolean;
    folderPath: string;
  };
  reel: {
    editingId: string | null;
    isLoading: boolean;
    titles: TitleElement[];
  };
  ui: {
    isDarkMode: boolean;
    showFolderBrowser: boolean;
    showTitleEditor: boolean;
    previewVideo: VideoFile | null;
    error: string;
  };
}

type ReelMakerAction = 
  | { type: 'AUTH_SUCCESS'; payload: boolean }
  | { type: 'VIDEOS_LOADED'; payload: VideoFile[] }
  | { type: 'VIDEO_STATE_UPDATED'; payload: { yourVideos: VideoFile[]; selects: VideoFile[] } }
  | { type: 'TITLE_ADDED'; payload: TitleElement }
  | { type: 'ERROR_SET'; payload: string }
  // ... other actions

const reelMakerReducer = (state: ReelMakerState, action: ReelMakerAction): ReelMakerState => {
  switch (action.type) {
    case 'AUTH_SUCCESS':
      return {
        ...state,
        auth: { ...state.auth, isAuthenticated: action.payload, isLoading: false }
      };
    case 'VIDEOS_LOADED':
      return {
        ...state,
        videos: { ...state.videos, loaded: action.payload, isFetching: false }
      };
    // ... other cases
    default:
      return state;
  }
};

export const ReelMakerProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reelMakerReducer, initialState);
  
  return (
    <ReelMakerContext.Provider value={{ state, dispatch }}>
      {children}
    </ReelMakerContext.Provider>
  );
};

export const useReelMaker = () => {
  const context = useContext(ReelMakerContext);
  if (!context) {
    throw new Error('useReelMaker must be used within ReelMakerProvider');
  }
  return context;
};
```

### Phase 5: Final Structure

#### 5.1 Refactored Main Component (< 200 lines)
```typescript
// src/app/page.tsx
export default function Home() {
  // Custom hooks for separated concerns
  const auth = useDropboxAuth();
  const videos = useVideoManagement();  
  const reel = useReelEditing();
  const theme = useTheme();
  const dnd = useDragAndDrop(videos.videoState, videos.setVideoState);
  
  // Modal states
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);
  const [showTitleEditor, setShowTitleEditor] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<VideoFile | null>(null);
  const [popoutVideo, setPopoutVideo] = useState<VideoFile | null>(null);
  const [popoutRect, setPopoutRect] = useState<DOMRect | null>(null);
  
  // Handler functions
  const handleAddVideosClick = async () => {
    if (await auth.checkAuth()) {
      setShowFolderBrowser(true);
    }
  };
  
  const handleVideoClick = (video: VideoFile) => {
    setPreviewVideo(video);
    setPopoutVideo(null);
    setPopoutRect(null);
  };
  
  const handleVideoDelete = (video: VideoFile, panel: 'yourVideos' | 'selects') => {
    videos.deleteVideo(video, panel);
  };
  
  // Utility functions
  const getTitleSizeClass = (size: string) => {
    const sizeMap = {
      'small': 'text-xs',
      'medium': 'text-sm', 
      'large': 'text-base',
      'extra-large': 'text-lg',
      'huge': 'text-xl'
    };
    return sizeMap[size] || 'text-base';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DndContext {...dnd.dndContextProps}>
        {/* Header */}
        <ReelMakerHeader 
          isDarkMode={theme.isDarkMode}
          onThemeToggle={theme.toggle}
          isAuthenticated={auth.isAuthenticated}
        />
        
        {/* Horizontal Divider */}
        <div className="horizontal-divider" />
        
        {/* Action Buttons */}
        <div className="matrix-header px-6">
          <ActionButtons
            isAuthenticated={auth.isAuthenticated}
            isAuthLoading={auth.isLoading}
            onConnect={auth.connect}
            onAddVideos={handleAddVideosClick}
            titles={reel.titles}
            onShowTitleEditor={() => setShowTitleEditor(true)}
            videoState={videos.videoState}
            onMakeReel={reel.createOrUpdateReel}
            editingReelId={reel.editingReelId}
            getTitleSizeClass={getTitleSizeClass}
          />
        </div>
        
        {/* Video Panels */}
        <VideoPanels
          videoState={videos.videoState}
          onVideoClick={handleVideoClick}
          onVideoDelete={handleVideoDelete}
          onAddVideos={handleAddVideosClick}
          isAuthenticated={auth.isAuthenticated}
        />
        
        {/* Drag Overlay */}
        <DragOverlay>
          {dnd.activeVideo && (
            <VideoGridItem
              video={dnd.activeVideo}
              isDragging={true}
              listeners={{}}
              attributes={{}}
            />
          )}
        </DragOverlay>
      </DndContext>

      {/* Modals */}
      <Modals
        showFolderBrowser={showFolderBrowser}
        onCloseFolderBrowser={() => setShowFolderBrowser(false)}
        showTitleEditor={showTitleEditor}
        onCloseTitleEditor={() => setShowTitleEditor(false)}
        previewVideo={previewVideo}
        onClosePreview={() => setPreviewVideo(null)}
        popoutVideo={popoutVideo}
        popoutRect={popoutRect}
        onClosePopout={() => { setPopoutVideo(null); setPopoutRect(null); }}
        // Pass other modal props
      />
    </div>
  );
}
```

## Benefits of This Refactoring

✅ **Maintainability** - Smaller, focused components (< 200 lines each)  
✅ **Testability** - Isolated logic can be unit tested independently  
✅ **Reusability** - Hooks and services can be reused across components  
✅ **Readability** - Clear separation of concerns and responsibilities  
✅ **Performance** - Better optimization opportunities with smaller components  
✅ **Developer Experience** - Easier to navigate, debug, and modify  
✅ **Scalability** - New features can be added without bloating main component  

## Implementation Order

1. **Start with Hooks** - Extract state logic first (lowest risk)
2. **Extract Services** - Move API calls out of components  
3. **Break Down UI** - Create smaller, focused components
4. **Add Context** - If cross-component state becomes complex
5. **Test & Optimize** - Ensure all functionality is preserved

## Migration Strategy

- **Incremental Approach** - Refactor one section at a time
- **Feature Flags** - Use feature flags to switch between old/new implementations  
- **Comprehensive Testing** - Test each extracted piece thoroughly
- **Preserve Functionality** - Ensure no features are lost during refactoring
- **Performance Monitoring** - Watch for any performance regressions

This refactoring would transform a monolithic 1087-line component into a maintainable, modular architecture while preserving all existing functionality.