"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

const DEFAULT_LENS_SIZE = 112;
const DEFAULT_LENS_ZOOM = 2.25;

interface LensState {
  x: number;
  y: number;
  bgW: number;
  bgH: number;
  bgX: number;
  bgY: number;
}

interface ProductImageLoupeProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  lensSize?: number;
  lensZoom?: number;
}

export function ProductImageLoupe({
  src,
  alt,
  sizes,
  className = "",
  lensSize = DEFAULT_LENS_SIZE,
  lensZoom = DEFAULT_LENS_ZOOM,
}: ProductImageLoupeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState<LensState | null>(null);

  const updateLens = useCallback(
    (clientX: number, clientY: number) => {
      const el = wrapperRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const half = lensSize / 2;
      const clampedX = Math.max(half, Math.min(rect.width - half, x));
      const clampedY = Math.max(half, Math.min(rect.height - half, y));
      const bgW = rect.width * lensZoom;
      const bgH = rect.height * lensZoom;

      setLens({
        x: clampedX - half,
        y: clampedY - half,
        bgW,
        bgH,
        bgX: -(clampedX * lensZoom - half),
        bgY: -(clampedY * lensZoom - half),
      });
    },
    [lensSize, lensZoom],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      updateLens(e.clientX, e.clientY);
    },
    [updateLens],
  );

  const handleMouseLeave = useCallback(() => {
    setLens(null);
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={`product-img-wrapper ${lens ? "is-lens-active" : ""} ${className}`.trim()}
      onMouseEnter={handleMouseMove}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Image src={src} alt={alt} fill sizes={sizes} />
      {lens ? (
        <div
          className="product-img-lens"
          aria-hidden="true"
          style={{
            left: lens.x,
            top: lens.y,
            width: lensSize,
            height: lensSize,
            backgroundImage: `url(${src})`,
            backgroundSize: `${lens.bgW}px ${lens.bgH}px`,
            backgroundPosition: `${lens.bgX}px ${lens.bgY}px`,
          }}
        />
      ) : null}
    </div>
  );
}
