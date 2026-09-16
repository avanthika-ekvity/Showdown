"use client";
import { useEffect, useState } from "react";
import { getStaff, rpc, STAFF_KEY } from "@/lib/db";
import { buzz, play } from "@/lib/fx";

type Staff = { role: "admin" | "volunteer"; key: string };

/** Shows a code prompt until a staff key with the needed role is on this device. Volunteer pages accept admin too. */
export default function StaffGate({ need, children }: { need: "admin" | "volunteer"; children: (staff: Staff) => React.ReactNode }) {
  const [staff, setStaff] = useState<Staff | null | undefined>(undefined);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => setStaff(getStaff()), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const role = (await rpc("staff_login", { p_key: code }).catch(() => null)) as Staff["role"] | null;
    if (!role) { setErr("🕵️ Nice try! This area belongs to the Game Masters."); buzz([40, 60, 40]); play("oops"); return; }
    const s = { role, key: code }; localStorage.setItem(STAFF_KEY, JSON.stringify(s)); setStaff(s);
  }

  if (staff === undefined) return null;
  if (staff && (need === "volunteer" || staff.role === "admin")) return <>{children(staff)}</>;
  return (
    <main className="mx-auto grid min-h-dvh max-w-sm content-center px-5">
      <form onSubmit={submit} className={`arena grid gap-4 p-6 ${err ? "shake" : ""}`}>
        <h1 className="display text-5xl">{need === "admin" ? "🛠 CONTROL ROOM" : "🙋 VOLUNTEER MODE"}</h1>
        {staff && <p className="text-sm text-[#ffb3ad]">🕵️ Nice try! This area belongs to the Game Masters. Enter the admin code.</p>}
        <input autoFocus autoComplete="off" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={need === "admin" ? "ADMIN CODE" : "VOLUNTEER CODE"} aria-label="Staff code"
          className="focusable display rounded-2xl border border-white/20 bg-black/30 px-4 py-4 text-center text-3xl tracking-[.2em]" />
        {err && <p role="alert" className="text-center text-sm text-[#ffb3ad]">{err}</p>}
        <button className="focusable display rounded-full bg-[var(--gold)] py-3 text-2xl text-[#1b1200]">Unlock</button>
      </form>
    </main>
  );
}

export const logoutStaff = () => { localStorage.removeItem(STAFF_KEY); location.reload(); };