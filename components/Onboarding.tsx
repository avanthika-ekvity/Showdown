"use client";
import { useEffect, useState } from "react";
import Dice from "./Dice";
import { burst, play } from "@/lib/fx";
import type { Member, Team } from "@/lib/db";

export default function Onboarding({ team, members, onDone }: { team: Team; members: Member[]; onDone: () => void }) {
  const first = (r: Member["role"]) => members.find((m) => m.role === r)?.name.split(" ")[0] ?? "—";
  const scenes: [React.ReactNode, number][] = [
    [<div key="w" className="grid justify-items-center gap-6"><Dice size={90} /><h1 className="display slam text-6xl sm:text-8xl">{team.emoji} WELCOME,<br />{team.name}!</h1></div>, 2200],
    [<div key="s" className="rise grid w-full max-w-sm gap-3 text-left">
      {[["👑 Captain", first("captain")], ["⚡ Power Holder", first("power_holder")], ["😈 Consequence Holder", first("consequence_holder")], ["🎮 Players", `${members.filter((m) => m.role === "player").length} members`]].map(([k, v], i) => (
        <div key={k} className="pop rounded-2xl bg-white/10 p-3" style={{ animationDelay: `${i * 0.2}s` }}><p className="text-xs text-[var(--muted)]">{k}</p><p className="display text-3xl">{v}</p></div>))}
    </div>, 3200],
    [<div key="m" className="slam grid gap-3"><p className="display text-4xl">Your squad is officially in.</p><p className="text-lg text-[var(--muted)]">Your mission: reach the top of The Showdown Board.</p></div>, 2400],
    [<p key="3" className="display slam text-[40vw] sm:text-[14rem]">3</p>, 800],
    [<p key="2" className="display slam text-[40vw] sm:text-[14rem]">2</p>, 800],
    [<p key="1" className="display slam text-[40vw] sm:text-[14rem]">1</p>, 800],
    [<h1 key="go" className="display slam text-8xl sm:text-9xl">🔥 SHOWDOWN!</h1>, 1800],
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
    <main className="fixed inset-0 grid place-items-center px-6 text-center" style={{ background: `radial-gradient(80vw 60vh at 50% 40%, ${team.color_hex}66, var(--bg) 70%)` }}>
      <button onClick={onDone} className="focusable absolute right-4 top-4 text-sm text-[var(--muted)] underline-offset-4 hover:underline">Skip</button>
      <div key={i}>{scenes[Math.min(i, scenes.length - 1)][0]}</div>
    </main>
  );
}