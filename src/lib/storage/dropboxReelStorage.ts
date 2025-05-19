import { Dropbox } from 'dropbox';
import { v4 as uuidv4 } from 'uuid';
import { getValidAccessToken } from '@/lib/auth/dropboxAuth';
import { ReelConfig, ReelStorageResponse } from '@/types/reel';

// Constants
const REELS_FOLDER = '/DropReel_Projects';

/**
 * Ensures the base storage folder exists in Dropbox
 * @returns Promise<boolean> indicating if the folder exists/was created
 */
export async function ensureStorageFolderExists(): Promise<boolean> {
  const token = await getValidAccessToken();
  if (!token) return false;

  const dbx = new Dropbox({ accessToken: token });
  
  try {
    // Check if folder exists
    await dbx.filesGetMetadata({
      path: REELS_FOLDER,
    });
    return true;
  } catch (error) {
    // Folder doesn't exist, create it
    try {
      await dbx.filesCreateFolderV2({
        path: REELS_FOLDER,
        autorename: false,
      });
      return true;
    } catch (createError) {
      console.error('Error creating reels folder:', createError);
      return false;
    }
  }
}

/**
 * Saves a reel configuration to Dropbox
 * @param reelData The reel data to save
 * @param reelId Optional ID for the reel (generated if not provided)
 * @returns Promise with storage response
 */
export async function saveReel(
  reelData: ReelConfig, 
  reelId: string = uuidv4()
): Promise<ReelStorageResponse> {
  const token = await getValidAccessToken();
  if (!token) {
    return { 
      success: false, 
      error: 'Not authenticated with Dropbox'
    };
  }
  
  // Make sure storage folder exists
  const folderExists = await ensureStorageFolderExists();
  if (!folderExists) {
    return {
      success: false,
      error: 'Could not create storage folder in Dropbox'
    };
  }

  // Update reel metadata
  const reelToSave: ReelConfig = {
    ...reelData,
    id: reelId,
    updatedAt: new Date().toISOString(),
  };
  
  // If it's a new reel, set createdAt
  if (!reelData.createdAt) {
    reelToSave.createdAt = reelToSave.updatedAt;
  }

  const dbx = new Dropbox({ accessToken: token });
  const reelFolder = `${REELS_FOLDER}/${reelId}`;
  const configPath = `${reelFolder}/config.json`;
  const contents = JSON.stringify(reelToSave, null, 2);
  
  try {
    // Check if reel folder exists, create if needed
    try {
      await dbx.filesGetMetadata({ path: reelFolder });
    } catch (folderError) {
      await dbx.filesCreateFolderV2({
        path: reelFolder,
        autorename: false,
      });
    }
    
    // Save the configuration file
    await dbx.filesUpload({
      path: configPath,
      contents,
      mode: { '.tag': 'overwrite' },
    });
    
    return { 
      success: true, 
      path: configPath,
      message: 'Reel saved successfully'
    };
  } catch (error) {
    console.error('Error saving reel:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error saving reel'
    };
  }
}

/**
 * Loads a reel configuration from Dropbox
 * @param reelId The ID of the reel to load
 * @returns Promise with the reel data or null
 */
export async function loadReel(reelId: string): Promise<ReelConfig | null> {
  const token = await getValidAccessToken();
  if (!token) return null;
  
  const dbx = new Dropbox({ accessToken: token });
  const configPath = `${REELS_FOLDER}/${reelId}/config.json`;
  
  try {
    const response = await dbx.filesDownload({ path: configPath });
    
    // Handle Dropbox file content (it comes as a blob or file)
    // @ts-ignore - Dropbox SDK types don't fully match the actual response
    const fileBlob = response.result.fileBlob;
    
    if (fileBlob) {
      const text = await fileBlob.text();
      return JSON.parse(text) as ReelConfig;
    }
    
    // Alternative approach if fileBlob is not available
    // @ts-ignore
    const fileBuffer = response.result.fileBinary;
    if (fileBuffer) {
      return JSON.parse(fileBuffer.toString()) as ReelConfig;
    }
    
    return null;
  } catch (error) {
    console.error('Error loading reel:', error);
    return null;
  }
}

/**
 * Lists all saved reels
 * @returns Promise with array of reel data
 */
export async function listReels(): Promise<ReelConfig[]> {
  const token = await getValidAccessToken();
  if (!token) return [];
  
  const dbx = new Dropbox({ accessToken: token });
  
  try {
    // Ensure folder exists
    await ensureStorageFolderExists();
    
    // List folder contents
    const response = await dbx.filesListFolder({
      path: REELS_FOLDER,
      recursive: false,
      include_deleted: false,
    });
    
    const reelFolders = response.result.entries.filter(
      entry => entry['.tag'] === 'folder'
    );
    
    // Load each reel's config
    const reels: ReelConfig[] = [];
    
    for (const folder of reelFolders) {
      const reelId = folder.name;
      const reel = await loadReel(reelId);
      if (reel) {
        reels.push(reel);
      }
    }
    
    return reels;
  } catch (error) {
    console.error('Error listing reels:', error);
    return [];
  }
}

/**
 * Deletes a reel from Dropbox
 * @param reelId The ID of the reel to delete
 * @returns Promise with deletion status
 */
export async function deleteReel(reelId: string): Promise<ReelStorageResponse> {
  const token = await getValidAccessToken();
  if (!token) {
    return { success: false, error: 'Not authenticated with Dropbox' };
  }
  
  const dbx = new Dropbox({ accessToken: token });
  const reelFolder = `${REELS_FOLDER}/${reelId}`;
  
  try {
    await dbx.filesDeleteV2({ path: reelFolder });
    return { 
      success: true, 
      message: 'Reel deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting reel:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error deleting reel'
    };
  }
}
