import React, { useEffect, useId, useMemo, useRef, useState } from 'react';

type Props = {
  width?: number;
  height?: number;
  radius?: number;
  // halos
  darkOpacity?: number; // 0..255
  darkBlur?: number; // px
  lightOpacity?: number; // 0..255
  lightBlur?: number; // px
  // displacement "centre"
  centerDistortion?: number; // 0..255 (plus petit -> plus fort)
  centerSize?: number; // 0..20 (plus petit -> plus flou/large)
  // pre/post blur & iridescence
  preBlur?: number; // 0..100  (sera /10)
  postBlur?: number; // 0..100  (sera /10)
  iridescence?: number; // 0..50 (modifie les scales R/B)
  // position & drag
  defaultX?: number;
  defaultY?: number;
  draggable?: boolean;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
};

export default function LiquidGlassLens({
  width = 200,
  height = 200,
  radius = 25,
  darkOpacity = 17,
  darkBlur = 5,
  lightOpacity = 17,
  lightBlur = 15,
  centerDistortion = 68,
  centerSize = 15,
  preBlur = 7,
  postBlur = 0,
  iridescence = 20,
  defaultX = 100,
  defaultY = 100,
  draggable = true,
  style,
  className,
  children,
}: Props) {
  const filterId = useId().replace(/:/g, '_'); // id safe
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const dragRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<{ dx: number; dy: number; dragging: boolean }>({
    dx: 0,
    dy: 0,
    dragging: false,
  });

  // Helpers to build the 3–4 data-URIs exactly comme ton code
  const rect = (
    x: number,
    y: number,
    w: number,
    h: number,
    rx: number,
    fill: string,
    extra: string = ''
  ) =>
    `<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='${rx}' fill='${fill}' ${extra ? `style='${extra}'` : ''}/>`;
  const wrapSVG = (content: string, w = width, h = height) =>
    `data:image/svg+xml,${encodeURIComponent(
      `<svg width='${w}' height='${h}' viewBox='0 0 ${w} ${h}' xmlns='http://www.w3.org/2000/svg'>${content}</svg>`
    )}`;

  const box = { x: width / 4, y: height / 4, w: width / 2, h: height / 2 };

  const thing9 = useMemo(() => {
    // masque sombre + glow blur
    const a = `rgb(0 0 0 / ${darkOpacity / 2.55}%)`;
    return wrapSVG(
      [
        rect(box.x, box.y, box.w, box.h, radius, a),
        rect(
          box.x,
          box.y,
          box.w,
          box.h,
          radius,
          '#FFF',
          `filter:blur(${darkBlur}px)`
        ),
      ].join('')
    );
  }, [width, height, radius, darkOpacity, darkBlur]);

  const thing0 = useMemo(() => {
    // halo clair
    const a = `rgb(255 255 255 / ${lightOpacity / 2.55}%)`;
    return wrapSVG(
      rect(box.x, box.y, box.w, box.h, radius, a, `filter:blur(${lightBlur}px)`)
    );
  }, [width, height, radius, lightOpacity, lightBlur]);

  const thing1 = useMemo(() => {
    // masque plein pour le "in" final
    return wrapSVG(rect(box.x, box.y, box.w, box.h, radius, '#000'));
  }, [width, height, radius]);

  const thing2 = useMemo(() => {
    // displacement map (GRAD+grey+blur centre) — exactement ton mix
    const grey = `rgb(127 127 127 / ${(255 - centerDistortion) / 2.55}%)`;
    const centreBlur = Math.max(0, 20 - centerSize);
    const content = [
      `<defs>
         <linearGradient id='g1' x1='0%' y1='0%' x2='100%' y2='0%'>
           <stop offset='0%' stop-color='#000'/><stop offset='100%' stop-color='#00F'/>
         </linearGradient>
         <linearGradient id='g2' x1='0%' y1='0%' x2='0%' y2='100%'>
           <stop offset='0%' stop-color='#000'/><stop offset='100%' stop-color='#0F0'/>
         </linearGradient>
       </defs>`,
      rect(0, 0, width, height, radius, '#7F7F7F'),
      rect(box.x, box.y, box.w, box.h, radius, '#000'),
      rect(
        box.x,
        box.y,
        box.w,
        box.h,
        radius,
        'url(#g1)',
        'mix-blend-mode:screen'
      ),
      rect(
        box.x,
        box.y,
        box.w,
        box.h,
        radius,
        'url(#g2)',
        'mix-blend-mode:screen'
      ),
      rect(
        box.x,
        box.y,
        box.w,
        box.h,
        radius,
        grey,
        `filter:blur(${centreBlur}px)`
      ),
    ].join('');
    return wrapSVG(content);
  }, [width, height, radius, centerDistortion, centerSize]);

  // Drag
  useEffect(() => {
    if (!draggable) return;
    const el = dragRef.current;
    if (!el) return;

    const onPointerDown = (e: PointerEvent) => {
      pointerRef.current.dragging = true;
      const rect = el.getBoundingClientRect();
      pointerRef.current.dx = e.clientX - rect.left;
      pointerRef.current.dy = e.clientY - rect.top;
      (e.target as Element).setPointerCapture?.(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!pointerRef.current.dragging) return;
      const nx = e.clientX - pointerRef.current.dx;
      const ny = e.clientY - pointerRef.current.dy;
      setPos({ x: nx, y: ny });
    };
    const onPointerUp = (e: PointerEvent) => {
      pointerRef.current.dragging = false;
      (e.target as Element).releasePointerCapture?.(e.pointerId);
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [draggable]);

  // scales R/G/B pour l’iridescence (comme ton c4)
  const scaleR = -150 + iridescence / 10;
  const scaleG = -150;
  const scaleB = -150 - iridescence / 10;

  return (
    <>
      {/* defs offscreen */}
      <svg
        aria-hidden
        style={{ position: 'absolute', width, height, top: -9999, left: -9999 }}
        viewBox={`0 0 ${width} ${height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter
          id={filterId}
          x="0"
          y="0"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            href={thing9}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="thing9"
          />
          <feImage
            href={thing0}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="thing0"
          />
          <feImage
            href={thing1}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="thing1"
          />
          <feImage
            href={thing2}
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            result="thing2"
          />

          <feGaussianBlur
            stdDeviation={preBlur / 10}
            in="SourceGraphic"
            result="preblur"
          />

          <feDisplacementMap
            in="preblur"
            in2="thing2"
            scale={scaleR}
            xChannelSelector="B"
            yChannelSelector="G"
          />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="disp1"
          />

          <feDisplacementMap
            in="preblur"
            in2="thing2"
            scale={scaleG}
            xChannelSelector="B"
            yChannelSelector="G"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 0 0 0
                    0 0 0 1 0"
            result="disp2"
          />

          <feDisplacementMap
            in="preblur"
            in2="thing2"
            scale={scaleB}
            xChannelSelector="B"
            yChannelSelector="G"
          />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0
                    0 0 0 0 0
                    0 0 1 0 0
                    0 0 0 1 0"
            result="disp3"
          />

          <feBlend in="disp2" in2="disp1" mode="screen" result="rgb12" />
          <feBlend in="rgb12" in2="thing0" mode="screen" result="withGlow" />
          <feBlend
            in="withGlow"
            in2="thing9"
            mode="multiply"
            result="withHalos"
          />
          <feGaussianBlur
            stdDeviation={postBlur / 10}
            in="withHalos"
            result="post"
          />
          <feComposite in="post" in2="thing1" operator="in" result="masked" />
          <feOffset in="masked" dx="43" dy="43" />
        </filter>
      </svg>

      {/* Lens draggable */}
      <div
        ref={dragRef}
        className={className}
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          width,
          height,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius,
          // l’effet de réfraction :
          backdropFilter: `url(#${filterId})`,
          WebkitBackdropFilter: `url(#${filterId})`,
          // léger ombrage externe facultatif
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
          cursor: draggable ? 'grab' : 'default',
          ...style,
        }}
      >
        {/* contenu net par-dessus */}
        <div style={{ position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>
          {children}
        </div>
      </div>
    </>
  );
}
