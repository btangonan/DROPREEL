/**
 * Utility functions for handling Dropbox integration
 */

/**
 * Extracts a Dropbox folder path from a URL.
 * 
 * Handles various Dropbox URL formats including:
 * - https://www.dropbox.com/home/path/to/folder
 * - https://www.dropbox.com/scl/fo/some-id/folder-path
 * - https://www.dropbox.com/sh/share-id/folder-path
 * - Or directly provided paths like "/path/to/folder"
 * 
 * @param input A Dropbox URL or path string
 * @returns A formatted path string suitable for Dropbox API
 */
export function extractDropboxPath(input: string): string {
  if (!input) return '';
  
  // Clean up the input
  const trimmedInput = input.trim();
  
  // Check if it's a Dropbox URL
  if (trimmedInput.includes('dropbox.com')) {
    try {
      const url = new URL(trimmedInput);
      
      // Handle dropbox.com/home paths
      if (url.pathname.startsWith('/home/')) {
        return url.pathname.replace('/home', '');
      }
      
      // Handle shared folder links (these have different formats)
      if (url.pathname.includes('/scl/fo/') || url.pathname.includes('/sh/')) {
        // Extract the path after the IDs in the URL
        const pathParts = url.pathname.split('/');
        
        // If the path has enough parts (at least 4 for /scl/fo/id/path)
        if (pathParts.length >= 4) {
          // Join all parts after the ID
          return '/' + pathParts.slice(3).join('/');
        }
      }
      
      // Return the pathname as a fallback - the API will validate it
      return url.pathname;
    } catch (e) {
      console.error('Failed to parse Dropbox URL:', e);
      // If URL parsing fails, treat it as a regular path
      return formatDropboxPath(trimmedInput);
    }
  }
  
  // If it's not a URL, just format it as a path
  return formatDropboxPath(trimmedInput);
}

/**
 * Ensures a path string is properly formatted for the Dropbox API:
 * - Ensures the path starts with a slash
 * - Removes trailing slashes
 * 
 * @param path The path to format
 * @returns A formatted path
 */
export function formatDropboxPath(path: string): string {
  if (!path) return '';
  
  // Remove trailing slash if present
  const noTrailingSlash = path.endsWith('/') ? path.slice(0, -1) : path;
  
  // Ensure path starts with slash
  return noTrailingSlash.startsWith('/') ? noTrailingSlash : `/${noTrailingSlash}`;
}
