export interface VideoFile {
  id: string;
  name: string;
  path: string;
  size?: number;  // File size in bytes
  streamUrl?: string;
  thumbnailUrl?: string;
  mediaInfo?: any;  // Additional media information from Dropbox API
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

export interface VideoReel {
  id: string;
  videos: VideoFile[];
  title?: string;
  description?: string;
  directorInfo?: DirectorInfo;
  editState?: any; // State for round-trip editing
  createdAt: string;
  updatedAt: string;
}

export interface DropboxConfig {
  accessToken: string;
  folderPath: string;
}
