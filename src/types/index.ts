export interface MediaInfo {
  dimensions?: { width: number; height: number };
  duration?: number;
  time_taken?: string;
  location?: { latitude: number; longitude: number };
}

export interface VideoFile {
  id: string;
  name: string;
  path: string;
  size?: number;  // File size in bytes
  streamUrl?: string;
  thumbnailUrl?: string;
  mediaInfo?: MediaInfo | null;  // Additional media information from Dropbox API
  // Compatibility checking fields
  isCompatible?: boolean;
  compatibilityError?: string | null;
  dimensions?: { width: number; height: number } | null;
  checkedWithBrowser?: boolean;
  duration?: string;
}

export interface DirectorInfo {
  name?: string;
  bio?: string;
  image?: string;
}

export interface ReelEditState {
  currentYourVideos: VideoFile[];
  currentSelects: VideoFile[];
  folderPath: string;
  titles?: TitleElement[];
}

export interface VideoReel {
  id: string;
  videos: VideoFile[];
  title?: string;
  description?: string;
  directorInfo?: DirectorInfo;
  editState?: ReelEditState | null; // State for round-trip editing
  createdAt: string;
  updatedAt: string;
}

export interface DropboxConfig {
  accessToken: string;
  folderPath: string;
}

export interface TitleElement {
  id: string;
  text: string;
  size: 'small' | 'medium' | 'large' | 'extra-large' | 'huge';
  position: { x: number; y: number };
  color: string;
  backgroundColor: string;
}
