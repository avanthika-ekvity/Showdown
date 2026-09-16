"use client";
import { useEffect, useState } from "react";
import Dice from "./Dice";

const SCENES: [React.ReactNode, number][] = [
  [<Dice key="dice" size={80} />, 1900],
  [<div key="colors" className="flex gap-3 text-5xl sm:text-7xl">{["🔴", "🔵", "🟡", "🟢"].map((e, i) => <span key={e} className="pop" style={{ animationDelay: `${i * 0.15}s` }}>{e}</span>)}</div>, 1400],
  [<Line key="a">4 TEAMS</Line>, 900],
  [<Line key="b">32 PLAYERS</Line>, 900],
  [<Line key="c">1 BOARD</Line>, 900],
  [<Line key="d">1 WINNER</Line>, 1100],
  [<Title key="t" />, 1600],
  [<Line key="e" small>LET THE GAMES BEGIN.</Line>, 1200],
];

function Line({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return <h2 className={`display slam text-center ${small ? "text-3xl sm:text-5xl text-[var(--gold)]" : "text-6xl sm:text-8xl"}`}>{children}</h2>;
}

function Title() {
  return (
    <h1 className="display slam text-center leading-[.85]">
      <span className="block text-4xl sm:text-6xl text-[var(--muted)]">THE</span>
      <span className="block text-[22vw] sm:text-[10rem] bg-clip-text text-transparent bg-[linear-gradient(90deg,var(--red),var(--yellow),var(--green),var(--blue))]">SHOWDOWN</span>
    </h1>
  );
}

export default function Intro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const last = i >= SCENES.length;
  useEffect(() => {
    if (last) return;
    const t = setTimeout(() => setI(i + 1), SCENES[i][1]);
    return () => clearTimeout(t);
  }, [i, last]);

  return (
    <main className="fixed inset-0 grid place-items-center bg-[var(--bg)] px-4" aria-live="polite">
      <button onClick={onDone} className="focusable absolute right-3 top-3 text-xs text-[var(--muted)] underline-offset-4 hover:underline">Skip intro</button>
      {!last ? (
        <div key={i}>{SCENES[i][0]}</div>
      ) : (
        <div className="rise flex flex-col items-center gap-6 text-center px-4">
          <Title />
          <p className="display text-xl sm:text-3xl text-[var(--gold)]">4 Teams. 1 Board. 1 Winner.</p>
          <button onClick={onDone} className="focusable display rounded-full bg-[var(--gold)] px-8 py-3 text-2xl sm:text-3xl text-[#1b1200] shadow-[0_0_40px_-4px_var(--gold)] transition active:scale-95 hover:scale-105">
            🚀 ENTER THE SHOWDOWN
          </button>
        </div>
      )}
    </main>
  );
}