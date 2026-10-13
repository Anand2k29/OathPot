// Usage: TOKEN=0x<MockUSDC address> npx hardhat run scripts/deploy-market.js --network monadTestnet
const { ethers } = require("hardhat");
async function main() {
  const token = process.env.TOKEN;
  if (!token) throw new Error("Set TOKEN=<stake token address> (your MockUSDC)");
  const m = await (await ethers.getContractFactory("CommitmentMarket")).deploy(token);
  await m.waitForDeployment();
  console.log("CommitmentMarket:", await m.getAddress());
  console.log("\nAdd to Vercel / frontend/.env.local:\nNEXT_PUBLIC_MARKET_ADDRESS=" + (await m.getAddress()));
}
main().catch((e) => { console.error(e); process.exit(1); });
