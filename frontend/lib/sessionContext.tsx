"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { formatEther } from "viem";
import { fetchUSDCBalance, fetchMonBalance, callRelayer } from "./relayerClient";

type Hex = `0x${string}`;
export interface Profile { id: string; name: string; pk: Hex }
export interface Toast { id: string; message: string; type: "info" | "success" | "error" }
const KEY = "oathpot:profiles:v1", ACTIVE = "oathpot:active:v1";

interface Ctx {
  ready: boolean; profiles: Profile[]; active: Profile | null; address: string; pk: Hex;
  balance: string; mon: string; refresh: () => Promise<void>;
  switchTo: (id: string) => void; addProfile: (name: string) => void; rename: (name: string) => void; importKey: (pk: string) => boolean;
  aliasOf: (addr: string) => string;
  toasts: Toast[]; toast: (m: string, t?: Toast["type"]) => void;
}
const C = createContext<Ctx | undefined>(undefined);
const mk = (name: string): Profile => ({ id: Math.random().toString(36).slice(2, 9), name, pk: generatePrivateKey() });
const addrOf = (p?: Profile | null) => (p ? privateKeyToAccount(p.pk).address : "");

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState("");
  const [ready, setReady] = useState(false);
  const [balance, setBalance] = useState("0");
  const [mon, setMon] = useState("0");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const onboarded = useRef(new Set<string>());

  useEffect(() => {
    let list: Profile[] = [];
    try { list = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch {}
    if (!list.length) { list = [mk("You")]; localStorage.setItem(KEY, JSON.stringify(list)); }
    const a = localStorage.getItem(ACTIVE);
    setProfiles(list); setActiveId(list.find((p) => p.id === a)?.id || list[0].id); setReady(true);
  }, []);

  const save = (l: Profile[]) => { setProfiles(l); localStorage.setItem(KEY, JSON.stringify(l)); };
  const active = profiles.find((p) => p.id === activeId) || null;
  const address = addrOf(active);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4500);
  }, []);

  const refresh = useCallback(async () => {
    if (!address) return;
    const [b, m] = await Promise.all([fetchUSDCBalance(address), fetchMonBalance(address)]);
    setBalance(b); setMon(formatEther(m));
  }, [address]);

  useEffect(() => {
    if (!address) return;
    refresh();
    if (!onboarded.current.has(address)) {
      onboarded.current.add(address);
      callRelayer("onboard", address).then(refresh).catch(() => {});
    }
    const i = setInterval(refresh, 15000);
    return () => clearInterval(i);
  }, [address, refresh]);

  const value: Ctx = {
    ready, profiles, active, address, pk: (active?.pk || "0x") as Hex, balance, mon, refresh,
    switchTo: (id) => { setActiveId(id); localStorage.setItem(ACTIVE, id); },
    addProfile: (name) => { const p = mk(name || `Friend ${profiles.length}`); save([...profiles, p]); setActiveId(p.id); localStorage.setItem(ACTIVE, p.id); },
    rename: (name) => save(profiles.map((p) => (p.id === activeId ? { ...p, name: name.trim() || p.name } : p))),
    importKey: (k) => { try { privateKeyToAccount(k as Hex); const p = { ...mk("Imported"), pk: k as Hex }; save([...profiles, p]); setActiveId(p.id); return true; } catch { return false; } },
    aliasOf: (a) => profiles.find((p) => addrOf(p).toLowerCase() === a.toLowerCase())?.name || `${a.slice(0, 6)}…${a.slice(-4)}`,
    toasts, toast,
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useSession() { const c = useContext(C); if (!c) throw new Error("useSession outside provider"); return c; }
