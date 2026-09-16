"use client";
import Link from "next/link";
import { useState } from "react";
import { Board } from "@/components/Landing";
import StaffGate, { logoutStaff, type Staff } from "@/components/StaffGate";
import { ranked, RANK_LABEL, rpc, useShowdown, type Showdown } from "@/lib/db";
import { CARD_CHANCES_PER_GAME } from "@/lib/config";
import { burst, play } from "@/lib/fx";
import Countdown from "@/components/Countdown";
import { teamGames } from "@/components/Games";
import { MAX_CARD_OPENS } from "@/lib/config";

export default function AdminPage() {
  return <StaffGate need="admin">{(staff) => <Admin staff={staff} />}</StaffGate>;
}

const btn = "focusable rounded-full px-3 py-2 text-sm font-bold transition active:scale-95 disabled:opacity-40";
const MASTER_TABS = ["Live", "Games", "Scores", "Cards", "Teams", "Event", "History"] as const;
const TEAM_TABS = ["Games", "Cards", "Scores", "Teams"] as const;

function Admin({ staff }: { staff: Staff }) {
  const d = useShowdown();
  const isMaster = staff.teamId === null;
  const [tab, setTab] = useState<string>(isMaster ? "Live" : "Games");
  const [msg, setMsg] = useState("");
  const tabs = isMaster ? MASTER_TABS : TEAM_TABS;

  async function act(fn: string, args: Record<string, unknown>, ok = "Saved", fx?: () => void) {
    try { await rpc(fn, { p_key: staff.key, ...args }); setMsg(ok); fx?.(); }
    catch (e) { setMsg(`😬 ${(e as Error).message}`); play("oops"); }
    setTimeout(() => setMsg(""), 2500);
  }

  const update = (table: string, id: string | number, patch: Record<string, unknown>) =>
    act("admin_update", { p_table: table, p_id: String(id), p_patch: patch });

  const Ed = ({ table, id, field, value, cls = "" }: {
    table: string; id: string | number; field: string; value: string | number | null; cls?: string;
  }) => (
    <input defaultValue={value ?? ""} aria-label={field}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      onBlur={(e) => {
        const v = e.target.value;
        if (String(value ?? "") !== v) update(table, id, { [field]: typeof value === "number" ? Number(v) : v });
      }}
      className={`focusable w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-white/20 focus:border-[var(--gold)] focus:bg-black/30 ${cls}`} />
  );

  if (!d.loaded) return <p className="display grid min-h-dvh place-items-center text-2xl text-[var(--muted)]">🔥 Preparing...</p>;

  const visibleTeams = isMaster ? ranked(d.teams) : d.teams.filter((t) => t.id === staff.teamId);
  const live = d.games.find((g) => g.status === "live");

  return (
    <main className="mx-auto max-w-2xl px-3 pb-24 pt-4">
      {msg && <div role="status" className="slam fixed inset-x-3 top-3 z-40 rounded-2xl bg-[var(--gold)] px-4 py-3 text-center font-bold text-[#1b1200] shadow-2xl text-sm">{msg}</div>}

      <header className="flex items-center justify-between">
        <h1 className="display text-3xl">🛠 {isMaster ? "CONTROL ROOM" : `${visibleTeams[0]?.emoji ?? ""} ADMIN`}</h1>
        <div className="flex gap-2 text-xs">
          {isMaster && <Link href="/tv" className={`${btn} border border-white/20`}>📺 TV</Link>}
          {isMaster && <Link href="/qr" className={`${btn} border border-white/20`}>📱 QR</Link>}
          <button onClick={logoutStaff} className={`${btn} border border-white/20`}>Lock</button>
        </div>
      </header>

      <nav className="mt-3 flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} aria-current={tab === t}
            className={`${btn} shrink-0 text-xs ${tab === t ? "bg-[var(--gold)] text-[#1b1200]" : "bg-white/10"}`}>
            {t}
          </button>
        ))}
      </nav>

      {/* LIVE — master only */}
      {tab === "Live" && isMaster && (
        <section className="mt-4 grid gap-3">
          <div className="arena p-3">
            <p className="text-xs text-[var(--muted)]">NOW PLAYING</p>
            <p className="display text-2xl">{live ? `${live.emoji} ${live.name}` : "😴 Nothing live"}</p>
            <p className="text-xs text-[var(--muted)] mt-1">Event: {d.settings?.event_status.toUpperCase()}</p>
          </div>
          {ranked(d.teams).map((t, i) => {
            const pw = d.powers.filter((p) => p.team_id === t.id);
            const cs = d.consequences.filter((c) => c.team_id === t.id);
            const cur = d.team_games
              .filter((g) => g.team_id === t.id && g.status !== "completed" && g.status !== "locked")
              .map((g) => d.games.find((x) => x.id === g.game_id))
              .filter(Boolean)[0];
            return (
              <div key={t.id} className="arena team-glow p-3 text-sm" style={{ ["--c" as string]: t.color_hex }}>
                <div className="flex items-center justify-between">
                  <span className="display text-2xl">{t.emoji} {t.name.replace("TEAM ", "")}</span>
                  <span className="display text-2xl text-[var(--gold)]">{t.score} <span className="text-sm text-[var(--muted)]">steps</span></span>
                </div>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                  <span>{RANK_LABEL[i]}</span>
                  <span>{cur ? `${cur.emoji} ${cur.name}` : "—"}</span>
                  <span>⚡ {pw.some(p => ["available", "activated"].includes(p.status)) ? "READY" : "locked"}</span>
                  <span>😈 {cs.some(c => c.status === "active") ? "ACTIVE" : "locked"}</span>
                  <span>🎴 {t.card_chances} picks</span>
                </div>
              </div>
            );
          })}
          <Board teams={d.teams} />
        </section>
      )}

      {/* GAMES — all admins */}
      {tab === "Games" && (
        <section className="mt-4 grid gap-3">
          {visibleTeams.map((t) => {
            const games = teamGames(d.games, d.team_games, t.id);
            const timers = d.timers.filter((x) => x.team_id === t.id && x.status !== "completed");
            const elig = d.settings?.power_eligibility_seconds ?? 180;
            return (
              <details key={t.id} className="arena team-glow p-3" style={{ ["--c" as string]: t.color_hex }} open={!isMaster}>
                <summary className="display cursor-pointer text-2xl">{t.emoji} {t.name.replace("TEAM ", "")} · {t.score} steps</summary>
                <ul className="mt-2 grid gap-2">
                  {games.map((g, i) => (
                    <li key={g.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2 text-xs">
                      <span className="text-xl">{g.emoji}</span>
                      <span className="flex-1 min-w-0">
                        <span className="display block text-base truncate">{i + 1}. {g.name}</span>
                        <span className="text-[var(--muted)]">{g.tg?.status.toUpperCase()} · +{g.points_awarded}{g.time_limit_seconds ? ` · ⏱${g.time_limit_seconds}s` : ""}</span>
                      </span>
                      {g.tg?.status === "completed" ? <span>✅</span> : (
                        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                          {g.time_limit_seconds && (
                            <button onClick={() => act("timer_start", { p_team_id: t.id, p_game_id: g.id, p_type: "game", p_seconds: g.time_limit_seconds }, `⏱ Timer started`)}
                              className={`${btn} bg-white/10 text-xs px-2 py-1`}>⏱</button>
                          )}
                          {g.power_eligible && (
                            <button onClick={() => act("timer_start", { p_team_id: t.id, p_game_id: g.id, p_type: "power_eligibility", p_seconds: elig }, `⚡ Power timer started`)}
                              className={`${btn} bg-yellow-400/80 text-black text-xs px-2 py-1`}>⚡</button>
                          )}
                          <button
                            disabled={g.tg?.status === "locked"}
                            onClick={() => confirm(`Mark ${g.name} complete for ${t.name}? +${g.points_awarded} steps.`) &&
                              act("complete_game", { p_team_id: t.id, p_game_id: g.id }, `🎉 +${g.points_awarded}!`, () => { burst(t.color_hex, true); play("win"); })}
                            className={`${btn} bg-green-500 text-black text-xs px-2 py-1`}>✅ Done</button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Timers */}
                {timers.map((timer) => (
                  <div key={timer.id} className="mt-2 rounded-2xl bg-white/5 p-3">
                    <Countdown timer={timer} label={timer.timer_type.replace("_", " ").toUpperCase()} />
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {timer.status === "running"
                        ? <button onClick={() => act("timer_action", { p_id: timer.id, p_action: "pause" }, "⏸ Paused")} className={`${btn} bg-white/10 text-xs`}>⏸</button>
                        : <button onClick={() => act("timer_action", { p_id: timer.id, p_action: "resume" }, "▶ Resumed")} className={`${btn} bg-white/10 text-xs`}>▶</button>}
                      <button onClick={() => act("timer_action", { p_id: timer.id, p_action: "complete" }, "■ Stopped")} className={`${btn} bg-white/10 text-xs`}>■</button>
                      <button onClick={() => act("timer_action", { p_id: timer.id, p_action: "reset" }, "↺ Reset")} className={`${btn} bg-white/10 text-xs`}>↺</button>
                      {timer.timer_type === "power_eligibility" && (
                        <button onClick={() => {
                          const chances = CARD_CHANCES_PER_GAME[timer.game_id ?? ""] ?? 2;
                          act("timer_action", { p_id: timer.id, p_action: "complete" }, "")
                            .then(() => act("grant_card_chance", { p_team_id: t.id, p_delta: chances }, `⚡ +${chances} card picks!`, () => { burst("#f5c542"); play("power"); }));
                        }} className={`${btn} bg-yellow-400 text-black text-xs`}>
                          ⚡ Beat clock → +{CARD_CHANCES_PER_GAME[timer.game_id ?? ""] ?? 2} picks
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Powers ready */}
                {d.powers.filter(p => p.team_id === t.id && ["available", "activated"].includes(p.status)).map((p) => (
                  <div key={p.id} className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-yellow-400/10 border border-yellow-300/40 p-2 text-xs">
                    <span className="display flex-1 text-base">{p.name} <span className="text-[var(--muted)]">{p.status.toUpperCase()}</span></span>
                    <select aria-label="Target" defaultValue={p.target_team_id ?? ""} id={`tgt-${p.id}`} className="focusable rounded-lg bg-black/40 px-2 py-1 text-xs">
                      <option value="">Target…</option>
                      {d.teams.filter(x => x.id !== t.id).map(x => <option key={x.id} value={x.id}>{x.emoji} {x.name}</option>)}
                    </select>
                    <button onClick={() => {
                      const sel = document.getElementById(`tgt-${p.id}`) as HTMLSelectElement;
                      const tgt = sel.value || p.target_team_id;
                      if (!tgt) { setMsg("Pick a target first"); return; }
                      rpc("request_power", { p_team_id: t.id, p_power_id: p.id, p_target_team_id: tgt }).catch(() => {})
                        .then(() => act("use_power", { p_power_id: p.id }, p.name.includes("STEAL") ? `✂️ Stole 5 steps!` : "❄️ TIME FROZEN!", () => { burst(t.color_hex); play("power"); }));
                    }} className={`${btn} bg-yellow-400 text-black text-xs`}>⚡ Activate</button>
                  </div>
                ))}

                {/* Consequences ready */}
                {d.consequences.filter(c => c.team_id === t.id && ["available", "active"].includes(c.status)).map((c) => (
                  <div key={c.id} className="mt-2 flex items-center gap-2 rounded-xl bg-purple-400/10 border border-purple-300/40 p-2 text-xs">
                    <span className="display flex-1 text-base">{c.name} <span className="text-[var(--muted)]">{c.status.toUpperCase()}</span></span>
                    {c.status === "available" && <button onClick={() => act("set_status", { p_table: "consequences", p_id: c.id, p_status: "active" }, "😈 Consequence ACTIVE")} className={`${btn} bg-purple-400 text-black text-xs`}>😈 Assign</button>}
                    {c.status === "active" && <button onClick={() => act("set_status", { p_table: "consequences", p_id: c.id, p_status: "completed" }, "✅ Served")} className={`${btn} bg-white/10 text-xs`}>✅ Served</button>}
                  </div>
                ))}

                {/* Final Showdown */}
                {(() => {
                  const finalTg = d.team_games.find(tg => tg.team_id === t.id && tg.game_id === "final");
                  const finals = d.final_submissions.filter(s => s.team_id === t.id);
                  if (!finalTg || finalTg.status === "locked") return null;
                  return (
                    <div className="mt-2 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/40 p-2 text-xs">
                      <p className="display text-base">🧠 FINAL SHOWDOWN</p>
                      {finals.length === 0 && <p className="text-[var(--muted)]">Waiting for team to submit.</p>}
                      {finals.map(s => (
                        <div key={s.id} className="mt-1">
                          <p>Target: {d.teams.find(x => x.id === s.target_team_id)?.name} · <b>{s.guess}</b> · "{s.sentence}" · {s.status.toUpperCase()}</p>
                          {s.status === "pending" && (
                            <div className="mt-1 flex gap-2 flex-wrap">
                              <button onClick={async () => {
                                const ok = await rpc("check_final_guess", { p_key: staff.key, p_submission_id: s.id });
                                alert(ok ? "✅ Correct word!" : "❌ Wrong word");
                              }} className={`${btn} bg-white/10 text-xs`}>🔍 Check</button>
                              <button onClick={() => act("judge_final", { p_submission_id: s.id, p_correct: true }, `🏆 +${d.settings?.final_bonus_points} steps!`, () => { burst(t.color_hex, true); play("win"); })} className={`${btn} bg-green-500 text-black text-xs`}>✅ Correct</button>
                              <button onClick={() => act("judge_final", { p_submission_id: s.id, p_correct: false }, "❌ Wrong")} className={`${btn} bg-red-500/80 text-xs`}>❌ Wrong</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Card chances */}
                <p className="mt-2 text-xs text-[var(--muted)]">
                  Card picks: <b className="text-[var(--gold)]">{t.card_chances}</b>
                  <button onClick={() => act("grant_card_chance", { p_team_id: t.id, p_delta: 1 }, "+1 pick")} className="ml-2 underline">+1</button>
                  <button onClick={() => act("grant_card_chance", { p_team_id: t.id, p_delta: -1 }, "−1 pick")} className="ml-1 underline">−1</button>
                </p>
              </details>
            );
          })}
        </section>
      )}

      {/* SCORES — all admins, scoped */}
      {tab === "Scores" && (
        <section className="mt-4 grid gap-3">
          {visibleTeams.map((t) => <ScoreControl key={t.id} team={t} act={act} />)}
        </section>
      )}

      {/* CARDS — all admins, scoped */}
      {tab === "Cards" && (
        <section className="mt-4 grid gap-3">
          {visibleTeams.map((t) => {
            const myCards = d.cards.filter(c => c.assigned_team_id === t.id);
            return (
              <div key={t.id} className="arena team-glow p-3" style={{ ["--c" as string]: t.color_hex }}>
                <p className="display text-xl mb-2">{t.emoji} {t.name.replace("TEAM ", "")} · {myCards.filter(c => c.status !== "hidden").length}/{MAX_CARD_OPENS} opened · {t.card_chances} picks left</p>
                <div className="grid grid-cols-3 gap-1">
                  {myCards.map(c => (
                    <div key={c.id} className={`rounded-lg p-2 text-xs text-center ${c.type === "power" ? "bg-yellow-400/20 border border-yellow-300/50" : c.type === "consequence" ? "bg-purple-500/20 border border-purple-300/50" : "bg-white/5 border border-white/10"}`}>
                      <p className="text-lg">{c.type === "power" ? "⚡" : c.type === "consequence" ? "😈" : "😶"}</p>
                      <p className="font-bold text-[10px]">{c.name.replace(/[🥷❄️🤫😳😶]\s?/g, "")}</p>
                      <p className="text-[var(--muted)] text-[10px]">{c.status}</p>
                      {c.status !== "hidden" && (
                        <button onClick={() => update("cards", c.id, { status: "hidden", used: false })} className="mt-1 text-[10px] underline">reset</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* TEAMS — all admins, scoped */}
      {tab === "Teams" && (
        <section className="mt-4 grid gap-4">
          {visibleTeams.map((t) => {
            const members = d.members.filter((m) => m.team_id === t.id);
            return (
              <div key={t.id} className="arena team-glow p-3" style={{ ["--c" as string]: t.color_hex }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{t.emoji}</span>
                  <Ed table="teams" id={t.id} field="name" value={t.name} cls="display text-2xl flex-1" />
                  {isMaster && <input type="color" aria-label="Team color" defaultValue={t.color_hex} onBlur={(e) => e.target.value !== t.color_hex && update("teams", t.id, { color_hex: e.target.value })} className="h-8 w-10 rounded" />}
                </div>
                {isMaster && (
                  <form className="mb-3 flex gap-2" onSubmit={(e) => {
                    e.preventDefault();
                    const f = e.currentTarget.elements.namedItem("code") as HTMLInputElement;
                    act("set_team_code", { p_team_id: t.id, p_code: f.value }, `🔑 Code updated`);
                    f.value = "";
                  }}>
                    <input name="code" placeholder="New login code" className="focusable flex-1 rounded-lg bg-black/30 px-2 py-1 text-xs" />
                    <button className={`${btn} bg-white/10 text-xs`}>Set</button>
                  </form>
                )}
                <p className="text-xs text-[var(--muted)] mb-2">MEMBERS & ROLES</p>
                <ul className="grid gap-1.5">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                      <span className="flex-1 text-sm font-semibold">{m.name}</span>
                      <select
                        value={m.role}
                        aria-label={`${m.name} role`}
                        onChange={(e) => update("members", m.id, { role: e.target.value })}
                        className="focusable rounded-lg bg-black/40 px-2 py-1 text-xs">
                        <option value="player">🎮 Player</option>
                        <option value="captain">👑 Captain</option>
                        <option value="power_holder">⚡ Power Holder</option>
                        <option value="consequence_holder">😈 Consequence Holder</option>
                      </select>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>
      )}

      {/* EVENT — master only */}
      {tab === "Event" && isMaster && d.settings && (
        <section className="mt-4 grid gap-4">
          <div className="arena p-3">
            <h2 className="display text-2xl">⚙️ SETTINGS</h2>
            {([["event_name", d.settings.event_name], ["tagline", d.settings.tagline], ["power_eligibility_seconds", d.settings.power_eligibility_seconds], ["final_bonus_points", d.settings.final_bonus_points]] as const).map(([f, v]) => (
              <label key={f} className="mt-2 grid gap-1 text-xs">
                <span className="text-[var(--muted)]">{f}</span>
                <Ed table="event_settings" id={1} field={f} value={v} cls="rounded-lg bg-black/30 px-2 py-1" />
              </label>
            ))}
            <label className="mt-2 grid gap-1 text-xs">
              <span className="text-[var(--muted)]">event_status</span>
              <select value={d.settings.event_status} onChange={(e) => update("event_settings", 1, { event_status: e.target.value })} className="focusable rounded-lg bg-black/30 px-2 py-1 text-sm">
                {["upcoming", "live", "final", "complete"].map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <button onClick={() => confirm("Declare winner and end event?") &&
              act("finish_event", {}, "🏆 EVENT COMPLETE!", () => { burst(undefined, true); play("win"); })}
              className={`${btn} mt-4 w-full bg-[var(--gold)] py-3 text-base text-[#1b1200]`}>
              🏆 MARK EVENT COMPLETE
            </button>
          </div>
          <div className="arena border-red-400/40 p-3">
            <h2 className="display text-2xl">🧨 RESETS</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["score", "progress", "cards", "powers", "consequences", "timers"] as const).map((s) => (
                <button key={s} onClick={() => confirm(`Reset ${s}?`) && act("reset_event", { p_scope: s }, `↺ ${s} reset`)} className={`${btn} bg-white/10 text-xs`}>↺ {s}</button>
              ))}
            </div>
            <ResetAll onConfirm={() => act("reset_event", { p_scope: "all" }, "🧨 Event reset.")} />
          </div>
        </section>
      )}

      {/* HISTORY — master only */}
      {tab === "History" && isMaster && (
        <section className="mt-4 arena p-3">
          <h2 className="display text-2xl">📜 HISTORY</h2>
          <ul className="mt-2 divide-y divide-white/10 text-xs">
            {[...d.score_history].reverse().map((h) => {
              const t = d.teams.find((x) => x.id === h.team_id);
              return (
                <li key={h.id} className="flex gap-2 py-2">
                  <span className="w-10 shrink-0 text-[var(--muted)]">{new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="flex-1">{t?.emoji} {h.reason}</span>
                  <b className={h.change_amount < 0 ? "text-[#ff8a80]" : "text-green-300"}>{h.change_amount > 0 ? "+" : ""}{h.change_amount}</b>
                </li>
              );
            })}
            {d.score_history.length === 0 && <li className="py-4 text-center text-[var(--muted)]">Nothing yet.</li>}
          </ul>
        </section>
      )}
    </main>
  );
}

function ScoreControl({ team, act }: { team: Showdown["teams"][number]; act: (fn: string, a: Record<string, unknown>, ok?: string) => Promise<void> }) {
  const [amt, setAmt] = useState("");
  const [reason, setReason] = useState("Volunteer adjustment");
  const go = (n: number) => {
    if (!n) return;
    act("adjust_score", { p_team_id: team.id, p_amount: n, p_reason: reason, p_source: "manual", p_by: "admin" }, `${team.emoji} ${n > 0 ? "+" : ""}${n}`);
    setAmt("");
  };
  return (
    <div className="arena team-glow p-3" style={{ ["--c" as string]: team.color_hex }}>
      <p className="display text-2xl">{team.emoji} {team.name.replace("TEAM ", "")} <span className="text-[var(--gold)]">{team.score}</span></p>
      <div className="mt-2 flex flex-wrap gap-2">
        {[5, 10, 20, 50].map((n) => <button key={n} onClick={() => go(n)} className={`${btn} bg-green-500/80 text-black text-xs`}>+{n}</button>)}
        {[5, 10].map((n) => <button key={n} onClick={() => go(-n)} className={`${btn} bg-red-500/80 text-xs`}>−{n}</button>)}
      </div>
      <div className="mt-2 flex gap-2">
        <input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="±custom" className="focusable w-20 rounded-lg bg-black/30 px-2 py-1 text-sm" />
        <button onClick={() => go(Number(amt))} className={`${btn} bg-white/10 text-xs`}>Apply</button>
      </div>
      <select value={reason} onChange={(e) => setReason(e.target.value)} className="focusable mt-2 w-full rounded-lg bg-black/30 px-2 py-1 text-xs">
        {["Game completion", "Power - Steal", "Penalty", "Volunteer adjustment", "Bonus", "Final Showdown"].map((r) => <option key={r}>{r}</option>)}
      </select>
    </div>
  );
}

function ResetAll({ onConfirm }: { onConfirm: () => void }) {
  const [v, setV] = useState("");
  return (
    <div className="mt-3 rounded-2xl border border-red-400/60 bg-red-500/10 p-3">
      <p className="text-xs font-bold">☢️ Reset ENTIRE event. Type RESET to enable.</p>
      <div className="mt-2 flex gap-2">
        <input value={v} onChange={(e) => setV(e.target.value)} aria-label="Type RESET" className="focusable flex-1 rounded-lg bg-black/30 px-2 py-1 text-sm" />
        <button disabled={v !== "RESET"} onClick={() => { if (confirm("Last chance. Wipe everything?")) { onConfirm(); setV(""); } }} className={`${btn} bg-red-500 text-xs`}>🧨 Reset</button>
      </div>
    </div>
  );
}

