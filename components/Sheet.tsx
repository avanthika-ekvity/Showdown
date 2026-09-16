"use client";
import { useEffect } from "react";
/** Bottom sheet on mobile, centered dialog on desktop. Escape / backdrop closes. */
export default function Sheet({ label, color, onClose, children }: { label: string; color?: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-6" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={label} onClick={(e) => e.stopPropagation()}
        className={`rise max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[var(--bg2)] p-5 sm:rounded-3xl ${color ? "team-glow" : ""}`} style={{ ["--c" as string]: color }}>
        <button onClick={onClose} aria-label="Close" className="focusable float-right text-2xl text-[var(--muted)]">✕</button>
        {children}
      </div>
    </div>
  );
}