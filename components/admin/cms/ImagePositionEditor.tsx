"use client";

import { useCallback, useRef, useState } from "react";

interface ImagePositionEditorProps {
  imageUrl: string;
  objectPosition: string;
  onChange: (position: string) => void;
}

function parsePosition(pos: string): { x: number; y: number } {
  const parts = pos.split(/\s+/);
  const x = parseFloat(parts[0] ?? "50");
  const y = parseFloat(parts[1] ?? "50");
  return { x: Number.isNaN(x) ? 50 : x, y: Number.isNaN(y) ? 50 : y };
}

export function ImagePositionEditor({ imageUrl, objectPosition, onChange }: ImagePositionEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const { x, y } = parsePosition(objectPosition);

  const updateFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      const py = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
      onChange(`${Math.round(px)}% ${Math.round(py)}%`);
    },
    [onChange],
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-admin-muted">Drag to adjust crop focus ({objectPosition})</p>
      <div
        ref={containerRef}
        className="relative aspect-square cursor-crosshair overflow-hidden border border-admin-border bg-neutral-900 select-none"
        onPointerDown={(e) => {
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
          updateFromEvent(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (!dragging) return;
          updateFromEvent(e.clientX, e.clientY);
        }}
        onPointerUp={() => setDragging(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover pointer-events-none"
          style={{ objectPosition }}
          draggable={false}
        />
        <div
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-admin-accent"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      </div>
    </div>
  );
}
