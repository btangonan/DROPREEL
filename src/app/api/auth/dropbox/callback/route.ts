import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCode } from '@/lib/auth/dropboxAuth';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization code from the URL query
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code) {
      console.error('No code provided in callback');
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }
    
    // Exchange the code for access and refresh tokens
    const tokenData = await getTokenFromCode(code);
    
    // Set a cookie or session indicator that we're authenticated
    const response = NextResponse.redirect(new URL('/?auth=success', request.url));
    
    // Store tokens in cookies as a temporary solution for serverless environment
    if (tokenData && tokenData.access_token && tokenData.access_token !== 'obtained_but_not_file_stored') {
      response.cookies.set('dropbox_access_token', tokenData.access_token, {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax'
      });
      
      if (tokenData.refresh_token) {
        response.cookies.set('dropbox_refresh_token', tokenData.refresh_token, {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        });
      }
      
      if (tokenData.expires_at) {
        response.cookies.set('dropbox_token_expires', tokenData.expires_at.toString(), {
          maxAge: 30 * 24 * 60 * 60, // 30 days
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax'
        });
      }
    }
    
    // Set cookie to indicate successful auth (optional, for UI purposes)
    response.cookies.set('dropbox_auth_success', 'true', {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    return response;
  } catch (error) {
    // Log detailed error information
    console.error('Error in Dropbox callback:', error);
    
    // Add more information to help debug
    console.log('Dropbox Client ID:', process.env.DROPBOX_CLIENT_ID);
    console.log('Redirect URI:', process.env.DROPBOX_REDIRECT_URI);
    
    // Return detailed error in query parameter
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(new URL(`/?error=auth_failed&details=${encodeURIComponent(errorMessage)}`, request.url));
  }
}
