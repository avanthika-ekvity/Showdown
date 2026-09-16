"use client";
import { useEffect, useState } from "react";
import Dice from "./Dice";
import { burst, play } from "@/lib/fx";
import { TEAM_CONFIG, type TeamId } from "@/lib/config";
import type { Team } from "@/lib/db";

export default function Onboarding({ team, onDone }: { team: Team; onDone: () => void }) {
  const config = TEAM_CONFIG[team.id as TeamId];
  const members = config?.members ?? [];

  const scenes: [React.ReactNode, number][] = [
    [
      <div key="w" className="grid justify-items-center gap-4">
        <Dice size={70} />
        <h1 className="display slam text-center text-4xl sm:text-6xl">
          {team.emoji} WELCOME,<br />{team.name}!
        </h1>
      </div>,
      2200,
    ],
    [
      <div key="s" className="rise w-full max-w-xs">
        <p className="display mb-3 text-center text-2xl text-[var(--gold)]">YOUR SQUAD</p>
        <ul className="grid grid-cols-2 gap-2">
          {members.map((name, i) => (
            <li key={i} className="pop rounded-xl bg-white/10 px-3 py-2 text-center text-sm font-semibold"
              style={{ animationDelay: `${i * 0.1}s` }}>
              {name.split(" ")[0]}
              <span className="block text-xs text-[var(--muted)]">{name.split(" ").slice(1).join(" ")}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-center text-xs text-[var(--muted)]">
          Roles will be decided on the day 🎲
        </p>
      </div>,
      3500,
    ],
    [
      <div key="m" className="slam grid gap-2 text-center px-4">
        <p className="display text-3xl sm:text-4xl">Your squad is officially in.</p>
        <p className="text-base text-[var(--muted)]">Mission: reach the top of The Showdown Board.</p>
      </div>,
      2400,
    ],
    [<p key="3" className="display slam text-[35vw] sm:text-[10rem]">3</p>, 800],
    [<p key="2" className="display slam text-[35vw] sm:text-[10rem]">2</p>, 800],
    [<p key="1" className="display slam text-[35vw] sm:text-[10rem]">1</p>, 800],
    [<h1 key="go" className="display slam text-center text-6xl sm:text-8xl">🔥 SHOWDOWN!</h1>, 1800],
  ];

  const [i, setI] = useState(0);
  useEffect(() => {
    if (i === 0) { play("dice"); burst(team.color_hex, true); }
    if (i === 6) { play("win"); burst(team.color_hex, true); }
    if (i >= scenes.length) { onDone(); return; }
    const t = setTimeout(() => setI(i + 1), scenes[i][1]);
    return () => clearTimeout(t);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <main className="fixed inset-0 grid place-items-center px-4 text-center"
      style={{ background: `radial-gradient(80vw 60vh at 50% 40%, ${team.color_hex}66, var(--bg) 70%)` }}>
      <button onClick={onDone} className="focusable absolute right-4 top-4 text-xs text-[var(--muted)] underline-offset-4 hover:underline">Skip</button>
      <div key={i} className="w-full max-w-sm">{scenes[Math.min(i, scenes.length - 1)][0]}</div>
    </main>
  );
}