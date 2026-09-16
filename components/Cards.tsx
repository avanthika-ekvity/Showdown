"use client";
import { useState } from "react";
import { rpc, type Card, type Consequence, type Power, type Team } from "@/lib/db";
import { burst, buzz, play } from "@/lib/fx";
import { MAX_CARD_OPENS } from "@/lib/config";

const RESULT = {
  power: ["⚡", "POWER ACQUIRED!", "Your Power is ready. Find the admin to activate it."],
  consequence: ["😈", "FATE HAS SPOKEN.", "You wanted The Showdown. The Showdown wanted YOU."],
  blank: ["😶", "BETTER LUCK NEXT TIME", "No power. No consequence. Just vibes."],
} as const;

export default function Cards({ team, teams, cards, powers, consequences }: {
  team: Team; teams: Team[]; cards: Card[]; powers: Power[]; consequences: Consequence[];
}) {
  const [picked, setPicked] = useState<Card | null>(null);
  const [phase, setPhase] = useState<"idle" | "count" | "reveal">("idle");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<Card["type"] | null>(null);
  const [err, setErr] = useState("");

  // only this team's cards
  const myCards = cards.filter((c) => c.assigned_team_id === team.id);
  const opened = myCards.filter((c) => c.status !== "hidden").length;
  const canOpen = team.card_chances > 0 && opened < MAX_CARD_OPENS && phase === "idle";
  const myPowers = powers.filter((p) => p.team_id === team.id);
  const myCons = consequences.filter((c) => c.team_id === team.id);

  async function choose(c: Card) {
    if (!canOpen || c.status !== "hidden") return;
    setPicked(c); setPhase("count"); buzz(30); play("dice");
    for (const n of [3, 2, 1]) {
      setCount(n);
      await new Promise((r) => setTimeout(r, 800));
    }
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
    <div className="grid gap-4">
      <section className="arena p-4">
        <h2 className="display text-3xl">🎴 MYSTERY CARDS</h2>
        <p className="text-xs text-[var(--muted)] mt-1">
          {opened}/{MAX_CARD_OPENS} opened · {team.card_chances} pick{team.card_chances !== 1 ? "s" : ""} remaining
        </p>

        {team.card_chances > 0 && opened < MAX_CARD_OPENS
          ? <p className="display mt-2 text-xl text-[var(--gold)]">🎴 YOU'VE EARNED A PICK! Choose wisely...</p>
          : opened >= MAX_CARD_OPENS
          ? <p className="mt-2 text-sm text-[var(--muted)]">All 4 cards opened.</p>
          : <p className="mt-2 text-sm text-[var(--muted)]">Beat the clock in 🌶️ Mirchi Mayhem or 💧 Guess The Jal to earn picks.</p>}

        {err && <p role="alert" className="mt-2 text-sm text-[#ffb3ad]">{err}</p>}

        {/* 6 cards in a 3x2 grid */}
        <div className="mt-3 grid grid-cols-3 gap-2" role="list">
          {myCards.map((c) => {
            const flipped = c.status !== "hidden" || (picked?.id === c.id && phase === "reveal");
            const isFloat = c.status === "hidden" && canOpen;
            return (
              <button key={c.id} role="listitem"
                disabled={c.status !== "hidden" || !canOpen}
                onClick={() => choose(c)}
                aria-label={c.status !== "hidden" ? `Card ${c.id}, opened` : `Card ${c.id}, face down`}
                className={`focusable aspect-[3/4] [perspective:600px] ${isFloat ? "float" : ""} disabled:cursor-default`}
                style={{ animationDelay: `${c.id * 0.1}s` }}>
                <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]"
                  style={{ transform: flipped ? "rotateY(180deg)" : "" }}>
                  {/* Front: face down */}
                  <div className="absolute inset-0 grid place-items-center rounded-xl border-2 border-[var(--gold)]/60 bg-[linear-gradient(135deg,#3b2a7a,#1c1140)] text-2xl shadow-[0_0_20px_-6px_var(--gold)] [backface-visibility:hidden]">
                    🂠
                  </div>
                  {/* Back: revealed */}
                  <div className={`absolute inset-0 grid place-items-center rounded-xl border-2 p-1 text-center text-xs [backface-visibility:hidden] [transform:rotateY(180deg)] ${c.type === "power" ? "border-yellow-300 bg-yellow-400/20" : c.type === "consequence" ? "border-purple-300 bg-purple-500/25" : "border-white/30 bg-white/10"}`}>
                    <span>
                      <span className="block text-xl">{c.type === "power" ? "⚡" : c.type === "consequence" ? "😈" : "😶"}</span>
                      <span className="block text-[10px] leading-tight mt-1">{c.name.replace("🥷 ", "").replace("❄️ ", "").replace("🤫 ", "").replace("😳 ", "").replace("😶 ", "")}</span>
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

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
            <h2 className="display mt-3 text-4xl sm:text-5xl">{RESULT[result][1]}</h2>
            {picked && result !== "blank" && <p className="display text-2xl text-[var(--gold)]">{picked.name}</p>}
            <p className="mt-2 text-sm text-[var(--muted)]">{RESULT[result][2]}</p>
            <p className="mt-4 text-xs text-[var(--muted)]">Tap to continue</p>
          </div>
        </div>
      )}

      {/* Powers */}
      <section className="arena border-yellow-300/40 p-4">
        <h2 className="display text-2xl">⚡ POWERS</h2>
        {myPowers.map((p) => (
          <div key={p.id} className="mt-2 rounded-xl bg-white/5 p-3">
            <p className="display text-xl">{p.name} <span className="text-xs text-[var(--muted)]">{p.status.toUpperCase()}</span></p>
            <p className="text-xs mt-1">{p.status === "locked" ? "Not earned yet." : p.status === "used" ? "Already fired." : p.description}</p>
            {p.status === "available" && <p className="mt-1 text-xs text-[var(--gold)]">Ready. Find the admin to activate.</p>}
          </div>
        ))}
      </section>

      {/* Consequences */}
      <section className="arena border-purple-300/40 p-4">
        <h2 className="display text-2xl">😈 CONSEQUENCES</h2>
        {myCons.map((c) => (
          <div key={c.id} className="mt-2 rounded-xl bg-white/5 p-3">
            <p className="display text-xl">{c.name} <span className="text-xs text-[var(--muted)]">{c.status.toUpperCase()}</span></p>
            <p className="text-xs mt-1">{c.status === "locked" ? "Not earned yet." : c.status === "active" ? "😈 Serve it now." : c.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}