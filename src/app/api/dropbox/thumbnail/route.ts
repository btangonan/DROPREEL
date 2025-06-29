import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken } from '@/lib/auth/dropboxAuth';

// Helper function to get access token from cookies (serverless-friendly)
function getAccessTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get('dropbox_access_token')?.value || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Try to get token from cookies first (serverless-friendly)
    let DROPBOX_ACCESS_TOKEN = getAccessTokenFromCookies(request);
    
    // Fall back to file-based token if no cookie
    if (!DROPBOX_ACCESS_TOKEN) {
      DROPBOX_ACCESS_TOKEN = await getValidAccessToken();
    }
    if (!DROPBOX_ACCESS_TOKEN) {
      return NextResponse.json(
        { error: 'Dropbox access token not configured or invalid. Please authenticate with Dropbox first.' },
        { status: 500 }
      );
    }

    try {
      // Use direct Dropbox API instead of SDK to avoid serverless issues
      const apiUrl = 'https://content.dropboxapi.com/2/files/get_thumbnail';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DROPBOX_ACCESS_TOKEN}`,
          'Content-Type': 'text/plain',
          'Dropbox-API-Arg': JSON.stringify({
            path: path,
            format: 'jpeg',
            size: 'w256h256',
            mode: 'fitone_bestfit'
          })
        }
      });
      
      console.log('Direct API response:', {
        status: response.status,
        ok: response.ok,
        contentType: response.headers.get('content-type'),
        path: path
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dropbox API error:', response.status, errorText);
        
        if (response.status === 409) {
          return NextResponse.json({ 
            error: 'Thumbnail not supported for this video format',
            code: 'PREVIEW_NOT_SUPPORTED' 
          }, { status: 422 });
        }
        
        return NextResponse.json({ 
          error: 'Failed to get thumbnail',
          details: errorText 
        }, { status: response.status });
      }
      
      // Get the binary data
      const thumbnailBinary = await response.arrayBuffer();
      
      console.log('Successfully got thumbnail:', {
        size: thumbnailBinary.byteLength,
        path: path
      });
      
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
