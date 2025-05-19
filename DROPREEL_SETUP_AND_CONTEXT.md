# DropReel Setup & Context

## Recent Changes (Post-Glassmorphism Snapshot)

### 2024-06-10: Dropbox Auth Reliability & Reconnect Flow Fixes
- **Critical Bug Fixed:** The app previously showed the CONNECTED button even after Dropbox session expiry, blocking users from reconnecting. This was due to the backend status endpoint only checking for a token file, not validating it with Dropbox.
- **Status Endpoint Now Validates Token:** `/api/auth/dropbox/status` now uses a real Dropbox API call to check if the token is valid. If expired/invalid, it returns `isAuthenticated: false`.
- **Frontend Reconnect Flow:** The UI now reliably shows the CONNECT button when the token is invalid/expired, allowing users to reconnect without being stuck.
- **Manual Token Reset:** You can manually invalidate the Dropbox token for testing by visiting `/api/auth/dropbox/reset` or deleting `.credentials/dropbox_token.json`.
- **Debugging Improvements:** Added more robust error handling, periodic polling, and pre-action validation for Dropbox auth state.

---

## What is DropReel?
DropReel is a modern web application for building video reels from Dropbox videos. Users can browse their Dropbox folders, select video files, and assemble a custom reel by dragging and dropping video thumbnails between two main panels: **YOUR VIDEOS** and **SELECTS**. The app is designed for a fast, intuitive, and robust video curation experience.

## Tech Stack
- **Framework:** Next.js (React, TypeScript)
- **DnD Library:** dnd-kit (`@dnd-kit/core`, `@dnd-kit/sortable`)
- **Cloud Storage:** Dropbox API (OAuth, file/folder browsing, video streaming)
- **Styling:** Tailwind CSS, custom glassmorphism CSS

## Latest UI/UX (as of latest snapshot)
- **Glassmorphism Design:** All panes and controls use a modern glassmorphism effect (blur, transparency, soft borders) for a clean, frosted look.
- **Custom Background:** The app background uses a vibrant, blurred grain image (`/public/design-assets/gradient-grain.png`).
- **No Opaque Boxes:** All video panes, buttons, and controls are transparent/glassy, letting the background show through.
- **DnD Panels:** Drag-and-drop video curation between YOUR VIDEOS and SELECTS, with a fully modernized look.

## Setup Instructions

### 1. Unzip or Clone the Project
If you have a zip file:
```sh
unzip dropreel-mvp-full-backup.zip
cd dropreel-mvp
```
If you cloned from git:
```sh
git clone <repo-url>
cd dropreel-mvp
```

### 2. Install Dependencies
```sh
npm install
```

### 3. Configure Environment Variables
- Copy `env.example` to `.env.local`:
  ```sh
  cp env.example .env.local
  ```
- Fill in your Dropbox API keys and any other required secrets in `.env.local`.

### 4. Run the App
```sh
npm run dev
```
- The app will start on [http://localhost:3000](http://localhost:3000).

### 5. Restore from Snapshot
- To restore the exact working state, unzip the latest file in `/snapshots/`:
  ```sh
  unzip snapshots/dropreel-snapshot-YYYYMMDD-HHMMSS.zip
  ```
- Replace `YYYYMMDD-HHMMSS` with the latest timestamp.

### 6. Where to Find Key Files
- **Main App Logic:** `src/app/page.tsx`
- **DnD Grid Component:** `src/components/DraggableVideoList/DndKitVideoGrid.tsx`
- **Dropbox API Logic:** `src/lib/dropboxFetch.ts`
- **Project Audit/Docs:** `DROPREEL_PROJECT_AUDIT.md`, `DROPREEL_SETUP_AND_CONTEXT.md`

## Special Notes
- **No node_modules in zip:** You must run `npm install` after unzipping.
- **No Dropbox credentials included:** You must provide your own Dropbox API keys in `.env.local`.
- **All code, assets, and documentation are included in the zip for a full restore.**
- **Glassmorphism:** All panes and controls are now glassy/transparent, and the background image is visible throughout the app.

---

_Last updated: 2024-06-10 (auth reconnect reliability snapshot)_ 