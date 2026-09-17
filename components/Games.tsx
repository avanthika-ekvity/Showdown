"use client";
import { useState } from "react";
import { rpc, type Card, type Game, type Team, type TeamGame } from "@/lib/db";
import { burst, buzz, play } from "@/lib/fx";
import { MAX_CARD_OPENS, SESSION_LIMIT } from "@/lib/config";

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
  power:       ["⚡", "POWER ACQUIRED!",        "Find the admin to activate it."],
  consequence: ["😈", "FATE HAS SPOKEN.",        "You wanted The Showdown. The Showdown wanted YOU."],
  blank:       ["😶", "BETTER LUCK NEXT TIME",   "No power. No consequence. Just vibes."],
} as const;

function CardModal({ team, cards, picksLeft, onClose }: {
  team: Team; cards: Card[]; picksLeft: number; onClose: () => void;
}) {
  const [picked, setPicked]           = useState<Card | null>(null);
  const [phase, setPhase]             = useState<"idle" | "count" | "reveal">("idle");
  const [count, setCount]             = useState(3);
  const [result, setResult]           = useState<Card["type"] | null>(null);
  const [err, setErr]                 = useState("");
  const [sessionOpened, setSessionOpened] = useState(0);

  const myCards    = cards.filter(c => c.assigned_team_id === team.id);
  const totalOpened = myCards.filter(c => c.status !== "hidden").length;
  const canPick    = picksLeft > 0 && sessionOpened < SESSION_LIMIT && totalOpened < MAX_CARD_OPENS && phase === "idle";

  async function choose(c: Card) {
    if (!canPick || c.status !== "hidden") return;
    setPicked(c); setPhase("count"); buzz(30); play("dice");
    for (const n of [3, 2, 1]) {
      setCount(n);
      play("beep");
      await new Promise(r => setTimeout(r, 800));
    }
    play("card");
    try {
      const type = (await rpc("select_card", { p_team_id: team.id, p_card_id: c.id })) as Card["type"];
      setSessionOpened(s => s + 1);
      setResult(type);
      setPhase("reveal");
      if (type === "power") { burst(team.color_hex, true); play("power"); buzz([80, 40, 80]); }
      else { play("oops"); buzz(type === "consequence" ? 300 : 50); }
    } catch (e) {
      setErr(`😬 ${(e as Error).message}`);
      setPhase("idle"); setPicked(null);
    }
  }

  const doneForNow = sessionOpened >= SESSION_LIMIT || picksLeft === 0;

  return (
    <>
      {/* Full-screen modal */}
      <div className="fixed inset-0 z-50 flex flex-col"
        style={{ background: `radial-gradient(100vw 80vh at 50% 30%, ${team.color_hex}55, var(--bg) 70%)` }}>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-6 pb-4">
          <div>
            <h2 className="display text-4xl text-[var(--gold)]">🎴 MYSTERY CARDS</h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Pick {SESSION_LIMIT} cards this round · {sessionOpened}/{SESSION_LIMIT} picked
            </p>
            {err && <p role="alert" className="text-sm text-[#ffb3ad] mt-1">{err}</p>}
          </div>
          <button onClick={onClose} aria-label="Close cards"
            className="focusable mt-1 shrink-0 rounded-full bg-white/10 px-4 py-2 text-sm font-bold">
            ✕ Close
          </button>
        </div>

        {/* Cards grid */}
        <div className="flex flex-1 items-center justify-center px-6">
          {myCards.length === 0 ? (
            <div className="text-center">
              <p className="text-5xl mb-4">🎲</p>
              <p className="display text-2xl text-[var(--muted)]">Cards not found</p>
              <p className="text-sm text-[var(--muted)] mt-2">Ask the admin to check the cards setup.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 w-full max-w-sm" role="list">
              {myCards.map((c) => {
                const isHidden   = c.status === "hidden";
                const flipped    = !isHidden || (picked?.id === c.id && phase === "reveal");
                const isPickable = isHidden && canPick;
                return (
                  <button key={c.id} role="listitem"
                    disabled={!isPickable}
                    onClick={() => choose(c)}
                    aria-label={isHidden ? "Mystery card — tap to pick" : `${c.type} card`}
                    className={`focusable aspect-[3/4] [perspective:800px] disabled:cursor-default ${isPickable ? "float" : ""}`}
                    style={{ animationDelay: `${(c.id % 6) * 0.12}s` }}>
                    <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]"
                      style={{ transform: flipped ? "rotateY(180deg)" : "" }}>
                      {/* Front */}
                      <div className="absolute inset-0 grid place-items-center rounded-2xl border-2 border-[var(--gold)]/70 bg-[linear-gradient(135deg,#3b2a7a,#1c1140)] [backface-visibility:hidden]"
                        style={{ boxShadow: isPickable ? `0 0 28px -4px ${team.color_hex}` : "none" }}>
                        <span className="text-5xl">🂠</span>
                      </div>
                      {/* Back */}
                      <div className={`absolute inset-0 grid place-items-center rounded-2xl border-2 p-2 text-center [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                        c.type === "power" ? "border-yellow-300 bg-yellow-400/20" :
                        c.type === "consequence" ? "border-purple-300 bg-purple-500/25" :
                        "border-white/20 bg-white/10"}`}>
                        <span>
                          <span className="block text-4xl">
                            {c.type === "power" ? "⚡" : c.type === "consequence" ? "😈" : "😶"}
                          </span>
                          <span className="block text-[11px] leading-tight mt-1 font-semibold">
                            {c.name.replace(/[🥷❄️🤫😳😶]\s?/g, "")}
                          </span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom status */}
        <div className="px-5 pb-8 text-center grid gap-3">
          <p className="text-sm text-[var(--muted)]">
            {canPick
              ? `✨ Tap a glowing card · ${SESSION_LIMIT - sessionOpened} pick${SESSION_LIMIT - sessionOpened !== 1 ? "s" : ""} left`
              : sessionOpened >= SESSION_LIMIT
              ? `✅ You picked ${SESSION_LIMIT} cards for this game!`
              : "No picks remaining."}
          </p>
          {doneForNow && (
            <button onClick={onClose}
              className="focusable display mx-auto rounded-full bg-[var(--gold)] px-8 py-3 text-xl text-[#1b1200]">
              Continue →
            </button>
          )}
        </div>
      </div>

      {/* Countdown overlay */}
      {phase === "count" && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/90 text-center">
          <div>
            <p className="display slam text-3xl text-[var(--gold)]">THE CARD HAS SPOKEN...</p>
            <p key={count} className="display slam" style={{ fontSize: "clamp(8rem,40vw,18rem)" }}>{count}</p>
          </div>
        </div>
      )}

      {/* Reveal overlay */}
      {phase === "reveal" && result && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/90 px-6 text-center"
          onClick={() => { setPhase("idle"); setPicked(null); setResult(null); }}>
          <div className="pop grid gap-3">
            <p style={{ fontSize: "6rem", lineHeight: 1 }}>{RESULT[result][0]}</p>
            <h2 className="display text-5xl">{RESULT[result][1]}</h2>
            {picked && result !== "blank" && (
              <p className="display text-3xl text-[var(--gold)]">{picked.name}</p>
            )}
            <p className="text-[var(--muted)]">{RESULT[result][2]}</p>
            <p className="mt-4 text-sm text-[var(--muted)]">Tap anywhere to continue</p>
          </div>
        </div>
      )}
    </>
  );
}

export default function Games({ games, team_games, team, cards }: {
  games: Game[]; team_games: TeamGame[]; team: Team; cards: Card[];
}) {
  const list         = teamGames(games, team_games, team.id);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showCards, setShowCards] = useState(false);
  const final        = team_games.find((t) => t.team_id === team.id && t.game_id === "final");
  const finalGame    = games.find((g) => g.id === "final");
  const totalPicks   = team.card_chances;
  const hasEligibleDone = list.some(g => g.tg?.status === "completed" && g.power_eligible);

  const status = (g: (typeof list)[number]) =>
    g.tg?.status === "unlocked" && g.status === "live" ? "live" : g.tg?.status ?? "locked";

  return (
    <>
      {showCards && (
        <CardModal
          team={team}
          cards={cards}
          picksLeft={totalPicks}
          onClose={() => setShowCards(false)}
        />
      )}

      <div className="grid gap-3">
        {/* Picks banner */}
        {totalPicks > 0 && hasEligibleDone && (
          <button onClick={() => { setShowCards(true); play("dice"); }}
            className="focusable arena live-dot border-[var(--gold)] bg-[var(--gold)]/10 p-4 text-left w-full"
            style={{ ["--c" as string]: "var(--gold)" }}>
            <p className="display text-2xl text-[var(--gold)]">🎴 MYSTERY CARDS UNLOCKED!</p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Pick {Math.min(totalPicks, SESSION_LIMIT)} card{Math.min(totalPicks, SESSION_LIMIT) !== 1 ? "s" : ""} — tap here to open →
            </p>
          </button>
        )}

        {list.map((g, i) => {
          const s = status(g);
          const [icon, label, cls] = STATUS[s];
          const isLocked = s === "locked";
          const isOpen   = expanded === g.id;

          return (
            <div key={g.id}
              className={`arena border overflow-hidden transition-all ${cls || "border-white/10"} ${s === "live" ? "live-dot" : ""}`}
              style={{ ["--c" as string]: "var(--red)" }}>

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
              </button>

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
                    <p className="mt-2 text-xs text-[var(--gold)]">⚡ Beat the clock to earn 2 Mystery Card picks.</p>
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
        <div className={`arena flex items-center gap-3 border p-3 ${
          final?.status === "locked" ? "border-[var(--gold)]/30 opacity-60" : "border-[var(--gold)] bg-[var(--gold)]/10"}`}>
          <span className="text-3xl">{final?.status === "locked" ? "🔒" : "🧠"}</span>
          <span className="min-w-0 flex-1">
            <span className="display block text-2xl">{finalGame?.name ?? "THE FINAL SHOWDOWN"}</span>
            <span className="block text-xs text-[var(--muted)]">
              {final?.status === "locked" ? "Clear all games to unlock" : "Unlocked. Find the admin."}
            </span>
          </span>
        </div>
      </div>
    </>
  );
}