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