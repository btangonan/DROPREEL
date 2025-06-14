import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth/dropboxAuth';

// Log environment variables for debugging

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Use the latest valid access token (refresh if needed)
    const DROPBOX_ACCESS_TOKEN = await getValidAccessToken();
    if (!DROPBOX_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Dropbox access token not configured or invalid. Please authenticate with Dropbox first.' },
        { status: 500 }
      );
    }

    try {
      // Import the Dropbox client dynamically
      const { Dropbox } = await import('dropbox');
      
      // Create a new client for this request
      const client = new Dropbox({ 
        accessToken: DROPBOX_ACCESS_TOKEN,
        fetch: (url: RequestInfo, init?: RequestInit) => fetch(url, init)
      });
      
      // Directly generate a thumbnail
      const response = await client.filesGetThumbnail({
        path,
        format: { '.tag': 'jpeg' },
        size: { '.tag': 'w256h256' },
        mode: { '.tag': 'fitone_bestfit' }
      });
      
      if (!response || !response.result) {
        console.error('No thumbnail data returned from Dropbox');
        return NextResponse.json({ error: 'Failed to get thumbnail' }, { status: 500 });
      }
      
      // Convert the file blob to an array buffer and return it directly
      const thumbnailBinary = await (response.result as any).fileBlob.arrayBuffer();
      
      // Return the thumbnail as an image
      return new NextResponse(thumbnailBinary, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
        },
      });
      
      /* Alternative approach if temporary links don't work well for thumbnails:
      const response = await client.filesGetThumbnail({
        path,
        format: { '.tag': 'jpeg' },
        size: { '.tag': 'w640h480' }
      });
      
      const buffer = await response.result.fileBlob.arrayBuffer();
      
      // Return the thumbnail as an image
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
        },
      });
      */
    } catch (error) {
      console.error('Error getting thumbnail:', error);
      
      // Return a fallback image or a 404
      return NextResponse.json({ error: 'Thumbnail not available' }, { status: 404 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
