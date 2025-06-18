import { Wifi, Plus, FileText, Zap } from 'lucide-react';
import { VideoFile } from '@/types';

interface TitleElement {
  id: string;
  text: string;
  size: string;
  timestamp: number;
}

interface ActionButtonsProps {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  onConnect: () => void;
  onAddVideos: () => void;
  titles: TitleElement[];
  onShowTitleEditor: () => void;
  videoState: { selects: VideoFile[] };
  onPreviewReel: () => void;
  onUpdateReel: () => void;
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
  onPreviewReel,
  onUpdateReel,
  editingReelId,
  getTitleSizeClass
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-5 items-stretch w-full">
      {/* CONNECT Button */}
      <button 
        className={`brutal-button flex-1 inline-flex px-2 sm:px-4 py-3 items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
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
        className="brutal-button flex-1 inline-flex px-2 sm:px-4 py-3 items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        onClick={onAddVideos}
        disabled={!isAuthenticated}
      >
        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
        <span>ADD VIDEOS</span>
      </button>
      
      {/* ADD/UPDATE TITLE Button */}
      {titles.length > 0 ? (
        <button 
          className="brutal-button flex-1 inline-flex px-2 sm:px-4 py-3 items-center gap-1 sm:gap-2 text-xs sm:text-sm bg-green-500 text-white hover:opacity-80"
          onClick={onShowTitleEditor}
        >
          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className={getTitleSizeClass(titles[0].size)}>{titles[0].text}</span>
        </button>
      ) : (
        <button 
          className="brutal-button flex-1 inline-flex px-2 sm:px-4 py-3 items-center gap-1 sm:gap-2 text-xs sm:text-sm"
          onClick={onShowTitleEditor}
        >
          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>ADD TITLE</span>
        </button>
      )}
      
      {/* PREVIEW REEL Button */}
      <button 
        className="brutal-button flex-1 inline-flex px-2 sm:px-4 py-3 items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        disabled={videoState.selects.length === 0}
        onClick={onPreviewReel}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="hidden sm:inline">PREVIEW REEL</span>
        <span className="sm:hidden">PREVIEW</span>
      </button>
      
      {/* MAKE/UPDATE REEL Button */}
      <button 
        className="brutal-button-accent flex-1 inline-flex px-2 sm:px-4 py-3 items-center gap-1 sm:gap-2 text-xs sm:text-sm"
        disabled={videoState.selects.length === 0}
        onClick={onUpdateReel}
      >
        <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">{editingReelId ? 'UPDATE REEL' : 'MAKE REEL'}</span>
        <span className="sm:hidden">{editingReelId ? 'UPDATE' : 'MAKE'}</span>
      </button>
    </div>
  );
}