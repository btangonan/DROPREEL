import { NextRequest, NextResponse } from 'next/server';
import { testDropboxConnection, pingDropboxAPI } from '@/lib/auth/connectionUtils';

export async function GET(request: NextRequest) {
  try {
    // Test connection to Dropbox API
    const pingResult = await pingDropboxAPI();
    
    // Test full authentication status
    const connectionStatus = await testDropboxConnection();
    
    return NextResponse.json({
      dropboxAPI: pingResult,
      connection: connectionStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error testing Dropbox connection:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
