import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseEther, isAddress, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { CONTRACT_ADDRESSES, MOCK_USDC_ABI, NETWORK_CONFIG } from "@/lib/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sponsor-only relayer: tops up gas (MON) and mints test USDC. It never signs user actions.
const chain = defineChain({
  id: NETWORK_CONFIG.chainId, name: NETWORK_CONFIG.chainName,
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [NETWORK_CONFIG.rpcUrl] } },
});
const hits = new Map<string, number[]>();
function limited(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now); hits.set(key, arr);
  return arr.length > max;
}

export async function POST(req: Request) {
  const pk = process.env.RELAYER_PRIVATE_KEY;
  if (!pk) return NextResponse.json({ error: "Relayer not configured (set RELAYER_PRIVATE_KEY)" }, { status: 500 });
  try {
    const { action, userAddress } = await req.json();
    if (!isAddress(userAddress)) return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    if (!["gas", "faucet", "onboard"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "local";
    if (limited(`ip:${ip}`, 30, 60_000) || limited(`${userAddress}:${action}`, 3, 60_000))
      return NextResponse.json({ error: "Too many requests, slow down" }, { status: 429 });

    const account = privateKeyToAccount(pk as `0x${string}`);
    const transport = http(NETWORK_CONFIG.rpcUrl);
    const pub = createPublicClient({ chain, transport });
    const wallet = createWalletClient({ account, chain, transport });
    const out: Record<string, string> = {};

    if (action === "gas" || action === "onboard") {
      if ((await pub.getBalance({ address: userAddress })) < parseEther("0.05")) {
        const hash = await wallet.sendTransaction({ to: userAddress, value: parseEther("0.25") });
        await pub.waitForTransactionReceipt({ hash }); out.gasTx = hash;
      }
    }
    if (action === "faucet" || action === "onboard") {
      const bal = (await pub.readContract({ address: CONTRACT_ADDRESSES.mockUSDC as `0x${string}`, abi: MOCK_USDC_ABI, functionName: "balanceOf", args: [userAddress] })) as bigint;
      if (action === "faucet" || bal < BigInt(1_000_000)) {
        const hash = await wallet.writeContract({ address: CONTRACT_ADDRESSES.mockUSDC as `0x${string}`, abi: MOCK_USDC_ABI, functionName: "faucetTo", args: [userAddress] });
        await pub.waitForTransactionReceipt({ hash }); out.usdcTx = hash;
      }
    }
    return NextResponse.json({ success: true, ...out });
  } catch (e: any) {
    console.error("[relayer]", e);
    return NextResponse.json({ error: e?.shortMessage || "Relayer operation failed" }, { status: 500 });
  }
}
