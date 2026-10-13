"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useSession } from "@/lib/sessionContext";
import { errMsg, PotDetails } from "@/lib/relayerClient";
import { marketEnabled, fetchMarket, marketActions, yesPct, estPayout, MarketView } from "@/lib/market";

export default function MarketPanel({ pot, ended }: { pot: PotDetails; ended: boolean }) {
  const s = useSession();
  const [mk, setMk] = useState<Record<string, MarketView | null>>({});
  const [amt, setAmt] = useState(2);
  const [busy, setBusy] = useState("");
  const me = s.address.toLowerCase();
  const isMember = pot.members.some((m) => m.toLowerCase() === me);
  const open = !pot.isSettled && !ended;

  const load = useCallback(async () => {
    const rows = await Promise.all(pot.members.map((m) => fetchMarket(pot.address, m, s.address)));
    setMk(Object.fromEntries(pot.members.map((m, i) => [m, rows[i]])));
  }, [pot.address, pot.members, s.address]);
  useEffect(() => { if (!marketEnabled) return; load(); const i = setInterval(load, 4000); return () => clearInterval(i); }, [load]);

  const run = async (key: string, start: string, ok: string, fn: () => Promise<unknown>) => {
    setBusy(key); s.toast(start);
    try { await fn(); s.toast(ok, "success"); await Promise.all([load(), s.refresh()]); } catch (e) { s.toast(errMsg(e), "error"); }
    setBusy("");
  };

  return (
    <div className="nb p-5 mt-6" id="markets">
      <div className="flex flex-wrap items-center gap-2 justify-between mb-1">
        <h3 className="text-2xl font-bold">📈 Commitment Markets</h3>
        <span className="tag c-lime flex items-center gap-2"><span className="live-dot" /> LIVE ODDS · 4s refresh</span>
      </div>
      <p className="text-sm font-medium mb-4">Back or fade a friend. Each market asks one question — <b>“Will they hit their goal?”</b> — and settles automatically from the pot contract. No oracle, no admin, no fee.</p>

      {!marketEnabled ? (
        <div className="nb-sm c-paper p-4 font-medium text-sm">Markets aren't deployed on this instance yet. Set <span className="mono">NEXT_PUBLIC_MARKET_ADDRESS</span> (see README → Deploy).</div>
      ) : (
        <>
          {isMember && <div className="nb-sm c-yellow p-3 text-sm font-bold mb-4">🔒 You're in this pot, so you can't bet on it — that stops anyone from betting NO on themselves and quitting on purpose. Invite friends to trade.</div>}
          {!isMember && open && (
            <div className="flex items-center gap-2 mb-4 flex-wrap"><span className="label !mb-0">Bet size</span>
              {[1, 2, 5, 10].map((a) => <button key={a} className={`nb-btn sm ${amt === a ? "c-pink" : "c-paper"}`} onClick={() => setAmt(a)}>${a}</button>)}</div>)}

          <div className="grid md:grid-cols-2 gap-4">
            {pot.members.map((m) => {
              const v = mk[m] ?? null; const p = yesPct(v); const won = pot.winners.some((w) => w.toLowerCase() === m.toLowerCase());
              const mine = v ? v.myYes + v.myNo : 0;
              const canClaim = pot.isSettled && v && mine > 0 && !v.claimed;
              return (
                <div key={m} className="nb-sm p-4">
                  <div className="flex justify-between font-bold"><span>{s.aliasOf(m)} hits goal?</span><span className="mono">{p}%</span></div>
                  <div className="odds my-2"><i style={{ width: `${p}%`, background: "var(--lime)" }} /><i style={{ width: `${100 - p}%`, background: "var(--pink)" }} /></div>
                  <div className="flex justify-between text-xs font-bold"><span>YES ${(v?.yes ?? 0).toFixed(2)}</span><span>Pool ${((v?.yes ?? 0) + (v?.no ?? 0)).toFixed(2)}</span><span>NO ${(v?.no ?? 0).toFixed(2)}</span></div>
                  {mine > 0 && <div className="text-xs mt-2 font-bold">Your position: {v!.myYes > 0 && `YES $${v!.myYes.toFixed(2)} `}{v!.myNo > 0 && `NO $${v!.myNo.toFixed(2)}`}</div>}
                  {!isMember && open && (
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      <button className="nb-btn sm c-lime flex-col !items-start" disabled={!!busy} onClick={() => run(`y${m}`, "Placing YES bet…", "YES bet placed!", () => marketActions.bet(s.pk, pot.address, m, true, amt, s.address))}>
                        <span>Back YES</span><span className="text-[10px] font-medium">wins ≈ ${estPayout(v, true, amt).toFixed(2)}</span></button>
                      <button className="nb-btn sm c-pink flex-col !items-start" disabled={!!busy} onClick={() => run(`n${m}`, "Placing NO bet…", "NO bet placed!", () => marketActions.bet(s.pk, pot.address, m, false, amt, s.address))}>
                        <span>Fade NO</span><span className="text-[10px] font-medium">wins ≈ ${estPayout(v, false, amt).toFixed(2)}</span></button>
                    </div>)}
                  {pot.isSettled && <div className="mt-3 flex items-center justify-between gap-2"><span className={`tag ${won ? "c-lime" : "c-pink"}`}>{won ? "✅ Hit goal — YES won" : "❌ Missed — NO won"}</span>
                    {canClaim && <button className="nb-btn sm c-yellow" disabled={!!busy} onClick={() => run(`c${m}`, "Claiming…", "Claimed! Check your balance.", () => marketActions.claim(s.pk, pot.address, m))}>Claim</button>}</div>}
                </div>);
            })}
          </div>
          <p className="text-[11px] font-bold mt-4 opacity-80">⚠ RISK: Bets are final and you can lose 100% of what you stake. Payouts are parimutuel — the odds shown change as others trade. Testnet funds only; not financial advice. Betting closes when the pot's end date passes.</p>
        </>
      )}
    </div>
  );
}
