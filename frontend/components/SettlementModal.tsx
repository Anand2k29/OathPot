"use client";
import React, { useEffect } from "react";
import confetti from "canvas-confetti";

export default function SettlementModal({ isOpen, onClose, potTitle, winnerNames, payoutAmount, charityAmount, totalPot }:
  { isOpen: boolean; onClose: () => void; potTitle: string; winnerNames: string[]; payoutAmount: string; charityAmount: string; totalPot: string }) {
  useEffect(() => {
    if (!isOpen || winnerNames.length === 0) return;
    const end = Date.now() + 1200;
    (function f() { confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0 }, colors: ["#ffd93d", "#ff6b9d", "#b8f34a", "#4cd9ff"] });
      confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1 }, colors: ["#ffd93d", "#ff6b9d", "#b8f34a", "#4cd9ff"] }); if (Date.now() < end) requestAnimationFrame(f); })();
  }, [isOpen, winnerNames.length]);
  if (!isOpen) return null;
  const text = winnerNames.length ? `🏆 ${winnerNames.join(" & ")} walked away with $${payoutAmount} each in "${potTitle}" on Oathpot. Oath kept. 🍯` : `Nobody hit the goal in "${potTitle}". $${totalPot} went to charity.`;
  return (
    <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="nb pop w-full max-w-md p-6 text-center c-yellow" onClick={(e) => e.stopPropagation()} style={{ transform: "rotate(-1deg)" }}>
        <div className="text-7xl float">🏆</div>
        <h2 className="h-display text-5xl my-2">POT SETTLED</h2>
        <p className="font-bold mb-4">{potTitle}</p>
        <div className="nb-sm p-4 text-left bg-white">
          {winnerNames.length ? (<><div className="text-xl font-bold">🎉 {winnerNames.join(" & ")}</div><div className="text-3xl font-bold">${payoutAmount} each</div></>) : <div className="text-xl font-bold">All funds → charity 💚</div>}
          <div className="mt-3 flex justify-between text-sm font-bold"><span>Total pot ${totalPot}</span>{Number(charityAmount) > 0 && <span>💚 ${charityAmount} charity</span>}</div>
        </div>
        <div className="flex gap-3 mt-5">
          <button className="nb-btn flex-1 c-pink" onClick={() => { navigator.share ? navigator.share({ text }).catch(() => {}) : navigator.clipboard.writeText(text); }}>Share card</button>
          <button className="nb-btn flex-1 c-paper" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
