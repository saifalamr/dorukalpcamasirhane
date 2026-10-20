"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Scale the paper as a whole; never reflow document columns at phone widths. */
export function DispatchPreview({ children }: { children: ReactNode }) {
  const viewport = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 1, height: 0 });

  useEffect(() => {
    const outer = viewport.current;
    const inner = stage.current;
    if (!outer || !inner) return;
    const measure = () => {
      const scale = Math.min(1, outer.clientWidth / inner.offsetWidth);
      const height = Math.ceil(inner.offsetHeight * scale);
      setSize(previous => previous.scale === scale && previous.height === height
        ? previous : { scale, height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={viewport} className="dispatch-preview" style={{ height: size.height || undefined }}>
      <div ref={stage} className="dispatch-stage" style={{ transform: `scale(${size.scale})` }}>
        {children}
      </div>
    </div>
  );
}
