import React, { useState, useEffect, useRef } from 'react';
import { listen, emit } from '@tauri-apps/api/event';

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
  const readyEmittedRef = useRef(false);
  const lastResponseRef = useRef<string>('');

  // Debug: Log component mount
  console.log('🔔 ResponsePage: Component rendering');

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Listen for chat events from the HUD
  useEffect(() => {
    let unlistenFns: Array<() => void> = [];

    (async () => {
      console.log('🔔 ResponsePage: Setting up event listeners...');

      const u1 = await listen('test:event', (event: any) => {
        console.log('🔔 ResponsePage: Received test event:', event.payload);
        // alert('Test event received! Response window is working.');
      });

      const u2 = await listen('chat:start', (event: any) => {
        console.log('🔔 ResponsePage: Received chat:start:', event.payload);
        const userMessage: Message = {
          role: 'user',
          content: event.payload.message,
          timestamp: new Date(),
        };
        setMessages([userMessage]);
        setIsStreaming(true);
      });

      const u3 = await listen('chat:response', (event: any) => {
        console.log('🔔 ResponsePage: Received chat:response:', event.payload);
        console.log(
          '🔔 ResponsePage: Current messages count:',
          messages.length
        );
        console.log('🔔 ResponsePage: Listener ID for chat:response');

        // Éviter les doublons en vérifiant si on a déjà reçu cette réponse
        if (lastResponseRef.current === event.payload.message) {
          console.log('⚠️ ResponsePage: Duplicate response detected, skipping');
          return;
        }

        lastResponseRef.current = event.payload.message;

        const assistantMessage: Message = {
          role: 'assistant',
          content: event.payload.message,
          timestamp: new Date(),
          isStreaming: false,
        };
        setMessages(prev => {
          console.log(
            '🔔 ResponsePage: Adding message, prev count:',
            prev.length
          );
          return [...prev, assistantMessage];
        });
        setIsStreaming(false);
      });

      const u4 = await listen('chat:error', (event: any) => {
        console.error('🔔 ResponsePage: Received chat:error:', event.payload);
        const errorMessage: Message = {
          role: 'assistant',
          content: `Erreur: ${event.payload.error}`,
          timestamp: new Date(),
          isStreaming: false,
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsStreaming(false);
      });

      unlistenFns.push(u1, u2, u3, u4);
      console.log('🔔 ResponsePage: Event listeners setup complete');

      // 🔑 Annoncer qu'on est prêt **après** l'enregistrement des listeners (une seule fois)
      if (!readyEmittedRef.current) {
        await emit('response:ready');
        readyEmittedRef.current = true;
        console.log('✅ ResponsePage: response:ready emitted');
      } else {
        console.log(
          '⚠️ ResponsePage: response:ready already emitted, skipping'
        );
      }
    })();

    return () => {
      console.log('🔔 ResponsePage: Cleaning up event listeners');
      for (const u of unlistenFns)
        try {
          u();
        } catch {}
    };
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
      {/* Header avec design Liquid Glass */}
      <div className="glass" style={{ padding: '8px 10px', margin: '8px' }}>
        <div className="glass__content" style={{ gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              background: isStreaming ? '#22c55e' : '#6b7280',
            }}
          />
          <span
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-dim)' }}
          >
            {isStreaming ? 'Streaming…' : 'Ready'}
          </span>
        </div>
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
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '14px',
              gap: '16px',
            }}
          >
            <div>En attente d'une question...</div>
            <button
              onClick={() => {
                console.log('🔔 ResponsePage: Test button clicked');
                const testMessage: Message = {
                  role: 'user',
                  content: 'Test question from button',
                  timestamp: new Date(),
                };
                setMessages([testMessage]);
                setIsStreaming(true);
                handleChatResponse('Test question from button');
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '6px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '12px',
                marginBottom: '8px',
              }}
            >
              Test Streaming
            </button>
            <div
              style={{
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.4)',
                textAlign: 'center',
              }}
            >
              Clé API configurée dans le code
              <br />
              Prêt pour les tests ChatGPT !
            </div>
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
