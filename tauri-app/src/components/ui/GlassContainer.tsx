import React from 'react';

interface GlassContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'pill';
  className?: string;
  style?: React.CSSProperties;
  onMouseDown?: (e: React.MouseEvent) => void;
}

const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  variant = 'default',
  className = '',
  style,
  onMouseDown,
}) => {
  const variantClasses = {
    default: 'glass',
    pill: 'glass',
  };

  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      style={style}
      onMouseDown={onMouseDown}
    >
      <div className="glass__content">{children}</div>
    </div>
  );
};

export default GlassContainer;
