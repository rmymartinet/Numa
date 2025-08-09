import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import InputField from '../components/HUDBar/InputField';
import { Aperture } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const InputPageFixed: React.FC = () => {
  const [inputText, setInputText] = useState('');
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

  // Écoute des événements de chat
  useEffect(() => {
    const setupListeners = async () => {
      const unlisten1 = await listen('chat:response', (event: any) => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: event.payload.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsStreaming(false);
      });

      return () => {
        unlisten1();
      };
    };

    setupListeners();
  }, []);

  // Redimensionnement simple
  const resizeWindow = async (messageCount: number) => {
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

  // Auto-scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Gestion de la soumission
  const handleChatSubmit = async (message: string) => {
    try {
      // Ajouter le message utilisateur
      const userMessage: Message = {
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
      setIsStreaming(true);
      
      setInputText('');
      
      // Redimensionner
      await resizeWindow(messages.length + 1);
      
      // Appeler l'API
      await invoke('start_chat', { message });
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setIsStreaming(false);
    }
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
            <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', textTransform: 'uppercase' }}>
                {message.role === 'user' ? 'Vous' : 'Assistant'}
              </div>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: message.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: message.role === 'user' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
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
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default InputPageFixed;