"use client";
import { Howl } from "howler";
import confetti from "canvas-confetti";

const SOUND_KEY = "showdown:sound";
export const soundOn = () => typeof localStorage === "undefined" ? true : localStorage.getItem(SOUND_KEY) !== "off";
export const setSound = (on: boolean) => localStorage.setItem(SOUND_KEY, on ? "on" : "off");

const SOUNDS: Record<string, Howl> = {};

function getSound(key: string, url: string, opts: { volume?: number; loop?: boolean } = {}) {
  if (!SOUNDS[key]) {
    SOUNDS[key] = new Howl({
      src: [url],
      volume: opts.volume ?? 0.6,
      loop: opts.loop ?? false,
      html5: true,
    });
  }
  return SOUNDS[key];
}

const SFX = {
  dice:    () => getSound("dice",    "https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3", { volume: 0.5 }),
  score:   () => getSound("score",   "https://assets.mixkit.co/active_storage/sfx/1997/1997-preview.mp3", { volume: 0.6 }),
  win:     () => getSound("win",     "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3", { volume: 0.7 }),
  power:   () => getSound("power",   "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3", { volume: 0.6 }),
  oops:    () => getSound("oops",    "https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3", { volume: 0.5 }),
  card:    () => getSound("card",    "https://assets.mixkit.co/active_storage/sfx/2064/2064-preview.mp3", { volume: 0.5 }),
  beep:    () => getSound("beep",    "https://assets.mixkit.co/active_storage/sfx/254/254-preview.mp3",   { volume: 0.4 }),
  ambient: () => getSound("ambient", "https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3",   { volume: 0.08, loop: true }),
};

export function play(kind: "dice" | "score" | "win" | "power" | "oops" | "card" | "beep") {
  if (!soundOn()) return;
  try { SFX[kind]().play(); } catch {}
}

export function playAmbient() {
  if (!soundOn()) return;
  try {
    const a = SFX.ambient();
    if (!a.playing()) a.play();
  } catch {}
}

export function stopAmbient() {
  try { SFX.ambient?.().stop(); } catch {}
}

export const buzz = (ms: number | number[] = 30) => navigator.vibrate?.(ms);

export function burst(color?: string, big = false) {
  const colors = color
    ? [color, "#f5c542", "#ffffff"]
    : ["#c0392b", "#2874a6", "#b7950b", "#1e8449", "#f5c542"];
  confetti({
    particleCount: big ? 220 : 90,
    spread: big ? 110 : 70,
    origin: { y: 0.6 },
    colors,
    disableForReducedMotion: true,
  });
  if (big) {
    setTimeout(() => confetti({ particleCount: 120, angle: 60,  spread: 60, origin: { x: 0 }, colors }), 250);
    setTimeout(() => confetti({ particleCount: 120, angle: 120, spread: 60, origin: { x: 1 }, colors }), 400);
  }
}