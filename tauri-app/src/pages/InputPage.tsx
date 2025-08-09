import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import InputField from '../components/HUDBar/InputField';

const InputPage: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus automatique sur l'input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Gestion de la soumission de la question
  const handleChatSubmit = async (message: string) => {
    try {
      console.log('💬 Question soumise:', message);

      // 1) Vider l'input (mais garder InputPage visible)
      setInputText('');

      // 2) Démarrer le chat avec la question
      await invoke('start_chat', { message });
      console.log('Chat démarré avec:', message);

      // 3) ResponsePage apparaîtra en dessous (géré par start_chat)
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflow: 'hidden', // 🔑 Cacher les scrollbars
        boxSizing: 'border-box', // Inclure padding dans les dimensions
      }}
    >
      {/* Simple rectangle avec juste l'input */}
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <InputField
          ref={inputRef}
          value={inputText}
          onChange={setInputText}
          onChatSubmit={handleChatSubmit}
          placeholder="Ask questions..."
        />
      </div>

      <style>
        {`
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
