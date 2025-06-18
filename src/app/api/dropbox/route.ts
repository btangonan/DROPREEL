import { NextRequest, NextResponse } from 'next/server';
import { VideoFile } from '@/types';
import { nanoid } from 'nanoid';
import { getValidAccessToken } from '@/lib/auth/dropboxAuth';

// TypeScript interfaces for Dropbox API responses
interface DropboxFileEntry {
  '.tag': 'file' | 'folder';
  name: string;
  path_display: string;
  size?: number;
  media_info?: {
    metadata?: {
      video?: {
        duration?: number;
        width?: number;
        height?: number;
      };
    };
  };
}

interface DropboxListFolderResponse {
  result: {
    entries: DropboxFileEntry[];
    cursor?: string;
    has_more: boolean;
  };
}

interface DropboxSearchMatch {
  metadata: {
    metadata: DropboxFileEntry;
  };
}

interface DropboxSearchResponse {
  result: {
    matches: DropboxSearchMatch[];
  };
}

interface DropboxError {
  status?: number;
  message?: string;
}

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
        
        const response = await client.filesListFolder({ 
          path,
          include_media_info: true // Include media info for video files
        }) as DropboxListFolderResponse;
        
        // Extract folders and organize contents into folders and files
        const contents = response.result.entries.map((entry: DropboxFileEntry) => ({
          name: entry.name,
          path: entry.path_display,
          type: entry['.tag'],
          isVideo: entry['.tag'] === 'file' && entry.name.match(/\.(mp4|mov|m4v|avi|mkv|webm)$/i) ? true : false,
          // Include media_info if it exists (for videos)
          mediaInfo: entry.media_info ? entry.media_info : undefined
        }));
        
        // Sort folders first, then files
        contents.sort((a, b) => {
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (a.type !== 'folder' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name); // Alphabetical within each group
        });
        
        return NextResponse.json({
          path: formattedPath,
          contents
        });
      } catch (error) {
        console.error('Error listing folders:', error);
        const dropboxError = error as DropboxError;
        if (dropboxError?.status === 401) {
          // Unauthorized - token expired or invalid
          return NextResponse.json({ error: 'unauthorized', message: dropboxError?.message || 'Dropbox token expired or invalid.' }, { status: 401 });
        }
        if (dropboxError?.status === 409) {
          // Path not found or access denied
          return NextResponse.json(
            { error: `Folder not found or access denied: ${folderPath}` },
            { status: 404 }
          );
        }
        // Return the actual error message and status if available
        return NextResponse.json({ error: dropboxError?.message || 'Failed to list folders', details: dropboxError }, { status: dropboxError?.status || 500 });
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
        }) as DropboxSearchResponse;
        
        // Process search results
        const results = searchResponse.result.matches.map((match: DropboxSearchMatch) => {
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
        
      } catch (error) {
        console.error('Search error:', error);
        const dropboxError = error as DropboxError;
        return NextResponse.json(
          { error: dropboxError?.message || 'Search failed', details: dropboxError },
          { status: dropboxError?.status || 500 }
        );
      }
    }
    
    // Special debug action to list root folders (keeping for backward compatibility)
    if (action === 'listRoot') {
      try {
        const dropboxModule = await import('@/lib/dropboxFetch');
        
        // Get client from our utility function
        const client = dropboxModule.getDropboxClient(freshToken);
        const response = await client.filesListFolder({ path: '' }) as DropboxListFolderResponse;
        
        return NextResponse.json({ 
          folders: response.result.entries.map((entry: DropboxFileEntry) => ({ 
            name: entry.name, 
            path: entry.path_display, 
            type: entry['.tag'] 
          }))
        });
      } catch (error) {
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
          // Create a more unique ID using both nanoid and path hash
          const pathHash = Buffer.from(videoPath).toString('base64').slice(0, 8);
          const uniqueId = `${nanoid(8)}-${pathHash}`;
          
          return {
            id: uniqueId,
            name: entry.name,
            path: videoPath,
            // Only include size for file entries (not folders)
            size: entry['.tag'] === 'file' ? entry.size : undefined,
            streamUrl: '',
            // Set thumbnail URL using our helper function for better caching
            thumbnailUrl: getThumbnailLink(videoPath),
            // Only include media_info if it exists
            mediaInfo: entry.media_info ? entry.media_info : undefined
          };
        });
        
        return NextResponse.json({ videos });
      } catch (error) {
        console.error('Error in listVideos:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        
        const dropboxError = error as DropboxError;
        // Check for specific Dropbox error types
        if (dropboxError.status === 409) {
          return NextResponse.json(
            { error: `Folder not found: ${folderPath}. Please check that the path exists in your Dropbox account.` },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: dropboxError.message || 'Failed to list videos' },
          { status: 400 }
        );
      }
    }

    if (action === 'getStreamUrl' && path) {
      try {
        // Use dynamic import to avoid server-side issues with Dropbox SDK
        const { getTemporaryLink } = await import('@/lib/dropboxFetch');
        const url = await getTemporaryLink(freshToken, path);
        return NextResponse.json({ streamUrl: url });
      } catch (error) {
        console.error('Error getting stream URL:', error);
        const dropboxError = error as DropboxError;
        return NextResponse.json(
          { error: dropboxError.message || 'Failed to get streaming URL' },
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

    if (action === 'downloadFile' && path) {
      try {
        console.log('=== DOWNLOAD DEBUG START ===');
        console.log('Download requested for path:', path);
        console.log('Time:', new Date().toISOString());
        
        // Use dynamic import to avoid server-side issues with Dropbox SDK
        const dropboxModule = await import('@/lib/dropboxFetch');
        const client = dropboxModule.getDropboxClient(freshToken);
        
        console.log('Dropbox client created, starting download...');
        const startTime = Date.now();
        
        // Download the file directly from Dropbox
        const response = await client.filesDownload({ path });
        const downloadTime = Date.now() - startTime;
        console.log(`Dropbox download completed in ${downloadTime}ms`);
        
        // Get the file blob from the response
        const fileBlob = (response.result as { fileBlob: Blob }).fileBlob;
        console.log('fileBlob type:', typeof fileBlob);
        console.log('fileBlob size:', fileBlob?.size);
        
        if (!fileBlob) {
          console.error('No file blob received from Dropbox');
          return NextResponse.json(
            { error: 'No file data received from Dropbox' },
            { status: 500 }
          );
        }
        
        // Get filename from path
        const filename = path.split('/').pop() || 'video.mp4';
        console.log('Filename:', filename);
        
        // Convert Blob to ArrayBuffer, then to Buffer
        const bufferStartTime = Date.now();
        const arrayBuffer = await fileBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const bufferTime = Date.now() - bufferStartTime;
        console.log(`Buffer creation took ${bufferTime}ms, buffer size: ${buffer.length} bytes`);
        
        console.log('=== DOWNLOAD DEBUG END ===');
        
        // Return the file as a download
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'video/mp4', // Use proper video MIME type
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length.toString(),
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        });
      } catch (error) {
        console.error('=== DOWNLOAD ERROR ===');
        console.error('Error downloading file:', error);
        const dropboxError = error as DropboxError;
        console.error('Error message:', dropboxError.message);
        console.error('Error status:', dropboxError.status);
        console.error('Error details:', JSON.stringify(dropboxError, null, 2));
        return NextResponse.json(
          { error: dropboxError.message || 'Failed to download file' },
          { status: 500 }
        );
      }
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
