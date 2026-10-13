const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const U = (n) => BigInt(Math.round(n * 1e6));

describe("CommitmentMarket", () => {
  let token, pot, market, alice, bob, carol, dave, rahul, priya;
  beforeEach(async () => {
    [alice, bob, carol, dave, rahul, priya] = await ethers.getSigners();
    token = await (await ethers.getContractFactory("TestToken")).deploy();
    const end = (await time.latest()) + 7 * 86400;
    pot = await (await ethers.getContractFactory("MockPot")).deploy(end);
    market = await (await ethers.getContractFactory("CommitmentMarket")).deploy(await token.getAddress());
    await pot.setMember(rahul.address, true); await pot.setMember(priya.address, true);
    for (const s of [alice, bob, carol, dave, rahul]) {
      await token.mint(s.address, U(100));
      await token.connect(s).approve(await market.getAddress(), U(100));
    }
  });
  const P = () => pot.getAddress();

  it("tracks pools and positions", async () => {
    await market.connect(alice).bet(await P(), rahul.address, true, U(10));
    await market.connect(bob).bet(await P(), rahul.address, false, U(5));
    const m = await market.getMarket(await P(), rahul.address, alice.address);
    expect(m[0]).to.equal(U(10)); expect(m[1]).to.equal(U(5)); expect(m[2]).to.equal(U(10)); expect(m[3]).to.equal(0n);
  });

  it("blocks insiders, non-members, dust bets and late bets", async () => {
    await expect(market.connect(rahul).bet(await P(), priya.address, false, U(5))).to.be.revertedWith("Members cannot bet");
    await expect(market.connect(alice).bet(await P(), bob.address, true, U(5))).to.be.revertedWith("Not a pot member");
    await expect(market.connect(alice).bet(await P(), rahul.address, true, 1n)).to.be.revertedWith("Bet too small");
    await time.increase(8 * 86400);
    await expect(market.connect(alice).bet(await P(), rahul.address, true, U(5))).to.be.revertedWith("Market closed");
  });

  it("pays winners pro-rata and rejects losers", async () => {
    await market.connect(alice).bet(await P(), rahul.address, true, U(10));
    await market.connect(bob).bet(await P(), rahul.address, true, U(30));
    await market.connect(carol).bet(await P(), rahul.address, false, U(20));
    await expect(market.connect(alice).claim(await P(), rahul.address)).to.be.revertedWith("Not settled");
    await pot.settle([rahul.address]);
    const before = await token.balanceOf(alice.address);
    await market.connect(alice).claim(await P(), rahul.address);
    expect((await token.balanceOf(alice.address)) - before).to.equal(U(15)); // 10/40 * 60
    await market.connect(bob).claim(await P(), rahul.address);
    await expect(market.connect(carol).claim(await P(), rahul.address)).to.be.revertedWith("Position lost");
    await expect(market.connect(alice).claim(await P(), rahul.address)).to.be.revertedWith("Already claimed");
    expect(await token.balanceOf(await market.getAddress())).to.equal(0n);
  });

  it("NO side wins when member fails", async () => {
    await market.connect(alice).bet(await P(), rahul.address, true, U(10));
    await market.connect(carol).bet(await P(), rahul.address, false, U(5));
    await pot.settle([]);
    await expect(market.connect(alice).claim(await P(), rahul.address)).to.be.revertedWith("Position lost");
    const b = await token.balanceOf(carol.address);
    await market.connect(carol).claim(await P(), rahul.address);
    expect((await token.balanceOf(carol.address)) - b).to.equal(U(15));
  });

  it("refunds everyone if nobody backed the winning side", async () => {
    await market.connect(alice).bet(await P(), rahul.address, true, U(10));
    await market.connect(bob).bet(await P(), rahul.address, true, U(2));
    await pot.settle([]); // outcome NO, noPool == 0
    const b = await token.balanceOf(alice.address);
    await market.connect(alice).claim(await P(), rahul.address);
    expect((await token.balanceOf(alice.address)) - b).to.equal(U(10));
  });

  it("never pays out more than the pool (rounding)", async () => {
    await market.connect(alice).bet(await P(), rahul.address, true, 333_333n);
    await market.connect(bob).bet(await P(), rahul.address, true, 333_334n);
    await market.connect(carol).bet(await P(), rahul.address, false, 777_777n);
    await pot.settle([rahul.address]);
    await market.connect(alice).claim(await P(), rahul.address);
    await market.connect(bob).claim(await P(), rahul.address);
    expect(await token.balanceOf(await market.getAddress())).to.be.lte(2n);
  });
});
