import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/auth/dropboxAuth';

export async function GET(request: NextRequest) {
  try {
    // Explicitly refresh the token
    const tokenData = await refreshAccessToken();
    
    if (tokenData && tokenData.access_token) {
      return NextResponse.json({ 
        success: true, 
        message: 'Token refreshed successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'No token available to refresh. Please authenticate first.' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to refresh token'
    }, { status: 500 });
  }
}
