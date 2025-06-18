// This is a client-side only utility that provides a safe way to use the Dropbox API
import { Dropbox } from 'dropbox';

// Create a singleton Dropbox client factory (unused but kept for future reference)
// const dropboxClient: Dropbox | null = null;

export const getDropboxClient = (accessToken: string): Dropbox => {
  // Always create a new client instead of using a singleton to avoid token issues
  return new Dropbox({ 
    accessToken,
    fetch: (url: RequestInfo, init?: RequestInit) => fetch(url, init)
  });
};

// Convert a Dropbox URL or path to a standardized API path
export const convertDropboxUrlToPath = (input: string): string => {
  if (!input) return '';
  
  // Try to extract path from Dropbox URL
  try {
    // Handle URLs that might have been copied from browser
    if (input.includes('dropbox.com')) {
      const url = new URL(input);
      
      // Handle URLs like https://www.dropbox.com/home/Folder_Name
      if (url.pathname.includes('/home/')) {
        const pathPart = url.pathname.split('/home/')[1];
        // Handle potential URL parameters
        const cleanPath = pathPart.split('?')[0].split('#')[0];
        const path = '/' + cleanPath;
        return path;
      }
      
      // Handle shared folder URLs like https://www.dropbox.com/scl/fo/abc123/folder
      if (url.pathname.includes('/scl/fo/')) {
        const parts = url.pathname.split('/scl/fo/')[1].split('/');
        // If there's a part after the folder ID (parts[0]), use that as the path
        if (parts.length > 1) {
          const path = '/' + parts.slice(1).join('/');
          return path;
        }
      }
      
      // Handle older shared folder URLs like https://www.dropbox.com/sh/abc123/folder
      if (url.pathname.includes('/sh/')) {
        const parts = url.pathname.split('/sh/')[1].split('/');
        // If there's a part after the folder ID (parts[0]), use that as the path
        if (parts.length > 1) {
          const path = '/' + parts.slice(1).join('/');
          return path;
        }
      }
      
      // If we get here with a dropbox.com URL, try to use the pathname as is
      const path = url.pathname;
      return path;
    }
    
    // Handle direct paths with or without leading slash
    // Ensure path starts with slash for API
    const path = input.startsWith('/') ? input : '/' + input;
    return path;
  } catch (e) {
    console.error('Error converting Dropbox URL:', e);
    // If URL parsing fails, ensure the path has a leading slash
    return input.startsWith('/') ? input : '/' + input;
  }
};

// Function to validate if the folder path exists
export const checkFolderExists = async (client: Dropbox, path: string): Promise<boolean> => {
  try {
    // For root path, we know it exists
    if (path === '') {
      return true;
    }
    
    // Try to get metadata for the path to check if it exists
    await client.filesGetMetadata({ path });
    return true;
  } catch (error) {
    console.error(`Path validation error for: "${path}"`, error);
    return false;
  }
};

// Utility to list videos from a Dropbox folder
export const listVideosFromDropbox = async (accessToken: string, folderPath: string) => {
  try {
    if (!accessToken) {
      throw new Error('No Dropbox access token provided');
    }
    
    const client = getDropboxClient(accessToken);
    
    // Validate the token first by testing access to root folder
    try {
      await client.filesListFolder({ path: '' });
    } catch (authError: unknown) {
      console.error('Authentication error:', authError);
      const error = authError as { status?: number; message?: string };
      if (error?.status === 401) {
        throw new Error('Authentication failed. Your Dropbox access token may be invalid or expired.');
      }
      throw new Error(`Dropbox authentication error: ${error?.message || 'Unknown authentication issue'}`);
    }
    
    // Convert possible URL to path format
    const formattedPath = convertDropboxUrlToPath(folderPath);
    
    // For root folder, use empty string as required by Dropbox API
    const path = !formattedPath || formattedPath === '/' ? '' : formattedPath;
    
    // Get files from the requested folder
    try {
      const response = await client.filesListFolder({
        path,
        include_media_info: true, // Get video metadata when available
        include_non_downloadable_files: false // Skip files we can't download anyway
      });
    
      const entries = response.result.entries;
      
      // Filter for video files only
      const videoFiles = entries
        .filter(entry => {
          const isFile = entry['.tag'] === 'file';
          // Check for common video extensions
          const isVideo = isFile && entry.name.match(/\.(mp4|mov|m4v|avi|mkv|webm)$/i);
          return isVideo;
        });
        
      return videoFiles;
    } catch (apiError) {
      const error = apiError as { status?: number; message?: string; error?: unknown };
      console.error('Dropbox API Error:', error);
      
      // Handle specific error cases with helpful messages
      if (error?.status === 409) {
        // Path lookup error - common when folder doesn't exist
        const lookupError = (error as { error?: { error?: { '.tag'?: string; path?: { '.tag'?: string } } } })?.error?.error?.['.tag'] === 'path' && 
                           (error as { error?: { error?: { '.tag'?: string; path?: { '.tag'?: string } } } })?.error?.error?.path?.['.tag'] === 'not_found';
        
        if (lookupError) {
          // Try to get available folders to suggest alternatives
          try {
            // List the root folder to suggest alternatives
            const rootFolders = await client.filesListFolder({ path: '' });
            const availableFolders = rootFolders.result.entries
              .filter(entry => entry['.tag'] === 'folder')
              .map(entry => entry.path_display || entry.name);
            
            // If we found folders, suggest them
            if (availableFolders.length > 0) {
              throw new Error(`Folder "${path}" was not found. Available folders: ${availableFolders.join(', ')}`);
            } else {
              throw new Error(`Folder "${path}" was not found in your Dropbox account.`);
            }
          } catch {
            // If we can't suggest folders, give a general error
            throw new Error(`The folder "${path}" does not exist in your Dropbox account. Please check the path or try another folder.`);
          }
        }
        
        // General path-related error
        const pathIssue = (error as { error?: { error?: { path?: { '.tag'?: string } } } })?.error?.error?.path?.['.tag'] || 'unknown issue';
        throw new Error(`Cannot access folder: ${pathIssue}. Please verify the path is correct and you have permission to access it.`);
      }
      
      // For any other API error, use the user-friendly message if available
      throw new Error(`Dropbox error: ${(error as { error?: { error?: { user_message?: string } }; message?: string })?.error?.error?.user_message || error?.message || 'Unknown error accessing Dropbox'}`);
    }
  } catch (error) {
    const err = error as Error;
    console.error('Error listing Dropbox videos:', err);
    throw new Error(err?.message || 'Failed to access videos from Dropbox. Please check your folder path or Dropbox link.');
  }
};

// Get a temporary streaming link for a file
export const getTemporaryLink = async (accessToken: string, path: string) => {
  try {
    const client = getDropboxClient(accessToken);
    const response = await client.filesGetTemporaryLink({ path });
    
    // Dropbox temporary links sometimes have download=1 parameter which can cause issues
    // Remove it to get a streaming-friendly URL
    let link = response.result.link;
    if (link.includes('?dl=1')) {
      link = link.replace('?dl=1', '?raw=1');
    } else if (link.includes('&dl=1')) {
      link = link.replace('&dl=1', '&raw=1');
    } else if (!link.includes('raw=1')) {
      // Add raw parameter for better video streaming
      const separator = link.includes('?') ? '&' : '?';
      link = `${link}${separator}raw=1`;
    }
    
    return link;
  } catch (error) {
    console.error('Error getting temporary link:', error);
    throw error;
  }
};

// Generate a direct thumbnail preview link
// This works by using Dropbox's content API directly
export const getThumbnailLink = (path: string) => {
  // Using a direct content API approach
  return `/api/dropbox/thumbnail?path=${encodeURIComponent(path)}&t=${Date.now()}`;
};
