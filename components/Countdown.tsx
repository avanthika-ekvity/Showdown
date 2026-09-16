"use client";
import { useEffect, useState } from "react";
import { mmss, timeLeft, type Timer } from "@/lib/db";

/** Live countdown for a server timer. Ticks locally; the source of truth is started_at/paused_at. */
export default function Countdown({ timer, big, label }: { timer: Timer; big?: boolean; label?: string }) {
  const [, tick] = useState(0);
  useEffect(() => { if (timer.status !== "running") return; const i = setInterval(() => tick((n) => n + 1), 500); return () => clearInterval(i); }, [timer.status]);
  const left = timeLeft(timer);
  const urgent = timer.status === "running" && left <= 10;
  return (
    <div className={`text-center ${urgent ? "text-[#ff8a80]" : ""}`} role="timer" aria-live={urgent ? "assertive" : "off"}>
      {label && <p className="text-xs text-[var(--muted)]">{label}</p>}
      <p className={`display tabular-nums ${big ? "text-8xl" : "text-5xl"} ${timer.status === "paused" ? "opacity-60" : ""} ${urgent ? "shake" : ""}`}>{mmss(left)}</p>
      <p className="text-xs text-[var(--muted)]">{timer.status === "paused" ? "⏸ PAUSED" : timer.status === "completed" ? "✅ DONE" : left === 0 ? "⏰ TIME'S UP" : "⏱ RUNNING"}</p>
    </div>
  );
}