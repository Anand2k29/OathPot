"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import CheckInModal from "@/components/CheckInModal";
import SettlementModal from "@/components/SettlementModal";
import MarketPanel from "@/components/MarketPanel";
import { Tilt, useNow, fmtDur } from "@/components/Fx";
import { useSession } from "@/lib/sessionContext";
import { actions, errMsg, fetchPotDetails, PotDetails } from "@/lib/relayerClient";

const EMOJI: Record<string, string> = { Gym: "💪", Study: "📚", Save: "🥗", Custom: "✨" };

export default function PotPage() {
  const { address: potAddress } = useParams() as { address: string };
  const s = useSession();
  const [pot, setPot] = useState<PotDetails | null>(null);
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState("");
  const [checkIn, setCheckIn] = useState(false);
  const [result, setResult] = useState(false);
  const now = useNow();

  const load = useCallback(async () => {
    const d = await fetchPotDetails(potAddress, s.address || undefined);
    if (d) { setPot(d); setMissing(false); } else setPot((p) => { if (!p) setMissing(true); return p; });
  }, [potAddress, s.address]);
  useEffect(() => { if (!s.ready) return; load(); const i = setInterval(load, 5000); return () => clearInterval(i); }, [load, s.ready]);

  const run = async (key: string, start: string, ok: string, fn: () => Promise<unknown>) => {
    setBusy(key); s.toast(start);
    try { await fn(); s.toast(ok, "success"); await Promise.all([load(), s.refresh()]); } catch (e) { s.toast(errMsg(e), "error"); }
    setBusy("");
  };

  if (missing) return <AppShell><div className="nb p-10 text-center"><div className="text-6xl">🕳️</div><h2 className="text-3xl font-bold mt-3">Pot not found</h2><p>Check the link, or the contracts may be on a different network.</p><a href="/dashboard" className="nb-btn mt-5">Back</a></div></AppShell>;
  if (!pot) return <AppShell><div className="nb p-10 text-center font-bold animate-pulse">Loading pot from Monad…</div></AppShell>;

  const me = s.address.toLowerCase();
  const isMember = pot.members.some((m) => m.toLowerCase() === me);
  const chainNow = now + pot.timeOffset;
  const joinOpen = chainNow < pot.joinDeadline;
  const ended = chainNow >= pot.endDate;
  const invite = typeof window !== "undefined" ? window.location.href : "";
  const charity = Math.max(0, Number(pot.totalStaked) - Number(pot.payoutPerWinner) * pot.winners.length).toFixed(2);
  const share = () => { const text = `Join my Oathpot "${pot.title}" — stake $${pot.stakeAmount}, hit ${pot.requiredCheckIns} check-ins.`;
    navigator.share ? navigator.share({ text, url: invite }).catch(() => {}) : (navigator.clipboard.writeText(invite), s.toast("Invite link copied", "success")); };
  const verifiedOf = (m: string) => pot.checkIns.filter((c) => c.member.toLowerCase() === m.toLowerCase() && c.isVerified).length;

  return (
    <AppShell>
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tilt><div className="nb p-5 c-yellow">
            <div className="flex justify-between"><span className="text-5xl float">{EMOJI[pot.goalType] || "✨"}</span><span className="tag">{pot.isSettled ? "SETTLED" : ended ? "ENDED" : "ACTIVE"}{pot.isDemo ? " · DEMO" : ""}</span></div>
            <h1 className="h-display text-4xl mt-3">{pot.title}</h1>
            <p className="font-bold mt-1">{pot.requiredCheckIns} check-ins required</p>
            <div className="grid grid-cols-3 gap-3 mt-4 text-center">
              <div className="nb-sm bg-white p-2"><div className="text-[10px] font-bold">STAKE</div><div className="text-xl font-bold">${pot.stakeAmount}</div></div>
              <div className="nb-sm bg-white p-2"><div className="text-[10px] font-bold">POT</div><div className="text-xl font-bold">${pot.totalStaked}</div></div>
              <div className="nb-sm bg-white p-2"><div className="text-[10px] font-bold">FRIENDS</div><div className="text-xl font-bold">{pot.memberCount}/8</div></div>
            </div>
            <div className="nb-sm c-ink p-3 mt-4 text-center mono font-bold">{pot.isSettled ? "🏁 Finished" : `⏱ ${fmtDur(pot.endDate - chainNow)} left`}</div>
          </div></Tilt>

          {!isMember && !pot.isSettled && (
            <div className="nb p-5 c-pink pop"><h3 className="text-2xl font-bold">Accept the challenge</h3>
              <p className="font-medium my-2">Stake <b>${pot.stakeAmount}</b>. Hit {pot.requiredCheckIns} verified check-ins to get it back plus your share.</p>
              <p className="text-[11px] font-bold mb-3">⚠ RISK: If you miss the goal you lose your stake to the winners (or charity). Testnet funds only.</p>
              {joinOpen ? <button className="nb-btn w-full c-lime" disabled={!!busy} onClick={() => run("join", "Staking & joining…", `Joined ${pot.title}!`, () => actions.join(s.pk, potAddress, pot.stakeAmount))}>{busy === "join" ? "Joining…" : `Join for $${pot.stakeAmount}`}</button>
                : <div className="nb-sm bg-white p-3 font-bold">Joining closed for this pot.</div>}
            </div>)}

          <div className="nb p-5 space-y-3">
            <div className="flex justify-between items-center"><h3 className="text-xl font-bold">Friend progress</h3><button className="nb-btn sm c-cyan" onClick={share}>Invite ↗</button></div>
            {pot.members.length === 0 && <p className="font-medium">Nobody has joined yet.</p>}
            {pot.members.map((m) => { const v = verifiedOf(m); const pct = Math.min(100, Math.round((v / pot.requiredCheckIns) * 100));
              return (<div key={m}><div className="flex justify-between text-sm font-bold"><span>{m.toLowerCase() === me ? "⭐ " : ""}{s.aliasOf(m)}{pot.winners.some((w) => w.toLowerCase() === m.toLowerCase()) ? " 🏆" : ""}</span><span>{v}/{pot.requiredCheckIns}</span></div><div className="bar"><i style={{ width: `${pct}%` }} /></div></div>); })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {isMember && !pot.isSettled && <button className="nb-btn c-lime" onClick={() => setCheckIn(true)}>📸 Check in</button>}
            {isMember && !pot.isSettled && <button className="nb-btn c-orange" disabled={!!busy} onClick={() => run("settle", "Settling…", "Pot settled!", async () => { await actions.settle(s.pk, potAddress); setResult(true); })}>{busy === "settle" ? "Settling…" : "🏁 Settle"}</button>}
            {pot.isSettled && <button className="nb-btn c-pink col-span-2" onClick={() => setResult(true)}>🏆 View results</button>}
          </div>
          {pot.isDemo && !pot.isSettled && (
            <div className="nb-sm c-violet p-3"><p className="text-xs font-bold mb-2">DEMO TOOLS</p>
              <button className="nb-btn sm w-full" disabled={!!busy} onClick={() => run("ff", "Skipping time…", "Moved to deadline — you can settle now", () => actions.fastForward(s.pk, potAddress))}>⏩ Fast-forward to end</button></div>)}
        </div>

        <div className="lg:col-span-3 nb p-5">
          <h3 className="text-2xl font-bold mb-4">🗳️ Verification feed</h3>
          {pot.checkIns.length === 0 ? <div className="text-center py-10 font-bold"><div className="text-5xl float">📭</div>No check-ins yet. Be the first to post proof.</div> : (
            <div className="space-y-4">{[...pot.checkIns].reverse().map((c, k) => {
              const self = c.member.toLowerCase() === me;
              return (
                <div key={c.id} className={`nb-sm p-4 pop ${k % 2 ? "c-paper" : "bg-white"}`}>
                  <div className="flex justify-between text-sm font-bold"><span>{s.aliasOf(c.member)}</span><span className="mono opacity-60">{new Date(Number(c.timestamp) * 1000).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}</span></div>
                  <p className="my-3 font-medium">“{c.note}”</p>
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <span className={`tag ${c.isVerified ? "c-lime" : "c-yellow"}`}>{c.isVerified ? "✅ Verified" : "⏳ Needs votes"} · 👍{Number(c.approvals)} 👎{Number(c.rejections)}</span>
                    {isMember && !self && !pot.isSettled && !c.isVerified && (c.voted ? <span className="tag">You voted</span> : (
                      <div className="flex gap-2">
                        <button className="nb-btn sm c-lime" disabled={!!busy} onClick={() => run(`v${c.id}`, "Approving…", "Approved!", () => actions.vote(s.pk, potAddress, c.id, true))}>Approve</button>
                        <button className="nb-btn sm c-pink" disabled={!!busy} onClick={() => run(`v${c.id}`, "Disputing…", "Dispute recorded", () => actions.vote(s.pk, potAddress, c.id, false))}>Dispute</button></div>))}
                  </div>
                </div>); })}</div>)}
        </div>
      </div>

      <MarketPanel pot={pot} ended={ended} />

      <CheckInModal isOpen={checkIn} onClose={() => setCheckIn(false)} potAddress={potAddress} onSuccess={load} />
      <SettlementModal isOpen={result} onClose={() => setResult(false)} potTitle={pot.title} winnerNames={pot.winners.map(s.aliasOf)} payoutAmount={pot.payoutPerWinner} charityAmount={charity} totalPot={pot.totalStaked} />
    </AppShell>
  );
}
