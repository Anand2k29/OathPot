// npx hardhat run scripts/deploy.js --network monadTestnet
// Deploys MockUSDC, PotFactory, a demo pot and CommitmentMarket, then prints the env vars for Vercel.
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance :", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "MON\n");

  const usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  console.log("MockUSDC        :", usdcAddr);

  const factory = await (await ethers.getContractFactory("PotFactory")).deploy(usdcAddr);
  await factory.waitForDeployment();
  const factoryAddr = await factory.getAddress();
  console.log("PotFactory      :", factoryAddr);

  const market = await (await ethers.getContractFactory("CommitmentMarket")).deploy(usdcAddr);
  await market.waitForDeployment();
  const marketAddr = await market.getAddress();
  console.log("CommitmentMarket:", marketAddr);

  const now = (await ethers.provider.getBlock("latest")).timestamp;
  const tx = await factory.createPot({
    title: "Judge Demo Pot", goalType: "Gym", stakeAmount: 5_000_000n,
    joinDeadline: now + 14 * 86400, endDate: now + 30 * 86400, requiredCheckIns: 2,
    charityAddress: "0x000000000000000000000000000000000000dEaD", isDemo: true,
  });
  await tx.wait();
  const pots = await factory.getAllPots();
  const demoPot = pots[pots.length - 1];
  console.log("Demo pot        :", demoPot);

  console.log("\n===== Copy into frontend/.env.local AND Vercel =====");
  console.log(`NEXT_PUBLIC_MOCK_USDC=${usdcAddr}`);
  console.log(`NEXT_PUBLIC_POT_FACTORY=${factoryAddr}`);
  console.log(`NEXT_PUBLIC_DEMO_POT=${demoPot}`);
  console.log(`NEXT_PUBLIC_MARKET_ADDRESS=${marketAddr}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
