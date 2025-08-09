import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import InputField from '../components/HUDBar/InputField';
import { Aperture } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const InputPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Focus automatique sur l'input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 🎯 INITIALISATION : S'assurer que l'InputPage est bien dimensionnée au démarrage
  useEffect(() => {
    // Forcer la taille de base quand il n'y a pas de messages
    if (messages.length === 0) {
      resizeWindowForMessages(0);
    }
  }, [messages.length]);

  // 🎯 RACCOURCIS CLAVIER GLOBAUX
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K: Focus sur l'input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select(); // Sélectionne tout le texte
        }
      }

      // Esc: Cacher InputPage
      if (e.key === 'Escape') {
        e.preventDefault();
        invoke('input_hide').catch(console.error);
      }

      // 🔄 HISTORIQUE: Flèche ↑/↓ pour naviguer
      if (e.key === 'ArrowUp' && history.length > 0) {
        e.preventDefault();
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        if (newIndex >= 0) {
          setHistoryIndex(newIndex);
          setInputText(history[history.length - 1 - newIndex]);
        }
      }
      
      if (e.key === 'ArrowDown' && historyIndex > -1) {
        e.preventDefault();
        const newIndex = historyIndex - 1;
        if (newIndex === -1) {
          setHistoryIndex(-1);
          setInputText('');
        } else {
          setHistoryIndex(newIndex);
          setInputText(history[history.length - 1 - newIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [history, historyIndex]);

  // 🎧 ÉCOUTE DES ÉVÉNEMENTS CHAT
  useEffect(() => {
    const unlistenFns: Array<() => void> = [];

    (async () => {
      const u1 = await listen('chat:start', (event: any) => {
        const userMessage: Message = {
          role: 'user',
          content: event.payload.message,
          timestamp: new Date(),
        };
        setMessages([userMessage]);
        setIsStreaming(true);
        // Agrandir la fenêtre pour afficher les messages (seulement si ce n'est pas déjà fait)
        if (messages.length === 0) {
          resizeWindowForMessages(1);
        }
      });

      const u2 = await listen('chat:response', (event: any) => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: event.payload.message,
          timestamp: new Date(),
        };
        setMessages(prev => {
          const newMessages = [...prev, assistantMessage];
          resizeWindowForMessages(newMessages.length);
          return newMessages;
        });
        setIsStreaming(false);
      });

      const u3 = await listen('chat:error', (event: any) => {
        const errorMessage: Message = {
          role: 'assistant',
          content: `Erreur: ${event.payload.error}`,
          timestamp: new Date(),
        };
        setMessages(prev => {
          const newMessages = [...prev, errorMessage];
          resizeWindowForMessages(newMessages.length);
          return newMessages;
        });
        setIsStreaming(false);
      });

      unlistenFns.push(u1, u2, u3);
    })();

    return () => {
      for (const u of unlistenFns) {
        try { u(); } catch {}
      }
    };
  }, [resizeWindowForMessages]);

  // 📏 REDIMENSIONNEMENT SIMPLE
  const resizeWindowForMessages = async (messageCount: number) => {
    try {
      const baseHeight = 80;
      const messageHeight = 120;
      const maxHeight = 600;

      const newHeight = Math.min(
        baseHeight + messageCount * messageHeight,
        maxHeight
      );

      await invoke('input_resize', { width: 700, height: newHeight });
    } catch (error) {
      console.error('Erreur redimensionnement:', error);
    }
  };

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Gestion de la soumission de la question
  const handleChatSubmit = async (message: string) => {
    try {
      // 1) Ajouter à l'historique
      setHistory(prev => {
        const newHistory = [...prev, message];
        return newHistory.slice(-50);
      });
      setHistoryIndex(-1);

      // 2) Ajouter le message utilisateur
      const userMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setIsStreaming(true);

      // 3) Vider l'input
      setInputText('');

      // 4) Redimensionner pour le nouveau message
      await resizeWindowForMessages(messages.length + 1);

      // 5) Appeler l'API OpenAI
      await invoke('start_chat', { message });

    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setIsStreaming(false);
    }
  };

  //q:Je veux pouvoir reziser la page InputPage pour qu'elle soit plus grande ou plus petite
  //a: Pour permettre le redimensionnement de la page InputPage, vous pouvez utiliser les propriétés CSS `resize` et `overflow`. Voici comment vous pouvez le faire :

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
      {/* HEADER AVEC INPUT */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px',
          borderBottom: messages.length > 0 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        }}
      >
        <Aperture
          size={14}
          style={{ color: 'rgba(255, 255, 255, 0.6)' }}
        />
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
          style={{
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(255, 255, 255, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
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
                {message.isStreaming && (
                  <span
                    style={{
                      animation: 'blink 1s infinite',
                      marginLeft: '2px',
                    }}
                  >
                    ▋
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isStreaming && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px',
                padding: '8px',
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid #22c55e',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              Assistant réfléchit...
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <style>
        {`
          /* Animations */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }

          /* Cacher toutes les scrollbars pour InputPage */
          body, html {
            overflow: hidden !important;
          }

          /* Webkit browsers (Chrome, Safari) */
          ::-webkit-scrollbar {
            display: none;
          }

          /* Firefox */
          * {
            scrollbar-width: none;
          }
        `}
      </style>
    </div>
  );
};

export default InputPage;
