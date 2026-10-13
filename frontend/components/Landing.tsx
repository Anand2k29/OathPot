"use client";
import React, { useEffect, useRef, useState } from "react";
import { Tilt, Reveal } from "./Fx";
import { TEAM } from "@/lib/team";

const APP = { href: "/dashboard", target: "_blank", rel: "noopener" } as const;
const Eyebrow = ({ n, t }: { n: string; t: string }) => <div className="mono font-bold text-sm mb-4 flex items-center gap-2"><span className="tag c-ink">{n}</span>{t}</div>;
const H2 = ({ children }: { children: React.ReactNode }) => <h2 className="h-display text-4xl sm:text-6xl">{children}</h2>;

/* ---------- Hero ---------- */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <section className="sec wrap grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center !pt-12" onMouseMove={(e) => { if (ref.current) ref.current.style.transform = `rotateY(${(e.clientX / window.innerWidth - 0.5) * 30}deg) rotateX(${-(e.clientY / window.innerHeight - 0.5) * 20}deg)`; }}>
      <div>
        <div className="flex flex-wrap gap-2 pop"><span className="tag c-lime"><span className="live-dot inline-block mr-1 align-middle" />MVP LIVE · MONAD TESTNET</span><span className="tag c-cyan">Onchain Finance & Trading</span></div>
        <h1 className="h-display text-6xl sm:text-7xl xl:text-8xl mt-5">Trade on <span className="bg-[var(--pink)] px-2 border-4 border-black inline-block -rotate-2">human</span> follow-through.</h1>
        <p className="text-xl mt-6 max-w-xl font-medium">Oathpot turns personal commitments into a <b>financial primitive</b>: friends stake on a goal, peers verify it, and anyone can <b>trade live odds</b> on whether it gets done. Settled in under a second on Monad.</p>
        <div className="flex flex-wrap gap-4 mt-8">
          <a {...APP} className="nb-btn text-lg c-pink px-8 py-4">Try the live MVP ↗</a>
          <a href="#mvp" className="nb-btn text-lg c-paper px-8 py-4">60-second demo path ↓</a>
        </div>
        <div className="flex gap-6 mt-8 font-bold text-sm flex-wrap"><span>✅ No wallet install</span><span>✅ Gas sponsored</span><span>✅ Trustless settlement</span></div>
      </div>
      <div className="scene h-[420px] grid place-items-center relative">
        <div ref={ref} style={{ transformStyle: "preserve-3d", transition: "transform .2s" }}>
          <div className="cube"><div className="face f1">💪</div><div className="face f2">📈</div><div className="face f3">🥗</div><div className="face f4">🧘</div><div className="face f5">🍯</div><div className="face f6">🏆</div></div>
        </div>
        <div className="coin absolute top-4 left-2 float">$</div>
        <div className="coin absolute bottom-10 right-4 float d2" style={{ background: "var(--pink)" }}>$</div>
        <div className="nb-sm c-lime px-3 py-2 font-bold absolute bottom-0 left-0 -rotate-6 float d2">Priya YES 71% ▲</div>
        <div className="nb-sm c-yellow px-3 py-2 font-bold absolute top-0 right-6 rotate-6 float">0.8s finality ⚡</div>
      </div>
    </section>
  );
}

/* ---------- Product mock ---------- */
function PhoneMock() {
  return (
    <Tilt max={12}><div className="nb c-paper p-4 w-[300px] mx-auto" style={{ borderRadius: 28 }}>
      <div className="flex justify-between items-center"><b>🍯 Gym Warriors</b><span className="tag c-lime">ACTIVE</span></div>
      <div className="grid grid-cols-3 gap-2 my-3 text-center text-xs font-bold"><div className="nb-sm p-2">$5<br />stake</div><div className="nb-sm p-2 c-yellow">$20<br />pot</div><div className="nb-sm p-2">⏱ 3d</div></div>
      {[["You", 75], ["Priya", 100], ["Alex", 25]].map(([n, p]) => (<div key={n as string} className="mb-2"><div className="flex justify-between text-xs font-bold"><span>{n}</span><span>{p}%</span></div><div className="bar !h-3"><i style={{ width: `${p}%` }} /></div></div>))}
      <div className="nb-sm c-ink p-3 mt-3"><div className="text-xs font-bold text-[var(--yellow)]">📈 MARKET · Alex hits goal?</div>
        <div className="odds my-2"><i style={{ width: "31%", background: "var(--lime)" }} /><i style={{ width: "69%", background: "var(--pink)" }} /></div>
        <div className="flex justify-between text-xs font-bold"><span>YES 31%</span><span>NO 69%</span></div></div>
    </div></Tilt>
  );
}

/* ---------- MVP highlight ---------- */
function MVP() {
  const done = ["Instant embedded accounts (no wallet install)", "Gas-sponsored transactions via relayer", "Create / join pots with on-chain escrow", "Friend-majority check-in verification", "Trustless settlement & charity fallback", "Commitment Markets with live odds & claims", "Live leaderboard & activity feed from chain data"];
  const path = ["Open the app → account + gas + test USDC are auto-created", "Start a pot (tick “Demo pot”) → you’re the creator", "Account menu → “Add test friend”, switch to them & join", "Check in, then switch accounts to approve", "Open Markets as a non-member and back YES/NO", "Fast-forward → Settle → Claim winnings"];
  return (
    <section id="mvp" className="sec stripe border-y-4 border-black">
      <div className="wrap grid lg:grid-cols-[1fr_340px] gap-10 items-center">
        <Reveal>
          <Eyebrow n="THE MVP" t="Everything below works end-to-end, on-chain, today." />
          <H2>Not a mockup. <span className="bg-white px-2 border-4 border-black inline-block rotate-1">A working market.</span></H2>
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <div className="nb p-5"><h3 className="font-bold text-xl mb-3">✅ Shipped</h3><ul className="space-y-2 font-medium text-sm">{done.map((d) => <li key={d}>✔ {d}</li>)}</ul></div>
            <div className="nb p-5 c-cyan"><h3 className="font-bold text-xl mb-3">🧪 Judge path · 60s</h3><ol className="space-y-2 font-medium text-sm list-decimal pl-5">{path.map((d) => <li key={d}>{d}</li>)}</ol></div>
          </div>
          <div className="flex flex-wrap gap-4 mt-8"><a {...APP} className="nb-btn text-lg c-pink px-8 py-4">Launch MVP ↗</a><a href="/create" target="_blank" rel="noopener" className="nb-btn text-lg c-paper px-8 py-4">Start a pot ↗</a></div>
        </Reveal>
        <Reveal delay={150}><PhoneMock /></Reveal>
      </div>
    </section>
  );
}

/* ---------- Interactive: Market simulator ---------- */
function SimMarket() {
  const [yes, setYes] = useState(40), [no, setNo] = useState(60), [log, setLog] = useState<string[]>(["Market opened · Priya hits goal?"]);
  const p = Math.round((yes / (yes + no)) * 100);
  const add = (side: "y" | "n", amt: number, msg: string) => { side === "y" ? setYes((v) => v + amt) : setNo((v) => v + amt); setLog((l) => [msg, ...l].slice(0, 5)); };
  return (
    <div className="nb p-6 c-paper grid md:grid-cols-2 gap-6">
      <div>
        <div className="flex justify-between items-center"><b className="text-xl">Priya hits her gym goal?</b><span className="tag c-yellow">SIMULATION</span></div>
        <div className="h-display text-7xl my-3 tabular-nums">{p}<span className="text-3xl">% YES</span></div>
        <div className="odds"><i style={{ width: `${p}%`, background: "var(--lime)" }} /><i style={{ width: `${100 - p}%`, background: "var(--pink)" }} /></div>
        <div className="flex justify-between text-sm font-bold mt-2"><span>YES pool ${yes}</span><span>NO pool ${no}</span></div>
        <p className="text-sm font-medium mt-3">$1 on YES pays <b>${((yes + no) / yes).toFixed(2)}</b> · $1 on NO pays <b>${((yes + no) / no).toFixed(2)}</b></p>
      </div>
      <div className="space-y-3">
        <button className="nb-btn w-full c-lime" onClick={() => add("y", 10, "Someone backed YES with $10")}>Back YES · $10</button>
        <button className="nb-btn w-full c-pink" onClick={() => add("n", 10, "Someone faded with NO · $10")}>Fade NO · $10</button>
        <button className="nb-btn w-full c-cyan" onClick={() => add("y", 25, "✅ Friends verified a check-in → smart money piles into YES")}>Friends verify a check-in ✅</button>
        <button className="nb-btn w-full c-paper" onClick={() => add("n", 25, "😴 Priya missed two days → NO gets bid")}>Priya misses 2 days 😴</button>
        <div className="nb-sm bg-white p-3 text-xs font-bold mono h-28 overflow-hidden space-y-1">{log.map((l, i) => <div key={i + l} className="pop">› {l}</div>)}</div>
      </div>
    </div>
  );
}

/* ---------- Interactive: Payout calculator ---------- */
function Calculator() {
  const [n, setN] = useState(4), [stake, setStake] = useState(5), [k, setK] = useState(3);
  const kk = Math.min(k, n), pool = n * stake, pay = kk ? pool / kk : 0;
  return (
    <div className="nb p-6 c-paper grid md:grid-cols-2 gap-6">
      <div className="space-y-5">
        {([["Friends in the pot", n, setN, 2, 8], ["Stake each ($)", stake, setStake, 2, 20], ["Friends who hit the goal", kk, setK, 0, n]] as any[]).map(([l, v, f, mi, ma]) => (
          <div key={l}><div className="flex justify-between font-bold"><span>{l}</span><span className="tag c-yellow">{v}</span></div><input type="range" min={mi} max={ma} value={v} onChange={(e) => f(+e.target.value)} className="w-full accent-black" /></div>))}
      </div>
      <div className="nb-sm c-ink p-5 flex flex-col justify-center text-center">
        <div className="text-sm font-bold text-[var(--yellow)]">TOTAL POT ${pool}</div>
        {kk ? (<><div className="h-display text-6xl text-[var(--lime)] my-2">${pay.toFixed(2)}</div><div className="font-bold">back per winner (profit +${(pay - stake).toFixed(2)})</div></>) : <div className="h-display text-4xl text-[var(--pink)] my-4">All $ → Charity 💚</div>}
      </div>
    </div>
  );
}

/* ---------- Interactive: Quiz ---------- */
const QUIZ = [
  ["When you set a goal, you…", ["Start hard, fade fast", "Plan forever, start never", "Slow and steady", "Need someone to join me"]],
  ["Your biggest enemy is…", ["Day 3 motivation crash", "“I'll start Monday”", "Busy weeks", "Being alone in it"]],
  ["Money on the line makes you…", ["Hustle", "Panic then act", "Calmly comply", "Brag to friends"]],
  ["Best accountability is…", ["A public scoreboard", "A hard deadline", "A daily streak", "My group chat"]],
  ["Ideal reward…", ["Beating everyone", "Not losing my money", "Proof I stayed consistent", "Winning with friends"]],
];
const TYPES = [
  { n: "The Sprinter 🏃", d: "Explosive starts. You need short, high-intensity pots.", stake: "$10 · 3 days · 3 check-ins", c: "c-yellow" },
  { n: "The Procrastinator 🛋️", d: "You work best against a hard deadline with real stakes.", stake: "$5 · 7 days · 4 check-ins", c: "c-pink" },
  { n: "The Marathoner 🐢", d: "Consistency is your superpower. Go longer, lower stakes.", stake: "$2 · 14 days · 10 check-ins", c: "c-lime" },
  { n: "The Squad Captain 🎉", d: "You thrive in groups. Recruit 5+ friends and trade the markets.", stake: "$5 · 7 days · 5 check-ins · 6 friends", c: "c-cyan" },
];
function Quiz() {
  const [i, setI] = useState(0), [score, setScore] = useState([0, 0, 0, 0]);
  const done = i >= QUIZ.length; const best = score.indexOf(Math.max(...score)); const t = TYPES[best];
  return (
    <div className="nb p-6 c-paper max-w-3xl mx-auto">
      {!done ? (<>
        <div className="flex justify-between mb-3"><span className="tag c-ink">Q{i + 1}/{QUIZ.length}</span><div className="bar !h-4 w-1/2"><i style={{ width: `${(i / QUIZ.length) * 100}%` }} /></div></div>
        <h3 className="text-2xl font-bold mb-4">{QUIZ[i][0] as string}</h3>
        <div className="grid sm:grid-cols-2 gap-3">{(QUIZ[i][1] as string[]).map((o, k) => <button key={o} className="nb-btn !justify-start text-left c-paper" onClick={() => { setScore((s) => s.map((v, j) => (j === k ? v + 1 : v))); setI(i + 1); }}>{o}</button>)}</div>
      </>) : (
        <div className={`nb-sm p-6 pop ${t.c}`}><div className="text-xs font-bold">YOUR COMMITMENT TYPE</div><div className="h-display text-5xl my-2">{t.n}</div><p className="font-medium">{t.d}</p>
          <p className="mono font-bold mt-3">Suggested pot → {t.stake}</p>
          <div className="flex gap-3 mt-4 flex-wrap"><a href="/create" target="_blank" rel="noopener" className="nb-btn c-paper">Start this pot ↗</a><button className="nb-btn c-paper" onClick={() => { setI(0); setScore([0, 0, 0, 0]); }}>Retake</button></div></div>)}
    </div>
  );
}

/* ---------- Static data ---------- */
const STEPS = [["🎯", "Start a pot", "Pick a goal, stake ($2–$20) and deadline.", "c-yellow"], ["👯", "Friends join", "Everyone stakes the same. Max 8.", "c-pink"], ["📸", "Check in", "Post proof. A majority of OTHER members must approve.", "c-cyan"], ["📈", "Spectators trade", "Anyone outside the pot can back YES or fade NO.", "c-violet"], ["🏆", "Settle & claim", "Contract pays winners. Markets resolve from the same result.", "c-lime"]];
const COMPARE: [string, string, string, string, string][] = [
  ["Friends verify progress", "✅", "Referee / self-report", "Data integrations", "—"],
  ["Stakes escrowed in smart contract", "✅", "Custodial (company holds funds)", "Card-charged pledges", "✅ (for public events)"],
  ["Spectators can trade on your outcome", "✅", "—", "—", "—"],
  ["Live odds as progress changes", "✅", "—", "—", "On public events only"],
  ["No wallet / gas for the user", "✅", "✅", "✅", "Wallet needed"],
  ["Settlement time", "<1s (Monad)", "Manual / batch", "Batch", "Chain dependent"],
];
const WHY_MONAD = [["400ms", "block time — odds update as fast as friends verify"], ["800ms", "finality — no “pending” spinners on bets or claims"], ["~$0", "gas — micro-stakes ($2) only work if fees vanish"]];
const ROADMAP = [["NOW", "c-lime", ["Testnet MVP", "Pots + friend verification", "Commitment Markets", "Leaderboard"]], ["NEXT", "c-yellow", ["Passkey login", "Photo proof storage", "Campus club pilots", "Order-book style markets"]], ["THEN", "c-cyan", ["Real USDC on mainnet", "Audit", "Yield-bearing stakes", "Tokenized-equity stakes"]], ["LATER", "c-pink", ["Creator & coach pots", "Employer wellness pots", "Mobile app", "Fee-sharing market makers"]]];
const FAQ = [["Is this real money?", "Today it runs on Monad Testnet with test USDC. The contracts are token-agnostic, so mainnet means swapping in real USDC after an audit."], ["Who decides if a goal is hit?", "The pot's members. A check-in needs a strict majority of the OTHER members. Spectators cannot influence it."], ["Can people cheat the market?", "Pot members can't bet on their own pot, so nobody can bet NO and quit on purpose. Verification needs a majority of friends, which makes collusion costly."], ["What do you earn?", "Nothing yet — the contract takes no fee. A small market fee is on the roadmap."], ["Who is the first user?", "College friend groups and campus clubs already using group chats for accountability (gym, study, no-spend challenges)."]];

export default function Landing() {
  useEffect(() => { const f = () => document.documentElement.style.setProperty("--sy", String(window.scrollY)); f(); window.addEventListener("scroll", f, { passive: true }); return () => window.removeEventListener("scroll", f); }, []);
  const ticker = ["STAKE", "CHECK IN", "VERIFY", "TRADE ODDS", "SETTLE <1s", "CLAIM", "REPEAT"];
  return (
    <div className="overflow-x-hidden">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-4 lg:px-12 py-3 c-yellow border-b-4 border-black">
        <a href="/" className="text-2xl font-bold">🍯 Oathpot</a>
        <div className="hidden lg:flex gap-6 font-bold text-sm"><a href="#mvp">MVP</a><a href="#how">How it works</a><a href="#markets">Markets</a><a href="#compare">Compare</a><a href="#play">Play</a><a href="#roadmap">Roadmap</a><a href="#team">Team</a></div>
        <a {...APP} className="nb-btn sm c-pink">Launch MVP ↗</a>
      </nav>
      <Hero />
      <div className="marquee"><div>{[...ticker, ...ticker].map((t, i) => <span key={i}>★ {t}</span>)}</div><div aria-hidden>{[...ticker, ...ticker].map((t, i) => <span key={i}>★ {t}</span>)}</div></div>

      <section className="sec wrap text-center max-w-4xl"><Reveal><Eyebrow n="01" t="THE PROBLEM" /><H2>People don't fail from lack of goals. They fail from <span className="bg-[var(--cyan)] px-2 border-4 border-black inline-block rotate-1">zero consequences.</span></H2>
        <div className="grid sm:grid-cols-3 gap-5 mt-10 text-left">{[["🙈", "No skin in the game", "Group-chat promises cost nothing to break."], ["🏦", "Custodial apps", "Commitment apps hold your money and decide disputes."], ["🚫", "Markets ignore people", "Prediction markets price elections — never your friend's gym streak."]].map(([e, t, d]) => <Tilt key={t}><div className="nb p-5 h-full"><div className="text-4xl">{e}</div><b className="text-lg block mt-2">{t}</b><p className="font-medium text-sm">{d}</p></div></Tilt>)}</div></Reveal></section>

      <MVP />

      <section id="how" className="sec wrap"><Reveal><Eyebrow n="02" t="HOW IT WORKS" /><H2>Five steps. Zero crypto jargon.</H2></Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-10">{STEPS.map(([e, t, d, c], i) => <Reveal key={t} delay={i * 100}><Tilt><div className={`nb p-5 h-full ${c}`}><div className="text-4xl float">{e}</div><div className="mono text-xs font-bold mt-2">STEP {i + 1}</div><b className="text-xl block">{t}</b><p className="font-medium text-sm mt-1">{d}</p></div></Tilt></Reveal>)}</div></section>

      <section id="markets" className="sec c-violet border-y-4 border-black"><div className="wrap">
        <Reveal><Eyebrow n="03" t="THE NEW PRIMITIVE · COMMITMENT MARKETS" /><H2>A tradeable claim on <span className="bg-white px-2 border-4 border-black inline-block -rotate-1">human follow-through.</span></H2>
          <p className="text-lg font-medium max-w-3xl mt-4">Every member of a pot gets a YES/NO market: <i>“will they hit their goal?”</i> It's a parimutuel pool, resolved straight from the pot contract. Odds move every time a friend verifies a check-in — so speed isn't a feature, it's the product. Try the simulation:</p></Reveal>
        <div className="mt-10"><Reveal><SimMarket /></Reveal></div>
        <div className="grid md:grid-cols-3 gap-5 mt-8">{WHY_MONAD.map(([a, b]) => <Reveal key={a}><Tilt><div className="nb p-5 c-yellow"><div className="h-display text-5xl">{a}</div><p className="font-bold">{b}</p></div></Tilt></Reveal>)}</div>
      </div></section>

      <section className="sec wrap"><Reveal><Eyebrow n="04" t="DO THE MATHS" /><H2>What winners take home</H2><div className="mt-8"><Calculator /></div></Reveal></section>

      <section id="compare" className="sec c-lime border-y-4 border-black"><div className="wrap"><Reveal><Eyebrow n="05" t="RESEARCH · HOW WE COMPARE" /><H2>The gap nobody fills.</H2>
        <div className="nb mt-8 overflow-x-auto"><table className="w-full text-sm"><thead><tr>{["", "Oathpot", "StickK", "Beeminder", "Prediction markets"].map((h, i) => <th key={h + i} className={`th ${i === 1 ? "!bg-[var(--pink)] !text-black" : ""}`}>{h}</th>)}</tr></thead>
          <tbody>{COMPARE.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={`td ${i === 0 ? "font-bold" : ""} ${i === 1 ? "c-yellow font-bold" : ""}`}>{c}</td>)}</tr>)}</tbody></table></div>
        <p className="text-xs font-bold mt-3">Based on public product descriptions; competitor features may have changed. Habitica & Kickback are covered in the README research table.</p></Reveal></div></section>

      <section id="play" className="sec wrap"><Reveal><Eyebrow n="06" t="PLAY" /><H2>What's your commitment type?</H2><p className="font-medium mt-2 mb-8">5 questions. We'll suggest your ideal pot.</p><Quiz /></Reveal></section>

      <section id="roadmap" className="sec c-cyan border-y-4 border-black"><div className="wrap"><Reveal><Eyebrow n="07" t="TRACTION & PATH FORWARD" /><H2>Where this goes</H2></Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">{ROADMAP.map(([t, c, items], i) => <Reveal key={t as string} delay={i * 100}><div className={`nb p-5 h-full ${c}`}><b className="h-display text-4xl">{t as string}</b><ul className="mt-3 space-y-1 font-medium text-sm">{(items as string[]).map((x) => <li key={x}>▸ {x}</li>)}</ul></div></Reveal>)}</div>
        <div className="nb p-5 mt-8 bg-white"><b>First users:</b> student friend groups & campus clubs. <b>Pilot target:</b> 5 groups / 40 users / 200 test trades before mainnet. <b>Liquidity plan:</b> seed markets from a small treasury and onboard 2–3 market makers once fees exist.</div></div></section>

      <section id="team" className="sec wrap"><Reveal><Eyebrow n="08" t="TEAM" /><H2>Builders</H2></Reveal>
        <div className="grid sm:grid-cols-3 gap-5 mt-10">{TEAM.map((m, i) => <Reveal key={m.name} delay={i * 100}><Tilt><a href={m.link} target="_blank" rel="noopener" className="nb p-6 block text-center no-underline text-inherit"><div className="text-6xl float">{m.emoji}</div><b className="text-xl block mt-2">{m.name}</b><span className="tag mt-2">{m.role}</span></a></Tilt></Reveal>)}</div></section>

      <section id="faq" className="sec wrap max-w-3xl"><Reveal><Eyebrow n="09" t="FAQ" /><H2>Questions</H2></Reveal>
        <div className="space-y-4 mt-8">{FAQ.map(([q, a]) => <Reveal key={q}><details className="nb p-4"><summary>➕ {q}</summary><p className="mt-3 font-medium">{a}</p></details></Reveal>)}</div></section>

      <section className="sec c-pink border-t-4 border-black text-center"><Reveal><H2>Put your money where your streak is.</H2><a {...APP} className="nb-btn text-2xl px-10 py-5 mt-8 c-yellow">Launch the MVP ↗</a></Reveal></section>
      <footer className="c-ink p-6 text-center font-bold text-sm">🍯 Oathpot · Built on Monad · Testnet — test funds only, nothing here is financial advice.</footer>
    </div>
  );
}
