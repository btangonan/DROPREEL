# DropReel: Project Status and Roadmap

## Current Status: Enhanced MVP

We've successfully built an enhanced MVP of DropReel with these capabilities:

1. **Video Management**
   - Interactive Dropbox folder browser for selecting video locations
   - Support for pasting Dropbox links as folder paths
   - Creating reels with multiple videos from any folder
   - Video player with fully functional controls
   - Support for various video formats (with exception of professional codecs like ProRes)

2. **Reel Features**
   - Creating reels with videos from Dropbox
   - Adding basic metadata (title, description)
   - Including director information 
   - Viewing reels through unique URLs
   - Editing existing reels
   - Deleting reels

3. **UI Components**
   - Intuitive navigation with arrow controls
   - Responsive video player
   - Thumbnail previews for videos
   - Folder browser with improved text legibility
   - Clean, simple design language with consistent text contrast
   - Robust error handling for fetch operations

## Technical Architecture

### Frontend
- **Framework**: Next.js (App Router)
- **UI**: React with Tailwind CSS
- **Video Player**: Video.js with custom controls
- **State Management**: React hooks and context

### Backend
- **API Routes**: Next.js API routes
- **Dropbox Integration**: Enhanced wrapper around Dropbox API with path extraction utilities
- **Folder Browsing**: Custom implementation for browsing Dropbox folder structures
- **Data Storage**: Local JSON file storage (reels.json)
- **Authentication**: None currently (shared Dropbox token)

### Data Flow
1. Dropbox access using a global token stored in .env.local
2. API routes proxy requests to Dropbox for folders, videos and thumbnails
3. Interactive folder selection via browser or direct link input
4. Reels are stored as JSON objects in a local file
5. Unique IDs generated for each reel for shareable URLs

## Recent Enhancements (May 2025)

### 1. Dropbox Folder Browser
- Interactive UI for browsing Dropbox folder structure
- Select videos from any folder in Dropbox
- Support for navigating between folders with breadcrumb navigation
- Improved text contrast for better legibility
- Robust error handling for API requests

### 2. Flexible Path Input
- Support for pasting direct Dropbox links as folder paths
- Automatic extraction of folder paths from shared Dropbox URLs
- Format normalization to ensure compatibility

### 3. UI Improvements
- Enhanced text legibility throughout the application
- Black text instead of light gray for better contrast
- Improved folder and file icons for better visibility
- Consistent text styling across all components

## Path to Production

### 1. User Authentication
- Implement NextAuth.js for authentication
- Support multiple providers (Dropbox OAuth, Google, email/password)
- Create user profiles with basic information
- Implement secure session management

### 2. Per-User Dropbox Integration
- Move from shared token to per-user OAuth flow
- Store user Dropbox tokens securely in database
- Create scoped API requests that use individual tokens
- Add UI for connecting/disconnecting Dropbox accounts

### 3. Database Implementation
- Replace JSON files with a proper database
  - Options: PostgreSQL, MongoDB, or Prisma with SQL
- Create schema for users, reels, and relationships
- Implement migration strategy from existing JSON data
- Add proper indexing for performance

### 4. Enhanced Privacy & Sharing
- Make reels private by default
- Add explicit sharing controls (public/private/password-protected)
- Implement permission checks on all API endpoints
- Create UI for managing sharing settings

### 5. Production Infrastructure
- Deploy to Vercel or similar platform
- Set up CI/CD pipeline for automated testing and deployment
- Configure proper environment variables for each environment
- Implement monitoring and error tracking (Sentry, LogRocket)

### 6. Video Processing Enhancements
- Add server-side transcoding for unsupported formats (like ProRes)
- Implement adaptive bitrate streaming for better playback experience
- Add video compression for faster loading
- Create video thumbnail generation service

### 7. Advanced Features
- Collaborative editing of reels
- Comments and feedback on reels
- Analytics for reel creators
- Custom branding options
- Embedding reels on external sites

## Implementation Roadmap

### Phase 1: Authentication & User Management
1. Set up NextAuth.js with Dropbox OAuth provider
2. Create user database schema and migrations
3. Implement login/signup flow and UI
4. Add user profile management

### Phase 2: Database Migration
1. Set up database connection (Prisma or similar ORM)
2. Create schema for reels and related entities
3. Write migration script from JSON to database
4. Update all API endpoints to use database

### Phase 3: Per-User Dropbox Integration
1. Modify Dropbox API wrapper for per-user tokens
2. Create UI for connecting Dropbox accounts
3. Implement token storage and refresh logic
4. Update video browsing to use individual tokens

### Phase 4: Enhanced Sharing & Privacy
1. Add privacy controls to reel schema
2. Implement permission checking middleware
3. Create sharing UI with different options
4. Add password protection for private reels

### Phase 5: Production Deployment
1. Set up Vercel project and environments
2. Configure database connection for production
3. Set up proper environment variables
4. Implement monitoring and error handling

### Phase 6: Advanced Features
1. Add video transcoding service
2. Implement adaptive streaming
3. Add analytics for reel creators
4. Enable embedding and external sharing

## Technology Stack Recommendations

### Frontend
- Continue with Next.js and React
- Add state management with Zustand or Redux Toolkit for more complex state
- Enhance UI with Headless UI or Radix UI components
- Improve form handling with React Hook Form

### Backend
- NextAuth.js for authentication
- Prisma ORM for database access
- AWS S3 or similar for video file storage
- FFmpeg for video processing (possibly via API service)

### Database
- PostgreSQL for relational data
- Redis for caching and session management
- Consider MongoDB if flexible schema is preferred

### Infrastructure
- Vercel for hosting and serverless functions
- AWS S3 for static assets
- GitHub Actions for CI/CD
- Sentry for error tracking

## Purpose of the App (DropReel)

DropReel is designed to let users create, manage, and share custom video "reels" (playlists) using video files stored in their Dropbox accounts.

Users can:
- Connect their Dropbox account
- Browse/select videos from their Dropbox
- Arrange, preview, and save reels (collections of videos)
- Share reels via unique links
- Edit or delete their own reels

## How It Would Work as a Real Online App with User Sign-In

### 1. User Authentication
- Users sign in with Dropbox (OAuth2) or another auth provider (e.g., Google, email/password)
- Each user has their own account and session

### 2. Per-User Dropbox Integration
- After sign-in, each user connects their own Dropbox account via OAuth
- The app stores a secure, per-user Dropbox access token (never shared between users)
- The app only accesses the user's own Dropbox files

### 3. Reel Creation and Management
- Users browse their Dropbox videos in the app
- Users select, order, and save videos as a "reel"
- Reels are stored in a database, associated with the user's account
- Users can view, edit, or delete only their own reels

### 4. Sharing
- Each reel has a unique, shareable URL
- Anyone with the link can view the reel (read-only), but only the owner can edit/delete

### 5. Backend and Database
- Use a real database (e.g., PostgreSQL, MongoDB, or Firebase) to store user accounts, reels, and metadata
- No more flat JSON files for persistence

### 6. Security and Privacy
- Users cannot see or access other users' Dropbox files or reels
- All Dropbox API calls are made with the user's own access token

### 7. Hosting and Deployment
- Deploy the app to a cloud platform (e.g., Vercel, Netlify, AWS, GCP)
- Use HTTPS for all traffic
- Set up environment variables for Dropbox API keys, database credentials, etc.

## User Flow Example
1. User visits the app
2. User clicks "Sign in with Dropbox"
3. User is redirected to Dropbox, grants access, and is redirected back
4. User browses their Dropbox videos in the app
5. User creates a reel, arranges videos, and saves it
6. User can view, edit, or delete their own reels
7. User shares a reel via a public link
8. Other users can view the shared reel, but only the owner can edit

## Summary Table: Current vs Production-Ready
| Feature | Current Enhanced MVP | Production-Ready App |
|------------------------|--------------------|-------------------------------------|
| User Auth | None | Dropbox OAuth (or other) |
| Dropbox Access | Shared token | Per-user token |
| Folder Selection | Interactive browser + links | Same + favorites/history |
| Reel Storage | JSON file | Database, per-user |
| Privacy | None (all public) | User-specific, private by default |
| Sharing | All reels public | Only owner can edit/delete |
| Hosting | Local/dev only | Deployed, HTTPS, env vars |
| UI | Improved text contrast | Responsive, accessible design |
