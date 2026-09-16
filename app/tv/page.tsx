"use client";
import { Board, useShakeUp } from "@/components/Landing";
import Winner from "@/components/Winner";
import { ranked, RANK_LABEL, useShowdown } from "@/lib/db";

/** Projector mode: no buttons, huge type, auto-updating. */
export default function TV() {
  const d = useShowdown();
  const teams = ranked(d.teams);
  const banner = useShakeUp(teams, d.loaded);
  const live = d.games.find((g) => g.status === "live");
  const last = d.score_history[d.score_history.length - 1];
  if (!d.loaded) return <p className="display grid min-h-dvh place-items-center text-6xl text-[var(--muted)]">🔥 Preparing the arena...</p>;
  if (d.settings?.event_status === "complete") return <Winner d={d} />;
  return (
    <main className="grid min-h-dvh grid-rows-[auto_1fr] gap-6 p-8">
      {banner && <div role="status" className="slam fixed inset-x-16 top-8 z-40 rounded-3xl bg-[var(--gold)] px-8 py-5 text-center text-[#1b1200] shadow-2xl"><b className="display text-6xl">{banner[0]}</b><br /><span className="text-2xl font-semibold">{banner[1]}</span></div>}
      <header className="flex items-center justify-between">
        <h1 className="display text-7xl">THE <span className="text-[var(--gold)]">SHOWDOWN</span> <span className="text-3xl text-[var(--muted)]">{d.settings?.tagline}</span></h1>
        <div className="arena flex items-center gap-4 px-6 py-3">
          {live ? <><span className="live-dot grid h-16 w-16 place-items-center rounded-full bg-[var(--red)] text-4xl" style={{ ["--c" as string]: "var(--red)" }}>{live.emoji}</span><div><p className="text-sm font-bold tracking-widest text-[#ff8a80]">🔴 NOW PLAYING</p><p className="display text-5xl">{live.name}</p></div></> : <p className="display text-4xl text-[var(--muted)]">😴 Warming up...</p>}
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <ol className="grid content-start gap-4">
          {teams.map((t, i) => (
            <li key={t.id} className="arena team-glow flex items-center gap-6 p-5 transition-all duration-700" style={{ ["--c" as string]: t.color_hex }}>
              <span className="display w-20 text-6xl">{RANK_LABEL[i]}</span><span className="text-6xl">{t.emoji}</span>
              <span className="flex-1"><span className="display block text-6xl">{t.name}</span><span className="mt-1 block h-3 overflow-hidden rounded-full bg-white/10"><span className="block h-full transition-all duration-700" style={{ width: `${t.board_position * 5}%`, background: t.color_hex }} /></span></span>
              <span className="display text-8xl tabular-nums"><span key={t.score} className="inline-block bump">{t.score}</span></span>
            </li>
          ))}
        </ol>
        <div className="grid content-start gap-4">
          <Board teams={d.teams} big />
          {last && <p className="arena p-4 text-2xl"><span className="text-[var(--muted)]">{new Date(last.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> · {d.teams.find((t) => t.id === last.team_id)?.emoji} {last.reason} <b className={last.change_amount < 0 ? "text-[#ff8a80]" : "text-green-300"}>{last.change_amount > 0 ? "+" : ""}{last.change_amount}</b></p>}
          <p className="text-center text-2xl text-[var(--muted)]">📱 Scan to enter · {typeof location !== "undefined" ? location.host : ""}/enter</p>
        </div>
      </div>
    </main>
  );
}