export interface VideoFile {
  id: string;
  name: string;
  path: string;
  size?: number;  // File size in bytes
  streamUrl?: string;
  thumbnailUrl?: string;
  mediaInfo?: any;  // Additional media information from Dropbox API
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
  createdAt: string;
  updatedAt: string;
}

export interface DropboxConfig {
  accessToken: string;
  folderPath: string;
}
