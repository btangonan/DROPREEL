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
      
      console.log('Dropbox thumbnail response:', {
        hasResult: !!response?.result,
        resultKeys: response?.result ? Object.keys(response.result) : [],
        path: path
      });
      
      if (!response || !response.result) {
        console.error('No thumbnail data returned from Dropbox for path:', path);
        return NextResponse.json({ error: 'Failed to get thumbnail' }, { status: 500 });
      }
      
      // Handle different response formats
      let thumbnailBinary: ArrayBuffer;
      const result = response.result as any;
      
      console.log('Processing result:', {
        type: typeof result,
        isArrayBuffer: result instanceof ArrayBuffer,
        hasFileBlob: !!result.fileBlob,
        hasFileBinary: !!result.fileBinary,
        constructor: result.constructor?.name
      });
      
      if (result.fileBlob && typeof result.fileBlob.arrayBuffer === 'function') {
        // Standard blob response
        console.log('Using fileBlob.arrayBuffer()');
        thumbnailBinary = await result.fileBlob.arrayBuffer();
      } else if (result.fileBinary) {
        // Binary response format - could be Buffer or ArrayBuffer
        console.log('Using fileBinary directly');
        if (result.fileBinary instanceof ArrayBuffer) {
          thumbnailBinary = result.fileBinary;
        } else if (Buffer.isBuffer(result.fileBinary)) {
          thumbnailBinary = result.fileBinary.buffer.slice(
            result.fileBinary.byteOffset,
            result.fileBinary.byteOffset + result.fileBinary.byteLength
          );
        } else {
          thumbnailBinary = new Uint8Array(result.fileBinary).buffer;
        }
      } else if (result instanceof ArrayBuffer) {
        // Direct ArrayBuffer
        console.log('Using result as ArrayBuffer');
        thumbnailBinary = result;
      } else if (Buffer.isBuffer(result)) {
        // Node.js Buffer
        console.log('Converting Buffer to ArrayBuffer');
        thumbnailBinary = result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength);
      } else {
        console.error('Unknown response format:', {
          type: typeof result,
          keys: Object.keys(result),
          hasBuffer: typeof result.buffer,
          constructor: result.constructor?.name
        });
        return NextResponse.json({ error: 'Unsupported response format' }, { status: 500 });
      }
      
      // Return the thumbnail as an image
      return new NextResponse(thumbnailBinary, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
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
      console.error('Error getting thumbnail for path:', path, error);
      
      // Check if it's a "preview not supported" error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('preview_not_supported') || 
          errorMessage.includes('thumbnail_not_supported') ||
          errorMessage.includes('unsupported_file')) {
        console.log('Thumbnail not supported for video file:', path);
        return NextResponse.json({ 
          error: 'Thumbnail not supported for this video format',
          code: 'PREVIEW_NOT_SUPPORTED' 
        }, { status: 422 });
      }
      
      // Return a fallback image or a 404
      return NextResponse.json({ 
        error: 'Thumbnail not available',
        details: errorMessage 
      }, { status: 404 });
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
