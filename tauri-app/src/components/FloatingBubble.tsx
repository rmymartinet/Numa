import React, { useState } from 'react';

interface FloatingBubbleProps {
  text: string;
  isVisible: boolean;
  onClose: () => void;
}

const FloatingBubble: React.FC<FloatingBubbleProps> = ({ text, isVisible, onClose }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        maxWidth: '400px',
        maxHeight: '500px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '14px',
        lineHeight: '1.5',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      {/* Header avec titre et bouton fermer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        paddingBottom: '8px'
      }}>
        <h4 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          color: '#4CAF50'
        }}>
          🤖 Réponse GPT
        </h4>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '18px',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          aria-label="Fermer la bulle de réponse"
        >
          <span aria-hidden="true">✕</span>
        </button>
      </div>

      {/* Contenu du texte */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        marginBottom: '12px',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {text}
      </div>

      {/* Bouton copier */}
      <button
        onClick={copyToClipboard}
        style={{
          backgroundColor: copied ? '#4CAF50' : 'rgba(255, 255, 255, 0.1)',
          color: copied ? 'white' : 'rgba(255, 255, 255, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '6px',
          padding: '8px 16px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: '500',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
        onMouseEnter={(e) => {
          if (!copied) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          }
        }}
        onMouseLeave={(e) => {
          if (!copied) {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          }
        }}
        aria-label={copied ? "Texte copié avec succès" : "Copier le texte dans le presse-papiers"}
        aria-live="polite"
      >
        <span aria-hidden="true">{copied ? '✓' : '📋'}</span>
        <span>{copied ? 'Copié !' : 'Copier'}</span>
      </button>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};

export default FloatingBubble; 