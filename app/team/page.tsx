"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Games from "@/components/Games";
import Final from "@/components/Final";
import Winner from "@/components/Winner";
import { getTeamId, RANK_LABEL, rankOf, TEAM_KEY, useShowdown } from "@/lib/db";
import { TEAM_CONFIG, type TeamId } from "@/lib/config";
import { burst, buzz, play, playAmbient, stopAmbient, setSound, soundOn } from "@/lib/fx";

const TABS = [["home", "🏠", "Home"], ["team", "👥", "Team"]] as const;

export default function TeamPage() {
  const d = useShowdown();
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("home");
  const [sound, setSoundState] = useState(true);

  useEffect(() => {
    const t = getTeamId();
    if (!t) router.replace("/enter");
    else setId(t);
    setSoundState(soundOn());
    playAmbient();
    return () => stopAmbient();
  }, [router]);

  const team = d.teams.find((t) => t.id === id);
  const toast = useScoreFx(team?.score, team?.color_hex, d.loaded);

  if (!team) return (
    <p className="display grid min-h-dvh place-items-center text-2xl text-[var(--muted)]">
      🔥 Preparing...
    </p>
  );
  if (d.settings?.event_status === "complete") return <Winner d={d} />;

  const rank = rankOf(d.teams, team.id);
  const finalTg = d.team_games.find((t) => t.team_id === team.id && t.game_id === "final");
  const config = TEAM_CONFIG[team.id as TeamId];
  const members = config?.members ?? [];
  const cheer =
    rank === 0 ? "Top spot tumhara hai. 👀" :
    rank === 1 ? "Ek push aur. Aage badho!" :
    "Score check karo. Comeback time!";

  return (
    <main className="mx-auto max-w-2xl px-3 pb-24 pt-4" style={{ ["--c" as string]: team.color_hex }}>
      {toast && (
        <div role="status" className="slam fixed inset-x-3 top-3 z-40 rounded-2xl bg-[var(--gold)] px-4 py-2 text-center text-[#1b1200] shadow-2xl">
          <b className="display text-2xl">{toast}</b>
        </div>
      )}

      <header className="flex items-center justify-between">
        <h1 className="display text-3xl">{team.emoji} {team.name}</h1>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => {
              const next = !sound;
              setSound(next);
              setSoundState(next);
              if (next) { play("score"); playAmbient(); }
              else stopAmbient();
            }}
            aria-pressed={sound}
            aria-label="Sound"
            className="focusable rounded-full border border-white/20 px-2.5 py-1.5">
            {sound ? "🔊" : "🔇"}
          </button>
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
                <p className="display text-5xl">
                  <span key={team.score} className="inline-block bump">{team.score}</span>
                  <span className="text-2xl text-[var(--muted)]"> STEPS</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[var(--muted)]">RANK</p>
                <p className="display text-5xl">{RANK_LABEL[rank]}</p>
              </div>
            </div>
            <p className="mt-1 text-xs">
              Checkpoint {team.board_position}/20 · {team.board_position * 5}%
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${team.board_position * 5}%`, background: team.color_hex }} />
            </div>
            <p className="display mt-2 text-lg text-[var(--gold)]">{cheer}</p>
          </section>

          {/* Final showdown */}
          {finalTg && finalTg.status !== "locked" && (
            <Final
              team={team}
              teams={d.teams}
              submissions={d.final_submissions.filter((s) => s.team_id === team.id)}
              bonus={d.settings?.final_bonus_points ?? 20}
            />
          )}

          {/* All games */}
          <section>
            <h2 className="display text-2xl mb-2">🎮 YOUR GAMES</h2>
            <p className="text-xs text-[var(--muted)] mb-3">
              Play in order. Admin marks each one done.
            </p>
            <Games
              games={d.games}
              team_games={d.team_games}
              team={team}
              cards={d.cards}
            />
          </section>
        </div>
      )}

      {tab === "team" && (
        <div className="mt-4">
          <h2 className="display text-3xl">👥 THE SQUAD</h2>
          <p className="mb-3 text-xs text-[var(--muted)]">
            {d.members.some(m => m.team_id === team.id && m.role !== "player")
              ? "Roles assigned by admin."
              : "Roles will be decided on the day."}
          </p>
          <ul className="grid grid-cols-2 gap-2">
            {d.members
              .filter((m) => m.team_id === team.id)
              .sort((a, b) => {
                const order = { captain: 0, power_holder: 1, consequence_holder: 2, player: 3 };
                return order[a.role] - order[b.role];
              })
              .map((m) => (
                <li key={m.id} className={`arena rounded-xl p-3 text-sm ${
                  m.role === "captain" ? "border-[var(--gold)]/60 bg-[var(--gold)]/10" :
                  m.role === "power_holder" ? "border-yellow-300/40 bg-yellow-300/10" :
                  m.role === "consequence_holder" ? "border-purple-300/40 bg-purple-400/10" : ""
                }`}>
                  <span className="block text-xs text-[var(--muted)]">
                    {m.role === "captain" ? "👑 Captain" :
                     m.role === "power_holder" ? "⚡ Power Holder" :
                     m.role === "consequence_holder" ? "😈 Consequence Holder" : "🎮 Player"}
                  </span>
                  <span className="font-semibold">{m.name.split(" ")[0]}</span>
                  <span className="block text-xs text-[var(--muted)]">
                    {m.name.split(" ").slice(1).join(" ")}
                  </span>
                </li>
              ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--muted)]">{members.length} members total</p>
          <button
            onClick={() => {
              if (confirm("Log out of this team?")) {
                stopAmbient();
                localStorage.removeItem(TEAM_KEY);
                router.replace("/enter");
              }
            }}
            className="focusable mt-3 text-xs text-[var(--muted)] underline-offset-4 hover:underline">
            Switch team
          </button>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[var(--bg)]/90 backdrop-blur">
        <div className="mx-auto grid max-w-2xl grid-cols-2">
          {TABS.map(([k, icon, label]) => (
            <button
              key={k}
              onClick={() => { setTab(k); buzz(10); }}
              aria-current={tab === k}
              className={`focusable grid place-items-center py-2.5 text-[10px] ${
                tab === k ? "text-[var(--gold)]" : "text-[var(--muted)]"
              }`}>
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
      if (diff > 0) {
        burst(color, diff >= 20);
        play(diff >= 20 ? "win" : "score");
        buzz([60, 40, 60]);
        setToast(diff >= 20 ? `🎉 +${diff} STEPS!` : `+${diff} STEPS`);
      } else {
        play("oops");
        buzz(200);
        setToast(`✂️ ${diff} STEPS`);
      }
      const t = setTimeout(() => setToast(null), 3000);
      prev.current = score;
      return () => clearTimeout(t);
    }
    prev.current = score;
  }, [score, loaded, color]);
  return toast;
}