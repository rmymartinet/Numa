import React, { useState, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const ResponsePage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Listen for chat events from the HUD
  useEffect(() => {
    const setupEventListeners = async () => {
      console.log('🔔 ResponsePage: Setting up event listeners...');

      // Listen for new chat messages from HUD
      const unlistenChatStart = await listen('chat:start', (event: any) => {
        console.log(
          '🔔 ResponsePage: Received chat:start event:',
          event.payload
        );

        const userMessage: Message = {
          role: 'user',
          content: event.payload.message,
          timestamp: new Date(),
        };

        setMessages([userMessage]);
        setIsStreaming(true);
        handleChatResponse(event.payload.message);
      });

      console.log('🔔 ResponsePage: Event listeners setup complete');

      return () => {
        unlistenChatStart();
      };
    };

    setupEventListeners();
  }, []);

  const handleChatResponse = async (userMessage: string) => {
    // Fausse réponse pour simulation
    const fakeResponse = `Bonjour ! Voici ma réponse à votre question "${userMessage}".

Je suis ChatGPT, un assistant IA développé par OpenAI. Je peux vous aider avec de nombreuses tâches comme répondre à vos questions, vous aider à rédiger du texte, analyser des informations, résoudre des problèmes, et bien plus encore.

Cette démonstration montre comment le streaming fonctionne - le texte apparaît progressivement, comme si j'étais en train de taper en temps réel. C'est exactement ce qui se passera quand vous serez connecté à la vraie API ChatGPT !

N'hésitez pas à me poser d'autres questions pour voir l'effet en action.`;

    // Créer le message assistant avec contenu vide
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);

    // Simuler le streaming caractère par caractère
    for (let i = 0; i <= fakeResponse.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 20)); // 20ms entre chaque caractère

      setMessages(prev =>
        prev.map((msg, index) =>
          index === prev.length - 1
            ? { ...msg, content: fakeResponse.slice(0, i) }
            : msg
        )
      );
    }

    // Terminer le streaming
    setMessages(prev =>
      prev.map((msg, index) =>
        index === prev.length - 1 ? { ...msg, isStreaming: false } : msg
      )
    );
    setIsStreaming(false);
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
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: isStreaming ? '#22c55e' : '#6b7280',
            animation: isStreaming ? 'pulse 2s infinite' : 'none',
          }}
        />
        <span
          style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          ChatGPT Response
        </span>
      </div>

      {/* Messages */}
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
        {messages.length === 0 ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '14px',
            }}
          >
            En attente d'une question...
          </div>
        ) : (
          messages.map((message, index) => (
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
                {message.role === 'user' ? 'Vous' : 'ChatGPT'}
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
          ))
        )}

        {/* Loading indicator */}
        {isStreaming && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px',
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
            ChatGPT réfléchit...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes blink {
            0%, 50% { opacity: 1; }
            51%, 100% { opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default ResponsePage;
