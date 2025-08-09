import React from 'react';

interface GlassButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  title?: string;
}

const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  isActive = false,
  disabled = false,
  className = '',
  size = 'medium',
  title,
}) => {
  return (
    <button
      className={`glass__btn ${isActive ? 'is-on' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={isActive}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 16px',
        backgroundColor: isActive
          ? 'rgba(59, 130, 246, 0.8)'
          : 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '25px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        minWidth: '80px',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
};

export default GlassButton;
