"use client";
import { useEffect, useState } from "react";
import Winner from "@/components/Winner";
import { ranked, RANK_LABEL, useShowdown, type Team } from "@/lib/db";
import { useShakeUp } from "@/components/Landing";
import { burst } from "@/lib/fx";

const GAMES_ORDER = ["rope", "pyramid", "mirchi", "jal", "twister"];
const GAME_LABELS: Record<string, string> = { rope: "ROPE RUMBLE", pyramid: "PYRAMID PANIC", mirchi: "MIRCHI MAYHEM", jal: "GUESS THE JAL", twister: "TWISTER TURBO" };
const GAME_EMOJIS: Record<string, string> = { rope: "🪢", pyramid: "🥤", mirchi: "🌶️", jal: "💧", twister: "👅" };

function TeamRaceCard({ team, teamGames, rank, pulse }: { team: Team; teamGames: Record<string, string>; rank: number; pulse: boolean }) {
  const completed = GAMES_ORDER.filter(g => teamGames[g] === "completed").length;
  const current = GAMES_ORDER.find(g => teamGames[g] === "unlocked" || teamGames[g] === "live");
  return (
    <div className={`relative overflow-hidden rounded-3xl border-2 p-5 transition-all duration-700 ${pulse ? "scale-[1.02]" : ""}`}
      style={{ borderColor: team.color_hex, background: `linear-gradient(135deg, ${team.color_hex}22, #1c1140)`, boxShadow: pulse ? `0 0 40px -4px ${team.color_hex}` : `0 0 20px -8px ${team.color_hex}` }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{RANK_LABEL[rank]}</span>
          <span className="text-5xl">{team.emoji}</span>
          <div>
            <p className="display text-4xl leading-none">{team.name}</p>
            <p className="text-sm mt-0.5" style={{ color: team.color_hex }}>{completed}/5 games done</p>
          </div>
        </div>
        <div className="text-right">
          <p className="display text-6xl leading-none">{team.score}</p>
          <p className="text-sm text-[var(--muted)]">STEPS</p>
        </div>
      </div>

      {/* Stage track */}
      <div className="grid grid-cols-5 gap-2">
        {GAMES_ORDER.map((gid, i) => {
          const s = teamGames[gid] ?? "locked";
          const isDone = s === "completed";
          const isLive = s === "live";
          const isNext = gid === current && !isLive;
          const isLocked = s === "locked";
          return (
            <div key={gid} className={`relative rounded-2xl p-2 text-center transition-all duration-500 ${isDone ? "bg-green-500/20 border border-green-400/60" : isLive ? "border-2 border-red-400 bg-red-500/20" : isNext ? "border border-white/40 bg-white/10" : "border border-white/10 bg-white/5 opacity-40"}`}>
              {/* Connector line */}
              {i < 4 && <div className={`absolute top-1/2 -right-2 h-0.5 w-2 z-10 ${isDone ? "bg-green-400" : "bg-white/20"}`} />}
              <div className={`text-2xl mb-1 ${isLocked ? "grayscale opacity-50" : ""}`}>
                {isDone ? "✅" : isLive ? <span className="animate-pulse">🔴</span> : GAME_EMOJIS[gid]}
              </div>
              <p className={`text-[9px] leading-tight font-bold ${isDone ? "text-green-300" : isLive ? "text-red-300" : isNext ? "text-white" : "text-white/40"}`}>
                {isDone ? "DONE" : isLive ? "LIVE" : isNext ? "NEXT" : `TASK ${i + 1}`}
              </p>
              <p className={`text-[8px] leading-tight mt-0.5 ${isLocked ? "text-white/20" : "text-white/60"}`}>
                {GAME_LABELS[gid].split(" ")[0]}
              </p>
            </div>
          );
        })}
      </div>

      {/* Current game callout */}
      {(current || teamGames["final"] === "unlocked") && (
        <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: `${team.color_hex}33` }}>
          <span className="text-lg">{teamGames["final"] === "unlocked" ? "🧠" : GAME_EMOJIS[current!]}</span>
          <p className="text-sm font-bold">{teamGames["final"] === "unlocked" ? "FINAL SHOWDOWN" : GAME_LABELS[current!]}</p>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: team.color_hex }}>
            {teamGames[current!] === "live" ? "🔴 LIVE" : "UP NEXT →"}
          </span>
        </div>
      )}
      {completed === 5 && teamGames["final"] !== "unlocked" && teamGames["final"] !== "completed" && (
        <div className="mt-3 rounded-xl bg-[var(--gold)]/20 border border-[var(--gold)]/50 px-3 py-2 text-center">
          <p className="text-sm font-bold text-[var(--gold)]">🏁 All games done · Final Showdown unlocking...</p>
        </div>
      )}
    </div>
  );
}

export default function TV() {
  const d = useShowdown();
  const teams = ranked(d.teams);
  const banner = useShakeUp(teams, d.loaded);
  const live = d.games.find((g) => g.status === "live");
  const [pulseTeam, setPulseTeam] = useState<string | null>(null);
  const last = d.score_history[d.score_history.length - 1];

  useEffect(() => {
    if (!last) return;
    setPulseTeam(last.team_id);
    const t = setTimeout(() => setPulseTeam(null), 3000);
    return () => clearTimeout(t);
  }, [last?.id]);

  useEffect(() => {
    if (banner?.[0].includes("NEW LEADER")) burst(teams[0]?.color_hex, true);
  }, [banner]);

  if (!d.loaded) return <p className="display grid min-h-dvh place-items-center text-6xl text-[var(--muted)]">🔥 Preparing the arena...</p>;
  if (d.settings?.event_status === "complete") return <Winner d={d} />;

  // Build per-team game status map
  const getTeamGames = (teamId: string) => {
    const map: Record<string, string> = {};
    d.team_games.filter(tg => tg.team_id === teamId).forEach(tg => { map[tg.game_id] = tg.status; });
    return map;
  };

  return (
    <main className="min-h-dvh p-6 grid grid-rows-[auto_1fr_auto] gap-4">
      {/* Banner */}
      {banner && (
        <div role="status" className="slam fixed inset-x-12 top-6 z-40 rounded-3xl bg-[var(--gold)] px-8 py-4 text-center text-[#1b1200] shadow-2xl">
          <b className="display text-5xl">{banner[0]}</b><br />
          <span className="text-xl font-semibold">{banner[1]}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="display text-7xl">THE <span className="text-[var(--gold)]">SHOWDOWN</span></h1>
          <p className="display text-2xl text-[var(--muted)]">4 Teams. 1 Board. 1 Winner.</p>
        </div>
        <div className="arena px-6 py-3 flex items-center gap-4">
          {live ? (
            <>
              <span className="live-dot grid h-14 w-14 place-items-center rounded-full bg-[var(--red)] text-3xl shrink-0" style={{ ["--c" as string]: "var(--red)" }}>{live.emoji}</span>
              <div>
                <p className="text-sm font-bold tracking-widest text-[#ff8a80]">🔴 NOW PLAYING</p>
                <p className="display text-4xl">{live.name}</p>
              </div>
            </>
          ) : (
            <p className="display text-3xl text-[var(--muted)]">😴 Warming up...</p>
          )}
        </div>
      </header>

      {/* Team race cards — 2x2 grid */}
      <div className="grid grid-cols-2 gap-4">
        {teams.map((t, i) => (
          <TeamRaceCard key={t.id} team={t} teamGames={getTeamGames(t.id)} rank={i} pulse={pulseTeam === t.id} />
        ))}
      </div>

      {/* Footer */}
      <footer className="flex items-center justify-between text-sm text-[var(--muted)]">
        <div className="flex items-center gap-6">
          {last && (
            <span className="arena px-4 py-2">
              <span>{new Date(last.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              {" · "}{d.teams.find(t => t.id === last.team_id)?.emoji} {last.reason}
              <b className={`ml-2 ${last.change_amount < 0 ? "text-[#ff8a80]" : "text-green-300"}`}>{last.change_amount > 0 ? "+" : ""}{last.change_amount}</b>
            </span>
          )}
        </div>
        <p className="display text-lg">📱 {typeof location !== "undefined" ? location.host : ""}/enter</p>
      </footer>
    </main>
  );
}