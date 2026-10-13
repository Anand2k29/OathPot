"use client";
import React, { useState } from "react";
import { useSession } from "@/lib/sessionContext";
import { callRelayer, errMsg } from "@/lib/relayerClient";

const NAV = [
  { href: "/dashboard", label: "Pots", icon: "🍯", newTab: false },
  { href: "/create", label: "Start", icon: "➕", newTab: true },
];

function AccountModal({ onClose }: { onClose: () => void }) {
  const s = useSession();
  const [name, setName] = useState(s.active?.name || "");
  const [imp, setImp] = useState("");
  const [busy, setBusy] = useState(false);
  const faucet = async () => {
    setBusy(true);
    try { await callRelayer("faucet", s.address); await s.refresh(); s.toast("Added test funds", "success"); } catch (e) { s.toast(errMsg(e), "error"); }
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="nb pop w-full max-w-md max-h-[90vh] overflow-auto p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center"><h3 className="text-2xl font-bold">Your account</h3><button className="nb-btn sm c-pink" onClick={onClose}>✕</button></div>
        <div><span className="label">Display name</span>
          <div className="flex gap-2"><input className="nb-input" value={name} onChange={(e) => setName(e.target.value)} /><button className="nb-btn sm" onClick={() => { s.rename(name); s.toast("Renamed", "success"); }}>Save</button></div></div>
        <div className="nb-sm p-3 mono text-xs break-all c-paper">{s.address}<button className="nb-btn sm ml-2" onClick={() => { navigator.clipboard.writeText(s.address); s.toast("Address copied", "success"); }}>Copy</button></div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="nb-sm p-3 c-lime"><div className="text-xs font-bold">BALANCE</div><div className="text-2xl font-bold">${Number(s.balance).toFixed(2)}</div></div>
          <div className="nb-sm p-3 c-cyan"><div className="text-xs font-bold">GAS (sponsored)</div><div className="text-2xl font-bold">{Number(s.mon).toFixed(2)}</div></div>
        </div>
        <button className="nb-btn w-full" disabled={busy} onClick={faucet}>{busy ? "Minting…" : "💸 Get test funds"}</button>
        <div>
          <span className="label">Accounts on this device</span>
          <div className="space-y-2">{s.profiles.map((p) => (
            <button key={p.id} onClick={() => { s.switchTo(p.id); onClose(); }} className={`nb-sm w-full text-left p-2 font-bold ${p.id === s.active?.id ? "c-yellow" : ""}`}>{p.id === s.active?.id ? "👉 " : ""}{p.name}</button>))}</div>
          <button className="nb-btn sm mt-2 c-violet" onClick={() => { s.addProfile(`Friend ${s.profiles.length}`); onClose(); }}>+ Add test friend (to try voting solo)</button>
        </div>
        <details className="nb-sm p-3"><summary>🔑 Backup / import key</summary>
          <p className="text-xs my-2">Your account lives in this browser. Back up the key or you lose access if you clear site data. Never share it.</p>
          <button className="nb-btn sm" onClick={() => { navigator.clipboard.writeText(s.active?.pk || ""); s.toast("Key copied — store it safely", "info"); }}>Copy private key</button>
          <input className="nb-input mt-2 mono text-xs" placeholder="Paste 0x… key to import" value={imp} onChange={(e) => setImp(e.target.value)} />
          <button className="nb-btn sm mt-2" onClick={() => { s.importKey(imp.trim()) ? (s.toast("Imported", "success"), onClose()) : s.toast("Invalid key", "error"); }}>Import</button>
        </details>
      </div>
    </div>
  );
}

export default function AppShell({ children, active = "/dashboard" }: { children: React.ReactNode; active?: string }) {
  const s = useSession();
  const [open, setOpen] = useState(false);
  const pill = (
    <button onClick={() => setOpen(true)} className="nb-sm c-lime px-3 py-2 font-bold flex items-center gap-2 wiggle">
      <span>💰 ${Number(s.balance).toFixed(2)}</span><span className="tag">{s.active?.name || "…"}</span>
    </button>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:flex flex-col gap-4 p-5 sticky top-0 h-screen border-r-4 border-black c-yellow">
        <a href="/" className="text-3xl font-bold h-display">🍯 Oathpot</a>
        <nav className="flex flex-col gap-3 mt-4">{NAV.map((n) => (
          <a key={n.href} href={n.href} {...(n.newTab ? { target: "_blank", rel: "noopener" } : {})} className={`nb-btn justify-start ${active === n.href ? "c-pink" : "c-paper"}`}>{n.icon} {n.label}{n.newTab && " ↗"}</a>))}</nav>
        <div className="mt-auto space-y-3">{pill}<p className="text-xs font-bold">Gas is on us. You only stake test USDC.</p></div>
      </aside>
      <div>
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between p-3 c-yellow border-b-4 border-black">
          <a href="/" className="text-xl font-bold">🍯 Oathpot</a>{pill}
        </header>
        <main className="max-w-6xl mx-auto p-4 lg:p-8 pb-28 lg:pb-8">{children}</main>
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-3 c-paper border-t-4 border-black">
          <a href="/dashboard" className="p-3 text-center font-bold">🍯<div className="text-xs">Pots</div></a>
          <a href="/create" target="_blank" rel="noopener" className="p-3 text-center font-bold c-pink border-x-4 border-black">➕<div className="text-xs">Start</div></a>
          <button onClick={() => setOpen(true)} className="p-3 text-center font-bold">👤<div className="text-xs">Account</div></button>
        </nav>
      </div>
      {open && <AccountModal onClose={() => setOpen(false)} />}
    </div>
  );
}
