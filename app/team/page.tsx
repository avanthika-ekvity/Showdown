"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Cards from "@/components/Cards";
import Final from "@/components/Final";
import Games, { teamGames } from "@/components/Games";
import Winner from "@/components/Winner";
import { Roster } from "@/components/Landing";
import { getTeamId, RANK_LABEL, rankOf, TEAM_KEY, useShowdown } from "@/lib/db";
import { burst, buzz, play, setSound, soundOn } from "@/lib/fx";

const TABS = [["home", "🏠", "Home"], ["games", "🎮", "Games"], ["cards", "🎴", "Cards"], ["team", "👥", "Team"]] as const;

export default function TeamPage() {
  const d = useShowdown();
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("home");
  const [sound, setSoundState] = useState(true);
  useEffect(() => { const t = getTeamId(); if (!t) router.replace("/enter"); else setId(t); setSoundState(soundOn()); }, [router]);

  const team = d.teams.find((t) => t.id === id);
  const toast = useScoreFx(team?.score, team?.color_hex, d.loaded);
  if (!team) return <p className="display grid min-h-dvh place-items-center text-3xl text-[var(--muted)]">🔥 Preparing the arena...</p>;
  if (d.settings?.event_status === "complete") return <Winner d={d} />;

  const rank = rankOf(d.teams, team.id);
  const list = teamGames(d.games, d.team_games, team.id);
  const done = list.filter((g) => g.tg?.status === "completed").length;
  const current = list.find((g) => g.tg?.status !== "completed");
  const live = d.games.find((g) => g.status === "live");
  const members = d.members.filter((m) => m.team_id === team.id);
  const power = d.powers.filter((p) => p.team_id === team.id);
  const cons = d.consequences.filter((c) => c.team_id === team.id);
  const powerState = power.some((p) => ["available", "activated"].includes(p.status)) ? "AVAILABLE" : power.every((p) => p.status === "used") ? "USED" : power.some((p) => p.status === "earned") ? "EARNED" : "LOCKED";
  const consState = cons.some((c) => c.status === "active") ? "ACTIVE" : cons.some((c) => c.status === "available") ? "AVAILABLE" : cons.some((c) => c.status === "completed") ? "COMPLETED" : "LOCKED";
  const finalTg = d.team_games.find((t) => t.team_id === team.id && t.game_id === "final");
  const cheer = rank === 0 ? "Top spot tumhara hai. 👀" : rank === 1 ? "Ek push aur. Aage badho!" : "Score check karo. Comeback time!";

  return (
    <main className="mx-auto max-w-2xl px-4 pb-28 pt-5" style={{ ["--c" as string]: team.color_hex }}>
      {toast && <div role="status" className="slam fixed inset-x-4 top-4 z-40 rounded-2xl bg-[var(--gold)] px-5 py-3 text-center text-[#1b1200] shadow-2xl"><b className="display text-3xl">{toast}</b></div>}
      <header className="flex items-center justify-between">
        <h1 className="display text-4xl">{team.emoji} {team.name}</h1>
        <div className="flex gap-2 text-sm">
          <button onClick={() => { setSound(!sound); setSoundState(!sound); if (!sound) play("score"); }} aria-pressed={sound} aria-label="Sound" className="focusable rounded-full border border-white/20 px-3 py-1.5">{sound ? "🔊" : "🔇"}</button>
          <Link href="/" className="focusable rounded-full border border-white/20 px-3 py-1.5">🏆 Board</Link>
        </div>
      </header>

      {tab === "home" && (
        <div className="mt-5 grid gap-4">
          <section className="arena team-glow p-5" aria-label="Scorecard">
            <div className="flex items-end justify-between">
              <div><p className="text-xs text-[var(--muted)]">SCORE</p><p className="display text-7xl"><span key={team.score} className="inline-block bump">{team.score}</span> <span className="text-3xl text-[var(--muted)]">STEPS</span></p></div>
              <div className="text-right"><p className="text-xs text-[var(--muted)]">RANK</p><p className="display text-6xl">{RANK_LABEL[rank]}</p></div>
            </div>
            <p className="mt-1 text-sm">Checkpoint {team.board_position} / 20 · {team.board_position * 5}% of the board</p>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full transition-all duration-700" style={{ width: `${team.board_position * 5}%`, background: team.color_hex }} /></div>
            <p className="display mt-3 text-2xl text-[var(--gold)]">{cheer}</p>
          </section>

          <section className={`arena flex items-center gap-4 p-4 ${live ? "border-red-400/60" : ""}`} aria-label="Current game">
            <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full text-3xl ${live ? "live-dot bg-[var(--red)]" : "bg-white/10"}`} style={{ ["--c" as string]: "var(--red)" }}>{live?.emoji ?? current?.emoji ?? "🏁"}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-widest text-[#ff8a80]">{live ? "🔴 LIVE NOW" : current ? "UP NEXT FOR YOU" : "ALL GAMES CRUSHED"}</p>
              <p className="display truncate text-3xl">{live?.name ?? current?.name ?? "Final Showdown awaits"}</p>
              <p className="text-sm text-[var(--muted)]">{done}/{list.length} games done</p>
            </div>
            <button onClick={() => setTab("games")} className="focusable ml-auto shrink-0 rounded-full bg-white/10 px-3 py-2 text-sm">Rules →</button>
          </section>

          {finalTg && finalTg.status !== "locked" && <Final team={team} teams={d.teams} submissions={d.final_submissions.filter((s) => s.team_id === team.id)} bonus={d.settings?.final_bonus_points ?? 20} />}
          {team.card_chances > 0 && <button onClick={() => setTab("cards")} className="focusable arena border-[var(--gold)] p-4 text-left live-dot" style={{ ["--c" as string]: "var(--gold)" }}><p className="display text-3xl text-[var(--gold)]">⚡ POWER CHANCE UNLOCKED!</p><p className="text-sm">Fate is in your hands. Pick a Mystery Card →</p></button>}
          <div className="grid grid-cols-2 gap-3">
            <div className="arena border-yellow-300/40 p-4"><p className="text-xs text-[var(--muted)]">⚡ POWER</p><p className="display text-3xl">{powerState}</p><p className="text-xs text-[var(--muted)]">{powerState === "LOCKED" ? "Power ready? Not yet..." : powerState === "AVAILABLE" ? "Volunteer approval required." : ""}</p></div>
            <div className="arena border-purple-300/40 p-4"><p className="text-xs text-[var(--muted)]">😈 CONSEQUENCE</p><p className="display text-3xl">{consState}</p><p className="text-xs text-[var(--muted)]">{consState === "LOCKED" ? "Someone is going to suffer. 😈" : ""}</p></div>
          </div>
        </div>
      )}

      {tab === "games" && <div className="mt-5"><h2 className="display text-4xl">🎮 YOUR GAMES</h2><p className="mb-4 text-sm text-[var(--muted)]">Play in order. A volunteer marks each one done and the next unlocks.</p><Games games={d.games} team_games={d.team_games} team={team} /></div>}

      {tab === "cards" && <div className="mt-5"><Cards team={team} teams={d.teams} cards={d.cards} powers={d.powers} consequences={d.consequences} /></div>}

      {tab === "team" && (
        <div className="mt-5">
          <h2 className="display text-4xl">👥 THE SQUAD</h2>
          <Roster members={members} blurbs={{ power_holder: powerState === "AVAILABLE" ? "Your power is ready. Volunteer approval required." : "Power ready? Not yet...", consequence_holder: "Your team's fate is in your hands." }} />
          <button onClick={() => { if (confirm("Log this device out of the team?")) { localStorage.removeItem(TEAM_KEY); router.replace("/enter"); } }} className="focusable mt-6 text-sm text-[var(--muted)] underline-offset-4 hover:underline">Switch team on this phone</button>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[var(--bg)]/90 backdrop-blur" aria-label="Team navigation">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {TABS.map(([k, icon, label]) => (
            <button key={k} onClick={() => { setTab(k); buzz(10); }} aria-current={tab === k} className={`focusable grid place-items-center py-3 text-xs ${tab === k ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}><span className="text-2xl">{icon}</span>{label}</button>
          ))}
        </div>
      </nav>
    </main>
  );
}

/** Celebrate when this team's score changes. Returns a short toast. */
function useScoreFx(score: number | undefined, color: string | undefined, loaded: boolean) {
  const prev = useRef<number | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!loaded || score === undefined) return;
    if (prev.current !== undefined && score !== prev.current) {
      const diff = score - prev.current;
      if (diff > 0) { burst(color, diff >= 20); play(diff >= 20 ? "win" : "score"); buzz([60, 40, 60]); setToast(diff >= 20 ? `🎉 GAME CRUSHED! +${diff} STEPS` : `+${diff} STEPS`); }
      else { play("oops"); buzz(200); setToast(`✂️ CUT! ${diff} STEPS`); }
      const t = setTimeout(() => setToast(null), 3500);
      prev.current = score;
      return () => clearTimeout(t);
    }
    prev.current = score;
  }, [score, loaded, color]);
  return toast;
}