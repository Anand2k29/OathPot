const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const U = (n) => BigInt(n) * 1000000n;
const DEAD = "0x000000000000000000000000000000000000dEaD";
const H = ethers.id("proof");

describe("Pot + PotFactory", () => {
  let usdc, factory, a, b, c, d, now;
  async function newPot(demo = false, req = 2, days = 7) {
    now = await time.latest();
    const tx = await factory.connect(a).createPot({ title: "Gym", goalType: "Gym", stakeAmount: U(5), joinDeadline: now + 2 * 86400, endDate: now + days * 86400, requiredCheckIns: req, charityAddress: DEAD, isDemo: demo });
    await tx.wait();
    const pots = await factory.getAllPots();
    return ethers.getContractAt(demo ? "DemoPot" : "Pot", pots[pots.length - 1]);
  }
  async function join(pot, ...signers) { for (const s of signers) { await usdc.faucetTo(s.address); await usdc.connect(s).approve(await pot.getAddress(), U(5)); await pot.connect(s).join(); } }
  const checkIn = async (pot, s) => { await pot.connect(s).submitCheckIn(H, "did it"); return (await pot.getCheckInsCount()) - 1n; };

  beforeEach(async () => {
    [a, b, c, d] = await ethers.getSigners();
    usdc = await (await ethers.getContractFactory("MockUSDC")).deploy();
    factory = await (await ethers.getContractFactory("PotFactory")).deploy(await usdc.getAddress());
  });

  it("creates pots, validates params and lists them for creator + joiners", async () => {
    const pot = await newPot();
    await expect(factory.createPot({ title: "", goalType: "x", stakeAmount: U(1), joinDeadline: now + 100, endDate: now + 200, requiredCheckIns: 1, charityAddress: DEAD, isDemo: false })).to.be.revertedWith("Bad title");
    await join(pot, b);
    expect(await factory.getUserPots(a.address)).to.include(await pot.getAddress());
    expect(await factory.getUserPots(b.address)).to.include(await pot.getAddress());
    const s = await pot.getPotSummary();
    expect(s._memberCount).to.equal(1n); expect(s._totalStaked).to.equal(U(5));
  });

  it("join rules: once, deadline, max 8", async () => {
    const pot = await newPot();
    await join(pot, b);
    await expect(pot.connect(b).join()).to.be.revertedWith("Already joined");
    const signers = await ethers.getSigners();
    for (const s of signers.slice(2, 9)) await join(pot, s);
    await usdc.faucetTo(signers[10].address); await usdc.connect(signers[10]).approve(await pot.getAddress(), U(5));
    await expect(pot.connect(signers[10]).join()).to.be.revertedWith("Pot full");
    const p2 = await newPot();
    await time.increase(3 * 86400);
    await expect(p2.connect(b).join()).to.be.revertedWith("Join closed");
  });

  it("check-in: members only, once per day", async () => {
    const pot = await newPot(); await join(pot, a, b);
    await expect(pot.connect(c).submitCheckIn(H, "x")).to.be.revertedWith("Not a member");
    await checkIn(pot, a);
    await expect(pot.connect(a).submitCheckIn(H, "again")).to.be.revertedWith("Already checked in today");
    await time.increase(86400); await checkIn(pot, a);
  });

  it("voting: strict majority of OTHER members, no self / double votes", async () => {
    const pot = await newPot(); await join(pot, a, b, c, d); // others = 3 -> need 2
    expect(await pot.getRequiredApprovals()).to.equal(2n);
    const id = await checkIn(pot, a);
    await expect(pot.connect(a).verifyCheckIn(id, true)).to.be.revertedWith("Cannot vote on own check-in");
    await pot.connect(b).verifyCheckIn(id, true);
    await expect(pot.connect(b).verifyCheckIn(id, true)).to.be.revertedWith("Already voted");
    expect((await pot.getCheckIn(id)).isVerified).to.equal(false);
    await pot.connect(c).verifyCheckIn(id, true);
    expect((await pot.getCheckIn(id)).isVerified).to.equal(true);
    expect(await pot.verifiedCheckInCount(a.address)).to.equal(1n);
    await expect(pot.connect(d).verifyCheckIn(id, true)).to.not.be.reverted; // extra approval harmless
    expect(await pot.verifiedCheckInCount(a.address)).to.equal(1n);
  });

  it("mixed outcome: winners split forfeited stakes", async () => {
    const pot = await newPot(false, 1); await join(pot, a, b, c);
    const id = await checkIn(pot, a);
    await pot.connect(b).verifyCheckIn(id, true); await pot.connect(c).verifyCheckIn(id, true);
    await expect(pot.settle()).to.be.revertedWith("Not ended yet");
    await time.increase(8 * 86400);
    const before = await usdc.balanceOf(a.address);
    await pot.settle();
    expect((await usdc.balanceOf(a.address)) - before).to.equal(U(15)); // sole winner takes 3 x $5
    expect(await pot.isWinner(a.address)).to.equal(true); expect(await pot.isWinner(b.address)).to.equal(false);
    await expect(pot.settle()).to.be.revertedWith("Already settled");
  });

  it("all fail -> charity; all succeed -> stakes back; dust -> charity", async () => {
    const p1 = await newPot(false, 1); await join(p1, a, b);
    await time.increase(8 * 86400); await p1.settle();
    expect(await usdc.balanceOf(DEAD)).to.equal(U(10));

    const p2 = await newPot(false, 1); await join(p2, a, b);
    const i1 = await checkIn(p2, a), i2 = await checkIn(p2, b);
    await p2.connect(b).verifyCheckIn(i1, true); await p2.connect(a).verifyCheckIn(i2, true);
    await time.increase(8 * 86400);
    const bA = await usdc.balanceOf(a.address); await p2.settle();
    expect((await usdc.balanceOf(a.address)) - bA).to.equal(U(5));
    expect(await usdc.balanceOf(await p2.getAddress())).to.equal(0n);

    const p3 = await newPot(false, 1); await join(p3, a, b, c);
    const j = await checkIn(p3, a); await p3.connect(b).verifyCheckIn(j, true); await p3.connect(c).verifyCheckIn(j, true);
    const k = await checkIn(p3, b); await p3.connect(a).verifyCheckIn(k, true); await p3.connect(c).verifyCheckIn(k, true);
    const l = await checkIn(p3, c); await p3.connect(a).verifyCheckIn(l, true); await p3.connect(b).verifyCheckIn(l, true);
    await time.increase(8 * 86400); await p3.settle();
    expect(await usdc.balanceOf(await p3.getAddress())).to.equal(0n);
  });

  it("demo pot fast-forwards to the end and can settle immediately", async () => {
    const pot = await newPot(true, 1); await join(pot, a, b);
    const id = await checkIn(pot, a); await pot.connect(b).verifyCheckIn(id, true);
    await expect(pot.settle()).to.be.revertedWith("Not ended yet");
    await pot.fastForwardToEnd();
    await pot.settle();
    expect(await pot.isWinner(a.address)).to.equal(true);
    expect(await pot.timeOffset()).to.be.gt(0n);
  });

  it("works end-to-end with CommitmentMarket", async () => {
    const mk = await (await ethers.getContractFactory("CommitmentMarket")).deploy(await usdc.getAddress());
    const pot = await newPot(true, 1); await join(pot, a, b);
    await usdc.faucetTo(c.address); await usdc.connect(c).approve(await mk.getAddress(), U(10));
    await mk.connect(c).bet(await pot.getAddress(), a.address, true, U(10));
    await expect(mk.connect(a).bet(await pot.getAddress(), b.address, false, U(1))).to.be.revertedWith("Members cannot bet");
    const id = await checkIn(pot, a); await pot.connect(b).verifyCheckIn(id, true);
    await pot.fastForwardToEnd(); await pot.settle();
    const before = await usdc.balanceOf(c.address);
    await mk.connect(c).claim(await pot.getAddress(), a.address);
    expect((await usdc.balanceOf(c.address)) - before).to.equal(U(10)); // refund: nobody on NO
  });
});
