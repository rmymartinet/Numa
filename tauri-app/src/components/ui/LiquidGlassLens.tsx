import React from "react";

type Props = {
  width?: number;
  height?: number;
  radius?: number;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
  onMouseDown?: (e: React.MouseEvent) => void;
};

export default function LiquidGlassLens({
  width = 200,
  height = 60,
  radius = 25,
  style,
  className,
  children,
  onMouseDown,
}: Props) {
  return (
    <div
      className={className}
      onMouseDown={onMouseDown}
      style={{
        width,
        height,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
        // Effet verre simple mais visible
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(20px) saturate(180%) contrast(120%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%) contrast(120%)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.4)
        `,
        // Légère déformation avec CSS
        filter: "brightness(1.1)",
        ...style,
      }}
    >
      {/* contenu net par-dessus */}
      <div style={{ 
        position: "relative", 
        zIndex: 1, 
        pointerEvents: "auto",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px"
      }}>
        {children}
      </div>
    </div>
  );
}