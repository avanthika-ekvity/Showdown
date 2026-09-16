/** CSS 3D dice that tumbles in. Pure CSS; remount to replay. */
export default function Dice({ size = 72 }: { size?: number }) {
  return (
    <div className="dice-scene" style={{ transform: `scale(${size / 72})` }}>
      <div className="dice" aria-hidden>
        {[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className={`face f${n}`} />)}
      </div>
    </div>
  );
}