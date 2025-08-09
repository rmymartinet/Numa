import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, emit } from '@tauri-apps/api/event';
import InputField from '../components/HUDBar/InputField';
import { Aperture, Unlink, Link } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const InputPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isDocked, setIsDocked] = useState(true);
  const [isInSnapZone, setIsInSnapZone] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const snapCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const dragActiveRef = useRef(false);

  // Focus auto sur l'input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Écoute des events (réponse chat + dock/undock côté Rust)
  useEffect(() => {
    const setup = async () => {
      const un1 = await listen('chat:response', (event: any) => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: event.payload.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      });

      const un2 = await listen('input:docked', () => setIsDocked(true));
      const un3 = await listen('input:undocked', () => setIsDocked(false));

      return () => {
        un1();
        un2();
        un3();
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

  // Redimensionnement simple en fonction du nb de messages
  const resizeWindow = async (messageCount: number) => {
    try {
      const newHeight = Math.min(80 + messageCount * 120, 600);
      await invoke('input_resize', { width: 700, height: newHeight });
    } catch (error) {
      console.error('Erreur redimensionnement:', error);
    }
  };

  // Soumission du chat
  const handleChatSubmit = async (message: string) => {
    try {
      const userMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setInputText('');

      await resizeWindow(messages.length + 1);
      await invoke('start_chat', { message });
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // --- SNAP CHECKS ----------------------------------------------------------

  // Vérifie la zone de snap pendant le drag
  const checkSnapZone = async () => {
    if (!dragActiveRef.current) return; // on évite tout check hors drag
    try {
      const snapData: any = await invoke('check_snap_distance');
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

  // Lance/relance le polling du snap; immediate=true force un 1er tick tout de suite
  const startSnapChecking = (immediate = false) => {
    if (snapCheckInterval.current) clearInterval(snapCheckInterval.current);
    if (immediate) checkSnapZone();
    snapCheckInterval.current = setInterval(() => checkSnapZone(), 100);
  };

  // --- DOCK / UNDOCK --------------------------------------------------------

  const handleUndock = async () => {
    try {
      await invoke('input_undock');
    } catch (error) {
      console.error('Erreur undock:', error);
    }
  };

  const handleDock = async () => {
    try {
      await invoke('input_dock');
      setIsInSnapZone(false); // reset visuel halo
    } catch (error) {
      console.error('Erreur dock:', error);
    }
  };

  // --- DRAG GESTURE ---------------------------------------------------------

  const handleDragStart = (clientX: number, clientY: number) => {
    dragStartPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
    // pas d'activation dragActiveRef ici : on attend de dépasser le seuil si docké
  };

  const handleDragEnd = async () => {
    setIsDragging(false);
    dragStartPos.current = null;
    dragActiveRef.current = false;

    if (snapCheckInterval.current) {
      clearInterval(snapCheckInterval.current);
      snapCheckInterval.current = null;
    }

    // auto-dock si on est dans la zone
    if (isInSnapZone && !isDocked) {
      await handleDock();
    }
    setIsInSnapZone(false);
  };

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
              '🎯 MouseDown - isDocked:',
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
                      invoke('start_input_dragging').catch(console.error);
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
              invoke('start_input_dragging').catch(console.error);
            }
          }}
          onMouseUp={handleDragEnd}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ')
              handleDragStart(e.clientX, e.clientY);
          }}
        />
        {/* Boutons debug (no-drag) */}
        <div style={{ display: 'flex', gap: '4px' }}>
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

          <button
            onClick={() => {
              console.error(
                'État -> isDocked:',
                isDocked,
                'isDragging:',
                isDragging,
                'isInSnapZone:',
                isInSnapZone,
                'dragActiveRef:',
                dragActiveRef.current
              );
            }}
            style={
              {
                WebkitAppRegion: 'no-drag',
                background: 'rgba(0, 0, 255, 0.3)',
                border: '1px solid rgba(0, 0, 255, 0.5)',
                color: 'white',
                cursor: 'pointer',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '10px',
              } as React.CSSProperties
            }
          >
            État
          </button>
        </div>
      </div>

      {/* ZONE INPUT */}
      <div
        style={
          {
            WebkitAppRegion: 'no-drag',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px',
            borderBottom:
              messages.length > 0
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : 'none',
          } as React.CSSProperties
        }
      >
        <Aperture size={14} style={{ color: 'rgba(255, 255, 255, 0.6)' }} />
        <div style={{ width: '100%' }}>
          <InputField
            ref={inputRef}
            value={inputText}
            onChange={setInputText}
            onChatSubmit={handleChatSubmit}
            placeholder="Ask questions..."
          />
        </div>
      </div>

      {/* MESSAGES */}
      {messages.length > 0 && (
        <div
          style={
            {
              WebkitAppRegion: 'no-drag',
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            } as React.CSSProperties
          }
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                }}
              >
                {message.role === 'user' ? 'Vous' : 'Assistant'}
              </div>
              <div
                style={{
                  padding: '12px',
                  backgroundColor:
                    message.role === 'user'
                      ? 'rgba(59, 130, 246, 0.2)'
                      : 'rgba(255, 255, 255, 0.05)',
                  border:
                    message.role === 'user'
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {message.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InputPage;
