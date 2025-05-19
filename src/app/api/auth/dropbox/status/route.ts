import { NextRequest, NextResponse } from 'next/server';
import { testDropboxConnection } from '@/lib/auth/connectionUtils';

export async function GET(request: NextRequest) {
  try {
    // Actually test the Dropbox connection (validates token with Dropbox)
    const connection = await testDropboxConnection();
    return NextResponse.json({
      isAuthenticated: connection.connected,
      status: connection.status,
      errorCode: connection.details.errorCode,
      retryable: connection.details.retryable,
      suggestedAction: connection.details.suggestedAction,
      details: connection.details
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    return NextResponse.json({ isAuthenticated: false, status: 'unknown_error', error });
  }
}
