# contracts/

| File | Purpose |
|---|---|
| `contracts/MockUSDC.sol` | Free 6-decimals test token with `faucet()` / `faucetTo()` (testnet only) |
| `contracts/Pot.sol` | Group pot: stake escrow, daily check-ins, majority-of-others verification, settlement, charity fallback |
| `contracts/DemoPot.sol` | Pot + time machine (`fastForwardToEnd`) for demos |
| `contracts/PotFactory.sol` | Creates pots, lists them per user (creator **and** joiners) |
| `contracts/CommitmentMarket.sol` | Parimutuel YES/NO market per (pot, member), resolved from `Pot.isWinner()` |
| `test/` | 14 tests (Pot rules, settlement paths, market, pot↔market integration) |
| `scripts/deploy.js` | Deploys everything and prints the 4 env vars for the frontend/Vercel |

```bash
npm install
cp .env.example .env     # add DEPLOYER_KEY=0x...
npx hardhat test         # 14 passing
npx hardhat run scripts/deploy.js --network monadTestnet
```
Not audited — testnet only.
