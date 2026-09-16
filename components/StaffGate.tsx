"use client";
import { useEffect, useState } from "react";
import { rpc, STAFF_KEY } from "@/lib/db";
import { buzz, play } from "@/lib/fx";

export type Staff = { role: "admin" | "volunteer"; key: string; teamId: string | null };

export default function StaffGate({ need, children }: { need: "admin" | "volunteer"; children: (staff: Staff) => React.ReactNode }) {
  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => setStaff(getStaff()), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const rows = (await rpc("staff_login", { p_key: code }).catch(() => null)) as { role: "admin" | "volunteer"; team_id: string | null }[] | null;
    const row = rows?.[0];
    if (!row) { setErr("🕵️ Nice try! This area belongs to the Game Masters."); buzz([40, 60, 40]); play("oops"); return; }
    const s: Staff = { role: row.role, key: code, teamId: row.team_id ?? null };
    localStorage.setItem(STAFF_KEY, JSON.stringify(s));
    setStaff(s);
  }

  if (staff === undefined) return null;
  if (staff && (need === "volunteer" || staff.role === "admin")) return <>{children(staff)}</>;
  return (
    <main className="mx-auto grid min-h-dvh max-w-sm content-center px-5">
      <form onSubmit={submit} className={`arena grid gap-4 p-6 ${err ? "shake" : ""}`}>
        <h1 className="display text-4xl">🛠 CONTROL ROOM</h1>
        <input autoFocus autoComplete="off" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ENTER CODE" aria-label="Staff code"
          className="focusable display rounded-2xl border border-white/20 bg-black/30 px-4 py-4 text-center text-3xl tracking-[.2em]" />
        {err && <p role="alert" className="text-center text-sm text-[#ffb3ad]">{err}</p>}
        <button className="focusable display rounded-full bg-[var(--gold)] py-3 text-2xl text-[#1b1200]">Unlock</button>
      </form>
    </main>
  );
}

export const logoutStaff = () => { localStorage.removeItem(STAFF_KEY); location.reload(); };
export const getStaff = (): Staff | null => { try { return JSON.parse(localStorage.getItem(STAFF_KEY) || "null"); } catch { return null; } };