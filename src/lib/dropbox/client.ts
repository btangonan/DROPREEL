import { Dropbox } from 'dropbox';
import { VideoFile } from '@/types';
import { nanoid } from 'nanoid';

export class DropboxClient {
  private client: Dropbox;
  private folderPath: string;

  constructor(accessToken: string, folderPath: string) {
    console.log(`Initializing Dropbox client with folder path: "${folderPath}"`);
    if (!accessToken) {
      console.error('No access token provided');
      throw new Error('Dropbox access token is required');
    }
    
    // Initialize the Dropbox client with the access token
    // and specify fetch option to use global fetch to avoid scope issues
    this.client = new Dropbox({ 
      accessToken,
      fetch: (url: RequestInfo, init?: RequestInit) => fetch(url, init) // Use global fetch with proper types
    });
    
    this.folderPath = folderPath || ''; // Default to root if no path specified
  }
  
  // Expose client for API routes that need direct access
  getClient(): Dropbox {
    return this.client;
  }

  async listVideos(): Promise<VideoFile[]> {
    try {
      console.log(`Listing videos from folder: "${this.folderPath}"`);
      
      // Handle empty path or root as ""
      const path = this.folderPath === '/' ? '' : this.folderPath;
      
      console.log(`Making API request with path: "${path}"`);
      const response = await this.client.filesListFolder({
        path,
        include_media_info: true
      });

      console.log(`Got ${response.result.entries.length} entries from Dropbox`);
      
      const videoFiles = response.result.entries
        .filter(entry => {
          const isFile = entry['.tag'] === 'file';
          const isVideo = entry.name.match(/\.(mp4|mov|m4v)$/i);
          return isFile && isVideo;
        })
        .map(entry => ({
          id: nanoid(),
          name: entry.name,
          path: entry.path_display || '',
          streamUrl: '',
          thumbnailUrl: ''
        }));

      console.log(`Found ${videoFiles.length} video files`);
      return videoFiles;
    } catch (error: any) {
      console.error('Error listing videos:', error);
      console.error('Error details:', error?.message, error?.status, error?.error);
      throw error;
    }
  }

  async getTemporaryLink(path: string): Promise<string> {
    try {
      const response = await this.client.filesGetTemporaryLink({ path });
      return response.result.link;
    } catch (error) {
      console.error('Error getting temporary link:', error);
      throw error;
    }
  }

  async getThumbnail(path: string): Promise<string> {
    try {
      const response = await this.client.filesGetThumbnail({
        path,
        format: { '.tag': 'jpeg' },
        size: { '.tag': 'w640h480' }
      });
      
      const buffer = (response.result as any).fileBinary;
      if (buffer) {
        const blob = new Blob([buffer], { type: 'image/jpeg' });
        return URL.createObjectURL(blob);
      }
      return '';
    } catch (error) {
      console.error('Error getting thumbnail:', error);
      return '';
    }
  }
}
