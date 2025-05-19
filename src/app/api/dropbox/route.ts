import { NextRequest, NextResponse } from 'next/server';
import { VideoFile } from '@/types';
import { nanoid } from 'nanoid';
import { getValidAccessToken } from '@/lib/auth/dropboxAuth';

// Environment variables (should be set in .env.local)
console.log('ENV VARS:', {
  has_token: !!process.env.DROPBOX_ACCESS_TOKEN,
  token_length: process.env.DROPBOX_ACCESS_TOKEN?.length || 0,
  folder_path: process.env.DROPBOX_FOLDER_PATH
});

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
    console.log('Using refreshed Dropbox token');
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const path = searchParams.get('path');
    const folderPath = searchParams.get('folderPath') || '';

    // List folders at any path
    if (action === 'listFolders') {
      try {
        const folderPathToList = searchParams.get('folderPath') || '';
        console.log(`Listing folders at path: "${folderPathToList}"`);
        
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
    
    // Special debug action to list root folders (keeping for backward compatibility)
    if (action === 'listRoot') {
      try {
        console.log('Attempting to list root folders...');
        const dropboxModule = await import('@/lib/dropboxFetch');
        
        // Get client from our utility function
        const client = dropboxModule.getDropboxClient(freshToken);
        const response = await client.filesListFolder({ path: '' });
        
        // Add proper type annotation
        console.log('Root folder contents:', response.result.entries.map((entry: any) => ({ 
          name: entry.name, 
          path: entry.path_display, 
          type: entry['.tag'] 
        })));
        
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
        console.log(`API Request: listVideos with folder path: "${folderPath}"`);
        
        // Use dynamic import to avoid server-side issues with Dropbox SDK
        const { listVideosFromDropbox, getThumbnailLink } = await import('@/lib/dropboxFetch');
        
        // Verify token format (not showing full token for security)
        console.log(`Token length: ${freshToken.length}, first 10 chars: ${freshToken.substring(0, 10)}...`);
        
        const videoEntries = await listVideosFromDropbox(freshToken, folderPath);
        console.log(`Successfully fetched ${videoEntries.length} video entries from Dropbox`);
        
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
        
        console.log(`Returning ${videos.length} videos to client with thumbnails`);
        return NextResponse.json({ videos });
      } catch (error: any) {
        console.error('Error in listVideos:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        // Check for specific Dropbox error types
        if (error.status === 409) {
          console.error('Path lookup error - folder might not exist');
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
