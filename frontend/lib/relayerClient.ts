import { createPublicClient, createWalletClient, http, formatUnits, parseUnits, parseEther, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, MOCK_USDC_ABI, POT_FACTORY_ABI, POT_ABI, DEMO_POT_ABI, NETWORK_CONFIG } from "./contracts";

export const monadTestnetChain = defineChain({
  id: NETWORK_CONFIG.chainId,
  name: NETWORK_CONFIG.chainName,
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
  rpcUrls: { default: { http: [NETWORK_CONFIG.rpcUrl] } },
  blockExplorers: { default: { name: "MonadScan", url: NETWORK_CONFIG.explorerUrl } },
});

export const publicClient = createPublicClient({ chain: monadTestnetChain, transport: http(NETWORK_CONFIG.rpcUrl) });
type Hex = `0x${string}`;

export const errMsg = (e: any): string =>
  (e?.shortMessage || e?.message || "Something went wrong").split("\n")[0].replace(/^execution reverted:?\s*/i, "").slice(0, 140);

/** Relayer only sponsors gas + test-USDC. It never signs user actions. */
export async function callRelayer(action: "gas" | "faucet" | "onboard", userAddress: string) {
  const res = await fetch("/api/relayer", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, userAddress }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(data.error || "Relayer request failed");
  return data;
}

export async function fetchUSDCBalance(addr: string): Promise<string> {
  try {
    const b = (await publicClient.readContract({ address: CONTRACT_ADDRESSES.mockUSDC as Hex, abi: MOCK_USDC_ABI, functionName: "balanceOf", args: [addr as Hex] })) as bigint;
    return formatUnits(b, 6);
  } catch { return "0"; }
}
export async function fetchMonBalance(addr: string): Promise<bigint> {
  try { return await publicClient.getBalance({ address: addr as Hex }); } catch { return BigInt(0); }
}

export async function send(pk: Hex, req: { address: Hex; abi: any; functionName: string; args?: any[] }) {
  const wallet = createWalletClient({ account: privateKeyToAccount(pk), chain: monadTestnetChain, transport: http(NETWORK_CONFIG.rpcUrl) });
  if ((await fetchMonBalance(wallet.account.address)) < parseEther("0.02")) await callRelayer("gas", wallet.account.address);
  const hash = await wallet.writeContract(req as any);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error("Transaction reverted");
  return { hash, receipt };
}

export const actions = {
  async createPot(pk: Hex, p: { title: string; goalType: string; stakeAmount: number; joinDeadline: number; endDate: number; requiredCheckIns: number; charityAddress?: string; isDemo: boolean }) {
    const { receipt, hash } = await send(pk, {
      address: CONTRACT_ADDRESSES.potFactory as Hex, abi: POT_FACTORY_ABI, functionName: "createPot",
      args: [{ title: p.title, goalType: p.goalType, stakeAmount: parseUnits(String(p.stakeAmount), 6), joinDeadline: BigInt(p.joinDeadline), endDate: BigInt(p.endDate),
        requiredCheckIns: BigInt(p.requiredCheckIns), charityAddress: (p.charityAddress || "0x000000000000000000000000000000000000dEaD") as Hex, isDemo: p.isDemo }],
    });
    const log = receipt.logs.find((l) => l.address.toLowerCase() === CONTRACT_ADDRESSES.potFactory.toLowerCase() && l.topics[1]);
    return { hash, potAddress: log ? (`0x${log.topics[1]!.slice(26)}` as string) : "" };
  },
  async join(pk: Hex, pot: string, stake: string) {
    const me = privateKeyToAccount(pk).address;
    const units = parseUnits(stake, 6);
    const bal = (await publicClient.readContract({ address: CONTRACT_ADDRESSES.mockUSDC as Hex, abi: MOCK_USDC_ABI, functionName: "balanceOf", args: [me] })) as bigint;
    if (bal < units) await callRelayer("faucet", me);
    await send(pk, { address: CONTRACT_ADDRESSES.mockUSDC as Hex, abi: MOCK_USDC_ABI, functionName: "approve", args: [pot as Hex, units] });
    return send(pk, { address: pot as Hex, abi: POT_ABI, functionName: "join", args: [] });
  },
  submitCheckIn: (pk: Hex, pot: string, proofHash: Hex, note: string) => send(pk, { address: pot as Hex, abi: POT_ABI, functionName: "submitCheckIn", args: [proofHash, note] }),
  vote: (pk: Hex, pot: string, id: number, approve: boolean) => send(pk, { address: pot as Hex, abi: POT_ABI, functionName: "verifyCheckIn", args: [BigInt(id), approve] }),
  settle: (pk: Hex, pot: string) => send(pk, { address: pot as Hex, abi: POT_ABI, functionName: "settle", args: [] }),
  fastForward: (pk: Hex, pot: string) => send(pk, { address: pot as Hex, abi: DEMO_POT_ABI, functionName: "fastForwardToEnd", args: [] }),
};

export interface PotDetails {
  address: string; title: string; goalType: string; stakeAmount: string; joinDeadline: number; endDate: number; requiredCheckIns: number;
  charityAddress: string; memberCount: number; totalStaked: string; isSettled: boolean; checkInCount: number; members: string[];
  checkIns: any[]; isDemo: boolean; timeOffset: number; winners: string[]; payoutPerWinner: string;
}

export async function fetchPotDetails(potAddress: string, viewer?: string): Promise<PotDetails | null> {
  try {
    const a = potAddress as Hex;
    const read = (functionName: string, args: any[] = [], abi: any = POT_ABI) => publicClient.readContract({ address: a, abi, functionName, args } as any);
    const [s, members, raw] = (await Promise.all([read("getPotSummary"), read("getMembers"), read("getAllCheckIns")])) as [any, string[], any[]];
    let timeOffset = 0, isDemo = false;
    try { timeOffset = Number(await read("timeOffset", [], DEMO_POT_ABI)); isDemo = true; } catch {}
    const isSettled = Boolean(s[9]);
    let winners: string[] = [], payoutPerWinner = "0";
    if (isSettled) {
      const flags = await Promise.all(members.map((m) => read("isWinner", [m]) as Promise<boolean>));
      winners = members.filter((_, i) => flags[i]);
      payoutPerWinner = formatUnits((await read("payoutPerWinner")) as bigint, 6);
    }
    const checkIns = await Promise.all(raw.map(async (c: any, i: number) => ({
      ...c, id: i,
      voted: viewer ? ((await read("hasVoted", [BigInt(i), viewer])) as boolean) : false,
    })));
    return {
      address: potAddress, title: s[0], goalType: s[1], stakeAmount: formatUnits(s[2], 6), joinDeadline: Number(s[3]), endDate: Number(s[4]),
      requiredCheckIns: Number(s[5]), charityAddress: s[6], memberCount: Number(s[7]), totalStaked: formatUnits(s[8], 6), isSettled,
      checkInCount: Number(s[10]), members, checkIns, isDemo, timeOffset, winners, payoutPerWinner,
    };
  } catch (e) { console.error("fetchPotDetails", e); return null; }
}

export async function fetchAllPots(): Promise<string[]> {
  try { return [...((await publicClient.readContract({ address: CONTRACT_ADDRESSES.potFactory as Hex, abi: POT_FACTORY_ABI, functionName: "getAllPots" })) as string[])]; } catch { return []; }
}
export async function fetchUserPots(user: string): Promise<string[]> {
  try { return [...((await publicClient.readContract({ address: CONTRACT_ADDRESSES.potFactory as Hex, abi: POT_FACTORY_ABI, functionName: "getUserPots", args: [user as Hex] })) as string[])]; } catch { return []; }
}

/** Are the configured contracts actually deployed on the configured network? */
export async function checkDeployment(): Promise<{ ok: boolean; missing: string[] }> {
  const missing: string[] = [];
  try {
    const [f, u] = await Promise.all([
      publicClient.getCode({ address: CONTRACT_ADDRESSES.potFactory as Hex }),
      publicClient.getCode({ address: CONTRACT_ADDRESSES.mockUSDC as Hex }),
    ]);
    if (!f || f === "0x") missing.push("PotFactory");
    if (!u || u === "0x") missing.push("MockUSDC");
  } catch { missing.push("RPC unreachable"); }
  return { ok: missing.length === 0, missing };
}
