"use client";
import React, { useEffect, useRef } from "react";

export function Tilt({ children, className = "", max = 10 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${x * max}deg) rotateX(${-y * max}deg) translateY(-4px)`;
  };
  return <div ref={ref} onMouseMove={move} onMouseLeave={() => ref.current && (ref.current.style.transform = "")} className={`tilt ${className}`}>{children}</div>;
}

export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add("in"); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>;
}

export function useNow(ms = 1000) {
  const [n, setN] = React.useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => { const i = setInterval(() => setN(Math.floor(Date.now() / 1000)), ms); return () => clearInterval(i); }, [ms]);
  return n;
}

export const fmtDur = (s: number) => {
  if (s <= 0) return "Ended";
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  return d ? `${d}d ${h}h ${m}m` : h ? `${h}h ${m}m ${s % 60}s` : `${m}m ${s % 60}s`;
};
