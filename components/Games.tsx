"use client";
import { useState } from "react";
import Sheet from "./Sheet";
import type { Game, Team, TeamGame } from "@/lib/db";

export const STATUS = {
  locked: ["🔒", "LOCKED", "border-white/10 opacity-60"],
  unlocked: ["🟢", "UNLOCKED", "border-green-400/60 bg-green-400/10"],
  live: ["🔴", "LIVE NOW", "border-red-400/80 bg-red-500/15"],
  completed: ["✅", "DONE", "border-white/20 bg-white/5"],
} as const;

/** A team's games in order with per-team status. `live` is the globally live game (admin-controlled). */
export function teamGames(games: Game[], team_games: TeamGame[], teamId: string) {
  return games
    .filter((g) => g.type !== "final" && (!g.assigned_team_id || g.assigned_team_id === teamId))
    .map((g) => ({ ...g, tg: team_games.find((t) => t.team_id === teamId && t.game_id === g.id) }))
    .sort((a, b) => a.order_number - b.order_number);
}

export default function Games({ games, team_games, team }: { games: Game[]; team_games: TeamGame[]; team: Team }) {
  const list = teamGames(games, team_games, team.id);
  const [open, setOpen] = useState<(typeof list)[number] | null>(null);
  const final = team_games.find((t) => t.team_id === team.id && t.game_id === "final");
  const finalGame = games.find((g) => g.id === "final");

  const status = (g: (typeof list)[number]) => (g.tg?.status === "unlocked" && g.status === "live" ? "live" : g.tg?.status ?? "locked");

  return (
    <div className="grid gap-3">
      {list.map((g, i) => {
        const s = status(g); const [icon, label, cls] = STATUS[s];
        return (
          <button key={g.id} onClick={() => setOpen(g)} disabled={s === "locked"} aria-label={`Game ${i + 1} ${g.name}, ${label}`}
            className={`focusable arena flex items-center gap-4 border p-4 text-left transition active:scale-[.98] ${cls} ${s === "live" ? "live-dot" : ""}`} style={{ ["--c" as string]: "var(--red)" }}>
            <span className="text-4xl">{s === "locked" ? "🔒" : g.emoji}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-[var(--muted)]">GAME {i + 1}{g.is_unique || g.assigned_team_id ? " · YOUR EXCLUSIVE" : ""}</span>
              <span className="display block truncate text-3xl">{g.name}</span>
              <span className="block truncate text-sm text-[var(--muted)]">{s === "locked" ? (i > 0 ? `Complete Game ${i} to unlock` : "Locked") : g.tagline}</span>
            </span>
            <span className="display shrink-0 text-right text-xl leading-tight">{icon}<br /><span className="text-sm">{s === "completed" ? `+${g.tg?.points_awarded ?? g.points_awarded}` : label}</span></span>
          </button>
        );
      })}
      <div className={`arena flex items-center gap-4 border p-4 ${final?.status === "locked" ? "border-[var(--gold)]/30 opacity-70" : "border-[var(--gold)] bg-[var(--gold)]/10"}`}>
        <span className="text-4xl">{final?.status === "locked" ? "🔒" : "🧠"}</span>
        <span className="min-w-0 flex-1"><span className="display block text-3xl">{finalGame?.name ?? "THE FINAL SHOWDOWN"}</span><span className="block text-sm text-[var(--muted)]">{final?.status === "locked" ? "Clear all 5 games to unlock" : "Unlocked. Find a volunteer."}</span></span>
      </div>

      {open && (
        <Sheet label={open.name} color={team.color_hex} onClose={() => setOpen(null)}>
          <p className="text-xs text-[var(--muted)]">{STATUS[status(open)][0]} {STATUS[status(open)][1]} · +{open.points_awarded} STEPS{open.time_limit_seconds ? ` · ⏱ ${Math.floor(open.time_limit_seconds / 60)}:${String(open.time_limit_seconds % 60).padStart(2, "0")}` : ""}</p>
          <h2 className="display text-5xl">{open.emoji} {open.name}</h2>
          <p className="display text-2xl text-[var(--gold)]">{open.tagline}</p>
          <p className="mt-2">{open.description}</p>
          {open.rules && <><h3 className="display mt-4 text-2xl">RULES</h3><ol className="list-decimal space-y-1 pl-5 text-sm">{open.rules.split("\n").filter(Boolean).map((r, i) => <li key={i}>{r}</li>)}</ol></>}
          {open.twist && <div className="mt-4 rounded-2xl border border-orange-400/50 bg-orange-500/10 p-3"><p className="text-xs text-orange-200">SPECIAL TWIST</p><p className="font-semibold">{open.twist}</p></div>}
          {open.team_config?.[team.id] && <div className="mt-3 rounded-2xl bg-white/10 p-3"><p className="text-xs text-[var(--muted)]">{team.emoji} FOR {team.name}</p><p className="font-semibold">{open.team_config[team.id]}</p></div>}
          {open.power_eligible && <p className="mt-3 text-sm">⚡ Finish inside the time limit to earn a Mystery Card chance.</p>}
          <p className="mt-5 rounded-2xl bg-black/30 p-3 text-center text-sm text-[var(--muted)]">Complete the challenge with the volunteer. They mark it done.</p>
        </Sheet>
      )}
    </div>
  );
}