import { useState, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';

interface SnapHaloState {
  isVisible: boolean;
  inputPosition: { x: number; y: number } | null;
}

export const useSnapHalo = () => {
  const [snapHalo, setSnapHalo] = useState<SnapHaloState>({
    isVisible: false,
    inputPosition: null,
  });

  useEffect(() => {
    const setupListeners = async () => {
      const unlistenSnapEnter = await listen('snap:enter', (event: any) => {
        console.log('🟢 Snap zone entered:', event.payload);
        setSnapHalo({
          isVisible: true,
          inputPosition: event.payload.inputPosition || null,
        });
      });

      const unlistenSnapExit = await listen('snap:exit', () => {
        console.log('🔴 Snap zone exited');
        setSnapHalo({
          isVisible: false,
          inputPosition: null,
        });
      });

      return () => {
        unlistenSnapEnter();
        unlistenSnapExit();
      };
    };

    setupListeners();
  }, []);

  return snapHalo;
};