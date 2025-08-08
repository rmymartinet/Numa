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
    >
      {children}
    </button>
  );
};

export default GlassButton;
