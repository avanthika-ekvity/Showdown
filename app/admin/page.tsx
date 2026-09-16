"use client";
import Link from "next/link";
import { useState } from "react";
import { Board } from "@/components/Landing";
import StaffGate, { logoutStaff } from "@/components/StaffGate";
import { ranked, RANK_LABEL, rpc, useShowdown, type Showdown } from "@/lib/db";
import { burst, play } from "@/lib/fx";

export default function AdminPage() {
  return <StaffGate need="admin">{(staff) => <Admin staffKey={staff.key} />}</StaffGate>;
}

const btn = "focusable rounded-full px-3 py-1.5 text-sm font-bold transition active:scale-95 disabled:opacity-40";
const TABS = ["Live", "Scores", "Teams", "Games", "Cards", "Event", "History"] as const;

function Admin({ staffKey }: { staffKey: string }) {
  const d = useShowdown();
  const [tab, setTab] = useState<(typeof TABS)[number]>("Live");
  const [msg, setMsg] = useState("");
  async function act(fn: string, args: Record<string, unknown>, ok = "Saved") {
    try { await rpc(fn, { p_key: staffKey, ...args }); setMsg(ok); } catch (e) { setMsg(`😬 ${(e as Error).message}`); play("oops"); }
    setTimeout(() => setMsg(""), 2500);
  }
  const update = (table: string, id: string | number, patch: Record<string, unknown>) => act("admin_update", { p_table: table, p_id: String(id), p_patch: patch });
  /** Click-to-edit text. Saves on blur/Enter through admin_update. */
  const Ed = ({ table, id, field, value, cls = "" }: { table: string; id: string | number; field: string; value: string | number | null; cls?: string }) => (
    <input defaultValue={value ?? ""} aria-label={field} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      onBlur={(e) => { const v = e.target.value; if (String(value ?? "") !== v) update(table, id, { [field]: typeof value === "number" ? Number(v) : v }); }}
      className={`focusable w-full rounded-md border border-transparent bg-transparent px-1 hover:border-white/20 focus:border-[var(--gold)] focus:bg-black/30 ${cls}`} />
  );

  if (!d.loaded) return <p className="display grid min-h-dvh place-items-center text-3xl text-[var(--muted)]">🔥 Preparing the arena...</p>;
  const teams = ranked(d.teams);
  const live = d.games.find((g) => g.status === "live");

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-5">
      {msg && <div role="status" className="slam fixed inset-x-4 top-4 z-40 rounded-2xl bg-[var(--gold)] px-5 py-3 text-center font-bold text-[#1b1200] shadow-2xl">{msg}</div>}
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="display text-4xl">🛠 SHOWDOWN CONTROL ROOM</h1>
        <nav className="flex gap-2 text-xs"><Link href="/volunteer" className={`${btn} border border-white/20`}>🙋 Volunteer</Link><Link href="/tv" className={`${btn} border border-white/20`}>📺 TV</Link><Link href="/qr" className={`${btn} border border-white/20`}>📱 QR</Link><button onClick={logoutStaff} className={`${btn} border border-white/20`}>Lock</button></nav>
      </header>
      <nav className="mt-4 flex gap-1 overflow-x-auto" aria-label="Admin sections">{TABS.map((t) => <button key={t} onClick={() => setTab(t)} aria-current={tab === t} className={`${btn} shrink-0 ${tab === t ? "bg-[var(--gold)] text-[#1b1200]" : "bg-white/10"}`}>{t}</button>)}</nav>

      {tab === "Live" && (
        <section className="mt-5 grid gap-4">
          <div className="arena p-4"><p className="text-xs text-[var(--muted)]">EVENT · {d.settings?.event_status.toUpperCase()} · NOW PLAYING</p><p className="display text-3xl">{live ? `${live.emoji} ${live.name}` : "😴 Nothing live"}</p></div>
          <table className="arena w-full text-sm"><thead className="text-left text-xs text-[var(--muted)]"><tr>{["TEAM", "SCORE", "RANK", "CURRENT GAME", "POWER", "CONSEQUENCE", "CARDS"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
            <tbody>{teams.map((t, i) => {
              const cur = d.team_games.filter((g) => g.team_id === t.id && g.status !== "completed" && g.status !== "locked").map((g) => d.games.find((x) => x.id === g.game_id)).filter(Boolean)[0];
              const pw = d.powers.filter((p) => p.team_id === t.id).map((p) => p.status); const cs = d.consequences.filter((c) => c.team_id === t.id).map((c) => c.status);
              return <tr key={t.id} className="border-t border-white/10"><td className="display p-3 text-2xl">{t.emoji} {t.name.replace("TEAM ", "")}</td><td className="display p-3 text-2xl">{t.score}</td><td className="p-3">{RANK_LABEL[i]}</td><td className="p-3">{cur ? `${cur.emoji} ${cur.name}` : "—"}</td><td className="p-3">{pw.includes("available") || pw.includes("activated") ? "⚡ AVAILABLE" : pw.every((s) => s === "used") ? "USED" : "LOCKED"}</td><td className="p-3">{cs.includes("active") ? "😈 ACTIVE" : cs.includes("available") ? "AVAILABLE" : "LOCKED"}</td><td className="p-3">🎴 {t.card_chances}</td></tr>;
            })}</tbody></table>
          <Board teams={d.teams} />
        </section>
      )}

      {tab === "Scores" && (
        <section className="mt-5 grid gap-3 sm:grid-cols-2">
          {d.teams.map((t) => <ScoreControl key={t.id} team={t} act={act} />)}
        </section>
      )}

      {tab === "Teams" && (
        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          {d.teams.map((t) => (
            <div key={t.id} className="arena team-glow p-4" style={{ ["--c" as string]: t.color_hex }}>
              <div className="grid grid-cols-[3rem_1fr_5rem] items-center gap-2"><Ed table="teams" id={t.id} field="emoji" value={t.emoji} cls="text-3xl" /><Ed table="teams" id={t.id} field="name" value={t.name} cls="display text-3xl" /><input type="color" aria-label="Team color" defaultValue={t.color_hex} onBlur={(e) => e.target.value !== t.color_hex && update("teams", t.id, { color_hex: e.target.value })} className="h-9 w-full rounded" /></div>
              <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget.elements.namedItem("code") as HTMLInputElement; act("set_team_code", { p_team_id: t.id, p_code: f.value }, `🔑 ${t.name} code updated`); f.value = ""; }}>
                <input name="code" placeholder="New login code (hidden once set)" className="focusable flex-1 rounded-lg bg-black/30 px-3 py-1.5 text-sm" /><button className={`${btn} bg-white/10`}>Set code</button>
              </form>
              <ul className="mt-3 grid gap-1 text-sm">{d.members.filter((m) => m.team_id === t.id).map((m) => (
                <li key={m.id} className="grid grid-cols-[2.5rem_1fr_1fr_9rem] items-center gap-1 rounded-lg bg-white/5 px-1">
                  <Ed table="members" id={m.id} field="avatar" value={m.avatar} cls="text-xl" /><Ed table="members" id={m.id} field="name" value={m.name} /><Ed table="members" id={m.id} field="nickname" value={m.nickname} />
                  <select value={m.role} aria-label="Role" onChange={(e) => update("members", m.id, { role: e.target.value })} className="focusable rounded bg-black/30 py-1 text-xs">{["captain", "power_holder", "consequence_holder", "player"].map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}</select>
                </li>))}</ul>
            </div>
          ))}
        </section>
      )}

      {tab === "Games" && (
        <section className="mt-5 grid gap-3">
          {d.games.map((g) => (
            <details key={g.id} className={`arena p-4 ${g.status === "live" ? "border-red-400/70" : ""}`}>
              <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                <span className="text-3xl">{g.emoji}</span><span className="display flex-1 text-2xl">{g.name} <span className="text-sm text-[var(--muted)]">#{g.order_number} · {g.type}{g.assigned_team_id ? ` · ${g.assigned_team_id}` : ""} · {g.status.toUpperCase()}</span></span>
                <span className="flex gap-2" onClick={(e) => e.preventDefault()}>
                  {g.status !== "live" && g.type !== "final" && <button onClick={() => act("set_status", { p_table: "games", p_id: g.id, p_status: "live" }, `🔴 ${g.name} is LIVE everywhere`)} className={`${btn} bg-red-500`}>🔴 Make live</button>}
                  {g.status === "live" && <button onClick={() => act("set_status", { p_table: "games", p_id: g.id, p_status: "completed" }, `✅ ${g.name} closed`)} className={`${btn} bg-white/10`}>✅ Close</button>}
                  <button onClick={() => act("set_status", { p_table: "games", p_id: g.id, p_status: "upcoming" }, "↺ Reset to upcoming")} className={`${btn} bg-white/10`}>↺</button>
                </span>
              </summary>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {([["emoji", g.emoji], ["name", g.name], ["tagline", g.tagline], ["points_awarded", g.points_awarded], ["time_limit_seconds", g.time_limit_seconds], ["order_number", g.order_number]] as const).map(([f, v]) => <label key={f} className="grid gap-1"><span className="text-xs text-[var(--muted)]">{f}</span><Ed table="games" id={g.id} field={f} value={v} cls="rounded-lg bg-black/30 px-2 py-1" /></label>)}
                <label className="grid gap-1"><span className="text-xs text-[var(--muted)]">power_eligible</span><input type="checkbox" defaultChecked={g.power_eligible} onChange={(e) => update("games", g.id, { power_eligible: e.target.checked })} className="h-6 w-6" /></label>
                <label className="grid gap-1"><span className="text-xs text-[var(--muted)]">assigned_team_id (blank = everyone)</span><select defaultValue={g.assigned_team_id ?? ""} onChange={(e) => update("games", g.id, { assigned_team_id: e.target.value || null })} className="focusable rounded-lg bg-black/30 px-2 py-1"><option value="">everyone</option>{d.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
                {(["description", "twist", "rules"] as const).map((f) => <label key={f} className="grid gap-1 sm:col-span-2"><span className="text-xs text-[var(--muted)]">{f}{f === "rules" ? " (one per line)" : ""}</span><textarea defaultValue={g[f]} rows={f === "rules" ? 4 : 2} onBlur={(e) => e.target.value !== g[f] && update("games", g.id, { [f]: e.target.value })} className="focusable rounded-lg bg-black/30 px-2 py-1" /></label>)}
                <div className="sm:col-span-2"><p className="text-xs text-[var(--muted)]">Per-team text (tongue twister / physical task / challenge)</p>
                  {d.teams.map((t) => <label key={t.id} className="mt-1 flex items-center gap-2"><span className="w-8">{t.emoji}</span><input defaultValue={g.team_config?.[t.id] ?? ""} onBlur={(e) => e.target.value !== (g.team_config?.[t.id] ?? "") && update("games", g.id, { team_config: { ...g.team_config, [t.id]: e.target.value } })} className="focusable flex-1 rounded-lg bg-black/30 px-2 py-1" /></label>)}</div>
                <div className="sm:col-span-2"><p className="text-xs text-[var(--muted)]">Per-team progress</p><div className="flex flex-wrap gap-2">{d.team_games.filter((tg) => tg.game_id === g.id).map((tg) => { const t = d.teams.find((x) => x.id === tg.team_id)!; return <span key={tg.id} className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1">{t.emoji} {tg.status}<select value={tg.status} aria-label={`${t.name} status`} onChange={(e) => act("set_status", { p_table: "team_games", p_id: tg.id, p_status: e.target.value })} className="rounded bg-black/40 text-xs">{["locked", "unlocked", "live", "completed"].map((s) => <option key={s}>{s}</option>)}</select></span>; })}</div></div>
              </div>
            </details>
          ))}
        </section>
      )}

      {tab === "Cards" && (
        <section className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="display text-3xl">🎴 MYSTERY CARDS · {d.cards.filter((c) => c.type === "power").length} power / {d.cards.filter((c) => c.type === "consequence").length} consequence / {d.cards.filter((c) => c.type === "blank").length} blank</h2>
            <div className="flex gap-2"><button onClick={() => confirm("Reshuffle all cards? Teams lose selections.") && act("reshuffle_cards", {}, "🔀 Cards reshuffled")} className={`${btn} bg-white/10`}>🔀 Reshuffle</button><button onClick={() => confirm("Reset every card to hidden?") && act("reset_event", { p_scope: "cards" }, "↺ Cards reset")} className={`${btn} bg-white/10`}>↺ Reset</button></div></div>
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">{d.cards.map((c) => (
            <li key={c.id} className={`arena p-3 text-sm ${c.type === "power" ? "border-yellow-300/50" : c.type === "consequence" ? "border-purple-300/50" : ""}`}>
              <p className="text-xs text-[var(--muted)]">#{c.id} · {c.status.toUpperCase()}{c.assigned_team_id ? ` · ${d.teams.find((t) => t.id === c.assigned_team_id)?.emoji}` : ""}</p>
              <select value={c.type} aria-label="Card type" onChange={(e) => update("cards", c.id, { type: e.target.value, name: e.target.value === "blank" ? "😶 BLANK" : c.name })} className="focusable mt-1 w-full rounded bg-black/30 py-1">{["power", "consequence", "blank"].map((t) => <option key={t}>{t}</option>)}</select>
              <Ed table="cards" id={c.id} field="name" value={c.name} cls="display mt-1 text-lg" /><Ed table="cards" id={c.id} field="description" value={c.description} cls="text-xs" />
              {c.status !== "hidden" && <button onClick={() => update("cards", c.id, { status: "hidden", assigned_team_id: null, used: false })} className="mt-1 text-xs underline">reset card</button>}
            </li>))}</ul>
          <h3 className="display mt-6 text-2xl">Powers & consequences per team</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">{d.teams.map((t) => <div key={t.id} className="arena p-3 text-sm"><p className="display text-xl">{t.emoji} {t.name}</p>
            {d.powers.filter((p) => p.team_id === t.id).map((p) => <p key={p.id} className="flex justify-between"><span>{p.name}</span><select value={p.status} aria-label="Power status" onChange={(e) => update("powers", p.id, { status: e.target.value })} className="rounded bg-black/30 text-xs">{["locked", "earned", "available", "activated", "used"].map((s) => <option key={s}>{s}</option>)}</select></p>)}
            {d.consequences.filter((c) => c.team_id === t.id).map((c) => <p key={c.id} className="flex justify-between"><span><Ed table="consequences" id={c.id} field="name" value={c.name} /></span><select value={c.status} aria-label="Consequence status" onChange={(e) => update("consequences", c.id, { status: e.target.value })} className="rounded bg-black/30 text-xs">{["locked", "earned", "available", "active", "completed"].map((s) => <option key={s}>{s}</option>)}</select></p>)}
          </div>)}</div>
        </section>
      )}

      {tab === "Event" && d.settings && (
        <section className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="arena p-4"><h2 className="display text-3xl">⚙️ SETTINGS</h2>
            {([["event_name", d.settings.event_name], ["tagline", d.settings.tagline], ["power_eligibility_seconds", d.settings.power_eligibility_seconds], ["final_bonus_points", d.settings.final_bonus_points]] as const).map(([f, v]) => <label key={f} className="mt-2 grid gap-1 text-sm"><span className="text-xs text-[var(--muted)]">{f}</span><Ed table="event_settings" id={1} field={f} value={v} cls="rounded-lg bg-black/30 px-2 py-1" /></label>)}
            <label className="mt-2 grid gap-1 text-sm"><span className="text-xs text-[var(--muted)]">event_status</span><select value={d.settings.event_status} onChange={(e) => update("event_settings", 1, { event_status: e.target.value })} className="focusable rounded-lg bg-black/30 px-2 py-1">{["upcoming", "live", "final", "complete"].map((s) => <option key={s}>{s}</option>)}</select></label>
            <button onClick={() => confirm("Declare the winner from current scores and end the event?") && act("finish_event", {}, "🏆 EVENT COMPLETE! Winner announced everywhere.").then(() => { burst(undefined, true); play("win"); })} className={`${btn} mt-4 w-full bg-[var(--gold)] py-3 text-lg text-[#1b1200]`}>🏆 MARK EVENT COMPLETE</button>
          </div>
          <div className="arena border-red-400/40 p-4"><h2 className="display text-3xl">🧨 RESETS</h2>
            <div className="mt-2 flex flex-wrap gap-2">{(["score", "progress", "cards", "powers", "consequences", "timers"] as const).map((s) => <button key={s} onClick={() => confirm(`Reset ${s} for all teams?`) && act("reset_event", { p_scope: s }, `↺ ${s} reset`)} className={`${btn} bg-white/10`}>↺ {s}</button>)}</div>
            <p className="mt-3 text-xs text-[var(--muted)]">Per team:</p><div className="flex flex-wrap gap-2">{d.teams.map((t) => <button key={t.id} onClick={() => confirm(`Reset ${t.name} score + progress?`) && act("reset_event", { p_scope: "score", p_team_id: t.id }).then(() => act("reset_event", { p_scope: "progress", p_team_id: t.id }, `↺ ${t.name} reset`))} className={`${btn} bg-white/10`}>{t.emoji} reset</button>)}</div>
            <ResetAll onConfirm={() => act("reset_event", { p_scope: "all" }, "🧨 Whole event reset. Fresh board.")} />
          </div>
        </section>
      )}

      {tab === "History" && (
        <section className="mt-5 arena p-4"><h2 className="display text-3xl">📜 EVENT HISTORY</h2>
          <ul className="mt-2 divide-y divide-white/10 text-sm">{[...d.score_history].reverse().map((h) => { const t = d.teams.find((x) => x.id === h.team_id); return <li key={h.id} className="flex gap-3 py-2"><span className="w-12 shrink-0 text-[var(--muted)]">{new Date(h.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><span className="flex-1">{t?.emoji} {h.reason} <span className="text-xs text-[var(--muted)]">· {h.source_type} · {h.created_by}</span></span><b className={h.change_amount < 0 ? "text-[#ff8a80]" : "text-green-300"}>{h.change_amount > 0 ? "+" : ""}{h.change_amount}</b></li>; })}</ul>
          {d.score_history.length === 0 && <p className="text-[var(--muted)]">Nothing yet. The Showdown is warming up!</p>}
        </section>
      )}
    </main>
  );
}

function ScoreControl({ team, act }: { team: Showdown["teams"][number]; act: (fn: string, a: Record<string, unknown>, ok?: string) => Promise<void> }) {
  const [amt, setAmt] = useState(""); const [reason, setReason] = useState("Volunteer adjustment");
  const go = (n: number) => { if (!n) return; act("adjust_score", { p_team_id: team.id, p_amount: n, p_reason: reason, p_source: "manual", p_by: "admin" }, `${team.emoji} ${n > 0 ? "+" : ""}${n} · ${reason}`).then(() => n > 0 ? burst(team.color_hex) : play("oops")); setAmt(""); };
  return (
    <div className="arena team-glow p-4" style={{ ["--c" as string]: team.color_hex }}>
      <p className="display text-3xl">{team.emoji} {team.name} <span className="text-[var(--gold)]">{team.score}</span></p>
      <div className="mt-2 flex flex-wrap gap-2">{[5, 10, 20, 50].map((n) => <button key={n} onClick={() => go(n)} className={`${btn} bg-green-500/80 text-black`}>+{n}</button>)}{[5, 10].map((n) => <button key={n} onClick={() => go(-n)} className={`${btn} bg-red-500/80`}>−{n}</button>)}</div>
      <div className="mt-2 flex gap-2"><input type="number" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="±custom" aria-label="Custom amount" className="focusable w-24 rounded-lg bg-black/30 px-2 py-1" /><button onClick={() => go(Number(amt))} className={`${btn} bg-white/10`}>Apply</button></div>
      <select value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" className="focusable mt-2 w-full rounded-lg bg-black/30 px-2 py-1 text-sm">{["Game completion", "Power - Steal", "Penalty", "Volunteer adjustment", "Bonus", "Final Showdown"].map((r) => <option key={r}>{r}</option>)}</select>
    </div>
  );
}

/** Type the word to confirm. Deliberately annoying. */
function ResetAll({ onConfirm }: { onConfirm: () => void }) {
  const [v, setV] = useState("");
  return (
    <div className="mt-4 rounded-2xl border border-red-400/60 bg-red-500/10 p-3">
      <p className="text-sm font-bold">☢️ Reset ENTIRE event — scores, progress, cards, powers, history. Type RESET to enable.</p>
      <div className="mt-2 flex gap-2"><input value={v} onChange={(e) => setV(e.target.value)} aria-label="Type RESET" className="focusable flex-1 rounded-lg bg-black/30 px-2 py-1" /><button disabled={v !== "RESET"} onClick={() => { if (confirm("Last chance. Wipe everything?")) { onConfirm(); setV(""); } }} className={`${btn} bg-red-500`}>🧨 Reset entire event</button></div>
    </div>
  );
}