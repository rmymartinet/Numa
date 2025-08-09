import React from 'react';
import { invoke } from '@tauri-apps/api/core';

const AskButton: React.FC = () => {
  return (
    <button
      className="glass__button"
      onClick={async () => {
        try {
          // Use the new start_chat command
          await invoke('start_chat', { message: inputText });
        } catch (error) {
          console.error('Error starting chat:', error);
        }
      }}
    >
      <span className="glass__button-text">Ask</span>
    </button>
  );
};

export default AskButton;
