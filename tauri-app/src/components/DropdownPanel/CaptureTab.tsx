import React from 'react';
import LoadingSpinner from '../LoadingSpinner';

interface CaptureTabProps {
  isProcessing: boolean;
  extractedText: string;
  onCapture: () => void;
}

const CaptureTab: React.FC<CaptureTabProps> = ({
  isProcessing,
  extractedText,
  onCapture,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Capture Section */}
      <div
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '20px',
        }}
      >
        <h2
          style={{
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          📸 Capture d'écran
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ margin: 0, opacity: 0.8 }}>
            Cliquez sur le bouton pour capturer l'écran et extraire le texte
          </p>

          <button
            onClick={onCapture}
            disabled={isProcessing}
            style={{
              width: '100%',
              backgroundColor: isProcessing
                ? 'rgba(156, 163, 175, 0.8)'
                : 'rgba(59, 130, 246, 0.8)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isProcessing ? (
              <>
                <LoadingSpinner size='sm' color='white' variant='dots' />
                <span>Traitement...</span>
              </>
            ) : (
              <>
                <span>📷</span>
                <span>Capturer l'écran et extraire le texte</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {extractedText && (
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <h3
            style={{
              fontSize: '16px',
              fontWeight: '600',
              margin: '0 0 16px 0',
            }}
          >
            Texte extrait
          </h3>
          <div
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              maxHeight: '300px',
              overflow: 'auto',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            {extractedText}
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptureTab;
