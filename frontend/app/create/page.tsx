"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { useSession } from "@/lib/sessionContext";
import { actions, errMsg } from "@/lib/relayerClient";

const T = [
  { id: "Gym", title: "Gym Warriors", e: "💪", d: "Hit 4 workouts this week", stake: 5, ci: 4, c: "c-yellow" },
  { id: "Study", title: "8 AM Study Squad", e: "📚", d: "Early library sessions", stake: 5, ci: 5, c: "c-cyan" },
  { id: "Save", title: "No Takeout Pledge", e: "🥗", d: "Cook meals at home", stake: 10, ci: 5, c: "c-lime" },
  { id: "Custom", title: "Custom Goal", e: "✨", d: "Define your own", stake: 5, ci: 3, c: "c-pink" },
];

export default function Create() {
  const s = useSession(); const router = useRouter();
  const [t, setT] = useState(T[0]);
  const [title, setTitle] = useState(T[0].title);
  const [stake, setStake] = useState(5);
  const [ci, setCi] = useState(4);
  const [days, setDays] = useState(7);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); s.toast("Creating your pot on Monad…");
    try {
      const now = Math.floor(Date.now() / 1000);
      const r = await actions.createPot(s.pk, { title: title.trim(), goalType: t.id, stakeAmount: stake, joinDeadline: now + 86400 * 2, endDate: now + 86400 * days, requiredCheckIns: ci, isDemo: demo });
      s.toast("Pot created! Now join it and invite friends.", "success");
      router.push(r.potAddress ? `/pot/${r.potAddress}` : "/dashboard");
    } catch (err) { s.toast(errMsg(err), "error"); setBusy(false); }
  };

  return (
    <AppShell active="/create">
      <h1 className="h-display text-5xl sm:text-6xl mb-6">Start a pot</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          <div><span className="label">1 · Pick a template</span>
            <div className="grid grid-cols-2 gap-4">{T.map((x) => (
              <button type="button" key={x.id} onClick={() => { setT(x); setTitle(x.title); setStake(x.stake); setCi(x.ci); }}
                className={`nb p-4 text-left transition-transform ${x.c} ${t.id === x.id ? "-translate-y-1 rotate-1" : "opacity-70"}`}>
                <div className="text-4xl">{x.e}</div><div className="font-bold">{x.title}</div><div className="text-xs">{x.d}</div></button>))}</div></div>
          <div><span className="label">2 · Name it</span><input className="nb-input" required maxLength={60} value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><span className="label">3 · Stake each</span>
            <div className="grid grid-cols-4 gap-3">{[2, 5, 10, 20].map((a) => (<button type="button" key={a} onClick={() => setStake(a)} className={`nb-btn ${stake === a ? "c-pink" : "c-paper"}`}>${a}</button>))}</div></div>
          <div className="grid grid-cols-2 gap-4">
            <div><span className="label">Check-ins needed</span><input type="number" min={1} max={30} className="nb-input" value={ci} onChange={(e) => setCi(Math.max(1, parseInt(e.target.value) || 1))} /></div>
            <div><span className="label">Duration</span><select className="nb-input" value={days} onChange={(e) => setDays(+e.target.value)}><option value={3}>3 days</option><option value={7}>7 days</option><option value={14}>14 days</option></select></div>
          </div>
          <label className="nb-sm p-3 flex gap-3 items-start cursor-pointer c-paper"><input type="checkbox" className="mt-1 w-5 h-5 accent-black" checked={demo} onChange={(e) => setDemo(e.target.checked)} />
            <span className="text-sm"><b>Demo pot</b> — enables a "fast-forward time" button so you can test settlement in seconds. Anyone can use it, so leave off for real pots.</span></label>
        </div>
        <div className="lg:sticky lg:top-8 h-fit space-y-4">
          <div className={`nb p-5 ${t.c}`} style={{ transform: "rotate(1deg)" }}>
            <div className="text-5xl">{t.e}</div><h3 className="text-2xl font-bold mt-2">{title || "Your pot"}</h3>
            <p className="mt-3 font-medium">Hit <b>{ci} verified check-ins</b> in {days} days and you get your <b>${stake}</b> back <b>plus a share</b> of whoever quits.</p>
            <p className="mt-2 text-sm font-bold">💚 If everyone fails, the pot goes to charity.</p>
            <p className="mt-2 text-[11px] font-bold">⚠ Everyone, including you, can lose their stake. Check-ins are verified by friends. Testnet funds only.</p></div>
          <button className="nb-btn w-full text-xl c-lime py-4" disabled={busy || !s.ready}>{busy ? "Deploying…" : "Create pot 🚀"}</button>
        </div>
      </form>
    </AppShell>
  );
}
