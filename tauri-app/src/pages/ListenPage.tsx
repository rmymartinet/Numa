import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useDraggablePage } from '../hooks/useDraggablePage';
import { Mic, MicOff } from 'lucide-react';

const ListenPage: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    isDocked,
    isInSnapZone,
    isDragging,
    handleDragEnd,
    createMouseDownHandler,
    checkSnapZone,
    startSnapChecking,
  } = useDraggablePage({
    windowType: 'listen',
    onDockChange: docked => console.error('Listen page docked:', docked),
  });

  // Listen for speech recognition events
  useEffect(() => {
    const setup = async () => {
      const unlistenStart = await listen('speech:start', () => {
        setIsRecording(true);
        setIsProcessing(false);
      });

      const unlistenStop = await listen('speech:stop', () => {
        setIsRecording(false);
        setIsProcessing(true);
      });

      const unlistenResult = await listen('speech:result', (event: any) => {
        setRecordedText(event.payload.text);
        setIsProcessing(false);
      });

      const unlistenError = await listen('speech:error', (event: any) => {
        console.error('Speech recognition error:', event.payload);
        setIsRecording(false);
        setIsProcessing(false);
      });

      return () => {
        unlistenStart();
        unlistenStop();
        unlistenResult();
        unlistenError();
      };
    };
    setup();
  }, []);

  // Toggle recording
  const handleToggleRecording = async () => {
    try {
      if (isRecording) {
        await invoke('stop_speech_recognition');
      } else {
        await invoke('start_speech_recognition');
      }
    } catch (error) {
      console.error('Error toggling speech recognition:', error);
    }
  };

  // Clear recorded text
  const handleClear = () => {
    setRecordedText('');
  };

  // Send text to chat
  const handleSendToChat = async () => {
    if (!recordedText.trim()) return;

    try {
      await invoke('send_to_chat', { message: recordedText });
      handleClear();
    } catch (error) {
      console.error('Error sending to chat:', error);
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
      {/* DRAGGABLE BAR */}
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
          onMouseDown={createMouseDownHandler()}
          onMouseUp={handleDragEnd}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              createMouseDownHandler()(e as any);
            }
          }}
        />

        {/* Debug buttons */}
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
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div
        style={
          {
            WebkitAppRegion: 'no-drag',
            flex: 1,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          } as React.CSSProperties
        }
      >
        {/* Recording controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleToggleRecording}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: isRecording
                ? 'rgba(239, 68, 68, 0.2)'
                : 'rgba(59, 130, 246, 0.2)',
              color: 'white',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              opacity: isProcessing ? 0.6 : 1,
            }}
          >
            {isRecording ? (
              <>
                <MicOff size={16} />
                Stop Recording
              </>
            ) : (
              <>
                <Mic size={16} />
                {isProcessing ? 'Processing...' : 'Start Recording'}
              </>
            )}
          </button>

          {recordedText && (
            <>
              <button
                onClick={handleClear}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Clear
              </button>

              <button
                onClick={handleSendToChat}
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: 'rgba(34, 197, 94, 0.2)',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                Send to Chat
              </button>
            </>
          )}
        </div>

        {/* Status indicator */}
        <div
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.7)',
            textAlign: 'center',
          }}
        >
          {isRecording
            ? '🎤 Recording... Speak now'
            : isProcessing
              ? '⏳ Processing speech...'
              : recordedText
                ? '✅ Speech recognized'
                : '⭕ Click to start recording'}
        </div>

        {/* Recorded text display */}
        {recordedText && (
          <div
            style={{
              flex: 1,
              padding: '16px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              minHeight: '60px',
            }}
          >
            {recordedText}
          </div>
        )}
      </div>
    </div>
  );
};

export default ListenPage;