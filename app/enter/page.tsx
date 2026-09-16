"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Onboarding from "@/components/Onboarding";
import { getTeamId, rpc, TEAM_KEY, useShowdown, type Team } from "@/lib/db";
import { buzz, play } from "@/lib/fx";

export default function Enter() {
  const d = useShowdown();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(false);
  useEffect(() => { if (getTeamId()) router.replace("/team"); }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!team || busy) return;
    setBusy(true); setErr("");
    const ok = await rpc("team_login", { p_team_id: team.id, p_code: code }).catch(() => false);
    setBusy(false);
    if (!ok) { setErr(`😅 Oops! Wrong code. Try again, ${team.name.replace("TEAM ", "Team ")}!`); buzz([40, 60, 40]); play("oops"); return; }
    localStorage.setItem(TEAM_KEY, team.id); buzz(80); setWelcome(true);
  }

  if (welcome && team) return <Onboarding team={team} members={d.members.filter((m) => m.team_id === team.id)} onDone={() => router.replace("/team")} />;

  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-6 px-5 py-10">
      {!team ? (<>
        <h1 className="display text-center text-6xl">PICK YOUR <span className="text-[var(--gold)]">TEAM</span></h1>
        <div className="grid grid-cols-2 gap-3">
          {d.teams.map((t) => (
            <button key={t.id} onClick={() => { setTeam(t); buzz(); }} className="focusable arena team-glow aspect-square p-4 text-left transition active:scale-95" style={{ ["--c" as string]: t.color_hex }}>
              <span className="text-5xl">{t.emoji}</span>
              <span className="display mt-2 block text-4xl">{t.name.replace("TEAM ", "")}</span>
            </button>
          ))}
        </div>
        {!d.loaded && <p className="display text-center text-2xl text-[var(--muted)]">🔥 Preparing the arena...</p>}
      </>) : (
        <form onSubmit={submit} className={`arena team-glow grid gap-4 p-6 ${err ? "shake" : ""}`} style={{ ["--c" as string]: team.color_hex }}>
          <button type="button" onClick={() => { setTeam(null); setErr(""); }} className="focusable justify-self-start text-sm text-[var(--muted)]">← Change team</button>
          <h1 className="display text-5xl">{team.emoji} {team.name}</h1>
          <label className="grid gap-2">
            <span className="text-sm text-[var(--muted)]">Enter your team code — ask your Captain</span>
            <input autoFocus autoComplete="off" autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="focusable display rounded-2xl border border-white/20 bg-black/30 px-4 py-4 text-center text-4xl tracking-[.2em]" placeholder="CODE" aria-invalid={!!err} aria-describedby="err" />
          </label>
          {err && <p id="err" role="alert" className="text-center font-semibold text-[#ffb3ad]">{err}</p>}
          <button disabled={busy || !code} className="focusable display rounded-full py-4 text-3xl text-white shadow-[0_0_30px_-4px_var(--c)] transition active:scale-95 disabled:opacity-40" style={{ background: team.color_hex }}>
            {busy ? "🎲 Rolling the dice..." : "🚀 ENTER THE SHOWDOWN"}
          </button>
        </form>
      )}
    </main>
  );
}