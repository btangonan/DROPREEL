# DropReel DnD-Kit Migration & Multi-Container Audit Context

## Project Overview
DropReel is a Next.js app for building video reels from Dropbox videos. The UI is a modern, responsive grid with two main panels: "YOUR VIDEOS" and "SELECTS". Users drag video thumbnails between these panels to build a reel, mimicking a file-manager experience.

## Drag-and-Drop Implementation History
- **Initial DnD:** Used `react-beautiful-dnd` for drag-and-drop, but it was glitchy and not robust for grid/multi-panel use.
- **Migration:** Migrated to `dnd-kit` (`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/modifiers`) for modern, robust, and grid-friendly drag-and-drop.

## Current DnD Architecture
- **State:**
  - Two arrays in React state: `yourVideos` and `selects` (each an array of video objects with unique `id`).
  - Each panel is rendered with a `DndKitVideoGrid` component.
- **DnD Context:**
  - A single `DndContext` wraps both panels.
  - Each panel's grid is wrapped in its own `SortableContext`, with the `items` prop set to the current array of video IDs for that panel.
- **Drag Handler:**
  - On drag end, the handler moves/reorders videos between arrays using immutable updates.
  - Debug logging confirms state and IDs are correct after every move.

## The Multi-Container Bug
- **Symptoms:**
  - When dragging videos between panels, items disappear one by one.
  - After several moves, only one item remains visible in either panel.
  - On refresh, the same behavior occurs.
- **Debugging:**
  - State and IDs are always correct and unique (confirmed by debug logs and UI JSON dumps).
  - The correct video objects are present in the arrays, but not visible in the UI.
  - The DOM shows the correct number of children, but dnd-kit does not render them.
- **Root Cause:**
  - dnd-kit requires the `items` prop of each `SortableContext` to always match the rendered children, and for state updates to be atomic.
  - If arrays are updated in separate state calls, or if the `items` prop and children are out of sync, dnd-kit "loses track" of items, causing them to disappear.

## Next Steps (Planned Fix)
- Refactor state to use a single object for both arrays, and update both in a single state call.
- Ensure the `items` prop for each `SortableContext` is always the current, correct array of IDs.
- Never mutate arrays in place.
- This is the industry best practice for dnd-kit multi-container setups.

## Why This Audit?
- The project is being prepared for an independent audit by WindSurf.
- The goal is to ensure the drag-and-drop implementation is robust, maintainable, and follows dnd-kit best practices for multi-container grids.

---

**For any questions, see the debug logs in `src/app/page.tsx` and the grid implementation in `src/components/DraggableVideoList/DndKitVideoGrid.tsx`.** 