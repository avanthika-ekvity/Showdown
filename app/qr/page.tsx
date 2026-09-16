"use client";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

/** Print / project this. QR points at the /enter page of wherever the app is hosted. */
export default function QR() {
  const [src, setSrc] = useState(""); const [url, setUrl] = useState("");
  useEffect(() => { const u = `${location.origin}/enter`; setUrl(u); QRCode.toDataURL(u, { width: 900, margin: 1, color: { dark: "#120a2a", light: "#ffffff" } }).then(setSrc); }, []);
  return (
    <main className="grid min-h-dvh place-items-center bg-white p-8 text-center text-[#120a2a] print:p-0">
      <div>
        <h1 className="display text-7xl">THE SHOWDOWN</h1>
        <p className="display text-3xl">📱 SCAN TO ENTER</p>
        {src && <img src={src} alt={`QR code for ${url}`} className="mx-auto my-6 w-[min(80vw,520px)]" />}
        <p className="font-mono text-xl">{url}</p>
        <p className="mt-2 text-sm text-[#6b5f8a]">Captains: pick your team, enter your team word.</p>
        <button onClick={() => print()} className="focusable mt-6 rounded-full bg-[#120a2a] px-6 py-3 font-bold text-white print:hidden">🖨 Print</button>
      </div>
    </main>
  );
}