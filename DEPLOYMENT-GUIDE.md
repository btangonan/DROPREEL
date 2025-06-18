# DropReel Deployment Guide

A comprehensive guide for deploying the DropReel MVP to Vercel, including all the fixes and configurations required for production.

## Overview

This guide covers the complete deployment process from fixing TypeScript errors to configuring Dropbox OAuth for production. Follow these steps if you need to redeploy or set up the app in a new environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [TypeScript Errors & Build Fixes](#typescript-errors--build-fixes)
3. [Serverless Environment Fixes](#serverless-environment-fixes)
4. [Dropbox OAuth Configuration](#dropbox-oauth-configuration)
5. [Vercel Deployment](#vercel-deployment)
6. [Environment Variables](#environment-variables)
7. [Testing & Verification](#testing--verification)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js and npm installed
- Vercel account
- Dropbox Developer App configured
- GitHub repository with your code

## TypeScript Errors & Build Fixes

### Problem
The initial deployment failed due to TypeScript/ESLint errors that prevented the build from completing.

### Solution: Fix All TypeScript Errors

#### 1. Remove Unused Imports and Variables

**Files Fixed:**
- `src/app/glassmorphism-page.tsx` - Removed unused `VideoReel` import and `isLoading`/`reelCreated` variables
- `src/app/r/[id]/page.tsx` - Removed unused `Link` and `SharedVideoPlayer` imports
- `src/app/reels/page.tsx` - Removed unused `useRouter` import
- `src/components/DropboxAuth/DropboxAuth.tsx` - Removed unused `isLoading` parameter
- `src/components/ReelPreviewModal.tsx` - Removed unused imports
- `src/components/TitleEditor/TitleEditor.tsx` - Removed unused `X` import
- `src/components/FolderBrowser/FolderBrowser.tsx` - Added ESLint disable for unused function

#### 2. Replace Explicit `any` Types

**Core Principle:** Replace `any` with proper TypeScript types for better type safety.

**Examples:**
```typescript
// Before
const error: any = err;
mediaInfo?: any;
droppableContainers: Map<string, any>;

// After  
const error = err as Error;
mediaInfo?: Record<string, unknown>;
droppableContainers: Map<string, unknown>;
```

**Files Fixed:**
- `src/components/FolderBrowser/FolderBrowser.tsx`
- `src/lib/auth/dropboxAuth.ts`
- `src/hooks/useDragAndDrop.ts`
- `src/types/reel.ts`

#### 3. Fix React Quote Escaping

**Problem:** Unescaped apostrophes in JSX
```typescript
// Before
<p>You haven't created any reels yet.</p>

// After
<p>You haven&apos;t created any reels yet.</p>
```

#### 4. Fix Unused Expressions

**Problem:** Expressions that don't do anything
```typescript
// Before
thumbnailPromise; // Just sitting there

// After
void thumbnailPromise; // Explicitly void the promise
```

### Build Verification

After each fix, run:
```bash
npm run build
```

Continue until you get:
```
✓ Compiled successfully
```

## Serverless Environment Fixes

### Problem
The app was failing with "Internal Server Error" because it tried to use file-based storage (`fs.readFileSync`, `fs.writeFileSync`) in Vercel's read-only serverless environment.

### Root Cause
```typescript
// These operations fail in serverless environments:
fs.existsSync(TOKEN_PATH);
fs.readFileSync(TOKEN_PATH, 'utf8');
fs.writeFileSync(TOKEN_PATH, data);
fs.mkdirSync(CREDENTIALS_PATH);
```

### Solution: Graceful Filesystem Fallbacks

Wrapped all filesystem operations in try-catch blocks to fall back to environment variables:

#### 1. Protected File Existence Checks

```typescript
// Before
export const hasCredentials = () => {
  return fs.existsSync(TOKEN_PATH);
};

// After
export const hasCredentials = () => {
  try {
    return fs.existsSync(TOKEN_PATH);
  } catch (error) {
    console.warn('File system access not available (likely serverless environment):', error);
    return false;
  }
};
```

#### 2. Protected File Reading

```typescript
// Before
const tokenFileContent = fs.readFileSync(TOKEN_PATH, 'utf8');

// After
try {
  const tokenFileContent = fs.readFileSync(TOKEN_PATH, 'utf8');
  // ... process file
} catch (readError) {
  console.error('Error reading token file:', readError);
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
    }
  } catch (fsError) {
    console.warn('Could not clean up token file (filesystem read-only):', fsError);
  }
  return { error: 'corrupt_token' };
}
```

#### 3. Protected File Writing

```typescript
// Before
fs.mkdirSync(CREDENTIALS_PATH, { recursive: true });
fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));

// After
try {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    fs.mkdirSync(CREDENTIALS_PATH, { recursive: true });
  }
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenData, null, 2));
} catch (fsError) {
  console.warn('Could not save token to file (filesystem read-only, using environment variables instead):', fsError);
  // Continue execution - we'll rely on environment variables
}
```

### Key Files Modified
- `src/lib/auth/dropboxAuth.ts` - All filesystem operations protected

## Dropbox OAuth Configuration

### 1. Dropbox App Settings

Go to your Dropbox App Console and configure:

**Redirect URIs:**
- `http://localhost:3000/api/auth/dropbox/callback` (local development)
- `https://your-vercel-url.vercel.app/api/auth/dropbox/callback` (production)

**Permissions:**
- `files.metadata.read`
- `files.content.read`
- `files.content.write` (if needed)

### 2. Find Your Production URL

Your Vercel app URL format:
```
https://[project-name].vercel.app
```

Examples:
- `https://reel-drop.vercel.app`
- `https://dropreel-mvp.vercel.app`

### 3. Callback URI Format

```
https://[your-vercel-url]/api/auth/dropbox/callback
```

## Vercel Deployment

### 1. Initial Deployment

```bash
# If you have Vercel CLI
npm i -g vercel
vercel --prod

# Or connect via GitHub in Vercel dashboard
```

### 2. Environment Variables Setup

In Vercel Dashboard → Project → Settings → Environment Variables:

**Required Variables:**
```
DROPBOX_CLIENT_ID=your_dropbox_client_id
DROPBOX_CLIENT_SECRET=your_dropbox_client_secret  
DROPBOX_REDIRECT_URI=https://your-vercel-url.vercel.app/api/auth/dropbox/callback
```

**Optional (for testing):**
```
DROPBOX_ACCESS_TOKEN=your_long_lived_token
```

### 3. Redeploy After Environment Variables

After adding environment variables, redeploy to apply them:
- Vercel usually auto-deploys when you save environment variables
- Or manually trigger a redeploy in the Vercel dashboard

## Environment Variables

### Local Development (.env.local)

Create a `.env.local` file in your project root:

```env
DROPBOX_CLIENT_ID=your_dropbox_client_id
DROPBOX_CLIENT_SECRET=your_dropbox_client_secret
DROPBOX_REDIRECT_URI=http://localhost:3000/api/auth/dropbox/callback
DROPBOX_ACCESS_TOKEN=optional_for_testing
```

### Production (Vercel)

Set the same variables in Vercel dashboard with production URLs:

```env
DROPBOX_CLIENT_ID=your_dropbox_client_id
DROPBOX_CLIENT_SECRET=your_dropbox_client_secret
DROPBOX_REDIRECT_URI=https://your-vercel-url.vercel.app/api/auth/dropbox/callback
```

## Testing & Verification

### 1. Local Testing

```bash
# Start local development server
npm run dev

# Test at http://localhost:3000
# Verify Dropbox connection works
# Test video loading and reel creation
```

### 2. Production Testing

1. **Visit your production URL**
2. **Test Dropbox Connection** - Click "CONNECT" button
3. **Verify OAuth Flow** - Should redirect to Dropbox and back
4. **Test Video Loading** - Browse folders and load videos
5. **Test Reel Creation** - Create and save a reel
6. **Check Console Logs** - Verify no "Internal Server Error"

### 3. Debugging Production Issues

**Check Vercel Function Logs:**
1. Go to Vercel Dashboard → Project → Functions
2. Click on any API function to see logs
3. Look for errors or warnings

**Common Success Indicators:**
```
Found stored credentials, attempting to refresh if needed...
Using existing valid Dropbox access token
✓ 200 GET /api/auth/dropbox/status
✓ 200 GET /api/dropbox?action=listFolders
```

**Common Error Indicators:**
```
❌ 500 Internal Server Error
❌ File system access not available
❌ DROPBOX_CLIENT_ID not configured
```

## Troubleshooting

### Issue: "Internal Server Error" 

**Symptoms:** 500 errors on API calls
**Cause:** Filesystem operations failing in serverless environment
**Solution:** Ensure all filesystem operations are wrapped in try-catch (see [Serverless Environment Fixes](#serverless-environment-fixes))

### Issue: "Dropbox access token not configured"

**Symptoms:** 401 errors, "Please authenticate with Dropbox first"
**Cause:** Missing or incorrect environment variables
**Solution:** 
1. Check environment variables are set in Vercel
2. Verify `DROPBOX_CLIENT_ID` and `DROPBOX_CLIENT_SECRET` are correct
3. Redeploy after setting variables

### Issue: OAuth redirect fails

**Symptoms:** "OAuth error" or redirect loops
**Cause:** Incorrect redirect URI configuration
**Solution:**
1. Verify redirect URI in Dropbox app matches exactly
2. Check `DROPBOX_REDIRECT_URI` environment variable
3. Ensure production URL is correct

### Issue: Build fails with TypeScript errors

**Symptoms:** Deployment fails during build step
**Cause:** TypeScript/ESLint errors
**Solution:** Run `npm run build` locally and fix all errors (see [TypeScript Errors & Build Fixes](#typescript-errors--build-fixes))

### Issue: Videos don't load

**Symptoms:** Empty video grids, thumbnail errors
**Cause:** Authentication or API issues
**Solution:**
1. Check Dropbox token is valid
2. Verify API endpoints return 200 status
3. Check console for CORS or network errors

## File Checklist

Files that were modified for deployment:

### Core Fixes
- ✅ `src/lib/auth/dropboxAuth.ts` - Serverless filesystem protection
- ✅ `src/app/page.tsx` - Removed unused variables
- ✅ `src/app/glassmorphism-page.tsx` - Fixed TypeScript errors
- ✅ `src/app/r/[id]/page.tsx` - Removed unused imports
- ✅ `src/app/reels/page.tsx` - Fixed quote escaping and imports
- ✅ `src/components/FolderBrowser/FolderBrowser.tsx` - Fixed any types
- ✅ `src/types/reel.ts` - Replaced any with unknown
- ✅ `src/hooks/useDragAndDrop.ts` - Fixed any types

### Configuration Files
- ✅ `next.config.ts` - Clean configuration (no ESLint ignores)
- ✅ `.env.local` - Local environment variables
- ✅ Vercel dashboard - Production environment variables

## Success Criteria

Your deployment is successful when:

- ✅ Build completes without TypeScript errors
- ✅ Local development server runs without crashes
- ✅ Production app loads without "Internal Server Error"
- ✅ Dropbox OAuth flow works end-to-end
- ✅ Videos load and display correctly
- ✅ Reel creation and editing functions work
- ✅ No console errors in production

## Notes

- **Filesystem operations** will always fail in production (this is expected and handled gracefully)
- **Token storage** relies on environment variables in production
- **Authentication state** doesn't persist between sessions in serverless (users need to re-authenticate)
- **File uploads** work through Dropbox API, not local filesystem

---

*Generated for DropReel MVP deployment - Keep this guide updated if you make architectural changes*