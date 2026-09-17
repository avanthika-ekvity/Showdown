"use client";
import { useState } from "react";
import { rpc, type Card, type Game, type Team, type TeamGame } from "@/lib/db";
import { burst, buzz, play } from "@/lib/fx";
import { MAX_CARD_OPENS } from "@/lib/config";

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

const RESULT = {
  power: ["⚡", "POWER ACQUIRED!", "Find the admin to activate it."],
  consequence: ["😈", "FATE HAS SPOKEN.", "You wanted The Showdown. The Showdown wanted YOU."],
  blank: ["😶", "BETTER LUCK NEXT TIME", "No power. No consequence. Just vibes."],
} as const;

function InlineCards({ team, cards, picksLeft }: { team: Team; cards: Card[]; picksLeft: number }) {
  const [picked, setPicked] = useState<Card | null>(null);
  const [phase, setPhase] = useState<"idle" | "count" | "reveal">("idle");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<Card["type"] | null>(null);
  const [err, setErr] = useState("");

  const myCards = cards.filter(c => c.assigned_team_id === team.id);
  const opened = myCards.filter(c => c.status !== "hidden").length;
  const canPick = picksLeft > 0 && opened < MAX_CARD_OPENS && phase === "idle";

  async function choose(c: Card) {
    if (!canPick || c.status !== "hidden") return;
    setPicked(c); setPhase("count"); buzz(30); play("dice");
    for (const n of [3, 2, 1]) { setCount(n); await new Promise(r => setTimeout(r, 800)); }
    try {
      const type = (await rpc("select_card", { p_team_id: team.id, p_card_id: c.id })) as Card["type"];
      setResult(type); setPhase("reveal");
      if (type === "power") { burst(team.color_hex, true); play("power"); buzz([80, 40, 80]); }
      else { play("oops"); buzz(type === "consequence" ? 300 : 50); }
    } catch (e) {
      setErr(`😬 ${(e as Error).message}`);
      setPhase("idle"); setPicked(null);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-[var(--gold)]/60 bg-[var(--gold)]/10 p-3">
      <p className="display text-xl text-[var(--gold)]">🎴 PICK YOUR MYSTERY CARDS</p>
      <p className="text-xs text-[var(--muted)] mt-0.5">
        {opened}/{MAX_CARD_OPENS} opened · {picksLeft} pick{picksLeft !== 1 ? "s" : ""} left
      </p>
      {err && <p role="alert" className="text-xs text-[#ffb3ad] mt-1">{err}</p>}

      {myCards.length === 0 ? (
        <p className="mt-2 text-center text-xs text-[var(--muted)]">🎲 Cards loading...</p>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2" role="list">
          {myCards.map((c) => {
            const flipped = c.status !== "hidden" || (picked?.id === c.id && phase === "reveal");
            return (
              <button key={c.id} role="listitem"
                disabled={c.status !== "hidden" || !canPick}
                onClick={() => choose(c)}
                aria-label={c.status !== "hidden" ? `Card opened` : `Mystery card, tap to pick`}
                className={`focusable aspect-[3/4] [perspective:600px] ${c.status === "hidden" && canPick ? "float" : ""} disabled:cursor-default`}
                style={{ animationDelay: `${c.id * 0.08}s` }}>
                <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]"
                  style={{ transform: flipped ? "rotateY(180deg)" : "" }}>
                  {/* Front: face down */}
                  <div className="absolute inset-0 grid place-items-center rounded-xl border-2 border-[var(--gold)]/60 bg-[linear-gradient(135deg,#3b2a7a,#1c1140)] text-xl shadow-[0_0_16px_-6px_var(--gold)] [backface-visibility:hidden]">
                    🂠
                  </div>
                  {/* Back: revealed */}
                  <div className={`absolute inset-0 grid place-items-center rounded-xl border-2 p-1 text-center text-[10px] [backface-visibility:hidden] [transform:rotateY(180deg)] ${c.type === "power" ? "border-yellow-300 bg-yellow-400/20" : c.type === "consequence" ? "border-purple-300 bg-purple-500/25" : "border-white/30 bg-white/10"}`}>
                    <span>
                      <span className="block text-lg">{c.type === "power" ? "⚡" : c.type === "consequence" ? "😈" : "😶"}</span>
                      <span className="block leading-tight mt-0.5">{c.name.replace(/[🥷❄️🤫😳😶]\s?/g, "")}</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Countdown overlay */}
      {phase === "count" && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 text-center">
          <div>
            <p className="display slam text-2xl text-[var(--gold)]">THE CARD HAS SPOKEN...</p>
            <p key={count} className="display slam text-[35vw] sm:text-[10rem]">{count}</p>
          </div>
        </div>
      )}

      {/* Reveal overlay */}
      {phase === "reveal" && result && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 px-6 text-center"
          onClick={() => { setPhase("idle"); setPicked(null); setResult(null); }}>
          <div className="pop">
            <p className="text-6xl">{RESULT[result][0]}</p>
            <h2 className="display mt-3 text-4xl">{RESULT[result][1]}</h2>
            {picked && result !== "blank" && (
              <p className="display text-2xl text-[var(--gold)]">{picked.name}</p>
            )}
            <p className="mt-2 text-sm text-[var(--muted)]">{RESULT[result][2]}</p>
            <p className="mt-4 text-xs text-[var(--muted)]">Tap to continue</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Games({ games, team_games, team, cards }: {
  games: Game[]; team_games: TeamGame[]; team: Team; cards: Card[];
}) {
  const list = teamGames(games, team_games, team.id);
  const [expanded, setExpanded] = useState<string | null>(null);
  const final = team_games.find((t) => t.team_id === team.id && t.game_id === "final");
  const finalGame = games.find((g) => g.id === "final");
  const totalPicks = team.card_chances;

  // Auto-expand power-eligible completed game when picks are waiting
  const autoExpand = list.find(g =>
    g.tg?.status === "completed" && g.power_eligible && totalPicks > 0
  );
  const activeExpanded = expanded ?? autoExpand?.id ?? null;

  const status = (g: (typeof list)[number]) =>
    g.tg?.status === "unlocked" && g.status === "live" ? "live" : g.tg?.status ?? "locked";

  return (
    <div className="grid gap-3">
      {list.map((g, i) => {
        const s = status(g);
        const [icon, label, cls] = STATUS[s];
        const isLocked = s === "locked";
        const isOpen = activeExpanded === g.id;
        // Show cards if game is done, is power-eligible, and team still has picks
        const showCards = s === "completed" && g.power_eligible && totalPicks > 0;

        return (
          <div key={g.id}
            className={`arena border overflow-hidden transition-all ${cls || "border-white/10"} ${s === "live" ? "live-dot" : ""}`}
            style={{ ["--c" as string]: "var(--red)" }}>

            {/* Card header button */}
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
                  {isLocked
                    ? <span className="display block text-2xl blur-sm select-none text-[var(--muted)]">???? ??????</span>
                    : <span className="display block truncate text-2xl">{g.name}</span>}
                  <span className="block text-xs text-[var(--muted)]">
                    {isLocked ? `Complete Game ${i} to unlock` : g.tagline}
                  </span>
                </span>
                <span className="display shrink-0 text-right text-lg leading-tight">
                  {icon}<br />
                  <span className="text-xs">
                    {s === "completed" ? `+${g.tg?.points_awarded ?? g.points_awarded}` : label}
                  </span>
                </span>
              </div>
              {/* Card picks badge */}
              {showCards && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--gold)]/20 border border-[var(--gold)]/50 px-2 py-0.5">
                  <span className="text-xs">🎴</span>
                  <span className="text-xs font-bold text-[var(--gold)]">
                    {totalPicks} card pick{totalPicks !== 1 ? "s" : ""} waiting!
                  </span>
                </div>
              )}
            </button>

            {/* Inline rules when expanded */}
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
                {g.power_eligible && s !== "completed" && (
                  <p className="mt-2 text-xs text-[var(--gold)]">⚡ Beat the clock to earn Mystery Card picks.</p>
                )}
                <p className="mt-3 rounded-xl bg-black/30 p-2 text-center text-xs text-[var(--muted)]">
                  Complete the challenge. Admin marks it done.
                </p>
                {/* Card picker inside expanded rules */}
                {showCards && (
                  <InlineCards team={team} cards={cards} picksLeft={totalPicks} />
                )}
              </div>
            )}

            {/* Card picker visible even when collapsed */}
            {!isOpen && showCards && (
              <div className="border-t border-[var(--gold)]/30 px-3 pb-3 pt-2">
                <InlineCards team={team} cards={cards} picksLeft={totalPicks} />
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
          <span className="block text-xs text-[var(--muted)]">
            {final?.status === "locked" ? "Clear all games to unlock" : "Unlocked. Find the admin."}
          </span>
        </span>
      </div>
    </div>
  );
}