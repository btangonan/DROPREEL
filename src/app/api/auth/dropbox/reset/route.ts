import { NextResponse } from 'next/server';
import { resetDropboxConnection } from '@/lib/auth/connectionUtils';

export async function GET() {
  try {
    // Reset the Dropbox connection
    const result = resetDropboxConnection();
    
    return NextResponse.json({
      ...result,
      message: result.success 
        ? 'Dropbox connection reset successfully. You will need to reconnect.'
        : `Failed to reset: ${result.message}`
    });
  } catch (error) {
    console.error('Error resetting Dropbox connection:', error);
    return NextResponse.json({
      success: false,
      message: 'Error resetting Dropbox connection',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
