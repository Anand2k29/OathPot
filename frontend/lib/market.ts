import { parseUnits, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, MARKET_ABI, MARKET_ADDRESS, MOCK_USDC_ABI } from "./contracts";
import { publicClient, send, callRelayer } from "./relayerClient";

type Hex = `0x${string}`;
export const marketEnabled = !!MARKET_ADDRESS;

export interface MarketView { yes: number; no: number; myYes: number; myNo: number; claimed: boolean }

export async function fetchMarket(pot: string, member: string, viewer: string): Promise<MarketView | null> {
  if (!MARKET_ADDRESS) return null;
  try {
    const r = (await publicClient.readContract({ address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: "getMarket", args: [pot as Hex, member as Hex, (viewer || "0x0000000000000000000000000000000000000000") as Hex] })) as readonly [bigint, bigint, bigint, bigint, boolean];
    const f = (v: bigint) => Number(formatUnits(v, 6));
    return { yes: f(r[0]), no: f(r[1]), myYes: f(r[2]), myNo: f(r[3]), claimed: r[4] };
  } catch { return null; }
}

/** Implied probability of YES from pool sizes (parimutuel). */
export const yesPct = (m: MarketView | null) => (!m || m.yes + m.no === 0 ? 50 : Math.round((m.yes / (m.yes + m.no)) * 100));

/** Estimated payout if `amount` is added to `side` and that side wins (includes your own stake). */
export function estPayout(m: MarketView | null, yes: boolean, amount: number) {
  const y = (m?.yes || 0) + (yes ? amount : 0), n = (m?.no || 0) + (yes ? 0 : amount);
  const win = yes ? y : n;
  return win ? (amount * (y + n)) / win : amount;
}

export const marketActions = {
  async bet(pk: Hex, pot: string, member: string, yes: boolean, amount: number, me: string) {
    if (!MARKET_ADDRESS) throw new Error("Market not deployed");
    const units = parseUnits(String(amount), 6);
    const bal = (await publicClient.readContract({ address: CONTRACT_ADDRESSES.mockUSDC, abi: MOCK_USDC_ABI, functionName: "balanceOf", args: [me as Hex] })) as bigint;
    if (bal < units) await callRelayer("faucet", me);
    await send(pk, { address: CONTRACT_ADDRESSES.mockUSDC, abi: MOCK_USDC_ABI, functionName: "approve", args: [MARKET_ADDRESS, units] });
    return send(pk, { address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: "bet", args: [pot as Hex, member as Hex, yes, units] });
  },
  claim(pk: Hex, pot: string, member: string) {
    if (!MARKET_ADDRESS) throw new Error("Market not deployed");
    return send(pk, { address: MARKET_ADDRESS, abi: MARKET_ABI, functionName: "claim", args: [pot as Hex, member as Hex] });
  },
};
