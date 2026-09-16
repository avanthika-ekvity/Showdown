"use client";
import { useEffect, useState } from "react";
import Intro from "@/components/Intro";
import Landing from "@/components/Landing";

export default function Home() {
  // null = not decided yet (avoids intro flash on repeat visits)
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  useEffect(() => setShowIntro(!localStorage.getItem("showdown:intro")), []);
  if (showIntro === null) return null;
  if (showIntro) return <Intro onDone={() => { localStorage.setItem("showdown:intro", "1"); setShowIntro(false); }} />;
  return <Landing onReplayIntro={() => setShowIntro(true)} />;
}