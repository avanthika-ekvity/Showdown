"use client";
import { useState } from "react";
import { rpc, type Card, type Consequence, type Power, type Team } from "@/lib/db";
import { burst, buzz, play } from "@/lib/fx";

const RESULT = {
  power: ["⚡", "POWER ACQUIRED!", "Your Power Holder now has a weapon. Volunteer approval required to fire it."],
  consequence: ["😈", "FATE HAS SPOKEN.", "You wanted The Showdown. The Showdown wanted YOU."],
  blank: ["😶", "BETTER LUCK NEXT TIME", "No power. No consequence. Just vibes."],
} as const;

export default function Cards({ team, teams, cards, powers, consequences }: { team: Team; teams: Team[]; cards: Card[]; powers: Power[]; consequences: Consequence[] }) {
  const [picked, setPicked] = useState<Card | null>(null);
  const [phase, setPhase] = useState<"idle" | "count" | "reveal">("idle");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState<Card["type"] | null>(null);
  const [err, setErr] = useState("");
  const mine = cards.filter((c) => c.assigned_team_id === team.id);
  const myPowers = powers.filter((p) => p.team_id === team.id);
  const myCons = consequences.filter((c) => c.team_id === team.id);

  async function choose(c: Card) {
    if (phase !== "idle" || c.status !== "hidden") return;
    setPicked(c); setPhase("count"); buzz(30); play("dice");
    for (const n of [3, 2, 1]) { setCount(n); await new Promise((r) => setTimeout(r, 800)); }
    try {
      const type = (await rpc("select_card", { p_team_id: team.id, p_card_id: c.id })) as Card["type"];
      setResult(type); setPhase("reveal");
      if (type === "power") { burst(team.color_hex, true); play("power"); buzz([80, 40, 80]); } else if (type === "consequence") { play("oops"); buzz(300); } else { play("oops"); buzz(50); }
    } catch (e) { setErr(`😬 ${(e as Error).message}`); setPhase("idle"); setPicked(null); }
  }

  return (
    <div className="grid gap-5">
      <section className="arena p-4">
        <h2 className="display text-4xl">🎴 MYSTERY CARDS</h2>
        {team.card_chances > 0 ? <p className="display text-2xl text-[var(--gold)]">🎴 YOU'VE EARNED A CARD! Choose wisely...</p> : <p className="text-sm text-[var(--muted)]">Earn a pick by beating the clock in 🌶️ Mirchi Mayhem or 💧 Guess The Jal. Volunteer unlocks it.</p>}
        {err && <p role="alert" className="text-sm text-[#ffb3ad]">{err}</p>}
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6" role="list">
          {cards.map((c) => {
            const taken = c.status !== "hidden"; const owner = teams.find((t) => t.id === c.assigned_team_id);
            const flipped = taken || (picked?.id === c.id && phase === "reveal");
            return (
              <button key={c.id} role="listitem" disabled={taken || team.card_chances === 0 || phase !== "idle"} onClick={() => choose(c)} aria-label={taken ? `Card ${c.id}, taken by ${owner?.name}` : `Card ${c.id}, face down`}
                className={`focusable aspect-[3/4] [perspective:600px] ${!taken && team.card_chances > 0 && phase === "idle" ? "float" : ""} disabled:cursor-default`} style={{ animationDelay: `${c.id * 0.13}s` }}>
                <div className="relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]" style={{ transform: flipped ? "rotateY(180deg)" : "" }}>
                  <div className="absolute inset-0 grid place-items-center rounded-xl border-2 border-[var(--gold)]/60 bg-[linear-gradient(135deg,#3b2a7a,#1c1140)] text-3xl shadow-[0_0_20px_-6px_var(--gold)] [backface-visibility:hidden]">🂠</div>
                  <div className={`absolute inset-0 grid place-items-center rounded-xl border-2 p-1 text-center text-xs [backface-visibility:hidden] [transform:rotateY(180deg)] ${c.type === "power" ? "border-yellow-300 bg-yellow-400/20" : c.type === "consequence" ? "border-purple-300 bg-purple-500/25" : "border-white/30 bg-white/10"}`}>
                    <span><span className="block text-2xl">{c.type === "power" ? "⚡" : c.type === "consequence" ? "😈" : "😶"}</span>{owner?.emoji}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {phase === "count" && <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 text-center"><div><p className="display slam text-4xl text-[var(--gold)]">THE CARD HAS SPOKEN...</p><p key={count} className="display slam text-[40vw] sm:text-[14rem]">{count}</p></div></div>}
      {phase === "reveal" && result && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 px-6 text-center" onClick={() => { setPhase("idle"); setPicked(null); setResult(null); }}>
          <div className="pop"><p className="text-8xl">{RESULT[result][0]}</p><h2 className="display mt-4 text-6xl">{RESULT[result][1]}</h2>{picked && result !== "blank" && <p className="display text-3xl text-[var(--gold)]">{picked.name}</p>}<p className="mt-2 text-[var(--muted)]">{RESULT[result][2]}</p><p className="mt-6 text-sm text-[var(--muted)]">Tap to continue</p></div>
        </div>
      )}

      <PowerPanel team={team} teams={teams} powers={myPowers} />
      <section className="arena border-purple-300/40 p-4">
        <h2 className="display text-3xl">😈 CONSEQUENCE HOLDER</h2><p className="text-sm text-[var(--muted)]">Your team's fate is in your hands.</p>
        {myCons.map((c) => <div key={c.id} className="mt-2 rounded-xl bg-white/5 p-3"><p className="display text-2xl">{c.name} <span className="text-sm text-[var(--muted)]">{c.status.toUpperCase()}</span></p><p className="text-sm">{c.status === "locked" ? "Someone is going to suffer. 😈" : c.status === "active" ? "😈 OH NO... Do it now. Volunteer is watching." : c.description}</p></div>)}
      </section>
      {mine.length > 0 && <p className="text-center text-xs text-[var(--muted)]">Your cards: {mine.map((c) => c.name).join(" · ")}</p>}
    </div>
  );
}

function PowerPanel({ team, teams, powers }: { team: Team; teams: Team[]; powers: Power[] }) {
  const [tgt, setTgt] = useState<Record<string, string>>({});
  return (
    <section className="arena border-yellow-300/40 p-4">
      <h2 className="display text-3xl">⚡ POWER HOLDER</h2>
      {powers.map((p) => (
        <div key={p.id} className="mt-2 rounded-xl bg-white/5 p-3">
          <p className="display text-2xl">{p.name} <span className="text-sm text-[var(--muted)]">{p.status.toUpperCase()}</span></p>
          <p className="text-sm">{p.status === "locked" ? "Power ready? Not yet..." : p.status === "used" ? "Fired. One and done." : p.description}</p>
          {p.status === "available" && <div className="mt-2 flex gap-2">
            <select value={tgt[p.id] ?? ""} onChange={(e) => setTgt({ ...tgt, [p.id]: e.target.value })} aria-label="Target team" className="focusable flex-1 rounded-lg bg-black/40 px-2 py-2"><option value="">Choose a target…</option>{teams.filter((t) => t.id !== team.id).map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}</select>
            <button disabled={!tgt[p.id]} onClick={() => rpc("request_power", { p_team_id: team.id, p_power_id: p.id, p_target_team_id: tgt[p.id] }).then(() => { buzz(60); play("power"); })} className="focusable rounded-full bg-yellow-400 px-4 font-bold text-black disabled:opacity-40">Lock target</button>
          </div>}
          {p.status === "activated" && <p className="mt-1 text-sm text-[var(--gold)]">Target locked: {teams.find((t) => t.id === p.target_team_id)?.name}. <b>Volunteer approval required.</b> Go find one.</p>}
          {p.status === "available" && <p className="mt-1 text-xs text-[var(--muted)]">Your power is ready. Volunteer approval required.</p>}
        </div>
      ))}
    </section>
  );
}