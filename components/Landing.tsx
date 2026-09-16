"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ranked, RANK_LABEL, useShowdown, type Member, type Team } from "@/lib/db";
import { burst, play } from "@/lib/fx";
import Sheet from "./Sheet";
import Winner from "./Winner";

const ROLE = { captain: ["👑", "Captain"], power_holder: ["⚡", "Power Holder"], consequence_holder: ["😈", "Consequence Holder"], player: ["🎮", "Player"] } as const;
const ZONES: Record<number, string> = { 0: "START", 5: "⚡ POWER", 10: "😈 CONSEQUENCE", 14: "🔥 BATTLE", 18: "🏁 FINAL", 20: "FINISH" };

export default function Landing({ onReplayIntro }: { onReplayIntro: () => void }) {
  const d = useShowdown();
  const teams = ranked(d.teams);
  const live = d.games.find((g) => g.status === "live");
  const [open, setOpen] = useState<Team | null>(null);
  const banner = useShakeUp(teams, d.loaded);
  const done = d.team_games.filter((t) => t.status === "completed").length;
  const total = d.team_games.filter((t) => t.game_id !== "final").length;

  if (!d.loaded) return <p className="display grid min-h-dvh place-items-center text-3xl text-[var(--muted)]">🎲 Rolling the dice...</p>;
  if (d.settings?.event_status === "complete") return <Winner d={d} />;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6">
      {banner && <div role="status" className="slam fixed inset-x-4 top-4 z-40 rounded-2xl bg-[var(--gold)] px-5 py-3 text-center text-[#1b1200] shadow-2xl"><b className="display text-2xl">{banner[0]}</b><br /><span className="font-semibold">{banner[1]}</span></div>}

      <header className="flex items-center justify-between">
        <button onClick={onReplayIntro} className="focusable display text-3xl leading-none">THE <span className="text-[var(--gold)]">SHOWDOWN</span></button>
        <nav className="flex gap-2 text-sm">
          <Link href="/tv" className="focusable rounded-full border border-white/20 px-3 py-1.5">📺 TV</Link>
          <Link href="/admin" className="focusable rounded-full border border-white/20 px-3 py-1.5">🛠</Link>
        </nav>
      </header>

      <section className="mt-6 text-center">
        <h1 className="display text-6xl sm:text-8xl">4 TEAMS. 1 BOARD. <span className="text-[var(--gold)]">1 WINNER.</span></h1>
        <p className="mt-2 text-[var(--muted)]">Ekvity's one-day office showdown. Live from the arena.</p>
      </section>

      {/* NOW PLAYING */}
      <section className="arena mt-8 flex items-center gap-4 p-5" aria-label="Now playing">
        {live ? (<>
          <span className="live-dot grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[var(--red)] text-3xl" style={{ ["--c" as string]: "var(--red)" }}>{live.emoji}</span>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#ff8a80]">🔴 NOW PLAYING · LIVE</p>
            <h2 className="display text-4xl">{live.name}</h2>
            <p className="text-[var(--muted)]">{live.tagline}</p>
          </div>
        </>) : (<>
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/10 text-3xl">😴</span>
          <div><h2 className="display text-3xl">Nothing happening yet</h2><p className="text-[var(--muted)]">The Showdown is warming up!</p></div>
        </>)}
      </section>

      {/* LEADERBOARD */}
      <section className="mt-10" aria-label="Leaderboard">
        <h2 className="display text-4xl sm:text-5xl">🏆 THE SHOWDOWN BOARD</h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {teams.map((t, i) => (
            <li key={t.id} className="arena team-glow p-4 transition-all duration-700" style={{ ["--c" as string]: t.color_hex }}>
              <button onClick={() => setOpen(t)} className="focusable w-full text-left" aria-label={`${t.name}, ${t.score} steps, rank ${i + 1}`}>
                <div className="flex items-start justify-between">
                  <span className="display text-3xl">{RANK_LABEL[i]}</span>
                  <span className="text-3xl">{t.emoji}</span>
                </div>
                <p className="display mt-1 text-4xl">{t.name.replace("TEAM ", "")}</p>
                <p className="display text-5xl"><span key={t.score} className="inline-block bump">{t.score}</span> <span className="text-2xl text-[var(--muted)]">STEPS</span></p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.board_position * 5}%`, background: t.color_hex }} /></div>
                <p className="mt-1 text-xs text-[var(--muted)]">Checkpoint {t.board_position} / 20</p>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* BOARD */}
      <section className="mt-10" aria-label="Showdown arena board">
        <h2 className="display text-4xl sm:text-5xl">🎲 SHOWDOWN ARENA</h2>
        <Board teams={d.teams} />
      </section>

      {/* PROGRESS */}
      <section className="arena mt-10 p-5">
        <div className="flex items-baseline justify-between"><h2 className="display text-3xl">EVENT PROGRESS</h2><span className="display text-3xl text-[var(--gold)]">{done}/{total}</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[var(--gold)] transition-all duration-700" style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></div>
        <p className="mt-3 text-sm text-[var(--muted)]">
          {d.settings?.event_status === "final" ? "🧠 THE FINAL SHOWDOWN is live. The final battle has begun!" : done === total && total > 0 ? "All games crushed. Final Showdown loading..." : "🧠 Final Showdown unlocks when every team clears all 5 games."}
        </p>
      </section>

      <Link href="/enter" className="focusable display fixed inset-x-4 bottom-4 z-30 rounded-full bg-[var(--gold)] py-4 text-center text-3xl text-[#1b1200] shadow-[0_0_40px_-4px_var(--gold)] transition active:scale-95 sm:inset-x-auto sm:right-6 sm:px-10">🚀 ENTER THE SHOWDOWN</Link>

      {open && <TeamModal team={open} rank={teams.findIndex((t) => t.id === open.id)} members={d.members.filter((m) => m.team_id === open.id)} onClose={() => setOpen(null)} />}
    </main>
  );
}

/** Announces leader changes / reorders for ~4s. */
export function useShakeUp(teams: Team[], loaded: boolean) {
  const prev = useRef<string>("");
  const [banner, setBanner] = useState<[string, string] | null>(null);
  const order = teams.map((t) => t.id).join(",");
  useEffect(() => {
    if (!loaded) return;
    if (prev.current && prev.current !== order) {
      const oldLeader = prev.current.split(",")[0];
      const leader = teams[0];
      const newLeader = leader.id !== oldLeader;
      setBanner(newLeader ? ["🏆 NEW LEADER!", `${leader.emoji} ${leader.name} JUST TOOK THE LEAD!`] : ["🚨 LEADERBOARD SHAKE-UP!", "The ranks just moved."]);
      burst(newLeader ? leader.color_hex : undefined, newLeader); play(newLeader ? "win" : "score");
      const t = setTimeout(() => setBanner(null), 4000);
      return () => clearTimeout(t);
    }
    prev.current = order;
  }, [order, loaded, teams]);
  useEffect(() => { prev.current = order; }, [order]);
  return banner;
}

export function Board({ teams, big }: { teams: Team[]; big?: boolean }) {
  // 21 cells, serpentine 7x3. Tokens sit on teams.board_position.
  const cells = Array.from({ length: 21 }, (_, i) => ({ i, row: Math.floor(i / 7), col: Math.floor(i / 7) % 2 === 0 ? i % 7 : 6 - (i % 7) }));
  return (
    <div className="arena mt-4 grid grid-cols-7 gap-1.5 p-2 sm:gap-2 sm:p-4" style={{ gridTemplateRows: "repeat(3, 1fr)" }}>
      {cells.map(({ i, row, col }) => {
        const zone = ZONES[i];
        const here = teams.filter((t) => t.board_position === i);
        return (
          <div key={i} style={{ gridRow: row + 1, gridColumn: col + 1 }}
            className={`relative aspect-square rounded-lg border text-center ${zone ? "border-[var(--gold)]/60 bg-[var(--gold)]/10" : "border-white/10 bg-white/5"}`}>
            <span className={`absolute inset-x-0 top-0.5 truncate px-0.5 text-[8px] leading-tight sm:text-[10px] ${zone ? "font-bold text-[var(--gold)]" : "text-white/30"}`}>{zone ?? i}</span>
            <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 pt-2">
              {here.map((t) => <span key={t.id} title={t.name} className={`rounded-full transition-all duration-700 ${big ? "text-3xl" : "text-base sm:text-2xl"}`} style={{ filter: `drop-shadow(0 0 6px ${t.color_hex})` }}>{t.emoji}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeamModal({ team, rank, members, onClose }: { team: Team; rank: number; members: Member[]; onClose: () => void }) {
  return (
    <Sheet label={team.name} color={team.color_hex} onClose={onClose}>
      <h2 className="display text-5xl">{team.emoji} {team.name}</h2>
      <div className="mt-3 flex gap-6"><div><p className="text-xs text-[var(--muted)]">SCORE</p><p className="display text-4xl">{team.score}</p></div><div><p className="text-xs text-[var(--muted)]">RANK</p><p className="display text-4xl">{RANK_LABEL[rank]}</p></div></div>
      <Roster members={members} />
    </Sheet>
  );
}

/** Captain / Power / Consequence as highlighted cards, players as a grid. Shared by landing + team dashboard. */
export function Roster({ members, blurbs }: { members: Member[]; blurbs?: Partial<Record<Member["role"], string>> }) {
  const byRole = (r: Member["role"]) => members.filter((m) => m.role === r);
  return (
    <div className="mt-4 grid gap-2">
      {(["captain", "power_holder", "consequence_holder"] as const).map((r) => byRole(r).map((m) => (
        <div key={m.id} className={`rounded-2xl border p-3 ${r === "power_holder" ? "border-yellow-300/40 bg-yellow-300/10" : r === "consequence_holder" ? "border-purple-300/40 bg-purple-400/10" : "border-white/20 bg-white/10"}`}>
          <p className="text-xs text-[var(--muted)]">{ROLE[r][0]} {ROLE[r][1].toUpperCase()}</p>
          <p className="display text-2xl">{m.avatar} {m.name.split(" ")[0]} <span className="text-[var(--gold)]">"{m.nickname}"</span> {m.name.split(" ").slice(1).join(" ")}</p>
          {blurbs?.[r] && <p className="mt-1 text-sm text-[var(--muted)]">{blurbs[r]}</p>}
        </div>
      )))}
      <p className="mt-2 text-xs text-[var(--muted)]">🎮 PLAYERS</p>
      <ul className="grid grid-cols-2 gap-2">{byRole("player").map((m) => <li key={m.id} className="rounded-xl bg-white/5 p-2 text-sm"><span className="text-xl">{m.avatar}</span> {m.name.split(" ")[0]}<br /><span className="text-xs text-[var(--muted)]">"{m.nickname}"</span></li>)}</ul>
    </div>
  );
}