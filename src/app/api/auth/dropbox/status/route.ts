import { NextRequest, NextResponse } from 'next/server';
import { Dropbox } from 'dropbox';

export async function GET(request: NextRequest) {
  try {
    // Check for access token in cookies first (serverless-friendly)
    const accessToken = request.cookies.get('dropbox_access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json({
        isAuthenticated: false,
        status: 'no_credentials',
        errorCode: 'no_token',
        suggestedAction: 'Please connect your Dropbox account.',
        details: {
          tokenExists: false,
          errorCode: 'no_token',
          suggestedAction: 'Please connect your Dropbox account.'
        }
      });
    }
    
    // Test the token by making an API call
    try {
      const dbx = new Dropbox({ accessToken, fetch });
      const accountInfo = await dbx.usersGetCurrentAccount();
      
      return NextResponse.json({
        isAuthenticated: true,
        status: 'connected',
        errorCode: null,
        suggestedAction: null,
        details: {
          tokenExists: true,
          accountInfo: accountInfo.result
        }
      });
    } catch (apiError) {
      // Handle Dropbox API errors
      const error = apiError as Error;
      const msg = (error?.message || '').toLowerCase();
      
      if (msg.includes('unauthorized') || msg.includes('invalid_token')) {
        return NextResponse.json({
          isAuthenticated: false,
          status: 'unauthorized',
          errorCode: 'invalid_token',
          suggestedAction: 'Please reconnect your Dropbox account.',
          details: {
            tokenExists: true,
            error: error.message,
            errorCode: 'invalid_token'
          }
        });
      }
      
      return NextResponse.json({
        isAuthenticated: false,
        status: 'unknown_error',
        errorCode: 'api_error',
        suggestedAction: 'Please try reconnecting your Dropbox account.',
        details: {
          tokenExists: true,
          error: error.message
        }
      });
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({ 
      isAuthenticated: false, 
      status: 'unknown_error', 
      errorCode: 'server_error',
      suggestedAction: 'Please try again later.',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
