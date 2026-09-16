"use client";
import { useEffect, useState } from "react";
import Dice from "./Dice";
import { Roster } from "./Landing";
import { ranked, RANK_LABEL, type Showdown } from "@/lib/db";
import { burst, play } from "@/lib/fx";

/** Full-screen finale: dice → 4th, 3rd, 2nd revealed → pause → champions with roster, confetti, fireworks. */
export default function Winner({ d }: { d: Showdown }) {
  const order = ranked(d.teams);
  const champ = d.teams.find((t) => t.id === d.settings?.winner_team_id) ?? order[0];
  const [step, setStep] = useState(0); // 0 dice, 1..3 reveal 4th..2nd, 4 pause, 5 champions, 6 outro
  useEffect(() => {
    const delay = [1800, 1600, 1600, 1600, 1400, 6000][step];
    if (step === 5) { play("win"); burst(champ.color_hex, true); const i = setInterval(() => burst(champ.color_hex, true), 1500); const t = setTimeout(() => { clearInterval(i); setStep(6); }, delay); return () => { clearInterval(i); clearTimeout(t); }; }
    if (step >= 6) return;
    if (step > 0 && step < 4) play("score");
    const t = setTimeout(() => setStep(step + 1), delay);
    return () => clearTimeout(t);
  }, [step, champ.color_hex]);

  return (
    <main className="fixed inset-0 z-[60] overflow-y-auto px-6 py-10 text-center" style={{ background: step >= 5 ? `radial-gradient(90vw 70vh at 50% 30%, ${champ.color_hex}77, var(--bg) 70%)` : "var(--bg)" }}>
      <div className="mx-auto grid min-h-full max-w-2xl content-center gap-6">
        {step === 0 && <div className="grid justify-items-center gap-6"><Dice size={120} /><p className="display slam text-5xl text-[var(--muted)]">FINAL STANDINGS</p></div>}
        {step >= 1 && step < 5 && (
          <ol className="grid gap-3">
            {[3, 2, 1].map((pos, i) => i < step && <li key={pos} className="arena team-glow slam flex items-center gap-4 p-4 text-left" style={{ ["--c" as string]: order[pos].color_hex }}><span className="display text-5xl">{RANK_LABEL[pos]}</span><span className="text-4xl">{order[pos].emoji}</span><span className="display flex-1 text-4xl">{order[pos].name}</span><span className="display text-4xl">{order[pos].score}</span></li>)}
            {step === 4 && <li className="display slam text-5xl text-[var(--gold)]">AND YOUR CHAMPIONS ARE...</li>}
          </ol>
        )}
        {step >= 5 && (
          <div className="pop">
            <p className="text-8xl">🏆</p>
            <h1 className="display text-6xl text-[var(--gold)] sm:text-8xl">THE SHOWDOWN CHAMPIONS</h1>
            <h2 className="display mt-2 text-7xl sm:text-9xl">🔥 {champ.name} 🔥</h2>
            <p className="display mt-2 text-5xl">{champ.score} STEPS · {RANK_LABEL[0]} · CHECKPOINT {champ.board_position}/20</p>
            <div className="mx-auto mt-4 max-w-lg text-left"><Roster members={d.members.filter((m) => m.team_id === champ.id)} /></div>
            {step >= 6 && <div className="rise mt-8"><p className="display text-4xl">WHAT A SHOWDOWN!</p><p className="display text-3xl text-[var(--muted)]">THE SHOWDOWN IS OVER. BUT THE LEGEND LIVES ON.</p><p className="mt-2 text-[var(--muted)]">See you at the next one. 🔥</p></div>}
          </div>
        )}
      </div>
    </main>
  );
}