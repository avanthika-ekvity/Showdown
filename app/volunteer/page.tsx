"use client";
import Link from "next/link";
import { useState } from "react";
import Countdown from "@/components/Countdown";
import { teamGames } from "@/components/Games";
import StaffGate, { logoutStaff } from "@/components/StaffGate";
import { rpc, useShowdown, type Showdown, type Team } from "@/lib/db";
import { burst, buzz, play } from "@/lib/fx";

export default function VolunteerPage() {
  return <StaffGate need="volunteer">{(staff) => <Volunteer staffKey={staff.key} />}</StaffGate>;
}

const btn = "focusable rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 disabled:opacity-40";

function Volunteer({ staffKey }: { staffKey: string }) {
  const d = useShowdown();
  const [teamId, setTeamId] = useState<string>("");
  const [msg, setMsg] = useState("");
  const team = d.teams.find((t) => t.id === teamId);

  // every write goes through here: one place for feedback + errors
  async function act(fn: string, args: Record<string, unknown>, ok: string, fx?: () => void) {
    try { await rpc(fn, { p_key: staffKey, ...args }); setMsg(ok); fx?.(); buzz(40); }
    catch (e) { setMsg(`😬 ${(e as Error).message}`); play("oops"); }
    setTimeout(() => setMsg(""), 3000);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-5">
      {msg && <div role="status" className="slam fixed inset-x-4 top-4 z-40 rounded-2xl bg-[var(--gold)] px-5 py-3 text-center font-bold text-[#1b1200] shadow-2xl">{msg}</div>}
      <header className="flex items-center justify-between">
        <h1 className="display text-4xl">🙋 VOLUNTEER MODE</h1>
        <div className="flex gap-2 text-xs"><Link href="/" className={`${btn} border border-white/20`}>🏆</Link><button onClick={logoutStaff} className={`${btn} border border-white/20`}>Lock</button></div>
      </header>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {d.teams.map((t) => <button key={t.id} onClick={() => setTeamId(t.id)} aria-pressed={teamId === t.id} className={`focusable arena p-3 text-center transition ${teamId === t.id ? "team-glow" : "opacity-60"}`} style={{ ["--c" as string]: t.color_hex }}><span className="text-3xl">{t.emoji}</span><span className="display block text-xl">{t.name.replace("TEAM ", "")}</span><span className="text-xs text-[var(--muted)]">{t.score}</span></button>)}
      </div>

      {!team ? <p className="mt-10 text-center text-[var(--muted)]">Pick the team standing in front of you.</p> : <TeamPanel d={d} team={team} act={act} staffKey={staffKey} />}
    </main>
  );
}

function TeamPanel({ d, team, act, staffKey }: { d: Showdown; team: Team; staffKey: string; act: (fn: string, args: Record<string, unknown>, ok: string, fx?: () => void) => Promise<void> }) {
  const games = teamGames(d.games, d.team_games, team.id);
  const timers = d.timers.filter((t) => t.team_id === team.id && t.status !== "completed");
  const powers = d.powers.filter((p) => p.team_id === team.id);
  const cons = d.consequences.filter((c) => c.team_id === team.id);
  const finals = d.final_submissions.filter((s) => s.team_id === team.id);
  const finalTg = d.team_games.find((t) => t.team_id === team.id && t.game_id === "final");
  const elig = d.settings?.power_eligibility_seconds ?? 180;
  const [target, setTarget] = useState<Record<string, string>>({});

  return (
    <div className="mt-5 grid gap-5" style={{ ["--c" as string]: team.color_hex }}>
      {/* GAMES */}
      <section className="arena team-glow p-4">
        <h2 className="display text-3xl">{team.emoji} {team.name} · GAMES</h2>
        <ul className="mt-2 grid gap-2">
          {games.map((g, i) => (
            <li key={g.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
              <span className="text-2xl">{g.emoji}</span>
              <span className="min-w-0 flex-1"><span className="display block truncate text-xl">{i + 1}. {g.name}</span><span className="text-xs text-[var(--muted)]">{g.tg?.status.toUpperCase()} · +{g.points_awarded}{g.time_limit_seconds ? ` · ⏱${g.time_limit_seconds}s` : ""}</span></span>
              {g.tg?.status === "completed" ? <span className="text-xl">✅</span> : (<>
                {g.time_limit_seconds && <button onClick={() => act("timer_start", { p_team_id: team.id, p_game_id: g.id, p_type: "game", p_seconds: g.time_limit_seconds }, `⏱ ${g.name} timer started`)} className={`${btn} bg-white/10`}>⏱</button>}
                <button disabled={g.tg?.status === "locked"} onClick={() => confirm(`Mark ${g.name} complete for ${team.name}? +${g.points_awarded} steps.`) && act("complete_game", { p_team_id: team.id, p_game_id: g.id }, `🎉 GAME CRUSHED! +${g.points_awarded}`, () => { burst(team.color_hex, true); play("win"); })} className={`${btn} bg-green-500 text-black`}>✅ Mark complete</button>
              </>)}
            </li>
          ))}
        </ul>
      </section>

      {/* TIMERS */}
      <section className="arena p-4">
        <div className="flex items-center justify-between"><h2 className="display text-3xl">⏱ TIMERS</h2>
          <button onClick={() => act("timer_start", { p_team_id: team.id, p_game_id: "", p_type: "power_eligibility", p_seconds: elig }, `⚡ ${elig}s Power eligibility timer started`)} className={`${btn} bg-yellow-400 text-black`}>⚡ Start {Math.round(elig / 60)}-min Power timer</button></div>
        {timers.length === 0 && <p className="mt-2 text-sm text-[var(--muted)]">No timer running.</p>}
        {timers.map((t) => (
          <div key={t.id} className="mt-3 rounded-2xl bg-white/5 p-3">
            <Countdown timer={t} big label={t.timer_type.replace("_", " ").toUpperCase() + (t.game_id ? ` · ${d.games.find((g) => g.id === t.game_id)?.name ?? ""}` : "")} />
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {t.status === "running" ? <button onClick={() => act("timer_action", { p_id: t.id, p_action: "pause" }, "⏸ Paused")} className={`${btn} bg-white/10`}>⏸ Pause</button> : <button onClick={() => act("timer_action", { p_id: t.id, p_action: "resume" }, "▶ Resumed")} className={`${btn} bg-white/10`}>▶ Resume</button>}
              <button onClick={() => act("timer_action", { p_id: t.id, p_action: "complete" }, "✅ Timer stopped")} className={`${btn} bg-white/10`}>■ Stop</button>
              <button onClick={() => act("timer_action", { p_id: t.id, p_action: "reset" }, "↺ Timer cleared")} className={`${btn} bg-white/10`}>↺ Reset</button>
              {t.timer_type === "power_eligibility" && <button onClick={() => act("timer_action", { p_id: t.id, p_action: "complete" }, "").then(() => act("grant_card_chance", { p_team_id: team.id }, "⚡ POWER CHANCE UNLOCKED! Team can pick a Mystery Card.", () => { burst("#f5c542"); play("power"); }))} className={`${btn} bg-yellow-400 text-black`}>⚡ Made it in time → unlock card</button>}
            </div>
          </div>
        ))}
        <p className="mt-3 text-xs text-[var(--muted)]">Card chances waiting: <b className="text-[var(--gold)]">{team.card_chances}</b> <button onClick={() => act("grant_card_chance", { p_team_id: team.id }, "🎴 +1 card chance")} className="ml-2 underline">+1</button> <button onClick={() => act("grant_card_chance", { p_team_id: team.id, p_delta: -1 }, "🎴 −1 card chance")} className="ml-1 underline">−1</button></p>
      </section>

      {/* POWERS */}
      <section className="arena border-yellow-300/40 p-4">
        <h2 className="display text-3xl">⚡ POWERS</h2>
        {powers.map((p) => (
          <div key={p.id} className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-white/5 p-3">
            <span className="display flex-1 text-xl">{p.name} <span className="text-sm text-[var(--muted)]">{p.status.toUpperCase()}{p.target_team_id ? ` → ${d.teams.find((t) => t.id === p.target_team_id)?.name}` : ""}</span></span>
            {(p.status === "available" || p.status === "activated") && (<>
              <select aria-label="Target team" value={target[p.id] ?? p.target_team_id ?? ""} onChange={(e) => setTarget({ ...target, [p.id]: e.target.value })} className="focusable rounded-lg bg-black/40 px-2 py-2 text-sm">
                <option value="">Target…</option>{d.teams.filter((t) => t.id !== team.id).map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}
              </select>
              <button disabled={!(target[p.id] ?? p.target_team_id)} onClick={async () => { const tgt = target[p.id] ?? p.target_team_id; await rpc("request_power", { p_team_id: team.id, p_power_id: p.id, p_target_team_id: tgt }).catch(() => {}); act("use_power", { p_power_id: p.id }, p.name.includes("STEAL") ? `✂️ CUT! ${team.name} stole 5 steps!` : "❄️ TIME FROZEN for 2 minutes!", () => { burst(team.color_hex); play("power"); }); }} className={`${btn} bg-yellow-400 text-black`}>⚡ Approve & activate</button>
            </>)}
          </div>
        ))}
      </section>

      {/* CONSEQUENCES */}
      <section className="arena border-purple-300/40 p-4">
        <h2 className="display text-3xl">😈 CONSEQUENCES</h2>
        {cons.map((c) => (
          <div key={c.id} className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-white/5 p-3">
            <span className="display flex-1 text-xl">{c.name} <span className="text-sm text-[var(--muted)]">{c.status.toUpperCase()}</span></span>
            {c.status === "available" && <button onClick={() => act("set_status", { p_table: "consequences", p_id: c.id, p_status: "active" }, "😈 OH NO... Consequence is ACTIVE", () => play("oops"))} className={`${btn} bg-purple-400 text-black`}>😈 Assign now</button>}
            {c.status === "active" && <button onClick={() => act("set_status", { p_table: "consequences", p_id: c.id, p_status: "completed" }, "✅ Consequence served")} className={`${btn} bg-white/10`}>✅ Served</button>}
          </div>
        ))}
      </section>

      {/* FINAL SHOWDOWN */}
      <section className="arena border-[var(--gold)]/50 p-4">
        <h2 className="display text-3xl">🧠 FINAL SHOWDOWN <span className="text-sm text-[var(--muted)]">{finalTg?.status.toUpperCase()}</span></h2>
        {finalTg?.status === "locked" && <p className="text-sm text-[var(--muted)]">Unlocks when this team completes all games. <button onClick={() => act("set_status", { p_table: "team_games", p_id: finalTg.id, p_status: "unlocked" }, "🧠 Final unlocked (override)")} className="underline">Override → unlock</button></p>}
        {finals.length === 0 && finalTg?.status !== "locked" && <p className="text-sm text-[var(--muted)]">Waiting for the team to submit a guess from their phone.</p>}
        {finals.map((s) => (
          <div key={s.id} className="mt-2 rounded-xl bg-white/5 p-3">
            <p className="text-xs text-[var(--muted)]">Target: {d.teams.find((t) => t.id === s.target_team_id)?.name} · {s.status.toUpperCase()}</p>
            <p className="display text-2xl">Guess: {s.guess}</p><p className="text-sm">“{s.sentence}”</p>
            {s.status === "pending" && <div className="mt-2 flex gap-2">
              <button onClick={async () => { const ok = await rpc("check_final_guess", { p_key: staffKey, p_submission_id: s.id }); alert(ok ? "✅ Word is correct. Now judge the sentence." : "❌ Wrong word."); }} className={`${btn} bg-white/10`}>🔍 Check word</button>
              <button onClick={() => act("judge_final", { p_submission_id: s.id, p_correct: true }, `🏆 FINAL SHOWDOWN! +${d.settings?.final_bonus_points} steps`, () => { burst(team.color_hex, true); play("win"); })} className={`${btn} bg-green-500 text-black`}>✅ Correct</button>
              <button onClick={() => act("judge_final", { p_submission_id: s.id, p_correct: false }, "❌ Marked wrong. They can retry.")} className={`${btn} bg-red-500/80`}>❌ Wrong</button>
            </div>}
          </div>
        ))}
      </section>
    </div>
  );
}