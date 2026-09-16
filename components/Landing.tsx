"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ranked, RANK_LABEL, useShowdown, type Team } from "@/lib/db";
import { TEAM_CONFIG, type TeamId } from "@/lib/config";
import { burst, play } from "@/lib/fx";
import Sheet from "./Sheet";
import Winner from "./Winner";

const ZONES: Record<number, string> = { 0: "START", 5: "⚡ PWR", 10: "😈 CON", 14: "🔥 BTL", 18: "🏁 FIN", 20: "FINISH" };

export default function Landing({ onReplayIntro }: { onReplayIntro: () => void }) {
  const d = useShowdown();
  const teams = ranked(d.teams);
  const live = d.games.find((g) => g.status === "live");
  const [open, setOpen] = useState<Team | null>(null);
  const banner = useShakeUp(teams, d.loaded);
  const done = d.team_games.filter((t) => t.status === "completed").length;
  const total = d.team_games.filter((t) => t.game_id !== "final").length;

  if (!d.loaded) return <p className="display grid min-h-dvh place-items-center text-2xl text-[var(--muted)]">🎲 Rolling the dice...</p>;
  if (d.settings?.event_status === "complete") return <Winner d={d} />;

  return (
    <main className="mx-auto max-w-2xl px-3 pb-24 pt-4 sm:px-5">
      {banner && <div role="status" className="slam fixed inset-x-3 top-3 z-40 rounded-2xl bg-[var(--gold)] px-4 py-2 text-center text-[#1b1200] shadow-2xl"><b className="display text-xl">{banner[0]}</b><br /><span className="text-sm font-semibold">{banner[1]}</span></div>}

      <header className="flex items-center justify-between">
        <button onClick={onReplayIntro} className="focusable display text-2xl leading-none">THE <span className="text-[var(--gold)]">SHOWDOWN</span></button>
        <nav className="flex gap-2 text-xs">
          <Link href="/tv" className="focusable rounded-full border border-white/20 px-3 py-1.5">📺 TV</Link>
          <Link href="/admin" className="focusable rounded-full border border-white/20 px-3 py-1.5">🛠</Link>
        </nav>
      </header>

      <section className="mt-4 text-center">
        <h1 className="display text-4xl sm:text-6xl">4 TEAMS. 1 BOARD. <span className="text-[var(--gold)]">1 WINNER.</span></h1>
        <p className="mt-1 text-xs text-[var(--muted)]">Ekvity's one-day office showdown. Live from the arena.</p>
      </section>

      {/* NOW PLAYING */}
      <section className="arena mt-4 flex items-center gap-3 p-3" aria-label="Now playing">
        {live ? (<>
          <span className="live-dot grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--red)] text-2xl" style={{ ["--c" as string]: "var(--red)" }}>{live.emoji}</span>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#ff8a80]">🔴 NOW PLAYING</p>
            <h2 className="display text-2xl">{live.name}</h2>
            <p className="text-xs text-[var(--muted)]">{live.tagline}</p>
          </div>
        </>) : (<>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-2xl">😴</span>
          <div><h2 className="display text-xl">Nothing happening yet</h2><p className="text-xs text-[var(--muted)]">The Showdown is warming up!</p></div>
        </>)}
      </section>

      {/* LEADERBOARD */}
      <section className="mt-5" aria-label="Leaderboard">
        <h2 className="display text-2xl sm:text-3xl">🏆 THE SHOWDOWN BOARD</h2>
        <ol className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {teams.map((t, i) => (
            <li key={t.id} className="arena team-glow p-3 transition-all duration-700" style={{ ["--c" as string]: t.color_hex }}>
              <button onClick={() => setOpen(t)} className="focusable w-full text-left">
                <div className="flex items-start justify-between">
                  <span className="display text-xl">{RANK_LABEL[i]}</span>
                  <span className="text-2xl">{t.emoji}</span>
                </div>
                <p className="display mt-1 text-2xl">{t.name.replace("TEAM ", "")}</p>
                <p className="display text-3xl"><span key={t.score} className="inline-block bump">{t.score}</span> <span className="text-base text-[var(--muted)]">PTS</span></p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${t.board_position * 5}%`, background: t.color_hex }} /></div>
                <p className="mt-1 text-[10px] text-[var(--muted)]">Step {t.board_position}/20</p>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* BOARD */}
      <section className="mt-5" aria-label="Arena board">
        <h2 className="display text-2xl sm:text-3xl">🎲 SHOWDOWN ARENA</h2>
        <Board teams={d.teams} />
      </section>

      {/* PROGRESS */}
      <section className="arena mt-5 p-3">
        <div className="flex items-baseline justify-between">
          <h2 className="display text-xl">EVENT PROGRESS</h2>
          <span className="display text-xl text-[var(--gold)]">{done}/{total}</span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-[var(--gold)] transition-all duration-700" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {d.settings?.event_status === "final" ? "🧠 Final Showdown is live!" : "🧠 Final Showdown unlocks when every team clears all games."}
        </p>
      </section>

      <Link href="/enter" className="focusable display fixed inset-x-3 bottom-3 z-30 rounded-full bg-[var(--gold)] py-3 text-center text-2xl text-[#1b1200] shadow-[0_0_40px_-4px_var(--gold)] transition active:scale-95 sm:inset-x-auto sm:right-5 sm:px-8">🚀 ENTER THE SHOWDOWN</Link>

      {open && <TeamModal team={open} rank={teams.findIndex((t) => t.id === open.id)} onClose={() => setOpen(null)} />}
    </main>
  );
}

export function useShakeUp(teams: Team[], loaded: boolean) {
  const prev = useRef<string>("");
  const [banner, setBanner] = useState<[string, string] | null>(null);
  const order = teams.map((t) => t.id).join(",");
  useEffect(() => {
    if (!loaded) return;
    if (prev.current && prev.current !== order) {
      const newLeader = teams[0].id !== prev.current.split(",")[0];
      setBanner(newLeader ? ["🏆 NEW LEADER!", `${teams[0].emoji} ${teams[0].name} JUST TOOK THE LEAD!`] : ["🚨 LEADERBOARD SHAKE-UP!", "The ranks just moved."]);
      burst(newLeader ? teams[0].color_hex : undefined, newLeader);
      play(newLeader ? "win" : "score");
      const t = setTimeout(() => setBanner(null), 4000);
      return () => clearTimeout(t);
    }
    prev.current = order;
  }, [order, loaded, teams]);
  useEffect(() => { prev.current = order; }, [order]);
  return banner;
}

export function Board({ teams, big }: { teams: Team[]; big?: boolean }) {
  const cells = Array.from({ length: 21 }, (_, i) => ({ i, row: Math.floor(i / 7), col: Math.floor(i / 7) % 2 === 0 ? i % 7 : 6 - (i % 7) }));
  return (
    <div className="arena mt-2 grid grid-cols-7 gap-1 p-2 sm:gap-1.5 sm:p-3" style={{ gridTemplateRows: "repeat(3, 1fr)" }}>
      {cells.map(({ i, row, col }) => {
        const zone = ZONES[i];
        const here = teams.filter((t) => t.board_position === i);
        return (
          <div key={i} style={{ gridRow: row + 1, gridColumn: col + 1 }}
            className={`relative aspect-square rounded-md border text-center ${zone ? "border-[var(--gold)]/60 bg-[var(--gold)]/10" : "border-white/10 bg-white/5"}`}>
            <span className={`absolute inset-x-0 top-0 truncate px-0.5 text-[7px] leading-tight sm:text-[9px] ${zone ? "font-bold text-[var(--gold)]" : "text-white/30"}`}>{zone ?? i}</span>
            <div className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5 pt-2">
              {here.map((t) => <span key={t.id} title={t.name} className={`${big ? "text-2xl" : "text-sm sm:text-xl"}`} style={{ filter: `drop-shadow(0 0 4px ${t.color_hex})` }}>{t.emoji}</span>)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TeamModal({ team, rank, onClose }: { team: Team; rank: number; onClose: () => void }) {
  const config = TEAM_CONFIG[team.id as TeamId];
  const members = config?.members ?? [];
  return (
    <Sheet label={team.name} color={team.color_hex} onClose={onClose}>
      <h2 className="display text-4xl">{team.emoji} {team.name}</h2>
      <div className="mt-2 flex gap-4">
        <div><p className="text-xs text-[var(--muted)]">SCORE</p><p className="display text-3xl">{team.score}</p></div>
        <div><p className="text-xs text-[var(--muted)]">RANK</p><p className="display text-3xl">{RANK_LABEL[rank]}</p></div>
      </div>
      <p className="display mt-3 text-lg text-[var(--gold)]">THE SQUAD</p>
      <ul className="mt-2 grid grid-cols-2 gap-1.5">
        {members.map((name, i) => (
          <li key={i} className="rounded-xl bg-white/5 px-3 py-2 text-sm">
            {name.split(" ")[0]} <span className="text-xs text-[var(--muted)]">{name.split(" ").slice(1).join(" ")}</span>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

// Keep Roster exported for Winner screen
export function Roster({ members }: { members: { name: string }[] }) {
  return (
    <ul className="mt-2 grid grid-cols-2 gap-1.5">
      {members.map((m, i) => (
        <li key={i} className="rounded-xl bg-white/5 px-3 py-2 text-sm">{m.name}</li>
      ))}
    </ul>
  );
}