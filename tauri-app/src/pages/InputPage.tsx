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

const InputPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatique
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Écoute des réponses
  useEffect(() => {
    const setupListeners = async () => {
      const unlisten = await listen('chat:response', (event: any) => {
        const assistantMessage: Message = {
          role: 'assistant',
          content: event.payload.message,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      });
      return unlisten;
    };

    setupListeners();
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
      {/* 🎯 BARRE DRAGGABLE - Simple et efficace */}
      <div
        style={{
          WebkitAppRegion: 'drag',
          height: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          cursor: 'grab',
          borderRadius: '7px 7px 0 0',
        } as React.CSSProperties}
      />

      {/* INPUT ZONE */}
      <div
        style={{
          WebkitAppRegion: 'no-drag',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px',
          borderBottom: messages.length > 0 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        } as React.CSSProperties}
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
            WebkitAppRegion: 'no-drag',
            flex: 1,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          } as React.CSSProperties}
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
        </div>
      )}
    </div>
  );
};

export default InputPage;