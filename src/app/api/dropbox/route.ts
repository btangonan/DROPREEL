import { NextRequest, NextResponse } from 'next/server';
import { VideoFile } from '@/types';
import { nanoid } from 'nanoid';
import { getValidAccessToken } from '@/lib/auth/dropboxAuth';

// Environment variables (should be set in .env.local)

export async function GET(request: NextRequest) {
  try {
    // Get a fresh token if possible (will use the stored token if available)
    const freshToken = await getValidAccessToken();
    if (!freshToken) {
      return NextResponse.json(
        { error: 'Dropbox access token not configured or expired. Please authenticate with Dropbox first.' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const path = searchParams.get('path');
    const folderPath = searchParams.get('folderPath') || '';

    // List folders at any path
    if (action === 'listFolders') {
      try {
        const folderPathToList = searchParams.get('folderPath') || '';
        
        const dropboxModule = await import('@/lib/dropboxFetch');
        const client = dropboxModule.getDropboxClient(freshToken);
        
        // First convert any URL to a proper path
        const formattedPath = dropboxModule.convertDropboxUrlToPath(folderPathToList);
        // For root folder, use empty string as required by Dropbox API
        const path = !formattedPath || formattedPath === '/' ? '' : formattedPath;
        
        const response = await client.filesListFolder({ path });
        
        // Extract folders and organize contents into folders and files
        const contents = response.result.entries.map((entry: any) => ({
          name: entry.name,
          path: entry.path_display,
          type: entry['.tag'],
          isVideo: entry['.tag'] === 'file' && entry.name.match(/\.(mp4|mov|m4v|avi|mkv|webm)$/i) ? true : false
        }));
        
        // Sort folders first, then files
        contents.sort((a: any, b: any) => {
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (a.type !== 'folder' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name); // Alphabetical within each group
        });
        
        return NextResponse.json({
          path: formattedPath,
          contents
        });
      } catch (error: any) {
        console.error('Error listing folders:', error);
        if (error?.status === 401) {
          // Unauthorized - token expired or invalid
          return NextResponse.json({ error: 'unauthorized', message: error?.message || 'Dropbox token expired or invalid.' }, { status: 401 });
        }
        if (error?.status === 409) {
          // Path not found or access denied
          return NextResponse.json(
            { error: `Folder not found or access denied: ${folderPath}` },
            { status: 404 }
          );
        }
        // Return the actual error message and status if available
        return NextResponse.json({ error: error?.message || 'Failed to list folders', details: error }, { status: error?.status || 500 });
      }
    }

    // Search for files and folders recursively
    if (action === 'search') {
      try {
        const query = searchParams.get('query');
        const searchPath = searchParams.get('searchPath') || '';
        
        if (!query || query.trim().length < 2) {
          return NextResponse.json(
            { error: 'Search query must be at least 2 characters long' },
            { status: 400 }
          );
        }

        
        const dropboxModule = await import('@/lib/dropboxFetch');
        const client = dropboxModule.getDropboxClient(freshToken);
        
        // Format the search path
        const formattedPath = dropboxModule.convertDropboxUrlToPath(searchPath);
        const path = !formattedPath || formattedPath === '/' ? '' : formattedPath;
        
        // Use Dropbox search API
        const searchResponse = await client.filesSearchV2({
          query: query,
          options: {
            path: path,
            max_results: 100,
            file_status: 'active',
            filename_only: true
          }
        });
        
        // Process search results
        const results = searchResponse.result.matches.map((match: any) => {
          const metadata = match.metadata.metadata;
          return {
            name: metadata.name,
            path: metadata.path_display,
            type: metadata['.tag'],
            isVideo: metadata['.tag'] === 'file' && metadata.name.match(/\.(mp4|mov|m4v|avi|mkv|webm)$/i) ? true : false,
            size: metadata.size || 0,
            // Add folder path for context
            parentPath: metadata.path_display.substring(0, metadata.path_display.lastIndexOf('/')) || '/'
          };
        });
        
        
        return NextResponse.json({
          results: results,
          query: query,
          searchPath: path,
          total: results.length
        });
        
      } catch (error: any) {
        console.error('Search error:', error);
        return NextResponse.json(
          { error: error?.message || 'Search failed', details: error },
          { status: error?.status || 500 }
        );
      }
    }
    
    // Special debug action to list root folders (keeping for backward compatibility)
    if (action === 'listRoot') {
      try {
        const dropboxModule = await import('@/lib/dropboxFetch');
        
        // Get client from our utility function
        const client = dropboxModule.getDropboxClient(freshToken);
        const response = await client.filesListFolder({ path: '' });
        
        // Add proper type annotation
        
        return NextResponse.json({ 
          folders: response.result.entries.map((entry: any) => ({ 
            name: entry.name, 
            path: entry.path_display, 
            type: entry['.tag'] 
          }))
        });
      } catch (error: any) {
        console.error('Error listing root folders:', error);
        return NextResponse.json({ error: 'Failed to list root folders' }, { status: 500 });
      }
    }
    
    if (action === 'listVideos') {
      try {
        
        // Use dynamic import to avoid server-side issues with Dropbox SDK
        const { listVideosFromDropbox, getThumbnailLink } = await import('@/lib/dropboxFetch');
        
        // Verify token format (not showing full token for security)
        
        const videoEntries = await listVideosFromDropbox(freshToken, folderPath);
        
        // Convert Dropbox entries to our VideoFile format
        const videos: VideoFile[] = videoEntries.map(entry => {
          const videoPath = entry.path_display || '';
          return {
            id: nanoid(),
            name: entry.name,
            path: videoPath,
            // Only include size for file entries (not folders)
            size: (entry as any)['.tag'] === 'file' ? (entry as any).size : undefined,
            streamUrl: '',
            // Set thumbnail URL using our helper function for better caching
            thumbnailUrl: getThumbnailLink(videoPath),
            // Only include media_info if it exists
            mediaInfo: (entry as any).media_info ? (entry as any).media_info : undefined
          };
        });
        
        return NextResponse.json({ videos });
      } catch (error: any) {
        console.error('Error in listVideos:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Check for specific Dropbox error types
        if (error.status === 409) {
          return NextResponse.json(
            { error: `Folder not found: ${folderPath}. Please check that the path exists in your Dropbox account.` },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: error.message || 'Failed to list videos' },
          { status: 400 }
        );
      }
    }

    if (action === 'getStreamUrl' && path) {
      try {
        // Use dynamic import to avoid server-side issues with Dropbox SDK
        const { getTemporaryLink } = await import('@/lib/dropboxFetch');
        const url = await getTemporaryLink(freshToken, path);
        return NextResponse.json({ url });
      } catch (error: any) {
        console.error('Error getting stream URL:', error);
        return NextResponse.json(
          { error: error.message || 'Failed to get streaming URL' },
          { status: 400 }
        );
      }
    }

    if (action === 'getThumbnail' && path) {
      // For thumbnails, we'll redirect to a separate endpoint
      // that can handle the binary data
      return NextResponse.json({ 
        thumbnailUrl: `/api/dropbox/thumbnail?path=${encodeURIComponent(path)}` 
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
