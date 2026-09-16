"use client";
import { useState } from "react";
import { rpc, type FinalSubmission, type Team } from "@/lib/db";
import { buzz, play } from "@/lib/fx";

/** Team side of the Final Showdown: pick a target, guess their word, use it in a sentence. Volunteer judges. */
export default function Final({ team, teams, submissions, bonus }: { team: Team; teams: Team[]; submissions: FinalSubmission[]; bonus: number }) {
  const [target, setTarget] = useState(""); const [guess, setGuess] = useState(""); const [sentence, setSentence] = useState(""); const [err, setErr] = useState("");
  const won = submissions.some((s) => s.status === "correct"); const pending = submissions.find((s) => s.status === "pending");
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr("");
    try { await rpc("submit_final", { p_team_id: team.id, p_target_team_id: target, p_guess: guess, p_sentence: sentence }); setGuess(""); setSentence(""); buzz(60); play("score"); }
    catch (x) { setErr(`😬 ${(x as Error).message}`); }
  }
  return (
    <section className="arena border-[var(--gold)] bg-[var(--gold)]/10 p-4">
      <h2 className="display text-4xl">🧠 THE FINAL SHOWDOWN</h2>
      <p className="text-sm">Every team's login code is a secret Ekvity word. Guess another team's word, then use it in a sentence. Worth <b className="text-[var(--gold)]">+{bonus} steps</b>.</p>
      {won ? <p className="display mt-3 text-3xl text-[var(--gold)]">🏆 CRACKED IT. +{bonus} STEPS.</p> : pending ? <p className="mt-3 rounded-xl bg-black/30 p-3 text-sm">⏳ Submitted: <b>{pending.guess}</b> — “{pending.sentence}”. Waiting for the volunteer to judge.</p> : (
        <form onSubmit={submit} className="mt-3 grid gap-2">
          <select required value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target team" className="focusable rounded-xl bg-black/40 px-3 py-3"><option value="">Whose word are you guessing?</option>{teams.filter((t) => t.id !== team.id).map((t) => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}</select>
          <input required value={guess} onChange={(e) => setGuess(e.target.value.toUpperCase())} placeholder="THEIR WORD" aria-label="Guess" className="focusable display rounded-xl bg-black/40 px-3 py-3 text-2xl tracking-widest" />
          <textarea required value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="Use it in a sentence…" aria-label="Sentence" rows={2} className="focusable rounded-xl bg-black/40 px-3 py-3" />
          {err && <p role="alert" className="text-sm text-[#ffb3ad]">{err}</p>}
          <button className="focusable display rounded-full bg-[var(--gold)] py-3 text-2xl text-[#1b1200]">Submit to the volunteer</button>
        </form>)}
      {submissions.filter((s) => s.status === "wrong").length > 0 && !won && !pending && <p className="mt-2 text-xs text-[var(--muted)]">{submissions.filter((s) => s.status === "wrong").length} wrong so far. Try again.</p>}
    </section>
  );
}