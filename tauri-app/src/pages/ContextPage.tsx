import React, { useState, useRef, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';
import WindowCloseButton from '../components/ui/WindowCloseButton';
import { Brain } from 'lucide-react';

const ContextPage: React.FC = () => {
  const [isDocked, setIsDocked] = useState(true);
  const [isInSnapZone, setIsInSnapZone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const snapCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const dragActiveRef = useRef(false);

  // Écoute des events dock/undock côté Rust
  useEffect(() => {
    const setup = async () => {
      const un1 = await listen('context:docked', () => setIsDocked(true));
      const un2 = await listen('context:undocked', () => setIsDocked(false));

      return () => {
        un1();
        un2();
      };
    };
    setup();
  }, []);

  // Cleanup interval au démontage
  useEffect(() => {
    return () => {
      if (snapCheckInterval.current) clearInterval(snapCheckInterval.current);
    };
  }, []);

  // --- SNAP CHECKS ----------------------------------------------------------

  // Vérifie la zone de snap pendant le drag
  const checkSnapZone = async () => {
    if (!dragActiveRef.current) return; // on évite tout check hors drag
    try {
      const snapData: any = await invoke('check_context_snap_distance');
      const shouldSnap = !!snapData.should_snap;
      const was = isInSnapZone;

      setIsInSnapZone(shouldSnap);

      if (shouldSnap && !was) {
        await emit('snap:enter', { distance: snapData.distance });
      } else if (!shouldSnap && was) {
        await emit('snap:exit', {});
      }
    } catch (e) {
      console.error('Erreur check snap context:', e);
    }
  };

  // Lance/relance le polling du snap; immediate=true force un 1er tick tout de suite
  const startSnapChecking = (immediate = false) => {
    if (snapCheckInterval.current) clearInterval(snapCheckInterval.current);
    if (immediate) checkSnapZone();
    snapCheckInterval.current = setInterval(() => checkSnapZone(), 100);
  };

  // --- DOCK / UNDOCK --------------------------------------------------------

  const handleUndock = async () => {
    try {
      await invoke('context_undock');
    } catch (error) {
      console.error('Erreur context undock:', error);
    }
  };

  const handleDock = async () => {
    try {
      await invoke('context_dock');
      setIsInSnapZone(false); // reset visuel halo
    } catch (error) {
      console.error('Erreur context dock:', error);
    }
  };

  // --- DRAG GESTURE ---------------------------------------------------------

  const handleDragStart = (clientX: number, clientY: number) => {
    dragStartPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
    // pas d'activation dragActiveRef ici : on attend de dépasser le seuil si docké
  };

  const handleDragEnd = useCallback(async () => {
    console.error('🎯 handleDragEnd appelé');
    setIsDragging(false);
    dragStartPos.current = null;
    dragActiveRef.current = false;

    if (snapCheckInterval.current) {
      clearInterval(snapCheckInterval.current);
      snapCheckInterval.current = null;
    }

    // auto-dock si on est dans la zone
    if (isInSnapZone && !isDocked) {
      console.error('🎯 Auto-docking...');
      await handleDock();
    }
    setIsInSnapZone(false);
  }, [isInSnapZone, isDocked]);

  // Listener global pour capturer mouseup pendant le drag natif
  useEffect(() => {
    const globalMouseUp = () => {
      if (dragActiveRef.current) {
        console.error('🎯 Global mouseup detected during drag');
        handleDragEnd();
      }
    };

    document.addEventListener('mouseup', globalMouseUp);
    window.addEventListener('mouseup', globalMouseUp);

    return () => {
      document.removeEventListener('mouseup', globalMouseUp);
      window.removeEventListener('mouseup', globalMouseUp);
    };
  }, [isInSnapZone, isDocked, handleDragEnd]); // Dependencies pour que handleDragEnd ait les bonnes valeurs

  // --- RENDER ---------------------------------------------------------------

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '7px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* BARRE DRAGGABLE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '24px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '7px 7px 0 0',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          aria-label="Draggable bar"
          style={
            {
              WebkitAppRegion: isDocked ? 'no-drag' : 'drag',
              flex: 1,
              height: '100%',
              cursor: isDocked
                ? isDragging
                  ? 'grabbing'
                  : 'default'
                : isDragging
                  ? 'grabbing'
                  : 'grab',
              backgroundColor: isInSnapZone
                ? 'rgba(0, 255, 0, 0.1)'
                : isDocked
                  ? 'transparent'
                  : 'rgba(255, 255, 255, 0.05)',
            } as React.CSSProperties
          }
          onMouseDown={e => {
            console.error(
              '🎯 ContextPage MouseDown - isDocked:',
              isDocked,
              'x:',
              e.clientX,
              'y:',
              e.clientY
            );
            handleDragStart(e.clientX, e.clientY);

            if (isDocked) {
              // barre dockée : on écoute le 1er mouvement pour auto-undock
              const autoUndockOnMove = (moveEvent: MouseEvent) => {
                const dx = (moveEvent as any).clientX - e.clientX;
                const dy = (moveEvent as any).clientY - e.clientY;
                if (Math.hypot(dx, dy) > 3) {
                  document.removeEventListener(
                    'mousemove',
                    autoUndockOnMove as any
                  );
                  document.removeEventListener('mouseup', cancelAutoUndock);

                  // activer le drag et le polling immédiatement
                  dragActiveRef.current = true;
                  startSnapChecking(true);
                  setIsDocked(false); // optimiste

                  // on undock puis on démarre le drag natif dans la frame suivante
                  handleUndock().then(() => {
                    requestAnimationFrame(() => {
                      invoke('start_context_dragging').catch(console.error);
                    });
                  });
                }
              };

              const cancelAutoUndock = () => {
                document.removeEventListener(
                  'mousemove',
                  autoUndockOnMove as any
                );
                document.removeEventListener('mouseup', cancelAutoUndock);
              };

              document.addEventListener('mousemove', autoUndockOnMove as any);
              document.addEventListener('mouseup', cancelAutoUndock);
            } else {
              // déjà undock : on accroche direct le drag natif + snap
              dragActiveRef.current = true;
              startSnapChecking(true);
              invoke('start_context_dragging').catch(console.error);
            }
          }}
          onMouseUp={handleDragEnd}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') handleDragStart(0, 0);
          }}
        />
        {/* Bouton de fermeture et boutons debug */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <WindowCloseButton
            onClick={async () => {
              try {
                await invoke('context_hide');
              } catch (error) {
                console.error('Erreur fermeture ContextPage:', error);
              }
            }}
          />
          <button
            onClick={() => checkSnapZone()}
            style={
              {
                WebkitAppRegion: 'no-drag',
                background: 'rgba(255, 0, 0, 0.3)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                color: 'white',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
              } as React.CSSProperties
            }
          >
            Test Snap
          </button>

          <button
            onClick={() => startSnapChecking(true)}
            style={
              {
                WebkitAppRegion: 'no-drag',
                background: 'rgba(0, 255, 0, 0.3)',
                border: '1px solid rgba(0, 255, 0, 0.5)',
                color: 'white',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
              } as React.CSSProperties
            }
          >
            Start Check
          </button>
        </div>
      </div>

      {/* CONTENU CONTEXT */}
      <div
        style={
          {
            WebkitAppRegion: 'no-drag',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '16px',
            flex: 1,
          } as React.CSSProperties
        }
      >
        <Brain size={24} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
        <div style={{ flex: 1 }}>
          <h3
            style={{
              color: 'white',
              margin: 0,
              marginBottom: '8px',
              fontSize: '16px',
              fontWeight: '500',
            }}
          >
            Context Management
          </h3>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            This page will manage conversation context and memory.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ContextPage;
