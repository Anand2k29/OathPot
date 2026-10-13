"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "@/components/AppShell";
import { Tilt } from "@/components/Fx";
import { useSession } from "@/lib/sessionContext";
import { fetchAllPots, fetchUserPots, fetchPotDetails, checkDeployment, PotDetails } from "@/lib/relayerClient";

export const GOAL_EMOJI: Record<string, string> = { Gym: "💪", Study: "📚", Save: "🥗", Custom: "✨" };
const COLORS = ["c-yellow", "c-pink", "c-cyan", "c-lime", "c-violet", "c-orange"];
const ago = (t: number) => { const d = Math.max(0, Math.floor(Date.now() / 1000) - t); return d < 60 ? `${d}s ago` : d < 3600 ? `${Math.floor(d / 60)}m ago` : d < 86400 ? `${Math.floor(d / 3600)}h ago` : `${Math.floor(d / 86400)}d ago`; };

function PotCard({ pot, i, mine }: { pot: PotDetails; i: number; mine: boolean }) {
  return (
    <Tilt><a href={`/pot/${pot.address}`} target="_blank" rel="noopener" className={`nb block p-5 ${COLORS[i % COLORS.length]} no-underline text-inherit`}>
      <div className="flex justify-between items-start"><span className="text-4xl">{GOAL_EMOJI[pot.goalType] || "✨"}</span><span className="tag">{pot.isSettled ? "Settled" : "Active"}{pot.isDemo ? " · demo" : ""}</span></div>
      <h3 className="text-2xl font-bold mt-3 leading-tight">{pot.title}</h3>
      <div className="flex flex-wrap gap-2 mt-3 text-sm font-bold"><span className="tag">${pot.stakeAmount} stake</span><span className="tag">👯 {pot.memberCount}/8</span><span className="tag">🏦 ${pot.totalStaked}</span>{mine && <span className="tag c-ink">YOURS</span>}</div>
      <div className="mt-4 font-bold">Open & trade ↗</div></a></Tilt>
  );
}

export default function Dashboard() {
  const s = useSession();
  const [pots, setPots] = useState<PotDetails[]>([]);
  const [mine, setMine] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [dep, setDep] = useState<{ ok: boolean; missing: string[] } | null>(null);

  const load = useCallback(async () => {
    const [all, my, d] = await Promise.all([fetchAllPots(), s.address ? fetchUserPots(s.address) : Promise.resolve([]), checkDeployment()]);
    const list = (await Promise.all([...all].reverse().slice(0, 18).map((a) => fetchPotDetails(a)))).filter(Boolean) as PotDetails[];
    setPots(list); setMine(new Set(my.map((a) => a.toLowerCase()))); setDep(d); setLoading(false);
  }, [s.address]);
  useEffect(() => { if (!s.ready) return; load(); const i = setInterval(load, 12000); return () => clearInterval(i); }, [load, s.ready]);

  const my = pots.filter((p) => mine.has(p.address.toLowerCase()));
  const rest = pots.filter((p) => !mine.has(p.address.toLowerCase()));

  const { board, feed } = useMemo(() => {
    const xp = new Map<string, { xp: number; wins: number; verified: number }>();
    const ev: { who: string; pot: string; note: string; t: number; ok: boolean }[] = [];
    for (const p of pots) {
      for (const m of p.members) xp.set(m, xp.get(m) || { xp: 0, wins: 0, verified: 0 });
      for (const c of p.checkIns) {
        const r = xp.get(c.member) || { xp: 0, wins: 0, verified: 0 };
        if (c.isVerified) { r.verified++; r.xp += 10; } xp.set(c.member, r);
        ev.push({ who: c.member, pot: p.title, note: c.note, t: Number(c.timestamp), ok: c.isVerified });
      }
      for (const w of p.winners) { const r = xp.get(w)!; r.wins++; r.xp += 50; }
    }
    return { board: [...xp.entries()].sort((a, b) => b[1].xp - a[1].xp).slice(0, 5), feed: ev.sort((a, b) => b.t - a.t).slice(0, 6) };
  }, [pots]);

  return (
    <AppShell active="/dashboard">
      {dep && !dep.ok && (
        <div className="nb c-pink p-4 mb-6 font-bold">⚠ Contracts not found on {`Monad Testnet`}: {dep.missing.join(", ")}. Deploy them and set <span className="mono">NEXT_PUBLIC_POT_FACTORY</span> / <span className="mono">NEXT_PUBLIC_MOCK_USDC</span> in your environment.</div>)}

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="nb p-5 c-lime"><div className="text-xs font-bold">YOUR BALANCE</div><div className="h-display text-5xl">${Number(s.balance).toFixed(2)}</div></div>
        <div className="nb p-5 c-cyan"><div className="text-xs font-bold">YOUR POTS</div><div className="h-display text-5xl">{my.length}</div></div>
        <a href="/create" target="_blank" rel="noopener" className="nb-btn c-pink text-2xl p-5 !rounded-[14px]">➕ Start a pot ↗</a>
      </div>

      <div className="grid xl:grid-cols-[1fr_340px] gap-8">
        <div>
          <h2 className="h-display text-4xl mb-4">Your pots</h2>
          {loading ? <div className="nb p-8 text-center font-bold animate-pulse">Loading pots from Monad…</div>
            : my.length === 0 ? <div className="nb p-8 text-center c-paper"><div className="text-5xl float">🍯</div><p className="font-bold mt-3">No pots yet. Start one — or open a friend's invite link.</p></div>
            : <div className="grid sm:grid-cols-2 gap-5">{my.map((p, i) => <PotCard key={p.address} pot={p} i={i} mine />)}</div>}
          {rest.length > 0 && (<><h2 className="h-display text-4xl mt-12 mb-1">Explore & trade</h2><p className="font-medium mb-4 text-sm">Open any pot you're not in to back or fade its members.</p>
            <div className="grid sm:grid-cols-2 gap-5">{rest.map((p, i) => <PotCard key={p.address} pot={p} i={i + 2} mine={false} />)}</div></>)}
        </div>

        <aside className="space-y-6">
          <div className="nb p-5 c-yellow"><h3 className="text-xl font-bold mb-3">🏅 Leaderboard</h3>
            {board.length === 0 ? <p className="text-sm font-medium">No activity yet.</p> : <ol className="space-y-2">{board.map(([a, r], i) => (
              <li key={a} className="nb-sm bg-white p-2 flex items-center justify-between text-sm font-bold"><span>{["🥇", "🥈", "🥉", "4", "5"][i]} {s.aliasOf(a)}{a.toLowerCase() === s.address.toLowerCase() ? " ⭐" : ""}</span><span className="mono">{r.xp} XP</span></li>))}</ol>}
            <p className="text-[11px] font-bold mt-3">10 XP per verified check-in · 50 XP per pot won. Computed live from chain data.</p></div>
          <div className="nb p-5"><h3 className="text-xl font-bold mb-3 flex items-center gap-2"><span className="live-dot" /> Live activity</h3>
            {feed.length === 0 ? <p className="text-sm font-medium">Waiting for the first check-in…</p> : <ul className="space-y-3">{feed.map((e, i) => (
              <li key={i} className="text-sm"><b>{s.aliasOf(e.who)}</b> checked in to <b>{e.pot}</b> {e.ok && "✅"}<div className="text-xs opacity-70 mono">{ago(e.t)} · “{e.note.slice(0, 40)}”</div></li>))}</ul>}</div>
        </aside>
      </div>
    </AppShell>
  );
}
