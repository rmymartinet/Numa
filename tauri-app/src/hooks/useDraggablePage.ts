import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';

interface DragPosition {
  x: number;
  y: number;
}

interface DraggablePageHookOptions {
  windowType: 'input' | 'listen' | 'context';
  onDockChange?: (isDocked: boolean) => void;
}

export const useDraggablePage = ({
  windowType,
  onDockChange,
}: DraggablePageHookOptions) => {
  const [isDocked, setIsDocked] = useState(true);
  const [isInSnapZone, setIsInSnapZone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartPos = useRef<DragPosition | null>(null);
  const snapCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const dragActiveRef = useRef(false);

  // Listen for dock/undock events from Rust
  useEffect(() => {
    const setup = async () => {
      const unDock = await listen(`${windowType}:docked`, () => {
        setIsDocked(true);
        onDockChange?.(true);
      });
      
      const unUndock = await listen(`${windowType}:undocked`, () => {
        setIsDocked(false);
        onDockChange?.(false);
      });

      return () => {
        unDock();
        unUndock();
      };
    };
    setup();
  }, [windowType, onDockChange]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (snapCheckInterval.current) clearInterval(snapCheckInterval.current);
    };
  }, []);

  // Check snap zone during drag
  const checkSnapZone = async () => {
    if (!dragActiveRef.current) return;
    try {
      console.error(`🔍 Calling check_snap_distance with windowType: "${windowType}"`);
      const snapData = (await invoke('check_snap_distance', {
        windowType: windowType,
      })) as { should_snap: boolean; distance: number };
      const shouldSnap = !!snapData.should_snap;
      const was = isInSnapZone;

      setIsInSnapZone(shouldSnap);

      if (shouldSnap && !was) {
        await emit('snap:enter', { distance: snapData.distance });
      } else if (!shouldSnap && was) {
        await emit('snap:exit', {});
      }
    } catch (e) {
      console.error('Erreur check snap:', e);
    }
  };

  // Start/restart snap polling
  const startSnapChecking = (immediate = false) => {
    if (snapCheckInterval.current) clearInterval(snapCheckInterval.current);
    if (immediate) checkSnapZone();
    snapCheckInterval.current = setInterval(() => checkSnapZone(), 100);
  };

  // Undock command
  const handleUndock = async () => {
    try {
      await invoke(`${windowType}_undock`);
    } catch (error) {
      console.error('Erreur undock:', error);
    }
  };

  // Dock command
  const handleDock = async () => {
    try {
      await invoke(`${windowType}_dock`);
      setIsInSnapZone(false);
    } catch (error) {
      console.error('Erreur dock:', error);
    }
  };

  // Start drag gesture
  const handleDragStart = (clientX: number, clientY: number) => {
    dragStartPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
  };

  // End drag gesture
  const handleDragEnd = async () => {
    setIsDragging(false);
    dragStartPos.current = null;
    dragActiveRef.current = false;

    if (snapCheckInterval.current) {
      clearInterval(snapCheckInterval.current);
      snapCheckInterval.current = null;
    }

    // Auto-dock if in snap zone
    if (isInSnapZone && !isDocked) {
      await handleDock();
    }
    setIsInSnapZone(false);
  };

  // Create mouse down handler for drag bar
  const createMouseDownHandler = () => (e: React.MouseEvent) => {
    console.error(
      `🎯 MouseDown ${windowType} - isDocked:`,
      isDocked,
      'x:',
      e.clientX,
      'y:',
      e.clientY
    );
    handleDragStart(e.clientX, e.clientY);

    if (isDocked) {
      // Docked: listen for first movement to auto-undock
      const autoUndockOnMove = (moveEvent: Event) => {
        const mouseEvent = moveEvent as any;
        const dx = mouseEvent.clientX - e.clientX;
        const dy = mouseEvent.clientY - e.clientY;
        if (Math.hypot(dx, dy) > 3) {
          document.removeEventListener('mousemove', autoUndockOnMove);
          document.removeEventListener('mouseup', cancelAutoUndock);

          // Activate drag and start polling immediately
          dragActiveRef.current = true;
          startSnapChecking(true);
          setIsDocked(false); // Optimistic

          // Undock then start native drag in next frame
          handleUndock().then(() => {
            requestAnimationFrame(() => {
              invoke(`start_${windowType}_dragging`).catch(console.error);
            });
          });
        }
      };

      const cancelAutoUndock = () => {
        document.removeEventListener('mousemove', autoUndockOnMove);
        document.removeEventListener('mouseup', cancelAutoUndock);
      };

      document.addEventListener('mousemove', autoUndockOnMove);
      document.addEventListener('mouseup', cancelAutoUndock);
    } else {
      // Already undocked: start native drag + snap immediately
      dragActiveRef.current = true;
      startSnapChecking(true);
      invoke(`start_${windowType}_dragging`).catch(console.error);
    }
  };

  return {
    isDocked,
    isInSnapZone,
    isDragging,
    handleDragEnd,
    createMouseDownHandler,
    checkSnapZone,
    startSnapChecking,
  };
};
