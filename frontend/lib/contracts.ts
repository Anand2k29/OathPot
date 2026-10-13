import { parseAbi } from "viem";

type Hex = `0x${string}`;
const addr = (v: string | undefined, fallback: string) => ((v && v.startsWith("0x") && v.length === 42 ? v : fallback) as Hex);

export const NETWORK_CONFIG = {
  chainId: 10143,
  chainName: "Monad Testnet",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://testnet-rpc.monad.xyz",
  explorerUrl: process.env.NEXT_PUBLIC_EXPLORER_URL || "https://testnet.monadscan.com",
  nativeCurrency: { name: "Monad", symbol: "MON", decimals: 18 },
} as const;

// Override these in Vercel → Settings → Environment Variables after you deploy to Monad.
// (Fallbacks are the Hardhat-local deployment addresses and will NOT exist on testnet.)
export const CONTRACT_ADDRESSES = {
  mockUSDC: addr(process.env.NEXT_PUBLIC_MOCK_USDC, "0x5FbDB2315678afecb367f032d93F642f64180aa3"),
  potFactory: addr(process.env.NEXT_PUBLIC_POT_FACTORY, "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"),
  demoPot: addr(process.env.NEXT_PUBLIC_DEMO_POT, "0xCafac3dD18aC6c6e92c921884f9E4176737C052c"),
};
export const MARKET_ADDRESS: Hex | undefined = process.env.NEXT_PUBLIC_MARKET_ADDRESS?.startsWith("0x")
  ? (process.env.NEXT_PUBLIC_MARKET_ADDRESS as Hex) : undefined;

export const MOCK_USDC_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function faucet()",
  "function faucetTo(address to)",
]);

export const POT_FACTORY_ABI = parseAbi([
  "function createPot((string title, string goalType, uint256 stakeAmount, uint256 joinDeadline, uint256 endDate, uint256 requiredCheckIns, address charityAddress, bool isDemo) params) returns (address potAddress)",
  "function getAllPots() view returns (address[])",
  "function getUserPots(address user) view returns (address[])",
]);

export const POT_ABI = parseAbi([
  "function getPotSummary() view returns (string _title, string _goalType, uint256 _stakeAmount, uint256 _joinDeadline, uint256 _endDate, uint256 _requiredCheckIns, address _charityAddress, uint256 _memberCount, uint256 _totalStaked, bool _isSettled, uint256 _checkInCount)",
  "function getMembers() view returns (address[])",
  "function getAllCheckIns() view returns ((uint256 id, address member, bytes32 proofHash, string note, uint256 timestamp, uint256 approvals, uint256 rejections, bool isVerified)[])",
  "function isMember(address) view returns (bool)",
  "function isWinner(address) view returns (bool)",
  "function payoutPerWinner() view returns (uint256)",
  "function hasVoted(uint256, address) view returns (bool)",
  "function join()",
  "function submitCheckIn(bytes32 proofHash, string note) returns (uint256)",
  "function verifyCheckIn(uint256 checkInId, bool approve)",
  "function settle()",
]);

export const DEMO_POT_ABI = parseAbi([
  "function timeOffset() view returns (uint256)",
  "function fastForwardToEnd()",
]);

export const MARKET_ABI = parseAbi([
  "function bet(address pot, address member, bool yes, uint256 amount)",
  "function claim(address pot, address member) returns (uint256)",
  "function getMarket(address pot, address member, address user) view returns (uint256 yesPool, uint256 noPool, uint256 userYes, uint256 userNo, bool claimed)",
]);
