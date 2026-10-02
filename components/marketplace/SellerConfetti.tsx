"use client";

import { useEffect, useState } from "react";

const COLORS = ["#e8ff47", "#ffffff", "#5cff9a", "#ffb347", "#7ec8ff", "#ff7eb6"];

interface Particle {
  id: number;
  left: string;
  delay: string;
  duration: string;
  color: string;
  drift: string;
  size: string;
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${8 + Math.random() * 84}%`,
    delay: `${Math.random() * 0.35}s`,
    duration: `${1.1 + Math.random() * 0.9}s`,
    color: COLORS[i % COLORS.length],
    drift: `${(Math.random() - 0.5) * 120}px`,
    size: `${4 + Math.random() * 5}px`,
  }));
}

export function SellerConfetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    setParticles(makeParticles(36));
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 2200);
    return () => window.clearTimeout(t);
  }, [active]);

  if (!visible) return null;

  return (
    <div className="mp-confetti" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="mp-confetti-bit"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            animationDelay: p.delay,
            animationDuration: p.duration,
            ["--mp-drift" as string]: p.drift,
          }}
        />
      ))}
    </div>
  );
}
