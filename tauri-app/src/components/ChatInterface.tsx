// src/components/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Send, Settings, MessageSquare, Loader2, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  tokens?: number;
}

interface ChatRequest {
  message: string;
  conversation_id?: string;
  context?: string;
}

interface ChatResponse {
  message: string;
  conversation_id: string;
  tokens_used?: number;
  model: string;
}

interface ChatConfig {
  model: string;
  max_tokens: number;
  temperature: number;
  features: {
    streaming: boolean;
    vision: boolean;
    context_aware: boolean;
  };
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat configuration on mount
  useEffect(() => {
    loadChatConfig();
    loadConversationHistory();
    focusInput();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputText]);

  const loadChatConfig = async () => {
    try {
      const chatConfig = await invoke<ChatConfig>('get_chat_config');
      setConfig(chatConfig);
    } catch (err) {
      console.error('Failed to load chat config:', err);
    }
  };

  const loadConversationHistory = () => {
    try {
      const savedMessages = localStorage.getItem('numa_chat_messages');
      const savedConversationId = localStorage.getItem('numa_conversation_id');
      
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      }
      
      if (savedConversationId) {
        setConversationId(savedConversationId);
      }
    } catch (err) {
      console.error('Failed to load conversation history:', err);
    }
  };

  const saveConversationHistory = (newMessages: Message[], convId: string) => {
    try {
      localStorage.setItem('numa_chat_messages', JSON.stringify(newMessages));
      localStorage.setItem('numa_conversation_id', convId);
    } catch (err) {
      console.error('Failed to save conversation:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      const request: ChatRequest = {
        message: userMessage.content,
        conversation_id: conversationId || undefined,
        context: await getCurrentContext() // Future: screen context, active app, etc.
      };

      const response = await invoke<ChatResponse>('chat_with_openai', { request });

      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        tokens: response.tokens_used
      };

      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      setConversationId(response.conversation_id);
      saveConversationHistory(finalMessages, response.conversation_id);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
      focusInput();
    }
  };

  const getCurrentContext = async (): Promise<string | undefined> => {
    // Future: Get current app, screen content, clipboard, etc.
    // For now, just return basic system context
    const now = new Date().toLocaleString();
    return `Current time: ${now}`;
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
    localStorage.removeItem('numa_chat_messages');
    localStorage.removeItem('numa_conversation_id');
    focusInput();
  };

  const exportConversation = () => {
    const transcript = messages
      .map(msg => `[${msg.timestamp.toLocaleString()}] ${msg.role}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `numa_conversation_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) { // Cmd+Enter or Ctrl+Enter
        sendMessage();
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chat with Numa
          </h2>
          {config && (
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              {config.model}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={clearConversation}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Clear conversation"
          >
            Clear
          </button>
          <button
            onClick={exportConversation}
            disabled={messages.length === 0}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            title="Export conversation"
          >
            Export
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                OpenAI API Key
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="password"
                  placeholder="sk-..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  onBlur={async (e) => {
                    if (e.target.value.trim()) {
                      try {
                        await invoke('store_openai_key', { key: e.target.value.trim() });
                        e.target.value = '';
                        alert('API key stored securely');
                      } catch (err) {
                        alert(`Error storing API key: ${err}`);
                      }
                    }
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Your API key is stored securely in system keychain
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Welcome to Numa Chat
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Start a conversation with your AI assistant. Use Cmd+Enter to send messages quickly.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.tokens && (
                    <span>{message.tokens} tokens</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-gray-600 dark:text-gray-300 text-sm">Numa is thinking...</span>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 flex items-center gap-2 max-w-md">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your message... (Cmd+Enter to send)"
            className="flex-1 resize-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            style={{ minHeight: '40px' }}
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex justify-between">
          <span>Use Cmd+Enter to send quickly</span>
          {conversationId && (
            <span>Conversation: {conversationId.slice(-8)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;