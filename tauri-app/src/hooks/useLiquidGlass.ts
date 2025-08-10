import { useMemo, useId } from 'react';

export const useLiquidGlass = (distortion: number = 2) => {
  const filterId = useId().replace(/:/g, "_");
  
  return useMemo(() => ({
    // Base glass d'Apple
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: `blur(8px) saturate(180%) url(#distortion-${filterId})`,
    WebkitBackdropFilter: `blur(8px) saturate(180%) url(#distortion-${filterId})`,
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
  }), [distortion, filterId]);
};