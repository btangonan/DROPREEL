import { NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/auth/dropboxAuth';

export async function GET() {
  try {
    // Get the authorization URL
    const authUrl = await getAuthorizationUrl();
    
    // Redirect to Dropbox authorization page
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error starting Dropbox authentication:', error);
    return NextResponse.json(
      { error: 'Failed to start Dropbox authentication' },
      { status: 500 }
    );
  }
}
