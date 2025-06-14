import { useState, useCallback } from 'react';
import { 
  useSensors, 
  useSensor, 
  PointerSensor,
  pointerWithin,
  rectIntersection,
  closestCenter
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { VideoFile } from '@/types';

interface VideoState {
  yourVideos: VideoFile[];
  selects: VideoFile[];
}

export function useDragAndDrop(
  videoState: VideoState, 
  setVideoState: React.Dispatch<React.SetStateAction<VideoState>>,
  setError: (error: string) => void
) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Custom collision detection for grid positioning
  const customCollisionDetection = useCallback((args: {
    active: { id: string | number; data: { current: { droppableId: string } } };
    droppableContainers: Map<string, any>;
    pointerCoordinates: { x: number; y: number } | null;
  }) => {
    const { droppableContainers, pointerCoordinates } = args;
    
    // First check if we're over a container
    const pointerCollisions = pointerWithin(args);
    const containerCollision = pointerCollisions.find(collision => 
      collision.id === 'yourVideos' || collision.id === 'selects'
    );
    
    if (containerCollision && pointerCollisions.length === 1) {
      // Only container collision, append to end
      return [containerCollision];
    }
    
    // For items within containers, use a custom grid-aware detection
    if (pointerCoordinates) {
      const videoCollisions = [];
      
      for (const container of droppableContainers) {
        const { id, rect } = container;
        
        // Skip container-level droppables
        if (id === 'yourVideos' || id === 'selects') continue;
        
        if (rect.current) {
          const { top, left, width, height } = rect.current;
          const { x, y } = pointerCoordinates;
          
          // Check if pointer is within this video's bounds
          if (x >= left && x <= left + width && y >= top && y <= top + height) {
            // Calculate which quadrant for better positioning
            const centerX = left + width / 2;
            const centerY = top + height / 2;
            const isLeft = x < centerX;
            const isTop = y < centerY;
            
            videoCollisions.push({
              id,
              data: { 
                quadrant: { isLeft, isTop },
                bounds: { top, left, width, height }
              }
            });
          }
        }
      }
      
      if (videoCollisions.length > 0) {
        // Return the most relevant collision
        return [videoCollisions[0]];
      }
    }
    
    // Fallback to rect intersection
    const rectCollisions = rectIntersection(args);
    if (rectCollisions.length > 0) {
      return rectCollisions;
    }
    
    // Final fallback
    return closestCenter(args);
  }, []);

  // Handler for drag end (cross-panel and reorder)
  const handleDragEnd = useCallback((e: { 
    active: { 
      id: string | number; 
      data: { current: { droppableId: string } } 
    }; 
    over: { 
      id: string | number; 
      data: { current: { droppableId: string } } 
    } | null 
  }) => {
    setActiveId(null);
    const { active, over } = e;
    if (!active || !over) {
      return;
    }


    // Find the video being dragged to check compatibility
    const activeIdStr = String(active.id);
    const allVideos = [...videoState.yourVideos, ...videoState.selects];
    const sourceVideo = allVideos.find(v => 
      `yourVideos-${v.id}` === activeIdStr || 
      `selects-${v.id}` === activeIdStr || 
      v.id === activeIdStr
    );

    // Prevent dragging incompatible videos to the selects panel
    if (sourceVideo && sourceVideo.isCompatible === false) {
      const destContainer = String(over.id);
      const isMovingToSelects = destContainer === 'selects' || destContainer.startsWith('selects-');
      
      if (isMovingToSelects) {
        setError(`Cannot add "${sourceVideo.name}" to reel: ${sourceVideo.compatibilityError || 'Video format not supported'}`);
        return;
      }
    }

    setVideoState(prev => {
      const newState = { yourVideos: [...prev.yourVideos], selects: [...prev.selects] };

      // Find the video item by looking for the active.id which might be a compound key
      const activeIdStr = String(active.id);
      let sourceVideo: VideoFile | undefined;
      let sourceContainer: 'yourVideos' | 'selects' = 'yourVideos';
      let sourceIndex = -1;

      // Check yourVideos first
      sourceIndex = newState.yourVideos.findIndex(v => `yourVideos-${v.id}` === activeIdStr || v.id === activeIdStr);
      if (sourceIndex !== -1) {
        sourceVideo = newState.yourVideos[sourceIndex];
        sourceContainer = 'yourVideos';
      } else {
        // Check selects
        sourceIndex = newState.selects.findIndex(v => `selects-${v.id}` === activeIdStr || v.id === activeIdStr);
        if (sourceIndex !== -1) {
          sourceVideo = newState.selects[sourceIndex];
          sourceContainer = 'selects';
        }
      }

      if (!sourceVideo) {
        return newState;
      }

      // Determine destination container and index
      let destContainer: 'yourVideos' | 'selects' | null = null;
      let destIndex: number = -1;
      
      if (over.id === 'yourVideos' || over.id === 'selects') {
        // Dropped on container - append to end
        destContainer = over.id as 'yourVideos' | 'selects';
        destIndex = newState[destContainer].length;
      } else {
        // Dropped on an item - find which container it belongs to
        const overIdStr = String(over.id);
        const foundInYourVideos = newState.yourVideos.find(v => `yourVideos-${v.id}` === overIdStr || v.id === overIdStr);
        const foundInSelects = newState.selects.find(v => `selects-${v.id}` === overIdStr || v.id === overIdStr);
        
        if (foundInYourVideos) {
          destContainer = 'yourVideos';
          destIndex = newState.yourVideos.findIndex(v => `yourVideos-${v.id}` === overIdStr || v.id === overIdStr);
        } else if (foundInSelects) {
          destContainer = 'selects';
          destIndex = newState.selects.findIndex(v => `selects-${v.id}` === overIdStr || v.id === overIdStr);
        }
      }

      // Guard: only proceed if destContainer is valid
      if (!destContainer || destIndex === -1) {
        return newState;
      }

      if (sourceContainer === destContainer) {
        // Reorder within same container using arrayMove
        const reordered = arrayMove(newState[sourceContainer], sourceIndex, destIndex);
        if (sourceContainer === 'yourVideos') {
          newState.yourVideos = reordered;
        } else {
          newState.selects = reordered;
        }
      } else {
        // Move between containers
        const sourceArr = [...newState[sourceContainer]];
        const destArr = [...newState[destContainer]];
        const [movedItem] = sourceArr.splice(sourceIndex, 1);
        destArr.splice(destIndex, 0, movedItem);
        
        if (sourceContainer === 'yourVideos') {
          newState.yourVideos = sourceArr;
          newState.selects = destArr;
        } else {
          newState.selects = sourceArr;
          newState.yourVideos = destArr;
        }
      }

      
      return newState;
    });
  }, [videoState, setVideoState, setError]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced distance for more responsive dragging
      },
    })
  );

  // For DragOverlay - find the active video
  const allVideos = [...videoState.yourVideos, ...videoState.selects];
  const activeVideo = allVideos.find(v => {
    const activeIdStr = String(activeId);
    return v.id === activeIdStr || `yourVideos-${v.id}` === activeIdStr || `selects-${v.id}` === activeIdStr;
  }) || null;

  return {
    activeId,
    setActiveId,
    activeVideo,
    customCollisionDetection,
    handleDragEnd,
    sensors,
    dndContextProps: {
      sensors,
      collisionDetection: customCollisionDetection,
      onDragStart: (e: { active: { id: string | number } }) => setActiveId(e.active.id as string),
      onDragEnd: handleDragEnd,
      onDragCancel: () => setActiveId(null)
    }
  };
}