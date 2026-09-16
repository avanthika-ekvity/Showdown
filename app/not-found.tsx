import Link from "next/link";
export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-6 text-center">
      <div><p className="display text-5xl">🎲 Oops!</p><p className="mt-2 text-[var(--muted)]">Looks like the dice rolled off the board.</p>
        <Link href="/" className="focusable mt-6 inline-block rounded-full bg-[var(--gold)] px-6 py-3 font-bold text-[#1b1200]">Back to the arena</Link></div>
    </main>
  );
}