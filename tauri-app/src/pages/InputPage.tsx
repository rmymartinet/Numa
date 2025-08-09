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

  // Focus automatique
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Écoute des réponses et des états dock/undock
  useEffect(() => {
    const setupListeners = async () => {
      const unlisten1 = await listen('chat:response', (event: any) => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: event.payload.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      });

      const unlisten2 = await listen('input:docked', () => {
        setIsDocked(true);
      });

      const unlisten3 = await listen('input:undocked', () => {
        setIsDocked(false);
      });

      return () => {
        unlisten1();
        unlisten2();
        unlisten3();
      };
    };

    setupListeners();
  }, []);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      if (snapCheckInterval.current) {
        clearInterval(snapCheckInterval.current);
      }
    };
  }, []);

  // Redimensionnement simple
  const resizeWindow = async (messageCount: number) => {
    try {
      const newHeight = Math.min(80 + messageCount * 120, 600);
      await invoke('input_resize', { width: 700, height: newHeight });
    } catch (error) {
      console.error('Erreur redimensionnement:', error);
    }
  };

  // Soumission
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

  const dragActiveRef = useRef(false);

  const checkSnapZone = async () => {
    //force sert a forcer la vérification même si docké

    if (!dragActiveRef.current) return;
    try {
      const snapData: any = await invoke('check_snap_distance');

      // Si on est dans la zone de snap, on met à jour l'état
      //les !! permettent de forcer le type boolean
      const shouldSnap = !!snapData.should_snap;

      //was permet de savoir si on était déjà dans la zone de snap
      const was = isInSnapZone;
      setIsInSnapZone(shouldSnap);

      //Si on est dans la zone de snap, on émet un événement
      if (shouldSnap && !was) {
        await emit('snap:enter', { distance: snapData.distance });
      } else if (!shouldSnap && was) await emit('snap:exit', {});
    } catch (e) {
      console.error('Erreur check snap:', e);
    }
  };
  // Fonctions dock/undock
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
      setIsInSnapZone(false); // Reset snap zone
    } catch (error) {
      console.error('Erreur dock:', error);
    }
  };

  // Gestion du drag
  const handleDragStart = (clientX: number, clientY: number) => {
    dragStartPos.current = { x: clientX, y: clientY };
    setIsDragging(true);
    console.error('🎯 handleDragStart - isDocked:', isDocked);
  };

  // Démarre la vérification de snap après undock
  const startSnapChecking = () => {
    if (snapCheckInterval.current) clearInterval(snapCheckInterval.current);
    snapCheckInterval.current = setInterval(() => checkSnapZone(), 100);
  };

  const handleDragEnd = async () => {
    setIsDragging(false);
    dragStartPos.current = null;
    dragActiveRef.current = false;

    // Nettoyer l'intervalle
    if (snapCheckInterval.current) {
      clearInterval(snapCheckInterval.current);
      snapCheckInterval.current = null;
    }

    // Si dans la zone de snap, dock automatiquement
    if (isInSnapZone && !isDocked) {
      await handleDock();
    }

    setIsInSnapZone(false);
  };

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
      {/* 🎯 BARRE DRAGGABLE avec bouton dock/undock */}
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
              backgroundColor: isDocked
                ? isInSnapZone
                  ? 'rgba(0, 255, 0, 0.1)'
                  : 'transparent'
                : isInSnapZone
                  ? 'rgba(0, 255, 0, 0.1)'
                  : 'rgba(255, 255, 255, 0.05)',
            } as React.CSSProperties
          }
          onMouseDown={e => {
            console.error(
              '🎯 Barre MouseDown - isDocked:',
              isDocked,
              'clientX:',
              e.clientX,
              'clientY:',
              e.clientY
            );
            handleDragStart(e.clientX, e.clientY);

            if (isDocked) {
              // Si déjà docké, on lance
              const autoUndockOnMove = (moveEvent: React.MouseEvent) => {
                if (
                  Math.hypot(
                    moveEvent.clientX - e.clientX,
                    moveEvent.clientY - e.clientY
                  ) > 3
                ) {
                  document.removeEventListener(
                    'mousemove',
                    autoUndockOnMove as any
                  );
                  document.removeEventListener('mouseup', cancelAutoUndock);

                  dragActiveRef.current = true; // on active le drag
                  startSnapChecking(); // ⚡️ now
                  setIsDocked(false); // optimiste pour éviter le “trou” du 1er tick

                  handleUndock().then(() =>
                    setTimeout(() => {
                      invoke('start_input_dragging').catch(console.error);
                    }, 30)
                  );
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
              console.error('⛔️ Barre non dockée - startSnapChecking');
              dragActiveRef.current = true; // on active le drag
              startSnapChecking();
              invoke('start_input_dragging').catch(console.error);
            }
          }}
          onMouseUp={handleDragEnd}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleDragStart(e.clientX, e.clientY);
            }
          }}
        />
        {/* Boutons de debug */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => {
              console.error('🧪 Test checkSnapZone forcé');
              checkSnapZone();
            }}
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
            onClick={() => {
              console.error('🧪 Test startSnapChecking forcé');
              startSnapChecking();
            }}
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
                '🧪 État actuel - isDocked:',
                isDocked,
                'isDragging:',
                isDragging,
                'isInSnapZone:',
                isInSnapZone
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

        {/* Bouton de backup */}
        {false && (
          <button
            onClick={isDocked ? handleUndock : handleDock}
            style={
              {
                WebkitAppRegion: 'no-drag',
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                transition: 'color 0.2s',
              } as React.CSSProperties
            }
            title={isDocked ? 'Détacher' : 'Attacher au HUD'}
          >
            {isDocked ? <Unlink size={12} /> : <Link size={12} />}
          </button>
        )}
      </div>

      {/* INPUT ZONE */}
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
