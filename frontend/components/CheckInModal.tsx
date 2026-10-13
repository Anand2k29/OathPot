"use client";
import React, { useState } from "react";
import { keccak256, toHex } from "viem";
import { useSession } from "@/lib/sessionContext";
import { actions, errMsg } from "@/lib/relayerClient";

export default function CheckInModal({ isOpen, onClose, potAddress, onSuccess }: { isOpen: boolean; onClose: () => void; potAddress: string; onSuccess: () => void }) {
  const { pk, toast } = useSession();
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!isOpen) return null;

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onloadend = () => setPhoto(r.result as string); r.readAsDataURL(f);
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return toast("Write a quick note first", "error");
    setBusy(true); toast("Posting check-in…");
    try {
      await actions.submitCheckIn(pk, potAddress, keccak256(toHex(`${note}_${photo || ""}_${Date.now()}`)), note.trim());
      toast("Check-in posted! Friends can verify it now.", "success");
      setNote(""); setPhoto(null); onSuccess(); onClose();
    } catch (err) { toast(errMsg(err), "error"); }
    setBusy(false);
  };
  return (
    <div className="fixed inset-0 z-[80] bg-black/50 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="nb pop w-full max-w-md p-5 space-y-4">
        <div className="flex justify-between items-center"><h3 className="text-2xl font-bold">📸 New check-in</h3><button type="button" className="nb-btn sm c-pink" onClick={onClose}>✕</button></div>
        <div><span className="label">What did you do?</span>
          <textarea className="nb-input" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Leg day crushed. 10k steps 💪" /></div>
        <div><span className="label">Proof photo (optional)</span>
          {photo ? (
            <div className="relative nb-sm overflow-hidden"><img src={photo} alt="proof" className="w-full max-h-44 object-cover" />
              <button type="button" className="nb-btn sm c-pink absolute top-2 right-2" onClick={() => setPhoto(null)}>✕</button></div>
          ) : (
            <label className="nb-sm c-cyan h-24 grid place-items-center font-bold cursor-pointer">⬆ Upload photo<input type="file" accept="image/*" className="hidden" onChange={pick} /></label>)}
          <p className="text-xs mt-1 opacity-70">Photos are fingerprinted on-chain as proof; the note is what friends see.</p></div>
        <button className="nb-btn w-full c-lime" disabled={busy}>{busy ? "Posting…" : "Submit check-in"}</button>
      </form>
    </div>
  );
}
