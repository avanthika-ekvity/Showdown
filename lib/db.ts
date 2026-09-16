"use client";
import { createClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type Team = { id: string; name: string; color_hex: string; emoji: string; score: number; card_chances: number; board_position: number; order_number: number };
export type Member = { id: string; team_id: string; name: string; nickname: string; role: "captain" | "power_holder" | "consequence_holder" | "player"; avatar: string };
export type Game = { id: string; name: string; emoji: string; tagline: string; description: string; rules: string; twist: string; type: string; assigned_team_id: string | null; status: "upcoming" | "live" | "completed"; points_awarded: number; order_number: number; time_limit_seconds: number | null; power_eligible: boolean; is_unique: boolean; team_config: Record<string, string> };
export type TeamGame = { id: string; team_id: string; game_id: string; status: "locked" | "unlocked" | "live" | "completed"; points_awarded: number | null; completed_at: string | null };
export type Card = { id: number; type: "power" | "consequence" | "blank"; name: string; description: string; status: "hidden" | "selected" | "used"; assigned_team_id: string | null };
export type Power = { id: string; team_id: string; name: string; description: string; status: "locked" | "earned" | "available" | "activated" | "used"; target_team_id: string | null; used_at: string | null };
export type FinalSubmission = { id: string; team_id: string; target_team_id: string; guess: string; sentence: string; status: "pending" | "correct" | "wrong"; created_at: string };
export type Consequence = { id: string; team_id: string; name: string; description: string; status: "locked" | "earned" | "available" | "active" | "completed" };
export type ScoreEvent = { id: string; team_id: string; change_amount: number; reason: string; source_type: string; created_at: string; created_by: string };
export type Timer = { id: string; team_id: string | null; game_id: string | null; timer_type: string; duration_seconds: number; started_at: string | null; paused_at: string | null; paused_total_seconds: number; status: "idle" | "running" | "paused" | "completed" };
export type Settings = { event_name: string; tagline: string; event_status: "upcoming" | "live" | "final" | "complete"; power_eligibility_seconds: number; final_bonus_points: number; sound_enabled: boolean; winner_team_id: string | null };

export type Showdown = {
  teams: Team[]; members: Member[]; games: Game[]; team_games: TeamGame[]; cards: Card[];
  powers: Power[]; consequences: Consequence[]; score_history: ScoreEvent[]; timers: Timer[]; final_submissions: FinalSubmission[]; settings: Settings | null;
  loaded: boolean;
};

const TABLES = ["teams", "members", "games", "team_games", "cards", "powers", "consequences", "score_history", "timers", "event_settings", "final_submissions"] as const;
const ORDER: Partial<Record<(typeof TABLES)[number], string>> = { teams: "order_number", games: "order_number", cards: "id", score_history: "created_at", final_submissions: "created_at", members: "created_at" };

const empty: Showdown = { teams: [], members: [], games: [], team_games: [], cards: [], powers: [], consequences: [], score_history: [], timers: [], final_submissions: [], settings: null, loaded: false };

/** One hook, whole event state, live. Refetches the changed table on any realtime event. */
export function useShowdown(): Showdown {
  const [state, setState] = useState<Showdown>(empty);

  useEffect(() => {
    let alive = true;
    const load = async (table: (typeof TABLES)[number]) => {
      const q = supabase.from(table).select("*");
      const { data } = ORDER[table] ? await q.order(ORDER[table]!, { ascending: table !== "score_history" }) : await q;
      if (!alive || !data) return;
      setState((s) => (table === "event_settings" ? { ...s, settings: data[0] ?? null } : { ...s, [table]: data }));
    };
    Promise.all(TABLES.map(load)).then(() => alive && setState((s) => ({ ...s, loaded: true })));

    // ponytail: refetch whole table on any change; merge rows by id if the payload size ever matters
    const ch = supabase.channel("showdown");
    TABLES.forEach((t) => ch.on("postgres_changes", { event: "*", schema: "public", table: t }, () => load(t)));
    ch.subscribe();
    return () => { alive = false; supabase.removeChannel(ch); };
  }, []);

  return state;
}

/** Rank is derived, never stored. Ties keep seed order. */
export const ranked = (teams: Team[]) => [...teams].sort((a, b) => b.score - a.score || a.order_number - b.order_number);
export const RANK_LABEL = ["🥇", "🥈", "🥉", "4th"];
export const rankOf = (teams: Team[], id: string) => ranked(teams).findIndex((t) => t.id === id);
export const rpc = async (fn: string, args: Record<string, unknown>) => { const { data, error } = await supabase.rpc(fn, args); if (error) throw error; return data; };

/** Team session: id stored on device for the day. */
export const TEAM_KEY = "showdown:team";
export const getTeamId = () => (typeof localStorage === "undefined" ? null : localStorage.getItem(TEAM_KEY));
export const STAFF_KEY = "showdown:staff";
export const getStaff = () => { try { return JSON.parse(localStorage.getItem(STAFF_KEY) || "null") as { role: "admin" | "volunteer"; key: string } | null; } catch { return null; } };

/** Seconds left on a timer, computed from server timestamps so every device agrees. */
export function timeLeft(t: Timer, now = Date.now()) {
  if (!t.started_at || t.status === "idle") return t.duration_seconds;
  if (t.status === "completed") return 0;
  const end = t.status === "paused" && t.paused_at ? new Date(t.paused_at).getTime() : now;
  const elapsed = (end - new Date(t.started_at).getTime()) / 1000 - t.paused_total_seconds;
  return Math.max(0, Math.round(t.duration_seconds - elapsed));
}
export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;