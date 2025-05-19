# DropReel Setup & Context

## Recent Changes (Post-Glassmorphism Snapshot)

### 2025-05-18: Codebase Audit & Architecture Review
- **Code Organization:** Implemented a clean separation of concerns with dedicated directories for components, lib, and API routes
- **Type Safety:** Enhanced type definitions throughout the application for better developer experience
- **Error Handling:** Improved error boundaries and user feedback for all major operations
- **Performance:** Optimized video loading with lazy loading and proper cleanup of resources
- **Accessibility:** Enhanced keyboard navigation and ARIA attributes for better screen reader support

### 2024-06-13: Popout Video Player Focus & Accessibility Improvements, Custom Controls Plan
- **Focus Management:** The popout video player now aggressively manages focus, refocusing the overlay or video after any blur/focusout event, and includes a visually hidden close button for accessibility.
- **ESC Handling:** A global window-level ESC handler is used, and the overlay/video is always focusable. ESC-to-close is now robust in most cases, but due to browser limitations with native video controls, it may not work 100% of the time after interacting with certain controls (e.g., progress bar).
- **Browser Limitation:** This is a known limitation of browser-managed shadow DOM for native controls; no JavaScript or global shortcut library can fully overcome it.
- **Planned:** In Phase 2 or 3, we will implement custom video controls (using a React library or custom UI) to guarantee full keyboard accessibility and ESC reliability.

### 2024-06-13: Animated Popout Video Player (Finder-style)
- **Popout Video Player:** Clicking the play button on a video thumbnail now animates a floating video player that emerges from the thumbnail's position, mimicking Mac OS Finder's preview.
- **Local Backdrop:** The popout player uses a subtle, local blurred/transparent backdrop just behind the video, not a full-page overlay. The rest of the page remains visible but is not interactive while the player is open.
- **Interaction:** Clicking anywhere outside the player or pressing ESC closes the popout. Clicking the video area (outside the progress bar/controls) toggles play/pause. Clicking the progress bar works as expected for seeking.
- **Vertical Alignment:** The popout is now vertically aligned with the YOUR VIDEOS panel for a more natural feel.
- **UX Polish:** All pointer events and overlays are tuned so that only the player and its controls are interactive while open, and the rest of the page is blocked.

### 2024-06-13: Play Button & Drag Handle Zone Fix, Next Steps
- **Play Button Fix:** Clicking the play button on a video thumbnail now reliably starts video playback. The play button is no longer interfered with by drag-and-drop events.
- **Drag Handle Zone:** The drag handle for drag-and-drop now covers the entire grid item except for the play button area. This ensures that dragging can be started from anywhere except the play button, and clicking the play button will never trigger a drag.
- **User Experience:** This change makes the video grid much more intuitive and user-friendly, especially on touch devices and for quick interactions.
- **Next Steps:** Implement the pop-out video effect so that when a user clicks the play button, the video smoothly enlarges and hovers above the page, emerging from the thumbnail (not a modal, but a floating overlay with animation and focus).

### 2024-06-11: OAuth2 & Dropbox Connection Robustness, Error Handling, and UI Feedback
- **Granular Error Handling:** Dropbox OAuth2 and connection logic now returns detailed error states (e.g., `no_credentials`, `token_expired`, `network_error`, `rate_limited`, etc.) and actionable suggestions to the frontend.
- **Retry & Backoff:** Token refresh logic now retries transient errors (network, 5xx) with exponential backoff, and differentiates between retryable and permanent errors.
- **Corrupt/Invalid Token Handling:** Corrupted or invalid token files are automatically deleted, prompting a clean re-auth flow.
- **Frontend User Feedback:** The UI now displays clear, actionable error messages and suggestions when Dropbox connection issues occur, including error codes and retry hints.
- **Status Endpoint:** `/api/auth/dropbox/status` returns full connection diagnostics, not just a boolean.
- **DnD Consolidation:** All usage of `react-beautiful-dnd` and legacy components has been removed; only `dnd-kit` is used for drag-and-drop.
- **Reliability:** Improved health checks, error boundaries, and user-facing recovery options for Dropbox connection issues.

### 2024-06-10: Dropbox Auth Reliability & Reconnect Flow Fixes
- **Critical Bug Fixed:** The app previously showed the CONNECTED button even after Dropbox session expiry, blocking users from reconnecting. This was due to the backend status endpoint only checking for a token file, not validating it with Dropbox.
- **Status Endpoint Now Validates Token:** `/api/auth/dropbox/status` now uses a real Dropbox API call to check if the token is valid. If expired/invalid, it returns `isAuthenticated: false`.
- **Frontend Reconnect Flow:** The UI now reliably shows the CONNECT button when the token is invalid/expired, allowing users to reconnect without being stuck.
- **Manual Token Reset:** You can manually invalidate the Dropbox token for testing by visiting `/api/auth/dropbox/reset` or deleting `.credentials/dropbox_token.json`.
- **Debugging Improvements:** Added more robust error handling, periodic polling, and pre-action validation for Dropbox auth state.

### 2024-06-12: Glassmorphism Step Logic, Panel Feedback, and Actionable UI
- **Step Highlighting:** CONNECT, ADD VIDEOS, and SELECTS now use glassy blue (pulse) and green (solid) backgrounds to visually guide the user through the required steps.
- **Consistent Glassmorphism:** All step buttons and panels use backdrop blur, semi-transparent color, border, and shadow for a modern glass look.
- **Persistent Auth Button:** The CONNECT/CONNECTED button never flashes a loading message, providing a stable, non-jarring experience.
- **Panel Feedback:** SELECTS panel now visually indicates when it is the next required step (blinking blue) or complete (solid green).
- **Planned:** PREVIEW REEL button will become actionable, with logic to show "MAKE REEL" on first use and allow navigation to the reel page for preview/editing.
- **UI Consistency:** All major interactive elements now have clear, consistent feedback and accessibility.

### 2024-06-14: Drag-and-Drop Double Imagery Fix & Slick UX
- **No More Double Imagery:** When dragging a video thumbnail, the original grid item is now hidden, so only the overlay follows the cursor. This eliminates the "ghosting" effect and creates a modern, professional drag-and-drop experience.
- **dnd-kit Best Practice:** This approach follows dnd-kit best practices for sortable grids and overlays.
- **Implementation:** The fix was applied by setting `visibility: hidden` on the grid item being dragged, using the `isDragging` state from `useSortable`.
- **Result:** The drag-and-drop experience is now visually slick, intuitive, and production-ready.

### 2025-05-15: Codebase Audit & Next Steps
- **DnD Implementation Issues:** Found inconsistencies with mixed drag-and-drop libraries (`dnd-kit` and `react-beautiful-dnd`). Need to standardize on `dnd-kit` and remove legacy components.
- **Incomplete Glassmorphism UI:** Current implementation is partial, requiring full implementation across all components.
- **Missing Core Features:** "ADD TITLE HERE" section needs to be made editable, "THEME (MENU)" and "PREVIEW REEL" functionality needs implementation.
- **Development Roadmap Status:** Phase 1 is complete, Phase 2 is in progress, and Phase 3 is pending.

### Homepage (page.tsx) - MAKE REEL Button
- The homepage now features a **blue 'MAKE REEL' button** in the bottom right.
- The button is **enabled only when Dropbox is connected and at least one video is in the SELECTS panel**.
- When pressed, it creates a new reel with the selected videos and navigates to `/r/[id]` for the new reel.
- The button was previously labeled 'PREVIEW REEL' and was not pressable due to logic in `page.tsx`.
- The fix was made by editing only `page.tsx` (not `glassmorphism-page.tsx`), ensuring all other homepage logic and layout remain unchanged.
- The title row remains 'ADD TITLE HERE' as intended.

### Context
- The homepage is built with a modern glassmorphism UI, dnd-kit for drag-and-drop, and robust Dropbox OAuth2 integration.
- The workflow is: Connect to Dropbox → Add Videos → Add Title → Drag-and-Drop → MAKE REEL.
- All step-driven UI, feedback, and error handling remain as previously designed.

---

## What is DropReel?
DropReel is a modern web application for building video reels from Dropbox videos. Users can browse their Dropbox folders, select video files, and assemble a custom reel by dragging and dropping video thumbnails between two main panels: **YOUR VIDEOS** and **SELECTS**. The app is designed for a fast, intuitive, and robust video curation experience.

## Tech Stack
- **Frontend Framework:**
  - Next.js 13+ with App Router
  - React 18+ with TypeScript
  - Tailwind CSS for styling with custom glassmorphism theme
  - Framer Motion for animations

- **State Management & Data Fetching:**
  - React Context API for global state
  - Custom hooks for data fetching and state management
  - SWR for efficient data revalidation

- **Drag & Drop:**
  - @dnd-kit/core - Core drag-and-drop functionality
  - @dnd-kit/sortable - Sortable list components
  - @dnd-kit/modifiers - Custom drag behaviors

- **Cloud Integration:**
  - Dropbox API v2 with OAuth 2.0
  - Server-side token management
  - Secure credential storage

- **UI Components:**
  - Custom glassmorphism design system
  - Responsive layout components
  - Accessible form controls and modals

- **Development Tools:**
  - TypeScript for type safety
  - ESLint and Prettier for code quality
  - Husky for Git hooks
  - Jest and React Testing Library for testing

## Latest UI/UX (as of 2025-05-18)

### Core Interaction Patterns
- **Glassmorphism Design System:** Consistent use of frosted glass effects with backdrop blur, subtle borders, and depth
- **Responsive Layout:** Adapts to different screen sizes with optimized touch targets for mobile
- **Accessible Components:** All interactive elements meet WCAG 2.1 AA standards

### Key Features
- **Animated Transitions:** Smooth animations for all state changes and navigation
- **Drag-and-Drop Interface:** Intuitive video organization between panels
- **Video Preview:** Thumbnail generation and inline video playback
- **Popout Player:** Full-featured video player with keyboard controls
- **Progress Indicators:** Clear feedback for loading and processing states

### Visual Design
- **Color Scheme:** Custom palette with CSS variables for theming
- **Typography:** System fonts with modern, readable type scale
- **Spacing & Layout:** Consistent spacing system using CSS Grid and Flexbox
- **Shadows & Depth:** Layered shadows for visual hierarchy
- **Micro-interactions:** Subtle animations for user feedback

### Performance Optimizations
- **Code Splitting:** Automatic code splitting by route
- **Image Optimization:** Responsive images with modern formats
- **Lazy Loading:** On-demand loading of non-critical resources
- **Efficient State Updates:** Minimized re-renders with React.memo and useCallback
- **Bundle Analysis:** Regular bundle size monitoring

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
- **DnD Components:** 
  - Modern: `src/components/DraggableVideoList/DndKitVideoGrid.tsx`
  - Legacy: `src/components/DraggableVideoList/DraggableVideoList.tsx` (to be removed)
- **Dropbox API Logic:** `src/lib/dropboxFetch.ts`
- **Auth Logic:** `src/lib/auth/dropboxAuth.ts`, `src/lib/auth/connectionUtils.ts`
- **Project Audit/Docs:** `DROPREEL_PROJECT_AUDIT.md`, `DROPREEL_SETUP_AND_CONTEXT.md`

## Recommended Next Steps

### 1. Complete Phase 2 of the Development Roadmap
- Finish implementing the glassmorphism design system across all components
- Simplify the "Add New Videos" module as outlined in the roadmap
- Ensure consistent styling across all components

### 2. Consolidate DnD Implementation
- Complete the migration from `react-beautiful-dnd` to `dnd-kit` (done)
- Remove the legacy `DraggableVideoList.tsx` component
- Ensure consistent handling of drag operations between panels
- **Visual Consistency:** DragOverlay now uses the same VideoGridItem as the grid for a seamless drag experience
- **Duplicate Prevention:** No duplicate videos can be added to a panel via drag-and-drop

### 3. Implement Missing Core Features
- Make the "ADD TITLE HERE" section editable
- Implement the "THEME (MENU)" functionality for styling options
- Complete the "PREVIEW REEL" feature for viewing the final output

### 4. Performance & Reliability Improvements
- Add proper caching for Dropbox API responses
- Implement more robust error handling and recovery
- Optimize thumbnail loading and video previews

### 5. Complete Phase 3 of the Development Roadmap
- Finish the major layout redesign according to the wireframe
- Apply consistent glassmorphism styling throughout
- Fine-tune animations and transitions

## Special Notes
- **No node_modules in zip:** You must run `npm install` after unzipping.
- **No Dropbox credentials included:** You must provide your own Dropbox API keys in `.env.local`.
- **All code, assets, and documentation are included in the zip for a full restore.**
- **Glassmorphism:** All panes and controls are now glassy/transparent, and the background image is visible throughout the app.

---

_Last updated: 2025-05-18 (comprehensive codebase audit and documentation update)_
