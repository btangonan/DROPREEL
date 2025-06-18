import { Dropbox, DropboxAuth } from 'dropbox';
// Using native Node.js fetch (available in Node 18+)
import fs from 'fs';
import path from 'path';

const CREDENTIALS_PATH = path.join(process.cwd(), '.credentials');
const TOKEN_PATH = path.join(CREDENTIALS_PATH, 'dropbox_token.json');

// Dropbox App credentials
// These should be moved to environment variables in production
const CLIENT_ID = process.env.DROPBOX_CLIENT_ID || '';
const CLIENT_SECRET = process.env.DROPBOX_CLIENT_SECRET || '';
const REDIRECT_URI = process.env.DROPBOX_REDIRECT_URI || 'http://localhost:3000/api/auth/dropbox/callback';

// Initialize the Dropbox SDK with app credentials
const getAuthClient = () => {
  const dbxAuth = new DropboxAuth({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    fetch: fetch as any, // Provide fetch implementation to Dropbox SDK
  });
  
  return dbxAuth;
};

// Get the authorization URL for the initial OAuth flow
export const getAuthorizationUrl = (): Promise<string> => {
  const dbxAuth = getAuthClient();
  console.log('Generating authorization URL with PKCE disabled');
  // The SDK returns a Promise<string>
  return dbxAuth.getAuthenticationUrl(
    REDIRECT_URI,
    undefined, // state
    'code', // responseType
    'offline', // tokenAccessType for refresh tokens
    undefined, // scope
    undefined, // includeGrantedScopes
    false // usePKCE - disabled to troubleshoot token exchange issues
  ).then(url => {
    // Ensure we always return a string
    console.log('Generated auth URL (hiding sensitive parts):', url.toString().replace(/client_id=[^&]+/, 'client_id=HIDDEN'));
    return url.toString();
  });
};

// Exchange the authorization code for access and refresh tokens
export const getTokenFromCode = async (code: string) => {
  try {
    console.log('Starting OAuth token exchange process...');
    console.log('Code received from Dropbox:', code ? '(valid code present)' : '(no code)');
    console.log('Using redirect URI:', REDIRECT_URI);
    console.log('Client ID configured:', CLIENT_ID ? '(valid ID present)' : '(missing)');
    console.log('Client Secret configured:', CLIENT_SECRET ? '(valid secret present)' : '(missing)');
    
    // Initialize Dropbox auth client
    const dbxAuth = getAuthClient();
    
    // Log we're about to make the request
    console.log('Attempting to exchange code for tokens...');
    
    try {
      // Make token exchange request - this is where most errors happen
      const response = await dbxAuth.getAccessTokenFromCode(REDIRECT_URI, code);
      console.log('Received response from Dropbox token endpoint');
      
      // Log response structure (without sensitive data)
      console.log('Response structure:', JSON.stringify(Object.keys(response), null, 2));
      
      // Cast response to expected type
      const result = response as unknown as { 
        result: { 
          access_token: string; 
          refresh_token: string; 
          expires_in: number;
        } 
      };
      
      // Validate the response contains the expected fields
      if (!result.result?.access_token) {
        throw new Error('Response did not contain access_token');
      }
      
      // Save tokens to file
      const tokenData = {
        access_token: result.result.access_token,
        refresh_token: result.result.refresh_token,
        expires_at: Date.now() + (result.result.expires_in * 1000),
      };
      
      console.log('Token data processed successfully');
      
      // Ensure credentials directory exists
      if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.log('Creating credentials directory:', CREDENTIALS_PATH);
        fs.mkdirSync(CREDENTIALS_PATH, { recursive: true });
      }
      
      // Write token data to file
      console.log('Saving tokens to:', TOKEN_PATH);
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
      
      // Update environment variables
      process.env.DROPBOX_ACCESS_TOKEN = tokenData.access_token;
      
      console.log('OAuth token exchange completed successfully');
      return tokenData;
    } catch (rawError) {
      const exchangeError = rawError as Error;
      console.error('Error during token exchange:', exchangeError);
      throw new Error(`Token exchange failed: ${exchangeError.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Error getting token from code:', error);
    throw error;
  }
};

// Refresh the access token when it expires
export const refreshAccessToken = async () => {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 500; // ms
  let attempt = 0;
  let lastError: any = null;

  // Helper to delay with exponential backoff
  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  while (attempt < MAX_RETRIES) {
    try {
      // Check if token file exists
      if (!fs.existsSync(TOKEN_PATH)) {
        console.error('No token file found. Please authenticate with Dropbox first.');
        return { error: 'no_token', retryable: false, suggestedAction: 'Please connect your Dropbox account.' };
      }

      let tokenData;
      try {
        // Read token data from file
        const tokenFileContent = fs.readFileSync(TOKEN_PATH, 'utf8');
        tokenData = JSON.parse(tokenFileContent);
        // Validate token data structure
        if (!tokenData.access_token || !tokenData.refresh_token) {
          console.error('Token file is missing required fields. Deleting corrupted token file.');
          fs.unlinkSync(TOKEN_PATH);
          return { error: 'corrupt_token', retryable: false, suggestedAction: 'Please reconnect your Dropbox account.' };
        }
      } catch (readError) {
        console.error('Error reading token file:', readError);
        fs.existsSync(TOKEN_PATH) && fs.unlinkSync(TOKEN_PATH);
        return { error: 'corrupt_token', retryable: false, suggestedAction: 'Please reconnect your Dropbox account.' };
      }

      // Check if token is expired or will expire soon (within 5 minutes)
      const isExpired = Date.now() >= (tokenData.expires_at - 5 * 60 * 1000);
      if (!isExpired && tokenData.access_token) {
        console.log('Using existing valid Dropbox access token');
        return tokenData;
      }

      // Token is expired, refresh it
      console.log('Refreshing Dropbox access token...');
      const dbxAuth = getAuthClient();
      try {
        const response = await dbxAuth.refreshAccessToken(tokenData.refresh_token);
        const result = response as unknown as {
          result: {
            access_token: string;
            refresh_token?: string;
            expires_in: number;
          }
        };
        const newTokenData = {
          access_token: result.result.access_token,
          refresh_token: result.result.refresh_token || tokenData.refresh_token,
          expires_at: Date.now() + (result.result.expires_in * 1000),
          last_refresh: new Date().toISOString()
        };
        try {
          if (!fs.existsSync(CREDENTIALS_PATH)) {
            fs.mkdirSync(CREDENTIALS_PATH, { recursive: true });
          }
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(newTokenData, null, 2));
          console.log('Dropbox token refreshed and saved successfully.');
        } catch (saveError) {
          console.error('Error saving refreshed token:', saveError);
        }
        return newTokenData;
      } catch (refreshError: any) {
        lastError = refreshError;
        const msg = (refreshError?.message || '').toLowerCase();
        // Permanent errors: invalid_grant, unauthorized, etc.
        if (msg.includes('invalid_grant') || msg.includes('unauthorized') || msg.includes('invalid_token')) {
          console.error('Permanent token error, deleting token file:', msg);
          fs.existsSync(TOKEN_PATH) && fs.unlinkSync(TOKEN_PATH);
          return { error: 'invalid_token', retryable: false, suggestedAction: 'Please reconnect your Dropbox account.' };
        }
        // Rate limit
        if (msg.includes('rate') && msg.includes('limit')) {
          return { error: 'rate_limited', retryable: true, suggestedAction: 'Please wait and try again later.' };
        }
        // Network or retryable errors
        if (msg.includes('network') || msg.includes('timeout') || msg.includes('5')) {
          attempt++;
          if (attempt < MAX_RETRIES) {
            const wait = BASE_DELAY * Math.pow(2, attempt);
            console.warn(`Network error, retrying in ${wait}ms (attempt ${attempt})...`);
            await delay(wait);
            continue;
          }
          return { error: 'network_error', retryable: true, suggestedAction: 'Check your connection and try again.' };
        }
        // Unknown error
        return { error: 'unknown_error', retryable: false, suggestedAction: 'Please try reconnecting your Dropbox account.' };
      }
    } catch (error) {
      lastError = error;
      attempt++;
      if (attempt < MAX_RETRIES) {
        const wait = BASE_DELAY * Math.pow(2, attempt);
        console.warn(`Error in refreshAccessToken, retrying in ${wait}ms (attempt ${attempt})...`);
        await delay(wait);
        continue;
      }
      break;
    }
  }
  // If we get here, all retries failed
  return { error: 'refresh_failed', retryable: false, suggestedAction: 'Please reconnect your Dropbox account.', details: lastError };
};

// Get valid access token (refresh if needed)
export const getValidAccessToken = async () => {
  try {
    // First try to get token from file-based storage (most secure & updated source)
    if (hasCredentials()) {
      console.log('Found stored credentials, attempting to refresh if needed...');
      const tokenData = await refreshAccessToken();
      if (tokenData?.access_token) {
        return tokenData.access_token;
      }
    }
    
    // Only fall back to environment variable as a last resort (not recommended for production)
    const envToken = process.env.DROPBOX_ACCESS_TOKEN;
    if (envToken) {
      console.warn('Using access token from environment variables. This is not recommended for production.');
      return envToken;
    }
    
    // No valid token available
    console.warn('No valid Dropbox access token available. User needs to authenticate.');
    return null;
  } catch (error) {
    console.error('Failed to get valid access token:', error);
    return null;
  }
};

// Check if we have credentials
export const hasCredentials = () => {
  return fs.existsSync(TOKEN_PATH);
};
