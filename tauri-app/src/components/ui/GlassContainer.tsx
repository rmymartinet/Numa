import React from 'react';

interface GlassContainerProps {
  children: React.ReactNode;
  variant?: 'default' | 'pill';
  className?: string;
  style?: React.CSSProperties;
  onMouseDown?: (e: React.MouseEvent) => void;
  interactive?: boolean;
}

const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  variant = 'default',
  className = '',
  style,
  onMouseDown,
  interactive = false,
}) => {
  const variantClasses = {
    default: 'glass',
    pill: 'glass',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onMouseDown) {
      e.preventDefault();
      onMouseDown(e as unknown as React.MouseEvent);
    }
  };

  const interactiveProps =
    interactive && onMouseDown
      ? {
          role: 'button',
          tabIndex: 0,
          onKeyDown: handleKeyDown,
          'aria-label': 'Interactive glass container',
        }
      : {};

  return (
    <div
      className={`${variantClasses[variant]} ${className}`}
      style={style}
      onMouseDown={onMouseDown}
      {...interactiveProps}
    >
      <div className="glass__content">{children}</div>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter
          id="glass-distortion"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          {/* Option procédurale */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014"
            numOctaves="3"
            seed="7"
            stitchTiles="stitch"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="26"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
    </div>
  );
};

export default GlassContainer;
