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
