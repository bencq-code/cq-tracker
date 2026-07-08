import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { db, supabase } from "./db.js";

// Recharts is the largest vendor chunk (~110KB gz) — load it lazily so first
// paint isn't blocked on it. Charts render a shimmer skeleton until it arrives.
let ComposedChart, AreaChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend;
let __rcLoaded = false, __rcPromise = null;
const loadRecharts = () => __rcPromise || (__rcPromise = import("recharts").then(m => {
  ({ ComposedChart, AreaChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } = m);
  __rcLoaded = true;
}));
const useRecharts = () => {
  const [ready, setReady] = useState(__rcLoaded);
  useEffect(() => { if (!ready) loadRecharts().then(() => setReady(true)); }, [ready]);
  return ready;
};

const Portal = ({children}) => ReactDOM.createPortal(children, document.body);

// ─────────────────────────────────────────────────────────
//  CONSTANTS & HELPERS
// ─────────────────────────────────────────────────────────

// Storage keys for seed flags
const NEXO_SEEDED_KEY    = "cq_nexo_seeded_v3";
const NEXO_CIT_SEEDED_KEY = "cq_nexo_cit_seeded_v1";

const NEXO_BOUNTIES = [
  {date:"2025-11-20",author:"Maartunn",      title:"Crypto Lending in 4 Charts 📊🧵",                                                                                 cqLink:"https://cryptoquant.com/insights/quicktake/692026ce9d2da9498f459c00-Crypto-Lending-in-4-Charts",                                                                                                                      authorTwitterLink:"https://x.com/JA_Maartun/status/1991791458224107936?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/1991844490156671351?s=20"},
  {date:"2025-12-23",author:"Maartunn",      title:"$NEXO Token Activity Increases: 70,100 Transfers and $297M in Volume for 2025 📈",                                 cqLink:"https://cryptoquant.com/insights/quicktake/694ac6436f89e81772a343ef-NEXO-Token-Activity-Increases-70100-Transfers-and-297M-in-Volume-for-2025",                                                                     authorTwitterLink:"https://x.com/JA_Maartun/status/2003511013862441147?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2003507932554756373?s=20"},
  {date:"2026-01-07",author:"Maartunn",      title:"Nexo Loan Book",                                                                                                   cqLink:"https://cryptoquant.com/quicktake/695e6fba4c7a21121994f601-Nexo-loan-book-hits-203B-in-Q3-2025-up-692-YoY-from-12B",                                                                                                        authorTwitterLink:"https://x.com/JA_Maartun/status/2009008165782970507?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2008914408609644795?s=20"},
  {date:"2026-01-08",author:"Maartunn",      title:"Trustpilot Scores Reveal Where Crypto Lending Users Feel Safest 🏦⭐",                                              cqLink:"https://cryptoquant.com/insights/quicktake/69613e464c7a21121994f99e-Trustpilot-Scores-Reveal-Where-Crypto-Lending-Users-Feel-Safest",                                                                                        authorTwitterLink:"https://x.com/JA_Maartun/status/2009731668886831578?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2009685955608035397?s=20"},
  {date:"2026-01-12",author:"ArabChain",     title:"Spikes in the daily transfer volume of NEXO on the Ethereum network indicate rising demand",                       cqLink:"https://cryptoquant.com/insights/quicktake/6964b6ec0edf4d0492cd52c2-Spikes-in-the-daily-transfer-volume-of-NEXO-on-the-Ethereum-network-indicate-ris",                                                                    authorTwitterLink:"https://x.com/ArabxChain/status/2010636889603371306?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2010694073892446444?s=20"},
  {date:"2026-01-12",author:"oinonen_t",     title:"54% of Nexo Users Prefer Bitcoin as Collateral",                                                                   cqLink:"https://cryptoquant.com/insights/quicktake/6966571d0edf4d0492cd54be-54-of-Nexo-Users-Prefer-Bitcoin-as-Collateral?utm_source=twitter&utm_medium=sns&utm_campaign=quicktake&utm_content=oinonen_t",                      authorTwitterLink:"https://x.com/oinonen_t/status/2011085844761772065",         cqTwitterLink:"https://x.com/cryptoquant_com/status/2011093538428371234?s=20"},
  {date:"2026-01-14",author:"ArabChain",     title:"Rising Collateral Accumulation on Nexo Indicates Early Balance and Accumulation in the Cryptocurrency Market",     cqLink:"https://cryptoquant.com/insights/quicktake/696744dd27fdf72216f6a8a2-Rising-Collateral-Accumulation-on-Nexo-Indicates-Early-Balance-and-Accumulation-?utm_source=twitter&utm_medium=sns&utm_campaign=quicktake&utm_content=arab-chain", authorTwitterLink:"https://x.com/ArabxChain/status/2011370576879755378?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2011358424219722221?s=20"},
  {date:"2026-01-19",author:"Maartunn",      title:"9-Month High in $NEXO Token Transaction Count 📈",                                                                 cqLink:"https://cryptoquant.com/insights/quicktake/696e5714c262194c0f2b52cd-9-Month-High-in-NEXO-Token-Transaction-Count",                                                                                                              authorTwitterLink:"https://x.com/JA_Maartun/status/2013341452919877970?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2013553658735001916?s=20"},
  {date:"2026-01-19",author:"Maartunn",      title:"Nexo Spot Volume Bubble Map shows signs of accumulation 📉📈",                                                      cqLink:"https://cryptoquant.com/insights/quicktake/696df0e1c262194c0f2b521d-Nexo-Spot-Volume-Bubble-Map-shows-signs-of-accumulation",                                                                                                  authorTwitterLink:"https://x.com/JA_Maartun/status/2013173366853652892?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2013210830196580521?s=20"},
  {date:"2026-01-19",author:"DarkFost",      title:"$30B in Stablecoin Inflows on Nexo",                                                                               cqLink:"https://cryptoquant.com/insights/quicktake/696ddc2aa662164c848648f6-30B-in-Stablecoin-Inflows-on-Nexo",                                                                                                                        authorTwitterLink:"https://x.com/Darkfost_Coc/status/2013151440462639506?s=20", cqTwitterLink:"https://x.com/cryptoquant_com/status/2013174453874614587?s=20"},
  {date:"2026-01-23",author:"Maartunn",      title:"Nexo Has the Most Connected Community in Crypto Lending 🔗",                                                        cqLink:"https://cryptoquant.com/insights/quicktake/6973ab72a662164c848651dd-Nexo-Has-the-Most-Connected-Community-in-Crypto-Lending-%F0%9F%94%97",                                                                                  authorTwitterLink:"https://x.com/JA_Maartun/status/2014806103847272527?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2014761718161768471?s=20"},
  {date:"2026-01-27",author:"oinonen_t",     title:"NEXO Whale Activity Increasing in January",                                                                        cqLink:"https://cryptoquant.com/insights/quicktake/6978bc37c262194c0f2b60d4-NEXO-Whale-Activity-Increasing-in-January",                                                                                                              authorTwitterLink:"https://x.com/oinonen_t/status/2016151353408602372",         cqTwitterLink:"https://x.com/cryptoquant_com/status/2016152632339935515?s=20"},
  {date:"2026-01-27",author:"Maartunn",      title:"Bitcoin Share in Nexo Collateral Rebounds to Post-Summer High 🛡️",                                                cqLink:"https://cryptoquant.com/insights/quicktake/6978ee52a662164c848658bf-Bitcoin-Share-in-Nexo-Collateral-Rebounds-to-Post-Summer-High",                                                                                         authorTwitterLink:"https://x.com/JA_Maartun/status/2016292904726299074?s=19",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2016238567559688552?s=20"},
  {date:"2026-02-09",author:"Maartunn",      title:"Bitcoin Is the Backbone of Nexo Credit 🟠",                                                                        cqLink:"https://cryptoquant.com/insights/quicktake/6989f253c876a02133a03854-Bitcoin-Is-the-Backbone-of-Nexo-Credit",                                                                                                                authorTwitterLink:"https://x.com/JA_Maartun/status/2021004444142534678?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2020871607422509367?s=20"},
  {date:"2026-02-11",author:"DarkFost",      title:"Investor behavior evolves as Bitcoin volatility climbs",                                                           cqLink:"https://cryptoquant.com/insights/quicktake/698e4656312550148f4eb62b-Investor-behavior-evolves-as-Bitcoin-volatility-climbs",                                                                                                   authorTwitterLink:"https://x.com/Darkfost_Coc/status/2021314141353304166?s=20", cqTwitterLink:"https://x.com/cryptoquant_com/status/2022367919166853132?s=20"},
  {date:"2026-02-12",author:"ArabChain",     title:"Bitcoin Volatility Drives Rising Trading Activity in Lending Tokens as Liquidity Shifts Toward Yield-Focused Sectors", cqLink:"https://cryptoquant.com/insights/quicktake/698f1acec876a02133a03ff0-Bitcoin-Volatility-Drives-Rising-Trading-Activity-in-Lending-Tokens-as-Liquidity",                                                                   authorTwitterLink:"https://x.com/ArabxChain/status/2022289537498599742?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2022291300184207367?s=20"},
  {date:"2026-02-13",author:"Maartunn",      title:"Stability During a Market Pullback 🎯",                                                                            cqLink:"https://cryptoquant.com/insights/quicktake/698f5625312550148f4eb799-Stability-During-a-Market-Pullback?utm_source=twitter&utm_medium=sns&utm_campaign=quicktake&utm_content=maartunn",                                       authorTwitterLink:"https://x.com/JA_Maartun/status/2022823244085235907?s=20",  cqTwitterLink:"https://x.com/cryptoquant_com/status/2023343258014031964?s=20"},
  {date:"2026-02-12",author:"DarkFost",      title:"Diverging stablecoin trends emerge amid Bitcoin's sharp correction",                                               cqLink:"https://cryptoquant.com/insights/quicktake/698b8e38312550148f4eb239-Diverging-stablecoin-trends-emerge-amid-Bitcoins-sharp-correction?utm_source=twitter&utm_medium=sns&utm_campaign=quicktake&utm_content=darkfost",       authorTwitterLink:"https://x.com/Darkfost_Coc/status/2022062034305564810?s=20", cqTwitterLink:"https://x.com/cryptoquant_com/status/2021314565275865099?s=20"},
  {date:"2026-02-19",author:"oinonen_t",     title:"Cumulative Credit Withdrawals Reach an All-Time High",                                                             cqLink:"https://cryptoquant.com/insights/quicktake/6996ef2063d8c42764425db6-Nexos-Cumulative-Credit-Withdrawals-Reach-an-All-Time-High",                                                                                              authorTwitterLink:"https://x.com/oinonen_t/status/2024134361503637794?s=20",   cqTwitterLink:"https://x.com/cryptoquant_com/status/2024442067800170790?s=20"},
  {date:"2026-02-20",author:"Burak Kesmeci", title:"Nexo Surpasses $2B Milestone",                                                                                    cqLink:"https://cryptoquant.com/insights/quicktake/6998826263d8c42764425fe0-Nexo-Surpasses-2B-Milestone?utm_source=twitter&utm_medium=sns&utm_campaign=quicktake&utm_content=burakkesmeci",                                        authorTwitterLink:"",                                                           cqTwitterLink:"https://x.com/cryptoquant_com/status/2024903052587622615?s=20"},
  {date:"2026-02-24",author:"Burak Kesmeci", title:"NEXO's 52% Repeat Borrower Rate: Tangible Proof of Trust",                                                        cqLink:"https://cryptoquant.com/insights/quicktake/699cb66763d8c42764426651-NEXOs-52-Repeat-Borrower-Rate-Tangible-Proof-of-Trust",                                                                                               authorTwitterLink:"",                                                           cqTwitterLink:"https://x.com/cryptoquant_com/status/2026223826665918643?s=20"},
];

const NEXO_CITATIONS = [
  {date:"2025-12-24",media:"Token Post",           reporter:"Publisher",           author:"Maartunn",      topic:"CeFi",                                         articleLink:"https://www.tokenpost.kr/news/breaking/318186"},
  {date:"2026-01-08",media:"ETH News",             reporter:"Toheeb Kolade",       author:"Maartunn",      topic:"Loan Book",                                    articleLink:"https://www.ethnews.com/nexos-loan-book-jumps-to-2b-as-crypto-investors-choose-borrowing-over-selling/"},
  {date:"2026-01-10",media:"CryptoNews",           reporter:"Publisher",           author:"Maartunn",      topic:"Reviews",                                      articleLink:"https://cryptonews.net/ru/news/market/32255276/"},
  {date:"2026-01-10",media:"Crypto RU",            reporter:"Publisher",           author:"Maartunn",      topic:"Reviews",                                      articleLink:"https://crypto.ru/news/ekspert-cryptoquant-nazval-liderov-doveriya/"},
  {date:"2026-01-12",media:"DeFi Planet",          reporter:"Jewel Buddy",         author:"ArabChain",     topic:"Spikes in the Daily Transfer Volume",          articleLink:"https://defi-planet.com/2026/01/nexo-daily-volume-surges-on-ethereum-network-signalling-rising-market-activity/"},
  {date:"2026-01-12",media:"Binance",              reporter:"Publisher",           author:"ArabChain",     topic:"Rising Collateral Accumulation",               articleLink:"https://www.binance.com/en-AE/square/post/01-14-2026-nexo-152-35067024202634"},
  {date:"2026-01-12",media:"Blockchain Stories",  reporter:"Publisher",           author:"ArabChain",     topic:"Rising Collateral Accumulation",               articleLink:"https://www.blockchainstories.com/2026/01/14/nexo-activiteit-wijst-op-stille-accumulatie-door-grote-spelers/"},
  {date:"2026-01-14",media:"DeFi Planet",          reporter:"Jewel Buddy",         author:"ArabChain",     topic:"Rising Collateral Accumulation",               articleLink:"https://defi-planet.com/2026/01/nexo-platform-data-signals-cautious-engagement-and-reduced-spot-supply/"},
  {date:"2026-01-19",media:"Blockonomi",           reporter:"Brenda Mary",         author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://blockonomi.com/nexo-surpasses-30-billion-in-stablecoin-inflows-as-crypto-lending-demand-surges/"},
  {date:"2026-01-19",media:"Crypto Alert News",   reporter:"Publisher",           author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://coinalertnews.com/news/2026/01/20/nexo-30-billion-stablecoin-inflows-milestone"},
  {date:"2026-01-19",media:"Crypto Economy",      reporter:"C. Monasterio",       author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://crypto-economy.com/nexo-hits-30b-milestone-in-stablecoin-inflows/"},
  {date:"2026-01-19",media:"Cryptonomist",        reporter:"Stefania Stimolo",    author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://en.cryptonomist.ch/2026/01/19/nexo-stablecoin-flows/"},
  {date:"2026-01-19",media:"Live Bitcoin News",   reporter:"Peter Mwenda",        author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://www.livebitcoinnews.com/nexo-achieves-30-billion-in-stablecoin-inflows-milestone/"},
  {date:"2026-01-19",media:"DeFi Planet",          reporter:"Jewel Buddy",         author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://defi-planet.com/2026/01/nexo-sees-30b-in-cumulative-stablecoin-inflows-as-demand-for-crypto-lending-grows/"},
  {date:"2026-01-19",media:"Bitcoin Ethereum News",reporter:"Publisher",          author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://bitcoinethereumnews.com/tech/nexo-stablecoin-flows-top-30b-as-lending-demand-accelerates/"},
  {date:"2026-01-19",media:"Shine Magazine",      reporter:"Publisher",           author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://shine-magazine.com/nexo-stablecoin-inflows/"},
  {date:"2026-01-19",media:"AInvest",             reporter:"Mira Solano",         author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://www.ainvest.com/news/nexo-achieves-30-billion-stablecoin-inflows-milestone-2601/"},
  {date:"2026-01-19",media:"Blockchain Reporter", reporter:"Mushumir Butt",       author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://blockchainreporter.net/nexo-hits-30-billion-in-stablecoin-inflows-signaling-investor-confidence/"},
  {date:"2026-01-19",media:"Cryptonews",          reporter:"Publisher",           author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://cryptonews.net/news/market/32300200/"},
  {date:"2026-01-19",media:"MEXC",                reporter:"Publisher",           author:"DarkFost",      topic:"$30 Billion in Stablecoin Inflows",            articleLink:"https://www.mexc.com/en-NG/news/510799"},
  {date:"2026-01-19",media:"Bitcoin Ethereum News",reporter:"Publisher",          author:"DarkFost",      topic:"Nexo Stablecoin Flows Top $30B",               articleLink:"https://bitcoinethereumnews.com/tech/nexo-stablecoin-flows-top-30b-as-lending-demand-accelerates/"},
  {date:"2026-01-19",media:"MEXC",                reporter:"Publisher",           author:"DarkFost",      topic:"Nexo Stablecoin Flows Top $30B",               articleLink:"https://www.mexc.com/en-NG/news/508771"},
  {date:"2026-01-28",media:"CryptoNewsZ",         reporter:"Sahil Mahadik",       author:"oinonen_t",     topic:"NEXO Breaks $0.95 Barrier",                    articleLink:"https://www.cryptonewsz.com/nexo-0-95-barrier-whale-strengthens-rebound/"},
  {date:"2026-01-28",media:"CryptoNews.Net",      reporter:"Publisher",           author:"oinonen_t",     topic:"NEXO Breaks $0.95 Barrier",                    articleLink:"https://cryptonews.net/news/analytics/32346334/"},
  {date:"2026-01-28",media:"BitGet",              reporter:"Publisher",           author:"oinonen_t",     topic:"NEXO Breaks $0.95 Barrier",                    articleLink:"https://www.bitget.com/news/detail/12560605171986"},
  {date:"2026-01-28",media:"BitGet",              reporter:"Publisher",           author:"ArabChain",     topic:"Rising Collateral Accumulation",               articleLink:"https://www.bitget.com/news/detail/12560605171986"},
  {date:"2026-01-28",media:"Cryptonews",          reporter:"Publisher",           author:"ArabChain",     topic:"Rising Collateral Accumulation",               articleLink:"https://cryptonews.net/news/analytics/32346334/"},
  {date:"2026-02-13",media:"AInvest",             reporter:"Publisher",           author:"ArabChain",     topic:"Bitcoin Volatility Drives Rising Trading Activity", articleLink:"https://www.ainvest.com/news/bitcoin-volatility-breakdown-liquidity-flowing-2602/"},
  {date:"2026-02-13",media:"The Crypto Basic",    reporter:"Elendu Benedict",     author:"ArabChain",     topic:"Bitcoin Volatility Drives Rising Trading Activity", articleLink:"https://thecryptobasic.com/2026/02/13/lending-tokens-nexo-and-aave-shine-as-bitcoin-volatility-shifts-attention-to-yield-bearing-tokens/"},
  {date:"2026-02-13",media:"Phemex",              reporter:"Publisher",           author:"ArabChain",     topic:"Bitcoin Volatility Drives Rising Trading Activity", articleLink:"https://phemex.com/news/article/bitcoin-volatility-shifts-liquidity-to-nexo-and-aave-lending-tokens-60402"},
  {date:"2026-02-13",media:"KuCoin",              reporter:"Publisher",           author:"ArabChain",     topic:"Bitcoin Volatility Drives Rising Trading Activity", articleLink:"https://www.kucoin.com/news/flash/bitcoin-volatility-drives-liquidity-to-lending-tokens-nexo-and-aave"},
  {date:"2026-02-13",media:"Traders Union",       reporter:"Publisher",           author:"ArabChain",     topic:"Bitcoin Volatility Drives Rising Trading Activity", articleLink:"https://tradersunion.com/news/cryptocurrency-news/show/1472865-nexo-jumps-7-19percent-to-usd0-85/"},
  {date:"2026-02-13",media:"Cryptonews",          reporter:"Publisher",           author:"ArabChain",     topic:"Bitcoin Volatility Drives Rising Trading Activity", articleLink:"https://cryptonews.net/news/bitcoin/32431194/"},
  {date:"2026-02-13",media:"0xzx",               reporter:"Publisher",           author:"ArabChain",     topic:"Bitcoin Volatility Drives Rising Trading Activity", articleLink:"https://0xzx.com/2026021323176101613.html"},
  {date:"2026-02-13",media:"Arab Crypto Cap",    reporter:"Publisher",           author:"ArabChain",     topic:"Bitcoin Volatility Drives Rising Trading Activity", articleLink:"https://www.arabcryptocap.io/blog/%D8%A8%D9%8A%D8%AA%D9%83%D9%88%D9%8A%D9%86/%D8%B1%D9%85%D9%88%D8%B2-%D8%A7%D9%84%D8%A5%D9%82%D8%B1%D8%A7%D8%B6-nexo-%D9%88aave-%D8%AA%D8%AA%D8%B5%D8%AF%D8%B1-%D8%A7%D9%84%D9%85%D8%B4%D9%87%D8%AF-%D9%85%D8%B9-%D8%AA%D8%AD%D9%88%D9%84-%D8%AA/"},
  {date:"2026-02-10",media:"CoinEdition",         reporter:"Peter Mwangi",        author:"Maartunn",      topic:"Bitcoin Collateral Dominance",                  articleLink:"https://coinedition.com/bitcoin-collateral-dominance-holds-as-whales-accumulate-during-market-dips/"},
  {date:"2026-02-10",media:"CryptoRank",          reporter:"Publisher",           author:"Maartunn",      topic:"Bitcoin Collateral Dominance",                  articleLink:"https://cryptorank.io/news/feed/38fbf-bitcoin-collateral-dominance-holds-as-whales-accumulate-during-market-dips"},
  {date:"2026-02-10",media:"BitGet",              reporter:"Publisher",           author:"Maartunn",      topic:"Bitcoin Collateral Dominance",                  articleLink:"https://www.bitget.com/asia/news/detail/12560605190870"},
  {date:"2026-02-16",media:"Crypto.News",         reporter:"Andrew Folkler",      author:"Maartunn",      topic:"$863M Nexo loans",                             articleLink:"https://crypto.news/cryptoquant-flags-863m-nexo-loans-as-confidence-holds-in-pullback/"},
  {date:"2026-02-16",media:"Traders Union",       reporter:"Yaroslav Dmytrenko",  author:"Maartunn",      topic:"Nexo lending data signals controlled deleveraging", articleLink:"https://tradersunion.com/news/cryptocurrency-news/show/1490434-nexo-lending-data/"},
  {date:"2026-02-16",media:"TRON Weekly",         reporter:"Mishal Ali",          author:"ArabChain",     topic:"Bitcoin Volatility Drives Rising Trading Activity", articleLink:"https://www.tronweekly.com/bitcoin-accumulation-surges-whales/"},
  {date:"2026-02-16",media:"Bitcoin Ethereum News",reporter:"Publisher",          author:"Maartunn",      topic:"$863M Nexo loans",                             articleLink:"https://bitcoinethereumnews.com/tech/cryptoquant-flags-863m-nexo-loans-as-confidence-holds-in-pullback/"},
  {date:"2026-02-16",media:"BitGet",              reporter:"Publisher",           author:"Maartunn",      topic:"$863M Nexo loans",                             articleLink:"https://www.bitget.com/news/detail/12560605201874"},
  {date:"2026-02-16",media:"AInvest",             reporter:"Publisher",           author:"Maartunn",      topic:"$863M Nexo loans",                             articleLink:"https://www.ainvest.com/news/nexo-863m-credit-flow-stability-signal-bitcoin-stabilization-2602/"},
  {date:"2026-02-16",media:"Tech Edu Byte",       reporter:"Publisher",           author:"Maartunn",      topic:"$863M Nexo loans",                             articleLink:"https://www.techedubyte.com/cryptoquant-flags-863m-nexo-loans-confidence-pullback/"},
  {date:"2026-02-17",media:"Crypto.News",         reporter:"Ann Maria Shibu",     author:"Maartunn",      topic:"$863M Nexo loans",                             articleLink:"https://crypto.news/crypto-lender-nexo-returns-to-us/"},
  {date:"2026-02-17",media:"The Bit Gazette",     reporter:"Joseph Samuel",       author:"Maartunn",      topic:"$863M Nexo loans",                             articleLink:"https://thebitgazette.com/crypto-lending-resilience-as-86m-nexo-loans/"},
  {date:"2026-02-19",media:"DeFi Planet",          reporter:"Jewel Buddy",         author:"oinonen_t",     topic:"Credit Withdrawals",                           articleLink:"https://defi-planet.com/2026/02/nexo-credit-withdrawals-hit-record-as-bitcoin-market-stabilizes/"},
  {date:"2026-02-20",media:"Blockonomi",           reporter:"Brenda Mary",         author:"oinonen_t",     topic:"Credit Withdrawals",                           articleLink:"https://blockonomi.com/nexos-cumulative-credit-withdrawals-hit-863m-all-time-high-as-bitcoin-stabilizes/"},
  {date:"2026-02-20",media:"MEXC",                reporter:"Publisher",           author:"oinonen_t",     topic:"Credit Withdrawals",                           articleLink:"https://www.mexc.co/en-PH/news/755447"},
  {date:"2026-02-20",media:"BitRSS",              reporter:"Publisher",           author:"oinonen_t",     topic:"Credit Withdrawals",                           articleLink:"https://bitrss.com/nexo-s-cumulative-credit-withdrawals-hit-863m-all-time-high-as-bitcoin-stabilizes-185639"},
  {date:"2026-02-24",media:"BitGet",              reporter:"Publisher",           author:"Burak Kesmeci", topic:"Repeated Borrower Rate",                       articleLink:"https://www.bitget.com/news/detail/12560605217251"},
  {date:"2026-02-24",media:"MEXC",                reporter:"Publisher",           author:"Burak Kesmeci", topic:"Repeated Borrower Rate",                       articleLink:"https://www.mexc.com/en-GB/news/790797"},
  {date:"2026-02-24",media:"Blockchain Reporter", reporter:"Nicholas Otieno",     author:"Burak Kesmeci", topic:"Repeated Borrower Rate",                       articleLink:"https://blockchainreporter.net/nexo-achieves-52-repeat-borrower-rate-as-customer-crypto-lending-trading-activity-surges-analyst/"},
  {date:"2026-02-26",media:"Traders Union",       reporter:"Yaroslav Dmytrenko",  author:"Burak Kesmeci", topic:"Repeated Borrower Rate",                       articleLink:"https://tradersunion.com/news/cryptocurrency-news/show/1559205-nexo-rises-10-38percent-today-on/"},
];

// ── NEXO SEED DATA ──

// Differentiated but muted palette — each entry is visually distinct but stays
// in the cool/desaturated family so tags don't feel childish.
// Avatars are monochrome (institutional) — neutral surface + muted ink, theme-driven.
const AUTHOR_PALETTE = [
  {bg:"var(--surface3)", color:"var(--muted)"},
];
const CLIENT_PALETTE = [
  {bg:"var(--surface3)", border:"var(--border)", color:"var(--muted)"},
];
// Tier colors are resolved via CSS variables so dark mode can shift them.
const TIER_COLORS = {
  "Tier 1":{bg:"var(--tier-1-bg)",border:"var(--tier-1-border)",color:"var(--tier-1)"},
  "Tier 2":{bg:"var(--tier-2-bg)",border:"var(--tier-2-border)",color:"var(--tier-2)"},
  "Tier 3":{bg:"var(--tier-3-bg)",border:"var(--tier-3-border)",color:"var(--tier-3)"},
  "Tier 4":{bg:"var(--tier-4-bg)",border:"var(--tier-4-border)",color:"var(--tier-4)"},
};
const ROLE_META = {
  admin:  {label:"Admin",  color:"var(--accent)", bg:"color-mix(in srgb,var(--accent) 9%,transparent)",  border:"color-mix(in srgb,var(--accent) 24%,transparent)"},
  author: {label:"Author", color:"var(--muted)", bg:"var(--surface2)", border:"var(--border)"},
  client: {label:"Client", color:"var(--muted)", bg:"var(--surface2)", border:"var(--border)"},
};

const colorMaps = {};
let colorIdxs = {};
const getPaletteColor = (palette, ns, key) => {
  const k = `${ns}:${key}`;
  if (!colorMaps[k]) { colorIdxs[ns] = (colorIdxs[ns]||0); colorMaps[k] = palette[colorIdxs[ns]++ % palette.length]; }
  return colorMaps[k];
};
const getAuthorColor = n => getPaletteColor(AUTHOR_PALETTE,"author",n||"?");
const getTierColor = t => {
  const fallback = {bg:"var(--tier-default-bg)",border:"var(--tier-default-border)",color:"var(--tier-default)"};
  if(!t) return fallback;
  const key = t.toString().trim();
  return TIER_COLORS[key] || TIER_COLORS[`Tier ${key}`] || fallback;
};

const initials = (n="") => { const p=n.trim().split(/\s+/); return p.length>=2?(p[0][0]+p[1][0]).toUpperCase():n.slice(0,2).toUpperCase(); };
const fmtDate  = iso => { if(!iso)return"—"; const [y,m,d]=iso.split("-"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${+d}, ${y}`; };
const APP_VERSION = "V3.1";
// Captured once at page load — a share URL renders the public report for the whole
// page lifetime, immune to the app's hash-sync rewriting the URL after login restore.
const SHARE_TOKEN = (typeof window!=="undefined" && (window.location.hash.match(/^#\/r\/([A-Za-z0-9]{10,})/)||[])[1]) || null;
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const normKey   = s => (s||"").trim().toLowerCase();

// ── Shared page header ──
const PageHeader = ({label, title, children}) => (
  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,gap:16,flexWrap:"wrap"}}>
    <div>
      <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
      <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)",lineHeight:1.2}}>{title}</h2>
    </div>
    {children&&<div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>{children}</div>}
  </div>
);
const titleCase = s => { if(!s) return ""; return s.trim().replace(/\b\w/g, c => c.toUpperCase()); };
const hashPass = s => btoa(encodeURIComponent(s));

// ─────────────────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes rowIn   { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
@keyframes modalIn { from{opacity:0;transform:scale(0.97) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
@keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
/* Input focus ring — §14 */
input:focus, select:focus, textarea:focus { outline:none; border-color:var(--accent) !important; box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 22%,transparent) !important; }
/* Skeleton shimmer block — §16 */
.cq-skel{background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%);background-size:200% 100%;animation:shimmer 1.2s linear infinite;border-radius:6px;}
@media (prefers-reduced-motion: reduce){.cq-skel{animation:none;}}
/* Themed hover tooltip — set class="cq-tip" + data-tip="text" */
.cq-tip{position:relative;}
.cq-tip::after{content:attr(data-tip);position:absolute;bottom:calc(100% + 9px);left:50%;transform:translateX(-50%) translateY(3px);background:var(--surface3);color:var(--text);border:1px solid var(--border2);padding:4px 10px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:500;letter-spacing:0.02em;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .15s ease,transform .15s ease;z-index:80;box-shadow:var(--shadow-md);}
.cq-tip::before{content:"";position:absolute;bottom:calc(100% + 4px);left:50%;transform:translateX(-50%) rotate(45deg);width:8px;height:8px;background:var(--surface3);border-right:1px solid var(--border2);border-bottom:1px solid var(--border2);opacity:0;pointer-events:none;transition:opacity .15s ease;z-index:81;}
.cq-tip:hover::after,.cq-tip:hover::before{opacity:1;}
.cq-tip:hover::after{transform:translateX(-50%) translateY(0);}
button:focus-visible, a:focus-visible, [role="button"]:focus-visible, input:focus-visible, select:focus-visible { outline:3px solid var(--accent-glow); outline-offset:1px; border-radius:var(--r-md); }
* { margin:0; padding:0; box-sizing:border-box; }
:root {
  /* Dark theme tokens — the light theme was removed (app is dark-only) */
  --bg:#0B1120;
  --surface:#121A2E;
  --surface2:#1A2440;
  --surface3:#223054;
  --border:#27334F;
  --border2:#3A4A70;
  --text:#E6EBF5;
  --muted:#A8B3CE;
  --dim:#7E8AAA;
  --accent:#7CA7E0;
  --accent-light:#162133;
  --positive:#52D78C;
  --negative:#f87171;
  --green:#4ade80;
  --red:#f87171;
  --yellow:#fbbf24;
  --orange:#fb923c;
  --purple:#a78bfa;
  --tag:#7CA7E0;
  --row-tint:rgba(124,167,224,0.05);
  --row-tint-strong:rgba(124,167,224,0.09);
  --row-tint-weak:rgba(124,167,224,0.03);
  --accent-glow:rgba(124,167,224,0.22);
  --grid:rgba(255,255,255,0.06);
  --shadow-sm:0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:0 4px 14px rgba(0,0,0,0.45);
  --shadow-lg:0 12px 32px rgba(0,0,0,0.55);
  --input-shadow:inset 0 1px 3px rgba(0,0,0,0.3);
  /* Tier colors — single-hue ramp */
  --tier-1:#7CA7E0; --tier-1-bg:rgba(124,167,224,0.12);  --tier-1-border:rgba(124,167,224,0.30);
  --tier-2:#7488ad; --tier-2-bg:rgba(116,136,173,0.11); --tier-2-border:rgba(116,136,173,0.26);
  --tier-3:#8a99ab; --tier-3-bg:rgba(138,153,171,0.08); --tier-3-border:rgba(138,153,171,0.22);
  --tier-4:#5e6b7a; --tier-4-bg:rgba(94,107,122,0.10);  --tier-4-border:rgba(94,107,122,0.24);
  --tier-default:#5e6b7a; --tier-default-bg:rgba(94,107,122,0.08); --tier-default-border:rgba(94,107,122,0.20);
  /* Categorical chart colors */
  --chart-1:#7CA7E0; --chart-2:#7aa6ee; --chart-3:#4f9b94; --chart-4:#8a99ab; --chart-5:#5e6b7a; --chart-6:#d2a05a;
  color-scheme:dark;
  /* Modal size tokens */
  --modal-sm:380px; --modal-md:480px; --modal-lg:680px;
  /* Radius scale */
  --r-sm:4px; --r-md:8px; --r-lg:10px; --r-xl:12px;
}
body { background:var(--bg); color:var(--text); font-family:'Hanken Grotesk',system-ui,sans-serif; min-height:100vh; font-size:14px; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; letter-spacing:-0.01em; }
.tabular { font-variant-numeric: tabular-nums; }
::-webkit-scrollbar{width:4px;height:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px} ::-webkit-scrollbar-thumb:hover{background:var(--dim)}
input,select,textarea { color-scheme:light; }
[data-theme="dark"] input,[data-theme="dark"] select,[data-theme="dark"] textarea { color-scheme:dark; }
input[type=date]::-webkit-calendar-picker-indicator{cursor:pointer;opacity:0.5}
[data-theme="dark"] input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1);opacity:0.6}
a { color:var(--accent); }
button { font-family:'Hanken Grotesk',system-ui,sans-serif; letter-spacing:-0.01em; }
input:focus,textarea:focus,select:focus { border-color:var(--accent) !important; outline:3px solid var(--accent-glow) !important; outline-offset:0 !important; }
tr:hover td { background:var(--row-tint-strong) !important; transition:background .12s; }
.row-hover:hover { background:var(--row-tint-strong) !important; }
.cq-empty-dash { color:var(--dim); opacity:0.45; }
h1,h2,h3,h4 { letter-spacing:-0.02em; }
/* Dark mode: soften inline light-grays so cards don't wash out */
[data-theme="dark"] .cq-main { background:var(--bg); }
[data-theme="dark"] input,[data-theme="dark"] select,[data-theme="dark"] textarea { background:var(--surface2); color:var(--text); border-color:var(--border); }
[data-theme="dark"] input::placeholder,[data-theme="dark"] textarea::placeholder { color:var(--dim); }
[data-theme="dark"] option { background:var(--surface); color:var(--text); }
[data-theme="dark"] th { background:var(--surface2) !important; color:var(--dim) !important; border-color:var(--border) !important; }
[data-theme="dark"] td { border-color:var(--border) !important; color:var(--text); }
[data-theme="dark"] thead { background:var(--surface) !important; }
[data-theme="dark"] .cq-login-right { background:var(--bg) !important; }
@media(max-width:1100px){
  .cq-main{padding:28px 20px 60px!important;}
  .cq-stat-grid{grid-template-columns:repeat(2,1fr)!important;}
  .cq-chart-row{grid-template-columns:1fr!important;}
  .cq-3col{grid-template-columns:1fr 1fr!important;}
}
@media(max-width:900px){
  .cq-sidebar{position:fixed!important;left:0;top:0;z-index:500;transform:translateX(-100%);transition:transform .25s ease;box-shadow:none!important;}
  .cq-sidebar.open{transform:translateX(0);box-shadow:4px 0 24px rgba(0,0,0,0.3)!important;}
  .cq-overlay.active{display:block!important;}
  .cq-hamburger{display:flex!important;}
  .cq-main{padding:20px 16px 60px!important;}
  .cq-footer{padding:10px 16px!important;flex-direction:column;gap:4px;text-align:center;}
  .cq-login-wrap{flex-direction:column!important;}
  .cq-login-left{width:100%!important;padding:32px 28px!important;min-height:auto!important;}
  .cq-login-right{padding:24px 20px!important;}
  .cq-stat-grid{grid-template-columns:repeat(2,1fr)!important;}
  .cq-3col{grid-template-columns:1fr!important;}
  .cq-2col{grid-template-columns:1fr!important;}
  .cq-chart-row{grid-template-columns:1fr!important;}
}
@media(max-width:600px){
  .cq-stat-grid{grid-template-columns:1fr!important;}
  .cq-main{padding:14px 10px 50px!important;}
}
@media(min-width:901px){
  .cq-sidebar{transform:none!important;}
  .cq-overlay{display:none!important;}
  .cq-hamburger{display:none!important;}
}
.cq-table-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch;}
@media(max-width:900px){
  .cq-filter-bar{flex-wrap:wrap!important;}
  .cq-filter-bar input,.cq-filter-bar select{min-width:0!important;flex:1 1 120px!important;}
  .cq-header-row{flex-wrap:wrap!important;gap:12px!important;}
  .cq-tab-pills{flex-wrap:wrap!important;}
}
.cq-table-scroll>div{min-width:600px;}
`

// ─────────────────────────────────────────────────────────
//  DESIGN PRIMITIVES
// ─────────────────────────────────────────────────────────
const iStyle = {background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontFamily:"'JetBrains Mono',monospace",fontSize:12,padding:"10px 13px",outline:"none",width:"100%",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.04)",transition:"border-color .15s,box-shadow .15s",lineHeight:"1.4"};
const lStyle = {fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase"};
const Field = ({label,children,full}) => (
  <div style={{display:"flex",flexDirection:"column",gap:6,...(full?{gridColumn:"1/-1"}:{})}}>
    <label style={lStyle}>{label}</label>{children}
  </div>
);

// Icons
const Ic = ({d,w=14,h=14,sw=2,extra}) => <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={extra}>{d}</svg>;
const Icons = {
  Plus:  ()=><Ic w={14} h={14} sw={2.5} d={<><path d="M12 5v14M5 12h14"/></>}/>,
  Edit:  ()=><Ic w={12} h={12} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>,
  Trash: ()=><Ic w={12} h={12} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></>}/>,
  Search:()=><Ic d={<><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>}/>,
  X:     ()=><Ic d={<><path d="M18 6 6 18M6 6l12 12"/></>}/>,
  Spin:  ()=><Ic d={<path d="M21 12a9 9 0 1 1-6.219-8.56"/>} extra={{animation:"spin 1s linear infinite"}}/>,
  Eye:   ()=><Ic d={<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}/>,
  Lock:  ()=><Ic d={<><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>}/>,
  User:  ()=><Ic d={<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>}/>,
  Users: ()=><Ic d={<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>}/>,
  Chart: ()=><Ic d={<><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>}/>,
  News:  ()=><Ic d={<><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a4 4 0 0 1-4 4z"/><path d="M0 18a2 2 0 0 0 2 2"/><path d="M12 8h4M12 12h4M8 8h.01M8 12h.01"/></>}/>,
  Logout:()=><Ic d={<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>}/>,
  Brief:()=><Ic d={<><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></>}/>,
  Globe:()=><Ic d={<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>}/>,
  Key:   ()=><Ic d={<><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></>}/>,
  Analytics:()=><Ic d={<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>}/>,
  Sun:   ()=><Ic d={<><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>}/>,
  Moon:  ()=><Ic d={<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}/>,
  // Brand logos (fill-based, inherit text color). Inline-friendly via `s` size prop.
  X:        ({s=11,style}={})=><svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" style={{display:"inline-block",verticalAlign:"-1.5px",...style}}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  Telegram: ({s=11,style}={})=><svg width={s} height={s} viewBox="2.6 3.5 18.8 17" fill="currentColor" style={{display:"inline-block",verticalAlign:"-1.5px",...style}}><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>,
};

// Shared UI
const Toast = ({msg,type}) => (
  <div style={{position:"fixed",bottom:28,right:28,zIndex:500,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"10px 20px",borderRadius:8,background:"var(--surface)",border:`1px solid ${type==="error"?"rgba(185,28,28,0.25)":"rgba(22,101,52,0.25)"}`,color:type==="error"?"var(--negative)":"var(--positive)",boxShadow:"0 2px 8px rgba(0,0,0,0.08),0 8px 24px rgba(0,0,0,0.1)",letterSpacing:"0.04em",animation:"fadeUp .3s ease",display:"flex",alignItems:"center",gap:8}}>
    <span style={{fontSize:14}}>{type==="error"?"✕":"✓"}</span>{msg}
  </div>
);

const ConfirmDelete = ({onConfirm,onCancel}) => (
  <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.6)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:14,padding:28,boxShadow:"0 24px 64px rgba(0,0,0,0.2)",width:"min(var(--modal-sm),100%)",animation:"modalIn .2s ease"}}>
      <div style={{width:36,height:36,borderRadius:9,background:"rgba(185,28,28,0.08)",border:"1px solid rgba(185,28,28,0.18)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,fontSize:16}}>⚠</div>
      <div style={{fontSize:16,fontWeight:600,color:"var(--text)",marginBottom:6,letterSpacing:"-0.01em"}}>Delete this entry?</div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"var(--muted)",marginBottom:24,lineHeight:1.6}}>This action is permanent and cannot be undone.</div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 20px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",letterSpacing:"0.04em"}}>CANCEL</button>
        <button onClick={onConfirm} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 20px",borderRadius:8,border:"none",background:"var(--red)",color:"#fff",cursor:"pointer",fontWeight:600,letterSpacing:"0.04em"}}>DELETE</button>
      </div>
    </div>
  </div>
);

const RowBtn = ({onClick,title,hb,hc,hbg,children}) => (
  <button onClick={onClick} title={title} style={{width:28,height:28,borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--dim)",transition:"all .15s"}}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=hb;e.currentTarget.style.color=hc;e.currentTarget.style.background=hbg}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--dim)";e.currentTarget.style.background="transparent"}}>
    {children}
  </button>
);

// Groups admin/batch actions into a single dropdown. items: [{label, onClick, danger, disabled, title, running}]
const AdminMenu = ({items=[]}) => {
  const [open,setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    if(!open) return;
    const h = (e)=>{ if(ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const k = (e)=>{ if(e.key==="Escape") setOpen(false); };
    window.addEventListener("mousedown",h); window.addEventListener("keydown",k);
    return ()=>{ window.removeEventListener("mousedown",h); window.removeEventListener("keydown",k); };
  },[open]);
  const live = items.filter(Boolean);
  if(!live.length) return null;
  const busy = live.some(it=>it.running);
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(v=>!v)}
        style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:`1px solid ${open?"rgba(26,58,92,0.3)":"var(--border)"}`,background:open||busy?"color-mix(in srgb,var(--accent) 8%,transparent)":"var(--surface)",color:open||busy?"var(--accent)":"var(--muted)",cursor:"pointer",fontWeight:500,transition:"all .15s"}}>
        ⚙ Admin <span style={{fontSize:8,opacity:.7,transform:open?"rotate(180deg)":"none",transition:"transform .15s"}}>▾</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,minWidth:240,zIndex:60,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,boxShadow:"0 10px 30px rgba(0,0,0,0.35)",padding:6,display:"flex",flexDirection:"column",gap:2}}>
          {live.map((it,idx)=>(
            <button key={idx} disabled={it.disabled} title={it.title||""} onClick={()=>{if(it.disabled)return;setOpen(false);it.onClick();}}
              style={{display:"flex",alignItems:"center",gap:8,width:"100%",textAlign:"left",fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 11px",borderRadius:7,border:"none",background:"transparent",color:it.disabled?"var(--dim)":(it.danger?"var(--red)":"var(--text)"),cursor:it.disabled?"not-allowed":"pointer",opacity:it.disabled?0.55:1,whiteSpace:"nowrap"}}
              onMouseEnter={e=>{if(!it.disabled)e.currentTarget.style.background=it.danger?"rgba(220,38,38,0.08)":"color-mix(in srgb,var(--accent) 8%,transparent)";}}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{flex:1}}>{it.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const StatCard = ({label,value,sub,c,delta}) => {
  // delta: a number (percent change vs prior window) → green/red chip beside the value. null/undefined = hidden.
  const hasDelta = delta!=null && isFinite(delta);
  const up = hasDelta && delta>=0;
  return (
  <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",padding:"16px 20px",position:"relative",boxShadow:"var(--shadow-sm)"}}>
    <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10.5,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase",marginBottom:8}}>{label}</div>
    <div style={{display:"flex",alignItems:"baseline",gap:8,flexWrap:"wrap"}}>
      <div className="tabular" style={{fontSize:28,fontWeight:650,letterSpacing:"-0.02em",color:"var(--text)",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{value}</div>
      {hasDelta && <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,fontWeight:600,padding:"2px 7px",borderRadius:99,whiteSpace:"nowrap",background:up?"color-mix(in srgb,var(--positive) 12%,transparent)":"color-mix(in srgb,var(--negative) 12%,transparent)",color:up?"var(--positive)":"var(--negative)"}}>{up?"▲":"▼"} {Math.abs(delta)}%</span>}
    </div>
    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sub}</div>
  </div>
  );
};

// ─────────────────────────────────────────────────────────
//  LOGIN SCREEN
// ─────────────────────────────────────────────────────────
const LoginScreen = ({onLogin}) => {
  const [mode,setMode]             = useState("signin");
  const [username,setUsername]     = useState("");
  const [displayName,setDN]        = useState("");
  const [password,setPassword]     = useState("");
  const [confirm,setConfirm]       = useState("");
  const [regRole,setRegRole]       = useState("author");
  const [clientName,setClientName] = useState("");
  const [showPass,setShowPass]     = useState(false);
  const [error,setError]           = useState("");
  const [success,setSuccess]       = useState("");
  const [loading,setLoading]       = useState(false);

  const switchMode = (m) => { setMode(m); setError(""); setSuccess(""); setUsername(""); setPassword(""); setConfirm(""); setDN(""); setRegRole("author"); setClientName(""); };

  const handleLogin = async () => {
    if (!username.trim()||!password.trim()){setError("Please enter username and password.");return;}
    setLoading(true); setError("");
    try {
      const users = await db.getUsers().catch(()=>[]);
      const user = users.find(u=>u.username.toLowerCase()===username.toLowerCase().trim()&&u.passwordHash===hashPass(password));
      if (user) { onLogin(user); }
      else { setError("Invalid username or password."); }
    } catch { setError("Login failed. Try again."); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!username.trim()) { setError("Username is required."); return; }
    if (!password.trim()) { setError("Password is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords don't match."); return; }
    if (regRole === "client" && !clientName.trim()) { setError("Client name is required for client accounts."); return; }
    setLoading(true); setError("");
    try {
      const users = await db.getUsers().catch(()=>[]);
      const exists = users.find(u=>u.username.toLowerCase()===username.toLowerCase().trim());
      if (exists) { setError("Username already taken. Please choose another."); setLoading(false); return; }
      const newUser = {
        id: uid(),
        username: username.trim(),
        displayName: displayName.trim() || username.trim(),
        passwordHash: hashPass(password),
        role: regRole,
        clientName: regRole === "client" ? clientName.trim() : "",
        createdAt: Date.now(),
      };
      const updated = [...users, newUser];
      await db.setUsers(updated);
      setSuccess("Account created! You can now sign in.");
      setMode("signin");
      setUsername(newUser.username);
      setPassword("");
    } catch { setError("Registration failed. Try again."); }
    finally { setLoading(false); }
  };

  const isRegister = mode === "register";

  const lStyle2 = {display:"block",fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--dim)",fontWeight:600,marginBottom:7};
  const inpStyle = {width:"100%",fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:14,padding:"12px 13px 12px 38px",borderRadius:8,border:"1px solid var(--border)",background:"color-mix(in srgb,var(--surface2) 80%,transparent)",color:"var(--text)",outline:"none"};

  return (
    <div style={{position:"relative",height:"100vh",width:"100%",overflow:"hidden",background:"var(--bg)",fontFamily:"'Hanken Grotesk',system-ui,sans-serif"}}>

      {/* ambient background */}
      <div style={{position:"absolute",inset:0,backgroundImage:"radial-gradient(circle at 1px 1px, var(--grid) 1px, transparent 0)",backgroundSize:"30px 30px"}}/>
      <div style={{position:"absolute",width:560,height:560,borderRadius:"50%",background:"#2f5fae",top:-160,left:-120,filter:"blur(90px)",opacity:0.45,pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:620,height:620,borderRadius:"50%",background:"#1c2a52",bottom:-220,right:-140,filter:"blur(90px)",opacity:0.35,pointerEvents:"none"}}/>
      <svg viewBox="0 0 1440 900" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%"}}>
        <defs><linearGradient id="ambLogin" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22"/><stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/></linearGradient></defs>
        <path d="M0 760 L160 738 L320 706 L480 628 L640 560 L800 452 L960 392 L1120 300 L1280 232 L1440 150 L1440 900 L0 900 Z" fill="url(#ambLogin)"/>
        <path d="M0 800 L160 790 L320 776 L480 742 L640 712 L800 666 L960 632 L1120 588 L1280 548 L1440 506" fill="none" stroke="color-mix(in srgb,var(--dim) 60%,transparent)" strokeWidth="2"/>
        <path d="M0 760 L160 738 L320 706 L480 628 L640 560 L800 452 L960 392 L1120 300 L1280 232 L1440 150" fill="none" stroke="color-mix(in srgb,var(--accent) 85%,transparent)" strokeWidth="2.5"/>
      </svg>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at 50% 45%, rgba(10,15,30,.10), rgba(8,11,22,.74) 78%)",pointerEvents:"none"}}/>

      {/* top bar */}
      <div style={{position:"absolute",top:0,left:0,right:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"26px 34px",zIndex:3}}>
        <div style={{display:"flex",alignItems:"center",gap:11}}>
          <div style={{lineHeight:1.05}}>
            <div style={{fontSize:14,fontWeight:700,color:"#fff",letterSpacing:"-0.02em"}}>CryptoQuant</div>
            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:8.5,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--dim)",fontWeight:600,marginTop:1}}>Campaign Intelligence</div>
          </div>
        </div>
      </div>

      {/* centered card */}
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",padding:24,zIndex:2}}>
        <div style={{width:"100%",maxWidth:392,background:"color-mix(in srgb,var(--surface) 80%,transparent)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)",border:"1px solid var(--border2)",borderRadius:14,padding:34,boxShadow:"0 28px 80px rgba(0,0,0,.6)",animation:"fadeUp .5s ease both",maxHeight:"calc(100vh - 48px)",overflowY:"auto"}}>
          <h2 style={{fontSize:25,fontWeight:650,color:"#fff",letterSpacing:"-0.03em",marginBottom:7}}>{isRegister?"Request access":"Welcome back"}</h2>
          <p style={{fontSize:13.5,color:"var(--muted)",marginBottom:24}}>{isRegister?"New accounts start as Author or Client — an admin activates your access.":"Sign in to your campaign dashboard."}</p>

          <div style={{display:"flex",flexDirection:"column",gap:15}}>
            <div>
              <label style={lStyle2}>Username</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--dim)",display:"flex"}}><Icons.User/></div>
                <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username"
                  onKeyDown={e=>e.key==="Enter"&&(!isRegister?handleLogin():handleRegister())} style={inpStyle}/>
              </div>
            </div>

            {isRegister && (
              <div>
                <label style={lStyle2}>Display Name (optional)</label>
                <input value={displayName} onChange={e=>setDN(e.target.value)} placeholder="Your full name" style={{...inpStyle,paddingLeft:13}}/>
              </div>
            )}

            {isRegister && (
              <div>
                <label style={lStyle2}>Account Type</label>
                <div style={{display:"flex",gap:6}}>
                  {[{id:"author",label:"Author",desc:"Submit bounties"},{id:"client",label:"Client",desc:"Read-only"}].map(role=>{
                    const active=regRole===role.id;
                    return (
                      <button key={role.id} onClick={()=>setRegRole(role.id)} style={{flex:1,padding:"8px 6px",borderRadius:8,border:`1px solid ${active?"color-mix(in srgb,var(--accent) 55%,transparent)":"var(--border)"}`,background:active?"color-mix(in srgb,var(--accent) 10%,transparent)":"transparent",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:12.5,fontWeight:600,color:active?"var(--accent)":"var(--muted)",marginBottom:2}}>{role.label}</div>
                        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:11,color:"var(--dim)"}}>{role.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isRegister && regRole==="client" && (
              <div>
                <label style={lStyle2}>Company / Client Name</label>
                <input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="e.g. Binance" style={{...inpStyle,paddingLeft:13}}/>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:5}}>Must match the client tag used in campaign entries.</div>
              </div>
            )}

            <div>
              <label style={lStyle2}>Password</label>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--dim)",display:"flex"}}><Icons.Lock/></div>
                <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                  placeholder={isRegister?"Min. 6 characters":"Enter your password"}
                  onKeyDown={e=>e.key==="Enter"&&(!isRegister?handleLogin():handleRegister())} style={{...inpStyle,paddingRight:40}}/>
                <button onClick={()=>setShowPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",cursor:"pointer",color:showPass?"var(--accent)":"var(--dim)",display:"flex"}}><Icons.Eye/></button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label style={lStyle2}>Confirm Password</label>
                <div style={{position:"relative"}}>
                  <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--dim)",display:"flex"}}><Icons.Lock/></div>
                  <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter your password"
                    onKeyDown={e=>e.key==="Enter"&&handleRegister()} style={{...inpStyle,...(confirm&&confirm!==password?{borderColor:"color-mix(in srgb,var(--red) 55%,transparent)"}:{})}}/>
                </div>
                {confirm&&confirm!==password&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--red)",marginTop:5}}>Passwords don't match</div>}
              </div>
            )}
          </div>

          {error && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--red)",marginTop:14,padding:"8px 12px",background:"rgba(220,38,38,0.08)",border:"1px solid rgba(220,38,38,0.22)",borderRadius:8}}>{error}</div>}
          {success && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--green)",marginTop:14,padding:"8px 12px",background:"rgba(22,163,74,0.08)",border:"1px solid rgba(22,163,74,0.22)",borderRadius:8}}>{success}</div>}

          <button onClick={isRegister?handleRegister:handleLogin} disabled={loading}
            style={{width:"100%",marginTop:18,fontSize:13,fontWeight:600,padding:13,borderRadius:8,border:"none",background:"var(--accent)",color:"#fff",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"background .2s",opacity:loading?0.7:1}}
            onMouseEnter={e=>{if(!loading)e.currentTarget.style.background="color-mix(in srgb,var(--accent) 82%,#000)"}}
            onMouseLeave={e=>e.currentTarget.style.background="var(--accent)"}>
            {loading?<><Icons.Spin/>{isRegister?"Creating…":"Signing in…"}</>:<>{isRegister?"Create account":"Sign in"} →</>}
          </button>

          <div style={{marginTop:18,textAlign:"center",fontSize:12.5,color:"var(--dim)"}}>
            {!isRegister
              ? <>Need an account? <button onClick={()=>switchMode("register")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",fontWeight:600,fontSize:12.5,fontFamily:"inherit"}}>Request access</button></>
              : <>Already have an account? <button onClick={()=>switchMode("signin")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",fontWeight:600,fontSize:12.5,fontFamily:"inherit"}}>Sign in</button></>}
          </div>
        </div>
      </div>

      {/* bottom bar */}
      <div style={{position:"absolute",bottom:0,left:0,right:0,display:"flex",alignItems:"center",justifyContent:"flex-end",padding:"22px 34px",zIndex:3}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,letterSpacing:"0.14em",textTransform:"uppercase",color:"var(--dim)",fontWeight:600}}>v2</span>
      </div>

    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  USER MANAGEMENT (Admin only)
// ─────────────────────────────────────────────────────────
const UserForm = ({initial,onSave,onClose,campaignsList}) => {
  const isEdit = !!initial?.id;
  const [form,setForm] = useState(initial||{username:"",password:"",role:"author",clientName:"",allowedCampaigns:[]});
  const [saving,setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const toggleCampaign = (cid) => {
    const current = form.allowedCampaigns||[];
    set("allowedCampaigns", current.includes(cid) ? current.filter(x=>x!==cid) : [...current,cid]);
  };

  const handleSave = async () => {
    if (!form.username.trim()) { alert("Username required."); return; }
    if (!isEdit && !form.password.trim()) { alert("Password required."); return; }
    setSaving(true);
    const out = {...form};
    if (form.password?.trim()) out.passwordHash = hashPass(form.password);
    delete out.password;
    await onSave(out);
    setSaving(false);
  };
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:12,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",width:"min(var(--modal-md),100%)",maxHeight:"90vh",overflowY:"auto",padding:32,position:"relative",animation:"modalIn .25s ease"}}>
        <button onClick={onClose} style={{position:"absolute",top:18,right:18,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.1em",color:"var(--purple)",textTransform:"uppercase",marginBottom:6}}>// {isEdit?"edit":"new"} user</div>
        <div style={{fontSize:20,fontWeight:500,marginBottom:24}}>{isEdit?"Edit User":"Create User"}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Field label="Username" full><input value={form.username} onChange={e=>set("username",e.target.value)} placeholder="username" style={iStyle}/></Field>
          <Field label={isEdit?"New Password (leave blank to keep)":"Password"} full><input type="password" value={form.password||""} onChange={e=>set("password",e.target.value)} placeholder={isEdit?"••••••••":"Set password"} style={iStyle}/></Field>
          <Field label="Role">
            <select value={form.role} onChange={e=>set("role",e.target.value)} style={iStyle}>
              <option value="admin">Admin</option>
              <option value="author">Author</option>
              <option value="client">Client</option>
            </select>
          </Field>
          {form.role==="author" && (
            <Field label="Display Name">
              <input value={form.displayName||""} onChange={e=>set("displayName",e.target.value)} placeholder="How name appears" style={iStyle}/>
            </Field>
          )}
        </div>

        {/* Campaign access — authors and clients */}
        {(form.role==="client"||form.role==="author") && (
          <div style={{marginTop:16}}>
            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase",marginBottom:10}}>
              Bounty Access
              {form.role==="author" && <span style={{marginLeft:8,color:"var(--muted)",textTransform:"none",fontSize:9,letterSpacing:0}}>— which campaigns this author can post to</span>}
            </div>
            {!campaignsList.length ? (
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",padding:"12px",background:"var(--surface2)",borderRadius:8,border:"1px solid var(--border)"}}>
                No campaigns created yet. Create campaigns first, then assign access here.
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {campaignsList.map(cl=>{
                  const allowed = (form.allowedCampaigns||[]).includes(cl.id);
                  return (
                    <button key={cl.id} onClick={()=>toggleCampaign(cl.id)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:8,border:`1px solid ${allowed?cl.color+"60":"var(--border)"}`,background:allowed?cl.color+"0e":"var(--surface2)",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                      <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${allowed?cl.color:"var(--border2)"}`,background:allowed?cl.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                        {allowed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{width:10,height:10,borderRadius:"50%",background:cl.color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500,color:allowed?cl.color:"var(--text)"}}>{cl.name}</div>
                      </div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:allowed?cl.color:"var(--dim)"}}>
                        {allowed?"ALLOWED":"NO ACCESS"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {(form.allowedCampaigns||[]).length===0 && campaignsList.length>0 && (
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--yellow)",marginTop:8,padding:"8px 12px",background:"rgba(26,58,92,0.04)",border:"1px solid rgba(217,119,6,0.2)",borderRadius:7}}>
                {form.role==="author"?"⚠ No campaigns selected — author won't be able to post to any campaign.":"⚠ No campaigns selected — client won't see any data."}
              </div>
            )}
          </div>
        )}

        <div style={{marginTop:16,padding:"12px 14px",background:"var(--surface2)",borderRadius:8,border:"1px solid var(--border)"}}>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase",marginBottom:6}}>Role permissions</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--muted)",lineHeight:1.8}}>
            {form.role==="admin"  && "Full access · View, create, edit & delete all entries · Manage users"}
            {form.role==="author" && "Can post to assigned campaigns only · Edit only their own entries"}
            {form.role==="client" && "Read-only · Sees only campaigns granted by admin"}
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20,paddingTop:20,borderTop:"1px solid var(--border)"}}>
          <button onClick={onClose} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
          <button onClick={handleSave} disabled={saving} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 22px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--purple)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:7}}>
            {saving?<><Icons.Spin/>SAVING…</>:"SAVE USER"}
          </button>
        </div>
      </div>
    </div>
  );
};

const UsersPanel = ({users,campaigns,citations,campaignsList,onSaveUser,onDeleteUser,showToast,currentUser}) => {
  const [showForm,setShowForm] = useState(false);
  const [editUser,setEditUser] = useState(null);
  const [confirmId,setConfirmId] = useState(null);
  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--purple)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>// user management</div>
          <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>Team & Access</h2>
        </div>
        <button onClick={()=>{setEditUser(null);setShowForm(true)}} style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 16px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--purple)",cursor:"pointer",fontWeight:500}}>
          <Icons.Plus/> ADD USER
        </button>
      </div>
      <div className="cq-3col" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
        {["admin","author","client"].map(role=>{
          const rm = ROLE_META[role];
          const count = users.filter(u=>u.role===role).length;
          return (
            <div key={role} style={{background:"var(--surface)",border:`1px solid var(--border)`,borderRadius:8,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${rm.color},transparent)`,opacity:.8}}/>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:4,background:rm.bg,border:`1px solid ${rm.border}`,color:rm.color,textTransform:"uppercase",letterSpacing:"0.06em"}}>{rm.label}</span>
              </div>
              <div style={{fontSize:28,fontWeight:500,color:rm.color}}>{count}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:2}}>active {rm.label.toLowerCase()}s</div>
            </div>
          );
        })}
      </div>
      <div className="cq-table-scroll"><div style={{minWidth:550}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 100px 1fr 120px 60px",padding:"10px 20px",borderBottom:"1px solid var(--border)",background:"var(--surface)"}}>
          {["User","Role","Bounty Access","Created",""].map(h=><div key={h} style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase"}}>{h}</div>)}
        </div>
        {users.length===0 ? (
          <div style={{textAlign:"center",padding:"48px 20px",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"var(--dim)"}}>No users yet</div>
        ) : users.map((u,i)=>{
          const rm = ROLE_META[u.role]||ROLE_META.author;
          const isMe = u.id===currentUser.id;
          return (
            <div key={u.id} style={{display:"grid",gridTemplateColumns:"1fr 100px 1fr 120px 60px",padding:"13px 20px",borderBottom:"1px solid var(--border)",alignItems:"center",animation:`rowIn .3s ease ${i*.03}s both`}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.04)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:30,height:30,borderRadius:"50%",background:"rgba(255,255,255,0.05)",border:"1px solid var(--border2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:500,color:"var(--muted)"}}>{initials(u.username)}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:500}}>{u.username}{isMe&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,marginLeft:6,color:"var(--green)"}}>you</span>}</div>
                  {u.displayName&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>{u.displayName}</div>}
                </div>
              </div>
              <div><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:4,background:rm.bg,border:`1px solid ${rm.border}`,color:rm.color,textTransform:"uppercase",letterSpacing:"0.06em"}}>{rm.label}</span></div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                {u.role==="client" ? (
                  (u.allowedCampaigns||[]).length===0
                    ? <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>No access</span>
                    : (u.allowedCampaigns||[]).map(cid=>{
                        const cl = campaignsList.find(c=>c.id===cid);
                        if(!cl) return null;
                        return <span key={cid} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:4,background:cl.color+"18",border:`1px solid ${cl.color}44`,color:cl.color}}>{cl.name}</span>;
                      })
                ) : u.role==="author" ? (
                  (u.allowedCampaigns||[]).length===0
                    ? <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>No access</span>
                    : (u.allowedCampaigns||[]).map(cid=>{
                        const cl = campaignsList.find(c=>c.id===cid);
                        if(!cl) return null;
                        return <span key={cid} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:4,background:cl.color+"18",border:`1px solid ${cl.color}44`,color:cl.color}}>{cl.name}</span>;
                      })
                ) : (
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>All campaigns</span>
                )}
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>{u.createdAt?new Date(u.createdAt).toLocaleDateString():"—"}</div>
              <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                <RowBtn onClick={()=>{setEditUser(u);setShowForm(true)}} title="Edit" hb="var(--accent)" hc="var(--accent)" hbg="color-mix(in srgb,var(--accent) 7%,transparent)"><Icons.Edit/></RowBtn>
                {!isMe&&<RowBtn onClick={()=>setConfirmId(u.id)} title="Delete" hb="var(--red)" hc="var(--red)" hbg="rgba(220,38,38,0.07)"><Icons.Trash/></RowBtn>}
              </div>
            </div>
          );
        })}
      </div>
      </div></div>
      {showForm&&<UserForm initial={editUser} onSave={async f=>{await onSaveUser(f,editUser);setShowForm(false);setEditUser(null)}} onClose={()=>{setShowForm(false);setEditUser(null)}} campaignsList={campaignsList}/>}
      {confirmId&&<ConfirmDelete onConfirm={()=>{onDeleteUser(confirmId);setConfirmId(null)}} onCancel={()=>setConfirmId(null)}/>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  CAMPAIGN TABLE (shared, role-aware)
// ─────────────────────────────────────────────────────────
const CAMP_EMPTY = {date:"",author:"",title:"",cqLink:"",analyticsLink:"",authorTwitterLink:"",cqTwitterLink:"",telegramLink:"",category:"",asset:"",twitterImpressions:"",telegramImpressions:""};
const CampForm = ({initial,isEdit,onSave,onClose,currentUser}) => {
  const prefill = currentUser.role==="author"?{...CAMP_EMPTY,author:currentUser.displayName||currentUser.username,...initial}:{...CAMP_EMPTY,...initial};
  const [form,setForm] = useState(prefill);
  const [saving,setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const handleSave = async () => {
    if (!form.title.trim()){alert("Title required.");return;}
    setSaving(true); await onSave(form); setSaving(false);
  };
  const locked = currentUser.role==="author";
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",justifyContent:"flex-end"}}>
      <div style={{background:"var(--surface)",borderLeft:"1px solid var(--border)",boxShadow:"-4px 0 32px rgba(13,21,32,0.12)",width:"min(480px,100vw)",height:"100vh",overflowY:"auto",overflowX:"hidden",padding:"32px 30px 48px",position:"relative",animation:"slideIn .22s cubic-bezier(0.22,1,0.36,1)",display:"flex",flexDirection:"column",gap:0}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase",marginBottom:6}}>//{isEdit?"edit":"new"} bounty entry</div>
        <div style={{fontSize:18,fontWeight:500,marginBottom:24}}>{isEdit?"Edit Bounty":"Add Bounty Entry"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="Date"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={iStyle}/></Field>
          <Field label="Author"><input value={form.author} onChange={e=>set("author",e.target.value)} placeholder="e.g. Darkfost" disabled={locked&&!isEdit} style={{...iStyle,opacity:locked&&!isEdit?.6:1}}/></Field>
          <Field label="Title" full><textarea value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Post title or description…" rows={3} style={{...iStyle,resize:"vertical",lineHeight:1.5}}/></Field>
          <Field label="Quicktake Link" full><input type="url" value={form.cqLink} onChange={e=>set("cqLink",e.target.value)} placeholder="https://cryptoquant.com/quicktake/…" style={iStyle}/></Field>
          <Field label="Analytics Link" full><input type="url" value={form.analyticsLink||""} onChange={e=>set("analyticsLink",e.target.value)} placeholder="https://cryptoquant.com/community/dashboard/…" style={iStyle}/></Field>
          <Field label="Author Twitter Link" full><input type="url" value={form.authorTwitterLink||""} onChange={e=>set("authorTwitterLink",e.target.value)} placeholder="https://x.com/…" style={iStyle}/></Field>
          <Field label="Author Telegram Link" full><input type="url" value={form.authorTelegramLink||""} onChange={e=>set("authorTelegramLink",e.target.value)} placeholder="https://t.me/…" style={iStyle}/></Field>
          <Field label="CryptoQuant Twitter Link" full><input type="url" value={form.cqTwitterLink||""} onChange={e=>set("cqTwitterLink",e.target.value)} placeholder="https://x.com/CryptoQuant_IO/…" style={iStyle}/></Field>
          <Field label="CryptoQuant Telegram Link" full><input type="url" value={form.telegramLink||""} onChange={e=>set("telegramLink",e.target.value)} placeholder="https://t.me/cryptoquant_official/…" style={iStyle}/></Field>
          <div style={{paddingTop:12,borderTop:"1px solid var(--border)",marginTop:4}}>
            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Campaign-Specific Fields</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",gap:10}}>
                <Field label="Category"><input value={form.category||""} onChange={e=>set("category",e.target.value)} placeholder="e.g. Spot, Macro" style={iStyle}/></Field>
                <Field label="Asset"><input value={form.asset||""} onChange={e=>set("asset",e.target.value)} placeholder="e.g. BTC, ETH" style={iStyle}/></Field>
              </div>
              <div style={{display:"flex",gap:10}}>
                <Field label="Twitter Impressions"><input value={form.twitterImpressions||""} onChange={e=>set("twitterImpressions",e.target.value)} placeholder="e.g. 21300" style={iStyle}/></Field>
                <Field label="Telegram Impressions"><input value={form.telegramImpressions||""} onChange={e=>set("telegramImpressions",e.target.value)} placeholder="e.g. 7100" style={iStyle}/></Field>
              </div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:24,paddingTop:20,borderTop:"1px solid var(--border)"}}>
          <button onClick={onClose} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
          <button onClick={handleSave} disabled={saving} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 22px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:7}}>
            {saving?<><Icons.Spin/>SAVING…</>:"SAVE ENTRY"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  PAGINATION
// ─────────────────────────────────────────────────────────
const PAGE_SIZE = 10;
const Pagination = ({page, total, onChange}) => {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if(totalPages <= 1) return null;
  const start = (page-1)*PAGE_SIZE+1;
  const end   = Math.min(page*PAGE_SIZE, total);
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderTop:"1px solid var(--border)",background:"var(--surface2)"}}>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>{start}–{end} of {total}</span>
      <div style={{display:"flex",gap:4}}>
        <button onClick={()=>onChange(1)} disabled={page===1} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:page===1?"default":"pointer",opacity:page===1?.4:1}}>«</button>
        <button onClick={()=>onChange(page-1)} disabled={page===1} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:page===1?"default":"pointer",opacity:page===1?.4:1}}>Prev</button>
        {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).reduce((acc,p,i,arr)=>{
          if(i>0&&arr[i-1]!==p-1) acc.push("…");
          acc.push(p);
          return acc;
        },[]).map((p,i)=>
          p==="…"
            ? <span key={`e${i}`} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 8px",color:"var(--dim)"}}>…</span>
            : <button key={p} onClick={()=>onChange(p)} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 11px",borderRadius:7,border:`1px solid ${page===p?"color-mix(in srgb,var(--accent) 22%,transparent)":"var(--border)"}`,background:page===p?"rgba(26,58,92,0.08)":"var(--surface)",color:page===p?"var(--accent)":"var(--muted)",cursor:"pointer",fontWeight:page===p?700:400}}>{p}</button>
        )}
        <button onClick={()=>onChange(page+1)} disabled={page===totalPages} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:page===totalPages?"default":"pointer",opacity:page===totalPages?.4:1}}>Next</button>
        <button onClick={()=>onChange(totalPages)} disabled={page===totalPages} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:page===totalPages?"default":"pointer",opacity:page===totalPages?.4:1}}>»</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  PAGINATION
// ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
//  BOUNTY DETAIL MODAL
// ─────────────────────────────────────────────────────────
const BountyDetailModal = ({entry, onEdit, onDelete, onClose, canEdit:isEditable, onGenerateSummary, citations, onCitedBountyUpdate}) => {
  const ac = getAuthorColor(entry.author);
  const normalizeArticleUrl = (url) => {
    if (!url) return "";
    try { const u = new URL(url.trim()); return `${u.hostname.replace(/^www\./i,"").toLowerCase()}${u.pathname.replace(/\/+$/,"")}`; }
    catch { return url.trim().toLowerCase(); }
  };
  const linkedCitations = useMemo(()=>{
    if (!Array.isArray(citations)) return [];
    return citations
      .filter(c => c.citedBountyId === entry.id)
      .sort((a,b) => (b.date||"").localeCompare(a.date||""));
  },[citations, entry.id]);
  const [gen, setGen] = useState({loading:false, error:null});
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkBusy, setLinkBusy] = useState(false);
  const [linkResult, setLinkResult] = useState(null);
  const linkByUrl = async () => {
    if (!onCitedBountyUpdate || !Array.isArray(citations)) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) return;
    const target = normalizeArticleUrl(trimmed);
    if (!target) { setLinkResult({ok:false, msg:"Invalid URL"}); return; }
    const matches = citations.filter(c => c.articleLink && normalizeArticleUrl(c.articleLink) === target);
    if (!matches.length) { setLinkResult({ok:false, msg:"No citation found with that article URL. Add the citation first via the Media Citations tab."}); return; }
    const c = matches[0];
    if (c.citedBountyId === entry.id) { setLinkResult({ok:false, msg:"Already linked to this bounty."}); return; }
    if (c.citedBountyId && !window.confirm("This citation is already linked to a different bounty. Replace?")) return;
    setLinkBusy(true);
    try {
      await onCitedBountyUpdate(c.id, entry.id, true);
      setLinkResult({ok:true, msg:`Linked: ${c.media||"citation"}${c.headline?` — "${c.headline.slice(0,60)}${c.headline.length>60?"…":""}"`:""}`});
      setLinkUrl("");
    } catch (e) {
      setLinkResult({ok:false, msg: e.message});
    } finally {
      setLinkBusy(false);
    }
  };
  const genSummary = async (rawContent) => {
    if (!onGenerateSummary) return;
    setGen({loading:true, error:null});
    try { await onGenerateSummary(entry.id, rawContent); setGen({loading:false, error:null}); setPasteOpen(false); setPasteText(""); }
    catch (e) { setGen({loading:false, error:e.message}); }
  };
  const InfoBlock = ({label, value, full=false}) => !value ? null : (
    <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)",gridColumn:full?"1/-1":"auto"}}>
      <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
      <div style={{fontSize:13,fontWeight:500,wordBreak:"break-word"}}>{value}</div>
    </div>
  );
  const LinkBtn = ({label, url}) => !url ? null : (
    <a href={url} target="_blank" rel="noreferrer"
      style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"6px 14px",borderRadius:8,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",color:"var(--accent)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
      {label} ↗
    </a>
  );
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:10,boxShadow:"0 20px 60px rgba(0,0,0,0.15)",width:"min(var(--modal-md),100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",position:"relative",animation:"modalIn .2s ease"}}>
        {/* Header */}
        <div style={{padding:"24px 28px 16px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>// bounty entry</div>
          <h2 style={{fontSize:16,fontWeight:500,lineHeight:1.4,paddingRight:24}}>{entry.title||"—"}</h2>
        </div>
        {/* Scrollable body */}
        <div style={{overflowY:"auto",padding:"20px 28px",flex:1}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <InfoBlock label="Date" value={fmtDate(entry.date)}/>
            <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Author</div>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:500,background:ac.bg,color:ac.color,border:"1px solid var(--border2)",flexShrink:0}}>{initials(entry.author)}</div>
                <span style={{fontSize:13,fontWeight:500}}>{entry.author||"—"}</span>
              </div>
            </div>
            <InfoBlock label="Category" value={entry.category}/>
            <InfoBlock label="Asset" value={entry.asset}/>
            <InfoBlock label="Twitter Impressions" value={entry.twitterImpressions}/>
            <InfoBlock label="Telegram Impressions" value={entry.telegramImpressions}/>
          </div>
          {(entry.cqLink||entry.analyticsLink||entry.authorTwitterLink||entry.authorTelegramLink||entry.cqTwitterLink||entry.telegramLink)&&(
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Links</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <LinkBtn label="Quicktake" url={entry.cqLink}/>
                <LinkBtn label="Analytics" url={entry.analyticsLink}/>
                <LinkBtn label="Author X" url={entry.authorTwitterLink}/>
                <LinkBtn label="Author TG" url={entry.authorTelegramLink}/>
                <LinkBtn label="CQ X" url={entry.cqTwitterLink}/>
                <LinkBtn label="CQ TG" url={entry.telegramLink}/>
              </div>
            </div>
          )}
          {(entry.summary || (isEditable && onGenerateSummary)) && (
            <div style={{marginBottom:16,padding:"12px 14px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"rgba(15,118,110,0.04)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:6,marginBottom:entry.summary?8:0,flexWrap:"wrap"}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.08em"}}>AI Summary</div>
                <div style={{display:"flex",gap:6}}>
                  {isEditable && onGenerateSummary && entry.cqLink && (
                    <button onClick={()=>genSummary(null)} disabled={gen.loading}
                      style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:5,border:"1px solid color-mix(in srgb,var(--accent) 28%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--accent)",cursor:gen.loading?"wait":"pointer",fontWeight:500}}>
                      {gen.loading?"GENERATING…":(entry.summary?"🔄 REGENERATE":"📝 GENERATE")}
                    </button>
                  )}
                  {isEditable && onGenerateSummary && (
                    <button onClick={()=>{setPasteOpen(v=>!v);setPasteText("")}}
                      style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:5,border:"1px solid var(--border)",background:pasteOpen?"var(--surface2)":"transparent",color:"var(--muted)",cursor:"pointer",fontWeight:500}}>
                      📋 PASTE
                    </button>
                  )}
                </div>
              </div>
              {entry.summary ? (
                <div style={{fontSize:12,lineHeight:1.55,color:"var(--text)"}}>{entry.summary}</div>
              ) : !pasteOpen && (
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",fontStyle:"italic"}}>No summary yet — click Generate (uses RSS or ScrapingBee) or Paste if you have the body text handy.</div>
              )}
              {pasteOpen && (
                <div style={{marginTop:10}}>
                  <textarea value={pasteText} onChange={e=>setPasteText(e.target.value)} placeholder="Paste the bounty's full body text here…" rows={6}
                    style={{width:"100%",fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",resize:"vertical",boxSizing:"border-box"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6,gap:8}}>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>{pasteText.trim().length} chars (min 80)</span>
                    <button onClick={()=>genSummary(pasteText.trim())} disabled={gen.loading||pasteText.trim().length<80}
                      style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:6,border:"1px solid color-mix(in srgb,var(--accent) 28%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--accent)",cursor:gen.loading||pasteText.trim().length<80?"not-allowed":"pointer",fontWeight:500,opacity:pasteText.trim().length<80?0.5:1}}>
                      {gen.loading?"SUMMARIZING…":"SUMMARIZE PASTED"}
                    </button>
                  </div>
                </div>
              )}
              {gen.error && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#b91c1c",marginTop:6}}>Error: {gen.error}</div>}
            </div>
          )}
          {Array.isArray(citations) && (
            <div style={{marginBottom:8}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Cited By</div>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--dim)"}}>{linkedCitations.length}</span>
              </div>
              {isEditable && onCitedBountyUpdate && (
                <div style={{marginBottom:10,padding:"10px 12px",borderRadius:8,border:"1px dashed var(--border2)",background:"var(--surface2)"}}>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <input value={linkUrl} onChange={e=>{setLinkUrl(e.target.value);setLinkResult(null);}}
                      placeholder="Paste article URL to link this bounty…"
                      onKeyDown={e=>{if(e.key==="Enter"&&!linkBusy)linkByUrl();}}
                      style={{flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"6px 8px",borderRadius:5,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)"}}/>
                    <button onClick={linkByUrl} disabled={linkBusy||!linkUrl.trim()}
                      style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"6px 12px",borderRadius:5,border:"1px solid color-mix(in srgb,var(--accent) 28%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--accent)",cursor:linkBusy||!linkUrl.trim()?"not-allowed":"pointer",fontWeight:500,opacity:!linkUrl.trim()?0.5:1,whiteSpace:"nowrap"}}>
                      {linkBusy?"LINKING…":"🔗 LINK"}
                    </button>
                  </div>
                  {linkResult && (
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,marginTop:6,color:linkResult.ok?"var(--accent)":"#b91c1c"}}>
                      {linkResult.ok?"✓ ":""}{linkResult.msg}
                    </div>
                  )}
                </div>
              )}
              {linkedCitations.length === 0 ? (
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",fontStyle:"italic",padding:"6px 0"}}>No citations linked yet.</div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:0,border:"1px solid var(--border)",borderRadius:8,overflow:"hidden"}}>
                  {linkedCitations.map((c,i) => {
                    const tc = getTierColor(c.mediaTier);
                    return (
                      <div key={c.id} style={{display:"grid",gridTemplateColumns:"96px 1fr auto",gap:10,alignItems:"center",padding:"9px 12px",borderBottom:i<linkedCitations.length-1?"1px solid var(--border)":"none",background:"transparent"}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",whiteSpace:"nowrap"}}>{c.date||"—"}</div>
                        <div style={{minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                            <span style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.media||"—"}</span>
                            {c.mediaTier && <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,padding:"1px 5px",borderRadius:3,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,flexShrink:0}}>Tier {c.mediaTier}</span>}
                          </div>
                          <div title={c.headline||c.topic||""} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.headline||c.topic||"—"}</div>
                        </div>
                        <div style={{display:"flex",gap:4}}>
                          {c.articleLink && <a href={c.articleLink} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",textDecoration:"none",whiteSpace:"nowrap"}}>Article↗</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{padding:"14px 28px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
          {isEditable&&typeof onDelete==="function"&&<button onClick={onDelete} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 18px",borderRadius:8,border:"1px solid rgba(220,38,38,0.28)",background:"rgba(220,38,38,0.07)",color:"var(--red)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:6,marginRight:"auto"}}><Icons.Trash/> Delete</button>}
          <button onClick={onClose} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 16px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>Close</button>
          {isEditable&&<button onClick={onEdit} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 18px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:6}}><Icons.Edit/> Edit</button>}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  CAMPAIGN TABLE
// ─────────────────────────────────────────────────────────
const CampaignTable = ({campaigns, citations=[], onSave, onDelete, onDeleteAll, currentUser, readOnly=false, onBountySummaryUpdate, onBountyImpressionsUpdate, onBountyTgUpdate, onCitedBountyUpdate}) => {
  const rcReady = useRecharts();
  const bountyById = useMemo(()=>Object.fromEntries((campaigns||[]).map(b=>[b.id,b])),[campaigns]);
  const [search,setSearch]       = useState("");
  const [filterAuthor,setFA]     = useState("all");
  const [filterDateFrom,setDateFrom] = useState("");
  const [filterDateTo,setDateTo]     = useState("");
  const [page,setPage]           = useState(1);
  const [showForm,setShowForm]   = useState(false);
  const [editEntry,setEdit]      = useState(null);
  const [confirmId,setConfId]    = useState(null);
  const [view,setView]           = useState(null);
  const [showFilters,setShowFilters] = useState(false);
  const [sumBatch,setSumBatch] = useState({running:false,total:0,processed:0,saved:0,skipped:0,errors:0,lastMsg:""});
  const [impBatch,setImpBatch] = useState({running:false,total:0,saved:0,skipped:0,lastMsg:""});
  const runImpressions = async (scope, {force=false}={}) => {
    // force=false → only NEW bounties (no impressions value yet); avoids re-fetching synced tweets.
    // force=true  → re-fetch ALL bounties with a tweet link, overwriting existing numbers.
    const withLink = scope.filter(b => b.authorTwitterLink || b.cqTwitterLink);
    const targets = force ? withLink : withLink.filter(b => !String(b.twitterImpressions||"").trim());
    if (!targets.length) {
      setImpBatch({running:false,total:0,saved:0,skipped:0,lastMsg:force?"No bounties have a tweet link to refresh.":"All tweets already have impressions — nothing new to fetch."});
      return;
    }
    setImpBatch({running:true,total:targets.length,saved:0,skipped:0,lastMsg:""});
    try {
      const r = await fetch("/api/twitter-impressions", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ bountyIds: targets.map(b=>b.id) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      for (const u of (data.updated || [])) {
        if (!u.skipped && u.total!=null && onBountyImpressionsUpdate) {
          await onBountyImpressionsUpdate(u.bountyId, String(u.total), true);
        }
      }
      setImpBatch({running:false,total:targets.length,saved:data.saved||0,skipped:data.skipped||0,lastMsg:""});
    } catch (e) {
      setImpBatch({running:false,total:targets.length,saved:0,skipped:0,lastMsg:e.message});
    }
  };
  const [tgBatch,setTgBatch] = useState({running:false,total:0,saved:0,skipped:0,lastMsg:""});
  const runTgImpressions = async (scope, {force=false}={}) => {
    // force=false → only bounties with no Telegram-views value yet; force=true → re-scrape all.
    const withLink = scope.filter(b => b.authorTelegramLink || b.telegramLink);
    const targets = force ? withLink : withLink.filter(b => !String(b.telegramImpressions||"").trim());
    if (!targets.length) {
      setTgBatch({running:false,total:0,saved:0,skipped:0,lastMsg:force?"No bounties have a Telegram link to refresh.":"All Telegram posts already have views — nothing new to fetch."});
      return;
    }
    setTgBatch({running:true,total:targets.length,saved:0,skipped:0,lastMsg:""});
    try {
      const r = await fetch("/api/telegram-impressions", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ bountyIds: targets.map(b=>b.id) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      for (const u of (data.updated || [])) {
        if (!u.skipped && u.total!=null && onBountyTgUpdate) {
          await onBountyTgUpdate(u.bountyId, String(u.total), true);
        }
      }
      setTgBatch({running:false,total:targets.length,saved:data.saved||0,skipped:data.skipped||0,lastMsg:""});
    } catch (e) {
      setTgBatch({running:false,total:targets.length,saved:0,skipped:0,lastMsg:e.message});
    }
  };

  const resetFilters = () => { setSearch(""); setFA("all"); setDateFrom(""); setDateTo(""); setPage(1); };
  const runSummarize = async (scope) => {
    const unsumm = scope.filter(b => !b.summary && b.cqLink);
    if (!unsumm.length) {
      setSumBatch({running:false,total:0,processed:0,saved:0,skipped:0,errors:0,lastMsg:"No un-summarized bounties with a cqLink."});
      return;
    }
    const validDates = (campaigns||[]).map(b=>b.date).filter(Boolean).sort();
    const earliest = validDates[0] || "";
    const campaignStart = (()=>{ if(!earliest) return ""; const d=new Date(earliest); if(isNaN(d.getTime())) return earliest; d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
    setSumBatch({running:true,total:unsumm.length,processed:0,saved:0,skipped:0,errors:0,lastMsg:""});
    const queue = [...unsumm];
    const worker = async () => {
      while (queue.length) {
        const b = queue.shift();
        if (!b) break;
        try {
          const r = await fetch("/api/summarize-bounty", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ bountyId: b.id, ...(campaignStart ? { campaignStart } : {}) }),
          });
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
          if (data.skipped) {
            setSumBatch(s => ({...s, processed: s.processed+1, skipped: s.skipped+1, lastMsg: data.reason}));
          } else if (data.summary) {
            if (onBountySummaryUpdate) await onBountySummaryUpdate(b.id, data.summary, true);
            setSumBatch(s => ({...s, processed: s.processed+1, saved: s.saved+1}));
          } else {
            setSumBatch(s => ({...s, processed: s.processed+1, skipped: s.skipped+1}));
          }
        } catch (e) {
          setSumBatch(s => ({...s, processed: s.processed+1, errors: s.errors+1, lastMsg: e.message}));
        }
      }
    };
    await Promise.all(Array.from({length:3}, worker));
    setSumBatch(s => ({...s, running:false}));
  };
  const generateSummaryOne = async (bountyId, rawContent) => {
    const validDates = (campaigns||[]).map(b=>b.date).filter(Boolean).sort();
    const earliest = validDates[0] || "";
    const campaignStart = (()=>{ if(!earliest) return ""; const d=new Date(earliest); if(isNaN(d.getTime())) return earliest; d.setDate(d.getDate()-30); return d.toISOString().slice(0,10); })();
    const r = await fetch("/api/summarize-bounty", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ bountyId, force: true, ...(rawContent ? { rawContent } : {}), ...(campaignStart ? { campaignStart } : {}) }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
    if (data.skipped) throw new Error(data.reason || "skipped");
    if (data.summary && onBountySummaryUpdate) await onBountySummaryUpdate(bountyId, data.summary, false);
    return data;
  };

  const activeCampaigns = campaigns;

  const canAdd  = !readOnly;
  const canEdit = entry => !readOnly && (currentUser.role==="admin" || entry.author===currentUser.displayName||entry.author===currentUser.username);

  const filtered = useMemo(()=>activeCampaigns.filter(c=>{
    const q = search.toLowerCase();
    const matchQ = !q || (c.title||"").toLowerCase().includes(q)||(c.author||"").toLowerCase().includes(q);
    const matchA = filterAuthor==="all" || c.author===filterAuthor;
    const matchFrom = !filterDateFrom || (c.date||"") >= filterDateFrom;
    const matchTo   = !filterDateTo   || (c.date||"") <= filterDateTo;
    return matchQ && matchA && matchFrom && matchTo;
  }),[activeCampaigns,search,filterAuthor,filterDateFrom,filterDateTo]);

  const [sortKey,setSortKey] = useState("date");
  const [sortDir,setSortDir] = useState("desc");
  const toggleSort = (key)=>{ if(sortKey===key){ setSortDir(d=>d==="asc"?"desc":"asc"); } else { setSortKey(key); setSortDir(key==="title"||key==="author"?"asc":"desc"); } setPage(1); };
  const sortedFiltered = useMemo(()=>{
    const pn=v=>{if(!v)return 0;const s=String(v).replace(/,/g,"").trim();if(/k$/i.test(s))return Math.round(parseFloat(s)*1000);if(/m$/i.test(s))return Math.round(parseFloat(s)*1e6);return parseInt(s)||0;};
    const val=c=> sortKey==="impressions" ? pn(c.twitterImpressions)+pn(c.telegramImpressions)
      : sortKey==="title" ? (c.title||"").toLowerCase()
      : sortKey==="author" ? (c.author||"").toLowerCase()
      : (c.date||"");
    return [...filtered].sort((a,b)=>{const va=val(a),vb=val(b);const cmp=typeof va==="number"?va-vb:String(va).localeCompare(String(vb));return sortDir==="asc"?cmp:-cmp;});
  },[filtered,sortKey,sortDir]);
  const paged = useMemo(()=>sortedFiltered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE),[sortedFiltered,page]);
  const authors = useMemo(()=>[...new Set(activeCampaigns.map(c=>c.author).filter(Boolean))],[activeCampaigns]);
  const dateRange = useMemo(()=>{
    const sortedDates = activeCampaigns.filter(c=>c.date).map(c=>c.date).sort();
    return sortedDates.length?(sortedDates[0]===sortedDates[sortedDates.length-1]?fmtDate(sortedDates[0]):`${fmtDate(sortedDates[0]).split(",")[0]} – ${fmtDate(sortedDates[sortedDates.length-1]).split(",")[0]}`):"—";
  },[activeCampaigns]);

  // CQ Research analytics data

  // CQ Research citations pagination + tier filter
  const [viewCitation,setViewCitation] = useState(null);

  return (
    <>

      {/* Bounty activity chart (All mode only) */}
      {activeCampaigns.length > 1 && (()=>{
        const GranularityToggle = ({value, onChange}) => (
          <div style={{display:"flex",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:2,gap:1}}>
            {[["weekly","Wk"],["daily","Day"]].map(([val,lbl])=>(
              <button key={val} onClick={()=>onChange(val)}
                style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:5,border:"none",background:value===val?"var(--surface)":"transparent",color:value===val?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:value===val?700:400,boxShadow:value===val?"0 1px 3px rgba(0,0,0,0.1)":"none",transition:"all .15s"}}>
                {lbl}
              </button>
            ))}
          </div>
        );

        const BountyChart = () => {
          const [gran, setGran] = useState("daily");
          const weekKey = iso => {
            try {
              const d = new Date(iso+"T00:00:00");
              if(isNaN(d.getTime())) return null;
              const monday = new Date(d);
              monday.setDate(d.getDate() - ((d.getDay()+6)%7));
              return monday.toISOString().slice(0,10);
            } catch { return null; }
          };
          const buckets = {};
          activeCampaigns.forEach(c => {
            const key = gran === "daily" ? c.date : weekKey(c.date);
            if(!key) return;
            if(!buckets[key]) buckets[key] = { period:key, count:0 };
            buckets[key].count++;
          });
          const chartData = Object.values(buckets)
            .sort((a,b)=>a.period.localeCompare(b.period))
            .map(w => {
              const d = new Date(w.period+"T00:00:00");
              return { ...w, label: isNaN(d.getTime()) ? w.period : d.toLocaleDateString("en-US",{month:"short",day:"numeric"}) };
            });

          const authorCounts = {};
          activeCampaigns.forEach(c => { if(c.author) authorCounts[c.author]=(authorCounts[c.author]||0)+1; });
          const topAuthors = Object.entries(authorCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
          const maxAuthor = topAuthors[0]?.[1] || 1;

          return (
            <div className="cq-chart-row" style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:14,marginBottom:20,animation:"fadeUp .5s ease .04s both"}}>
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"16px 20px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{gran==="daily"?"Daily":"Weekly"} Posting Activity</div>
                  <GranularityToggle value={gran} onChange={setGran}/>
                </div>
                {!rcReady?<div className="cq-skel" style={{width:"100%",height:100,borderRadius:8}}/>:
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={chartData} margin={{top:2,right:4,left:-28,bottom:0}}>
                    <defs>
                      <linearGradient id="gbChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                    <XAxis dataKey="label" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fill:"#9ca3af"}} axisLine={false} tickLine={false} interval={Math.max(0,Math.ceil(chartData.length/(gran==="daily"?10:6))-1)}/>
                    <YAxis tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fill:"#9ca3af"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={({active,payload,label})=>active&&payload?.length?(
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:4}}>{label}</div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:"var(--accent)"}}>{payload[0].value} bounties</div>
                      </div>
                    ):null}/>
                    <Area isAnimationActive={false} type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} fill="url(#gbChart)" dot={false} activeDot={{r:3,fill:"var(--accent)"}}/>
                  </AreaChart>
                </ResponsiveContainer>}
              </div>
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"16px 20px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Top Authors</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {topAuthors.map(([name,count],i)=>(
                    <div key={name}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"65%"}}>{name}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--accent)",fontWeight:600}}>{count}</span>
                      </div>
                      <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                        <div style={{width:`${(count/maxAuthor)*100}%`,height:"100%",background:"var(--accent)",opacity:1-i*0.15,borderRadius:99}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        };
        return <BountyChart/>;
      })()}
      {/* Summary stat strip — readout under the chart (chart-first, like Performance) */}
      {(()=>{
        const total = activeCampaigns.length;
        const valid = activeCampaigns.map(c=>c.date).filter(Boolean).sort();
        let weeks = 1;
        if(valid.length>1){ const ms = new Date(valid[valid.length-1]) - new Date(valid[0]); weeks = Math.max(1, Math.round(ms/(7*864e5))); }
        const ac = {};
        activeCampaigns.forEach(c=>{ if(c.author) ac[c.author]=(ac[c.author]||0)+1; });
        const top = Object.entries(ac).sort((a,b)=>b[1]-a[1])[0];
        const stats = [
          {label:"Total Posts", value:total, sub:dateRange},
          {label:"Unique Authors", value:authors.length, sub:"Contributing analysts"},
          {label:"Avg / Week", value:(total/weeks).toFixed(1), sub:"Posting cadence"},
          {label:"Top Author", value:top?top[0]:"\u2014", sub:top?`${top[1]} posts`:"\u2014", small:true},
        ];
        return (
          <div className="cq-statstrip" style={{display:"flex",alignItems:"stretch",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,boxShadow:"var(--shadow-sm)",marginBottom:28,overflow:"hidden",animation:"fadeUp .5s ease both"}}>
            {stats.map((s,i)=>(
              <div key={i} style={{flex:1,minWidth:0,padding:"15px 20px",borderLeft:i?"1px solid var(--border)":"none"}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.label}</div>
                <div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:s.small?18:27,fontWeight:700,color:"var(--text)",lineHeight:s.small?1.5:1,marginTop:s.small?14:10,letterSpacing:"-0.03em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.value}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.sub}</div>
              </div>
            ))}
          </div>
        );
      })()}
      {/* Filter bar */}
      {(()=>{
        const hasFilters = search||filterAuthor!=="all"||filterDateFrom||filterDateTo;
        return (
          <div style={{marginBottom:16,position:"relative",zIndex:20,animation:"fadeUp .5s ease .08s both"}}>
            <div className="cq-filter-bar" style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{position:"relative",flex:1,maxWidth:320}}>
                <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--dim)",pointerEvents:"none"}}><Icons.Search/></div>
                <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search title or author…" style={{...iStyle,padding:"8px 10px 8px 30px",fontSize:11}}/>
              </div>
              <button onClick={()=>setShowFilters(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:`1px solid ${showFilters||hasFilters?"rgba(26,58,92,0.3)":"var(--border)"}`,background:showFilters||hasFilters?"color-mix(in srgb,var(--accent) 8%,transparent)":"var(--surface)",color:showFilters||hasFilters?"var(--accent)":"var(--muted)",cursor:"pointer",transition:"all .15s"}}>
                ⚙ Filters {hasFilters&&<span style={{background:"var(--accent)",color:"#fff",borderRadius:100,padding:"1px 6px",fontSize:9,fontWeight:500}}>{[search,filterAuthor!=="all",filterDateFrom,filterDateTo].filter(Boolean).length}</span>}
              </button>
              {hasFilters&&<button onClick={resetFilters} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"8px 12px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer"}}>Clear</button>}
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginLeft:4}}>{filtered.length} result{filtered.length!==1?"s":""}</span>
              {(()=>{
                const isAdmin = currentUser.role==="admin";
                const unsumCount = filtered.filter(b=>!b.summary && b.cqLink).length;
                const tweetsIn = (arr)=>arr.reduce((n,b)=>n+(b.authorTwitterLink?1:0)+(b.cqTwitterLink?1:0),0); // count tweets, not rows
                const newRows  = filtered.filter(b=>(b.authorTwitterLink||b.cqTwitterLink)&&!String(b.twitterImpressions||"").trim());
                const allRows  = filtered.filter(b=>b.authorTwitterLink||b.cqTwitterLink);
                const newTweets = tweetsIn(newRows);
                const allTweets = tweetsIn(allRows);
                const tgIn = (arr)=>arr.reduce((n,b)=>n+(b.authorTelegramLink?1:0)+(b.telegramLink?1:0),0); // count posts, not rows
                const newTgRows = filtered.filter(b=>(b.authorTelegramLink||b.telegramLink)&&!String(b.telegramImpressions||"").trim());
                const allTgRows = filtered.filter(b=>b.authorTelegramLink||b.telegramLink);
                const newTgPosts = tgIn(newTgRows);
                const allTgPosts = tgIn(allTgRows);
                const busy = sumBatch.running||impBatch.running||tgBatch.running;
                const items = [
                  canAdd && {label:"＋ Add entry", title:"Add a new bounty", onClick:()=>{setEdit(null);setShowForm(true);}},
                  isAdmin && onBountySummaryUpdate && {label:sumBatch.running?`Summarizing ${sumBatch.processed}/${sumBatch.total}…`:`📝 Summarize bounties (${unsumCount})`, running:sumBatch.running, disabled:busy||unsumCount===0, title:"Generate AI summaries for bounties without one",
                    onClick:()=>{if(!window.confirm(`Generate summaries for ${unsumCount} bounty${unsumCount!==1?"s":""}? Uses RSS (free) with ScrapingBee fallback (~10 credits each). Est: ~$${(unsumCount*0.001).toFixed(2)} on Haiku.`))return;runSummarize(filtered);}},
                  isAdmin && onBountyImpressionsUpdate && {label:impBatch.running?`Fetching ${impBatch.total}…`:<><Icons.X s={11}/> Fetch new impressions ({newTweets})</>, running:impBatch.running, disabled:busy||newTweets===0, title:"Fetch impressions for tweets not synced yet",
                    onClick:()=>{if(!window.confirm(`Fetch live X/Twitter impressions for ${newTweets} tweet${newTweets!==1?"s":""} across ${newRows.length} new bounty${newRows.length!==1?"s":""} (no impressions recorded yet)? Pulls the analyst + CQ tweet via the X API and writes the combined total. Already-fetched bounties are skipped.`))return;runImpressions(filtered,{force:false});}},
                  isAdmin && onBountyImpressionsUpdate && {label:<>↻ Refresh all <Icons.X s={11}/> impressions ({allTweets})</>, disabled:busy||allTweets===0, title:"Re-pull and overwrite impressions for every tweet (latest counts)",
                    onClick:()=>{if(!window.confirm(`Force-refresh impressions for ALL ${allTweets} tweet${allTweets!==1?"s":""} across ${allRows.length} bounty${allRows.length!==1?"s":""}? This re-pulls every tweet via the X API and OVERWRITES existing numbers with the latest counts.`))return;runImpressions(filtered,{force:true});}},
                  isAdmin && onBountyTgUpdate && {label:tgBatch.running?`Fetching ${tgBatch.total}…`:<><Icons.Telegram s={11}/> Fetch new Telegram views ({newTgPosts})</>, running:tgBatch.running, disabled:busy||newTgPosts===0, title:"Fetch Telegram post views not synced yet",
                    onClick:()=>{if(!window.confirm(`Fetch Telegram views for ${newTgPosts} post${newTgPosts!==1?"s":""} across ${newTgRows.length} new bounty${newTgRows.length!==1?"s":""} (no views recorded yet)? Scrapes public channel view counts and writes the combined total. Already-fetched bounties are skipped.`))return;runTgImpressions(filtered,{force:false});}},
                  isAdmin && onBountyTgUpdate && {label:<>↻ Refresh all <Icons.Telegram s={11}/> views ({allTgPosts})</>, disabled:busy||allTgPosts===0, title:"Re-scrape and overwrite Telegram views for every post",
                    onClick:()=>{if(!window.confirm(`Force-refresh Telegram views for ALL ${allTgPosts} post${allTgPosts!==1?"s":""} across ${allTgRows.length} bounty${allTgRows.length!==1?"s":""}? Re-scrapes every public post and OVERWRITES existing numbers.`))return;runTgImpressions(filtered,{force:true});}},
                  isAdmin && activeCampaigns.length>0 && {label:"🗑 Delete all bounties", danger:true, disabled:busy, title:"Delete every bounty in this campaign",
                    onClick:()=>{const cid=activeCampaigns[0]?.campaignId;if(cid&&window.confirm(`Delete all bounties for this campaign? This cannot be undone.`)){onDeleteAll&&onDeleteAll(cid);}}},
                ].filter(Boolean);
                if(!items.length) return null;
                return <div style={{marginLeft:"auto"}}><AdminMenu items={items}/></div>;
              })()}
            </div>
            {(sumBatch.running||sumBatch.processed>0||sumBatch.lastMsg)&&(
              <div style={{marginTop:10,padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                {sumBatch.running?(
                  <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:200}}>
                    <div style={{flex:1,height:4,borderRadius:4,background:"var(--border)",overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${sumBatch.total?(sumBatch.processed/sumBatch.total)*100:0}%`,background:"var(--accent)",transition:"width .3s"}}/>
                    </div>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--muted)",whiteSpace:"nowrap"}}>{sumBatch.processed}/{sumBatch.total}</span>
                  </div>
                ):(
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--muted)"}}>
                    {sumBatch.total>0?`Summarize done · `:""}
                    <b style={{color:"var(--accent)"}}>{sumBatch.saved} saved</b> · {sumBatch.skipped} skipped · {sumBatch.errors} errors
                    {sumBatch.lastMsg && ` · ${sumBatch.lastMsg}`}
                  </span>
                )}
                {!sumBatch.running && sumBatch.processed>0 && (
                  <button onClick={()=>setSumBatch({running:false,total:0,processed:0,saved:0,skipped:0,errors:0,lastMsg:""})}
                    style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer",marginLeft:"auto"}}>dismiss</button>
                )}
              </div>
            )}
            {(impBatch.running||impBatch.saved>0||impBatch.lastMsg)&&(
              <div style={{marginTop:10,padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--muted)"}}>
                  {impBatch.running
                    ? `Fetching X impressions for ${impBatch.total} bounties…`
                    : <>{`Impressions done · `}<b style={{color:"var(--accent)"}}>{impBatch.saved} updated</b> · {impBatch.skipped} skipped{impBatch.lastMsg && ` · ${impBatch.lastMsg}`}</>}
                </span>
                {!impBatch.running && (impBatch.saved>0||impBatch.lastMsg) && (
                  <button onClick={()=>setImpBatch({running:false,total:0,saved:0,skipped:0,lastMsg:""})}
                    style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer",marginLeft:"auto"}}>dismiss</button>
                )}
              </div>
            )}
            {(tgBatch.running||tgBatch.saved>0||tgBatch.lastMsg)&&(
              <div style={{marginTop:10,padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--muted)"}}>
                  {tgBatch.running
                    ? `Fetching Telegram views for ${tgBatch.total} bounties…`
                    : <>{`Telegram views done · `}<b style={{color:"var(--accent)"}}>{tgBatch.saved} updated</b> · {tgBatch.skipped} skipped{tgBatch.lastMsg && ` · ${tgBatch.lastMsg}`}</>}
                </span>
                {!tgBatch.running && (tgBatch.saved>0||tgBatch.lastMsg) && (
                  <button onClick={()=>setTgBatch({running:false,total:0,saved:0,skipped:0,lastMsg:""})}
                    style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer",marginLeft:"auto"}}>dismiss</button>
                )}
              </div>
            )}
            {showFilters&&(
              <div style={{marginTop:10,padding:"14px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:140}}>
                  <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Author</span>
                  <select value={filterAuthor} onChange={e=>{setFA(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                    <option value="all">All Authors</option>
                    {authors.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>From</span>
                  <input type="date" value={filterDateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>To</span>
                  <input type="date" value={filterDateTo} onChange={e=>{setDateTo(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
              </div>
            )}
            {hasFilters&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                {search&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>"{search}"</span>}
                {filterAuthor!=="all"&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>{filterAuthor}</span>}
                {filterDateFrom&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>From {filterDateFrom}</span>}
                {filterDateTo&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>To {filterDateTo}</span>}
              </div>
            )}
          </div>
        );
      })()}
      <div className="cq-table-scroll"><div style={{minWidth:600}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)",animation:"fadeUp .5s ease .12s both"}}>
        <div style={{display:"grid",gridTemplateColumns:"84px 1fr 124px 64px",padding:"11px 20px",borderBottom:"2px solid var(--border)",background:"var(--surface3)"}}>
          {[{l:"Date",k:"date"},{l:"Title & Links",k:"title"},{l:"Impressions",k:"impressions"},{l:"Author",k:"author"}].map((h,hi)=>(
            <div key={hi} onClick={()=>toggleSort(h.k)} title={`Sort by ${h.l}`}
              style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.08em",color:sortKey===h.k?"var(--accent)":"var(--muted)",textTransform:"uppercase",textAlign:(h.l==="Author"||h.l==="Impressions")?"center":"left",cursor:"pointer",userSelect:"none",transition:"color .15s"}}
              onMouseEnter={e=>{if(sortKey!==h.k)e.currentTarget.style.color="var(--text)"}}
              onMouseLeave={e=>{if(sortKey!==h.k)e.currentTarget.style.color="var(--muted)"}}>
              {h.l}{sortKey===h.k&&<span style={{marginLeft:4,fontSize:8}}>{sortDir==="asc"?"▲":"▼"}</span>}
            </div>
          ))}
        </div>
        {!activeCampaigns.length
          ? <div style={{textAlign:"center",padding:"60px 20px"}}>
              <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⬡</div>
              <div style={{fontSize:14,fontWeight:500,color:"var(--muted)",marginBottom:6}}>No entries yet</div>
              {canAdd&&<button onClick={()=>{setEdit(null);setShowForm(true)}} style={{marginTop:16,display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--accent)",cursor:"pointer"}}><Icons.Plus/>ADD FIRST ENTRY</button>}
            </div>
          : filtered.length===0
            ? <div style={{textAlign:"center",padding:"48px 20px"}}>
                <div style={{fontSize:24,marginBottom:8,opacity:.25}}>⬡</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"var(--muted)",marginBottom:4}}>No matches</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>Try clearing filters or widening the date range</div>
              </div>
            : paged.map((c,i)=>{
                const ac=getAuthorColor(c.author);
                const dp=fmtDate(c.date).split(", ");
                const imprN=Number(String(c.twitterImpressions||"").replace(/,/g,""));
                const imprTxt=c.twitterImpressions&&!isNaN(imprN)?imprN.toLocaleString():"—";
                const tgN=Number(String(c.telegramImpressions||"").replace(/,/g,""));
                const tgTxt=c.telegramImpressions&&!isNaN(tgN)?tgN.toLocaleString():"—";
                return (
                  <div key={c.id} onClick={()=>setView(c)}
                    style={{display:"grid",gridTemplateColumns:"84px 1fr 124px 64px",padding:"14px 20px",borderBottom:"1px solid var(--border)",alignItems:"center",cursor:"pointer",transition:"background .15s",animation:`rowIn .3s ease ${i*.025}s both`,background:"transparent"}}
                    onMouseEnter={e=>e.currentTarget.style.background="color-mix(in srgb,var(--accent) 6%,transparent)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,letterSpacing:"-0.02em",color:"var(--muted)",whiteSpace:"nowrap"}}>
                      {c.date?`${dp[0]} '${(dp[1]||"").slice(2)}`:"—"}
                    </div>
                    <div style={{paddingRight:14,minWidth:0}}>
                      <div title={c.title||""} style={{fontSize:12,fontWeight:500,lineHeight:1.4,color:"color-mix(in srgb,var(--text) 72%,var(--muted))",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{c.title}</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                        {c.cqLink&&<a href={c.cqLink} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",textDecoration:"none"}}>Quicktake↗</a>}
                        {c.analyticsLink&&<a href={c.analyticsLink} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",textDecoration:"none"}}>Analytics↗</a>}
                        {c.authorTwitterLink&&<a href={c.authorTwitterLink} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",textDecoration:"none"}}>Author X↗</a>}
                        {c.authorTelegramLink&&<a href={c.authorTelegramLink} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",textDecoration:"none"}}>Author TG↗</a>}
                        {c.cqTwitterLink&&<a href={c.cqTwitterLink} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",textDecoration:"none"}}>CQ X↗</a>}
                        {c.telegramLink&&<a href={c.telegramLink} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",textDecoration:"none"}}>CQ TG↗</a>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"'JetBrains Mono',monospace"}}>
                      {imprTxt!=="—"&&<span title={`${imprTxt} X impressions`} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600}}><span style={{color:"var(--dim)",display:"inline-flex"}}><Icons.X s={10}/></span><span style={{color:"color-mix(in srgb,var(--text) 72%,var(--muted))"}}>{imprTxt}</span></span>}
                      {tgTxt!=="—"&&<span title={`${tgTxt} Telegram views`} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:11,fontWeight:600}}><span style={{color:"var(--dim)",display:"inline-flex"}}><Icons.Telegram s={10}/></span><span style={{color:"color-mix(in srgb,var(--text) 72%,var(--muted))"}}>{tgTxt}</span></span>}
                      {imprTxt==="—"&&tgTxt==="—"&&<span style={{color:"var(--dim)",fontSize:11,opacity:.45}}>—</span>}
                    </div>
                    <div style={{minWidth:0,display:"flex",justifyContent:"center"}} onClick={e=>e.stopPropagation()}>
                      {c.author
                        ? <button onClick={()=>window.dispatchEvent(new CustomEvent("cq-nav-author",{detail:{name:c.author,cid:c.campaignId}}))} className="cq-tip" data-tip={c.author}
                            style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:600,padding:0,background:ac.bg,color:ac.color,border:"1px solid var(--border2)",cursor:"pointer",transition:"all .15s"}}
                            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.transform="scale(1.12)";}}
                            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.transform="scale(1)";}}>{initials(c.author)}</button>
                        : <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",opacity:.45}}>—</span>}
                    </div>
                  </div>
                );
              })
        }
        <Pagination page={page} total={sortedFiltered.length} onChange={p=>{setPage(p);window.scrollTo({top:0,behavior:'smooth'})}}/>
      </div>
      </div></div>
      {viewCitation&&<CitationDetailModal entry={citations.find(c=>c.id===viewCitation.id)||viewCitation} canEdit={currentUser.role==="admin"} onEdit={()=>{}} onClose={()=>setViewCitation(null)} bounties={campaigns} onCitedBountyUpdate={onCitedBountyUpdate}/>}
      {view&&<BountyDetailModal entry={campaigns.find(b=>b.id===view.id)||view} canEdit={canEdit(view)} onEdit={()=>{setEdit(view);setShowForm(true);setView(null);}} onDelete={()=>{setConfId(view.id);setView(null);}} onClose={()=>setView(null)} onGenerateSummary={onBountySummaryUpdate?generateSummaryOne:null} citations={citations} onCitedBountyUpdate={onCitedBountyUpdate}/>}
      {showForm&&<CampForm initial={editEntry} isEdit={!!editEntry} onSave={async f=>{await onSave(f,editEntry);setShowForm(false);setEdit(null)}} onClose={()=>{setShowForm(false);setEdit(null)}} currentUser={currentUser}/>}
      {confirmId&&<ConfirmDelete onConfirm={()=>{onDelete(confirmId);setConfId(null)}} onCancel={()=>setConfId(null)}/>}
    </>
  );
};

// ─────────────────────────────────────────────────────────
//  CITATION DETAIL MODAL
// ─────────────────────────────────────────────────────────
const CitationDetailModal = ({entry, onEdit, onDelete, onClose, canEdit:isEditable, bounties, onCitedBountyUpdate}) => {
  const mc = getPaletteColor(AUTHOR_PALETTE,"media",entry.media||"?");
  const [matchState, setMatchState] = useState({loading:false, result:null, error:null});
  const [savingId, setSavingId] = useState(null);
  const [bountySearch, setBountySearch] = useState("");
  const currentCitedBounty = entry.citedBountyId && bounties ? bounties.find(b => b.id === entry.citedBountyId) : null;
  const saveMatch = async (bountyId) => {
    if (!onCitedBountyUpdate) return;
    setSavingId(bountyId);
    try { await onCitedBountyUpdate(entry.id, bountyId); }
    finally { setSavingId(null); }
  };
  const bountySearchResults = useMemo(()=>{
    if (!Array.isArray(bounties) || bounties.length === 0) return [];
    const q = bountySearch.trim().toLowerCase();
    if (!q) return [];
    return bounties
      .filter(b => {
        const hay = `${b.title||""} ${b.author||""} ${b.asset||""}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 12);
  },[bounties, bountySearch]);
  const runMatch = async () => {
    setMatchState({loading:true, result:null, error:null});
    try {
      const r = await fetch("/api/match-bounty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleLink: entry.articleLink || "",
          campaignId: entry.campaignId || "",
          citationDate: entry.date || "",
          citationAuthor: entry.author || "",
          citationHeadline: entry.headline || "",
          citationTopic: entry.topic || "",
          citationAsset: entry.asset || "",
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
      setMatchState({loading:false, result:data, error:null});
    } catch (e) {
      setMatchState({loading:false, result:null, error:e.message});
    }
  };
  const InfoBlock = ({label, value, full=false}) => !value ? null : (
    <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)",gridColumn:full?"1/-1":"auto"}}>
      <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
      <div style={{fontSize:13,fontWeight:500,wordBreak:"break-word"}}>{value}</div>
    </div>
  );
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:10,boxShadow:"0 20px 60px rgba(0,0,0,0.15)",width:"min(var(--modal-md),100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",position:"relative",animation:"modalIn .2s ease"}}>
        {/* Header */}
        <div style={{padding:"24px 28px 16px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>// media citation</div>
          <h2 style={{fontSize:16,fontWeight:500,lineHeight:1.4,paddingRight:24}}>{entry.headline||entry.topic||"—"}</h2>
          {entry.headline&&entry.topic&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:4}}>{entry.topic}</div>}
        </div>
        {/* Scrollable body */}
        <div style={{overflowY:"auto",padding:"20px 28px",flex:1}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <InfoBlock label="Date" value={fmtDate(entry.date)}/>
            <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Media Outlet</div>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:500,background:mc.bg,color:mc.color,border:"1px solid var(--border2)",flexShrink:0}}>{initials(entry.media)}</div>
                <span style={{fontSize:13,fontWeight:500}}>{entry.media||"—"}</span>
              </div>
            </div>
            <InfoBlock label="Reporter" value={entry.reporter}/>
            <InfoBlock label="Author" value={entry.author}/>
            <InfoBlock label="Headline" value={entry.headline} full/>
            <InfoBlock label="Media Tier" value={entry.mediaTier}/>
            <InfoBlock label="Direct Relationship" value={entry.directRelationship}/>
            <InfoBlock label="Language" value={entry.language}/>
            <InfoBlock label="Asset" value={entry.asset}/>
            <InfoBlock label="Branding" value={entry.branding}/>
          </div>
          {entry.articleLink&&(
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Article Link</div>
              <a href={entry.articleLink} target="_blank" rel="noreferrer"
                style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"6px 14px",borderRadius:8,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",color:"var(--accent)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
                Open Article ↗
              </a>
            </div>
          )}
          {currentCitedBounty && (
            <div style={{marginBottom:16,padding:"10px 12px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"rgba(15,118,110,0.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Cited Bounty</div>
                {isEditable && onCitedBountyUpdate && (
                  <button onClick={()=>saveMatch("")} disabled={savingId!==null}
                    style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:savingId!==null?"wait":"pointer"}}>
                    clear
                  </button>
                )}
              </div>
              <div style={{fontSize:12,fontWeight:500,marginBottom:3}}>{currentCitedBounty.title||"(untitled)"}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:6}}>
                {currentCitedBounty.author||"—"} · {fmtDate(currentCitedBounty.date)}{currentCitedBounty.asset?` · ${currentCitedBounty.asset}`:""}
              </div>
              {currentCitedBounty.cqLink && (
                <a href={currentCitedBounty.cqLink} target="_blank" rel="noreferrer"
                  style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"4px 10px",borderRadius:6,background:"rgba(15,118,110,0.1)",border:"1px solid color-mix(in srgb,var(--accent) 24%,transparent)",color:"var(--accent)",textDecoration:"none",display:"inline-flex"}}>
                  Open Bounty ↗
                </a>
              )}
            </div>
          )}
          {isEditable && entry.articleLink && entry.campaignId && (
            <div style={{marginBottom:16,padding:"14px 16px",borderRadius:8,border:"1px dashed var(--border2)",background:"var(--surface2)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:matchState.result||matchState.error?10:0}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Bounty Match</div>
                <button onClick={runMatch} disabled={matchState.loading}
                  style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:6,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:matchState.loading?"wait":"pointer",fontWeight:500}}>
                  {matchState.loading?"MATCHING…":"🔗 FIND CITED BOUNTY"}
                </button>
              </div>
              {matchState.error && (
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"#b91c1c",marginTop:8}}>Error: {matchState.error}</div>
              )}
              {matchState.result && (
                <div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:8}}>
                    method: <b>{matchState.result.method}</b>
                    {matchState.result.bountiesChecked!=null && ` · ${matchState.result.bountiesChecked} bounties`}
                    {matchState.result.candidatesConsidered!=null && ` → ${matchState.result.candidatesConsidered} candidates`}
                    {matchState.result.authorFiltered && ` (author-filtered)`}
                    {matchState.result.assetFiltered && ` (asset:${entry.asset||"—"})`}
                    {matchState.result.articleFetched===false && ` · article fetch failed`}
                    {matchState.result.articleExcerptLength!=null && ` · ${matchState.result.articleExcerptLength} char excerpt`}
                    {matchState.result.fetchSource==="scrapingbee" && ` · via ScrapingBee`}
                    {matchState.result.fetchSource==="scrapingbee+js" && ` · via ScrapingBee+JS`}
                    {matchState.result.fetchError && ` (${matchState.result.fetchError})`}
                    {matchState.result.usage && ` · ${matchState.result.usage.input_tokens}+${matchState.result.usage.output_tokens} tok`}
                    {matchState.result.hallucinatedIds>0 && ` · ${matchState.result.hallucinatedIds} invalid IDs dropped`}
                  </div>
                  {matchState.result.matches.length === 0 ? (
                    <>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--muted)",marginBottom:8}}>
                        No match — {
                          matchState.result.bountiesChecked === 0 ? "this campaign has no bounties" :
                          matchState.result.candidatesConsidered === 0 ? "no candidate bounties after filtering" :
                          "model couldn't find a confident match"
                        }
                      </div>
                      {matchState.result.candidatePool?.length > 0 && (
                        <details style={{marginTop:8}}>
                          <summary style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:9,color:"var(--dim)",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.08em"}}>Considered candidates ({matchState.result.candidatePool.length})</summary>
                          <div style={{maxHeight:280,overflowY:"auto",marginTop:6,padding:"6px 8px",background:"var(--surface)",borderRadius:6,border:"1px solid var(--border)"}}>
                            {matchState.result.candidatePool.map(c => (
                              <div key={c.bountyId} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--muted)",marginBottom:3,lineHeight:1.4}}>
                                <span style={{display:"inline-block",width:22,color:"var(--dim)"}}>#{c.n}</span>
                                <span style={{color:"var(--text)"}}>{c.title}</span>
                                <span style={{color:"var(--dim)"}}> — {c.author||"—"} · {c.date}{c.asset?` · ${c.asset}`:""}{c.hasSummary?" · 📝":""}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {matchState.result.matches.map(m => (
                        <div key={m.bountyId} style={{padding:"10px 12px",background:"var(--surface)",borderRadius:6,border:"1px solid var(--border)"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8,marginBottom:4}}>
                            <div style={{fontSize:12,fontWeight:500,lineHeight:1.35}}>{m.title||"(untitled)"}</div>
                            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,flexShrink:0,
                              background: m.confidence==="high"?"rgba(15,118,110,0.1)":m.confidence==="medium"?"rgba(234,179,8,0.12)":"rgba(100,116,139,0.1)",
                              color: m.confidence==="high"?"var(--accent)":m.confidence==="medium"?"#a16207":"var(--muted)",
                              border: m.confidence==="high"?"1px solid color-mix(in srgb,var(--accent) 24%,transparent)":m.confidence==="medium"?"1px solid rgba(234,179,8,0.3)":"1px solid rgba(100,116,139,0.25)"
                            }}>{m.confidence}</span>
                          </div>
                          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:6}}>
                            {m.author||"—"} · {fmtDate(m.date)}{m.asset?` · ${m.asset}`:""}
                          </div>
                          {m.reason && <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.45,fontStyle:"italic"}}>{m.reason}</div>}
                          <div style={{display:"flex",gap:8,alignItems:"center",marginTop:6}}>
                            {m.cqLink && <a href={m.cqLink} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",textDecoration:"none"}}>View bounty ↗</a>}
                            {isEditable && onCitedBountyUpdate && entry.citedBountyId !== m.bountyId && (
                              <button onClick={()=>saveMatch(m.bountyId)} disabled={savingId!==null}
                                style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:5,border:"1px solid color-mix(in srgb,var(--accent) 28%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--accent)",cursor:savingId!==null?"wait":"pointer",fontWeight:500}}>
                                {savingId===m.bountyId?"SAVING…":"SAVE AS CITED"}
                              </button>
                            )}
                            {entry.citedBountyId === m.bountyId && (
                              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600}}>✓ saved</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {isEditable && onCitedBountyUpdate && Array.isArray(bounties) && bounties.length > 0 && (
            <div style={{marginBottom:16,padding:"14px 16px",borderRadius:8,border:"1px dashed var(--border2)",background:"var(--surface2)"}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Manual Link</div>
              <input value={bountySearch} onChange={e=>setBountySearch(e.target.value)}
                placeholder="Search bounties by title, author, or asset…"
                style={{width:"100%",fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"7px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--text)",boxSizing:"border-box"}}/>
              {bountySearch.trim() && (
                <div style={{marginTop:8,maxHeight:280,overflowY:"auto",border:"1px solid var(--border)",borderRadius:6,background:"var(--surface)"}}>
                  {bountySearchResults.length === 0 ? (
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",fontStyle:"italic",padding:"10px 12px"}}>No bounties match "{bountySearch}"</div>
                  ) : (
                    bountySearchResults.map((b,i) => {
                      const isCurrent = entry.citedBountyId === b.id;
                      return (
                        <div key={b.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderBottom:i<bountySearchResults.length-1?"1px solid var(--border)":"none",background:"transparent"}}>
                          <div style={{flex:1,minWidth:0}}>
                            <div title={b.title||""} style={{fontSize:11,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.title||"(untitled)"}</div>
                            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:1}}>
                              {b.author||"—"} · {fmtDate(b.date)}{b.asset?` · ${b.asset}`:""}
                            </div>
                          </div>
                          {isCurrent ? (
                            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600,whiteSpace:"nowrap"}}>✓ saved</span>
                          ) : (
                            <button onClick={()=>saveMatch(b.id)} disabled={savingId!==null}
                              style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"4px 10px",borderRadius:5,border:"1px solid color-mix(in srgb,var(--accent) 28%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--accent)",cursor:savingId!==null?"wait":"pointer",fontWeight:500,whiteSpace:"nowrap"}}>
                              {savingId===b.id?"SAVING…":"LINK"}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{padding:"14px 28px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
          {isEditable&&typeof onDelete==="function"&&<button onClick={onDelete} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 18px",borderRadius:8,border:"1px solid rgba(220,38,38,0.28)",background:"rgba(220,38,38,0.07)",color:"var(--red)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:6,marginRight:"auto"}}><Icons.Trash/> Delete</button>}
          <button onClick={onClose} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 16px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>Close</button>
          {isEditable&&<button onClick={onEdit} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 18px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:6}}><Icons.Edit/> Edit</button>}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  MEDIA TABLE (role-aware)
// ─────────────────────────────────────────────────────────
const MEDIA_EMPTY={date:"",media:"",reporter:"",author:"",topic:"",articleLink:"",headline:"",mediaTier:"",directRelationship:"",language:"",asset:"",branding:""};
const MediaForm = ({initial,isEdit,onSave,onClose}) => {
  const [form,setForm]=useState({...MEDIA_EMPTY,...initial});
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleSave=async()=>{if(!form.media?.trim()){alert("Media outlet required.");return;}setSaving(true);await onSave(form);setSaving(false);};
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",justifyContent:"flex-end"}}>
      <div style={{background:"var(--surface)",borderLeft:"1px solid var(--border)",boxShadow:"-4px 0 32px rgba(13,21,32,0.12)",width:"min(480px,100vw)",height:"100vh",overflowY:"auto",overflowX:"hidden",padding:"32px 30px 48px",position:"relative",animation:"slideIn .22s cubic-bezier(0.22,1,0.36,1)",display:"flex",flexDirection:"column",gap:0}}>
        <button onClick={onClose} style={{position:"absolute",top:16,right:16,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase",marginBottom:6}}>//{isEdit?"edit":"new"} media citation</div>
        <div style={{fontSize:18,fontWeight:500,marginBottom:24}}>{isEdit?"Edit Citation":"Add Media Citation"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="Date"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={iStyle}/></Field>
          <Field label="Media *"><input value={form.media||""} onChange={e=>set("media",e.target.value)} placeholder="e.g. CoinDesk, Benzinga" style={iStyle}/></Field>
          <Field label="Reporter"><input value={form.reporter||""} onChange={e=>set("reporter",e.target.value)} placeholder="Reporter name" style={iStyle}/></Field>
          <Field label="Author"><input value={form.author||""} onChange={e=>set("author",e.target.value)} placeholder="e.g. DarkFost" style={iStyle}/></Field>
          <Field label="Topic" full><input value={form.topic||""} onChange={e=>set("topic",e.target.value)} placeholder="e.g. Bitcoin ETF, Stablecoin" style={iStyle}/></Field>
          <Field label="Headline" full><input value={form.headline||""} onChange={e=>set("headline",e.target.value)} placeholder="Full article headline" style={iStyle}/></Field>
          <Field label="Article Link" full><input type="url" value={form.articleLink||""} onChange={e=>set("articleLink",e.target.value)} placeholder="https://…" style={iStyle}/></Field>
          <div style={{paddingTop:12,borderTop:"1px solid var(--border)",marginTop:4}}>
            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Campaign-Specific Fields</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",gap:10}}>
                <Field label="Media Tier"><input value={form.mediaTier||""} onChange={e=>set("mediaTier",e.target.value)} placeholder="e.g. Tier 1" style={iStyle}/></Field>
                <Field label="Language"><input value={form.language||""} onChange={e=>set("language",e.target.value)} placeholder="e.g. English" style={iStyle}/></Field>
              </div>
              <div style={{display:"flex",gap:10}}>
                <Field label="Asset"><input value={form.asset||""} onChange={e=>set("asset",e.target.value)} placeholder="e.g. BTC, ETH" style={iStyle}/></Field>
                <Field label="Branding"><input value={form.branding||""} onChange={e=>set("branding",e.target.value)} placeholder="Yes / No" style={iStyle}/></Field>
              </div>
              <Field label="Direct Relationship"><input value={form.directRelationship||""} onChange={e=>set("directRelationship",e.target.value)} placeholder="Yes / No" style={iStyle}/></Field>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:24,paddingTop:20,borderTop:"1px solid var(--border)"}}>
          <button onClick={onClose} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
          <button onClick={handleSave} disabled={saving} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 22px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--orange)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:7}}>{saving?<><Icons.Spin/>SAVING…</>:"SAVE CITATION"}</button>
        </div>
      </div>
    </div>
  );
};

const MediaTable = ({citations,onSave,onDelete,onDeleteAll,currentUser,readOnly,bounties,onCitedBountyUpdate}) => {
  const rcReady = useRecharts();
  const [batch,setBatch] = useState({running:false, total:0, processed:0, saved:0, skipped:0, errors:0, lastMsg:""});
  const [search,setSearch]=useState("");
  const [filterAuthor,setFA]=useState("all");
  const [filterMedia,setFM]=useState("all");
  const [filterTier,setFT]=useState("all");
  const [filterDateFrom,setDateFrom]=useState("");
  const [filterDateTo,setDateTo]=useState("");
  const [filterLink,setFilterLink]=useState("all"); // all | linked | unlinked
  const [showForm,setShowForm]=useState(false);
  const [editEntry,setEdit]=useState(null);
  const [confirmId,setConfId]=useState(null);
  const [view,setView]=useState(null);
  const [page,setPage]=useState(1);
  const [showFilters,setShowFilters]=useState(false);
  const resetFilters=()=>{setSearch("");setFA("all");setFM("all");setFT("all");setDateFrom("");setDateTo("");setFilterLink("all");setPage(1);};
  const runAutoMatch = async (scope) => {
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])/.test(window.location.hostname);
    if (isLocal) {
      setBatch({running:false, total:0, processed:0, saved:0, skipped:0, errors:0, lastMsg:"Auto-match runs only on the deployed site — the /api functions aren't served by the local dev server. Try it on the live URL."});
      return;
    }
    const unlinked = scope.filter(c => !c.citedBountyId && c.articleLink && c.campaignId);
    if (!unlinked.length) {
      setBatch({running:false, total:0, processed:0, saved:0, skipped:0, errors:0, lastMsg:"No unlinked citations with an article link."});
      return;
    }
    setBatch({running:true, total:unlinked.length, processed:0, saved:0, skipped:0, errors:0, lastMsg:""});
    const CONCURRENCY = 3;
    const queue = [...unlinked];
    const worker = async () => {
      while (queue.length) {
        const cit = queue.shift();
        if (!cit) break;
        try {
          const r = await fetch("/api/match-bounty", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({
              articleLink: cit.articleLink || "",
              campaignId: cit.campaignId || "",
              citationDate: cit.date || "",
              citationAuthor: cit.author || "",
              citationHeadline: cit.headline || "",
              citationTopic: cit.topic || "",
              citationAsset: cit.asset || "",
            }),
          });
          let data;
          try { data = await r.json(); }
          catch { throw new Error(`Match service unavailable (HTTP ${r.status})`); }
          if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
          const top = data.matches?.[0];
          const autoSave = top && top.bountyId && (
            data.method === "url" ||
            data.method === "title-match" ||
            data.method === "author-singleton" ||
            // High confidence always; a single (unambiguous) medium match too —
            // common for CQ Research pickups where many bounties share an asset/topic.
            (data.method === "llm" && (top.confidence === "high" || (top.confidence === "medium" && data.matches.length === 1)))
          );
          if (autoSave) {
            await onCitedBountyUpdate(cit.id, top.bountyId, true);
            setBatch(b => ({...b, processed: b.processed+1, saved: b.saved+1}));
          } else {
            setBatch(b => ({...b, processed: b.processed+1, skipped: b.skipped+1}));
          }
        } catch (e) {
          setBatch(b => ({...b, processed: b.processed+1, errors: b.errors+1, lastMsg: e.message}));
        }
      }
    };
    await Promise.all(Array.from({length: CONCURRENCY}, worker));
    setBatch(b => ({...b, running:false}));
  };
  const canAdd=!readOnly;
  const canEdit=entry=>{
    if(readOnly)return false;
    if(currentUser.role==="admin")return true;
    if(currentUser.role==="author"){const name=(currentUser.displayName||currentUser.username).toLowerCase();return(entry.author||"").toLowerCase()===name;}
    return false;
  };
  const filtered=useMemo(()=>citations.filter(c=>{
    const q=search.toLowerCase();
    const matchQ=!q||c.media?.toLowerCase().includes(q)||c.reporter?.toLowerCase().includes(q)||c.author?.toLowerCase().includes(q)||c.topic?.toLowerCase().includes(q);
    const matchA=filterAuthor==="all"||c.author===filterAuthor;
    const matchM=filterMedia==="all"||c.media===filterMedia;
    const matchT=filterTier==="all"||(c.mediaTier||"").trim()===filterTier;
    const matchFrom=!filterDateFrom||(c.date||"")>=filterDateFrom;
    const matchTo=!filterDateTo||(c.date||"")<=filterDateTo;
    const matchLink=filterLink==="all"||(filterLink==="linked"?!!c.citedBountyId:!c.citedBountyId);
    return matchQ&&matchA&&matchM&&matchT&&matchFrom&&matchTo&&matchLink;
  }),[citations,search,filterAuthor,filterMedia,filterTier,filterDateFrom,filterDateTo,filterLink]);
  const [sortKey,setSortKey]=useState("date");
  const [sortDir,setSortDir]=useState("desc");
  const toggleSort=(key)=>{ if(sortKey===key){ setSortDir(d=>d==="asc"?"desc":"asc"); } else { setSortKey(key); setSortDir(key==="date"?"desc":"asc"); } setPage(1); };
  const sortedFiltered=useMemo(()=>{
    const val=c=> sortKey==="tier" ? (parseInt((String(c.mediaTier||"").match(/\d/)||[])[0]||"9",10))
      : sortKey==="headline" ? (c.headline||c.topic||"").toLowerCase()
      : sortKey==="media" ? (c.media||"").toLowerCase()
      : sortKey==="author" ? (c.author||"").toLowerCase()
      : (c.date||"");
    return [...filtered].sort((a,b)=>{const va=val(a),vb=val(b);const cmp=typeof va==="number"?va-vb:String(va).localeCompare(String(vb));return sortDir==="asc"?cmp:-cmp;});
  },[filtered,sortKey,sortDir]);
  const paged=useMemo(()=>sortedFiltered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[sortedFiltered,page]);
  const medias=useMemo(()=>[...new Set(citations.map(c=>c.media).filter(Boolean))],[citations]);
  const authors=useMemo(()=>[...new Set(citations.map(c=>c.author).filter(Boolean))],[citations]);
  const tiers=useMemo(()=>[...new Set(citations.map(c=>(c.mediaTier||"").trim()).filter(Boolean))].sort(),[citations]);
  const COLS="84px 1fr 15% 70px 64px";
  return (
    <>
      {/* Media activity charts */}
      {citations.length > 1 && (()=>{
        const GranularityToggle = ({value, onChange}) => (
          <div style={{display:"flex",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:2,gap:1}}>
            {[["weekly","Wk"],["daily","Day"]].map(([val,lbl])=>(
              <button key={val} onClick={()=>onChange(val)}
                style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:5,border:"none",background:value===val?"var(--surface)":"transparent",color:value===val?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:value===val?700:400,boxShadow:value===val?"0 1px 3px rgba(0,0,0,0.1)":"none",transition:"all .15s"}}>
                {lbl}
              </button>
            ))}
          </div>
        );

        const MediaChart = () => {
          const [gran, setGran] = useState("daily");
          const weekKey = iso => {
            try {
              const d = new Date(iso+"T00:00:00");
              if(isNaN(d.getTime())) return null;
              const monday = new Date(d);
              monday.setDate(d.getDate() - ((d.getDay()+6)%7));
              return monday.toISOString().slice(0,10);
            } catch { return null; }
          };
          const buckets = {};
          citations.forEach(c => {
            const key = gran === "daily" ? c.date : weekKey(c.date);
            if(!key) return;
            if(!buckets[key]) buckets[key] = { period:key, count:0 };
            buckets[key].count++;
          });
          const chartData = Object.values(buckets)
            .sort((a,b)=>a.period.localeCompare(b.period))
            .map(w => {
              const d = new Date(w.period+"T00:00:00");
              return { ...w, label: isNaN(d.getTime()) ? w.period : d.toLocaleDateString("en-US",{month:"short",day:"numeric"}) };
            });

          const tierCounts = {};
          citations.forEach(c => {
            const t = c.mediaTier ? String(c.mediaTier).trim() : "";
            if(t) tierCounts[t] = (tierCounts[t]||0)+1;
          });
          const tierEntries = Object.entries(tierCounts).sort((a,b)=>a[0].localeCompare(b[0]));
          // using global getTierColor

          const outletCounts = {};
          citations.forEach(c => { if(c.media) outletCounts[c.media]=(outletCounts[c.media]||0)+1; });
          const topOutlets = Object.entries(outletCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);
          const maxOutlet = topOutlets[0]?.[1] || 1;

          return (
            <div className="cq-chart-row" style={{display:"grid",gridTemplateColumns:"1fr"+(tierEntries.length?"  260px":"")+" 260px",gap:14,marginBottom:20,animation:"fadeUp .5s ease .04s both"}}>
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"16px 20px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{gran==="daily"?"Daily":"Weekly"} Coverage</div>
                  <GranularityToggle value={gran} onChange={setGran}/>
                </div>
                {!rcReady?<div className="cq-skel" style={{width:"100%",height:100,borderRadius:8}}/>:
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={chartData} margin={{top:2,right:4,left:-28,bottom:0}}>
                    <defs>
                      <linearGradient id="gcChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="var(--accent)" stopOpacity={0.18}/>
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                    <XAxis dataKey="label" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fill:"#9ca3af"}} axisLine={false} tickLine={false} interval={Math.max(0,Math.ceil(chartData.length/(gran==="daily"?10:6))-1)}/>
                    <YAxis tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,fill:"#9ca3af"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={({active,payload,label})=>active&&payload?.length?(
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:4}}>{label}</div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:"var(--accent)"}}>{payload[0].value} articles</div>
                      </div>
                    ):null}/>
                    <Area isAnimationActive={false} type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} fill="url(#gcChart)" dot={false} activeDot={{r:3,fill:"var(--accent)"}}/>
                  </AreaChart>
                </ResponsiveContainer>}
              </div>
              {tierEntries.length > 0 && (
                <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"16px 20px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
                  <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Media Tier Breakdown</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {tierEntries.map(([tier,count])=>{
                      const pct = Math.round((count/citations.length)*100);
                      const tc = getTierColor(tier);
                      return (
                        <div key={tier}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color}}>Tier {tier}</span>
                            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--muted)"}}>{count} <span style={{color:"var(--dim)"}}>({pct}%)</span></span>
                          </div>
                          <div style={{height:4,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                            <div style={{width:`${pct}%`,height:"100%",background:tc.color,borderRadius:99,transition:"width .5s ease"}}/>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"16px 20px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Top Outlets</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {topOutlets.map(([name,count],i)=>(
                    <div key={name}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"65%"}}>{name}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--accent)",fontWeight:600}}>{count}</span>
                      </div>
                      <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                        <div style={{width:`${(count/maxOutlet)*100}%`,height:"100%",background:"var(--accent)",opacity:1-i*0.15,borderRadius:99}}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        };
        return <MediaChart/>;
      })()}
      {/* Summary stat strip — readout under the chart */}
      {citations.length>0 && (()=>{
        const total = citations.length;
        const valid = citations.map(c=>c.date).filter(Boolean).sort();
        let weeks=1, range="\u2014";
        if(valid.length){
          const f=valid[0], l=valid[valid.length-1];
          const fmt=x=>{const d=new Date(x+"T00:00:00");return isNaN(d.getTime())?x:d.toLocaleDateString("en-US",{month:"short",day:"numeric"});};
          range = f===l ? fmt(f) : `${fmt(f)} \u2013 ${fmt(l)}`;
          if(valid.length>1){ const ms=new Date(l)-new Date(f); weeks=Math.max(1,Math.round(ms/(7*864e5))); }
        }
        const oc={};
        citations.forEach(c=>{ if(c.media) oc[c.media]=(oc[c.media]||0)+1; });
        const top=Object.entries(oc).sort((a,b)=>b[1]-a[1])[0];
        const stats=[
          {label:"Total Citations", value:total, sub:range},
          {label:"Unique Outlets", value:medias.length, sub:"Publications"},
          {label:"Avg / Week", value:(total/weeks).toFixed(1), sub:"Coverage cadence"},
          {label:"Top Outlet", value:top?top[0]:"\u2014", sub:top?`${top[1]} citations`:"\u2014", small:true},
        ];
        return (
          <div className="cq-statstrip" style={{display:"flex",alignItems:"stretch",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,boxShadow:"var(--shadow-sm)",marginBottom:28,overflow:"hidden",animation:"fadeUp .5s ease both"}}>
            {stats.map((s,i)=>(
              <div key={i} style={{flex:1,minWidth:0,padding:"15px 20px",borderLeft:i?"1px solid var(--border)":"none"}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.label}</div>
                <div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:s.small?18:27,fontWeight:700,color:"var(--text)",lineHeight:s.small?1.5:1,marginTop:s.small?14:10,letterSpacing:"-0.03em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.value}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.sub}</div>
              </div>
            ))}
          </div>
        );
      })()}
      {/* Filter bar */}
      {(()=>{
        const hasFilters = search||filterAuthor!=="all"||filterMedia!=="all"||filterTier!=="all"||filterDateFrom||filterDateTo||filterLink!=="all";
        return (
          <div style={{marginBottom:16,position:"relative",zIndex:20,animation:"fadeUp .5s ease .08s both"}}>
            <div className="cq-filter-bar" style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{position:"relative",flex:1,maxWidth:320}}>
                <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--dim)",pointerEvents:"none"}}><Icons.Search/></div>
                <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search media, reporter, topic…" style={{...iStyle,padding:"8px 10px 8px 30px",fontSize:11}}/>
              </div>
              <button onClick={()=>setShowFilters(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:`1px solid ${showFilters||hasFilters?"rgba(26,58,92,0.3)":"var(--border)"}`,background:showFilters||hasFilters?"color-mix(in srgb,var(--accent) 8%,transparent)":"var(--surface)",color:showFilters||hasFilters?"var(--accent)":"var(--muted)",cursor:"pointer",transition:"all .15s"}}>
                ⚙ Filters {hasFilters&&<span style={{background:"var(--accent)",color:"#fff",borderRadius:100,padding:"1px 6px",fontSize:9,fontWeight:500}}>{[search,filterAuthor!=="all",filterMedia!=="all",filterTier!=="all",filterDateFrom,filterDateTo,filterLink!=="all"].filter(Boolean).length}</span>}
              </button>
              {hasFilters&&<button onClick={resetFilters} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"8px 12px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer"}}>Clear</button>}
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginLeft:4}}>{filtered.length} result{filtered.length!==1?"s":""}</span>
              {(()=>{
                const isAdmin = currentUser.role==="admin";
                const unlinkedCount = filtered.filter(c=>!c.citedBountyId && c.articleLink).length;
                const items = [
                  canAdd && {label:"＋ Add citation", title:"Add a new media citation", onClick:()=>{setEdit(null);setShowForm(true);}},
                  isAdmin && onCitedBountyUpdate && {label:batch.running?`Matching ${batch.processed}/${batch.total}…`:`🔗 Auto-match unlinked (${unlinkedCount})`, running:batch.running, disabled:batch.running||unlinkedCount===0, title:"Auto-link citations to bounties (high-confidence only)",
                    onClick:()=>{if(!window.confirm(`Run bounty match on ${unlinkedCount} unlinked citation${unlinkedCount!==1?"s":""}? Only high-confidence matches will be auto-saved.`))return;runAutoMatch(filtered);}},
                  isAdmin && citations.length>0 && {label:"🗑 Delete all citations", danger:true, disabled:batch.running, title:"Delete every citation in this campaign",
                    onClick:()=>{const cid=citations[0]?.campaignId;if(cid&&window.confirm(`Delete all citations for this campaign? This cannot be undone.`)){onDeleteAll&&onDeleteAll(cid);}}},
                ].filter(Boolean);
                if(!items.length) return null;
                return <div style={{marginLeft:"auto"}}><AdminMenu items={items}/></div>;
              })()}
            </div>
            {(batch.running||batch.processed>0||batch.lastMsg)&&(
              <div style={{marginTop:10,padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                {batch.running?(
                  <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:200}}>
                    <div style={{flex:1,height:4,borderRadius:4,background:"var(--border)",overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${batch.total?(batch.processed/batch.total)*100:0}%`,background:"var(--accent)",transition:"width .3s"}}/>
                    </div>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--muted)",whiteSpace:"nowrap"}}>{batch.processed}/{batch.total}</span>
                  </div>
                ):(
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--muted)"}}>
                    {batch.total>0?`Auto-match done · `:""}
                    <b style={{color:"var(--accent)"}}>{batch.saved} saved</b> · {batch.skipped} skipped{batch.skipped>0&&" (no confident match — link manually in the row)"} · {batch.errors} errors
                    {batch.lastMsg && ` · ${batch.lastMsg}`}
                  </span>
                )}
                {!batch.running && batch.processed>0 && (
                  <button onClick={()=>setBatch({running:false,total:0,processed:0,saved:0,skipped:0,errors:0,lastMsg:""})}
                    style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer",marginLeft:"auto"}}>dismiss</button>
                )}
              </div>
            )}
            {showFilters&&(
              <div style={{marginTop:10,padding:"14px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
                <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:140}}>
                  <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Author</span>
                  <select value={filterAuthor} onChange={e=>{setFA(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                    <option value="all">All Authors</option>
                    {authors.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:160}}>
                  <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Media Outlet</span>
                  <select value={filterMedia} onChange={e=>{setFM(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                    <option value="all">All Outlets</option>
                    {medias.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {tiers.length>0&&(
                  <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:120}}>
                    <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Media Tier</span>
                    <select value={filterTier} onChange={e=>{setFT(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                      <option value="all">All Tiers</option>
                      {tiers.map(t=><option key={t} value={t}>Tier {t}</option>)}
                    </select>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:130}}>
                  <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Bounty Link</span>
                  <select value={filterLink} onChange={e=>{setFilterLink(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                    <option value="all">All Citations</option>
                    <option value="linked">Linked to bounty</option>
                    <option value="unlinked">Unlinked</option>
                  </select>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>From</span>
                  <input type="date" value={filterDateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>To</span>
                  <input type="date" value={filterDateTo} onChange={e=>{setDateTo(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
              </div>
            )}
            {hasFilters&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                {search&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>"{search}"</span>}
                {filterAuthor!=="all"&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>{filterAuthor}</span>}
                {filterMedia!=="all"&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>{filterMedia}</span>}
                {filterTier!=="all"&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>Tier {filterTier}</span>}
                {filterLink!=="all"&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>{filterLink==="unlinked"?"Unlinked":"Linked to bounty"}</span>}
                {filterDateFrom&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>From {filterDateFrom}</span>}
                {filterDateTo&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 20%,transparent)",color:"var(--accent)"}}>To {filterDateTo}</span>}
              </div>
            )}
          </div>
        );
      })()}
      <div className="cq-table-scroll"><div style={{minWidth:700}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.05)",animation:"fadeUp .5s ease .12s both"}}>
            <div style={{display:"grid",gridTemplateColumns:COLS,padding:"10px 20px",borderBottom:"2px solid var(--border)",background:"var(--surface3)"}}>
              {[{l:"Date",k:"date"},{l:"Headline",k:"headline"},{l:"Media",k:"media"},{l:"Tier",k:"tier"},{l:"Author",k:"author"}].map((h,hi)=>(
                <div key={hi} onClick={()=>toggleSort(h.k)} title={`Sort by ${h.l}`}
                  style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.08em",color:sortKey===h.k?"var(--accent)":"var(--muted)",textTransform:"uppercase",whiteSpace:"nowrap",textAlign:h.l==="Author"?"center":"left",cursor:"pointer",userSelect:"none",transition:"color .15s"}}
                  onMouseEnter={e=>{if(sortKey!==h.k)e.currentTarget.style.color="var(--text)"}}
                  onMouseLeave={e=>{if(sortKey!==h.k)e.currentTarget.style.color="var(--muted)"}}>
                  {h.l}{sortKey===h.k&&<span style={{marginLeft:4,fontSize:8}}>{sortDir==="asc"?"▲":"▼"}</span>}
                </div>
              ))}
            </div>
            {!citations.length
              ? <div style={{textAlign:"center",padding:"60px 20px"}}>
                  <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⬡</div>
                  <div style={{fontSize:14,fontWeight:500,color:"var(--muted)",marginBottom:6}}>No citations yet</div>
                  {canAdd&&<button onClick={()=>{setEdit(null);setShowForm(true)}} style={{marginTop:16,display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--accent)",cursor:"pointer"}}><Icons.Plus/>ADD FIRST CITATION</button>}
                </div>
              : filtered.length===0
                ? <div style={{textAlign:"center",padding:"48px 20px"}}>
                    <div style={{fontSize:24,marginBottom:8,opacity:.25}}>⬡</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"var(--muted)",marginBottom:4}}>No matches</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>Try clearing filters or widening the date range</div>
                  </div>
                : paged.map((c,i)=>{
                    const dp=fmtDate(c.date).split(", ");
                    return (
                      <div key={c.id} onClick={()=>setView(c)} style={{display:"grid",gridTemplateColumns:COLS,padding:"12px 20px",borderBottom:"1px solid var(--border)",alignItems:"center",transition:"background .15s",animation:`rowIn .3s ease ${i*.025}s both`,cursor:"pointer",background:"transparent"}}
                        onMouseEnter={e=>e.currentTarget.style.background="color-mix(in srgb,var(--accent) 6%,transparent)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,letterSpacing:"-0.02em",color:"var(--muted)",whiteSpace:"nowrap"}}>
                          {c.date?`${dp[0]} '${(dp[1]||"").slice(2)}`:"—"}
                        </div>
                        <div style={{paddingRight:8,minWidth:0}}>
                          <div style={{marginBottom:2,overflow:"hidden",whiteSpace:"nowrap"}}>
                            {c.articleLink
                              ? <a href={c.articleLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} title={c.headline||c.topic||"Open article"} style={{display:"inline-flex",alignItems:"baseline",gap:4,maxWidth:"100%",verticalAlign:"bottom",fontSize:12,fontWeight:500,color:"color-mix(in srgb,var(--text) 72%,var(--muted))",textDecoration:"none"}} onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)";e.currentTarget.style.textDecoration="underline";}} onMouseLeave={e=>{e.currentTarget.style.color="color-mix(in srgb,var(--text) 72%,var(--muted))";e.currentTarget.style.textDecoration="none";}}><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{c.headline||c.topic||"View article"}</span><span style={{fontSize:10,color:"var(--accent)",flexShrink:0}}>↗</span></a>
                              : <span title={c.headline||c.topic||""} style={{display:"inline-block",maxWidth:"100%",verticalAlign:"bottom",fontSize:12,fontWeight:500,color:"color-mix(in srgb,var(--text) 72%,var(--muted))",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.headline||c.topic||"—"}</span>}
                          </div>
                        </div>
                        <div style={{paddingRight:8,minWidth:0}}>
                          <span title={c.media||""} style={{display:"block",fontSize:11,fontWeight:500,color:"color-mix(in srgb,var(--text) 72%,var(--muted))",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{c.media||"—"}</span>
                        </div>
                        <div>
                          {c.mediaTier?(()=>{const tc=getTierColor(c.mediaTier);return <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"2px 7px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,whiteSpace:"nowrap"}}>{c.mediaTier}</span>})():<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",opacity:.45}}>—</span>}
                        </div>
                        <div style={{minWidth:0,display:"flex",justifyContent:"center"}} onClick={e=>e.stopPropagation()}>
                          {c.author
                            ? (()=>{const acm=getAuthorColor(c.author);return <button onClick={()=>window.dispatchEvent(new CustomEvent("cq-nav-author",{detail:{name:c.author,cid:c.campaignId}}))} className="cq-tip" data-tip={c.author}
                                style={{width:26,height:26,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:600,padding:0,background:acm.bg,color:acm.color,border:"1px solid var(--border2)",cursor:"pointer",transition:"all .15s"}}
                                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.transform="scale(1.12)";}}
                                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.transform="scale(1)";}}>{initials(c.author)}</button>;})()
                            : <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",opacity:.45}}>—</span>}
                        </div>
                      </div>
                    );
                  })
            }
        <Pagination page={page} total={sortedFiltered.length} onChange={p=>{setPage(p);window.scrollTo({top:0,behavior:'smooth'})}}/>
      </div>
      </div></div>
      {view&&<CitationDetailModal entry={citations.find(c=>c.id===view.id)||view} canEdit={canEdit(view)} onEdit={()=>{setEdit(view);setShowForm(true);setView(null);}} onDelete={()=>{setConfId(view.id);setView(null);}} onClose={()=>setView(null)} bounties={bounties} onCitedBountyUpdate={onCitedBountyUpdate}/>}
      {showForm&&<MediaForm initial={editEntry} isEdit={!!editEntry} onSave={async f=>{await onSave(f,editEntry);setShowForm(false);setEdit(null)}} onClose={()=>{setShowForm(false);setEdit(null)}}/>}
      {confirmId&&<ConfirmDelete onConfirm={()=>{onDelete(confirmId);setConfId(null)}} onCancel={()=>setConfId(null)}/>}
    </>
  );
};

// ─────────────────────────────────────────────────────────
//  ANALYTICS TAB (Client only)
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
//  CQ RESEARCH TAB
// ─────────────────────────────────────────────────────────
const CQResearchTab = ({campaigns, citations}) => {
  const [bPage, setBPage] = useState(1);
  const [cPage, setCPage] = useState(1);
  const [viewBounty,  setViewBounty]  = useState(null);
  const [viewCitation, setViewCitation] = useState(null);
  const bRef = useRef(null);
  const cRef = useRef(null);

  const bounties  = campaigns.filter(c=>(c.author||"").toLowerCase()==="cq research").sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const cits      = citations.filter(c=>(c.author||"").toLowerCase()==="cq research").sort((a,b)=>(b.date||"").localeCompare(a.date||""));

  const pagedBounties = bounties.slice((bPage-1)*PAGE_SIZE, bPage*PAGE_SIZE);
  const pagedCits     = cits.slice((cPage-1)*PAGE_SIZE, cPage*PAGE_SIZE);

  const changeBPage = p => { setBPage(p); bRef.current?.scrollIntoView({behavior:"smooth",block:"start"}); };
  const changeCPage = p => { setCPage(p); cRef.current?.scrollIntoView({behavior:"smooth",block:"start"}); };

  const uniqueOutlets = [...new Set(cits.map(c=>c.media).filter(Boolean))];

  // Leaderboard data
  const {topOutlets, maxOutlet, topHeadlines, maxHeadline, tierEntries} = useMemo(()=>{
    const outletMap={};
    cits.forEach(c=>{const m=(c.media||"").trim();if(m){const mk=m.toLowerCase();if(!outletMap[mk])outletMap[mk]={label:m,count:0};outletMap[mk].count++;}});
    const topOutlets=Object.values(outletMap).sort((a,b)=>b.count-a.count).slice(0,6);
    const maxOutlet=topOutlets[0]?.count||1;

    const headlineMap={};
    cits.forEach(c=>{const h=((c.headline||c.topic)||"").trim();if(!h)return;const hk=h.toLowerCase();if(!headlineMap[hk])headlineMap[hk]={label:h,count:0};headlineMap[hk].count++;});
    const topHeadlines=Object.values(headlineMap).sort((a,b)=>b.count-a.count).slice(0,6);
    const maxHeadline=topHeadlines[0]?.count||1;

    const tierMap={};
    cits.forEach(c=>{const t=(c.mediaTier||"").trim();if(t)tierMap[t]=(tierMap[t]||0)+1;});
    const tierEntries=Object.entries(tierMap).sort((a,b)=>a[0].localeCompare(b[0]));

    return {topOutlets,maxOutlet,topHeadlines,maxHeadline,tierEntries};
  },[cits]);

  const linkStyle = {fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--accent)",textDecoration:"none"};
  const onLink  = e=>e.currentTarget.style.textDecoration="underline";
  const offLink = e=>e.currentTarget.style.textDecoration="none";

  const Section = ({title, count, children}) => (
    <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,marginBottom:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:"1px solid var(--border)"}}>
        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--dim)",fontWeight:600}}>{title}</div>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--dim)"}}>{count}</span>
      </div>
      {children}
    </div>
  );

  const EmptyRow = ({msg}) => (
    <div style={{padding:"32px 22px",textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)"}}>{msg}</div>
  );

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      {viewBounty   && <BountyDetailModal   entry={viewBounty}   canEdit={false} onEdit={()=>{}} onClose={()=>setViewBounty(null)}/>}
      {viewCitation && <CitationDetailModal entry={viewCitation} canEdit={false} onEdit={()=>{}} onClose={()=>setViewCitation(null)}/>}

      <PageHeader label="// cq research" title="CQ Research"/>

      <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
        <StatCard label="Bounties" value={bounties.length} sub="Bounties published" c="var(--accent)"/>
        <StatCard label="Media Citations" value={cits.length} sub="Total coverage" c="var(--accent)"/>
        <StatCard label="Media Outlets" value={uniqueOutlets.length} sub="Unique publications" c="var(--accent)"/>
      </div>

      {/* Leaderboards */}
      {(topHeadlines.length>0||topOutlets.length>0||tierEntries.length>0)&&(
        <div className="cq-3col" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:16}}>

          {/* Top Headlines */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Top Headlines</div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{topHeadlines.length}</span>
            </div>
            {topHeadlines.length===0
              ?<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>No data</div>
              :<div style={{display:"flex",flexDirection:"column",gap:9}}>
                {topHeadlines.map((h,i)=>(
                  <div key={h.label}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{i+1}</span>
                        <span title={h.label} style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.label}</span>
                      </div>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600,flexShrink:0,marginLeft:8}}>{h.count}</span>
                    </div>
                    <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                      <div style={{width:`${(h.count/maxHeadline)*100}%`,height:"100%",background:"var(--accent)",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>

          {/* Top Outlets */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Top Outlets</div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{uniqueOutlets.length}</span>
            </div>
            {topOutlets.length===0
              ?<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>No data</div>
              :<div style={{display:"flex",flexDirection:"column",gap:9}}>
                {topOutlets.map((o,i)=>(
                  <div key={o.label}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{i+1}</span>
                        <span title={o.label} style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.label}</span>
                      </div>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600,flexShrink:0,marginLeft:8}}>{o.count}</span>
                    </div>
                    <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                      <div style={{width:`${(o.count/maxOutlet)*100}%`,height:"100%",background:"var(--accent)",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>

          {/* Media Tier */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Media Tier</div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{cits.length} total</span>
            </div>
            {tierEntries.length===0
              ?<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>No tier data</div>
              :<div style={{display:"flex",flexDirection:"column",gap:10}}>
                {tierEntries.map(([tier,count])=>{
                  const tc=getTierColor(tier);
                  const pct=(count/cits.length)*100;
                  return (
                    <div key={tier}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color}}>Tier {tier}</span>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:tc.color}}>{count} <span style={{color:"var(--dim)",fontWeight:400}}>({Math.round(pct)}%)</span></span>
                      </div>
                      <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                        <div style={{width:`${pct}%`,height:"100%",background:tc.color,borderRadius:99,transition:"width .4s"}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        </div>
      )}

      {/* Bounties table */}
      <div ref={bRef}>
      <Section title="Bounties" count={bounties.length}>
        {bounties.length === 0 ? <EmptyRow msg="No CQ Research bounties"/> : (<>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--border)"}}>
                {["Date","Title","Analytics","Twitter","CQ Link"].map(h=>(
                  <th key={h} style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--dim)",fontWeight:600,padding:"10px 22px",textAlign:"left"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedBounties.map((b,i)=>(
                <tr key={b.id||i} onClick={()=>setViewBounty(b)} style={{borderBottom:"1px solid var(--border)",transition:"background .1s",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",padding:"11px 22px",whiteSpace:"nowrap"}}>{b.date||"—"}</td>
                  <td style={{fontSize:13,fontWeight:500,color:"var(--text)",padding:"11px 22px",maxWidth:360,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.title||"—"}</td>
                  <td style={{padding:"11px 22px"}} onClick={e=>e.stopPropagation()}>
                    {b.analyticsLink ? <a href={b.analyticsLink} target="_blank" rel="noopener noreferrer" style={linkStyle} onMouseEnter={onLink} onMouseLeave={offLink}>↗ Analytics</a> : <span style={{color:"var(--dim)",fontSize:11,opacity:0.45}}>—</span>}
                  </td>
                  <td style={{padding:"11px 22px"}} onClick={e=>e.stopPropagation()}>
                    {b.cqTwitterLink ? <a href={b.cqTwitterLink} target="_blank" rel="noopener noreferrer" style={linkStyle} onMouseEnter={onLink} onMouseLeave={offLink}>↗ Tweet</a> : <span style={{color:"var(--dim)",fontSize:11,opacity:0.45}}>—</span>}
                  </td>
                  <td style={{padding:"11px 22px"}} onClick={e=>e.stopPropagation()}>
                    {b.cqLink ? <a href={b.cqLink} target="_blank" rel="noopener noreferrer" style={linkStyle} onMouseEnter={onLink} onMouseLeave={offLink}>↗ View</a> : <span style={{color:"var(--dim)",fontSize:11,opacity:0.45}}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:"12px 22px",borderTop:"1px solid var(--border)"}}>
            <Pagination page={bPage} total={bounties.length} onChange={changeBPage}/>
          </div>
        </>)}
      </Section>
      </div>

      {/* Citations table */}
      <div ref={cRef}>
      <Section title="Media Citations" count={cits.length}>
        {cits.length === 0 ? <EmptyRow msg="No CQ Research citations"/> : (<>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--border)"}}>
                {["Date","Media","Headline / Topic","Reporter","Article"].map(h=>(
                  <th key={h} style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--dim)",fontWeight:600,padding:"10px 22px",textAlign:"left"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedCits.map((c,i)=>(
                <tr key={c.id||i} onClick={()=>setViewCitation(c)} style={{borderBottom:"1px solid var(--border)",transition:"background .1s",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",padding:"11px 22px",whiteSpace:"nowrap"}}>{c.date||"—"}</td>
                  <td style={{fontSize:13,fontWeight:500,color:"var(--text)",padding:"11px 22px",whiteSpace:"nowrap"}}>{c.media||"—"}</td>
                  <td style={{fontSize:12,color:"var(--muted)",padding:"11px 22px",maxWidth:360}}>
                    {c.headline&&<div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.headline}</div>}
                    {c.topic&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.topic}</div>}
                    {!c.headline&&!c.topic&&<span style={{color:"var(--dim)",opacity:0.45}}>—</span>}
                  </td>
                  <td style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",padding:"11px 22px",whiteSpace:"nowrap"}}>{c.reporter||"—"}</td>
                  <td style={{padding:"11px 22px"}} onClick={e=>e.stopPropagation()}>
                    {c.articleLink ? <a href={c.articleLink} target="_blank" rel="noopener noreferrer" style={linkStyle} onMouseEnter={onLink} onMouseLeave={offLink}>↗ Read</a> : <span style={{color:"var(--dim)",fontSize:11,opacity:0.45}}>—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:"12px 22px",borderTop:"1px solid var(--border)"}}>
            <Pagination page={cPage} total={cits.length} onChange={changeCPage}/>
          </div>
        </>)}
      </Section>
      </div>
    </div>
  );
};

// Performance-tab leaderboards — module-level so it isn't remounted (and its tier/modal
// state isn't reset) on every AnalyticsTab re-render. Heavy data comes pre-memoized via props.
const LeaderboardsSection = ({leaderData, citations, campaigns, fmtNum, parseNum}) => {
            const {allTopics, topTopics, maxTopic, allAuthors, topAuthors, maxAuthor, allOutlets, topOutlets, maxOutlet, tierMap, tierEntries, totalTierCits} = leaderData;

            // "View all" modal
            const AllModal = ({title, onClose, children}) => (
              <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.55)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
                <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:14,width:"min(var(--modal-md),100%)",maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,0.18)",animation:"modalIn .2s ease"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
                    <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text)"}}>{title}</div>
                    <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)"}}><Icons.X/></button>
                  </div>
                  <div style={{overflowY:"auto",padding:"16px 22px"}}>{children}</div>
                </div>
              </div>
            );

            const ModalRow = ({rank,label,value,pct,color,sub}) => (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",width:20,flexShrink:0,textAlign:"right"}}>{rank}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                    <span title={label} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
                    <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:color,flexShrink:0,marginLeft:10}}>{value}</span>
                  </div>
                  {sub&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:3}}>{sub}</div>}
                  <div style={{height:2,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:color,opacity:0.7,borderRadius:99}}/>
                  </div>
                </div>
              </div>
            );

              const [modal,setModal] = useState(null); // "topics"|"authors"|"outlets"
              const [tierModal,setTierModal] = useState(null); // tier key or null
              const [tierOpen,setTierOpen] = useState(null); // expanded tier row

              const Panel = ({title,badge,onViewAll,children,fill}) => (
                <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",padding:"20px 24px",boxShadow:"var(--shadow-sm)",minWidth:0,overflow:"hidden",height:fill?"100%":undefined,display:fill?"flex":undefined,flexDirection:fill?"column":undefined}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                    <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{title}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {badge&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"2px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{badge}</span>}
                      {onViewAll&&<button onClick={onViewAll} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",padding:0,letterSpacing:"0.04em"}}>View all →</button>}
                    </div>
                  </div>
                  {fill ? <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>{children}</div> : children}
                </div>
              );

              const Row = ({rank,label,value,pct,color="var(--accent)",sub}) => (
                <div style={{marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{rank}</span>
                      <div style={{minWidth:0}}>
                        <div title={label} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</div>
                        {sub&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:1}}>{sub}</div>}
                      </div>
                    </div>
                    <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:color,flexShrink:0,marginLeft:8}}>{value}</span>
                  </div>
                  <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:color,opacity:0.75,borderRadius:99,transition:"width .5s ease"}}/>
                  </div>
                </div>
              );

              const MiniBar = ({label,value,pct,color,href}) => (
                <div style={{marginBottom:8}}>
                  <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:8,marginBottom:4}}>
                    {href ? <a href={href} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} title={label} style={{flex:1,minWidth:0,fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</a>
                      : <span title={label} style={{flex:1,minWidth:0,fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>}
                    <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--muted)",fontWeight:600,flexShrink:0}}>{value}</span>
                  </div>
                  <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:color,opacity:.6,borderRadius:99}}/>
                  </div>
                </div>
              );

              // ── donut (monochrome accent→grey ramp) + distribution card ──
              const donutShade = (i,n) => n<=1 ? "var(--accent)" : `color-mix(in srgb, var(--accent) ${Math.round(100-(i/(n-1))*72)}%, var(--surface3))`;
              const Donut = ({data,size=104,thickness=13,centerTop,centerSub}) => {
                const tot=data.reduce((s,x)=>s+x.value,0)||1, r=(size-thickness)/2, c=2*Math.PI*r, cx=size/2; let off=0;
                return (
                  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{display:"block",flexShrink:0}}>
                    <circle cx={cx} cy={cx} r={r} fill="none" stroke="var(--surface2)" strokeWidth={thickness}/>
                    <g transform={`rotate(-90 ${cx} ${cx})`}>
                      {data.map((d,i)=>{const len=(d.value/tot)*c; const el=<circle key={i} cx={cx} cy={cx} r={r} fill="none" stroke={d.color||donutShade(i,data.length)} strokeWidth={thickness} strokeDasharray={`${len} ${c-len}`} strokeDashoffset={-off}/>; off+=len; return el;})}
                    </g>
                    {centerTop!=null && <text x={cx} y={cx-1} textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize={size*0.215} fontWeight="700" fill="var(--text)" style={{letterSpacing:"-0.03em"}}>{centerTop}</text>}
                    {centerSub && <text x={cx} y={cx+size*0.16} textAnchor="middle" fontFamily="'Hanken Grotesk',system-ui,sans-serif" fontSize="8.5" fill="var(--dim)" style={{textTransform:"uppercase",letterSpacing:"0.12em"}}>{centerSub}</text>}
                  </svg>
                );
              };
              const DistributionCard = ({title,data,centerTop,centerSub}) => {
                const sum=data.reduce((s,x)=>s+x.value,0)||1;
                return (
                  <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",padding:"18px 20px",boxShadow:"var(--shadow-sm)",minWidth:0,overflow:"hidden"}}>
                    <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:16}}>{title}</div>
                    <div style={{display:"flex",alignItems:"center",gap:18}}>
                      <Donut data={data} centerTop={centerTop} centerSub={centerSub}/>
                      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",gap:9}}>
                        {data.map((d,i)=>{const pct=Math.round((d.value/sum)*100); return (
                          <div key={i} style={{display:"flex",alignItems:"center",gap:9,minWidth:0}}>
                            <span style={{width:9,height:9,borderRadius:3,background:d.color||donutShade(i,data.length),flexShrink:0}}/>
                            <span style={{flex:1,minWidth:0,fontSize:12.5,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.label}</span>
                            <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11.5,color:"var(--muted)",fontWeight:600}}>{d.value.toLocaleString()}</span>
                            <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:"var(--dim)",width:34,textAlign:"right"}}>{pct}%</span>
                          </div>
                        );})}
                      </div>
                    </div>
                  </div>
                );
              };
              const SectionLabel = ({children}) => <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.14em",color:"var(--dim)",textTransform:"uppercase",fontWeight:600,margin:"22px 2px 12px"}}>{children}</div>;

              return (
                <>
                  {/* Row 1: Media Tier Breakdown — full width with rich per-tier cards */}
                  {tierEntries.length>0 && (
                    <div>
                      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:12,margin:"22px 2px 12px"}}>
                        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.14em",color:"var(--dim)",textTransform:"uppercase",fontWeight:600}}>Media Tier Breakdown</div>
                        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.14em",color:"var(--dim)",textTransform:"uppercase",fontWeight:600}}>{totalTierCits.toLocaleString()} citations</div>
                      </div>
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",padding:"18px 20px",boxShadow:"var(--shadow-sm)",overflow:"hidden"}}>
                        {/* one stacked share bar — proportion across tiers at a glance */}
                        <div style={{display:"flex",height:10,gap:3,marginBottom:18}}>
                          {tierEntries.map(([tier,data])=>{const tc=getTierColor(tier); return <div key={tier} title={`Tier ${tier} · ${Math.round(data.count/totalTierCits*100)}%`} style={{flex:data.count,minWidth:5,background:tc.color,borderRadius:3}}/>;})}
                        </div>
                        {/* expandable rows */}
                        <div>
                          {tierEntries.map(([tier,data],i)=>{
                            const tc=getTierColor(tier);
                            const pct=Math.round(data.count/totalTierCits*100);
                            const nOut=Object.keys(data.outlets).length;
                            const top=Object.values(data.outlets).sort((a,b)=>b.count-a.count)[0];
                            const isOpen=tierOpen===tier;
                            const byAuthor={};
                            data.items.forEach(c=>{const a=c.author&&c.author.trim();if(a)byAuthor[a]=(byAuthor[a]||0)+1;});
                            const topAuthors=Object.entries(byAuthor).sort((a,b)=>b[1]-a[1]).slice(0,5);
                            const topOutlets=Object.values(data.outlets).sort((a,b)=>b.count-a.count).slice(0,5);
                            const maxA=topAuthors[0]?.[1]||1, maxO=topOutlets[0]?.count||1;
                            const recent=[...data.items].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5);
                            return (
                              <div key={tier} style={{borderTop:i===0?"none":"1px solid var(--border)"}}>
                                <div onClick={()=>setTierOpen(isOpen?null:tier)} role="button" aria-expanded={isOpen} title={`${data.count} citation${data.count!==1?"s":""} in Tier ${tier}`}
                                  style={{display:"grid",gridTemplateColumns:"104px minmax(0,1fr) auto 22px",alignItems:"center",gap:16,padding:"13px 8px",cursor:"pointer",borderRadius:6,transition:"background .13s",background:isOpen?"color-mix(in srgb,var(--accent) 6%,transparent)":"transparent"}}
                                  onMouseEnter={e=>{if(!isOpen)e.currentTarget.style.background="color-mix(in srgb,var(--accent) 5%,transparent)";}}
                                  onMouseLeave={e=>{if(!isOpen)e.currentTarget.style.background="transparent";}}>
                                  <span style={{justifySelf:"start",fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:5,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,letterSpacing:"0.04em"}}>TIER {tier}</span>
                                  <div style={{minWidth:0,fontSize:12,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                    <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",color:"var(--muted)",fontWeight:600}}>{data.authors.size}</span> author{data.authors.size!==1?"s":""} · <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",color:"var(--muted)",fontWeight:600}}>{nOut}</span> outlet{nOut!==1?"s":""}{top&&<span> · top <span style={{color:"var(--text)"}}>{top.label}</span></span>}
                                  </div>
                                  <div style={{display:"flex",alignItems:"baseline",gap:10,justifyContent:"flex-end"}}>
                                    <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",width:34,textAlign:"right"}}>{pct}%</span>
                                    <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:21,fontWeight:700,letterSpacing:"-0.03em",color:"var(--text)",minWidth:48,textAlign:"right"}}>{data.count.toLocaleString()}</span>
                                  </div>
                                  <span style={{display:"flex",justifyContent:"center",color:"var(--dim)",fontSize:11,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                                </div>
                                {isOpen && (
                                  <div style={{padding:"6px 8px 18px",animation:"fadeUp .25s ease both"}}>
                                    <div className="cq-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28,marginBottom:18}}>
                                      <div style={{minWidth:0}}>
                                        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:12}}>Top outlets in tier</div>
                                        {topOutlets.map(o=><MiniBar key={o.label} label={o.label} value={o.count} pct={(o.count/maxO)*100} color={tc.color}/>)}
                                      </div>
                                      <div style={{minWidth:0}}>
                                        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:12}}>Top authors in tier</div>
                                        {topAuthors.map(([name,n])=><MiniBar key={name} label={name} value={n} pct={(n/maxA)*100} color={tc.color}/>)}
                                      </div>
                                    </div>
                                    <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:10}}>Recent citations</div>
                                    <div>
                                      {recent.map((c,idx)=>(
                                        <div key={idx} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 0",borderTop:idx===0?"none":"1px solid var(--border)"}}>
                                          <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:"var(--dim)",width:64,flexShrink:0}}>{c.date||"—"}</span>
                                          <div style={{flex:1,minWidth:0}}>
                                            <div title={c.headline||c.topic} style={{fontSize:12.5,color:"var(--text)",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.headline||c.topic||"—"}</div>
                                            <div style={{fontSize:11,color:"var(--dim)"}}>{c.media}{c.author?` · ${c.author}`:""}</div>
                                          </div>
                                          {c.articleLink&&<a href={c.articleLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",textDecoration:"none",flexShrink:0}}>↗</a>}
                                        </div>
                                      ))}
                                    </div>
                                    {data.items.length>5 && <div style={{marginTop:10,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)"}}>+{data.items.length-5} more in Tier {tier}</div>}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rankings — Topics (left, vertical) · Authors + Outlets stacked (right) */}
                  <SectionLabel>Rankings</SectionLabel>
                  <div className="cq-rankgrid" style={{display:"grid",gridTemplateColumns:"minmax(0,1.25fr) minmax(0,1fr)",gap:14}}>
                    <Panel title="Top Topics" fill badge={`${allTopics.length} total`} onViewAll={allTopics.length>10?()=>setModal("topics"):null}>
                      {topTopics.length ? topTopics.map((r,i)=>(
                        <Row key={r.topic} rank={i+1} label={r.topic} value={r.count} pct={(r.count/maxTopic)*100} color="var(--dim)"/>
                      )) : <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)"}}>No data</div>}
                    </Panel>
                    <div style={{display:"flex",flexDirection:"column",gap:14,minWidth:0,justifyContent:"space-between"}}>
                      <Panel title="Top Authors" badge={`${allAuthors.length} total`} onViewAll={allAuthors.length>5?()=>setModal("authors"):null}>
                        {topAuthors.length ? topAuthors.map((r,i)=>{
                          const total=r.bounties+r.citations;
                          return <Row key={r.author} rank={i+1} label={r.author} value={total} pct={(total/maxAuthor)*100} color="var(--accent)" sub={`${r.bounties}B · ${r.citations}C`}/>;
                        }) : <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)"}}>No data</div>}
                      </Panel>
                      <Panel title="Top Outlets" badge={`${allOutlets.length} total`} onViewAll={allOutlets.length>5?()=>setModal("outlets"):null}>
                        {topOutlets.length ? topOutlets.map((r,i)=>(
                          <Row key={r.media} rank={i+1} label={r.media} value={r.count} pct={(r.count/maxOutlet)*100} color="var(--dim)"/>
                        )) : <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)"}}>No data</div>}
                      </Panel>
                    </div>
                  </div>

                  {/* Distribution — compositions read better as monochrome donuts */}
                  {(()=>{
                    const langMap={}, drMap={}, assetMap={}, brandMap={};
                    citations.forEach(c=>{
                      if(c.language){const k=normKey(c.language.trim());if(k)langMap[k]=(langMap[k]||0)+1;}
                      if(c.directRelationship){const k=normKey(c.directRelationship.trim());if(k)drMap[k]=(drMap[k]||0)+1;}
                      if(c.asset){const k=normKey(c.asset.trim());if(k)assetMap[k]=(assetMap[k]||0)+1;}
                      if(c.branding){const k=normKey(c.branding.trim());if(k)brandMap[k]=(brandMap[k]||0)+1;}
                    });
                    const top=(m,n)=>Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,n);
                    const langE=top(langMap,5), assetE=top(assetMap,5), drE=top(drMap,3), brandE=top(brandMap,3);
                    const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
                    const binary=es=>es.map(([k,v])=>({label:cap(k),value:v,color:/^y/i.test(k)?"var(--accent)":(/^n/i.test(k)?"var(--surface3)":undefined)}));
                    const yesShare=es=>{const t=es.reduce((s,[,v])=>s+v,0)||1;const y=es.find(([k])=>/^y/i.test(k));return y?Math.round((y[1]/t)*100)+"%":"—";};
                    const cards=[];
                    if(assetE.length) cards.push(<DistributionCard key="a" title="Top Assets" data={assetE.map(([k,v])=>({label:k.toUpperCase(),value:v}))} centerTop={String(Object.keys(assetMap).length)} centerSub="assets"/>);
                    if(langE.length){const t=langE.reduce((s,[,v])=>s+v,0)||1;cards.push(<DistributionCard key="l" title="Language" data={langE.map(([k,v])=>({label:k.toUpperCase(),value:v}))} centerTop={Math.round((langE[0][1]/t)*100)+"%"} centerSub={langE[0][0].toUpperCase()}/>);}
                    if(drE.length) cards.push(<DistributionCard key="d" title="Direct Relationship" data={binary(drE)} centerTop={yesShare(drE)} centerSub="direct"/>);
                    if(brandE.length) cards.push(<DistributionCard key="b" title="Branding Mentions" data={binary(brandE)} centerTop={yesShare(brandE)} centerSub="branded"/>);
                    if(!cards.length) return null;
                    return (<>
                      <SectionLabel>Distribution</SectionLabel>
                      <div className="cq-distgrid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(360px,1fr))",gap:14}}>{cards}</div>
                    </>);
                  })()}

                  {modal==="topics" && (
                    <AllModal title={`All Topics (${allTopics.length})`} onClose={()=>setModal(null)}>
                      {allTopics.map((r,i)=><ModalRow key={r.topic} rank={i+1} label={r.topic} value={r.count} pct={(r.count/maxTopic)*100} color="var(--accent)"/>)}
                    </AllModal>
                  )}
                  {modal==="authors" && (
                    <AllModal title={`All Authors (${allAuthors.length})`} onClose={()=>setModal(null)}>
                      {allAuthors.map((r,i)=>{
                        const total=r.bounties+r.citations;
                        return <ModalRow key={r.author} rank={i+1} label={r.author} value={total} pct={(total/maxAuthor)*100} color="var(--accent)" sub={`${r.bounties} bounties · ${r.citations} citations`}/>;
                      })}
                    </AllModal>
                  )}
                  {modal==="outlets" && (
                    <AllModal title={`All Outlets (${allOutlets.length})`} onClose={()=>setModal(null)}>
                      {allOutlets.map((r,i)=><ModalRow key={r.media} rank={i+1} label={r.media} value={r.count} pct={(r.count/maxOutlet)*100} color="var(--accent)"/>)}
                    </AllModal>
                  )}
                  {tierModal!==null && tierMap[tierModal] && (()=>{
                    const data = tierMap[tierModal];
                    const tc = getTierColor(tierModal);
                    const sortedItems = [...data.items].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
                    return (
                      <AllModal title={`Tier ${tierModal} Citations (${data.count})`} onClose={()=>setTierModal(null)}>
                        {sortedItems.length ? sortedItems.map((c,i)=>(
                          <div key={c.id||i} style={{display:"flex",alignItems:"flex-start",gap:12,padding:"9px 0",borderBottom:"1px solid var(--border)"}}>
                            <span className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:tc.color,fontWeight:600,width:68,flexShrink:0,paddingTop:2}}>{c.date||"—"}</span>
                            <div style={{flex:1,minWidth:0}}>
                              <div title={c.headline||c.topic||""} style={{fontSize:12,color:"var(--text)",fontWeight:500,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.headline||c.topic||"—"}</div>
                              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                {c.media||"—"}{c.author?` · ${c.author}`:""}
                              </div>
                            </div>
                            {c.articleLink?<a href={c.articleLink} target="_blank" rel="noopener noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",textDecoration:"none",flexShrink:0}}>↗ Read</a>:null}
                          </div>
                        )) : <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)"}}>No citations</div>}
                      </AllModal>
                    );
                  })()}
                </>
              );

};

// Combined report-actions dropdown (Open sheet · Share link · Export PDF).
const ReportMenu = ({items}) => {
  const [open,setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{
    if(!open) return;
    const h=e=>{ if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    const k=e=>{ if(e.key==="Escape") setOpen(false); };
    window.addEventListener("mousedown",h); window.addEventListener("keydown",k);
    return ()=>{ window.removeEventListener("mousedown",h); window.removeEventListener("keydown",k); };
  },[open]);
  const live = items.filter(Boolean);
  if(!live.length) return null;
  const itemStyle = {display:"flex",alignItems:"center",gap:11,padding:"8px 10px",borderRadius:7,border:"none",background:"transparent",color:"var(--text)",cursor:"pointer",textAlign:"left",width:"100%",textDecoration:"none",fontFamily:"'Hanken Grotesk',system-ui,sans-serif",transition:"background .12s"};
  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(v=>!v)} title="Report actions"
        style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"6px 12px",borderRadius:7,border:`1px solid ${open?"var(--accent)":"var(--border)"}`,background:open?"var(--accent-light)":"transparent",color:open?"var(--accent)":"var(--muted)",cursor:"pointer",fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase",transition:"all .15s"}}
        onMouseEnter={e=>{if(!open){e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.color="var(--accent)";}}}
        onMouseLeave={e=>{if(!open){e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}}>
        <span style={{fontSize:11}}>↗</span> Report <span style={{fontSize:8,display:"inline-block",transition:"transform .15s",transform:open?"rotate(180deg)":"none"}}>▾</span>
      </button>
      {open&&(
        <div style={{position:"absolute",top:"calc(100% + 6px)",right:0,minWidth:228,zIndex:90,background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:10,boxShadow:"0 16px 44px rgba(0,0,0,0.45)",padding:6,display:"flex",flexDirection:"column",gap:2}}>
          {live.map((it,i)=>{
            const inner = <>
              <span style={{width:26,height:26,borderRadius:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--accent)"}}>{it.icon}</span>
              <span style={{minWidth:0}}>
                <span style={{display:"block",fontSize:12.5,fontWeight:600,color:"var(--text)"}}>{it.label}</span>
                {it.sub&&<span style={{display:"block",fontSize:10.5,color:"var(--dim)",marginTop:1}}>{it.sub}</span>}
              </span>
            </>;
            return it.href
              ? <a key={i} href={it.href} target="_blank" rel="noreferrer" onClick={()=>setOpen(false)} style={itemStyle} onMouseEnter={e=>e.currentTarget.style.background="color-mix(in srgb,var(--accent) 8%,transparent)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{inner}</a>
              : <button key={i} onClick={()=>{setOpen(false);it.onClick();}} style={itemStyle} onMouseEnter={e=>e.currentTarget.style.background="color-mix(in srgb,var(--accent) 8%,transparent)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>{inner}</button>;
          })}
        </div>
      )}
    </div>
  );
};

// Expandable CQ Research content explorer — each research bounty opens to reveal
// its summary and the full list of media citations that referenced it.
const CQResearchExplorer = ({campaigns, citations, fmtNum, parseNum}) => {
  const [expanded,setExpanded] = useState(()=>new Set());
  const fmtD = iso => { if(!iso) return "—"; const [y,m,d]=iso.split("-"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${+d}, '${y.slice(2)}`; };
  const items = useMemo(()=>{
    const research = (campaigns||[]).filter(b => (b.author||"").toLowerCase()==="cq research");
    if(!research.length) return [];
    return research.map(b=>{
      const cits = (citations||[]).filter(c=>c.citedBountyId===b.id).sort((a,z)=>(z.date||"").localeCompare(a.date||""));
      const impr = parseNum(b.twitterImpressions)+parseNum(b.telegramImpressions);
      return {b, cits, impr};
    }).sort((a,z)=> z.cits.length - a.cits.length || z.impr - a.impr);
  },[campaigns,citations,parseNum]);
  if(!items.length) return null;
  const toggle = id => setExpanded(s=>{ const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const totalCited = items.reduce((s,it)=>s+it.cits.length,0);
  const maxCites = Math.max(1, ...items.map(it=>it.cits.length));
  return (
    <div style={{marginTop:28}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
        <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>CQ Research · Content</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{items.length} bounties · {totalCited} citations</span>
      </div>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",overflow:"hidden",boxShadow:"var(--shadow-sm)"}}>
        <div style={{display:"grid",gridTemplateColumns:"18px minmax(0,1fr) 84px 104px 44px",gap:12,padding:"10px 18px",borderBottom:"2px solid var(--border)",background:"var(--surface3)"}}>
          {[{l:"",a:"left"},{l:"Content",a:"left"},{l:"Citations",a:"right"},{l:"Impressions",a:"right"},{l:"Link",a:"center"}].map((h,hi)=>(
            <span key={hi} style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.08em",color:"var(--muted)",textTransform:"uppercase",whiteSpace:"nowrap",textAlign:h.a}}>{h.l}</span>
          ))}
        </div>
        {items.map(({b,cits,impr},i)=>{
          const open = expanded.has(b.id);
          return (
            <div key={b.id} style={{borderTop:i?"1px solid var(--border)":"none"}}>
              <div onClick={()=>toggle(b.id)} role="button" style={{display:"grid",gridTemplateColumns:"18px minmax(0,1fr) 84px 104px 44px",gap:12,alignItems:"center",width:"100%",textAlign:"left",padding:"13px 18px",background:open?"color-mix(in srgb,var(--accent) 5%,transparent)":"transparent",cursor:"pointer",transition:"background .12s"}}
                onMouseEnter={e=>{if(!open)e.currentTarget.style.background="var(--surface2)"}}
                onMouseLeave={e=>{if(!open)e.currentTarget.style.background="transparent"}}>
                <span style={{fontSize:10,color:"var(--dim)",transition:"transform .15s",transform:open?"rotate(90deg)":"none",display:"inline-block"}}>▶</span>
                <span style={{minWidth:0}}>
                  <span style={{display:"block",fontSize:12.5,fontWeight:500,color:"color-mix(in srgb,var(--text) 80%,var(--muted))",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{b.title||"(untitled)"}</span>
                  <span style={{display:"block",fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,color:"var(--dim)",marginTop:2,marginBottom:5}}>{fmtD(b.date)}</span>
                  <span style={{display:"block",height:4,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}><span style={{display:"block",width:`${(cits.length/maxCites)*100}%`,height:"100%",background:"var(--accent)",opacity:.7,borderRadius:99,transition:"width .4s"}}/></span>
                </span>
                <span style={{justifySelf:"end",fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:cits.length?"var(--accent)":"var(--dim)"}}>{cits.length}</span>
                <span style={{justifySelf:"end",fontFamily:"'JetBrains Mono',monospace",fontSize:11.5,fontWeight:600,color:"var(--muted)"}} title="Twitter + Telegram combined">{fmtNum(impr)}</span>
                <span style={{justifySelf:"center"}} onClick={e=>e.stopPropagation()}>
                  {b.cqLink
                    ? <a href={b.cqLink} target="_blank" rel="noreferrer" title="View bounty on CryptoQuant" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:24,height:24,borderRadius:6,border:"1px solid color-mix(in srgb,var(--accent) 18%,transparent)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--accent)",textDecoration:"none",fontSize:11}}>↗</a>
                    : <span style={{color:"var(--dim)",opacity:.45,fontSize:11}}>–</span>}
                </span>
              </div>
              {open && (
                <div style={{padding:"4px 18px 16px 48px",background:"color-mix(in srgb,var(--accent) 5%,transparent)"}}>
                  {b.summary
                    ? <p style={{fontSize:12.5,lineHeight:1.6,color:"var(--muted)",marginBottom:14}}>{b.summary}</p>
                    : <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",marginBottom:14}}>No summary available for this bounty.</p>}
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                    {[
                      b.cqLink&&{l:"Quicktake",h:b.cqLink},
                      b.analyticsLink&&{l:"Analytics",h:b.analyticsLink},
                      b.cqTwitterLink&&{l:"CQ X",h:b.cqTwitterLink},
                      b.telegramLink&&{l:"CQ TG",h:b.telegramLink},
                      b.authorTwitterLink&&{l:"Author X",h:b.authorTwitterLink},
                      b.authorTelegramLink&&{l:"Author TG",h:b.authorTelegramLink},
                    ].filter(Boolean).map((lk,li)=>(
                      <a key={li} href={lk.h} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"3px 8px",borderRadius:5,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",textDecoration:"none",whiteSpace:"nowrap"}} onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--accent)";e.currentTarget.style.color="var(--accent)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>{lk.l}↗</a>
                    ))}
                    {!(b.cqLink||b.analyticsLink||b.cqTwitterLink||b.telegramLink||b.authorTwitterLink||b.authorTelegramLink)&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:"var(--dim)"}}>No links available</span>}
                  </div>
                  {cits.length>0&&(()=>{
                    const tierCounts={},outletCounts={};
                    cits.forEach(c=>{ const t=(String(c.mediaTier||"").match(/\d/)||[])[0]; if(t)tierCounts[t]=(tierCounts[t]||0)+1; const m=(c.media||"").trim(); if(m)outletCounts[m]=(outletCounts[m]||0)+1; });
                    const tiers=Object.entries(tierCounts).sort((a,b)=>a[0].localeCompare(b[0]));
                    const outlets=Object.entries(outletCounts).sort((a,b)=>b[1]-a[1]);
                    const subLbl={fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:7};
                    return (
                      <div style={{display:"flex",gap:28,flexWrap:"wrap",marginBottom:16,padding:"12px 14px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8}}>
                        <div style={{minWidth:0}}>
                          <div style={subLbl}>Tiers</div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {tiers.length?tiers.map(([t,n])=>{const tc=getTierColor(t);return <span key={t} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,padding:"2px 8px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,whiteSpace:"nowrap"}}>T{t} · {n}</span>;}):<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>—</span>}
                          </div>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={subLbl}>Outlets ({outlets.length})</div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {outlets.map(([m,n])=><span key={m} title={`${m} · ${n} citation${n!==1?"s":""}`} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,padding:"2px 8px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)",whiteSpace:"nowrap",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis"}}>{m}{n>1&&<span style={{color:"var(--dim)"}}> ×{n}</span>}</span>)}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:9.5,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:8}}>Media citations ({cits.length})</div>
                  {cits.length===0
                    ? <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)"}}>No media has cited this bounty yet.</div>
                    : <div style={{maxHeight:cits.length>7?300:undefined,overflowY:cits.length>7?"auto":"visible",border:"1px solid var(--border)",borderRadius:8,background:"var(--surface)"}}>
                        {cits.map((c,ci)=>{
                          const tn=(String(c.mediaTier||"").match(/\d/)||[])[0];
                          const tc=tn?getTierColor(tn):null;
                          return (
                            <div key={c.id||ci} style={{display:"grid",gridTemplateColumns:"66px minmax(0,1fr) auto",gap:10,alignItems:"center",padding:"9px 12px",borderTop:ci?"1px solid var(--border)":"none"}}>
                              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",whiteSpace:"nowrap"}}>{c.date?fmtD(c.date):"—"}</span>
                              <span style={{minWidth:0}}>
                                <span style={{display:"block",fontSize:11.5,fontWeight:500,color:"color-mix(in srgb,var(--text) 78%,var(--muted))",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.media||"—"}</span>
                                {(c.headline||c.topic)&&<span style={{display:"block",fontSize:10.5,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:1}}>{c.headline||c.topic}</span>}
                              </span>
                              <span style={{display:"inline-flex",alignItems:"center",gap:8,justifySelf:"end"}}>
                                {tc&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,whiteSpace:"nowrap"}}>T{tn}</span>}
                                {c.articleLink&&<a href={c.articleLink} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"3px 7px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 8%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 18%,transparent)",color:"var(--accent)",textDecoration:"none"}}>↗</a>}
                              </span>
                            </div>
                          );
                        })}
                      </div>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AnalyticsTab = ({campaigns: campaignsRaw, citations: citationsRaw, dataLoading, clientName, color, onExport, onShare, sheetUrl}) => {
  const rcReady = useRecharts();
  // mode: "all" | "3" | "6" | "12" (months back) | "weekly" | "custom"
  const [mode, setMode] = useState("all");
  const [granularity, setGranularity] = useState("daily");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");
  const [drill, setDrill] = useState(null);
  const [drillExpanded, setDrillExpanded] = useState(false);
  const [topOpen, setTopOpen] = useState(false);

  const getMondayOf = (date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const day = d.getDay();
    d.setDate(d.getDate() - ((day + 6) % 7));
    return d;
  };
  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };

  const todayMonday = getMondayOf(new Date());
  const [weekStart, setWeekStart] = useState(todayMonday);
  const [manuallyNavigated, setManuallyNavigated] = useState(false);

  useEffect(()=>{
    if(mode!=="weekly") return;
    if(manuallyNavigated) return;
    const allDates = [...campaignsRaw.map(c=>c.date),...citationsRaw.map(c=>c.date)]
      .filter(d => d && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
    if(!allDates.length) return;
    const lastDate = new Date(allDates[allDates.length-1]+"T00:00:00");
    if(isNaN(lastDate.getTime())) return;
    const lastMonday = getMondayOf(lastDate);
    if(isNaN(lastMonday.getTime())) return;
    setWeekStart(lastMonday > todayMonday ? todayMonday : lastMonday);
  },[mode, campaignsRaw.length, citationsRaw.length]);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const weekStartStr = toLocalDateStr(weekStart);
  const weekEndStr   = toLocalDateStr(weekEnd);
  const isCurrentWeek = weekStartStr === toLocalDateStr(todayMonday);
  const latestDataMonday = (() => {
    const allDates = [...campaignsRaw.map(c=>c.date),...citationsRaw.map(c=>c.date)].filter(Boolean).sort();
    if(!allDates.length) return todayMonday;
    const lastDate = new Date(allDates[allDates.length-1]+"T00:00:00");
    if(isNaN(lastDate.getTime())) return todayMonday;
    const lastMonday = getMondayOf(lastDate);
    return lastMonday > todayMonday ? todayMonday : lastMonday;
  })();
  const isLatestWeek = weekStartStr === toLocalDateStr(latestDataMonday);
  const goBack    = () => { const d=new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); setManuallyNavigated(true); setDrill(null); };
  const goForward = () => { if(isCurrentWeek) return; const d=new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); setManuallyNavigated(true); setDrill(null); };
  const goLatest  = () => { setWeekStart(latestDataMonday); setManuallyNavigated(true); setDrill(null); };

  // Effective date range derived from mode
  const effectiveFrom = mode==="custom" ? customFrom
                      : mode==="weekly" ? weekStartStr
                      : mode==="all" ? ""
                      : (() => { const d=new Date(); d.setMonth(d.getMonth()-parseInt(mode)); return toLocalDateStr(d); })();
  const effectiveTo   = mode==="custom" ? customTo
                      : mode==="weekly" ? weekEndStr
                      : "";

  const campaigns = useMemo(()=> campaignsRaw.filter(c => c.date && (!effectiveFrom||c.date>=effectiveFrom) && (!effectiveTo||c.date<=effectiveTo)), [campaignsRaw, effectiveFrom, effectiveTo]);
  const citations = useMemo(()=> citationsRaw.filter(c => c.date && (!effectiveFrom||c.date>=effectiveFrom) && (!effectiveTo||c.date<=effectiveTo)), [citationsRaw, effectiveFrom, effectiveTo]);

  const totalBounties  = campaigns.length;
  const totalCitations = citations.length;
  const dateRangeLabel = mode==="custom" && customFrom && customTo
    ? `${customFrom} → ${customTo}`
    : mode==="weekly"
      ? `${weekStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${weekEnd.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`
      : mode==="all" ? "All time"
      : `Last ${mode} months`;

  // Build chart series — daily or weekly
  const getWeekKey = (iso) => {
    try {
      const d = new Date(iso+"T00:00:00");
      if(isNaN(d.getTime())) return null;
      const day = d.getDay();
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((day+6)%7));
      return monday.toISOString().slice(0,10);
    } catch { return null; }
  };

  const {chartData, uniqueAuthors, uniqueOutlets, totalImpressions, totalTwitter, totalTelegram, tweetCount, tgPostCount} = useMemo(()=>{
    const bucketMap = {};
    const pNum = v => { if(!v) return 0; const s=String(v).replace(/,/g,"").trim(); if(/k$/i.test(s)) return Math.round(parseFloat(s)*1000); if(/m$/i.test(s)) return Math.round(parseFloat(s)*1000000); return parseInt(s)||0; };
    const addTo = (iso, key) => {
      if(!iso) return;
      const bkey = granularity === "daily" ? iso : getWeekKey(iso);
      if(!bkey) return;
      if(!bucketMap[bkey]) bucketMap[bkey] = {period:bkey, bounties:0, citations:0, reach:0};
      bucketMap[bkey][key]++;
    };
    campaigns.forEach(c => { addTo(c.date, "bounties"); if(c.date){ const bk = granularity==="daily"?c.date:getWeekKey(c.date); if(bk&&bucketMap[bk]) bucketMap[bk].reach += pNum(c.twitterImpressions)+pNum(c.telegramImpressions); } });
    citations.forEach(c => addTo(c.date, "citations"));

    const weekMap = {};
    campaigns.forEach(c => { if(!c.date) return; const wk=getWeekKey(c.date); if(wk){if(!weekMap[wk])weekMap[wk]={week:wk,bounties:0,citations:0};weekMap[wk].bounties++;} });
    citations.forEach(c => { if(!c.date) return; const wk=getWeekKey(c.date); if(wk){if(!weekMap[wk])weekMap[wk]={week:wk,bounties:0,citations:0};weekMap[wk].citations++;} });

    const allWeeks = Object.values(weekMap).sort((a,b)=>a.week.localeCompare(b.week));
    const allBuckets = Object.values(bucketMap).sort((a,b)=>a.period.localeCompare(b.period));

    let cumB = 0, cumC = 0, cumR = 0;
    const chartData = allBuckets.map(w => {
      cumB += w.bounties; cumC += w.citations; cumR += (w.reach||0);
      try {
        const d = new Date(w.period+"T00:00:00");
        const label = isNaN(d.getTime()) ? w.period : d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
        return { ...w, label, cumBounties: cumB, cumCitations: cumC, cumReach: cumR };
      } catch { return { ...w, label: w.period, cumBounties: cumB, cumCitations: cumC, cumReach: cumR }; }
    });

    const uniqueAuthors = [...new Set([...campaigns.map(c=>c.author),...citations.map(c=>c.author)].filter(Boolean))];
    const uniqueOutlets = [...new Set(citations.map(c=>c.media).filter(Boolean))];

    const rangeStart = allWeeks.length ? allWeeks[0].week : null;
    const inRange = arr => rangeStart ? arr.filter(c=>c.date&&c.date>=rangeStart) : arr;
    const parseNum = v => { if(!v) return 0; const s=String(v).replace(/,/g,"").trim(); if(/k$/i.test(s)) return Math.round(parseFloat(s)*1000); if(/m$/i.test(s)) return Math.round(parseFloat(s)*1000000); return parseInt(s)||0; };
    const rc = inRange(campaigns);
    const totalTwitter  = rc.reduce((s,c)=>s+parseNum(c.twitterImpressions),0);
    const totalTelegram = rc.reduce((s,c)=>s+parseNum(c.telegramImpressions),0);
    const tweetCount    = rc.reduce((n,c)=>n+(c.authorTwitterLink?1:0)+(c.cqTwitterLink?1:0),0);
    const tgPostCount   = rc.reduce((n,c)=>n+(c.authorTelegramLink?1:0)+(c.telegramLink?1:0),0);
    const totalImpressions = totalTwitter + totalTelegram;

    return {chartData, allWeeks, uniqueAuthors, uniqueOutlets, totalImpressions, totalTwitter, totalTelegram, tweetCount, tgPostCount};
  },[campaigns, citations, granularity]);

  const fmtNum = n => n>=1000000 ? `${(n/1000000).toFixed(1)}M` : n>=1000 ? `${(n/1000).toFixed(0)}k` : n.toString();
  const parseNum = v => { if(!v) return 0; const s=String(v).replace(/,/g,"").trim(); if(/k$/i.test(s)) return Math.round(parseFloat(s)*1000); if(/m$/i.test(s)) return Math.round(parseFloat(s)*1000000); return parseInt(s)||0; };

  const SUMMARY = [
    {label:"Bounties",          value:totalBounties,           sub:"Bounties published",       c:"var(--accent)", drillKey:"bounties"},
    {label:"Media Citations",   value:totalCitations,          sub:"Total coverage",         c:"var(--accent)",      drillKey:"citations"},
    {label:"Authors",           value:uniqueAuthors.length,    sub:"Unique contributors",    c:"var(--accent)"},
    {label:"Media Outlets",     value:uniqueOutlets.length,    sub:"Unique publications",    c:"var(--accent)"},
    {label:"Total Impressions", value:fmtNum(totalImpressions),sub:"Twitter + Telegram",     c:"var(--accent)"},
  ];

  // Leaderboard aggregations — memoized so they don't recompute on every render
  // (date typing, drill toggles, tier expands all trigger re-renders).
  const leaderData = useMemo(()=>{
    const topicMap = {};
    citations.forEach(c=>{
      const t=((c.headline||c.topic)||"").trim()||"Uncategorised";
      const tk=t.toLowerCase();
      if(!topicMap[tk]) topicMap[tk]={topic:t,count:0};
      topicMap[tk].count++;
    });
    const allTopics  = Object.values(topicMap).sort((a,b)=>b.count-a.count);

    const authorMap = {};
    campaigns.forEach(c=>{ const a=c.author||"Unknown"; const ak=a.toLowerCase(); if(!authorMap[ak]) authorMap[ak]={author:a,bounties:0,citations:0}; authorMap[ak].bounties++; });
    citations.forEach(c=>{ const a=c.author||"Unknown"; const ak=a.toLowerCase(); if(!authorMap[ak]) authorMap[ak]={author:a,bounties:0,citations:0}; authorMap[ak].citations++; });
    const allAuthors = Object.values(authorMap).sort((a,b)=>(b.bounties+b.citations)-(a.bounties+a.citations));

    const mediaMap = {};
    citations.forEach(c=>{ const m=(c.media||"").trim()||"Unknown"; const mk=m.toLowerCase(); if(!mediaMap[mk]) mediaMap[mk]={media:m,count:0}; mediaMap[mk].count++; });
    const allOutlets = Object.values(mediaMap).sort((a,b)=>b.count-a.count);

    const tierMap = {};
    citations.forEach(c=>{
      if(c.mediaTier){
        const t=String(c.mediaTier).trim();
        if(t){
          if(!tierMap[t]) tierMap[t]={count:0,outlets:{},authors:new Set(),dates:[],items:[]};
          tierMap[t].count++;
          const m=(c.media||"").trim();
          if(m){const mk=m.toLowerCase();if(!tierMap[t].outlets[mk])tierMap[t].outlets[mk]={label:m,count:0};tierMap[t].outlets[mk].count++;}
          const a=(c.author||"").trim();
          if(a) tierMap[t].authors.add(a.toLowerCase());
          if(c.date) tierMap[t].dates.push(c.date);
          tierMap[t].items.push(c);
        }
      }
    });
    const tierEntries = Object.entries(tierMap).sort((a,b)=>a[0].localeCompare(b[0]));
    const totalTierCits = tierEntries.reduce((s,[,d])=>s+d.count,0);

    return {
      allTopics, topTopics: allTopics.slice(0,10), maxTopic: allTopics[0]?.count||1,
      allAuthors, topAuthors: allAuthors.slice(0,5), maxAuthor: (allAuthors[0]?.bounties||0)+(allAuthors[0]?.citations||0)||1,
      allOutlets, topOutlets: allOutlets.slice(0,5), maxOutlet: allOutlets[0]?.count||1,
      tierMap, tierEntries, totalTierCits,
    };
  },[campaigns, citations]);

  const CustomTooltip = ({active,payload,label,nameMap={}}) => {
    if(!active||!payload?.length) return null;
    return (
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 16px",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginBottom:8}}>{label}</div>
        {payload.map(p=>(
          <div key={p.dataKey} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:p.color}}/>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--muted)",textTransform:"capitalize"}}>{nameMap[p.dataKey]||p.dataKey}:</span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:500,color:"var(--text)"}}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  // §15 — slide-over drill panel (overlays the dashboard instead of replacing it)
  useEffect(()=>{
    if(!drill) return;
    const k=e=>{ if(e.key==="Escape") setDrill(null); };
    window.addEventListener("keydown",k);
    return ()=>window.removeEventListener("keydown",k);
  },[drill]);
  const drillPanel = drill ? (()=>{
    const items = drill.type==="bounties" ? campaigns : citations;
    const kind = drill.type==="bounties" ? "bounty" : "citation";
    const title = drill.type==="bounties" ? "Bounties" : "Media Citations";
    const sorted = [...items].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    return (
      <div onClick={()=>setDrill(null)} style={{position:"fixed",inset:0,zIndex:600,background:"rgba(4,7,15,0.55)",display:"flex",justifyContent:"flex-end",alignItems:"flex-start",padding:20}}>
        <div onClick={e=>e.stopPropagation()} style={{width:"min(480px,92vw)",maxHeight:"calc(100vh - 40px)",background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:14,boxShadow:"-24px 0 70px rgba(0,0,0,0.5)",display:"flex",flexDirection:"column",overflow:"hidden",animation:"slideIn .22s cubic-bezier(.2,.7,.3,1)"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,padding:"20px 24px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
            <div>
              <div style={{fontSize:16,fontWeight:650,letterSpacing:"-0.01em",color:"var(--text)"}}>{title}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:"var(--dim)",marginTop:3}}>{sorted.length} in range · {dateRangeLabel}</div>
            </div>
            <button onClick={()=>setDrill(null)} style={{width:36,height:36,borderRadius:9,border:"1px solid var(--border)",background:"var(--surface2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",flexShrink:0}}><Icons.X/></button>
          </div>
          <div style={{maxHeight:600,overflowY:"auto"}}>
            {sorted.length===0
              ? <div style={{padding:"40px",textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"var(--dim)"}}>No activity this period</div>
              : sorted.map((item,i)=>{
                  const link = kind==="bounty" ? item.cqLink : item.articleLink;
                  const reach = kind==="bounty" ? parseNum(item.twitterImpressions)+parseNum(item.telegramImpressions) : 0;
                  return (
                    <div key={item.id} style={{display:"grid",gridTemplateColumns:"52px minmax(0,1fr) auto",alignItems:"center",gap:12,padding:"12px 24px",borderBottom:"1px solid var(--border)",transition:"background .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="color-mix(in srgb,var(--accent) 5%,transparent)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:"var(--dim)",whiteSpace:"nowrap"}}>{item.date?item.date.slice(5):"—"}</div>
                      <div style={{minWidth:0}}>
                        {kind==="bounty"
                          ? <>
                              <div title={item.title} style={{fontSize:12.5,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.title||"—"}</div>
                              <div style={{fontSize:11,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.author}</div>
                            </>
                          : <>
                              <div title={item.headline||item.topic||item.media} style={{fontSize:12.5,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.headline||item.topic||item.media}</div>
                              <div style={{fontSize:11,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.media}{item.author?` · ${item.author}`:""}</div>
                            </>
                        }
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                        {kind==="bounty"
                          ? (reach>0&&<span style={{display:"inline-flex",alignItems:"center",gap:4,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:"var(--muted)"}}><span style={{color:"var(--dim)",display:"inline-flex"}}><Icons.X s={10}/></span>{fmtNum(reach)}</span>)
                          : (item.mediaTier&&(()=>{const tc=getTierColor(item.mediaTier);return <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,whiteSpace:"nowrap"}}>{item.mediaTier}</span>})())}
                        {link && <a href={link} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"3px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 7%,transparent)",border:"1px solid color-mix(in srgb,var(--accent) 18%,transparent)",color:"var(--accent)",textDecoration:"none",flexShrink:0}}>↗</a>}
                      </div>
                    </div>
                  );
                })}
          </div>
          <div style={{padding:"14px 24px",borderTop:"1px solid var(--border)",flexShrink:0,marginTop:"auto"}}>
            <button onClick={()=>{window.dispatchEvent(new CustomEvent("cq-nav-tab",{detail:{tab:drill.type==="bounties"?"campaign":"media"}}));setDrill(null);}}
              style={{width:"100%",fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:13,fontWeight:650,padding:"11px",borderRadius:"var(--r-md)",border:"none",background:"var(--accent)",color:"#0B1120",cursor:"pointer"}}>
              Open full table →
            </button>
          </div>
        </div>
      </div>
    );
  })() : null;

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      {drillPanel}
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>{dateRangeLabel}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          {/* Custom date inputs — sit left of the arrows, next to the Custom button */}
          {mode==="custom" && (
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input type="date" value={customFrom} onChange={e=>{setCustomFrom(e.target.value);setDrill(null);}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>→</span>
              <input type="date" value={customTo} onChange={e=>{setCustomTo(e.target.value);setDrill(null);}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
            </div>
          )}
          {/* Week navigator — arrows drive weekly mode */}
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <button onClick={()=>{if(mode!=="weekly"){setMode("weekly");setManuallyNavigated(true);}else{goBack();}}}
              title="Previous week"
              style={{width:32,height:32,borderRadius:8,border:`1px solid ${mode==="weekly"?"rgba(26,58,92,0.25)":"var(--border)"}`,background:mode==="weekly"?"color-mix(in srgb,var(--accent) 8%,transparent)":"var(--surface)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontSize:14}}>‹</button>
            {mode==="weekly" && !isLatestWeek && (
              <button onClick={goLatest} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"6px 12px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:"pointer"}}>Latest</button>
            )}
            <button onClick={()=>{if(mode!=="weekly"){setMode("weekly");setManuallyNavigated(true);}else{goForward();}}} disabled={mode==="weekly"&&isLatestWeek}
              title="Next week"
              style={{width:32,height:32,borderRadius:8,border:`1px solid ${mode==="weekly"?"rgba(26,58,92,0.25)":"var(--border)"}`,background:mode==="weekly"?"color-mix(in srgb,var(--accent) 8%,transparent)":"var(--surface)",cursor:(mode==="weekly"&&isLatestWeek)?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:(mode==="weekly"&&isLatestWeek)?"var(--border2)":"var(--muted)",fontSize:14}}>›</button>
          </div>
          {/* Mode selector */}
          <div style={{display:"flex",gap:4}}>
            {[["custom","Custom"],["all","All"]].map(([val,label])=>(
              <button key={val} onClick={()=>{setMode(val);setDrill(null);if(val==="custom"&&!customFrom){const allDates=[...campaignsRaw.map(c=>c.date),...citationsRaw.map(c=>c.date)].filter(Boolean).sort();const latest=allDates[allDates.length-1];if(latest){const fromD=getMondayOf(new Date(latest+"T00:00:00"));fromD.setDate(fromD.getDate()-7);setCustomFrom(toLocalDateStr(fromD));if(!customTo)setCustomTo(latest);}else{const d=new Date(todayMonday);d.setDate(d.getDate()-7);setCustomFrom(toLocalDateStr(d));if(!customTo)setCustomTo(toLocalDateStr(new Date()));}}}}
                style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"6px 12px",borderRadius:7,border:`1px solid ${mode===val?"rgba(26,58,92,0.25)":"var(--border)"}`,background:mode===val?"color-mix(in srgb,var(--accent) 8%,transparent)":"transparent",color:mode===val?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:mode===val?700:400,transition:"all .15s"}}>
                {label}
              </button>
            ))}
          </div>
          {/* Combined report actions */}
          <ReportMenu items={[
            sheetUrl && {label:"Open Google Sheet", sub:"Source spreadsheet", icon:"⊞", href:sheetUrl},
            onShare && {label:"Share live link", sub:"Read-only client report", icon:"⤴", onClick:onShare},
            onExport && {label:"Export PDF", sub:"3-page summary", icon:"↓", onClick:()=>onExport(effectiveFrom, effectiveTo)},
          ]}/>
        </div>
      </div>

      {chartData.length === 0 ? (
        dataLoading&&campaignsRaw.length===0&&citationsRaw.length===0 ? (
          /* §16 skeleton first-load — shaped like the real layout */
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:24}}>
              {[0,1,2,3,4].map(i=>(
                <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",padding:"16px 20px",display:"flex",flexDirection:"column",gap:10,boxShadow:"var(--shadow-sm)"}}>
                  <div className="cq-skel" style={{width:"60%",height:9}}/>
                  <div className="cq-skel" style={{width:64,height:26}}/>
                  <div className="cq-skel" style={{width:"48%",height:9}}/>
                </div>
              ))}
            </div>
            {[0,1].map(i=>(
              <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",padding:"18px 22px",marginBottom:14,boxShadow:"var(--shadow-sm)"}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
                  <div className="cq-skel" style={{width:140,height:10}}/>
                  <div className="cq-skel" style={{width:80,height:10}}/>
                </div>
                <div className="cq-skel" style={{width:"100%",height:i===0?220:150,borderRadius:10}}/>
              </div>
            ))}
          </div>
        ) : (
        <div style={{textAlign:"center",padding:"60px 20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8}}>
          <div style={{fontSize:28,marginBottom:10,opacity:.25}}>⬡</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"var(--dim)"}}>No data in selected range</div>
        </div>
        )
      ) : (
        <>
          {/* Combined chart */}
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.14em",color:"var(--dim)",textTransform:"uppercase",fontWeight:600,margin:"4px 2px 12px"}}>Program Activity</div>
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"24px",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <div style={{display:"flex",gap:14,flexWrap:"wrap",alignItems:"center"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:9,height:9,borderRadius:2,background:"var(--accent)"}}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>Bounties</span>
                    <div style={{width:9,height:9,borderRadius:2,background:"var(--dim)",marginLeft:6}}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>Citations</span>
                  </div>
                  <div style={{width:1,height:11,background:"var(--border2)"}}/>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:7,height:11,borderRadius:1.5,background:"var(--dim)",opacity:.4}}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>per {granularity==="daily"?"day":"wk"}</span>
                    <div style={{width:14,height:2,borderRadius:1,background:"var(--dim)",marginLeft:6}}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>running total</span>
                  </div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <div style={{display:"flex",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:2,gap:1}}>
                  {[["weekly","Wk"],["daily","Day"]].map(([val,lbl])=>(
                    <button key={val} onClick={()=>setGranularity(val)}
                      style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:5,border:"none",background:granularity===val?"var(--surface)":"transparent",color:granularity===val?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:granularity===val?700:400,boxShadow:granularity===val?"0 1px 3px rgba(0,0,0,0.1)":"none",transition:"all .15s"}}>{lbl}</button>
                  ))}
                </div>
              </div>
            </div>
            {!rcReady?<div className="cq-skel" style={{width:"100%",height:260,borderRadius:10}}/>:
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData} margin={{top:8,right:12,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="var(--accent)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--dim)" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="var(--dim)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid yAxisId="per" strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.85} vertical={false}/>
                <XAxis dataKey="label" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fill:"var(--dim)"}} axisLine={false} tickLine={false} interval={Math.max(0,Math.ceil(chartData.length/(granularity==="daily"?10:8))-1)}/>
                <YAxis yAxisId="per" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fill:"var(--dim)"}} axisLine={false} tickLine={false} width={28} allowDecimals={false} tickCount={5}/>
                <YAxis yAxisId="cum" orientation="right" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fill:"var(--accent)"}} axisLine={false} tickLine={false} width={32} allowDecimals={false}/>
                <Tooltip content={({active,payload,label})=>{
                  if(!active||!payload?.length) return null;
                  const names={bounties:`Bounties / ${granularity==="daily"?"day":"wk"}`,citations:`Citations / ${granularity==="daily"?"day":"wk"}`,cumBounties:"Total Bounties",cumCitations:"Total Citations"};
                  return (
                    <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"12px 16px",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginBottom:8}}>{label}</div>
                      {payload.map(p=>(
                        <div key={p.dataKey} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:p.color}}/>
                          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--muted)"}}>{names[p.dataKey]||p.dataKey}:</span>
                          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:500,color:"var(--text)"}}>{p.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}/>
                {[
                  <Area key="ac" isAnimationActive={false} yAxisId="cum" type="monotone" dataKey="cumCitations" stroke="none" fill="url(#gC)"/>,
                  <Area key="ab" isAnimationActive={false} yAxisId="cum" type="monotone" dataKey="cumBounties" stroke="none" fill="url(#gB)"/>,
                  <Bar key="bc" isAnimationActive={false} yAxisId="per" dataKey="citations" fill="var(--dim)" fillOpacity={0.34} radius={[2,2,0,0]}/>,
                  <Bar key="bb" isAnimationActive={false} yAxisId="per" dataKey="bounties" fill="var(--accent)" fillOpacity={0.30} radius={[2,2,0,0]}/>,
                  <Line key="cc" isAnimationActive={false} yAxisId="cum" type="monotone" dataKey="cumCitations" stroke="var(--dim)" strokeWidth={1.8} dot={false} activeDot={{r:4}}/>,
                  <Line key="cb" isAnimationActive={false} yAxisId="cum" type="monotone" dataKey="cumBounties" stroke="var(--accent)" strokeWidth={2.4} dot={false} activeDot={{r:4}}/>,
                ]}
              </ComposedChart>
            </ResponsiveContainer>}
          </div>

          {/* Stat strip — summary readout under the chart */}
          <div className="cq-statstrip" style={{display:"flex",alignItems:"stretch",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,boxShadow:"var(--shadow-sm)",marginBottom:28,overflow:"hidden",animation:"fadeUp .5s ease both"}}>
            {SUMMARY.slice(0, totalImpressions>0 ? 5 : 4).map((s,i)=>(
              <div key={i}
                onClick={s.drillKey?()=>{setDrill({type:s.drillKey});setDrillExpanded(false);}:undefined}
                style={{flex:1,minWidth:0,padding:"15px 20px",borderLeft:i?"1px solid var(--border)":"none",cursor:s.drillKey?"pointer":"default",transition:"background .15s"}}
                onMouseEnter={e=>{if(s.drillKey)e.currentTarget.style.background="color-mix(in srgb,var(--accent) 4%,transparent)";}}
                onMouseLeave={e=>{if(s.drillKey)e.currentTarget.style.background="transparent";}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                  {s.label}{s.drillKey&&<span style={{marginLeft:5,opacity:.4}}>→</span>}
                </div>
                <div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:27,fontWeight:700,color:"var(--text)",lineHeight:1,marginTop:10,letterSpacing:"-0.03em"}}>{s.value}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.sub}</div>
              </div>
            ))}
          </div>
          {/* Social — combined reach, channel mix & top content */}
          {(totalTwitter>0||totalTelegram>0)&&(()=>{
            const totalSocial=totalTwitter+totalTelegram;
            const twPct=totalSocial?Math.round(totalTwitter/totalSocial*100):0;
            const tgPct=100-twPct;
            const postsWithReach=tweetCount+tgPostCount;
            const avgPost=postsWithReach?Math.round(totalSocial/postsWithReach):0;
            // top content by combined reach
            const topPosts=[...campaigns]
              .map(c=>({...c, reach:parseNum(c.twitterImpressions)+parseNum(c.telegramImpressions)}))
              .filter(c=>c.reach>0)
              .sort((a,b)=>b.reach-a.reach);
            const maxReach=topPosts[0]?.reach||1;
            // §12 density rule: ≤14 publish buckets → dots on the curve; >14 → baseline "rug" of ticks.
            const reachPublishCount=chartData.filter(d=>(d.bounties||0)>0).length;
            const reachDense=reachPublishCount>14;
            const reachMaxB=Math.max(1,...chartData.map(d=>d.bounties||0));
            return (
              <div style={{marginBottom:28,animation:"fadeUp .5s ease both"}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,marginBottom:12}}>Social</div>
                <div className="cq-chart-row" style={{display:"flex",gap:14,marginBottom:12,alignItems:"stretch"}}>
                  {/* cumulative reach chart */}
                  <div style={{flex:"1.7 1 0",minWidth:0,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 20px",boxShadow:"var(--shadow-sm)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14,flexWrap:"wrap"}}>
                      <span style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:11.5,color:"var(--muted)"}}><span style={{width:14,height:2,background:"var(--accent)",borderRadius:2,display:"inline-block"}}/>Cumulative reach</span>
                      <span style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:11.5,color:"var(--muted)"}}>{reachDense?<span style={{width:2.5,height:12,background:"var(--accent)",borderRadius:1,display:"inline-block"}}/>:<span style={{width:8,height:8,background:"var(--accent)",borderRadius:99,border:"1.5px solid var(--surface)",display:"inline-block"}}/>}Bounty published</span>
                    </div>
                    {!rcReady?<div className="cq-skel" style={{width:"100%",height:170,borderRadius:10}}/>:
                    <ResponsiveContainer width="100%" height={170}>
                      <ComposedChart data={chartData} margin={{top:6,right:8,left:0,bottom:0}}>
                        <defs>
                          <linearGradient id="gReach" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22}/>
                            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--grid)" vertical={false}/>
                        <XAxis dataKey="label" tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fill:"var(--dim)"}} axisLine={false} tickLine={false} interval={Math.max(0,Math.ceil(chartData.length/(granularity==="daily"?10:8))-1)}/>
                        <YAxis tick={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fill:"var(--dim)"}} axisLine={false} tickLine={false} width={38} tickFormatter={fmtNum}/>
                        <Tooltip content={({active,payload,label})=>{
                          if(!active||!payload?.length) return null;
                          const bk=payload[0]?.payload?.bounties||0;
                          return (
                            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"10px 14px",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
                              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginBottom:6}}>{label}</div>
                              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:500,color:"var(--text)"}}>Reach: {fmtNum(payload[0].value)}</div>
                              {bk>0&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:500,color:"var(--accent)",marginTop:3}}>{bk} bount{bk!==1?"ies":"y"} published</div>}
                            </div>
                          );
                        }}/>
                        <Area isAnimationActive={false} type="monotone" dataKey="cumReach" stroke="var(--accent)" strokeWidth={2.2} fill="url(#gReach)" activeDot={{r:4}} dot={(p)=>{const bk=p.payload?.bounties||0; if(reachDense||bk<=0) return <g key={`rd-${p.index}`}/>; return <circle key={`rd-${p.index}`} cx={p.cx} cy={p.cy} r={bk>1?4.2:3.2} fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.6}/>;}}/>
                        <Line isAnimationActive={false} dataKey={()=>0} stroke="none" legendType="none" activeDot={false} dot={(p)=>{const bk=p.payload?.bounties||0; if(!reachDense||bk<=0) return <g key={`rg-${p.index}`}/>; const t=bk/reachMaxB; const h=6+t*13; const op=0.45+t*0.5; return <line key={`rg-${p.index}`} x1={p.cx} y1={p.cy} x2={p.cx} y2={p.cy-h} stroke="var(--accent)" strokeOpacity={op} strokeWidth={2} strokeLinecap="round"/>;}}/>
                      </ComposedChart>
                    </ResponsiveContainer>}
                  </div>
                  {/* combined total impressions */}
                  <div style={{flex:"1 1 0",minWidth:0,background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 20px",boxShadow:"var(--shadow-sm)",display:"flex",flexDirection:"column"}}>
                    <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Total Impressions</div>
                    <div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:34,fontWeight:700,color:"var(--text)",lineHeight:1,marginTop:12,letterSpacing:"-0.03em"}}>{fmtNum(totalSocial)}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:6}}>Twitter + Telegram combined</div>
                    <div style={{display:"flex",gap:24,marginTop:16,paddingTop:14,borderTop:"1px solid var(--border)"}}>
                      <div><div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:600,color:"var(--text)"}}>{postsWithReach}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:3}}>posts</div></div>
                      <div><div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:600,color:"var(--text)"}}>{fmtNum(avgPost)}</div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:3}}>avg / post</div></div>
                    </div>
                    <div style={{marginTop:"auto",paddingTop:16}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
                        <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Channel mix</span>
                        <span style={{display:"flex",gap:12,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>
                          <span style={{display:"inline-flex",alignItems:"center",gap:3}}><Icons.X s={10}/> {twPct}%</span><span style={{display:"inline-flex",alignItems:"center",gap:3}}><Icons.Telegram s={10}/> {tgPct}%</span>
                        </span>
                      </div>
                      <div style={{display:"flex",height:5,borderRadius:99,overflow:"hidden",background:"var(--surface2)",gap:1.5}}>
                        <div style={{width:`${twPct}%`,background:"var(--accent)"}}/>
                        <div style={{width:`${tgPct}%`,background:"var(--dim)",opacity:.7}}/>
                      </div>
                    </div>
                  </div>
                </div>
                {/* collapsible top content by reach */}
                {topPosts.length>0 && (
                  <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden",boxShadow:"var(--shadow-sm)"}}>
                    <div onClick={()=>setTopOpen(v=>!v)} role="button" aria-expanded={topOpen}
                      style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,padding:"14px 18px",cursor:"pointer",transition:"background .13s",background:topOpen?"color-mix(in srgb,var(--accent) 6%,transparent)":"transparent"}}
                      onMouseEnter={e=>{if(!topOpen)e.currentTarget.style.background="color-mix(in srgb,var(--accent) 5%,transparent)";}}
                      onMouseLeave={e=>{if(!topOpen)e.currentTarget.style.background="transparent";}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
                        <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,whiteSpace:"nowrap"}}>Top Content · by reach</span>
                        {!topOpen&&topPosts[0]&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>#1 <span style={{color:"var(--text)"}}>{topPosts[0].title}</span> · <span style={{color:"var(--accent)",fontWeight:600}}>{fmtNum(topPosts[0].reach)}</span></span>}
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"2px 8px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{topPosts.length} posts</span>
                        <span style={{color:"var(--dim)",fontSize:11,transform:topOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
                      </div>
                    </div>
                    {topOpen&&topPosts.slice(0,10).map((b,i)=>{
                      const tw=parseNum(b.twitterImpressions), tg=parseNum(b.telegramImpressions);
                      const xUrl=b.cqTwitterLink||b.authorTwitterLink, tgUrl=b.telegramLink||b.authorTelegramLink;
                      return (
                        <div key={b.id||b.title} style={{display:"grid",gridTemplateColumns:"26px minmax(0,1fr) 150px 116px",alignItems:"center",gap:16,padding:"12px 18px",borderTop:"1px solid var(--border)"}}>
                          <div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:i===0?"var(--accent)":"var(--dim)",textAlign:"center"}}>{i+1}</div>
                          <div style={{minWidth:0}}>
                            <div title={b.title} style={{fontSize:13,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{b.title}</div>
                            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>{b.author} · {b.date}</div>
                          </div>
                          <div style={{minWidth:0}}>
                            <div style={{height:5,borderRadius:99,background:"var(--surface2)",overflow:"hidden",marginBottom:5}}>
                              <div style={{width:`${(b.reach/maxReach)*100}%`,height:"100%",borderRadius:99,background:"var(--accent)",opacity:1-i*0.07}}/>
                            </div>
                            <div style={{display:"flex",gap:10,fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,color:"var(--dim)"}}>
                              {tw>0&&(xUrl
                                ? <a href={xUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} title="Open X post" style={{display:"inline-flex",alignItems:"center",gap:3,color:"inherit",textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="var(--accent)"} onMouseLeave={e=>e.currentTarget.style.color="inherit"}><Icons.X s={10}/> {fmtNum(tw)}</a>
                                : <span style={{display:"inline-flex",alignItems:"center",gap:3}}><Icons.X s={10}/> {fmtNum(tw)}</span>)}
                              {tg>0&&(tgUrl
                                ? <a href={tgUrl} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} title="Open Telegram post" style={{display:"inline-flex",alignItems:"center",gap:3,color:"inherit",textDecoration:"none"}} onMouseEnter={e=>e.currentTarget.style.color="var(--accent)"} onMouseLeave={e=>e.currentTarget.style.color="inherit"}><Icons.Telegram s={10}/> {fmtNum(tg)}</a>
                                : <span style={{display:"inline-flex",alignItems:"center",gap:3}}><Icons.Telegram s={10}/> {fmtNum(tg)}</span>)}
                            </div>
                          </div>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8}}>
                            <div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:600,color:"var(--text)",letterSpacing:"-0.02em"}}>{fmtNum(b.reach)}</div>
                            {b.cqLink&&<a href={b.cqLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 7px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 7%,transparent)",border:"1px solid rgba(26,58,92,0.1)",color:"var(--accent)",textDecoration:"none",flexShrink:0}}>↗</a>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
          {/* Leaderboards — 3-column compact grid */}
          <LeaderboardsSection leaderData={leaderData} citations={citations} campaigns={campaigns} fmtNum={fmtNum} parseNum={parseNum}/>
          <CQResearchExplorer campaigns={campaigns} citations={citations} fmtNum={fmtNum} parseNum={parseNum}/>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  WEEKLY SUMMARY TAB
// ─────────────────────────────────────────────────────────
const WeeklySummaryTab = ({campaigns, citations, color}) => {
  const [drill, setDrill] = useState(null);
  const [mode, setMode] = useState("weekly"); // "weekly" | "custom"
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");

  // ── WEEK NAVIGATION ───────────────────────────────────────
  const getMondayOf = (date) => {
    const d = new Date(date);
    d.setHours(0,0,0,0);
    const day = d.getDay();
    d.setDate(d.getDate() - ((day + 6) % 7));
    return d;
  };

  const todayMonday = getMondayOf(new Date());
  const [weekStart, setWeekStart] = useState(todayMonday);
  const [manuallyNavigated, setManuallyNavigated] = useState(false);

  useEffect(()=>{
    if(manuallyNavigated) return;
    const allDates = [...campaigns.map(c=>c.date),...citations.map(c=>c.date)]
      .filter(d => d && /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    if(!allDates.length) return;
    const lastDate = new Date(allDates[allDates.length-1]+"T00:00:00");
    if(isNaN(lastDate.getTime())) return;
    const lastMonday = getMondayOf(lastDate);
    if(isNaN(lastMonday.getTime())) return;
    setWeekStart(lastMonday > todayMonday ? todayMonday : lastMonday);
  },[campaigns.length, citations.length]);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const toLocalDateStr = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  };

  const weekStartStr = toLocalDateStr(weekStart);
  const weekEndStr   = toLocalDateStr(weekEnd);

  const isCurrentWeek = weekStartStr === toLocalDateStr(todayMonday);

  const latestDataMonday = (() => {
    const allDates = [...campaigns.map(c=>c.date),...citations.map(c=>c.date)].filter(Boolean).sort();
    if(!allDates.length) return todayMonday;
    const lastDate = new Date(allDates[allDates.length-1]+"T00:00:00");
    const lastMonday = getMondayOf(lastDate);
    return lastMonday > todayMonday ? todayMonday : lastMonday;
  })();

  const isLatestWeek = weekStartStr === toLocalDateStr(latestDataMonday);

  const goBack    = () => { const d=new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d); setManuallyNavigated(true); setDrill(null); };
  const goForward = () => { if(isCurrentWeek) return; const d=new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d); setManuallyNavigated(true); setDrill(null); };
  const goLatest  = () => { setWeekStart(latestDataMonday); setManuallyNavigated(true); setDrill(null); };

  // ── EFFECTIVE DATE RANGE ─────────────────────────────────
  const effectiveFrom = mode==="custom" ? customFrom : weekStartStr;
  const effectiveTo   = mode==="custom" ? customTo   : weekEndStr;
  const dateRange = mode==="custom" && customFrom && customTo
    ? `${customFrom} – ${customTo}`
    : `${weekStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${weekEnd.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;

  // ── DATA FOR THIS PERIOD ──────────────────────────────────
  const weekBounties  = campaigns.filter(c=>c.date&&(!effectiveFrom||c.date>=effectiveFrom)&&(!effectiveTo||c.date<=effectiveTo));
  const weekCitations = citations.filter(c=>c.date&&(!effectiveFrom||c.date>=effectiveFrom)&&(!effectiveTo||c.date<=effectiveTo));

  // Previous week for WoW delta (guard against Invalid Date)
  const safeIso = (d) => { try { return d && !isNaN(d.getTime()) ? d.toISOString().slice(0,10) : ""; } catch { return ""; } };
  const prevStart = new Date(weekStart); if(!isNaN(prevStart.getTime())) prevStart.setDate(prevStart.getDate()-7);
  const prevEnd   = new Date(weekStart); if(!isNaN(prevEnd.getTime()))   prevEnd.setDate(prevEnd.getDate()-1);
  const prevStartStr = safeIso(prevStart);
  const prevEndStr   = safeIso(prevEnd);
  const prevBounties  = campaigns.filter(c=>c.date&&c.date>=prevStartStr&&c.date<=prevEndStr);
  const prevCitations = citations.filter(c=>c.date&&c.date>=prevStartStr&&c.date<=prevEndStr);

  const authorsSet = new Set([...weekBounties.map(c=>c.author),...weekCitations.map(c=>c.author)].filter(Boolean));
  const outletsSet = new Set(weekCitations.map(c=>c.media).filter(Boolean));

  // ── DRILL STATE ──────────────────────────────────────────
  const [drillExpanded, setDrillExpanded] = useState(false);

  // ── HELPERS ──────────────────────────────────────────────
  const delta = (curr,prev) => {
    if(prev===0&&curr===0) return null;
    if(prev===0) return {val:curr,pct:null,up:true};
    const pct = Math.round(((curr-prev)/prev)*100);
    return {val:curr-prev,pct,up:curr>=prev};
  };

  const Delta = ({curr,prev}) => {
    const d = delta(curr,prev);
    if(!d) return null;
    const col = d.up?"var(--positive)":"var(--negative)";
    const sign = d.val>=0?"+":"";
    return (
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:col,display:"inline-flex",alignItems:"center",gap:3}}>
        {d.up?"↑":"↓"} {sign}{d.pct!==null?`${d.pct}%`:`${d.val}`} vs last week
      </span>
    );
  };

  // ── DAILY BAR DATA ───────────────────────────────────────
  const days = (()=>{
    if(mode==="custom"){
      let startStr=effectiveFrom, endStr=effectiveTo;
      if(!startStr||!endStr){
        const allDates=[...weekBounties.map(c=>c.date),...weekCitations.map(c=>c.date)].filter(Boolean).sort();
        if(!allDates.length) return [];
        if(!startStr) startStr=allDates[0];
        if(!endStr)   endStr=allDates[allDates.length-1];
      }
      const start=new Date(startStr+"T00:00:00");
      const end=new Date(endStr+"T00:00:00");
      const out=[]; const cur=new Date(start);
      while(cur<=end && out.length<92){ out.push(toLocalDateStr(cur)); cur.setDate(cur.getDate()+1); }
      return out;
    }
    return Array.from({length:7},(_,i)=>{
      const d=new Date(weekStartStr+"T00:00:00");
      d.setDate(d.getDate()+i);
      return toLocalDateStr(d);
    });
  })();
  const dayData = days.map(day=>({
    day,
    label: new Date(day+"T00:00:00").toLocaleDateString("en-US",{weekday:"short"}),
    date:  new Date(day+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}),
    bounties:  weekBounties.filter(c=>c.date===day).length,
    citations: weekCitations.filter(c=>c.date===day).length,
  }));
  const maxVal = Math.max(...dayData.map(d=>d.bounties+d.citations),1);
  const totalActivity = weekBounties.length+weekCitations.length;

  // ── TOP AUTHORS / OUTLETS / HEADLINES ───────────────────
  const {topAuthors, maxAuthorTotal, topOutlets, maxOutlet, topHeadlines, maxHeadline, tierEntries} = useMemo(()=>{
    const authorMap={};
    weekBounties.forEach(c=>{const a=c.author||"Unknown";const ak=a.toLowerCase();if(!authorMap[ak])authorMap[ak]={name:a,bounties:0,citations:0};authorMap[ak].bounties++;});
    weekCitations.forEach(c=>{const a=c.author||"Unknown";const ak=a.toLowerCase();if(!authorMap[ak])authorMap[ak]={name:a,bounties:0,citations:0};authorMap[ak].citations++;});
    const topAuthors=Object.values(authorMap).sort((a,b)=>(b.bounties+b.citations)-(a.bounties+a.citations)).slice(0,5);
    const maxAuthorTotal=(topAuthors[0]?.bounties||0)+(topAuthors[0]?.citations||0)||1;

    const outletMap={};
    weekCitations.forEach(c=>{const m=c.media||"Unknown";const mk=m.toLowerCase();if(!outletMap[mk])outletMap[mk]=0;outletMap[mk]++;});
    const topOutlets=Object.entries(outletMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
    const maxOutlet=topOutlets[0]?.[1]||1;

    const headlineMap={};
    weekCitations.forEach(c=>{const h=((c.headline||c.topic)||"").trim();if(!h)return;const hk=h.toLowerCase();if(!headlineMap[hk])headlineMap[hk]={label:h,count:0};headlineMap[hk].count++;});
    const topHeadlines=Object.values(headlineMap).sort((a,b)=>b.count-a.count).slice(0,5);
    const maxHeadline=topHeadlines[0]?.count||1;

    const tierMap={};
    weekCitations.forEach(c=>{const t=(c.mediaTier||"").trim();if(!t)return;tierMap[t]=(tierMap[t]||0)+1;});
    const tierEntries=Object.entries(tierMap).sort((a,b)=>a[0].localeCompare(b[0]));

    return {topAuthors,maxAuthorTotal,topOutlets,maxOutlet,topHeadlines,maxHeadline,tierEntries};
  },[weekBounties.length, weekCitations.length, effectiveFrom, effectiveTo, mode]);

  // using global getTierColor

  // ── RECENT ENTRIES FEED ──────────────────────────────────
  const recentAll = useMemo(()=>[
    ...weekBounties.map(b=>({...b,_type:"bounty"})),
    ...weekCitations.map(c=>({...c,_type:"citation"})),
  ].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,6),[weekBounties.length, weekCitations.length, effectiveFrom, effectiveTo, mode]);

  // ── DRILL VIEW ───────────────────────────────────────────
  if(drill){
    let items=[], itemKind="citation", drillTitle="Media Citations";
    const eq=(a,b)=>(a||"").trim().toLowerCase()===(b||"").trim().toLowerCase();
    if(drill.type==="bounties"){
      items=weekBounties; itemKind="bounty"; drillTitle="Bounties";
    } else if(drill.type==="citations"){
      items=weekCitations; itemKind="citation"; drillTitle="Media Citations";
    } else if(drill.type==="headline"){
      items=weekCitations.filter(c=>eq(c.headline||c.topic, drill.value));
      itemKind="citation"; drillTitle=`Headline · ${drill.value}`;
    } else if(drill.type==="tier"){
      items=weekCitations.filter(c=>(c.mediaTier||"").trim()===drill.value);
      itemKind="citation"; drillTitle=`Tier ${drill.value}`;
    } else if(drill.type==="outlet"){
      items=weekCitations.filter(c=>eq(c.media, drill.value));
      itemKind="citation"; drillTitle=`Outlet · ${drill.value}`;
    } else if(drill.type==="author"){
      const bs=weekBounties.filter(b=>eq(b.author, drill.value)).map(b=>({...b,_type:"bounty"}));
      const cs=weekCitations.filter(c=>eq(c.author, drill.value)).map(c=>({...c,_type:"citation"}));
      items=[...bs,...cs];
      itemKind="mixed"; drillTitle=`Author · ${drill.value}`;
    }
    const sorted=[...items].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    const visible=drillExpanded?sorted:sorted.slice(0,10);
    const renderRow=(item)=>{
      const kind = itemKind==="mixed" ? item._type : itemKind;
      if(kind==="bounty"){
        return <>
          <div title={item.title} style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.title}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>{item.author}</div>
        </>;
      }
      return <>
        <div title={item.topic||item.media} style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.topic||item.media}</div>
        {item.headline&&<div title={item.headline} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.headline}</div>}
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>{item.media}{item.reporter&&item.reporter!=="Publisher"?` · ${item.reporter}`:""}</div>
      </>;
    };
    const rowLink=(item)=>{
      const kind = itemKind==="mixed" ? item._type : itemKind;
      return kind==="bounty" ? item.cqLink : item.articleLink;
    };
    return (
      <div style={{animation:"fadeUp .4s ease both"}}>
        <button onClick={()=>setDrill(null)} style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",marginBottom:20}}>
          ← Back to Summary
        </button>
        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{dateRange}</div>
        <h3 style={{fontSize:18,fontWeight:600,letterSpacing:"-0.01em",marginBottom:20}}>{drillTitle} <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:400,color:"var(--dim)",marginLeft:8}}>{items.length}</span></h3>
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          {sorted.length===0
            ?<div style={{padding:"40px",textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"var(--dim)"}}>No activity this period</div>
            :<>
              <div style={{maxHeight:"520px",overflowY:"auto"}}>
                {visible.map((item,i)=>{
                  const link=rowLink(item);
                  return (
                  <div key={item.id} style={{display:"grid",gridTemplateColumns:"90px 1fr auto",alignItems:"center",gap:12,padding:"11px 20px",borderBottom:i<visible.length-1?"1px solid var(--border)":"none",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.04)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>{item.date}</div>
                    <div style={{minWidth:0}}>{renderRow(item)}</div>
                    {link&&(
                      <a href={link} target="_blank" rel="noreferrer"
                        style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 7%,transparent)",border:"1px solid rgba(26,58,92,0.1)",color:"var(--accent)",textDecoration:"none",flexShrink:0}}>↗</a>
                    )}
                  </div>
                  );
                })}
              </div>
              {sorted.length>10&&(
                <button onClick={()=>setDrillExpanded(v=>!v)}
                  style={{width:"100%",padding:"10px",border:"none",borderTop:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'JetBrains Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)"}}
                  onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)"}}>
                  {drillExpanded?`▲ SHOW LESS`:`▼ SHOW ALL ${sorted.length} ENTRIES`}
                </button>
              )}
            </>
          }
        </div>
      </div>
    );
  }

  // ── RENDER ───────────────────────────────────────────────
  return (
    <div style={{animation:"fadeUp .5s ease both"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{dateRange}</div>
          <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>{mode==="custom"?"Custom Range":"Weekly Summary"}</h2>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {/* Mode toggle */}
          <div style={{display:"flex",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:3,gap:2}}>
            {[["weekly","Weekly"],["custom","Custom"]].map(([m,label])=>(
              <button key={m} onClick={()=>{
                setMode(m);
                setDrill(null);
                if(m==="custom"&&!customFrom){
                  const prevMonday=new Date(todayMonday);
                  prevMonday.setDate(prevMonday.getDate()-7);
                  setCustomFrom(toLocalDateStr(prevMonday));
                  if(!customTo) setCustomTo(toLocalDateStr(new Date()));
                }
              }}
                style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:6,border:"none",background:mode===m?"var(--surface)":"transparent",color:mode===m?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:mode===m?700:400,boxShadow:mode===m?"0 1px 3px rgba(0,0,0,0.08)":"none",transition:"all .15s"}}>
                {label}
              </button>
            ))}
          </div>

          {/* Weekly nav */}
          {mode==="weekly" && (<>
            <button onClick={goBack}
              style={{width:32,height:32,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)",fontSize:14,transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--text)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>
              ‹
            </button>
            {!isLatestWeek&&(
              <button onClick={goLatest}
                style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"6px 12px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:"pointer",letterSpacing:"0.04em",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--accent)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)";}}>
                Latest
              </button>
            )}
            <button onClick={goForward} disabled={isLatestWeek}
              style={{width:32,height:32,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",cursor:isLatestWeek?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:isLatestWeek?"var(--border2)":"var(--muted)",fontSize:14,transition:"all .15s"}}
              onMouseEnter={e=>{if(!isLatestWeek){e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--text)";}}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color=isLatestWeek?"var(--border2)":"var(--muted)";}}>
              ›
            </button>
          </>)}

          {/* Custom date inputs */}
          {mode==="custom" && (
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <input type="date" value={customFrom} onChange={e=>{setCustomFrom(e.target.value);setDrill(null);}}
                style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>→</span>
              <input type="date" value={customTo} onChange={e=>{setCustomTo(e.target.value);setDrill(null);}}
                style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards with WoW delta */}
      <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Bounties",      curr:weekBounties.length,  prev:mode==="weekly"?prevBounties.length:null,  sub:"Bounties published",   c:"var(--accent)", key:"bounties"},
          {label:"Citations",     curr:weekCitations.length, prev:mode==="weekly"?prevCitations.length:null, sub:"Media mentions",    c:"var(--accent)",       key:"citations"},
          {label:"Active Authors",curr:authorsSet.size,      prev:null,                 sub:"Contributors",      c:"var(--accent)", key:null},
          {label:"Media Outlets", curr:outletsSet.size,      prev:null,                 sub:"Unique publications",c:"var(--accent)",      key:null},
        ].map((s,i)=>(
          <div key={i} onClick={s.key?()=>{setDrill({type:s.key});setDrillExpanded(false);}:undefined}
            style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"16px 18px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)",cursor:s.key?"pointer":"default",transition:"all .15s"}}
            onMouseEnter={e=>{if(s.key){e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)";e.currentTarget.style.transform="translateY(-1px)";}}}
            onMouseLeave={e=>{if(s.key){e.currentTarget.style.boxShadow="0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)";e.currentTarget.style.transform="none";}}}>
            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>
              {s.label}{s.key&&<span style={{marginLeft:5,opacity:.4}}>→</span>}
            </div>
            <div className="tabular" style={{fontSize:30,fontWeight:700,letterSpacing:"-0.03em",color:s.curr===0?"var(--border2)":"var(--text)",lineHeight:1,marginBottom:6}}>{s.curr}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>{s.sub}</div>
              {s.prev!==null&&<Delta curr={s.curr} prev={s.prev}/>}
            </div>
          </div>
        ))}
      </div>

      {/* Activity chart + recent feed — side by side */}
      <div className="cq-chart-row" style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14,marginBottom:14}}>

        {/* Daily bar chart */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexShrink:0}}>
            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Daily Activity</div>
            <div style={{display:"flex",gap:14}}>
              {[{color:"var(--accent)",label:"Bounties"},{color:"var(--accent)",label:"Citations"}].map((l,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:8,height:8,borderRadius:2,background:l.color,opacity:.8}}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{flex:1,display:"flex",alignItems:"flex-end",gap:6,minHeight:100}}>
            {dayData.map((d,i)=>{
              const total=d.bounties+d.citations;
              const bPct=maxVal?(d.bounties/maxVal)*100:0;
              const cPct=maxVal?(d.citations/maxVal)*100:0;
              const isEmpty=total===0;
              return (
                <div key={d.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",height:"100%",justifyContent:"flex-end",gap:0}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:isEmpty?"transparent":"var(--accent)",fontWeight:600,marginBottom:3,height:13,flexShrink:0}}>{total||""}</div>
                  <div style={{flex:1,width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"stretch",gap:0,position:"relative"}}>
                    {isEmpty
                      ? <div style={{width:"100%",height:"100%",background:"var(--surface2)",borderRadius:4,border:"1px dashed var(--border)"}}/>
                      : <>
                          {d.citations>0&&<div style={{width:"100%",height:`${cPct}%`,minHeight:4,background:"var(--accent)",opacity:.75,borderRadius:d.bounties>0?"3px 3px 0 0":"3px 3px 0 0",transition:"height .4s ease"}}/>}
                          {d.bounties>0&&<div style={{width:"100%",height:`${bPct}%`,minHeight:4,background:"var(--accent)",opacity:.85,borderRadius:d.citations>0?"0":"3px 3px 0 0",transition:"height .4s ease"}}/>}
                          <div style={{height:2,background:color,width:"100%",opacity:.4,flexShrink:0}}/>
                        </>
                    }
                  </div>
                  <div style={{textAlign:"center",marginTop:7,flexShrink:0}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,color:isEmpty?"var(--border2)":"var(--text)"}}>{d.label}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:"var(--dim)"}}>{d.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {totalActivity===0&&(
            <div style={{marginTop:8,textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",flexShrink:0}}>
              No activity recorded in this period
            </div>
          )}
        </div>

        {/* Recent entries feed */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column"}}>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Recent Activity</div>
          {recentAll.length===0
            ? <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:"20px 0"}}>
                <div style={{fontSize:28,opacity:.15}}>◎</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",textAlign:"center"}}>Nothing posted this week</div>
              </div>
            : <div style={{display:"flex",flexDirection:"column",gap:0,flex:1}}>
                {recentAll.map((item,i)=>(
                  <div key={item.id} style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 0",borderBottom:i<recentAll.length-1?"1px solid var(--border)":"none"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:item._type==="bounty"?"var(--accent)":"var(--accent)",flexShrink:0,marginTop:5}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:1}}>
                        {item._type==="bounty"?item.title:(item.headline||item.media||"—")}
                      </div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>
                        {item._type==="bounty"?item.author:item.media} · {item.date}
                      </div>
                    </div>
                    {(item._type==="bounty"?item.cqLink:item.articleLink)&&(
                      <a href={item._type==="bounty"?item.cqLink:item.articleLink} target="_blank" rel="noreferrer"
                        style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",textDecoration:"none",flexShrink:0,opacity:.6}}>↗</a>
                    )}
                  </div>
                ))}
              </div>
          }
          {(weekBounties.length+weekCitations.length)>6&&(
            <div style={{marginTop:8,display:"flex",gap:8}}>
              {weekBounties.length>0&&<button onClick={()=>{setDrill({type:"bounties"});setDrillExpanded(false);}} style={{flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"5px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",letterSpacing:"0.04em",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)";e.currentTarget.style.borderColor="rgba(26,58,92,0.3)"}}
                onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)";e.currentTarget.style.borderColor="var(--border)"}}>
                All bounties →
              </button>}
              {weekCitations.length>0&&<button onClick={()=>{setDrill({type:"citations"});setDrillExpanded(false);}} style={{flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"5px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",letterSpacing:"0.04em",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)";e.currentTarget.style.borderColor="rgba(74,127,168,0.3)"}}
                onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)";e.currentTarget.style.borderColor="var(--border)"}}>
                All citations →
              </button>}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: 2x2 grid */}
      {(topAuthors.length>0||topOutlets.length>0||topHeadlines.length>0||tierEntries.length>0)&&(
        <div className="cq-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>

        {/* Top headlines */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Top Headlines</div>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{topHeadlines.length}</span>
          </div>
          {topHeadlines.length===0
            ?<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No citations this week</div>
            :<div style={{display:"flex",flexDirection:"column",gap:9}}>
              {topHeadlines.map((h,i)=>(
                <div key={h.label} onClick={()=>{setDrill({type:"headline",value:h.label});setDrillExpanded(false);}}
                  style={{cursor:"pointer",borderRadius:6,padding:"4px 6px",margin:"-4px -6px",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(74,127,168,0.06)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{i+1}</span>
                      <span title={h.label} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.label}</span>
                    </div>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600,flexShrink:0,marginLeft:8}}>{h.count}</span>
                  </div>
                  <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                    <div style={{width:`${(h.count/maxHeadline)*100}%`,height:"100%",background:"var(--accent)",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        {/* Media Tier */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Media Tier</div>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{weekCitations.length} total</span>
          </div>
          {tierEntries.length===0
            ?<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No tier data this week</div>
            :<div style={{display:"flex",flexDirection:"column",gap:10}}>
              {tierEntries.map(([tier,count])=>{
                const tc=getTierColor(tier);
                const pct=(count/weekCitations.length)*100;
                return (
                  <div key={tier} onClick={()=>{setDrill({type:"tier",value:tier});setDrillExpanded(false);}}
                    style={{cursor:"pointer",borderRadius:6,padding:"4px 6px",margin:"-4px -6px",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background=tc.bg}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color}}>Tier {tier}</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:tc.color}}>{count} <span style={{color:"var(--dim)",fontWeight:400}}>({Math.round(pct)}%)</span></span>
                    </div>
                    <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:tc.color,borderRadius:99,transition:"width .4s"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </div>

          {/* Top authors */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Top Authors</div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{authorsSet.size}</span>
            </div>
            {topAuthors.length===0
              ?<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No author activity</div>
              :<div style={{display:"flex",flexDirection:"column",gap:9}}>
                {topAuthors.map((a,i)=>{
                  return (
                    <div key={a.name} onClick={()=>window.dispatchEvent(new CustomEvent("cq-nav-author",{detail:a.name}))}
                      style={{cursor:"pointer",borderRadius:6,padding:"4px 6px",margin:"-4px -6px",transition:"background .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.05)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",width:14,textAlign:"right"}}>{i+1}</span>
                          <span style={{fontSize:12,fontWeight:500,color:"var(--text)"}}>{a.name}</span>
                        </div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          {a.bounties>0&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600}}>{a.bounties}b</span>}
                          {a.citations>0&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600}}>{a.citations}c</span>}
                        </div>
                      </div>
                      <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                        <div style={{display:"flex",height:"100%"}}>
                          <div style={{width:`${maxAuthorTotal?(a.bounties/maxAuthorTotal)*100:0}%`,background:"var(--accent)",opacity:.8,transition:"width .4s"}}/>
                          <div style={{width:`${maxAuthorTotal?(a.citations/maxAuthorTotal)*100:0}%`,background:"var(--accent)",opacity:.7,transition:"width .4s"}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>

          {/* Top outlets */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Top Media Outlets</div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{outletsSet.size}</span>
            </div>
            {topOutlets.length===0
              ?<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No media coverage this week</div>
              :<div style={{display:"flex",flexDirection:"column",gap:9}}>
                {topOutlets.map(([outlet,count],i)=>{
                  const display=weekCitations.find(c=>(c.media||"").toLowerCase()===outlet)?.media || outlet;
                  return (
                  <div key={outlet} onClick={()=>{setDrill({type:"outlet",value:display});setDrillExpanded(false);}}
                    style={{cursor:"pointer",borderRadius:6,padding:"4px 6px",margin:"-4px -6px",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(74,127,168,0.06)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",width:14,textAlign:"right"}}>{i+1}</span>
                        <span title={display} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{display}</span>
                      </div>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600,flexShrink:0,marginLeft:8}}>{count}</span>
                    </div>
                    <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                      <div style={{width:`${(count/maxOutlet)*100}%`,height:"100%",background:"var(--accent)",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
                    </div>
                  </div>
                  );
                })}
              </div>
            }
          </div>

        </div>
      )}
    </div>
  );
};




// ─────────────────────────────────────────────────────────
//  PDF REPORT MODAL
// ─────────────────────────────────────────────────────────
const PdfReportModal = ({campaigns, citations, campaignName, initialFrom, initialTo, onClose}) => {
  const today = new Date().toISOString().slice(0,10);
  const earliest = [...campaigns.map(c=>c.date),...citations.map(c=>c.date)].filter(Boolean).sort()[0] || today;

  const [dateFrom, setDateFrom] = useState(initialFrom || earliest);
  const [dateTo,   setDateTo]   = useState(initialTo || today);

  const parseNum = v => { if(!v) return 0; const s=String(v).replace(/,/g,"").trim(); if(/k$/i.test(s)) return Math.round(parseFloat(s)*1000); if(/m$/i.test(s)) return Math.round(parseFloat(s)*1000000); return parseInt(s)||0; };
  const fmtNum = n => n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(0)}k`:String(n);

  const b = campaigns.filter(c=>c.date&&c.date>=dateFrom&&c.date<=dateTo);
  const c = citations.filter(x=>x.date&&x.date>=dateFrom&&x.date<=dateTo);
  const previewImpr = b.reduce((s,x)=>s+parseNum(x.twitterImpressions)+parseNum(x.telegramImpressions),0);

  const generatePDF = () => {
    const esc = s => String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const fmtD=iso=>{if(!iso)return"—";const [y,m,d]=iso.split("-");return`${MONTHS[+m-1]||"?"} ${+d}, ${y}`;};
    const fmtMD=iso=>{if(!iso)return"—";const p=iso.split("-");return`${MONTHS[+p[1]-1]||"?"} ${+p[2]}`;};
    const tierOf=x=>{const m=String(x.mediaTier||"").trim().match(/\d+/);return m?m[0]:"";};

    const totalTwitter  = b.reduce((s,x)=>s+parseNum(x.twitterImpressions),0);
    const totalTelegram = b.reduce((s,x)=>s+parseNum(x.telegramImpressions),0);
    const totalImpr     = totalTwitter+totalTelegram;
    const cn=esc(campaignName||"Campaign");

    // ── outlets (preserve original casing) ──
    const omap={};
    c.forEach(x=>{const m=(x.media||"").trim(); if(m) omap[m]=(omap[m]||0)+1;});
    const outletsSorted=Object.entries(omap).sort((a,z)=>z[1]-a[1]);
    const topOutlets=outletsSorted.slice(0,6);
    const maxOut=topOutlets[0]?.[1]||1;
    const uniqueOutlets=outletsSorted.length;

    // ── headlines ──
    const hMap={};
    c.forEach(x=>{const h=((x.headline||x.topic)||"").trim();if(!h)return;const k=h.toLowerCase();if(!hMap[k])hMap[k]={label:h,count:0,outlets:{},date:x.date||""};hMap[k].count++;if(x.media){const m=x.media.trim();if(m)hMap[k].outlets[m]=(hMap[k].outlets[m]||0)+1;}if(x.date&&(!hMap[k].date||x.date<hMap[k].date))hMap[k].date=x.date;});
    const headlines=Object.values(hMap).map(e=>({...e,outlet:Object.entries(e.outlets).sort((a,z)=>z[1]-a[1])[0]?.[0]||"—"})).sort((a,z)=>z.count-a.count);
    const maxHl=headlines[0]?.count||1;

    // ── tiers ──
    const tmap={};
    c.forEach(x=>{const t=tierOf(x);if(t)tmap[t]=(tmap[t]||0)+1;});
    const tierEntries=Object.entries(tmap).sort((a,z)=>a[0].localeCompare(z[0]));
    const totalTierCits=tierEntries.reduce((s,[,n])=>s+n,0)||1;
    const t12pct=Math.round(((tmap["1"]||0)+(tmap["2"]||0))/totalTierCits*100);
    const pickup=b.length?(c.length/b.length).toFixed(1):"0.0";

    // ── social ──
    const posts=b.map(x=>{const tw=parseNum(x.twitterImpressions),tg=parseNum(x.telegramImpressions);return{title:x.title||"—",author:x.author||"",date:x.date||"",reach:tw+tg,tw,tg,link:x.cqLink||x.cqTwitterLink||x.telegramLink||x.authorTwitterLink||""};}).filter(p=>p.reach>0).sort((a,z)=>z.reach-a.reach);
    const maxReach=posts[0]?.reach||1;
    const nPosts=posts.length;
    // peak post reach — the best single post (posts[] is sorted desc), a strong honest headline number
    const peakPost=posts[0]?.reach||0;

    const xMark='<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-1px"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';

    // ── cumulative weekly series for charts ──
    const weekKey=iso=>{try{const d=new Date(iso+"T00:00:00");if(isNaN(d.getTime()))return null;const mo=new Date(d);mo.setDate(d.getDate()-((d.getDay()+6)%7));return mo.toISOString().slice(0,10);}catch{return null;}};
    const wmap={};
    b.forEach(x=>{const k=weekKey(x.date);if(!k)return;(wmap[k]=wmap[k]||{b:0,c:0,imp:0});wmap[k].b++;wmap[k].imp+=parseNum(x.twitterImpressions)+parseNum(x.telegramImpressions);});
    c.forEach(x=>{const k=weekKey(x.date);if(!k)return;(wmap[k]=wmap[k]||{b:0,c:0,imp:0});wmap[k].c++;});
    const weekKeys=Object.keys(wmap).sort();
    const weeks=weekKeys.map(k=>wmap[k]);
    let _cb=0,_cc=0,_ci=0;const cumB=[],cumC=[],cumI=[];
    weeks.forEach(w=>{_cb+=w.b;_cc+=w.c;_ci+=w.imp;cumB.push(_cb);cumC.push(_cc);cumI.push(_ci);});
    const CWp=760,CHp=150,BB=20,PL=8,GR=44,PR=CWp-GR;
    const Xp=(i,n)=>n<=1?PL+(PR-PL)/2:PL+(i/(n-1))*(PR-PL);
    const fmtAxis=v=>{const a=Math.round(v);return a>=1000000?`${(a/1000000).toFixed(a>=1e7?0:1)}M`:a>=1000?`${Math.round(a/1000)}k`:String(a);};
    // ── daily series for the activity chart (mirrors the on-site Performance chart) ──
    const dmap={};
    b.forEach(x=>{if(!x.date)return;(dmap[x.date]=dmap[x.date]||{b:0,c:0});dmap[x.date].b++;});
    c.forEach(x=>{if(!x.date)return;(dmap[x.date]=dmap[x.date]||{b:0,c:0});dmap[x.date].c++;});
    const dKeys=Object.keys(dmap).sort();
    let _ab=0,_ac=0;const dRows=dKeys.map(k=>{_ab+=dmap[k].b;_ac+=dmap[k].c;return{k,b:dmap[k].b,c:dmap[k].c,cb:_ab,cc:_ac};});
    const niceTop=v=>{const p=Math.pow(10,Math.floor(Math.log10(v)));const f=v/p;const nf=f<=1?1:f<=2?2:f<=5?5:10;return nf*p;};
    const actSvg=dRows.length?(()=>{
      const CHa=300,GLa=34,GRa=44,topA=16,baseA=CHa-24,plotL=GLa,plotR=CWp-GRa,plotW=plotR-plotL,n=dRows.length;
      const topPer=niceTop(Math.max(1,...dRows.map(r=>Math.max(r.b,r.c)))),topCum=niceTop(Math.max(1,_ab,_ac));
      const Xc=i=>n<=1?plotL+plotW/2:plotL+(i/(n-1))*plotW;
      const Yp=v=>baseA-(v/topPer)*(baseA-topA),Yc=v=>baseA-(v/topCum)*(baseA-topA);
      let grid="";for(let t=0;t<=4;t++){const p=t/4,y=baseA-p*(baseA-topA);grid+=`<line x1="${plotL}" y1="${y.toFixed(1)}" x2="${plotR}" y2="${y.toFixed(1)}" stroke="#243056" stroke-dasharray="3 3"/>`;grid+=`<text x="${plotL-6}" y="${(y+3).toFixed(1)}" text-anchor="end" font-family="'JetBrains Mono',monospace" font-size="8" fill="#5f6c91">${fmtAxis(topPer*p)}</text>`;grid+=`<text x="${plotR+6}" y="${(y+3).toFixed(1)}" text-anchor="start" font-family="'JetBrains Mono',monospace" font-size="8" fill="#6088b5">${fmtAxis(topCum*p)}</text>`;}
      const slot=plotW/Math.max(1,n),bw=Math.max(1.1,Math.min(3.4,slot*0.34));let bars="";
      dRows.forEach((r,i)=>{const cx=Xc(i);bars+=`<rect x="${(cx-bw-0.4).toFixed(1)}" y="${Yp(r.c).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,baseA-Yp(r.c)).toFixed(1)}" fill="#5f6c91" fill-opacity="0.34" rx="0.6"/>`;bars+=`<rect x="${(cx+0.4).toFixed(1)}" y="${Yp(r.b).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,baseA-Yp(r.b)).toFixed(1)}" fill="#6088b5" fill-opacity="0.32" rx="0.6"/>`;});
      const lineC=dRows.map((r,i)=>`${i?"L":"M"}${Xc(i).toFixed(1)} ${Yc(r.cc).toFixed(1)}`).join(" "),lineB=dRows.map((r,i)=>`${i?"L":"M"}${Xc(i).toFixed(1)} ${Yc(r.cb).toFixed(1)}`).join(" ");
      const areaC=`${lineC} L${plotR} ${baseA} L${plotL} ${baseA} Z`,areaB=`${lineB} L${plotR} ${baseA} L${plotL} ${baseA} Z`;
      let xl="";const step=Math.max(1,Math.ceil(n/7));dRows.forEach((r,i)=>{if(i%step!==0&&i!==n-1)return;const x=Xc(i),anchor=i===0?"start":i===n-1?"end":"middle";xl+=`<text x="${x.toFixed(1)}" y="${CHa-7}" text-anchor="${anchor}" font-family="'JetBrains Mono',monospace" font-size="9" fill="#5f6c91">${fmtMD(r.k)}</text>`;});
      return `<svg viewBox="0 0 ${CWp} ${CHa}" width="100%" style="display:block;overflow:visible"><defs><linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6088b5" stop-opacity="0.20"/><stop offset="100%" stop-color="#6088b5" stop-opacity="0"/></linearGradient><linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5f6c91" stop-opacity="0.16"/><stop offset="100%" stop-color="#5f6c91" stop-opacity="0"/></linearGradient></defs>${grid}${bars}<path d="${areaC}" fill="url(#gC)"/><path d="${areaB}" fill="url(#gB)"/><path d="${lineC}" fill="none" stroke="#5f6c91" stroke-width="1.6"/><path d="${lineB}" fill="none" stroke="#6088b5" stroke-width="2.2"/>${xl}</svg>`;
    })():`<div style="text-align:center;font-family:monospace;font-size:10px;color:#5f6c91;padding:30px">No activity in selected range</div>`;
    // ── daily impressions series (same x-buckets as the activity chart so they line up) ──
    const imap={};
    b.forEach(x=>{if(!x.date)return;imap[x.date]=(imap[x.date]||0)+parseNum(x.twitterImpressions)+parseNum(x.telegramImpressions);});
    let _aimp=0;const iRows=dKeys.map(k=>{const v=imap[k]||0;_aimp+=v;return{k,v,cv:_aimp};});
    const imprSvg=(iRows.length&&_aimp>0)?(()=>{
      const CHa=300,GLa=34,GRa=44,topA=16,baseA=CHa-24,plotL=GLa,plotR=CWp-GRa,plotW=plotR-plotL,n=iRows.length;
      const topPer=niceTop(Math.max(1,...iRows.map(r=>r.v))),topCum=niceTop(Math.max(1,_aimp));
      const Xc=i=>n<=1?plotL+plotW/2:plotL+(i/(n-1))*plotW;
      const Yp=v=>baseA-(v/topPer)*(baseA-topA),Yc=v=>baseA-(v/topCum)*(baseA-topA);
      let grid="";for(let t=0;t<=4;t++){const p=t/4,y=baseA-p*(baseA-topA);grid+=`<line x1="${plotL}" y1="${y.toFixed(1)}" x2="${plotR}" y2="${y.toFixed(1)}" stroke="#243056" stroke-dasharray="3 3"/>`;grid+=`<text x="${plotL-6}" y="${(y+3).toFixed(1)}" text-anchor="end" font-family="'JetBrains Mono',monospace" font-size="8" fill="#5f6c91">${fmtAxis(topPer*p)}</text>`;grid+=`<text x="${plotR+6}" y="${(y+3).toFixed(1)}" text-anchor="start" font-family="'JetBrains Mono',monospace" font-size="8" fill="#6088b5">${fmtAxis(topCum*p)}</text>`;}
      const slot=plotW/Math.max(1,n),bw=Math.max(1.4,Math.min(5,slot*0.55));let bars="";
      iRows.forEach((r,i)=>{if(r.v<=0)return;const cx=Xc(i);bars+=`<rect x="${(cx-bw/2).toFixed(1)}" y="${Yp(r.v).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(0,baseA-Yp(r.v)).toFixed(1)}" fill="#6088b5" fill-opacity="0.40" rx="0.6"/>`;});
      const lineI=iRows.map((r,i)=>`${i?"L":"M"}${Xc(i).toFixed(1)} ${Yc(r.cv).toFixed(1)}`).join(" ");
      const areaI=`${lineI} L${plotR} ${baseA} L${plotL} ${baseA} Z`;
      let xl="";const step=Math.max(1,Math.ceil(n/7));iRows.forEach((r,i)=>{if(i%step!==0&&i!==n-1)return;const x=Xc(i),anchor=i===0?"start":i===n-1?"end":"middle";xl+=`<text x="${x.toFixed(1)}" y="${CHa-7}" text-anchor="${anchor}" font-family="'JetBrains Mono',monospace" font-size="9" fill="#5f6c91">${fmtMD(r.k)}</text>`;});
      return `<svg viewBox="0 0 ${CWp} ${CHa}" width="100%" style="display:block;overflow:visible"><defs><linearGradient id="gi" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6088b5" stop-opacity="0.18"/><stop offset="100%" stop-color="#6088b5" stop-opacity="0"/></linearGradient></defs>${grid}${bars}<path d="${areaI}" fill="url(#gi)"/><path d="${lineI}" fill="none" stroke="#6088b5" stroke-width="2.2"/>${xl}</svg>`;
    })():`<div style="text-align:center;font-family:monospace;font-size:10px;color:#5f6c91;padding:30px">No impression data</div>`;

    // Hardcoded tier palette (the PDF window has no --tier-* CSS vars, so getTierColor would render transparent)
    const PDF_TIER={"1":{c:"#6088b5",bg:"rgba(96,136,181,0.16)",bd:"rgba(96,136,181,0.36)"},"2":{c:"#7488ad",bg:"rgba(116,136,173,0.15)",bd:"rgba(116,136,173,0.32)"},"3":{c:"#8a99ab",bg:"rgba(138,153,171,0.13)",bd:"rgba(138,153,171,0.28)"},"4":{c:"#5e6b7a",bg:"rgba(94,107,122,0.14)",bd:"rgba(94,107,122,0.28)"}};
    const gtc=t=>PDF_TIER[String(t).trim()]||{c:"#5e6b7a",bg:"rgba(94,107,122,0.12)",bd:"rgba(94,107,122,0.24)"};
    const TP=t=>{const tc=gtc(t);return `<span style="font-family:'JetBrains Mono',monospace;font-size:9px;font-weight:700;padding:2px 8px;border-radius:5px;background:${tc.bg};border:1px solid ${tc.bd};color:${tc.c}">TIER ${t}</span>`;};
    const hlRows=headlines.slice(0,6).map((h,i)=>`<div style="display:grid;grid-template-columns:20px minmax(0,1fr) 150px 110px;gap:16px;align-items:center;padding:12px 18px;border-top:${i?"1px solid #243056":"none"}"><div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${i===0?"#6088b5":"#5f6c91"};text-align:center">${i+1}</div><div style="min-width:0"><div style="font-size:12.5px;font-weight:500;color:#d6dcec;line-height:1.35;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(h.label)}</div><div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#5f6c91;margin-top:3px">First seen ${fmtMD(h.date)}</div></div><div style="font-size:12px;color:#97a3c4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(h.outlet)}</div><div><div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:#d6dcec;text-align:right;margin-bottom:4px">${h.count}</div><div style="height:4px;border-radius:99px;background:#182142;overflow:hidden"><div style="width:${(h.count/maxHl)*100}%;height:100%;border-radius:99px;background:#6088b5;opacity:.85"></div></div></div></div>`).join("")||`<div style="padding:18px;color:#5f6c91;font-size:11px">No citations in range</div>`;
    const outRows=topOutlets.map(([n,v],i)=>`<div style="display:grid;grid-template-columns:18px minmax(0,1fr) 46px;gap:12px;align-items:center;padding:9px 16px;border-top:${i?"1px solid #243056":"none"}"><div style="font-family:'JetBrains Mono',monospace;color:#5f6c91;font-size:9px">${i+1}</div><div><div style="font-size:11.5px;font-weight:500;color:#d6dcec;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(n)}</div><div style="height:3px;border-radius:99px;background:#182142;overflow:hidden;margin-top:4px"><div style="width:${(v/maxOut)*100}%;height:100%;background:#6088b5;opacity:.7;border-radius:99px"></div></div></div><div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:600;color:#6088b5;text-align:right">${v}</div></div>`).join("")||`<div style="padding:16px;color:#5f6c91;font-size:11px">No data</div>`;
    const tierRows=tierEntries.map(([t,n])=>{const tc=gtc(t);const pct=Math.round(n/totalTierCits*100);return `<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">${TP(t)}<span style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#97a3c4">${n} · ${pct}%</span></div><div style="height:7px;border-radius:99px;background:#182142;overflow:hidden"><div style="height:100%;width:${pct}%;background:${tc.c};border-radius:99px"></div></div></div>`;}).join("")||`<div style="color:#5f6c91;font-size:11px">No tier data</div>`;
    const postRows=posts.slice(0,5).map((p,i)=>`<div style="display:grid;grid-template-columns:20px minmax(0,1fr) 64px 104px 40px;gap:16px;align-items:center;padding:12px 18px;border-top:${i?"1px solid #243056":"none"}"><div style="font-family:'JetBrains Mono',monospace;font-size:11px;font-weight:700;color:${i===0?"#6088b5":"#5f6c91"};text-align:center">${i+1}</div><div style="min-width:0"><div style="font-size:12.5px;font-weight:500;color:#d6dcec;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(p.title)}</div><div style="font-family:'JetBrains Mono',monospace;font-size:9px;color:#5f6c91;margin-top:3px">${esc(p.author)}${p.date?" · "+fmtMD(p.date):""}</div></div><div style="text-align:center;font-size:11px;color:#97a3c4">${p.tw>=p.tg?xMark:"TG"}</div><div><div style="font-family:'JetBrains Mono',monospace;font-size:13px;font-weight:700;color:#d6dcec;text-align:right;margin-bottom:4px">${fmtNum(p.reach)}</div><div style="height:4px;border-radius:99px;background:#182142;overflow:hidden"><div style="width:${(p.reach/maxReach)*100}%;height:100%;border-radius:99px;background:#6088b5;opacity:.85"></div></div></div><div style="text-align:center">${p.link?`<a href="${esc(p.link)}" style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;border:1px solid #243056;background:#182142;color:#6088b5;text-decoration:none;font-size:12px">↗</a>`:`<span style="color:#3a456b">–</span>`}</div></div>`).join("")||`<div style="padding:18px;color:#5f6c91;font-size:11px">No social posts with impressions in range</div>`;

    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${cn} — Performance Summary</title>
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet"/>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{background:#0a0f1e;}
body{font-family:'Hanken Grotesk',system-ui,sans-serif;color:#d6dcec;font-size:11px;-webkit-font-smoothing:antialiased;}
.num{font-family:'JetBrains Mono',monospace;}
.lbl{font-size:8.5px;letter-spacing:.14em;text-transform:uppercase;color:#5f6c91;font-weight:600;}
.page{width:860px;min-height:1180px;margin:0 auto;background:#0a0f1e;display:flex;flex-direction:column;}
.pad{padding:40px 48px;flex:1;}
.cover{background:#070b16;color:#fff;padding:38px 48px 32px;position:relative;overflow:hidden;border-bottom:1px solid #243056;}
.cover::after{content:"";position:absolute;inset:0;background-image:radial-gradient(circle at 1px 1px,rgba(120,150,240,.08) 1px,transparent 0);background-size:22px 22px;}
.crow{position:relative;display:flex;justify-content:space-between;align-items:flex-start;}
.brand{display:flex;align-items:center;gap:10px;}
.cover h1{font-size:30px;font-weight:700;letter-spacing:-.03em;margin-top:26px;position:relative;color:#fff;}
.kick{position:relative;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#7e93c4;font-weight:600;}
.meta{position:relative;text-align:right;font-size:9.5px;color:#8493b5;line-height:1.9;}
.meta b{color:#fff;font-weight:600;}
.accentbar{height:3px;background:#6088b5;}
.phead{display:flex;justify-content:space-between;align-items:center;padding:18px 48px;border-bottom:1px solid #243056;background:#070b16;}
.pl{font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:#7e93c4;font-weight:600;}
.summary{font-size:13px;line-height:1.65;color:#97a3c4;margin-bottom:26px;}
.summary b{color:#d6dcec;font-weight:600;}
.ovr{font-size:12.5px;line-height:1.7;color:#97a3c4;margin-bottom:26px;}
.sechd{font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:#5f6c91;font-weight:600;margin-bottom:12px;}
.divhd{display:flex;align-items:center;gap:12px;margin:0 0 18px;}
.divhd .t{font-size:17px;font-weight:700;letter-spacing:-.02em;color:#d6dcec;white-space:nowrap;}
.divhd .ln{flex:1;height:1px;background:#243056;}
.divhd .dot{width:7px;height:7px;border-radius:99px;background:#6088b5;flex-shrink:0;}
.tracks{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:30px;}
.track{border:1px solid #243056;border-radius:8px;overflow:hidden;background:#111733;}
.th{display:flex;align-items:center;gap:9px;padding:12px 16px;border-bottom:1px solid #243056;background:#182142;}
.tn{font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:600;color:#6088b5;}
.tt{font-size:13px;font-weight:700;color:#d6dcec;}
.td{font-size:11.5px;line-height:1.6;color:#97a3c4;padding:14px 16px;}
.kpis{display:flex;border:1px solid #243056;border-radius:8px;overflow:hidden;background:#111733;}
.kpi{flex:1;padding:16px 18px;border-left:1px solid #243056;}
.kpi:first-child{border-left:none;}
.kpi .v{font-size:28px;font-weight:700;letter-spacing:-.03em;line-height:1;margin-top:9px;color:#d6dcec;}
.kpi .s{font-size:10px;color:#5f6c91;margin-top:5px;}
.substat{display:flex;border:1px solid #243056;border-radius:8px;overflow:hidden;margin-bottom:14px;background:#111733;}
.substat .c2{flex:1;padding:13px 16px;border-left:1px solid #243056;}
.substat .c2:first-child{border-left:none;}
.substat .c2 .v{font-size:22px;font-weight:700;letter-spacing:-.03em;line-height:1;margin-top:8px;color:#d6dcec;}
.substat .c2 .s{font-size:9.5px;color:#5f6c91;margin-top:4px;}
.chartcard{border:1px solid #243056;border-radius:8px;padding:18px 20px 10px;background:#111733;}
.chartcard .topr{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;}
.leg{display:flex;gap:14px;}
.leg span{display:flex;align-items:center;gap:6px;font-size:9px;color:#5f6c91;}
.leg i{width:14px;height:2px;border-radius:2px;display:inline-block;}
.tc{border:1px solid #243056;border-radius:8px;overflow:hidden;background:#111733;}
.thead{display:grid;gap:16px;padding:11px 18px;background:#141d33;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
.panel{border:1px solid #243056;border-radius:8px;overflow:hidden;background:#111733;}
.ph2{font-size:8.5px;letter-spacing:.12em;text-transform:uppercase;color:#5f6c91;font-weight:600;padding:11px 16px;border-bottom:1px solid #243056;background:#182142;}
.bar{display:flex;height:8px;border-radius:99px;overflow:hidden;gap:2px;background:#182142;}
.footer{display:flex;justify-content:space-between;padding:16px 48px;border-top:1px solid #243056;font-size:9px;color:#5f6c91;}
@page{size:A4;margin:0;}
@media print{*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}html,body{background:#0a0f1e;}.page{width:210mm;height:297mm;min-height:0;margin:0;overflow:hidden;page-break-after:always;break-after:page;}.page:last-child{page-break-after:auto;break-after:auto;}}
</style></head><body>

<div class="page">
  <div class="cover">
    <div class="crow">
      <div class="brand"><div style="line-height:1.1"><div style="font-size:13px;font-weight:700">CryptoQuant</div><div style="font-size:8px;letter-spacing:.16em;color:#9fb3d6">BOUNTY TRACKER</div></div></div>
      <div class="meta"><div>Period&nbsp; <b>${fmtD(dateFrom)} — ${fmtD(dateTo)}</b></div><div>Generated&nbsp; <b>${fmtD(today)}</b></div><div>Prepared for&nbsp; <b>${cn}</b></div></div>
    </div>
    <div class="kick" style="margin-top:24px">Performance Summary</div>
    <h1>${cn}</h1>
  </div>
  <div class="accentbar"></div>
  <div class="pad" style="display:flex;flex-direction:column">
    <div class="sechd" style="color:#6088b5">Program Overview</div>
    <p class="ovr">CryptoQuant's marketing program is analyst-led, turning proprietary on-chain data into research and earned media. We publish a steady cadence of data-driven content on a client's ecosystem, amplify it across CryptoQuant's owned channels (X and Telegram), and seed it to crypto and financial media — producing consistent third-party citations that build credibility and shape narratives.</p>
    <div class="sechd">Two content tracks</div>
    <div class="tracks">
      <div class="track"><div class="th"><span class="tn">01</span><span class="tt">CryptoQuant Insights</span></div><div class="td">Official, in-house research published under the CryptoQuant brand. Flagship on-chain data and analysis that carries the full authority and recognition of CryptoQuant's data platform — the institutional voice of the program.</div></div>
      <div class="track"><div class="th"><span class="tn">02</span><span class="tt">Analyst Content</span></div><div class="td">Independent research authored by analysts within CryptoQuant's network. Expands volume, velocity, and range of voices — each piece amplified across both the analyst's and CryptoQuant's channels for compounding reach.</div></div>
    </div>
    <div class="divhd"><span class="dot"></span><span class="t">Program Summary</span><span class="ln"></span></div>
    <div class="kpis" style="margin-bottom:16px">
      <div class="kpi"><div class="lbl">Bounties</div><div class="v num">${b.length.toLocaleString()}</div><div class="s">Research posts published</div></div>
      <div class="kpi"><div class="lbl">Citations</div><div class="v num">${c.length.toLocaleString()}</div><div class="s">Earned media coverage</div></div>
      <div class="kpi"><div class="lbl">Impressions</div><div class="v num">${fmtNum(totalImpr)}</div><div class="s">Combined social reach</div></div>
    </div>
    <div class="sechd" style="margin-top:8px">Activity over period</div>
    <div class="chartcard" style="flex:1;display:flex;flex-direction:column;justify-content:center"><div class="topr"><span class="lbl">Bounties &amp; citations · per day + running total</span><div class="leg"><span><i style="background:#6088b5"></i>Bounties</span><span><i style="background:#5f6c91"></i>Citations</span><span style="opacity:.55">bars = per day · lines = running total</span></div></div>${actSvg}</div>
  </div>
  <div class="footer"><span>CryptoQuant Bounty Program · ${cn}</span><span class="num">Overview · Page 1 of 3</span></div>
</div>

<div class="page">
  <div class="phead"><span class="pl">${cn} · Performance Summary</span><span class="pl">Traditional Media</span></div>
  <div class="pad">
    <div class="divhd"><span class="dot"></span><span class="t">Traditional Media</span><span class="ln"></span></div>
    <p class="summary">Earned third-party coverage across crypto and financial publications — <b>${c.length.toLocaleString()} citations</b> from <b>${uniqueOutlets} outlets</b>, with <b>${t12pct}%</b> landing in Tier 1 and Tier 2 media.</p>
    <div class="substat">
      <div class="c2"><div class="lbl">Citations</div><div class="v num">${c.length.toLocaleString()}</div><div class="s">Earned coverage</div></div>
      <div class="c2"><div class="lbl">Outlets</div><div class="v num">${uniqueOutlets}</div><div class="s">Publications</div></div>
      <div class="c2"><div class="lbl">Tier 1–2</div><div class="v num">${t12pct}%</div><div class="s">Of coverage</div></div>
      <div class="c2"><div class="lbl">Pickup</div><div class="v num">${pickup}×</div><div class="s">Cites / bounty</div></div>
    </div>
    <div class="sechd" style="margin-top:24px">Top headlines · by citations</div>
    <div class="tc" style="margin-bottom:24px"><div class="thead" style="grid-template-columns:20px minmax(0,1fr) 150px 110px"><span class="lbl" style="text-align:center">#</span><span class="lbl">Headline</span><span class="lbl">Top Outlet</span><span class="lbl" style="text-align:right">Citations</span></div>${hlRows}</div>
    <div class="grid2">
      <div class="panel"><div class="ph2">Top Media Outlets</div>${outRows}</div>
      <div class="panel" style="display:flex;flex-direction:column"><div class="ph2">Coverage by Media Tier</div><div style="padding:18px 16px;flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:14px">${tierRows}</div></div>
    </div>
  </div>
  <div class="footer"><span>CryptoQuant Bounty Program · ${cn}</span><span class="num">Traditional Media · Page 2 of 3</span></div>
</div>

<div class="page">
  <div class="phead"><span class="pl">${cn} · Performance Summary</span><span class="pl">Social Media</span></div>
  <div class="pad">
    <div class="divhd"><span class="dot"></span><span class="t">Social Media</span><span class="ln"></span></div>
    <p class="summary">Owned-channel amplification across X and Telegram — <b>${fmtNum(totalImpr)} impressions</b> from <b>${nPosts} posts</b>, led by a top post reaching <b>${fmtNum(peakPost)} impressions</b>.</p>
    <div class="substat">
      <div class="c2"><div class="lbl">Total Impressions</div><div class="v num">${fmtNum(totalImpr)}</div><div class="s">Twitter + Telegram combined</div></div>
      <div class="c2"><div class="lbl">Posts</div><div class="v num">${nPosts}</div><div class="s">With recorded reach</div></div>
      <div class="c2"><div class="lbl">Top Post</div><div class="v num">${fmtNum(peakPost)}</div><div class="s">Best single post</div></div>
    </div>
    <div class="sechd" style="margin-top:24px">Social activity · impressions per day &amp; running total</div>
    <div class="chartcard" style="margin-bottom:24px"><div class="topr"><span class="lbl">Impressions · per day + running total</span><div class="leg"><span><i style="background:#6088b5"></i>Impressions</span><span style="opacity:.55">bars = per day · line = running total</span></div></div>${imprSvg}</div>
    <div class="sechd">Top social posts · by reach</div>
    <div class="tc"><div class="thead" style="grid-template-columns:20px minmax(0,1fr) 64px 104px 40px"><span class="lbl" style="text-align:center">#</span><span class="lbl">Post</span><span class="lbl" style="text-align:center">Channel</span><span class="lbl" style="text-align:right">Impressions</span><span class="lbl" style="text-align:center">Link</span></div>${postRows}</div>
  </div>
  <div class="footer"><span>CryptoQuant Bounty Program · ${cn}</span><span class="num">Social Media · Page 3 of 3</span></div>
</div>

</body></html>`;

    const w=window.open("","_blank","width=1100,height=900");
    if(!w){ alert("Please allow pop-ups for this site to open the report."); return; }
    // The report prints ITSELF from inside its own document — calling w.print() from
    // this (opener) tab blocks the opener's event loop while the print dialog is open,
    // which is what froze the modal/Cancel button.
    const printScript = `<script>(function(){function P(){try{window.focus();window.print();}catch(e){}}if(document.readyState==='complete'){setTimeout(P,300);}else{window.addEventListener('load',function(){setTimeout(P,300);});}})();<\/script>`;
    w.document.write(html.replace("</body>", printScript+"</body>"));
    w.document.close();
  };

  // ── raw-data export → one Excel workbook with two tabs (Bounties / Citations) ──
  const safeName = s => (s||"export").replace(/[^a-z0-9]+/gi,"_").replace(/^_+|_+$/g,"");
  const downloadFile = (name, text, mime) => {
    const blob = new Blob([text], {type:mime||"text/plain;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.appendChild(a); a.click();
    document.body.removeChild(a); setTimeout(()=>URL.revokeObjectURL(url), 1500);
  };
  const downloadCSV = () => {
    const xmlEsc = v => { const s = v==null?"":String(v); return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); };
    const bCols = [["Date","date"],["Author","author"],["Title","title"],["Category","category"],["Asset","asset"],["Twitter Impressions","twitterImpressions"],["Telegram Impressions","telegramImpressions"],["CQ Link","cqLink"],["CQ Twitter","cqTwitterLink"],["Author Twitter","authorTwitterLink"],["Telegram Link","telegramLink"],["Author Telegram","authorTelegramLink"],["Analytics Link","analyticsLink"],["Summary","summary"]];
    const cCols = [["Date","date"],["Media","media"],["Reporter","reporter"],["Author","author"],["Topic","topic"],["Headline","headline"],["Media Tier","mediaTier"],["Language","language"],["Asset","asset"],["Branding","branding"],["Direct Relationship","directRelationship"],["Article Link","articleLink"]];
    const sheet = (name, cols, rows) => {
      const head = `<Row>${cols.map(co=>`<Cell ss:StyleID="hdr"><Data ss:Type="String">${xmlEsc(co[0])}</Data></Cell>`).join("")}</Row>`;
      const body = rows.map(r=>`<Row>${cols.map(co=>`<Cell><Data ss:Type="String">${xmlEsc(r[co[1]])}</Data></Cell>`).join("")}</Row>`).join("");
      return `<Worksheet ss:Name="${xmlEsc(name)}"><Table>${head}${body}</Table></Worksheet>`;
    };
    const xml = `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>\n<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40"><Styles><Style ss:ID="hdr"><Font ss:Bold="1"/></Style></Styles>${sheet("Bounties",bCols,b)}${sheet("Citations",cCols,c)}</Workbook>`;
    downloadFile(`${safeName(campaignName)}_raw_${dateFrom}_to_${dateTo}.xls`, xml, "application/vnd.ms-excel");
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.55)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:14,width:"min(var(--modal-md),100%)",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,0.18)",animation:"modalIn .2s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text)",letterSpacing:"-0.01em"}}>Download Report</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:2}}>{campaignName} · 3-page performance summary</div>
          </div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)"}}><Icons.X/></button>
        </div>
        <div style={{padding:"20px 24px",overflowY:"auto",maxHeight:"70vh"}}>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Date Range</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
            <Field label="From"><input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...iStyle,padding:"9px 12px",fontSize:12}}/></Field>
            <Field label="To"><input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...iStyle,padding:"9px 12px",fontSize:12}}/></Field>
          </div>
          <div className="cq-3col" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:18}}>
            {[
              {label:"Bounties",    value:b.length.toLocaleString()},
              {label:"Citations",   value:c.length.toLocaleString()},
              {label:"Impressions", value:fmtNum(previewImpr)},
            ].map(s=>(
              <div key={s.label} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:7,padding:"9px 12px"}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:8,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>{s.label}</div>
                <div className="tabular" style={{fontSize:20,fontWeight:700,color:"var(--text)",letterSpacing:"-0.02em"}}>{s.value}</div>
              </div>
            ))}
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:"var(--muted)",lineHeight:1.7,padding:"12px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8}}>
            Generates a 3-page summary — <b style={{color:"var(--text)"}}>Overview</b>, <b style={{color:"var(--text)"}}>Traditional Media</b>, and <b style={{color:"var(--text)"}}>Social Media</b> — opening in a new tab ready to print or save as PDF. Tip: in the print dialog, enable <b style={{color:"var(--text)"}}>Background graphics</b>. Or export the raw data as an <b style={{color:"var(--text)"}}>Excel workbook with Bounties &amp; Citations tabs</b> for the selected range.
          </div>
        </div>
        <div style={{padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",gap:10,justifyContent:"space-between",alignItems:"center",flexWrap:"wrap"}}>
          <button onClick={onClose} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 20px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
          <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap"}}>
            <button onClick={downloadCSV} title="Export raw data as an Excel workbook (Bounties + Citations tabs)"
              style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 16px",borderRadius:8,border:"1px solid var(--border2)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",display:"flex",alignItems:"center",gap:6,letterSpacing:"0.04em"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor="var(--accent)"}
              onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border2)"}>
              ↓ EXPORT DATA
            </button>
            <button onClick={generatePDF}
              style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 20px",borderRadius:8,border:"none",background:"var(--accent)",color:"#fff",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:7,letterSpacing:"0.04em"}}
              onMouseEnter={e=>e.currentTarget.style.background="color-mix(in srgb,var(--accent) 82%,#000)"}
              onMouseLeave={e=>e.currentTarget.style.background="var(--accent)"}>
              ↓ GENERATE PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// ─────────────────────────────────────────────────────────
//  CAMPAIGNS PANEL (Admin only)
// ─────────────────────────────────────────────────────────
// Accept any Google Sheets URL (an /edit link with #gid, or an export URL) and
// return the /export?format=csv&gid= form the sync expects.
const normalizeSheetUrl = (raw) => {
  const url = (raw||"").trim();
  if(!url) return "";
  const id = (url.match(/\/spreadsheets\/d\/([\w-]+)/)||[])[1];
  if(!id) return url; // not a Sheets URL — pass through
  const gid = (url.match(/[#?&]gid=(\d+)/)||[])[1] || "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
};

const CampaignForm = ({initial,onSave,onClose}) => {
  const isEdit = !!initial?.id;
  const [name,setName] = useState(initial?.name||"");
  const [color,setColor] = useState(initial?.color||"#1a3a5c");
  const [status,setStatus] = useState(initial?.status||"active");
  const [sheetBounties,setSheetBounties] = useState(initial?.sheetBounties||"");
  const [sheetMedia,setSheetMedia] = useState(initial?.sheetMedia||"");
  const [sheetLink,setSheetLink] = useState(initial?.sheetLink||"");
  const [dataMode,setDataMode] = useState(initial?.sheetBounties||initial?.sheetMedia?"sheets":"manual");
  const [saving,setSaving] = useState(false);
  const [sheetUrl,setSheetUrl] = useState("");
  const [detecting,setDetecting] = useState(false);
  const [detectMsg,setDetectMsg] = useState(null); // {ok, text}
  // One-link flow: fetch the sheet's public htmlview (via our proxy — Google sends
  // no CORS headers) and read the tab name→gid map out of it, then fill both
  // fields with proper /export?format=csv&gid= URLs. No Google API key needed.
  const detectTabs = async () => {
    const id = ((sheetUrl||"").match(/\/spreadsheets\/d\/([\w-]+)/)||[])[1];
    if(!id){ setDetectMsg({ok:false,text:"That doesn't look like a Google Sheets link."}); return; }
    if(/^(localhost|127\.0\.0\.1)/.test(window.location.hostname)){ setDetectMsg({ok:false,text:"Auto-detect needs the deployed site (the /api proxy isn't served by local dev). Paste the two tab links below instead."}); return; }
    setDetecting(true); setDetectMsg(null);
    try{
      const r = await fetch(`/api/sheet-proxy?url=${encodeURIComponent(`https://docs.google.com/spreadsheets/d/${id}/htmlview?widget=true`)}`);
      if(!r.ok) throw new Error(`HTTP ${r.status} — is the sheet shared as "Anyone with the link can view"?`);
      const html = await r.text();
      const tabs = {}; // lowercased tab name -> gid
      for(const m of html.matchAll(/\{name: "([^"]+)"[^}]*?gid: "(\d+)"/g)) tabs[m[1].toLowerCase()] = m[2];
      const find = (...keys)=>{ for(const k of Object.keys(tabs)) if(keys.some(key=>k.includes(key))) return tabs[k]; return null; };
      const bGid = find("bounti"), mGid = find("media","citation");
      const mk = g=>`https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${g}`;
      if(bGid) setSheetBounties(mk(bGid));
      if(mGid) setSheetMedia(mk(mGid));
      setDetectMsg(bGid&&mGid
        ? {ok:true,text:"✓ Both tabs found — URLs filled in below."}
        : bGid||mGid
          ? {ok:false,text:`Only found the ${bGid?"Bounties":"Media"} tab — paste the other link manually.`}
          : {ok:false,text:Object.keys(tabs).length?`No Bounties/Media tabs found. Tabs in this sheet: ${Object.keys(tabs).join(", ")}`:`Couldn't read tabs — is the sheet shared as "Anyone with the link can view"?`});
    }catch(e){ setDetectMsg({ok:false,text:`Detect failed: ${e.message}`}); }
    setDetecting(false);
  };
  const handleSave = async () => {
    if (!name.trim()){alert("Campaign name required.");return;}
    setSaving(true); await onSave({name:name.trim(),color,status,sheetBounties:dataMode==="sheets"?normalizeSheetUrl(sheetBounties):"",sheetMedia:dataMode==="sheets"?normalizeSheetUrl(sheetMedia):"",sheetLink}); setSaving(false);
  };
  return (
    <Portal>
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:12,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",width:"min(var(--modal-md),100%)",maxHeight:"90vh",overflowY:"auto",padding:32,position:"relative",animation:"modalIn .25s ease"}}>
        <button onClick={onClose} style={{position:"absolute",top:18,right:18,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,letterSpacing:"0.1em",color:"var(--yellow)",textTransform:"uppercase",marginBottom:6}}>// {isEdit?"edit":"new"} campaign</div>
        <div style={{fontSize:20,fontWeight:500,marginBottom:24}}>{isEdit?"Edit Campaign":"New Campaign"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Field label="Campaign Name">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Binance, NEXO, Kraken" style={iStyle}/>
          </Field>
          <Field label="Color">
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{position:"relative",width:40,height:40,borderRadius:8,overflow:"hidden",border:"2px solid var(--border)",cursor:"pointer",flexShrink:0}} title="Pick a color">
                <div style={{width:"100%",height:"100%",background:color}}/>
                <input type="color" value={color.startsWith("#")?color:"#1a3a5c"} onChange={e=>setColor(e.target.value)}
                  style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",padding:0}}/>
              </div>
              <div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--text)",fontWeight:500}}>{color.toUpperCase()}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:2}}>Click swatch to change</div>
              </div>
            </div>
          </Field>
          <Field label="Status">
            <button onClick={()=>setStatus(status==="active"?"completed":"active")}
              style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:`1px solid ${status==="active"?"rgba(22,101,52,0.4)":"rgba(100,116,139,0.4)"}`,background:status==="active"?"rgba(22,101,52,0.08)":"var(--surface2)",color:status==="active"?"#166534":"var(--muted)",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em",transition:"all .15s",width:"100%"}}>
              {status==="active"?"● Active":"✓ Completed"}
            </button>
          </Field>
          <div style={{paddingTop:16,borderTop:"1px solid var(--border)"}}>
            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Data Entry Mode</div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {[{id:"manual",label:"✏ Manual Entry"},{id:"sheets",label:"⟳ Google Sheets"}].map(m=>(
                <button key={m.id} onClick={()=>setDataMode(m.id)}
                  style={{flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"8px",borderRadius:8,
                    border:`1px solid ${dataMode===m.id?"rgba(26,58,92,0.3)":"var(--border)"}`,
                    background:dataMode===m.id?"rgba(26,58,92,0.08)":"transparent",
                    color:dataMode===m.id?"var(--accent)":"var(--muted)",
                    cursor:"pointer",transition:"all .15s"}}>
                  {m.label}
                </button>
              ))}
            </div>
            {dataMode==="manual"&&(
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"8px 10px",background:"var(--surface2)",borderRadius:6,lineHeight:1.6}}>
                Data will be entered manually through the Bounties and Media Citations tabs.
              </div>
            )}
            {dataMode==="sheets"&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Field label="Campaign Spreadsheet Link">
                  <div style={{display:"flex",gap:8}}>
                    <input value={sheetUrl} onChange={e=>{setSheetUrl(e.target.value);setDetectMsg(null);}} onKeyDown={e=>e.key==="Enter"&&!detecting&&detectTabs()} placeholder="Paste the Google Sheet link — tabs are detected automatically" style={{...iStyle,flex:1}}/>
                    <button onClick={detectTabs} disabled={detecting||!sheetUrl.trim()}
                      style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"0 14px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 30%,transparent)",background:"color-mix(in srgb,var(--accent) 10%,transparent)",color:"var(--accent)",cursor:detecting?"default":"pointer",whiteSpace:"nowrap",opacity:!sheetUrl.trim()?.5:1}}>
                      {detecting?"Detecting…":"Detect tabs"}
                    </button>
                  </div>
                </Field>
                {detectMsg&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:detectMsg.ok?"var(--positive)":"var(--yellow)",padding:"6px 10px",background:detectMsg.ok?"color-mix(in srgb,var(--positive) 7%,transparent)":"color-mix(in srgb,var(--yellow) 7%,transparent)",borderRadius:6,lineHeight:1.5}}>{detectMsg.text}</div>}
                <Field label="Bounties Sheet URL">
                  <input value={sheetBounties} onChange={e=>setSheetBounties(e.target.value)} placeholder="Auto-filled by Detect — or paste the Bounties tab link" style={iStyle}/>
                </Field>
                <Field label="Media Citations Sheet URL">
                  <input value={sheetMedia} onChange={e=>setSheetMedia(e.target.value)} placeholder="Auto-filled by Detect — or paste the Media tab link" style={iStyle}/>
                </Field>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",padding:"8px 10px",background:"var(--surface2)",borderRadius:6,lineHeight:1.6}}>
                  Paste the spreadsheet link above and hit Detect — both tab URLs fill in automatically (tabs named "Bounties" and "Media"). Manual paste still works; /edit links are converted on save. Sheet must be "Anyone with the link can view".
                </div>
              </div>
            )}
            <div style={{paddingTop:14,borderTop:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>General Spreadsheet Link</div>
              <Field label="Google Sheet URL" full>
                <input value={sheetLink} onChange={e=>setSheetLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." style={iStyle}/>
              </Field>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:6}}>A direct link to the full Google Sheet for this campaign (visible to all users).</div>
            </div>
            {false&&(
              <span/>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"var(--surface2)",borderRadius:8,border:"1px solid var(--border)"}}>
            <div style={{width:36,height:36,borderRadius:8,background:color+"18",border:`1px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:color}}>{name?initials(name):"??"}</div>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:color}}>{name||"Campaign Name"}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>Preview</div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:24,paddingTop:20,borderTop:"1px solid var(--border)"}}>
          <button onClick={onClose} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
          <button onClick={handleSave} disabled={saving} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 22px",borderRadius:8,border:"1px solid rgba(217,119,6,0.35)",background:"color-mix(in srgb,var(--accent) 8%,transparent)",color:"var(--yellow)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:7}}>
            {saving?<><Icons.Spin/>SAVING…</>:"SAVE CAMPAIGN"}
          </button>
        </div>
      </div>
    </div>
    </Portal>
  );
};

const DrillSync = ({program, drillCamps, drillCites, setCampaigns, setCitations, darkMode}) => {
  const [syncing,setSyncing] = useState(false);
  const [result,setResult]   = useState(null);
  const [phase,setPhase]     = useState("");
  const isSyncing = useRef(false);
  // Auto-dismiss the "✓ N added / skipped" badge so it doesn't linger until a page refresh.
  useEffect(()=>{
    if(!result) return;
    const t = setTimeout(()=>setResult(null), 6000);
    return ()=>clearTimeout(t);
  },[result]);
  const norm = s => (s||'').trim().toLowerCase();
  const normalizeDate = (d) => {
    const s = (d||"").trim();
    if(!s) return "";
    // YYYY.MM.DD or YYYY/MM/DD or YYYY-MM-DD
    const m = s.match(/^(\d{4})[.\/\-](\d{1,2})[.\/\-](\d{1,2})$/);
    if(m) return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
    // MM/DD/YYYY or MM-DD-YYYY
    const m2 = s.match(/^(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{4})$/);
    if(m2) return `${m2[3]}-${m2[1].padStart(2,"0")}-${m2[2].padStart(2,"0")}`;
    // "Month DD, YYYY" or "Mon DD YYYY" (sheets sometimes paste like this)
    const m3 = s.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/);
    if(m3) {
      const months = {jan:"01",feb:"02",mar:"03",apr:"04",may:"05",jun:"06",jul:"07",aug:"08",sep:"09",oct:"10",nov:"11",dec:"12",january:"01",february:"02",march:"03",april:"04",june:"06",july:"07",august:"08",september:"09",october:"10",november:"11",december:"12"};
      const mm = months[m3[1].toLowerCase()];
      if(mm) return `${m3[3]}-${mm}-${m3[2].padStart(2,"0")}`;
    }
    // Last resort: let Date parse it, but always emit YYYY-MM-DD
    const test = new Date(s);
    if(isNaN(test.getTime())) return "";
    const y = test.getFullYear();
    const mo = String(test.getMonth()+1).padStart(2,"0");
    const da = String(test.getDate()).padStart(2,"0");
    return `${y}-${mo}-${da}`;
  };
  const parseCSV = (text) => {
    // RFC-4180 parse: quoted cells may contain commas, escaped quotes ("") AND
    // line breaks — splitting on "\n" first truncated such rows (lost columns
    // after a multi-line headline, e.g. the article link).
    const records=[]; let row=[], cur="", inQ=false;
    for(let i=0;i<text.length;i++){
      const ch=text[i];
      if(inQ){
        if(ch==='"'){ if(text[i+1]==='"'){cur+='"';i++;} else inQ=false; }
        else cur+=ch;
      } else if(ch==='"'){ inQ=true; }
      else if(ch===','){ row.push(cur); cur=""; }
      else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&text[i+1]==='\n')i++; row.push(cur); if(row.some(v=>v.trim())) records.push(row); row=[]; cur=""; }
      else cur+=ch;
    }
    row.push(cur); if(row.some(v=>v.trim())) records.push(row);
    const clean = v => (v||"").replace(/\*/g,"").trim().toLowerCase();
    const headerIdx = records.findIndex(r=>clean(r[0])==="date"||clean(r[0])==="no");
    if(headerIdx===-1) return [];
    const headers = records[headerIdx].map(clean);
    return records.slice(headerIdx+1).map(r=>
      Object.fromEntries(headers.map((h,i)=>[h,(r[i]||"").replace(/\s*\n\s*/g," ").trim()]))
    ).filter(r=>{const d=(r["date"]||"").trim();const n=(r["no"]||"").trim();if(n&&isNaN(Number(n)))return false;return d&&!d.toLowerCase().startsWith("yyyy")&&!d.toLowerCase().startsWith("date");});
  };
  const doSync = async() => {
    console.log("doSync called, isSyncing:", isSyncing.current, "campaign:", program.name, "id:", program.id, "bounties URL:", program.sheetBounties, "media URL:", program.sheetMedia, "darkMode:", darkMode);
    if(isSyncing.current){ console.log("doSync blocked — already syncing"); return; }
    isSyncing.current = true;
    setSyncing(true); setResult(null);
    let added=0, skipped=0;
    try {
      const newBounties=[], newMedia=[];
      const fetchSheet = async(url) => {
        const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
        if(isLocal) {
          const r = await fetch(`https://corsproxy.io/?${encodeURIComponent(url+'&t='+Date.now())}`);
          return await r.text();
        } else {
          const r = await fetch(`/api/sheet-proxy?url=${encodeURIComponent(url)}`);
          return await r.text();
        }
      };
      // Supabase caps a single select at 1000 rows — paginate so dedup sees ALL
      // existing rows (otherwise campaigns with >1000 media rows re-sync forever).
      const fetchAllRows = async (table, cols) => {
        const out=[], size=1000;
        for(let from=0;;from+=size){
          const {data,error} = await supabase.from(table).select(cols).eq("campaign_id",program.id).range(from,from+size-1);
          if(error) throw error;
          out.push(...(data||[]));
          if(!data||data.length<size) break;
        }
        return out;
      };
      const exB = await fetchAllRows("bounties","cq_link,sheet_row_no");
      const exM = await fetchAllRows("citations","article_link,sheet_row_no");
      const safe = (v) => (v==null?"":String(v)).trim();
      let badRows=0;
      if(program.sheetBounties){
        const text = await fetchSheet(program.sheetBounties);
        console.log("Bounties sheet response length:", text?.length, "first 200 chars:", text?.slice(0,200));
        const rows = parseCSV(text);
        for(const r of rows){
          try{
            const link=safe(r["quicktake link"]||r["quicktake_link"]||r["cq_link"]||r["link"]);
            const title=safe(r["title"]);
            const rowNo=safe(r["no"]||r["#"]);
            if(!rowNo&&!title&&!link) continue;
            const inNew=rowNo?newBounties.some(b=>b.sheetRowNo===rowNo):(!!link&&newBounties.some(b=>b.cqLink===link));
            const inDB=rowNo?exB.some(b=>b.sheet_row_no===rowNo):(!!link&&exB.some(b=>b.cq_link===link));
            if(inNew||inDB){skipped++;continue;}
            newBounties.push({id:uid(),campaignId:program.id,date:normalizeDate(r["date"]),author:norm(r["author"]),title,cqLink:link,analyticsLink:safe(r["analytics link"]||r["cq analytics link"]),authorTwitterLink:safe(r["author twitter/x"]||r["analyst twitter/x post"]),authorTelegramLink:safe(r["author telegram"]||r["analyst telegram"]),cqTwitterLink:safe(r["cq twitter/x"]||r["twitter/x link"]),telegramLink:safe(r["cq telegram link"]||r["telegram link"]),category:titleCase(safe(r["category"])),asset:titleCase(safe(r["asset"])),twitterImpressions:safe(r["twitter impressions"]||r["cq twitter/x impressions"]),telegramImpressions:safe(r["telegram impressions"]),sheetRowNo:rowNo,createdBy:"sheet_sync"});
          }catch(rowErr){badRows++;console.warn("Skipped bad bounty row:",rowErr,r);}
        }
      }
      if(program.sheetMedia){
        const text = await fetchSheet(program.sheetMedia);
        console.log("Media sheet response length:", text?.length, "first 200 chars:", text?.slice(0,200));
        const rows = parseCSV(text);
        for(const r of rows){
          try{
            const link=safe(r["article link"]||r["article_link"]);
            const media=safe(r["media outlet"]||r["media_outlet"]||r["media"]);
            const rowNo2=safe(r["no"]||r["#"]);
            if(!rowNo2&&!media) continue;
            const inNewM=rowNo2?newMedia.some(m=>m.sheetRowNo===rowNo2):(!!link&&newMedia.some(m=>m.articleLink===link));
            const inDBM=rowNo2?exM.some(m=>m.sheet_row_no===rowNo2):(!!link&&exM.some(m=>m.article_link===link));
            if(inNewM||inDBM){skipped++;continue;}
            newMedia.push({id:uid(),campaignId:program.id,date:normalizeDate(r["date"]),media:titleCase(media),reporter:titleCase(safe(r["reporter"])),author:norm(r["author"]),topic:titleCase(safe(r["topic"])),articleLink:link,headline:safe(r["headline"]),mediaTier:safe(r["media tier"]),directRelationship:titleCase(safe(r["direct relationship"])),language:titleCase(safe(r["language"])),asset:titleCase(safe(r["asset"])),branding:titleCase(safe(r["branding"])),sheetRowNo:rowNo2,createdBy:"sheet_sync"});
          }catch(rowErr){badRows++;console.warn("Skipped bad media row:",rowErr,r);}
        }
      }
      if(newBounties.length){await db.batchInsertBounties(newBounties);setCampaigns(prev=>[...newBounties,...prev]);added+=newBounties.length;}
      if(newMedia.length){await db.batchInsertCitations(newMedia);setCitations(prev=>[...newMedia,...prev]);added+=newMedia.length;}

      // Fetch live X + Telegram impressions for the freshly-synced bounties (endpoints persist to DB).
      let imprMsg = "";
      const isLocalEnv = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if(newBounties.length && !isLocalEnv){
        const twIds = newBounties.filter(b=>b.authorTwitterLink||b.cqTwitterLink).map(b=>b.id);
        const tgIds = newBounties.filter(b=>b.authorTelegramLink||b.telegramLink).map(b=>b.id);
        if(twIds.length || tgIds.length){
          setPhase("Fetching impressions…");
          const updates = {}; // bountyId -> {twitterImpressions?, telegramImpressions?}
          try {
            if(twIds.length){
              const r = await fetch("/api/twitter-impressions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bountyIds:twIds})});
              const d = await r.json().catch(()=>({}));
              if(r.ok) for(const u of (d.updated||[])) if(!u.skipped && u.total!=null) (updates[u.bountyId]=updates[u.bountyId]||{}).twitterImpressions=String(u.total);
            }
            if(tgIds.length){
              const r = await fetch("/api/telegram-impressions",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({bountyIds:tgIds})});
              const d = await r.json().catch(()=>({}));
              if(r.ok) for(const u of (d.updated||[])) if(!u.skipped && u.total!=null) (updates[u.bountyId]=updates[u.bountyId]||{}).telegramImpressions=String(u.total);
            }
            const nUpd = Object.keys(updates).length;
            if(nUpd){
              setCampaigns(prev=>prev.map(b=>updates[b.id]?{...b,...updates[b.id]}:b));
              imprMsg = `, impressions for ${nUpd}`;
            }
          } catch(e){ imprMsg = `, impressions fetch failed`; }
          setPhase("");
        }
      }
      setResult(`✓ ${added} added, ${skipped} skipped`+(badRows?`, ${badRows} bad row${badRows>1?"s":""} skipped`:"")+imprMsg);
    } catch(err){ setResult(`Error: ${err.message}`); }
    setSyncing(false);
    setPhase("");
    isSyncing.current = false;
  };
  return (
    <div style={{display:"flex",alignItems:darkMode?"stretch":"center",flexDirection:darkMode?"column":"row",gap:darkMode?6:8}}>
      <button onClick={doSync} disabled={syncing}
        style={darkMode
          ? {display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:"#ffffff",cursor:"pointer",transition:"all .15s",width:"100%",letterSpacing:"0.04em"}
          : {display:"flex",alignItems:"center",gap:5,height:28,boxSizing:"border-box",fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,padding:"0 12px",borderRadius:6,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"color-mix(in srgb,var(--accent) 7%,transparent)",color:"var(--accent)",cursor:"pointer",transition:"all .15s"}
        }>
        {syncing?<><Icons.Spin/>{phase||"Syncing…"}</>:"⟳ Sync Sheet"}
      </button>
      {result&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:darkMode?10:9,color:darkMode?(result.startsWith("✓")?"rgba(134,239,172,0.9)":"rgba(252,165,165,0.9)"):(result.startsWith("✓")?"#166534":"var(--red)"),textAlign:darkMode?"center":"left",padding:darkMode?"4px 8px":"0",background:darkMode?(result.startsWith("✓")?"rgba(134,239,172,0.08)":"rgba(252,165,165,0.08)"):"transparent",borderRadius:darkMode?6:0,border:darkMode?`1px solid ${result.startsWith("✓")?"rgba(134,239,172,0.2)":"rgba(252,165,165,0.2)"}`:"none"}}>{result}</span>}
    </div>
  );
};

const CampaignsPanel = ({programs,campaigns,citations,onSave,onDelete,onSaveCamp,onDeleteCamp,onSaveMedia,onDeleteMedia,currentUser,showToast,setCampaigns,setCitations,onSelectCampaign}) => {
  const [showForm,setShowForm]   = useState(false);
  const [editClient,setEdit]     = useState(null);
  const [confirmId,setConfId]    = useState(null);

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:22}}>
        <div>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.14em",fontWeight:600,marginBottom:7}}>Admin</div>
          <h2 style={{fontSize:23,fontWeight:600,letterSpacing:"-0.025em",color:"var(--text)"}}>Campaigns</h2>
          <div style={{fontSize:13,color:"var(--dim)",marginTop:5}}>Create campaigns, track output, and archive completed programs.</div>
        </div>
        <button onClick={()=>{setEdit(null);setShowForm(true)}} style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:12,fontWeight:600,padding:"9px 15px",borderRadius:7,border:"1px solid var(--accent)",background:"var(--accent)",color:"#fff",cursor:"pointer"}}>
          <Icons.Plus/> New campaign
        </button>
      </div>
      {!programs.length ? (
        <div style={{textAlign:"center",padding:"60px 20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8}}>
          <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⬡</div>
          <div style={{fontSize:15,fontWeight:500,color:"var(--muted)",marginBottom:6}}>No campaigns yet</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",marginBottom:20}}>Create your first campaign to start tracking data separately</div>
          <button onClick={()=>{setEdit(null);setShowForm(true)}} style={{display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid color-mix(in srgb,var(--accent) 22%,transparent)",background:"color-mix(in srgb,var(--accent) 7%,transparent)",color:"var(--accent)",cursor:"pointer"}}><Icons.Plus/>CREATE FIRST CAMPAIGN</button>
        </div>
      ) : (()=>{
        const activeCampaigns    = programs.filter(cl=>cl.status!=="completed");
        const completedCampaigns = programs.filter(cl=>cl.status==="completed");

        const CampaignRow = ({cl, i, total}) => {
          const campCount = campaigns.filter(c=>c.campaignId===cl.id).length;
          const citeCount = citations.filter(c=>c.campaignId===cl.id).length;
          return (
            <div onClick={()=>{if(onSelectCampaign) onSelectCampaign(cl.id)}}
              style={{display:"grid",gridTemplateColumns:"auto minmax(0,1fr) 64px 64px 300px 18px",alignItems:"center",gap:16,padding:"13px 18px",borderTop:i?"1px solid var(--border)":"none",cursor:"pointer",transition:"background .12s"}}
              onMouseEnter={e=>e.currentTarget.style.background="color-mix(in srgb,var(--accent) 5%,transparent)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {/* color identity swatch */}
              <span style={{width:10,height:10,borderRadius:3,background:cl.status==="completed"?"var(--dim)":cl.color,flexShrink:0}}/>
              {/* name */}
              <div style={{minWidth:0}}>
                <div style={{fontSize:13.5,fontWeight:600,color:cl.status==="completed"?"var(--muted)":"var(--text)",letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.name}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,color:"var(--dim)",marginTop:2}}>Created {new Date(cl.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
              </div>
              {/* counts */}
              <div style={{textAlign:"right"}}>
                <div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:"var(--text)"}}>{campCount}</div>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:8,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.07em",marginTop:2}}>Bounties</div>
              </div>
              <div style={{textAlign:"right"}}>
                <div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:14,fontWeight:700,color:"var(--text)"}}>{citeCount}</div>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:8,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.07em",marginTop:2}}>Citations</div>
              </div>
              {/* actions */}
              <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:6}} onClick={e=>e.stopPropagation()}>
                {cl.sheetLink&&<a href={cl.sheetLink} target="_blank" rel="noreferrer" style={{display:"inline-flex",alignItems:"center",gap:3,height:28,boxSizing:"border-box",fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,padding:"0 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",textDecoration:"none",whiteSpace:"nowrap"}}>Sheet↗</a>}
                {(cl.sheetBounties||cl.sheetMedia)&&<DrillSync program={cl} drillCamps={campaigns.filter(c=>c.campaignId===cl.id)} drillCites={citations.filter(c=>c.campaignId===cl.id)} setCampaigns={setCampaigns} setCitations={setCitations}/>}
                <span onClick={e=>{e.stopPropagation();onSave({...cl,status:cl.status==="completed"?"active":"completed"},cl)}}
                  style={{display:"inline-flex",alignItems:"center",height:28,boxSizing:"border-box",fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,padding:"0 10px",borderRadius:6,cursor:"pointer",whiteSpace:"nowrap",
                  background:cl.status==="completed"?"var(--surface2)":"color-mix(in srgb,var(--positive) 10%,transparent)",
                  border:cl.status==="completed"?"1px solid var(--border)":"1px solid color-mix(in srgb,var(--positive) 28%,transparent)",
                  color:cl.status==="completed"?"var(--muted)":"var(--positive)"}}>
                  {cl.status==="completed"?"Completed":"Active"}
                </span>
                <RowBtn onClick={()=>{setEdit(cl);setShowForm(true)}} title="Edit" hb="var(--accent)" hc="var(--accent)" hbg="color-mix(in srgb,var(--accent) 7%,transparent)"><Icons.Edit/></RowBtn>
                <RowBtn onClick={()=>setConfId(cl.id)} title="Delete" hb="var(--red)" hc="var(--red)" hbg="rgba(220,38,38,0.07)"><Icons.Trash/></RowBtn>
              </div>
              {/* drill arrow */}
              <span style={{display:"flex",justifyContent:"center",color:"var(--dim)"}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
            </div>
          );
        };

        const Section = ({label, items, accent, accentBg, accentBorder, defaultOpen=true}) => {
          const [open, setOpen] = useState(defaultOpen);
          if(!items.length) return null;
          return (
            <div style={{marginBottom:20}}>
              <button onClick={()=>setOpen(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:8,background:"none",border:"none",cursor:"pointer",padding:"6px 4px",marginBottom:open?8:0,width:"100%",textAlign:"left",borderRadius:6,transition:"background .12s"}}
                onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
                onMouseLeave={e=>e.currentTarget.style.background="none"}>
                <span style={{fontSize:11,display:"inline-block",transform:open?"rotate(90deg)":"none",transition:"transform .18s",color:"var(--dim)",width:14,textAlign:"center"}}>▶</span>
                <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--muted)"}}>{label}</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"1px 7px",borderRadius:99,background:accentBg,border:`1px solid ${accentBorder}`,color:accent}}>{items.length}</span>
              </button>
              {open&&(
                <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  {items.map((cl,i)=><CampaignRow key={cl.id} cl={cl} i={i} total={items.length}/>)}
                </div>
              )}
            </div>
          );
        };

        return (
          <div>
            {/* summary strip */}
            {(()=>{
              const totB = campaigns.length;
              const totC = citations.length;
              const stats = [
                {label:"Campaigns", value:programs.length, sub:`${activeCampaigns.length} active`},
                {label:"Active", value:activeCampaigns.length, sub:"In flight"},
                {label:"Total Bounties", value:totB.toLocaleString(), sub:"Across campaigns"},
                {label:"Total Citations", value:totC.toLocaleString(), sub:"Earned coverage"},
              ];
              return (
                <div style={{display:"flex",alignItems:"stretch",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,boxShadow:"var(--shadow-sm)",marginBottom:24,overflow:"hidden"}}>
                  {stats.map((s,i)=>(
                    <div key={i} style={{flex:1,minWidth:0,padding:"15px 20px",borderLeft:i?"1px solid var(--border)":"none"}}>
                      <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.label}</div>
                      <div className="tabular" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:27,fontWeight:700,color:"var(--text)",lineHeight:1,marginTop:10,letterSpacing:"-0.03em"}}>{s.value}</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:6,whiteSpace:"nowrap"}}>{s.sub}</div>
                    </div>
                  ))}
                </div>
              );
            })()}
            <Section label="Active" items={activeCampaigns} accent="var(--positive)" accentBg="color-mix(in srgb,var(--positive) 10%,transparent)" accentBorder="color-mix(in srgb,var(--positive) 28%,transparent)" defaultOpen={true}/>
            <Section label="Completed" items={completedCampaigns} accent="var(--muted)" accentBg="var(--surface2)" accentBorder="var(--border)" defaultOpen={false}/>
          </div>
        );
      })()}
      {showForm&&<CampaignForm initial={editClient} onSave={async f=>{await onSave(f,editClient);setShowForm(false);setEdit(null)}} onClose={()=>{setShowForm(false);setEdit(null)}}/>}
      {confirmId&&<ConfirmDelete onConfirm={()=>{onDelete(confirmId);setConfId(null)}} onCancel={()=>setConfId(null)}/>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  MY CREATIONS TAB (Author only)
// ─────────────────────────────────────────────────────────
const MyCreationsTab = ({myBounties, myCitations, onSaveCamp, onDeleteCamp, onSaveMedia, onDeleteMedia, currentUser, activeCid, allBounties, onCitedBountyUpdate}) => {
  const [sub, setSub] = useState("bounties");
  return (
    <div style={{animation:"fadeUp .4s ease both"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>// my contributions</div>
        <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>My Submissions</h2>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:20,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:9,padding:4,width:"fit-content",boxShadow:"inset 0 1px 2px rgba(0,0,0,0.04)"}}>
        {[{id:"bounties",label:"Bounties",count:myBounties.length},{id:"citations",label:"Media Citations",count:myCitations.length}].map(t=>{
          const ia = sub===t.id;
          return (
            <button key={t.id} onClick={()=>setSub(t.id)}
              style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"7px 16px",borderRadius:8,border:`1px solid ${ia?"rgba(26,58,92,0.1)":"transparent"}`,background:ia?"var(--surface2)":"transparent",color:ia?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:ia?700:400,letterSpacing:"0.04em",transition:"all .15s"}}>
              {t.label}
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:100,background:ia?"color-mix(in srgb,var(--accent) 8%,transparent)":"transparent",color:ia?"var(--accent)":"var(--dim)"}}>{t.count}</span>
            </button>
          );
        })}
      </div>
      {sub==="bounties"   && <CampaignTable campaigns={myBounties}  onSave={(f,ex)=>onSaveCamp(f,ex,activeCid)}  onDelete={onDeleteCamp}  currentUser={currentUser} readOnly={false}/>}
      {sub==="citations"  && <MediaTable   citations={myCitations} onSave={(f,ex)=>onSaveMedia(f,ex,activeCid)} onDelete={onDeleteMedia} currentUser={currentUser} readOnly={false} bounties={allBounties||myBounties} onCitedBountyUpdate={onCitedBountyUpdate}/>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  AUTHORS TAB — directory of contributors in current campaign
// ─────────────────────────────────────────────────────────
const AuthorsTab = ({campaigns, citations}) => {
  const [sort, setSort] = useState("activity"); // activity | recent | name
  const [search, setSearch] = useState("");

  // Compute the last 8 weeks (Mondays, oldest → newest)
  const sparkWeeks = useMemo(()=>{
    const out = [];
    const today = new Date(); today.setHours(0,0,0,0);
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay()+6)%7));
    for(let i=7;i>=0;i--){
      const d = new Date(monday); d.setDate(monday.getDate() - i*7);
      out.push(d.toISOString().slice(0,10));
    }
    return out;
  },[]);

  const authors = useMemo(()=>{
    const weekKey = iso => {
      try {
        const d = new Date(iso+"T00:00:00");
        if(isNaN(d.getTime())) return null;
        const monday = new Date(d);
        monday.setDate(d.getDate() - ((d.getDay()+6)%7));
        return monday.toISOString().slice(0,10);
      } catch { return null; }
    };
    const map = {};
    const push = (name, type, date) => {
      if(!name) return;
      const key = name.trim().toLowerCase();
      if(!key) return;
      if(!map[key]) map[key] = {name:name.trim(), bounties:0, citations:0, dates:[], weeks:new Set(), spark:Object.fromEntries(sparkWeeks.map(w=>[w,0]))};
      map[key][type==="bounty"?"bounties":"citations"]++;
      if(date){
        map[key].dates.push(date);
        const wk = weekKey(date);
        if(wk){
          map[key].weeks.add(wk);
          if(map[key].spark[wk]!==undefined) map[key].spark[wk]++;
        }
      }
    };
    campaigns.forEach(c=>push(c.author, "bounty", c.date));
    citations.forEach(c=>push(c.author, "citation", c.date));
    return Object.values(map).map(a=>{
      const sorted = [...a.dates].sort();
      return {
        ...a,
        total: a.bounties+a.citations,
        firstDate: sorted[0]||null,
        lastDate: sorted[sorted.length-1]||null,
        activeWeeks: a.weeks.size,
        sparkData: sparkWeeks.map(w=>a.spark[w]||0),
      };
    });
  },[campaigns, citations, sparkWeeks]);

  const filtered = useMemo(()=>{
    const q = search.trim().toLowerCase();
    const base = q ? authors.filter(a=>a.name.toLowerCase().includes(q)) : authors;
    const sorted = [...base];
    if(sort==="activity") sorted.sort((a,b)=>b.total-a.total || (b.lastDate||"").localeCompare(a.lastDate||""));
    else if(sort==="recent") sorted.sort((a,b)=>(b.lastDate||"").localeCompare(a.lastDate||"") || b.total-a.total);
    else if(sort==="name") sorted.sort((a,b)=>a.name.localeCompare(b.name));
    return sorted;
  },[authors, sort, search]);


  // Summary metrics
  const totalBounties = useMemo(()=>authors.reduce((s,a)=>s+a.bounties,0),[authors]);
  const totalCitations = useMemo(()=>authors.reduce((s,a)=>s+a.citations,0),[authors]);
  const mostActive = useMemo(()=>[...authors].sort((a,b)=>b.total-a.total)[0],[authors]);
  const avgPerAuthor = authors.length ? ((totalBounties+totalCitations)/authors.length).toFixed(1) : "0";

  // Days since last active — returns label + muted color
  const daysSince = iso => {
    if(!iso) return null;
    try {
      const d = new Date(iso+"T00:00:00");
      const now = new Date(); now.setHours(0,0,0,0);
      const diff = Math.floor((now - d) / (24*60*60*1000));
      if(diff<=0) return "today";
      if(diff===1) return "yesterday";
      if(diff<7) return `${diff}d ago`;
      if(diff<30) return `${Math.floor(diff/7)}w ago`;
      if(diff<365) return `${Math.floor(diff/30)}mo ago`;
      return `${Math.floor(diff/365)}y ago`;
    } catch { return null; }
  };

  // Activity status pill (recency)
  const activityStatus = iso => {
    if(!iso) return {label:"inactive", color:"var(--border2)", bg:"var(--surface2)"};
    try {
      const d = new Date(iso+"T00:00:00");
      const now = new Date(); now.setHours(0,0,0,0);
      const diff = Math.floor((now - d) / (24*60*60*1000));
      if(diff<=7)  return {label:"active",  color:"#16a34a", bg:"rgba(22,163,74,0.1)"};
      if(diff<=30) return {label:"recent",  color:"#d97706", bg:"rgba(217,119,6,0.1)"};
      return {label:"dormant", color:"var(--dim)", bg:"var(--surface2)"};
    } catch { return null; }
  };

  // Sparkline component
  const Sparkline = ({data, color}) => {
    const max = Math.max(...data, 1);
    const W = 100, H = 22;
    const bw = W/data.length;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{display:"block"}}>
        {data.map((v,i)=>{
          const h = (v/max) * H;
          return <rect key={i} x={i*bw+0.5} y={H-h} width={bw-1} height={h||1} rx="0.5" fill={color} opacity={v===0?0.15:0.7+(v/max)*0.3}/>;
        })}
      </svg>
    );
  };

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:14}}>
        <div>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>// contributors</div>
          <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>Authors <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:400,color:"var(--dim)",marginLeft:8}}>{authors.length}</span></h2>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--dim)",pointerEvents:"none"}}><Icons.Search/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search authors…" style={{...iStyle,padding:"7px 10px 7px 30px",fontSize:11,width:220}}/>
          </div>
          <div style={{display:"flex",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:3,gap:2}}>
            {[["activity","Activity"],["recent","Recent"],["name","Name"]].map(([v,l])=>(
              <button key={v} onClick={()=>setSort(v)}
                style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:6,border:"none",background:sort===v?"var(--surface)":"transparent",color:sort===v?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:sort===v?700:400,boxShadow:sort===v?"0 1px 3px rgba(0,0,0,0.08)":"none",transition:"all .15s"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary stat strip */}
      {authors.length>0 && (
        <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          {[
            {label:"Contributors",   val:authors.length,            sub:"Active in campaign",  c:"var(--accent)"},
            {label:"Total Bounties", val:totalBounties,             sub:"Bounties published",     c:"var(--accent)"},
            {label:"Citations",      val:totalCitations,            sub:"Media mentions",      c:"var(--accent)"},
            {label:"Avg per Author", val:avgPerAuthor,              sub:`${mostActive?.name||"—"} leads`, c:"var(--accent)"},
          ].map((s,i)=>(
            <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.03)"}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{s.label}</div>
              <div className="tabular" style={{fontSize:24,fontWeight:700,letterSpacing:"-0.03em",color:"var(--text)",lineHeight:1,marginBottom:4}}>{s.val}</div>
              <div title={s.sub} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {filtered.length===0
        ? <div style={{textAlign:"center",padding:"80px 20px",background:"var(--surface)",border:"1px dashed var(--border)",borderRadius:8}}>
            <div style={{fontSize:32,opacity:.15,marginBottom:8}}>◎</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)"}}>{search?"No authors match your search":"No authors in this campaign yet"}</div>
          </div>
        : <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            {/* Header row */}
            <div style={{display:"grid",gridTemplateColumns:"44px minmax(200px,1.6fr) 90px 90px 80px 110px 150px",alignItems:"center",gap:12,padding:"12px 18px",background:"var(--surface2)",borderBottom:"1px solid var(--border)",fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>
              <div style={{textAlign:"center"}}>#</div>
              <div>Author</div>
              <div style={{textAlign:"right"}}>Bounties</div>
              <div style={{textAlign:"right"}}>Citations</div>
              <div style={{textAlign:"right"}}>Weeks</div>
              <div style={{textAlign:"right"}}>Last Active</div>
              <div style={{textAlign:"right"}}>Last 8 Weeks</div>
            </div>
            {filtered.map((a,i)=>{
              const ac = getAuthorColor(a.name);
              const last = daysSince(a.lastDate);
              const status = activityStatus(a.lastDate);
              const isTopByActivity = sort==="activity" && i<3;
              const rankMedals = ["#d4af37","#a8a8a8","#cd7f32"]; // gold, silver, bronze
              const isLast = i===filtered.length-1;
              return (
                <div key={a.name} onClick={()=>window.dispatchEvent(new CustomEvent("cq-nav-author",{detail:a.name}))}
                  style={{position:"relative",display:"grid",gridTemplateColumns:"44px minmax(200px,1.6fr) 90px 90px 80px 110px 150px",alignItems:"center",gap:12,padding:"14px 18px",borderBottom:isLast?"none":"1px solid var(--border)",cursor:"pointer",transition:"background .15s ease",animation:`rowIn .35s ease ${i*.02}s both`}}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${ac.color}08`}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent"}}>
                  {/* Left accent bar on hover via author-color border */}
                  <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:ac.color,opacity:isTopByActivity?1:0.35}}/>

                  {/* Rank */}
                  <div style={{textAlign:"center",position:"relative"}}>
                    {isTopByActivity ? (
                      <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:rankMedals[i]+"22",border:`1px solid ${rankMedals[i]}`,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,color:rankMedals[i]}}>{i+1}</div>
                    ) : (
                      <span className="tabular" style={{fontSize:12,color:"var(--dim)",fontWeight:500}}>{i+1}</span>
                    )}
                  </div>

                  {/* Author: avatar + name + status */}
                  <div style={{display:"flex",alignItems:"center",gap:12,minWidth:0}}>
                    <div style={{width:36,height:36,flexShrink:0,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,background:ac.bg,color:ac.color,border:`1.5px solid ${ac.color}`,boxShadow:`0 0 0 2px ${ac.color}12`}}>{initials(a.name)}</div>
                    <div style={{minWidth:0,flex:1}}>
                      <div title={a.name} style={{fontSize:14,fontWeight:600,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",letterSpacing:"-0.01em",marginBottom:2}}>{a.name}</div>
                      {status && (
                        <span style={{display:"inline-flex",alignItems:"center",gap:4,fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:8,padding:"1px 6px",borderRadius:99,background:status.bg,color:status.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                          <span style={{width:4,height:4,borderRadius:"50%",background:status.color}}/>{status.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bounties */}
                  <div className="tabular" style={{textAlign:"right",fontSize:16,fontWeight:700,letterSpacing:"-0.02em",color:a.bounties>0?"var(--accent)":"var(--border2)"}}>{a.bounties}</div>

                  {/* Citations */}
                  <div className="tabular" style={{textAlign:"right",fontSize:16,fontWeight:700,letterSpacing:"-0.02em",color:a.citations>0?"var(--accent)":"var(--border2)"}}>{a.citations}</div>

                  {/* Weeks */}
                  <div className="tabular" style={{textAlign:"right",fontSize:14,fontWeight:600,color:"var(--text)"}}>{a.activeWeeks}</div>

                  {/* Last active */}
                  <div style={{textAlign:"right",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>{last||"—"}</div>

                  {/* Sparkline */}
                  <div style={{width:"100%"}}>
                    <Sparkline data={a.sparkData} color={ac.color}/>
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  AUTHOR DETAIL TAB
// ─────────────────────────────────────────────────────────
const AuthorDetailTab = ({authorName, campaigns, citations, program, onBack}) => {
  const eq = (a,b) => (a||"").trim().toLowerCase()===(b||"").trim().toLowerCase();
  const bounties = useMemo(()=>campaigns.filter(c=>eq(c.author,authorName)).sort((a,b)=>(b.date||"").localeCompare(a.date||"")),[campaigns,authorName]);
  const cits     = useMemo(()=>citations.filter(c=>eq(c.author,authorName)).sort((a,b)=>(b.date||"").localeCompare(a.date||"")),[citations,authorName]);

  // Display name (use the casing from the data)
  const displayName = bounties[0]?.author || cits[0]?.author || authorName;
  const ac = getAuthorColor(displayName);

  // Date stats
  const allDates = [...bounties.map(b=>b.date), ...cits.map(c=>c.date)].filter(Boolean).sort();
  const firstDate = allDates[0] || null;
  const lastDate  = allDates[allDates.length-1] || null;

  // Top outlets covering them
  const outletMap = {};
  cits.forEach(c=>{const m=(c.media||"").trim();if(!m)return;const mk=m.toLowerCase();if(!outletMap[mk])outletMap[mk]={label:m,count:0};outletMap[mk].count++;});
  const topOutlets = Object.values(outletMap).sort((a,b)=>b.count-a.count).slice(0,8);
  const maxOutlet = topOutlets[0]?.count||1;

  // Tier breakdown
  const tierMap = {};
  cits.forEach(c=>{const t=(c.mediaTier||"").trim();if(t)tierMap[t]=(tierMap[t]||0)+1;});
  const tierEntries = Object.entries(tierMap).sort((a,b)=>a[0].localeCompare(b[0]));

  // Weekly average + longest streak (in weeks with activity)
  const weekKey = iso => {
    try {
      const d = new Date(iso+"T00:00:00");
      if(isNaN(d.getTime())) return null;
      const monday = new Date(d);
      monday.setDate(d.getDate() - ((d.getDay()+6)%7));
      return monday.toISOString().slice(0,10);
    } catch { return null; }
  };
  const weekSet = new Set();
  allDates.forEach(d=>{const k=weekKey(d);if(k)weekSet.add(k);});
  const totalWeeksSpan = (() => {
    if(!firstDate||!lastDate) return 0;
    const a = new Date(firstDate+"T00:00:00");
    const b = new Date(lastDate+"T00:00:00");
    const ms = b - a;
    return Math.max(1, Math.ceil(ms/(7*24*60*60*1000))+1);
  })();
  const totalActivity = bounties.length + cits.length;
  const weeklyAvg = totalWeeksSpan ? (totalActivity/totalWeeksSpan).toFixed(1) : "0";

  // Longest consecutive-week streak with activity
  const longestStreak = (() => {
    if(!weekSet.size) return 0;
    const sorted = [...weekSet].sort();
    let best = 1, cur = 1;
    for(let i=1;i<sorted.length;i++){
      const prev = new Date(sorted[i-1]+"T00:00:00");
      const here = new Date(sorted[i]+"T00:00:00");
      const diffWeeks = Math.round((here-prev)/(7*24*60*60*1000));
      if(diffWeeks===1){ cur++; if(cur>best) best=cur; }
      else cur = 1;
    }
    return best;
  })();

  // Daily activity heatmap (last 90 days)
  const today = new Date(); today.setHours(0,0,0,0);
  const heatDays = [];
  for(let i=89;i>=0;i--){
    const d = new Date(today); d.setDate(d.getDate()-i);
    const k = d.toISOString().slice(0,10);
    const b = bounties.filter(x=>x.date===k).length;
    const c = cits.filter(x=>x.date===k).length;
    heatDays.push({date:k, b, c, total:b+c});
  }
  const maxHeat = Math.max(...heatDays.map(d=>d.total),1);

  // Separated timelines
  const bountyTimeline   = useMemo(()=>bounties.map(b=>({...b,_type:"bounty"})),[bounties]);
  const citationTimeline = useMemo(()=>cits.map(c=>({...c,_type:"citation"})),[cits]);

  const [timelineTab, setTimelineTab] = useState("bounties"); // bounties | citations
  const [showAll, setShowAll] = useState(false);
  const activeTimeline = timelineTab==="bounties" ? bountyTimeline : citationTimeline;
  const visibleTimeline = showAll ? activeTimeline : activeTimeline.slice(0,20);

  return (
    <div style={{animation:"fadeUp .4s ease both"}}>
      {/* Back button */}
      <button onClick={onBack}
        style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",marginBottom:20}}>
        ← Back
      </button>

      {/* Header card */}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"22px 26px",marginBottom:18,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
          <div style={{width:64,height:64,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:600,background:ac.bg,color:ac.color,border:"1px solid var(--border2)",flexShrink:0}}>{initials(displayName)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Author profile</div>
              {program && (
                <span style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:99,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)"}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:program.color}}/>{program.name}
                </span>
              )}
            </div>
            <h2 style={{fontSize:26,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)",marginBottom:6}}>{displayName}</h2>
            {firstDate && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>Active {fmtDate(firstDate)} → {fmtDate(lastDate)}</div>}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Bounties", val:bounties.length, c:"var(--accent)"},
          {label:"Citations", val:cits.length, c:"var(--accent)"},
          {label:"Active Weeks", val:weekSet.size, c:"var(--accent)"},
          {label:"Weekly Avg", val:weeklyAvg, c:"var(--accent)"},
          {label:"Longest Streak", val:`${longestStreak}w`, c:"var(--accent)"},
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"14px 16px",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{s.label}</div>
            <div className="tabular" style={{fontSize:24,fontWeight:700,letterSpacing:"-0.03em",color:"var(--text)",lineHeight:1}}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Heatmap (90 days) */}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"16px 20px",marginBottom:18,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Last 90 Days</div>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>less</span>
              {[0.15,0.35,0.6,0.85,1].map((o,i)=>(
                <div key={i} style={{width:10,height:10,borderRadius:2,background:`rgba(26,58,92,${o})`}}/>
              ))}
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>more</span>
            </div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(90,1fr)",gap:2}}>
          {heatDays.map(d=>{
            const intensity = d.total===0 ? 0 : 0.15 + (d.total/maxHeat)*0.85;
            return (
              <div key={d.date} title={`${d.date}: ${d.b}b · ${d.c}c`}
                style={{aspectRatio:"1",borderRadius:2,background:d.total===0?"var(--surface2)":`rgba(26,58,92,${intensity})`,border:d.total===0?"1px solid var(--border)":"none"}}/>
            );
          })}
        </div>
      </div>

      {/* Two-column: outlets + tier + programs */}
      <div className="cq-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18}}>
        {/* Top outlets */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Top Outlets Covering Them</div>
          {topOutlets.length===0
            ? <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No media coverage</div>
            : <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {topOutlets.map((o,i)=>(
                <div key={o.label}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{i+1}</span>
                      <span title={o.label} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.label}</span>
                    </div>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600,flexShrink:0,marginLeft:8}}>{o.count}</span>
                  </div>
                  <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                    <div style={{width:`${(o.count/maxOutlet)*100}%`,height:"100%",background:"var(--accent)",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        {/* Media Tier */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Media Tier</div>
          {tierEntries.length===0
            ? <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No tier data</div>
            : <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {tierEntries.map(([tier,count])=>{
                const tc=getTierColor(tier);
                const pct=(count/cits.length)*100;
                return (
                  <div key={tier}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color}}>Tier {tier}</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:600,color:tc.color}}>{count} <span style={{color:"var(--dim)",fontWeight:400}}>({Math.round(pct)}%)</span></span>
                    </div>
                    <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                      <div style={{width:`${pct}%`,height:"100%",background:tc.color,borderRadius:99,transition:"width .4s"}}/>
                    </div>
                  </div>
                );
              })}
            </div>
          }
        </div>
      </div>

      {/* Timeline */}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid var(--border)",background:"var(--surface2)",gap:12,flexWrap:"wrap"}}>
          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Full Timeline</div>
          <div style={{display:"flex",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:3,gap:2}}>
            {[
              {id:"bounties",  label:"Bounties",  count:bountyTimeline.length,   accent:"var(--accent)"},
              {id:"citations", label:"Citations", count:citationTimeline.length, accent:"var(--accent)"},
            ].map(t=>{
              const active = timelineTab===t.id;
              return (
                <button key={t.id} onClick={()=>{setTimelineTab(t.id);setShowAll(false);}}
                  style={{display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,padding:"5px 12px",borderRadius:6,border:"none",background:active?"var(--surface2)":"transparent",color:active?t.accent:"var(--dim)",cursor:"pointer",fontWeight:active?700:500,boxShadow:active?"0 1px 3px rgba(0,0,0,0.08)":"none",transition:"all .15s",textTransform:"uppercase",letterSpacing:"0.06em"}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:t.accent,opacity:active?1:0.4}}/>
                  {t.label}
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:99,background:active?t.accent+"15":"var(--surface2)",color:active?t.accent:"var(--dim)",fontWeight:600}}>{t.count}</span>
                </button>
              );
            })}
          </div>
        </div>
        {activeTimeline.length===0
          ? <div style={{padding:"40px",textAlign:"center",fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"var(--dim)"}}>No {timelineTab} recorded</div>
          : <>
            <div style={{maxHeight:"560px",overflowY:"auto"}}>
              {visibleTimeline.map((item,i)=>{
                const link = item._type==="bounty" ? item.cqLink : item.articleLink;
                return (
                  <div key={item.id} style={{display:"grid",gridTemplateColumns:"90px 14px 1fr auto",alignItems:"flex-start",gap:12,padding:"12px 20px",borderBottom:i<visibleTimeline.length-1?"1px solid var(--border)":"none",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.04)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",paddingTop:2}}>{item.date}</div>
                    <div style={{width:8,height:8,borderRadius:"50%",background:item._type==="bounty"?"var(--accent)":"var(--accent)",marginTop:6}}/>
                    <div style={{minWidth:0}}>
                      {item._type==="bounty"
                        ? <>
                            <div title={item.title} style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.title}</div>
                            <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Bounty</div>
                          </>
                        : <>
                            <div title={item.topic||item.media} style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.topic||item.media}</div>
                            {item.headline&&<div title={item.headline} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.headline}</div>}
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:9,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Citation</span>
                              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>· {item.media}</span>
                            </div>
                          </>
                      }
                    </div>
                    {link && (
                      <a href={link} target="_blank" rel="noreferrer"
                        style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:4,background:"color-mix(in srgb,var(--accent) 7%,transparent)",border:"1px solid rgba(26,58,92,0.1)",color:"var(--accent)",textDecoration:"none",flexShrink:0}}>↗</a>
                    )}
                  </div>
                );
              })}
            </div>
            {activeTimeline.length>20 && (
              <button onClick={()=>setShowAll(v=>!v)}
                style={{width:"100%",padding:"10px",border:"none",borderTop:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'JetBrains Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)"}}
                onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)"}}>
                {showAll?`▲ SHOW LESS`:`▼ SHOW ALL ${activeTimeline.length} ENTRIES`}
              </button>
            )}
          </>
        }
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  SHARE REPORT — public read-only live report at #/r/<token>
//  Renders the REAL Performance page (AnalyticsTab) for one campaign,
//  wrapped in a CQ-branded shell. Token → campaignId lives in `flags`.
// ─────────────────────────────────────────────────────────
const ShareReportPage = ({token}) => {
  const [status,setStatus] = useState("loading"); // loading | notfound | ready
  const [program,setProgram] = useState(null);
  const [bounties,setBounties] = useState([]);
  const [citations,setCitations] = useState([]);
  useEffect(()=>{ document.documentElement.dataset.theme = "dark"; },[]);
  useEffect(()=>{(async()=>{
    try{
      const {data:flag} = await supabase.from("flags").select("value").eq("key",`share_${token}`).maybeSingle();
      const cid = flag?.value;
      if(!cid || cid==="1"){ setStatus("notfound"); return; }
      const {data:prog} = await supabase.from("campaigns").select("id,name,color").eq("id",cid).maybeSingle();
      if(!prog){ setStatus("notfound"); return; }
      const [allB,allC] = await Promise.all([db.getCampaigns(), db.getCitations()]);
      setProgram(prog);
      setBounties(allB.filter(b=>b.campaignId===cid));
      setCitations(allC.filter(c=>c.campaignId===cid));
      setStatus("ready");
    }catch{ setStatus("notfound"); }
  })();},[token]);

  if(status==="notfound") return (
    <div style={{minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",boxShadow:"var(--shadow-sm)",padding:"40px 48px",textAlign:"center",maxWidth:420}}>
        <div style={{fontSize:30,opacity:.25,marginBottom:14}}>⬡</div>
        <div style={{fontSize:16,fontWeight:650,color:"var(--text)",marginBottom:8}}>Report not found</div>
        <div style={{fontSize:13,color:"var(--muted)",lineHeight:1.6}}>This share link is invalid or has been revoked. Ask your CryptoQuant contact for a fresh link.</div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",fontFamily:"'Hanken Grotesk',system-ui,sans-serif"}}>
      <div style={{maxWidth:1180,margin:"0 auto",padding:"0 28px 60px"}}>
        {/* Top bar */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 0",borderBottom:"1px solid var(--border)",marginBottom:26}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{lineHeight:1.15}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>CryptoQuant</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",letterSpacing:"0.08em"}}>BOUNTY TRACKER</div>
            </div>
            {program&&(
              <div style={{display:"flex",alignItems:"center",gap:8,paddingLeft:14,borderLeft:"1px solid var(--border)"}}>
                {program.color&&<span style={{width:9,height:9,borderRadius:99,background:program.color}}/>}
                <span style={{fontSize:14,fontWeight:650,color:"var(--text)",letterSpacing:"-0.01em"}}>{program.name}</span>
              </div>
            )}
          </div>
          <span style={{display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:99,border:"1px solid color-mix(in srgb,var(--positive) 30%,transparent)",background:"color-mix(in srgb,var(--positive) 9%,transparent)",color:"var(--positive)",letterSpacing:"0.06em"}}>
            <span style={{width:7,height:7,borderRadius:99,background:"var(--positive)",animation:"pulse 2s ease infinite"}}/>LIVE REPORT
          </span>
        </div>

        {status==="loading" ? (
          <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:14,marginBottom:24}}>
              {[0,1,2,3,4].map(i=><div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",padding:"16px 20px",display:"flex",flexDirection:"column",gap:10}}><div className="cq-skel" style={{width:"60%",height:9}}/><div className="cq-skel" style={{width:64,height:26}}/></div>)}
            </div>
            <div className="cq-skel" style={{width:"100%",height:280,borderRadius:10}}/>
          </div>
        ) : (
          <>
            {/* The actual Performance page, read-only (no export/share controls) */}
            <AnalyticsTab campaigns={bounties} citations={citations} dataLoading={false} clientName={program.name} color={program.color||"var(--accent)"} onExport={null} onShare={null}/>
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:18,borderTop:"1px solid var(--border)",fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)"}}>
              <span>CryptoQuant Bounty Program · {program.name}</span>
              <span>Live data · updates automatically</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────────────────
export default function App() {
  // Light mode disabled for now — force dark.
  const [theme] = useState("dark");
  useEffect(()=>{
    document.documentElement.dataset.theme = "dark";
  },[theme]);

  useEffect(()=>{
    document.title = "CryptoQuant Bounty Tracker";
    const link = document.querySelector("link[rel~='icon']") || Object.assign(document.createElement('link'),{rel:'icon'});
    link.type = 'image/png';
    link.href = 'data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAGQAZADASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAYJBwgDBAUCAf/EAEgQAAEEAQMBBQQGBQcLBQAAAAABAgMEBQYHESEIEjFBURM3YXEiMlJ1gbMJFEJykRUXI1dioaIkM0NTc4OSlbLB0iWCscLh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ANywAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAHFbtVqkSzWrENeNPF8r0aifipHre4Wgaj+5b1xpmu70lysDV/vcBJgcFC5UyFKG9QtQW6s7EkhngkR8cjV6o5rk6Ki+qHOAAAAAAAAAAAAAAAdLJ5fE4tveyeUo0k455sWGx/8AUqHhS7k7dRPVkuvtKscni12Yrov/AFgSoEZq7h6AtPRlXXOmJ3qvCNjy0DlVfwcSCnbq3YUmp2YbMS+D4pEe3+KAcwAAAAAAAAAAAAAAAAAABQFAAAAAAAAAAAAAAAB5eq9RYPSuDnzeo8pVxmOrpzJPYf3W/BE83OXyanKr5IB6hEdx9y9DbeUm2dX6iqY5XpzFAqrJPL+7E1FeqfHjhPNUNRd8e2DmstLNh9soX4egiq12UnYjrMyerGLykSePVeXeC/RXoasZK9dyd+bIZK5YuW53q+aeeRXySOXzc5eqqBuJuH22eJJK2gNJo5qdG3Mw/wAflDGvh6Kr/wAPIwPq/tD7xame/wDWtbZCjC5ekONVKjWp6cx8OVPmqmKgB2slkchkrC2MjetXJl/0liV0jv4uVVOqABaz2cPcLof7krfloT8gHZw9wuh/uSt+WhPwAAAAAAAQXeDdfRm1uF/X9T5FG2JWqtWhBw+zZVPsN56J6udw1PXnhAJ0Yo3U7Qm2G3rpKuRzjcnk2couPxnE8rVTyeqKjWL8HORfgaX729pjXu4i2MbRnXTmn3qrUp0pFSWVnpLL0V3xRO631RTBwG1Gvu2lrLIyPg0bgMdgq3Ko2e0q2rCp5L5Mb8la75mE9Vbx7panc/8AlnXecmjf9aGKysES/wC7j7rf7iBgD7lkklkdJLI6R7l5c5y8qv4nwAAOzj797HWEsY+5YqTJ4SQSuY5PxReTrADKWj+0HvBpd0aUtb5G5Czp7HIqltqp6cyIrkT5KhnfbztsyI6Otr7SbXN6I67iH8KnTxWGRevX0enyNNgBbPtvufoTcSssuktR1L8rGo6WtysdiJP7UbuHInlzxxz4KTEpvxt67jb0N/HXLFO3A7vwz15Fjkjd6tc1UVF+KG0exna+z2Elgw+5UcucxqqjEycLWpagTyV7U4SVPDlejvFeXL0UN7QeTpHUuB1bga+d01lauUx1hOY54H8pz5tVPFrk56tVEVPNEPWAAAAAAAAAAAAFAUAAAAAAAAAAAABBN8dzsHtToefUWX/p53L7KjSa9EfamVOjU9Gp4ud5J6rwih8b3braZ2n0suYz0qzWZuWUaETk9taeieCejU6cuXonKeKqiLXDvJutq7dTUC5LUd1UrRuX9Tx8Kqleq1fJrfN3Hi5eq/LhE8rc7XWotxdXWdS6luLPamXuxxt5SOvGi/Rjjb+y1Ofmq8qvKqqkYAAAAAAAAAtZ7OHuF0P9yVvy0J+QDs4e4XQ/3JW/LQn4AAAADXvtdb+xbZ4tdL6akZLq29D3kfwjm4+J3T2jk83r17rV/eXpwjg5e1B2jMXtjDJpzTqQZTVsrOrFdzFQRU6Ol48X+CpH06dV4ThHV86o1BmtUZ2znNQZKxkcjad3pp53cud8PRETwRE4RE6IdK9as3rk127Yls2Z5HSTTSvVz5HuXlXOVeqqq9eVOEAAAAAAAAAAAAAAAACcbO7par2t1I3Labur7F7m/rlGRVWC2xP2Xp5L1XhydU/ii2P7Gbs6a3Z0q3LYaRK96FGtyGOkeiy1Xr6/aYvC91yJwvwVFRKqCRbc6zz+gdW09TabuOrXaz+Vaqr7OZn7UciIqd5i+afinCoigW7AgOxe6OD3X0TFn8T/AEFqJUiyFFzuX1ZuOVb8Wr4td5p6Kiok+AAAAAAAAABQFAAAAAAAAAAADoahzGN0/grubzFqOpj6MDp7Ez16MY1OVX4r8PFV6FXPaA3Rym6+v7Gfud+DHw8wYymq9K8CL059XO+s5fVePBERNgv0g+6rpbcG1mGtcRQ9yzmlYv1nqiOihX5Jw9firPQ06AAAAAAAAAAAC1ns4e4XQ/3JW/LQn5AOzh7hdD/clb8tCfgAD8cqNarnKiIicqq+QGO+0Nuhj9qNurWfn9nNkpl/V8XUcv8An51Tpz/YanLnL06JxzyqFXmo8zktQ569nMzbkt5C9O6exM/xe9y8r8k9EToicIhkvtV7oy7n7pWrdWdz8FjFdTxTEd9F0aO+lMiesipzz491GIvgYkAAAAAAAAAAAAAAAAAAAAAAJ/sNudltqdfVtQ0O/PTfxDkaaO4bZgVeqfByeLV8lT0VUW0jTGcxmpdPUM/hrTbWPvwNnryt/aa5OeqeSp4KniioqFPBt9+j43UWpkrG1uYsL7C2r7WHc5ejJURVlh+TkTvonq13m4DdoAAAAAAAAKAoAAAAAAAAA8PX2paOjtFZjVGSdxVxlR9h6eb1RPosT4udw1PiqHuGrH6RfWC4zbzD6NrycTZq2s9hE/1EHC8L85HMVP3FA0g1Rmr+o9R5HP5SZ013IWZLM71Xxc9yqv4deETyQ80AAAAAAAAAAAALWezh7hdD/clb8tCfkA7OHuF0P9yVvy0J+AMF9trcF+h9mrNGhYSLK6geuPg4XhzIlTmZ6fJv0efJZEXyM6Fdnb31iuo97X4OCbv0tPVm1GtRyq32z0SSV3wXqxi/7MDXoAAAAAAAAAAAAAAAAAAAAAAAA7+nsvfwGdoZvFzur3qFhlivIn7L2ORyL/FDoAC3jbjVNLW2hMNqvH9K+TqMn7v+rd4PYvxa5HN/AkBqj+jk1gt/RWd0VZl5lxVltuq1V/0M3KORPgj2qq/7Q2uAAAAAAAUBQAAAAAAAABXL29dROzXaAuY9snehwtKCk1E8O8rfau/HmXhf3Sxoqa30ya5nefWWS7yubNm7fs1VefoJK5rf8KIBDAAAAAAAAAAAAAFrPZw9wuh/uSt+WhPyAdnD3C6H+5K35aE/A47U8NWrLasSJHDCxZJHr4Naicqv8CoLWmbn1Lq/Mahsq5Zsnemtu73iiyPV3H4c8FpHaAyjsNsjrPIxv7kkeFssjdzx3XvjVjV/i5CqAAAAAAAAAAAAAAAAAAAAAAAAAAAAM7dhTULsH2hcZUV/dgzNWehLz4fU9qz/ABxNT8SyIqS2cyq4TdnSWWR3dSrmasj1/spK3vJ+KcoW2gAAAAAAKAoAAAAAAAAAp11BOtrPZCyru+stqV6u9eXqvJcUU66grrUz+QqqnCw2pY1T5PVP+wHRAAAAAAAAAAAAAWs9nD3C6H+5K35aE/IB2cPcLof7krfloT8DEPbKnWv2atYSI7u8w12c/vWYm/8AcrFLOu2VCs/Zp1gxre8qQ138fu2Ync/hxyVigAAAAAAAAAAAAAAAAAAAAAAAAAABzUZ1rXoLLVVFika9FTxTheS5IptowOtXoKzfrTSNjT5qvBckAAAAAAAoCgAAAAAAAACprfPFuw282ssare62HNWvZp/YWVzmf4VQtlK5O3pp5cL2gbt9rFbFmaVe63p07yN9k7j8Yuf/AHAYCAAAAAAAAAAAAAWs9nD3C6H+5K35aE/IB2cPcLof7krfloT8CDdoHGLmNj9aUGtVz34Wy+NqJzy9kavan8WoVQFyduvFbqTVZ2I+GZjo5Gr5tVOFT+BUFrHCz6b1bmNPWkd7bGXpqj+fFVjerefx4A8kAAAAAAAAAAAAAAAAAAAAAAAAAASrZ/GOzW6+ksUjO+lrM1I3Ivh3Vmb3l+SJypbcVu9hTTzs52hcZbczvQ4erPfk9OjPZt/xytX8CyIAAAAAABQFAAAAAAAAAGq36RnR78loHC6zrQq6TDWnV7Tmp4QT8Ijl+CSNYifGQ2pPC3B0zR1nojMaVyPStk6j67nccrGqp9F6J6tdw5PiiAVCA9LVGFyGm9R5HAZWFYb2OsyVp2ej2OVF49U6covmnB5oAAAAAAAAAAAWs9nD3C6H+5K35aE/IB2cPcLof7krfloT8AV19vbR66c3vkzcEXdp6hqsttVE4akzE9nK35/Ra9f9oWKGCO3BoF+tNmLORowLLk9PPXIQo1PpOiROJm/8H0/nGgFbwAAAAAAAAAAH3BK+CeOaPu9+NyOb3mo5OUXlOUXovyU+ABvp2VtZbT7pYpmDzmgdGUtX1IuZYkw1ZrLrETrLEnc8ftM8vFOnhnj+bLbb+r7Sf/Jq/wD4FT2GyeQw2Vq5XFXJqV6pKksE8L1a+N6LyioqFi3ZW3/x+6WKZg84+Glq+pFzLEnDWXWInWWJPX7TPLxTp4Bkv+bLbb+r7Sf/ACav/wCA/my22/q+0n/yav8A+BLABEn7YbavYrHbe6T4cnC/+j10/wDoaN9rHs9W9t78uqNLwzWtI2JPpN6ufjnuXox6+KxqvRr1/dXrwrrETgyFOpkaE9C/WhtVLEbopoZWI5kjHJwrXIvRUVPICm4Gw/ax7PVvbe/LqjS8M1rSNiT6Tern457l6Mevisar0a9f3V68K7XgAAd/T2Iv5/O0MJi4HWL1+wyvXjT9p73I1E/ioG7X6OTR60NF53W1mHiXK2W06rnJ19jD1cqfBz3cfOM2vI/tvpWlojQeF0nj1R0GMqMg7/dRvtHInL3qiebnK5y/FVJAAAAAAAAoCgAAAAAAAAAABpT+kI2sfBer7p4etzDP3Kua7ifUenDYZl+CpwxV9UZ6mnpcRqTDY3UWAvYLMVWW8ffgdBYhenRzHJwvyXzRfFF4VCrjfzbDK7U6/s6fvJJNRkVZsbcVvSzAq9F9O+ng5PJfgqchj4AAAAAAAAAAWs9nD3C6H+5K35aE/IB2cPcLof7krfloT8AfkjGSRujka17HIqOa5OUVF8lP0AVf9qba6Xa7dG1j60L0weR5t4qRU6ezVfpRc+rHfR9eO6v7RictQ7RO1tDdjbuzgpVjgykCrYxdpyf5mdE6Iq+Pccn0XfBeeOUQq+1BiMlgM3cwuYpy08hSmdDYgkThzHtXhU//AHwVOqAdAAAAAAAAAAADt4bJ5DDZWrlcVcmpXqkqSwTwvVr43ovKKiodQAWQ9lbf/H7pYpmDzj4aWr6kXMsScNZdYidZYk9ftM8vFOnhncpyw2TyGGytXK4q5NSvVJUlgnherXxvReUVFQsW7K2/2P3TxTcHnHw0tX1IuZYk4ay6xE6yxJ6/aZ5eKdPAM7gADgyFOpkaE9C/WhtVLEbopoZWI5kjHJwrXIvRUVPIr17WPZ6t7b35dUaXhmtaRsSfSb1c/HPcvRj18VjVejXr+6vXhXWInBkKdTI0J6F+tDaqWI3RTQysRzJGOThWuReioqeQFNxt7+j42sdcytndHMVf8mqd+rh0en15VTiWZPVGoqsRfDlzvNp87i9j7IruzjotIzdzRuTsK61I96LJi2J9J7OvV6KnKMXr14R3H1l3L0tgsXpnTtDAYWq2rjqELYa8Tf2Wp6r5qviq+aqqgekAAAAAAAAFAUAAAAAAAAAAABAt89rsFuvomXT+X5gsxqstC6xOX1puOEd8Wr4Ob5p6KiKk9AFRm5OiNRbe6ttaZ1NSWtcgXlrk6xzxr9WSN37TV48fmi8KiokaLWN8dptM7s6XXE5uP9XuworqGRiYiy1Xr6faavCctVeF+CoipXBvHtbqzazUjsTqSmvsJHOWneiTmC2xF+s1fJfDlq9U5+SqEGAAAAAAABaz2cPcLof7krfloT8gHZw9wuh/uSt+WhPwAAAGuva/2Ci3FxcmrdL1ms1bTiRHxN4RMjE3wYvl7RE+q7z47q9OFbsUAKa7ME9WzLWswyQTxPVkkcjVa5jkXhWqi9UVF6cHGWKdqHs4YvcqGXUml21cXqxjVWRVb3YsgiJ0bJx4P9H/AIO5ThW1+alwWY01m7OEz2OsY7I1X9yavOzuuavinzRU4VFToqKioB5wAAAAAAAAAAHbw2TyGGytXK4q5NSvVJUlgnherXxvReUVFQ6gAsh7K2/+P3SxTMHnHw0tX1IuZYk4ay6xE6yxJ6/aZ5eKdPDO5TlhsnkMNlauVxVyaleqSpLBPC9Wvjei8oqKhYt2Vt/8fulimYPOPhpavqRcyxJw1l1iJ1liT1+0zy8U6eAZ3AAAAAAAAAAAAAAoCgAAAAAAAAAAAAAA8nV2msDq3A2MFqXFVcpjrCcSQTs5Tnyci+LXJz0cioqeSoesANEt8+yDnsJLPmNtZJc5jVVXrjJnNS1AnmjHLwkqePCdHeCcOXqurmSo3cbemoZGnYp24HdyWCxGsckbvRzV4VF+ClyBDdy9rtCbi1Gw6t09VvSsTiK0iLHYjT0bI3h3Hw54+AFTINyNwexLM10ljQerWPb1VtPLs4VPREljThV+bE+ZgbV+wG7+l3v/AF7Q+TtRN6+2x7EtsVPX+i7yonzRAMYA571O3RsurXqs9Wdv1o5o1Y5Pmi9TgAtZ7OHuF0P9yVvy0J+QDs4e4XQ/3JW/LQn4AAAAAAIDvJtJo3dTDtp6loqlqFqpVyFfhlivz9l3C8t5/ZVFT8epPgBWpvX2atwNuXz5CtVdqLAMVVS/RjVXxt9ZYurmfFU7zU+114MJFzBiTdPs7bX7gPlt3cImJykiKq38WqQSOcq8957eFY9fVXNVfiBWEDaPX3Yv1xjHyT6PzWN1BWRfowzr+q2PlwvMa/NXp8jCWqtpdzNLuk/lzQ2drRx/WnbUdLCn+8Zyz+8CEg+ntcx6se1WuavCoqcKinyAAOapVs3J2wVK81iZ31Y4mK5y/gnUDhBkvR+w27mqXMXG6GysML+OJ70aVI+PtIsqt7yfLkzvt52Jr8r47OvtVw1o/F1PEs771+CyyIiNVPgx3zA1Eo1Ld+5FTo1prVmZyMihhjV73uXwRrU6qvwQ2q7OXZX1jNmsdq7WV63pSGpM2xXrVpO7feqdUVVTpCnz5d4pwnibY7Z7UaB24gVmk9O1qdhze7JcfzLYk9eZHcuRF+ynDfgTYAnROOefiAAAAAAAAAAAAABQFAAAAAAAAAAAAAAAAAAAAAAOvfo0r8Psb1Ovai+xNGj2/wAFQjlvbPbi27vW9v8ASdheeeZcPXd/8s+JKwB18bRpY2hBj8dTr0qddiRwV68aRxxMTojWtbwiInoh2AAAAAAAAAAAAAAADzstgcFl+f5VwuOv8pwv6zVZLz/xIp4M21m2M8iyTbc6Pkevi5+ErKv97CXgCKVNs9uKbkfU2/0nXci8osWHrtX+5hIsdjsfjofY4+jVpxfYgibG3+CIdkAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKB//2Q==';
    document.head.appendChild(link);
  },[]);
  const [user,setUser]           = useState(null);
  const [users,setUsers]         = useState([]);
  const [programs,setPrograms]     = useState([]);   // named campaigns: [{id,name,color}]
  const [activeCid,setActiveCid] = useState(null); // active campaign id
  const [campaigns,setCampaigns] = useState([]);   // bounties entries
  const [citations,setCitations] = useState([]);   // media citation entries
  const [loading,setLoading]     = useState(true);
  const [dataLoading,setDataLoading] = useState(true); // phase-2 (bounties/citations) still in flight
  const [saving,setSaving]       = useState(false);
  const [toast,setToast]         = useState(null);
  const [tab,setTab]             = useState("performance");
  const [clientActiveCid,setClientActiveCid] = useState(null);
  const [showPdfModal,setShowPdfModal] = useState(false);
  const [exportRange,setExportRange] = useState(null);
  const [shareInfo,setShareInfo] = useState(null); // {token, url, name} → share-link modal
  const [sidebarCampaignOpen,setSidebarCampaignOpen] = useState(false);
  const [campFilter,setCampFilter] = useState("");
  const [sidebarOpen,setSidebarOpen] = useState(false);
  const [authorView,setAuthorView] = useState(null); // active author detail name
  const sidebarCampaignRef = useRef(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800)};

  // ── URL HASH ROUTING ──
  const parseHash = () => {
    const parts = window.location.hash.replace(/^#\/?/,"").split("/").filter(Boolean);
    if(parts[0]==="u" && parts[1]) return {cid:null, tab:"author", author:decodeURIComponent(parts[1])};
    if(parts[0]==="c" && parts[1] && parts[2]) return {cid:parts[1], tab:parts[2], author:null};
    if(parts[0]) return {cid:null, tab:parts[0], author:null};
    return {cid:null, tab:null, author:null};
  };
  const pushHash = (newTab, newCid, authorName) => {
    let hash;
    if(newTab==="author" && authorName) hash = `#/u/${encodeURIComponent(authorName)}`;
    else if(newCid) hash = `#/c/${newCid}/${newTab}`;
    else hash = `#/${newTab}`;
    if(window.location.hash !== hash) window.history.pushState(null,"",hash);
  };
  const navigate = (newTab, newCid=activeCid) => {
    setTab(newTab);
    if(newCid !== undefined) setActiveCid(newCid);
    if(newTab!=="author") setAuthorView(null);
    pushHash(newTab, newCid);
  };
  const navigateToAuthor = (name, cid) => {
    if(!name) return;
    if(cid) setActiveCid(cid);
    setAuthorView(name);
    setTab("author");
    pushHash("author", cid||activeCid, name);
  };

  // Sync state → hash whenever tab or activeCid changes (never in share-link mode)
  useEffect(()=>{ if(!SHARE_TOKEN && user && tab) pushHash(tab, activeCid, authorView); },[tab, activeCid, authorView]);

  // Listen for author-navigation events from nested components
  useEffect(()=>{
    const h = e => { const d=e.detail; if(typeof d==="string") navigateToAuthor(d); else navigateToAuthor(d.name, d.cid); };
    window.addEventListener("cq-nav-author", h);
    return ()=>window.removeEventListener("cq-nav-author", h);
  },[activeCid]);

  // Listen for tab-navigation events (e.g. drill slide-over "Open full table")
  useEffect(()=>{
    const h = e => { const t=e.detail?.tab; if(t) setTab(t); };
    window.addEventListener("cq-nav-tab", h);
    return ()=>window.removeEventListener("cq-nav-tab", h);
  },[]);

  // Close sidebar campaign popover on click outside / Escape; clear its filter on close
  useEffect(()=>{
    const h = e => { if(sidebarCampaignRef.current&&!sidebarCampaignRef.current.contains(e.target)) setSidebarCampaignOpen(false); };
    const k = e => { if(e.key==="Escape") setSidebarCampaignOpen(false); };
    document.addEventListener("mousedown",h);
    window.addEventListener("keydown",k);
    return ()=>{ document.removeEventListener("mousedown",h); window.removeEventListener("keydown",k); };
  },[]);
  useEffect(()=>{ if(!sidebarCampaignOpen) setCampFilter(""); },[sidebarCampaignOpen]);

  // Listen for browser back/forward
  useEffect(()=>{
    const onPop = () => {
      const {cid, tab:t, author} = parseHash();
      if(t) setTab(t);
      if(t==="author") setAuthorView(author);
      else setAuthorView(null);
      if(cid !== undefined) setActiveCid(cid);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  },[]);

  // Set default tab + campaign — runs when either user or programs change,
  // so it works regardless of which loads first
  useEffect(()=>{
    if(!user||!programs.length) return;
    const {cid:hashCid, tab:rawHashTab, author:hashAuthor} = parseHash();
    // Only honor hash tabs that are valid for this role — a stale/foreign hash
    // (e.g. "#/c/x/users" for an author, or "#/author" with no name) otherwise
    // restores a tab that renders nothing → blank screen. Invalid → default to performance.
    const roleTabs = user.role==="admin"
      ? ["performance","weekly","analytics","campaign","media","authors","author","campaigns_mgmt","users"]
      : user.role==="author"
        ? ["performance","weekly","analytics","campaign","media","authors","author","mine"]
        : ["performance","weekly","analytics","campaign","media","authors","author"];
    const hashTab = (rawHashTab && roleTabs.includes(rawHashTab) && !(rawHashTab==="author"&&!hashAuthor)) ? rawHashTab : null;
    if(hashTab==="author" && hashAuthor) setAuthorView(hashAuthor);
    if(user.role==="admin"){
      const mostRecent = [...programs].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
      if(hashTab==="author") { setTab("author"); setActiveCid(hashCid||mostRecent?.id||null); }
      else if(hashTab) { setTab(hashTab); setActiveCid(hashCid||mostRecent?.id||null); }
      else { setTab("performance"); setActiveCid(mostRecent?.id||null); }
    } else if(user.role==="author"){
      const allowed = (user.allowedCampaigns||[]).filter(id=>programs.some(p=>p.id===id));
      const mostRecent = allowed.map(id=>programs.find(p=>p.id===id)).filter(Boolean).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
      if(hashTab==="author") { setTab("author"); }
      else if(hashTab && hashCid && allowed.includes(hashCid)) { setTab(hashTab); setActiveCid(hashCid); }
      else { setTab("performance"); setActiveCid(mostRecent?.id||null); }
    } else if(user.role==="client"){
      const allowed = (user.allowedCampaigns||[]).filter(id=>programs.some(p=>p.id===id));
      const mostRecent = allowed.map(id=>programs.find(p=>p.id===id)).filter(Boolean).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
      if(hashTab==="author") { setTab("author"); }
      else if(hashTab && hashCid && allowed.includes(hashCid)) { setTab(hashTab); setClientActiveCid(hashCid); }
      else { setTab("performance"); if(mostRecent) setClientActiveCid(mostRecent.id); }
    }
  },[user?.id, programs.length]);

  // ── RE-FETCH USERS whenever the Users tab is opened ──
  // Picks up accounts registered by other users while admin was already logged in
  useEffect(()=>{
    if(tab!=="users") return;
    (async()=>{
      try {
        const fresh = await db.getUsers().catch(()=>[]);
        if(fresh.length) setUsers(fresh);
      } catch {}
    })();
  },[tab]);

  // ── LOAD ──
  // Two-phase so first paint isn't blocked on the heavy data:
  //   Phase 1 — users + programs (all the shell/login/campaign-list needs) → drop the loading gate.
  //   Phase 2 — bounties + citations (+ one-time seeding) fetched in the background; the dashboard
  //             renders immediately with empty arrays and fills in when they arrive.
  useEffect(()=>{
    (async()=>{
      let loadedPrograms = [];
      // Phase 1 — light data needed to render the shell
      try {
        const [loadedUsers, lp] = await Promise.all([
          db.getUsers().catch(()=>[]),
          db.getPrograms().catch(()=>[]),
        ]);
        loadedPrograms = lp;

        // Bootstrap admin if no users exist
        if (!loadedUsers.length) {
          const adminUser = {id:uid(),username:"admin",passwordHash:hashPass("admin123"),role:"admin",createdAt:Date.now()};
          await db.setUsers([adminUser]);
          setUsers([adminUser]);
        } else {
          setUsers(loadedUsers);
          // Restore session from localStorage
          try {
            const savedId = localStorage.getItem("cq_session");
            if(savedId) {
              const saved = loadedUsers.find(u=>u.id===savedId);
              if(saved) setUser(saved);
              else localStorage.removeItem("cq_session");
            }
          } catch{}
        }

        setPrograms(loadedPrograms);
      } finally { setLoading(false); }

      // Phase 2 — heavy data + one-time seeding, in the background
      try {
        const [loadedCamps, loadedCits, nexoSeeded, nexoCitSeeded] = await Promise.all([
          db.getCampaigns().catch(()=>[]),
          db.getCitations().catch(()=>[]),
          db.getFlag(NEXO_SEEDED_KEY).catch(()=>false),
          db.getFlag(NEXO_CIT_SEEDED_KEY).catch(()=>false),
        ]);

        // Seed Nexo bounties if not yet done
        if(!nexoSeeded) {
          const nexoCampaign = loadedPrograms.find(c=>c.name.toLowerCase()==="nexo");
          if(nexoCampaign && !loadedCamps.some(c=>c.campaignId===nexoCampaign.id)) {
            const seeded = NEXO_BOUNTIES.map(b=>({...b,id:uid(),campaignId:nexoCampaign.id,createdBy:"seed",createdAt:Date.now()}));
            const merged = [...seeded,...loadedCamps];
            await db.setCampaigns(merged);
            setCampaigns(merged);
          } else {
            setCampaigns(loadedCamps);
          }
          await db.setFlag(NEXO_SEEDED_KEY);
        } else {
          setCampaigns(loadedCamps);
        }

        // Seed Nexo citations if not yet done
        if(!nexoCitSeeded) {
          const nexoCampaign2 = loadedPrograms.find(c=>c.name.toLowerCase()==="nexo");
          if(nexoCampaign2 && !loadedCits.some(c=>c.campaignId===nexoCampaign2.id)) {
            const seededCits = NEXO_CITATIONS.map(b=>({...b,id:uid(),campaignId:nexoCampaign2.id,createdBy:"seed",createdAt:Date.now()}));
            const mergedCits = [...seededCits,...loadedCits];
            await db.setCitations(mergedCits);
            setCitations(mergedCits);
          } else {
            setCitations(loadedCits);
          }
          await db.setFlag(NEXO_CIT_SEEDED_KEY);
        } else {
          setCitations(loadedCits);
        }
      } catch {} finally { setDataLoading(false); }
    })();
  },[]);

  // ── PERSIST ──
  const persistUsers = useCallback(async(data)=>{
    setSaving(true);setUsers(data);
    try{await db.setUsers(data);}
    catch{showToast("Save failed","error");}finally{setSaving(false);}
  },[]);
  const persistPrograms = useCallback(async(data)=>{
    setSaving(true);setPrograms(data);
    try{await db.setPrograms(data);}
    catch{showToast("Save failed","error");}finally{setSaving(false);}
  },[]);
  const persistCamp = useCallback(async(data)=>{
    setSaving(true);setCampaigns(data);
    try{await db.setCampaigns(data);}
    catch{showToast("Save failed","error");}finally{setSaving(false);}
  },[]);
  const persistMedia = useCallback(async(data)=>{
    setSaving(true);setCitations(data);
    try{await db.setCitations(data);}
    catch{showToast("Save failed","error");}finally{setSaving(false);}
  },[]);

  // ── USER CRUD ──
  const handleSaveUser = async(form,existing)=>{
    if(existing){await persistUsers(users.map(u=>u.id===existing.id?{...u,...form,id:u.id}:u));showToast("User updated ✓");}
    else{await persistUsers([...users,{...form,id:uid(),createdAt:Date.now()}]);showToast("User created ✓");}
  };
  const handleDeleteUser=async(id)=>{await persistUsers(users.filter(u=>u.id!==id));showToast("User deleted");};

  // ── CLIENT/CAMPAIGN CRUD ──
  const handleSaveProgram = async(form,existing)=>{
    if(existing){
      const up=programs.map(c=>c.id===existing.id?{...c,...form}:c);
      await persistPrograms(up);showToast("Campaign updated ✓");
    } else {
      const newC={...form,id:uid(),createdAt:Date.now()};
      const up=[...programs,newC];
      await persistPrograms(up);
      if(!activeCid) setActiveCid(newC.id);
      showToast("Campaign created ✓");
    }
  };
  const handleDeleteProgram=async(id)=>{
    await persistPrograms(programs.filter(c=>c.id!==id));
    // also wipe its entries
    await persistCamp(campaigns.filter(c=>c.campaignId!==id));
    await persistMedia(citations.filter(c=>c.campaignId!==id));
    if(activeCid===id) setActiveCid(programs.find(c=>c.id!==id)?.id||null);
    showToast("Campaign deleted");
  };

  // ── ENTRY CRUD (scoped to activeCid) ──
  const handleSaveCamp=async(form,existing,cidOverride)=>{
    const entry={...form,campaignId:cidOverride||activeCid};
    if(existing){
      const updated={...entry,id:existing.id,createdBy:existing.createdBy};
      await db.upsertBounty(updated);
      setCampaigns(campaigns.map(c=>c.id===existing.id?updated:c));
      showToast("Bounty updated ✓");
    } else {
      const newEntry={...entry,id:uid(),createdBy:user?.id,createdAt:Date.now()};
      await db.upsertBounty(newEntry);
      setCampaigns([newEntry,...campaigns]);
      showToast("Bounty added ✓");
    }
  };
  const handleDeleteCamp=async(id)=>{
    await db.deleteBounty(id);
    setCampaigns(campaigns.filter(c=>c.id!==id));
    showToast("Bounty deleted");
  };
  const handleDeleteAllCamp=async(campaignId)=>{
    await db.deleteAllBounties(campaignId);
    setCampaigns(campaigns.filter(c=>c.campaignId!==campaignId));
    showToast("All bounties deleted");
  };
  const handleDeleteAllMedia=async(campaignId)=>{
    await db.deleteAllCitations(campaignId);
    setCitations(citations.filter(c=>c.campaignId!==campaignId));
    showToast("All citations deleted");
  };

  const handleSaveMedia=async(form,existing,cidOverride)=>{
    const entry={...form,campaignId:cidOverride||activeCid};
    if(existing){
      const updated={...entry,id:existing.id,createdBy:existing.createdBy};
      await db.upsertCitation(updated);
      setCitations(citations.map(c=>c.id===existing.id?updated:c));
      showToast("Citation updated ✓");
    } else {
      const newEntry={...entry,id:uid(),createdBy:user?.id,createdAt:Date.now()};
      await db.upsertCitation(newEntry);
      setCitations([newEntry,...citations]);
      showToast("Citation added ✓");
    }
  };
  const handleDeleteMedia=async(id)=>{
    await db.deleteCitation(id);
    setCitations(citations.filter(c=>c.id!==id));
    showToast("Citation deleted");
  };
  const handleCitedBountyUpdate=async(citationId,bountyId,silent=false)=>{
    await db.updateCitationCitedBounty(citationId,bountyId);
    setCitations(prev=>prev.map(c=>c.id===citationId?{...c,citedBountyId:bountyId||""}:c));
    if(!silent) showToast(bountyId?"Bounty linked ✓":"Link cleared");
  };
  const handleBountySummaryUpdate=async(bountyId,summary,silent=false)=>{
    setCampaigns(prev=>prev.map(b=>b.id===bountyId?{...b,summary:summary||""}:b));
    if(!silent) showToast("Summary saved ✓");
  };
  const handleBountyImpressionsUpdate=async(bountyId,value,silent=false)=>{
    setCampaigns(prev=>prev.map(b=>b.id===bountyId?{...b,twitterImpressions:value||""}:b));
    if(!silent) showToast("Impressions updated ✓");
  };
  const handleBountyTgUpdate=async(bountyId,value,silent=false)=>{
    setCampaigns(prev=>prev.map(b=>b.id===bountyId?{...b,telegramImpressions:value||""}:b));
    if(!silent) showToast("Telegram views updated ✓");
  };

  // ── ACTIVE CAMPAIGN OBJECT ──

  // ── SCOPED DATA ──
  const clientAllowedIds = useMemo(()=>{
    if(!user||user.role!=="client") return [];
    return user.allowedCampaigns||[];
  },[user]);

  const scopedCampaigns = useMemo(()=>{
    if(!user)return[];
    if(user.role==="client"){
      const cid = clientActiveCid || (clientAllowedIds[0]||null);
      return cid ? campaigns.filter(c=>c.campaignId===cid) : [];
    }
    if(user.role==="author"){
      const allowed = user.allowedCampaigns||[];
      const cid = activeCid && allowed.includes(activeCid) ? activeCid : null;
      return cid ? campaigns.filter(c=>c.campaignId===cid) : [];
    }
    return activeCid ? campaigns.filter(c=>c.campaignId===activeCid) : [];
  },[campaigns,user,activeCid,clientAllowedIds,clientActiveCid]);

  const scopedCitations = useMemo(()=>{
    if(!user)return[];
    if(user.role==="client"){
      const cid = clientActiveCid || (clientAllowedIds[0]||null);
      return cid ? citations.filter(c=>c.campaignId===cid) : [];
    }
    if(user.role==="author"){
      const allowed = user.allowedCampaigns||[];
      const cid = activeCid && allowed.includes(activeCid) ? activeCid : null;
      return cid ? citations.filter(c=>c.campaignId===cid) : [];
    }
    return activeCid ? citations.filter(c=>c.campaignId===activeCid) : [];
  },[citations,user,activeCid,clientAllowedIds,clientActiveCid]);

  // Footer counts — only the campaigns this account can access (admins see all).
  const footerStats = useMemo(()=>{
    if(!user) return {campaigns:0,bounties:0,citations:0};
    const ids = user.role==="admin" ? programs.map(p=>p.id) : (user.allowedCampaigns||[]).filter(id=>programs.some(p=>p.id===id));
    const idSet = new Set(ids);
    return {
      campaigns: ids.length,
      bounties: campaigns.filter(c=>idSet.has(c.campaignId)).length,
      citations: citations.filter(c=>idSet.has(c.campaignId)).length,
    };
  },[user,programs,campaigns,citations]);

  const handleLogin = (u) => {
    setUser(u);
    // Fresh login always lands on Performance — clear any stale hash from a prior session.
    setTab("performance"); setAuthorView(null);
    try{ window.history.replaceState(null,"","#/performance"); }catch{}
    try{localStorage.setItem("cq_session",u.id);}catch{}
  };
  const handleLogout = () => { setUser(null); try{localStorage.removeItem("cq_session");}catch{} };

  // Public share route — renders the live read-only report, no login required.
  if(SHARE_TOKEN) return (<><style>{css}</style><ShareReportPage token={SHARE_TOKEN}/></>);

  if(!user && !loading) return (<><style>{css}</style><LoginScreen onLogin={handleLogin}/></>);

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"var(--bg)",flexDirection:"column",gap:14}}>
      <style>{css}</style>
      <Icons.Spin/><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",letterSpacing:"0.08em"}}>LOADING…</div>
    </div>
  );

  if(!user) return (<><style>{css}</style><LoginScreen onLogin={handleLogin}/></>);

  const rm = ROLE_META[user.role]||ROLE_META.author;
  const readOnly = user.role==="client";

  // Client campaign switcher
  const allowedClientCampaigns = user ? programs.filter(c=>(user.allowedCampaigns||[]).includes(c.id)) : [];
  const effectiveCid = user?.role==="client"
    ? (clientActiveCid && (user.allowedCampaigns||[]).includes(clientActiveCid) ? clientActiveCid : allowedClientCampaigns[0]?.id || null)
    : activeCid;
  const effectiveClient = programs.find(c=>c.id===effectiveCid)||null;

  // Mint (or reuse) a share token for the active campaign and open the share modal.
  const handleShare = async () => {
    if(!effectiveClient) return;
    try{
      const {data:existing} = await supabase.from("flags").select("key").like("key","share_%").eq("value",effectiveClient.id).limit(1);
      let token = existing?.[0]?.key?.replace(/^share_/,"") || null;
      if(!token){
        const bytes = new Uint8Array(12); crypto.getRandomValues(bytes);
        token = Array.from(bytes, b=>b.toString(16).padStart(2,"0")).join("");
        const {error} = await supabase.from("flags").upsert({key:`share_${token}`, value:effectiveClient.id},{onConflict:"key"});
        if(error) throw error;
      }
      setShareInfo({token, url:`${window.location.origin}${window.location.pathname}#/r/${token}`, name:effectiveClient.name});
    }catch(e){ showToast("Could not create share link","error"); }
  };
  const handleRevokeShare = async () => {
    if(!shareInfo) return;
    if(!window.confirm(`Revoke the share link for ${shareInfo.name}? Anyone holding the current link will lose access. You can mint a fresh link afterwards.`)) return;
    try{
      const {error} = await supabase.from("flags").delete().eq("key",`share_${shareInfo.token}`);
      if(error) throw error;
      setShareInfo(null);
      showToast("Share link revoked");
    }catch(e){ showToast("Could not revoke link","error"); }
  };

  const myAuthorName = (user.displayName||user.username).toLowerCase();
  const myBounties   = scopedCampaigns.filter(c=>(c.author||"").toLowerCase()===myAuthorName);
  const myCitations  = scopedCitations.filter(c=>(c.author||"").toLowerCase()===myAuthorName);
  const scopedAuthorsCount = new Set([...scopedCampaigns.map(c=>(c.author||"").trim().toLowerCase()),...scopedCitations.map(c=>(c.author||"").trim().toLowerCase())].filter(Boolean)).size;

  const TABS = [
    {id:"performance", label:"Performance",       icon:<Icons.Analytics/>, accent:"var(--accent)", count:""},
    {id:"campaign",    label:"Bounties",          icon:<Icons.Chart/>,     accent:"var(--accent)", count:scopedCampaigns.length},
    {id:"media",       label:"Media Citations",  icon:<Icons.News/>,      accent:"var(--accent)", count:scopedCitations.length},
    {id:"authors",     label:"Authors",          icon:<Icons.Users/>,     accent:"var(--accent)", count:scopedAuthorsCount},
    ...(user.role==="author"?[{id:"mine", label:"My Submissions", icon:<Icons.User/>, accent:"var(--accent)", count:myBounties.length+myCitations.length}]:[]),
    ...(user.role==="admin"?[
      {id:"campaigns_mgmt", label:"Campaigns",     icon:<Icons.Brief/>,     accent:"var(--accent)", count:programs.length},
      {id:"users",          label:"Users & Access", icon:<Icons.Users/>,     accent:"var(--accent)", count:users.length},
    ]:[]),
  ];

  return (
    <>
      <style>{css}</style>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      {showPdfModal&&effectiveClient&&<PdfReportModal campaigns={scopedCampaigns} citations={scopedCitations} campaignName={effectiveClient.name} initialFrom={exportRange?.from} initialTo={exportRange?.to} onClose={()=>setShowPdfModal(false)}/>}
      {shareInfo&&(
        <div onClick={()=>setShareInfo(null)} style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.55)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:14,width:"min(var(--modal-md),100%)",boxShadow:"0 24px 64px rgba(0,0,0,0.18)",animation:"modalIn .2s ease"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid var(--border)"}}>
              <div>
                <div style={{fontSize:15,fontWeight:700,color:"var(--text)",letterSpacing:"-0.01em"}}>Share live report</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:2}}>{shareInfo.name} · read-only · always current</div>
              </div>
              <button onClick={()=>setShareInfo(null)} style={{width:28,height:28,borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)"}}><Icons.X/></button>
            </div>
            <div style={{padding:"20px 24px"}}>
              <div style={{display:"flex",gap:8,marginBottom:14}}>
                <input readOnly value={shareInfo.url} onFocus={e=>e.target.select()}
                  style={{flex:1,fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"10px 12px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text)",minWidth:0}}/>
                <button onClick={async()=>{try{await navigator.clipboard.writeText(shareInfo.url);showToast("Link copied ✓");}catch{showToast("Copy failed","error");}}}
                  style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"10px 16px",borderRadius:8,border:"none",background:"var(--accent)",color:"#0B1120",cursor:"pointer",fontWeight:650,whiteSpace:"nowrap"}}>COPY</button>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,color:"var(--muted)",lineHeight:1.7,padding:"12px 14px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8}}>
                Anyone with this link can view a <b style={{color:"var(--text)"}}>read-only live report</b> for {shareInfo.name} — hero numbers, reach curve, top coverage, and tier summary. No login required. The link stays the same until you revoke it.
              </div>
            </div>
            <div style={{padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"space-between",gap:10}}>
              <button onClick={handleRevokeShare} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid rgba(220,38,38,0.28)",background:"rgba(220,38,38,0.07)",color:"var(--red)",cursor:"pointer",fontWeight:500}}>Revoke link</button>
              <div style={{display:"flex",gap:10}}>
                <a href={shareInfo.url} target="_blank" rel="noreferrer" style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",textDecoration:"none"}}>Preview ↗</a>
                <button onClick={()=>setShareInfo(null)} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer"}}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LAYOUT */}
      <div style={{display:"flex",minHeight:"100vh"}}>
        {/* Mobile overlay */}
        <div className={`cq-overlay${sidebarOpen?" active":""}`} style={{display:"none",position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:499}} onClick={()=>setSidebarOpen(false)}/>
        {/* Mobile hamburger */}
        <button className="cq-hamburger" onClick={()=>setSidebarOpen(v=>!v)} style={{display:"none",position:"fixed",top:12,left:12,zIndex:501,width:36,height:36,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",color:"var(--accent)",fontSize:16,padding:0}}>
          {sidebarOpen?"✕":"☰"}
        </button>
        {/* SIDEBAR */}
        <nav className={`cq-sidebar${sidebarOpen?" open":""}`} style={{width:216,flexShrink:0,background:"var(--surface)",borderRight:"1px solid var(--border)",padding:"20px 8px",display:"flex",flexDirection:"column",gap:2,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <div style={{padding:"4px 10px",marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,letterSpacing:"-0.01em",color:"var(--text)"}}>CryptoQuant</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9.5,color:"var(--dim)",letterSpacing:"0.08em",marginTop:1}}>BOUNTY TRACKER</div>
          </div>

          {/* CAMPAIGN SELECTOR */}
          {(()=>{
            const visibleCampaigns = user.role==="admin"
              ? programs
              : user.role==="client"
                ? allowedClientCampaigns
                : programs.filter(c=>(user.allowedCampaigns||[]).includes(c.id));
            const currentCid = user.role==="client" ? (clientActiveCid||allowedClientCampaigns[0]?.id||null) : activeCid;
            const activeCl = visibleCampaigns.find(c=>c.id===currentCid);
            const setCid = user.role==="client" ? setClientActiveCid : setActiveCid;
            if(!visibleCampaigns.length) return (
              <div style={{padding:"0 10px",marginBottom:16}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:8,letterSpacing:"0.14em",color:"var(--dim)",textTransform:"uppercase",marginBottom:6}}>Campaign</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)",padding:"8px 0"}}>No campaigns assigned.</div>
              </div>
            );
            return (
              <div ref={sidebarCampaignRef} style={{padding:"0 4px",marginBottom:16,position:"relative"}}>
                <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:8,letterSpacing:"0.14em",color:"var(--dim)",textTransform:"uppercase",padding:"0 6px",marginBottom:6}}>Campaign</div>
                <button onClick={()=>setSidebarCampaignOpen(v=>!v)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:sidebarCampaignOpen?"var(--surface3)":"var(--surface2)",border:"1px solid "+(sidebarCampaignOpen?"var(--border)":"var(--border)"),borderRadius:6,cursor:"pointer",transition:"all .15s",textAlign:"left"}}
                  onMouseEnter={e=>{if(!sidebarCampaignOpen)e.currentTarget.style.background="var(--border)"}}
                  onMouseLeave={e=>{if(!sidebarCampaignOpen)e.currentTarget.style.background="var(--surface2)"}}>
                  {activeCl&&<div style={{width:7,height:7,borderRadius:"50%",background:activeCl.color,flexShrink:0}}/>}
                  <span style={{flex:1,fontSize:12,fontWeight:500,color:activeCl?"var(--text)":"var(--dim)",letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeCl?.name||"Select…"}</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)",transition:"transform .15s",display:"inline-block",transform:sidebarCampaignOpen?"rotate(180deg)":"none"}}>▾</span>
                </button>
                {sidebarCampaignOpen&&(()=>{
                  const q=campFilter.trim().toLowerCase();
                  const shown=q?visibleCampaigns.filter(c=>(c.name||"").toLowerCase().includes(q)):visibleCampaigns;
                  return (
                  <div style={{position:"absolute",left:4,right:4,top:"100%",marginTop:4,zIndex:700,background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:10,overflow:"hidden",animation:"fadeUp .15s ease",boxShadow:"0 16px 48px rgba(0,0,0,0.55)"}}>
                    {visibleCampaigns.length>6&&(
                      <div style={{padding:6,borderBottom:"1px solid var(--border)"}}>
                        <input autoFocus value={campFilter} onChange={e=>setCampFilter(e.target.value)} placeholder="Filter campaigns…"
                          style={{width:"100%",boxSizing:"border-box",fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:12,padding:"6px 9px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--text)"}}/>
                      </div>
                    )}
                    <div style={{maxHeight:240,overflowY:"auto"}}>
                      {shown.length===0&&<div style={{padding:"12px",fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:12,color:"var(--dim)",textAlign:"center"}}>No matches</div>}
                      {shown.map((cl,i)=>{
                        const ia=currentCid===cl.id;
                        const bc=campaigns.filter(c=>c.campaignId===cl.id).length;
                        const cc=citations.filter(c=>c.campaignId===cl.id).length;
                        return (
                          <button key={cl.id} onClick={()=>{setCid(cl.id);pushHash(tab,cl.id);setSidebarCampaignOpen(false);}}
                            style={{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",width:"100%",background:ia?"color-mix(in srgb,var(--accent) 12%,transparent)":"transparent",border:"none",borderLeft:`3px solid ${ia?cl.color:"transparent"}`,borderBottom:i<shown.length-1?"1px solid var(--border)":"none",cursor:"pointer",transition:"background .1s",textAlign:"left"}}
                            onMouseEnter={e=>{if(!ia)e.currentTarget.style.background="var(--surface2)"}}
                            onMouseLeave={e=>{if(!ia)e.currentTarget.style.background="transparent"}}>
                            <div style={{width:7,height:7,borderRadius:"50%",background:cl.color,flexShrink:0,opacity:ia?1:0.5}}/>
                            <span style={{flex:1,fontSize:12,fontWeight:ia?600:400,color:ia?"var(--text)":"var(--muted)",letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.name}</span>
                            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:"var(--dim)"}}>{bc+cc}</span>
                          </button>
                        );
                      })}
                    </div>
                    {user.role==="admin"&&(
                      <button onClick={()=>{navigate("campaigns_mgmt");setSidebarCampaignOpen(false);}}
                        style={{display:"block",width:"100%",padding:"9px 10px",border:"none",borderTop:"1px solid var(--border)",background:"var(--surface2)",color:"var(--accent)",fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:11.5,fontWeight:600,cursor:"pointer",textAlign:"left"}}>
                        + Manage campaigns
                      </button>
                    )}
                  </div>);
                })()}
              </div>
            );
          })()}

          <div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:8,letterSpacing:"0.14em",color:"var(--dim)",textTransform:"uppercase",padding:"0 10px",marginBottom:10}}>Navigation</div>
          {TABS.map((t,idx)=>{
            const ia=tab===t.id;
            const isFirstAdmin = user.role==="admin" && t.id==="campaigns_mgmt";
            return (
              <React.Fragment key={t.id}>
                {isFirstAdmin&&<div style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:8,letterSpacing:"0.14em",color:"var(--dim)",textTransform:"uppercase",padding:"0 10px",marginTop:12,marginBottom:10}}>Admin</div>}
                <button onClick={()=>navigate(t.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",background:ia?"color-mix(in srgb,var(--accent) 14%,transparent)":"transparent",color:ia?"var(--text)":"var(--muted)",cursor:"pointer",fontWeight:ia?600:400,fontSize:13,textAlign:"left",width:"100%",transition:"all .15s",fontFamily:"'Hanken Grotesk',system-ui,sans-serif"}}
                  onMouseEnter={e=>{if(!ia){e.currentTarget.style.background="var(--border)";e.currentTarget.style.color="var(--text)";}}}
                  onMouseLeave={e=>{if(!ia){e.currentTarget.style.background="transparent";e.currentTarget.style.color="var(--muted)";}}}>
                  <span style={{color:ia?"var(--accent)":"var(--dim)",flexShrink:0}}>{t.icon}</span>
                  <span style={{flex:1}}>{t.label}</span>
                  {t.count!==""&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,padding:"1px 6px",borderRadius:100,background:ia?"color-mix(in srgb,var(--accent) 22%,transparent)":"var(--surface2)",color:ia?"var(--accent)":"var(--dim)"}}>{t.count}</span>}
                </button>
              </React.Fragment>
            );
          })}
          {effectiveClient&&(effectiveClient.sheetBounties||effectiveClient.sheetMedia)&&(
            <div style={{marginTop:"auto",padding:"0 4px",marginBottom:10}}>
              <DrillSync program={effectiveClient} drillCamps={scopedCampaigns} drillCites={scopedCitations} setCampaigns={setCampaigns} setCitations={setCitations} darkMode={theme==="dark"}/>
            </div>
          )}
          <div style={{marginTop:effectiveClient&&(effectiveClient.sheetBounties||effectiveClient.sheetMedia)?0:"auto",paddingTop:16,borderTop:"1px solid var(--border)"}}>
            {saving&&<div style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:"var(--dim)",padding:"0 12px",marginBottom:8}}><Icons.Spin/>SAVING…</div>}
            <div style={{padding:"8px 12px",borderRadius:8,background:"var(--surface2)",border:"1px solid var(--border)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:"var(--surface3)",border:"1px solid var(--border)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500,color:"var(--muted)",flexShrink:0}}>{initials(user.username)}</div>
                <span style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.username}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                <span style={{fontFamily:"'Hanken Grotesk',system-ui,sans-serif",fontSize:9,padding:"1px 6px",borderRadius:4,background:"var(--surface3)",border:"1px solid var(--border)",color:"var(--muted)",textTransform:"uppercase"}}>{rm.label}</span>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <button onClick={handleLogout} title="Sign out" style={{width:24,height:24,borderRadius:6,border:"1px solid var(--border)",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--dim)",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.color="var(--red)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--dim)"}}>
                    <Icons.Logout/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* MAIN CONTENT */}
        <main className="cq-main" style={{flex:1,padding:"32px 36px 80px",minWidth:0,overflowX:"hidden"}}>

        {/* NO CAMPAIGN SELECTED warning for data tabs */}
        {!effectiveCid && (tab==="performance"||tab==="weekly"||tab==="analytics"||tab==="campaign"||tab==="media"||tab==="authors"||tab==="mine") && programs.length>0 && (
          <div style={{textAlign:"center",padding:"60px 20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,animation:"fadeUp .5s ease .1s both"}}>
            <div style={{fontSize:15,fontWeight:500,color:"var(--muted)",marginBottom:6}}>Select a campaign in the sidebar to view data</div>
          </div>
        )}

        {/* CONTENT */}
        {(tab==="performance"||tab==="weekly"||tab==="analytics")&&(effectiveCid||user.role==="client")&&<AnalyticsTab key={effectiveCid} campaigns={scopedCampaigns} citations={scopedCitations} dataLoading={dataLoading} clientName={user.role==="admin"?effectiveClient?.name||"":user.clientName} color={effectiveClient?.color||"var(--accent)"} onExport={effectiveClient?(from,to)=>{setExportRange({from,to});setShowPdfModal(true);}:null} onShare={user.role==="admin"&&effectiveClient?handleShare:null} sheetUrl={(()=>{ if(user.role!=="admin"||!effectiveClient) return null; const u=effectiveClient.sheetBounties||effectiveClient.sheetMedia||""; const m=u.match(/\/spreadsheets\/d\/([A-Za-z0-9_-]+)/); const g=u.match(/gid=(\d+)/); return m?`https://docs.google.com/spreadsheets/d/${m[1]}/edit${g?`#gid=${g[1]}`:""}`:null; })()}/>}
        {(tab==="campaign")&&(effectiveCid||user.role==="client")&&<CampaignTable campaigns={scopedCampaigns} citations={scopedCitations} onSave={handleSaveCamp} onDelete={handleDeleteCamp} onDeleteAll={handleDeleteAllCamp} currentUser={user} readOnly={readOnly||(user.role==="author"&&!(user.allowedCampaigns||[]).includes(activeCid))} onBountySummaryUpdate={handleBountySummaryUpdate} onBountyImpressionsUpdate={handleBountyImpressionsUpdate} onBountyTgUpdate={handleBountyTgUpdate} onCitedBountyUpdate={handleCitedBountyUpdate}/>}
        {(tab==="media")&&(effectiveCid||user.role==="client")&&<MediaTable citations={scopedCitations} onSave={handleSaveMedia} onDelete={handleDeleteMedia} onDeleteAll={handleDeleteAllMedia} currentUser={user} readOnly={readOnly||(user.role==="author"&&!(user.allowedCampaigns||[]).includes(activeCid))} bounties={scopedCampaigns} onCitedBountyUpdate={handleCitedBountyUpdate}/>}
        {(tab==="authors")&&(effectiveCid||user.role==="client")&&<AuthorsTab key={effectiveCid} campaigns={scopedCampaigns} citations={scopedCitations}/>}
        {tab==="mine"&&user.role==="author"&&<MyCreationsTab myBounties={myBounties} myCitations={myCitations} onSaveCamp={handleSaveCamp} onDeleteCamp={handleDeleteCamp} onSaveMedia={handleSaveMedia} onDeleteMedia={handleDeleteMedia} currentUser={user} activeCid={activeCid} allBounties={scopedCampaigns} onCitedBountyUpdate={handleCitedBountyUpdate}/>}
        {tab==="author"&&authorView&&(effectiveCid||user.role==="client")&&<AuthorDetailTab key={authorView+"|"+effectiveCid} authorName={authorView} campaigns={scopedCampaigns} citations={scopedCitations} program={effectiveClient} onBack={()=>{ if(window.history.length>1) window.history.back(); else navigate("performance"); }}/>}
        {tab==="campaigns_mgmt"&&user.role==="admin"&&<CampaignsPanel programs={programs} campaigns={campaigns} citations={citations} onSave={handleSaveProgram} onDelete={handleDeleteProgram} onSaveCamp={(f,ex,cid)=>handleSaveCamp(f,ex,cid)} onDeleteCamp={handleDeleteCamp} onSaveMedia={(f,ex,cid)=>handleSaveMedia(f,ex,cid)} onDeleteMedia={handleDeleteMedia} currentUser={user} showToast={showToast} setCampaigns={setCampaigns} setCitations={setCitations} onSelectCampaign={(cid)=>navigate("performance",cid)}/>}
        {tab==="users"&&user.role==="admin"&&<UsersPanel users={users} campaigns={campaigns} citations={citations} campaignsList={programs} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} showToast={showToast} currentUser={user}/>}
        {/* cq_research merged into Content tab */}
        </main>
      </div>

      <footer className="cq-footer" style={{borderTop:"1px solid var(--border)",padding:"14px 36px",background:"var(--surface)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)"}}>CryptoQuant <span style={{color:"var(--accent)"}}>Bounty Tracker</span> · {APP_VERSION}</div>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:"var(--dim)"}}>
          {footerStats.campaigns} campaign{footerStats.campaigns!==1?"s":""} · {footerStats.bounties} bounties · {footerStats.citations} citations · <span style={{color:"var(--green)"}}>synced</span>
        </div>
      </footer>
    </>
  );
}
