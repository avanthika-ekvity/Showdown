"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Cards from "@/components/Cards";
import Final from "@/components/Final";
import Games, { teamGames } from "@/components/Games";
import Winner from "@/components/Winner";
import { getTeamId, RANK_LABEL, rankOf, TEAM_KEY, useShowdown } from "@/lib/db";
import { TEAM_CONFIG, type TeamId } from "@/lib/config";
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
  if (!team) return <p className="display grid min-h-dvh place-items-center text-2xl text-[var(--muted)]">🔥 Preparing...</p>;
  if (d.settings?.event_status === "complete") return <Winner d={d} />;

  const rank = rankOf(d.teams, team.id);
  const list = teamGames(d.games, d.team_games, team.id);
  const done = list.filter((g) => g.tg?.status === "completed").length;
  const live = d.games.find((g) => g.status === "live");
  const current = list.find((g) => g.tg?.status !== "completed");
  const config = TEAM_CONFIG[team.id as TeamId];
  const members = config?.members ?? [];
  const finalTg = d.team_games.find((t) => t.team_id === team.id && t.game_id === "final");
  const cheer = rank === 0 ? "Top spot tumhara hai. 👀" : rank === 1 ? "Ek push aur. Aage badho!" : "Score check karo. Comeback time!";

  return (
    <main className="mx-auto max-w-2xl px-3 pb-24 pt-4" style={{ ["--c" as string]: team.color_hex }}>
      {toast && <div role="status" className="slam fixed inset-x-3 top-3 z-40 rounded-2xl bg-[var(--gold)] px-4 py-2 text-center text-[#1b1200] shadow-2xl"><b className="display text-2xl">{toast}</b></div>}

      <header className="flex items-center justify-between">
        <h1 className="display text-3xl">{team.emoji} {team.name}</h1>
        <div className="flex gap-2 text-xs">
          <button onClick={() => { setSound(!sound); setSoundState(!sound); if (!sound) play("score"); }} aria-pressed={sound} aria-label="Sound" className="focusable rounded-full border border-white/20 px-2.5 py-1.5">{sound ? "🔊" : "🔇"}</button>
          <Link href="/" className="focusable rounded-full border border-white/20 px-2.5 py-1.5">🏆</Link>
        </div>
      </header>

      {tab === "home" && (
        <div className="mt-4 grid gap-3">
          {/* Scorecard */}
          <section className="arena team-glow p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-[var(--muted)]">SCORE</p>
                <p className="display text-5xl"><span key={team.score} className="inline-block bump">{team.score}</span> <span className="text-2xl text-[var(--muted)]">STEPS</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--muted)]">RANK</p>
                <p className="display text-5xl">{RANK_LABEL[rank]}</p>
              </div>
            </div>
            <p className="mt-1 text-xs">Checkpoint {team.board_position}/20 · {team.board_position * 5}%</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${team.board_position * 5}%`, background: team.color_hex }} />
            </div>
            <p className="display mt-2 text-lg text-[var(--gold)]">{cheer}</p>
          </section>

          {/* Live game */}
          <section className={`arena flex items-center gap-3 p-3 ${live ? "border-red-400/60" : ""}`}>
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-2xl ${live ? "live-dot bg-[var(--red)]" : "bg-white/10"}`} style={{ ["--c" as string]: "var(--red)" }}>
              {live?.emoji ?? current?.emoji ?? "🏁"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-widest text-[#ff8a80]">{live ? "🔴 LIVE NOW" : current ? "UP NEXT" : "ALL DONE"}</p>
              <p className="display truncate text-2xl">{live?.name ?? current?.name ?? "Final Showdown awaits"}</p>
              <p className="text-xs text-[var(--muted)]">{done}/{list.length} games done</p>
            </div>
            <button onClick={() => setTab("games")} className="focusable shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs">Rules →</button>
          </section>

          {/* Final showdown */}
          {finalTg && finalTg.status !== "locked" && (
            <Final team={team} teams={d.teams} submissions={d.final_submissions.filter((s) => s.team_id === team.id)} bonus={d.settings?.final_bonus_points ?? 20} />
          )}

          {/* Card chance alert */}
          {team.card_chances > 0 && (
            <button onClick={() => setTab("cards")} className="focusable arena border-[var(--gold)] p-3 text-left live-dot" style={{ ["--c" as string]: "var(--gold)" }}>
              <p className="display text-2xl text-[var(--gold)]">⚡ {team.card_chances} CARD PICK{team.card_chances > 1 ? "S" : ""} WAITING!</p>
              <p className="text-xs mt-1">Fate is in your hands. Pick a Mystery Card →</p>
            </button>
          )}
        </div>
      )}

      {tab === "games" && (
        <div className="mt-4">
          <h2 className="display text-3xl">🎮 YOUR GAMES</h2>
          <p className="mb-3 text-xs text-[var(--muted)]">Play in order. Admin marks each one done and the next unlocks.</p>
          <Games games={d.games} team_games={d.team_games} team={team} />
        </div>
      )}

      {tab === "cards" && (
        <div className="mt-4">
          <Cards team={team} teams={d.teams} cards={d.cards} powers={d.powers} consequences={d.consequences} />
        </div>
      )}

      {tab === "team" && (
        <div className="mt-4">
          <h2 className="display text-3xl">👥 THE SQUAD</h2>
          <p className="mb-3 text-xs text-[var(--muted)]">Roles will be decided on the day.</p>
          <ul className="grid grid-cols-2 gap-2">
            {members.map((name, i) => (
              <li key={i} className="arena rounded-xl p-3 text-sm">
                <span className="font-semibold">{name.split(" ")[0]}</span>
                <span className="block text-xs text-[var(--muted)]">{name.split(" ").slice(1).join(" ")}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => { if (confirm("Log out of this team?")) { localStorage.removeItem(TEAM_KEY); router.replace("/enter"); } }} className="focusable mt-5 text-xs text-[var(--muted)] underline-offset-4 hover:underline">Switch team</button>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[var(--bg)]/90 backdrop-blur">
        <div className="mx-auto grid max-w-2xl grid-cols-4">
          {TABS.map(([k, icon, label]) => (
            <button key={k} onClick={() => { setTab(k); buzz(10); }} aria-current={tab === k}
              className={`focusable grid place-items-center py-2.5 text-[10px] ${tab === k ? "text-[var(--gold)]" : "text-[var(--muted)]"}`}>
              <span className="text-xl">{icon}</span>{label}
            </button>
          ))}
        </div>
      </nav>
    </main>
  );
}

function useScoreFx(score: number | undefined, color: string | undefined, loaded: boolean) {
  const prev = useRef<number | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  useEffect(() => {
    if (!loaded || score === undefined) return;
    if (prev.current !== undefined && score !== prev.current) {
      const diff = score - prev.current;
      if (diff > 0) { burst(color, diff >= 20); play(diff >= 20 ? "win" : "score"); buzz([60, 40, 60]); setToast(diff >= 20 ? `🎉 +${diff} STEPS!` : `+${diff} STEPS`); }
      else { play("oops"); buzz(200); setToast(`✂️ ${diff} STEPS`); }
      const t = setTimeout(() => setToast(null), 3000);
      prev.current = score;
      return () => clearTimeout(t);
    }
    prev.current = score;
  }, [score, loaded, color]);
  return toast;
}