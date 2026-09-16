"use client";
import { useState } from "react";
import type { Game, Team, TeamGame } from "@/lib/db";

export const STATUS = {
  locked: ["🔒", "LOCKED", ""],
  unlocked: ["🟢", "UNLOCKED", "border-green-400/60 bg-green-400/10"],
  live: ["🔴", "LIVE NOW", "border-red-400/80 bg-red-500/15"],
  completed: ["✅", "DONE", "border-white/20 bg-white/5"],
} as const;

export function teamGames(games: Game[], team_games: TeamGame[], teamId: string) {
  return games
    .filter((g) => g.type !== "final" && (!g.assigned_team_id || g.assigned_team_id === teamId))
    .map((g) => ({ ...g, tg: team_games.find((t) => t.team_id === teamId && t.game_id === g.id) }))
    .sort((a, b) => a.order_number - b.order_number);
}

export default function Games({ games, team_games, team }: { games: Game[]; team_games: TeamGame[]; team: Team }) {
  const list = teamGames(games, team_games, team.id);
  const [expanded, setExpanded] = useState<string | null>(null);
  const final = team_games.find((t) => t.team_id === team.id && t.game_id === "final");
  const finalGame = games.find((g) => g.id === "final");

  const status = (g: (typeof list)[number]) =>
    g.tg?.status === "unlocked" && g.status === "live" ? "live" : g.tg?.status ?? "locked";

  return (
    <div className="grid gap-3">
      {list.map((g, i) => {
        const s = status(g);
        const [icon, label, cls] = STATUS[s];
        const isLocked = s === "locked";
        const isOpen = expanded === g.id;

        return (
          <div key={g.id} className={`arena border overflow-hidden transition-all ${cls || "border-white/10"} ${s === "live" ? "live-dot" : ""}`} style={{ ["--c" as string]: "var(--red)" }}>
            {/* Card header */}
            <button
              onClick={() => !isLocked && setExpanded(isOpen ? null : g.id)}
              disabled={isLocked}
              aria-expanded={isOpen}
              className={`focusable w-full p-3 text-left ${isLocked ? "cursor-default" : ""}`}>
              <div className="flex items-center gap-3">
                <span className={`text-3xl ${isLocked ? "grayscale opacity-40" : ""}`}>
                  {isLocked ? "🔒" : g.emoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs text-[var(--muted)]">
                    GAME {i + 1}{g.assigned_team_id ? " · YOUR EXCLUSIVE" : ""}
                  </span>
                  {isLocked ? (
                    <span className="display block text-2xl blur-sm select-none">???? ??????</span>
                  ) : (
                    <span className="display block truncate text-2xl">{g.name}</span>
                  )}
                  <span className="block text-xs text-[var(--muted)]">
                    {isLocked ? `Complete Game ${i} to unlock` : g.tagline}
                  </span>
                </span>
                <span className="display shrink-0 text-right text-lg leading-tight">
                  {icon}<br />
                  <span className="text-xs">{s === "completed" ? `+${g.tg?.points_awarded ?? g.points_awarded}` : label}</span>
                </span>
              </div>
            </button>

            {/* Inline rules — only when expanded and not locked */}
            {isOpen && !isLocked && (
              <div className="border-t border-white/10 px-3 pb-3 pt-2">
                <p className="text-sm">{g.description}</p>
                {g.rules && (
                  <>
                    <p className="display mt-3 text-lg">RULES</p>
                    <ol className="mt-1 list-decimal space-y-1 pl-5 text-xs">
                      {g.rules.split("\n").filter(Boolean).map((r, i) => <li key={i}>{r}</li>)}
                    </ol>
                  </>
                )}
                {g.twist && (
                  <div className="mt-3 rounded-xl border border-orange-400/50 bg-orange-500/10 p-2">
                    <p className="text-xs text-orange-200 font-bold">SPECIAL TWIST</p>
                    <p className="text-sm">{g.twist}</p>
                  </div>
                )}
                {g.team_config?.[team.id] && (
                  <div className="mt-2 rounded-xl bg-white/10 p-2">
                    <p className="text-xs text-[var(--muted)]">{team.emoji} YOUR CHALLENGE</p>
                    <p className="text-sm font-semibold">{g.team_config[team.id]}</p>
                  </div>
                )}
                {g.power_eligible && (
                  <p className="mt-2 text-xs text-[var(--gold)]">⚡ Beat the clock to earn Mystery Card picks.</p>
                )}
                <p className="mt-3 rounded-xl bg-black/30 p-2 text-center text-xs text-[var(--muted)]">
                  Complete the challenge. Admin marks it done.
                </p>
              </div>
            )}
          </div>
        );
      })}

      {/* Final showdown row */}
      <div className={`arena flex items-center gap-3 border p-3 ${final?.status === "locked" ? "border-[var(--gold)]/30 opacity-60" : "border-[var(--gold)] bg-[var(--gold)]/10"}`}>
        <span className="text-3xl">{final?.status === "locked" ? "🔒" : "🧠"}</span>
        <span className="min-w-0 flex-1">
          <span className="display block text-2xl">{finalGame?.name ?? "THE FINAL SHOWDOWN"}</span>
          <span className="block text-xs text-[var(--muted)]">{final?.status === "locked" ? "Clear all games to unlock" : "Unlocked. Find the admin."}</span>
        </span>
      </div>
    </div>
  );
}