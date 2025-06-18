export interface ReelAsset {
  id: string;
  url: string;
  type: 'image' | 'video';
  duration?: number; // Duration in seconds
  dropboxPath?: string; // Path to the asset in Dropbox
  thumbnailUrl?: string; // Optional thumbnail for UI display
}

export interface ReelTransition {
  type: string; // e.g., 'fade', 'slide', 'zoom'
  duration: number; // Duration in seconds
}

export interface ReelConfig {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  assets: ReelAsset[];
  transitions?: ReelTransition[];
  aspectRatio?: string; // e.g., '16:9', '1:1'
  totalDuration?: number; // Total duration in seconds
  backgroundMusic?: {
    url?: string;
    dropboxPath?: string;
    name?: string;
  };
  // Additional metadata for the reel
  metadata?: Record<string, unknown>;
}

export interface ReelStorageResponse {
  success: boolean;
  path?: string;
  error?: string;
  message?: string;
}
