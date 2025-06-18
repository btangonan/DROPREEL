import { Dropbox } from 'dropbox';
// Using native Node.js fetch (available in Node 18+)
import fs from 'fs';
import path from 'path';
import { getValidAccessToken } from './dropboxAuth';

const TOKEN_PATH = path.join(process.cwd(), '.credentials', 'dropbox_token.json');

/**
 * Tests the Dropbox connection by attempting to access account info
 * Returns detailed status information about the connection
 */
export const testDropboxConnection = async (): Promise<{
  connected: boolean;
  status: 'connected' | 'token_expired' | 'network_error' | 'unauthorized' | 'rate_limited' | 'no_credentials' | 'corrupt_token' | 'refresh_failed' | 'unknown_error';
  details: {
    tokenExists: boolean;
    tokenAge?: number;
    tokenExpiry?: string;
    refreshTokenExists?: boolean;
    accountInfo?: { name?: { display_name?: string }; email?: string };
    error?: unknown;
    errorCode?: string;
    retryable?: boolean;
    suggestedAction?: string;
  }
}> => {
  try {
    const result = {
      connected: false,
      status: 'unknown_error' as 'connected' | 'token_expired' | 'network_error' | 'unauthorized' | 'rate_limited' | 'no_credentials' | 'corrupt_token' | 'refresh_failed' | 'unknown_error',
      details: {
        tokenExists: false,
        tokenAge: undefined as number | undefined,
        tokenExpiry: undefined as string | undefined,
        refreshTokenExists: undefined as boolean | undefined,
        accountInfo: undefined as { name?: { display_name?: string }; email?: string } | undefined,
        error: undefined as unknown,
        errorCode: undefined as string | undefined,
        retryable: undefined as boolean | undefined,
        suggestedAction: undefined as string | undefined,
      }
    };

    if (!fs.existsSync(TOKEN_PATH)) {
      return {
        ...result,
        status: 'no_credentials',
        details: { ...result.details, errorCode: 'no_token', suggestedAction: 'Please connect your Dropbox account.' }
      };
    }

    let tokenData;
    try {
      tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
      result.details.tokenExists = true;
    } catch (err) {
      fs.unlinkSync(TOKEN_PATH);
      return {
        ...result,
        status: 'corrupt_token',
        details: { ...result.details, error: err, errorCode: 'corrupt_token', suggestedAction: 'Please reconnect your Dropbox account.' }
      };
    }

    // Check token age
    if (tokenData.expires_at) {
      try {
        const expiryTimestamp = typeof tokenData.expires_at === 'string' 
          ? new Date(tokenData.expires_at).getTime()
          : tokenData.expires_at;
        const expiryDate = new Date(expiryTimestamp);
        result.details.tokenExpiry = expiryDate.toISOString();
        const now = Date.now();
        const tokenDuration = 4 * 60 * 60 * 1000;
        const ageInMs = Math.max(0, now - (expiryTimestamp - tokenDuration));
        result.details.tokenAge = Math.floor(ageInMs / (1000 * 60));
      } catch {
        // Ignore token age errors
      }
    }
    result.details.refreshTokenExists = !!tokenData.refresh_token;

    // Try to get a valid access token (this will refresh if needed)
    const tokenResult = await getValidAccessToken();
    if (!tokenResult || typeof tokenResult === 'string') {
      // If string, it's a valid token, continue
      if (typeof tokenResult === 'string') {
        // Test the token by making an API call
        try {
          const dbx = new Dropbox({ accessToken: tokenResult, fetch });
          const accountInfo = await dbx.usersGetCurrentAccount();
          return {
            connected: true,
            status: 'connected',
            details: { ...result.details, accountInfo: accountInfo.result }
          };
        } catch (apiError) {
          // Handle Dropbox API errors
          const error = apiError as Error;
          const msg = (error?.message || '').toLowerCase();
          if (msg.includes('rate') && msg.includes('limit')) {
            return {
              ...result,
              status: 'rate_limited',
              details: { ...result.details, error: apiError, errorCode: 'rate_limited', retryable: true, suggestedAction: 'Please wait and try again later.' }
            };
          }
          if (msg.includes('unauthorized') || msg.includes('invalid_token')) {
            fs.unlinkSync(TOKEN_PATH);
            return {
              ...result,
              status: 'unauthorized',
              details: { ...result.details, error: apiError, errorCode: 'invalid_token', retryable: false, suggestedAction: 'Please reconnect your Dropbox account.' }
            };
          }
          if (msg.includes('network') || msg.includes('timeout')) {
            return {
              ...result,
              status: 'network_error',
              details: { ...result.details, error: apiError, errorCode: 'network_error', retryable: true, suggestedAction: 'Check your connection and try again.' }
            };
          }
          return {
            ...result,
            status: 'unknown_error',
            details: { ...result.details, error: apiError, errorCode: 'unknown_error', retryable: false, suggestedAction: 'Please try reconnecting your Dropbox account.' }
          };
        }
      }
      // If not a string, it's an error object from refreshAccessToken
      if (tokenResult && typeof tokenResult === 'object' && tokenResult.error) {
        let status: typeof result.status = 'unknown_error';
        switch (tokenResult.error) {
          case 'no_token':
            status = 'no_credentials'; break;
          case 'corrupt_token':
            status = 'corrupt_token'; break;
          case 'invalid_token':
            status = 'unauthorized'; break;
          case 'rate_limited':
            status = 'rate_limited'; break;
          case 'network_error':
            status = 'network_error'; break;
          case 'refresh_failed':
            status = 'refresh_failed'; break;
        }
        return {
          ...result,
          status,
          details: { ...result.details, error: tokenResult.details, errorCode: tokenResult.error, retryable: tokenResult.retryable, suggestedAction: tokenResult.suggestedAction }
        };
      }
      // Fallback
      return {
        ...result,
        status: 'unknown_error',
        details: { ...result.details, error: tokenResult, errorCode: 'unknown_error', suggestedAction: 'Please try reconnecting your Dropbox account.' }
      };
    }

    // If we got here, the connection is working
    try {
      const dbx = new Dropbox({ accessToken: tokenResult, fetch });
      const accountInfo = await dbx.usersGetCurrentAccount();
      return {
        connected: true,
        status: 'connected',
        details: { ...result.details, accountInfo: accountInfo.result }
      };
    } catch (apiError) {
      // Handle Dropbox API errors
      const error = apiError as Error;
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('rate') && msg.includes('limit')) {
        return {
          ...result,
          status: 'rate_limited',
          details: { ...result.details, error: apiError, errorCode: 'rate_limited', retryable: true, suggestedAction: 'Please wait and try again later.' }
        };
      }
      if (msg.includes('unauthorized') || msg.includes('invalid_token')) {
        fs.unlinkSync(TOKEN_PATH);
        return {
          ...result,
          status: 'unauthorized',
          details: { ...result.details, error: apiError, errorCode: 'invalid_token', retryable: false, suggestedAction: 'Please reconnect your Dropbox account.' }
        };
      }
      if (msg.includes('network') || msg.includes('timeout')) {
        return {
          ...result,
          status: 'network_error',
          details: { ...result.details, error: apiError, errorCode: 'network_error', retryable: true, suggestedAction: 'Check your connection and try again.' }
        };
      }
      return {
        ...result,
        status: 'unknown_error',
        details: { ...result.details, error: apiError, errorCode: 'unknown_error', retryable: false, suggestedAction: 'Please try reconnecting your Dropbox account.' }
      };
    }
  } catch (error) {
    return {
      connected: false,
      status: 'unknown_error',
      details: {
        tokenExists: fs.existsSync(TOKEN_PATH),
        error,
        errorCode: 'unknown_error',
        suggestedAction: 'Please try reconnecting your Dropbox account.'
      }
    };
  }
};

/**
 * Reset the Dropbox connection by deleting the token file
 */
export const resetDropboxConnection = (): { success: boolean; message: string } => {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
      return { 
        success: true, 
        message: 'Dropbox connection reset successfully' 
      };
    }
    return { 
      success: false, 
      message: 'No Dropbox connection to reset' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to reset Dropbox connection: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Perform a basic API call to test if Dropbox API is available
 */
export const pingDropboxAPI = async (): Promise<{ available: boolean; latency?: number; status?: number }> => {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  try {
    // Test the Dropbox API availability with a HEAD request to the main API endpoint
    const response = await fetch('https://api.dropboxapi.com/2', {
      method: 'HEAD',
      signal: controller.signal
    });
    clearTimeout(timeoutId); // Clear timeout if successful
    const endTime = Date.now();
    return {
      available: response.ok || (response.status >= 400 && response.status < 500),
      latency: endTime - startTime,
      status: response.status
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('Error checking Dropbox API availability:', 
      error instanceof Error ? error.message : String(error));
    return {
      available: false,
      status: (error instanceof Error && error.name === 'AbortError') ? 408 : undefined,
      latency: Date.now() - startTime // Add latency for failures too
    };
  }
};
