"use client";
import confetti from "canvas-confetti";

const SOUND_KEY = "showdown:sound";
export const soundOn = () => typeof localStorage !== "undefined" && localStorage.getItem(SOUND_KEY) !== "off";
export const setSound = (on: boolean) => localStorage.setItem(SOUND_KEY, on ? "on" : "off");

// ponytail: WebAudio beeps instead of audio files — zero assets, works offline. Swap for real samples if the MC wants them.
const NOTES: Record<string, number[]> = { score: [660, 880], win: [523, 659, 784, 1047], power: [440, 880, 1320], oops: [330, 220], dice: [200, 300, 400, 500, 600] };
export function play(kind: keyof typeof NOTES) {
  if (!soundOn()) return;
  try {
    const ctx = new AudioContext();
    NOTES[kind].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.09; g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      o.start(t); o.stop(t + 0.26);
    });
  } catch {}
}

export const buzz = (ms: number | number[] = 30) => navigator.vibrate?.(ms);

export function burst(color?: string, big = false) {
  const colors = color ? [color, "#f5c542", "#ffffff"] : ["#c0392b", "#2874a6", "#b7950b", "#1e8449", "#f5c542"];
  confetti({ particleCount: big ? 220 : 90, spread: big ? 110 : 70, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
  if (big) setTimeout(() => confetti({ particleCount: 120, angle: 60, spread: 60, origin: { x: 0 }, colors }), 250), setTimeout(() => confetti({ particleCount: 120, angle: 120, spread: 60, origin: { x: 1 }, colors }), 400);
}