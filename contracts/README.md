# contracts/ — Commitment Market add-on

Drop these folders into your existing Hardhat project (the one that already has `Pot.sol`, `PotFactory.sol`, `MockUSDC.sol`):

- `contracts/CommitmentMarket.sol` — parimutuel YES/NO market resolved from `Pot.isWinner()`.
- `contracts/mocks/TestMocks.sol` — `TestToken` + `MockPot` used only by tests.
- `test/CommitmentMarket.test.js` — 6 tests (needs `@nomicfoundation/hardhat-toolbox`, `@openzeppelin/contracts@5`).
- `scripts/deploy-market.js` — `TOKEN=<MockUSDC> npx hardhat run scripts/deploy-market.js --network monadTestnet`

Required interface on the pot: `isSettled()`, `isWinner(address)`, `isMember(address)`, `endDate()` (all already exist on your `Pot`).
