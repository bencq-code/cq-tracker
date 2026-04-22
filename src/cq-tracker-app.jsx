import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { ComposedChart, AreaChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { db, supabase } from "./db.js";

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
const AUTHOR_PALETTE = [
  {bg:"rgba(26,58,92,0.08)",  color:"#1a3a5c"}, // navy
  {bg:"rgba(15,76,76,0.08)",  color:"#0f4c4c"}, // teal
  {bg:"rgba(76,29,80,0.08)",  color:"#4c1d50"}, // plum
  {bg:"rgba(86,62,20,0.08)",  color:"#563e14"}, // olive
  {bg:"rgba(42,52,72,0.08)",  color:"#2a3448"}, // slate
  {bg:"rgba(107,45,20,0.08)", color:"#6b2d14"}, // rust
  {bg:"rgba(32,67,88,0.08)",  color:"#204358"}, // steel
  {bg:"rgba(55,48,92,0.08)",  color:"#37305c"}, // indigo
];
const CLIENT_PALETTE = [
  {bg:"rgba(26,58,92,0.08)", border:"rgba(26,58,92,0.22)",  color:"#1a3a5c"},
  {bg:"rgba(15,76,76,0.08)", border:"rgba(15,76,76,0.22)",  color:"#0f4c4c"},
  {bg:"rgba(76,29,80,0.08)", border:"rgba(76,29,80,0.22)",  color:"#4c1d50"},
  {bg:"rgba(86,62,20,0.08)", border:"rgba(86,62,20,0.22)",  color:"#563e14"},
  {bg:"rgba(42,52,72,0.08)", border:"rgba(42,52,72,0.22)",  color:"#2a3448"},
  {bg:"rgba(107,45,20,0.08)",border:"rgba(107,45,20,0.22)", color:"#6b2d14"},
];
// Tier colors are resolved via CSS variables so dark mode can shift them.
const TIER_COLORS = {
  "Tier 1":{bg:"var(--tier-1-bg)",border:"var(--tier-1-border)",color:"var(--tier-1)"},
  "Tier 2":{bg:"var(--tier-2-bg)",border:"var(--tier-2-border)",color:"var(--tier-2)"},
  "Tier 3":{bg:"var(--tier-3-bg)",border:"var(--tier-3-border)",color:"var(--tier-3)"},
  "Tier 4":{bg:"var(--tier-4-bg)",border:"var(--tier-4-border)",color:"var(--tier-4)"},
};
const ROLE_META = {
  admin:  {label:"Admin",  color:"#1a3a5c", bg:"rgba(26,58,92,0.08)",  border:"rgba(26,58,92,0.2)"},
  author: {label:"Author", color:"#1a3a5c", bg:"rgba(26,58,92,0.06)", border:"rgba(26,58,92,0.2)"},
  client: {label:"Client", color:"#1a3a5c", bg:"rgba(26,58,92,0.06)", border:"rgba(26,58,92,0.2)"},
};

const colorMaps = {};
let colorIdxs = {};
const getPaletteColor = (palette, ns, key) => {
  const k = `${ns}:${key}`;
  if (!colorMaps[k]) { colorIdxs[ns] = (colorIdxs[ns]||0); colorMaps[k] = palette[colorIdxs[ns]++ % palette.length]; }
  return colorMaps[k];
};
const getAuthorColor = n => getPaletteColor(AUTHOR_PALETTE,"author",n||"?");
const getClientColor = n => getPaletteColor(CLIENT_PALETTE,"client",n||"?");
const getTierColor = t => {
  const fallback = {bg:"var(--tier-default-bg)",border:"var(--tier-default-border)",color:"var(--tier-default)"};
  if(!t) return fallback;
  const key = t.toString().trim();
  return TIER_COLORS[key] || TIER_COLORS[`Tier ${key}`] || fallback;
};

const initials = (n="") => { const p=n.trim().split(/\s+/); return p.length>=2?(p[0][0]+p[1][0]).toUpperCase():n.slice(0,2).toUpperCase(); };
const fmtDate  = iso => { if(!iso)return"—"; const [y,m,d]=iso.split("-"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${+d}, ${y}`; };
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const normKey   = s => (s||"").trim().toLowerCase();

// ── Shared page header ──
const PageHeader = ({label, title, children}) => (
  <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,gap:16,flexWrap:"wrap"}}>
    <div>
      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
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
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes rowIn   { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
@keyframes modalIn { from{opacity:0;transform:scale(0.97) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
@keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
* { margin:0; padding:0; box-sizing:border-box; }
:root {
  --bg:#f8f9fb;
  --surface:#ffffff;
  --surface2:#f4f6fa;
  --surface3:#edf0f6;
  --border:#e4e8ef;
  --border2:#c8d0de;
  --text:#0f1923;
  --muted:#384252;
  --dim:#6b7685;
  --accent:#1a3a5c;
  --accent-light:#edf2f8;
  --purple:#5b21b6;
  --green:#166534;
  --red:#b91c1c;
  --yellow:#92400e;
  --orange:#c2410c;
  --positive:#166534;
  --negative:#b91c1c;
  --tag:#1a3a5c;
  --row-tint:rgba(26,58,92,0.03);
  --row-tint-strong:rgba(26,58,92,0.05);
  --row-tint-weak:rgba(26,58,92,0.015);
  --accent-glow:rgba(26,58,92,0.1);
  --shadow-sm:0 1px 3px rgba(0,0,0,0.05);
  --shadow-md:0 2px 8px rgba(0,0,0,0.08);
  --shadow-lg:0 8px 24px rgba(0,0,0,0.1);
  --input-shadow:inset 0 1px 3px rgba(0,0,0,0.04);
  /* Tier colors — cohesive cool palette */
  --tier-1:#166534; --tier-1-bg:rgba(22,101,52,0.08);  --tier-1-border:rgba(22,101,52,0.22);
  --tier-2:#1a3a5c; --tier-2-bg:rgba(26,58,92,0.08);   --tier-2-border:rgba(26,58,92,0.22);
  --tier-3:#6b7685; --tier-3-bg:rgba(107,118,133,0.08);--tier-3-border:rgba(107,118,133,0.22);
  --tier-4:#7a5a1e; --tier-4-bg:rgba(122,90,30,0.08);  --tier-4-border:rgba(122,90,30,0.22);
  --tier-default:#6b849e; --tier-default-bg:rgba(107,132,158,0.06); --tier-default-border:rgba(107,132,158,0.18);
  /* Categorical chart colors — stay cool/cohesive */
  --chart-1:#1a3a5c; --chart-2:#4a7fa8; --chart-3:#0f4c4c; --chart-4:#4c1d50; --chart-5:#563e14; --chart-6:#6b2d14;
  /* Modal size tokens */
  --modal-sm:380px; --modal-md:480px; --modal-lg:680px;
  /* Radius scale */
  --r-sm:6px; --r-md:8px; --r-lg:12px; --r-xl:16px;
}
[data-theme="dark"] {
  --bg:#0b1420;
  --surface:#111d2d;
  --surface2:#162637;
  --surface3:#1c2f44;
  --border:#1f3347;
  --border2:#2b4662;
  --text:#e8eef6;
  --muted:#a8b4c4;
  --dim:#6b7a8e;
  --accent:#6ea8e0;
  --accent-light:#18273b;
  --positive:#4ade80;
  --negative:#f87171;
  --green:#4ade80;
  --red:#f87171;
  --yellow:#fbbf24;
  --orange:#fb923c;
  --purple:#a78bfa;
  --tag:#6ea8e0;
  --row-tint:rgba(110,168,224,0.06);
  --row-tint-strong:rgba(110,168,224,0.1);
  --row-tint-weak:rgba(110,168,224,0.03);
  --accent-glow:rgba(110,168,224,0.18);
  --shadow-sm:0 1px 3px rgba(0,0,0,0.3);
  --shadow-md:0 2px 8px rgba(0,0,0,0.4);
  --shadow-lg:0 8px 24px rgba(0,0,0,0.5);
  --input-shadow:inset 0 1px 3px rgba(0,0,0,0.2);
  /* Tier colors retuned for dark mode */
  --tier-1:#4ade80; --tier-1-bg:rgba(74,222,128,0.10);  --tier-1-border:rgba(74,222,128,0.28);
  --tier-2:#6ea8e0; --tier-2-bg:rgba(110,168,224,0.10); --tier-2-border:rgba(110,168,224,0.28);
  --tier-3:#a8b4c4; --tier-3-bg:rgba(168,180,196,0.08); --tier-3-border:rgba(168,180,196,0.22);
  --tier-4:#fbbf24; --tier-4-bg:rgba(251,191,36,0.10);  --tier-4-border:rgba(251,191,36,0.28);
  --tier-default:#6b7a8e; --tier-default-bg:rgba(107,122,142,0.08); --tier-default-border:rgba(107,122,142,0.22);
  color-scheme:dark;
}
body { background:var(--bg); color:var(--text); font-family:'Plus Jakarta Sans','Inter',sans-serif; min-height:100vh; font-size:14px; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; letter-spacing:-0.01em; }
.tabular { font-variant-numeric: tabular-nums; }
::-webkit-scrollbar{width:4px;height:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:99px} ::-webkit-scrollbar-thumb:hover{background:var(--dim)}
input,select,textarea { color-scheme:light; }
[data-theme="dark"] input,[data-theme="dark"] select,[data-theme="dark"] textarea { color-scheme:dark; }
input[type=date]::-webkit-calendar-picker-indicator{cursor:pointer;opacity:0.5}
[data-theme="dark"] input[type=date]::-webkit-calendar-picker-indicator{filter:invert(1);opacity:0.6}
a { color:var(--accent); }
button { font-family:'Plus Jakarta Sans','Inter',sans-serif; letter-spacing:-0.01em; }
input:focus,textarea:focus,select:focus { border-color:var(--accent) !important; outline:3px solid var(--accent-glow) !important; outline-offset:0 !important; }
tr:hover td { background:var(--row-tint-strong) !important; transition:background .12s; }
.row-hover:hover { background:var(--row-tint-strong) !important; }
tbody tr:nth-child(even) td { background:var(--row-tint-weak); }
tbody tr:nth-child(even):hover td { background:var(--row-tint-strong) !important; }
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
const iStyle = {background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:"10px 13px",outline:"none",width:"100%",boxShadow:"inset 0 1px 3px rgba(0,0,0,0.04)",transition:"border-color .15s,box-shadow .15s",lineHeight:"1.4"};
const lStyle = {fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase"};
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
};

// Shared UI
const Toast = ({msg,type}) => (
  <div style={{position:"fixed",bottom:28,right:28,zIndex:500,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"10px 20px",borderRadius:10,background:"var(--surface)",border:`1px solid ${type==="error"?"rgba(185,28,28,0.25)":"rgba(22,101,52,0.25)"}`,color:type==="error"?"var(--negative)":"var(--positive)",boxShadow:"0 2px 8px rgba(0,0,0,0.08),0 8px 24px rgba(0,0,0,0.1)",letterSpacing:"0.04em",animation:"fadeUp .3s ease",display:"flex",alignItems:"center",gap:8}}>
    <span style={{fontSize:14}}>{type==="error"?"✕":"✓"}</span>{msg}
  </div>
);

const ConfirmDelete = ({onConfirm,onCancel}) => (
  <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.6)",backdropFilter:"blur(8px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:14,padding:28,boxShadow:"0 24px 64px rgba(0,0,0,0.2)",width:"min(var(--modal-sm),100%)",animation:"modalIn .2s ease"}}>
      <div style={{width:36,height:36,borderRadius:9,background:"rgba(185,28,28,0.08)",border:"1px solid rgba(185,28,28,0.18)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,fontSize:16}}>⚠</div>
      <div style={{fontSize:16,fontWeight:600,color:"var(--text)",marginBottom:6,letterSpacing:"-0.01em"}}>Delete this entry?</div>
      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--muted)",marginBottom:24,lineHeight:1.6}}>This action is permanent and cannot be undone.</div>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 20px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer",letterSpacing:"0.04em"}}>CANCEL</button>
        <button onClick={onConfirm} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 20px",borderRadius:8,border:"none",background:"var(--red)",color:"#fff",cursor:"pointer",fontWeight:600,letterSpacing:"0.04em"}}>DELETE</button>
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

const StatCard = ({label,value,sub,c}) => (
  <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderLeft:`3px solid ${c}`,borderRadius:"var(--r-lg)",padding:"16px 20px",position:"relative",boxShadow:"var(--shadow-sm)"}}>
    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase",marginBottom:8}}>{label}</div>
    <div className="tabular" style={{fontSize:28,fontWeight:700,letterSpacing:"-0.03em",color:"var(--text)",lineHeight:1}}>{value}</div>
    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sub}</div>
  </div>
);

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

  return (
    <div className="cq-login-wrap" style={{minHeight:"100vh",display:"flex",fontFamily:"'Plus Jakarta Sans','Inter',sans-serif"}}>

      {/* LEFT PANEL */}
      <div className="cq-login-left" style={{width:"42%",background:"#0d1f33",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"48px 56px",position:"relative",overflow:"hidden",flexShrink:0}}>
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none"}}/>
        <div style={{position:"relative",zIndex:1}}>
          <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAGQAZADASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAcJBggDBAUCAf/EAEcQAAEEAQMBBQQGBQgJBQAAAAABAgMEBQYHESEIEjFBURM3YXEiMlJ1gbMJFEJykRUXI1dic6GiJDNDU4OSlbLSJbHBwuH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A0yAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAc1SrZtypDVrzWJF8GRMVyr+CGQVNvdfW2d+pofU1hvrFip3J/g0DGQc9+nbx92ajfqz1LUD1jmgnjVkkbk6K1zV6oqeinAAAAAAAAAAAAAAAAd7GYfLZR3dxmLvXV544r13Sf9qKe5FttuLKxHxaB1U9q+Dm4ewqf9gGKgye1t5r+qxX2tDangYicq6TEztRE/Fpj9ypapTLDcrTVpU8WSxqx38FA4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPV0pp3OaqzkGE05i7WTyNheI4IGd53xVfJrU83LwieageUZdtxtprncO66tpDTtvIoxeJZ0RI4Iv3pXKjEX4c8r5Ipt1sd2PsLiYocxubMzMX1RHNxcD1bWhX0e9OFlXw6Jw3xT6SdTajG0aWMoQ4/G069OpAxGQwQRoyONqeTWp0RANO9vOxNzHHZ1/qxWuXq6nh2eHzmkTx9URn4+ZPGkOzxs7pljP1XROPvTNTrNkkW25y+vEnLUX5IhKgA62Nx2PxtdK+Oo1acKf7OvE2Nv8GoiHZAAqn7R/v61x992fzFI/JA7R/v61x992fzFI/AAAAAAABnWz+1Gs90s1+oaYxyurxORLV+fllasi/bdx1X0a3ly+nHKgYKSxtX2e9z9wmx2sdg3YzGP4VMhk+YInIvmxFRXPT4taqfE3P2S7M+gtu0r5K9Amo9QRojluXY0WKJ/rFF1RvwVe870VCcQNV9A9i3RuOjZPrLP5HO2eEV0FVEq10XzTze75o5vyJt0rs5tbphrP5G0Jg4ZGfVmlrJPKn/ABJO87/EzsAfMUccUbY4o2xsanDWtThE/A+gAB18hQo5GutfIU69uFfGOeJr2r+CpwdgARdrDs+bP6obIt3RGOpzP6+2xyLUci+vEao1V+aKQPuH2Jo1bLZ0DqxzXdVbSy7OUXr4JNGnTp6sX5m5IAqZ3I2w13t3ZSLVunLdCJ7lbFZ4SSvKv9mRvLVXz45548UMNLkMlRpZKjNQyNOvcqTt7k0FiNJI5G+jmuRUVPgpq7vn2QcDm4p8xtrJFg8kiK9cZK5y1Z180Y5eViXx4Tq3wThqdUDREHrau01ntJZ6xgtS4q1i8jXXiSCdnC8eTkXwc1eOjkVUXyVTyQAAAAAAAAAAAAAAAAAAAAAAAAABnex22Oc3W1xBp3Ef0EDU9reuuYqsqwovVy+rl8Gt819E5VA+9kdqdTbsapTD4GJIa0PD71+Vq+xqsVfFfVy9eGp1XhfBEVUsf2b2p0jtXp9Mbpyki2ZGp+uZCZEWxacnm53k3nwanRPnyq+ptjoXTu3Wka2mtNU0gqwp3pJHcLJYkVPpSSO/acvHyROEThERDJwAAAAAAAAKp+0f7+tcffdn8xSPyQO0f7+tcffdn8xSPwAAAAGwvZF2Cl3Myiao1LG+LSVGbuqzlWuyErevs2r5MTp3nJ+6nXlWhxdl/s55Tc6aPUeolnxekon9Ho3iW+qL1bFz4M8UWTr16JyvKtsF0vp/C6XwVbB6fxtfHY6q3uwwQN4a34+qqviqryqr1U7tGrWo04aVKvFWrQRtjhhiYjWRsanCNaidERE6cIcwAAAAAAAAAAAAAAAAGD7x7W6U3S027E6jpJ7ZjXfqd6NESeo9f2mL5p0Tlq9F4+SpXBvntNqXabVTsTmY1sUZlc7H5GNipFaYnp9l6cp3mqvKfFFRVtXMd3G0ZgNfaSuaZ1JTbZpWWcI5ET2kL/2ZI1VF7r08l/BeUVUAqJBn2+m12c2o1tLgMt/T1ZUWXH3mt4Zah54R3wcng5vkvqioq4CAAAAAAAAAAAAAAAAAAAAAAd/T2HyWoM7SwmIqyW8henbBXhYnV73LwifBPj4InUtG7P8Atdi9qNAV8BT7k+Qm4nydxE62J1Trx6Nb9Vqeic+Kqq6/fo+NqmxVJ908zV5lm79bCo9PqtRVbLMnxVeWJ8n+puIAAAAAAAAAAAFU/aP9/WuPvuz+YpH5IHaP9/WuPvuz+YpH4AA/WornI1qKqqvCInmBIvZ52vyG6+4tXAQe0hxsKfrGUttT/UQIvXj+25eGtTr1XnjhFLQ9OYbGaewNHB4apHUx9GBsFeFngxjU4T5r6qvVV5VSM+yptdFthtbVqWoGszuTRtzKvVv0myK36MKr6RovHHh3leqeJLYAAAAAAAAAAAAAAAAAAAAABgG/O2OJ3W0DZ09f7kFxnM2OuK3l1adE6L8Wr4OTzRfVEVKuNT4PJ6a1DfwGZquq5ChO6CxE79lzV46L5ovii+CoqKXDGoP6QfatLeNr7pYeunt6iMq5hrU6viVUSKb5tVe4q+jm+TQNJQAAAAAAAAAAAAAAAAAAPc0Dpq9rHWuH0vjW82snbZXYvkxFX6T1+DW8uX4Ip4ZtP+jo0emT3DzGsrEfMOFqJBXVf9/PynKfKNr0X99AN4NL4WhpzTmOwGLhbDSx9aOtAxE8GsaiJ+PTlV81PRAAAAAAAAAAAACqftH+/rXH33Z/MUj8kDtH+/rXH33Z/MUj8ATp2Jdvma43mrXr9dZcVp9iZCxynLXyovELF+bvpceaRqnmQWWKdgjRyac2SZnJ4e5d1FZdbc5WojvYsVY4m/Lo96f3gGwgAAAAAAAAAAAAAAAAAAAAAAAB0dQ4ihn8FfwmUgbYo36769iNf2mParVT+CneAFQ+4+lruidd5nSmQ62MZbfB3v8AeN8WPT4OarXfiY+bX/pG9HpQ1rgta1ouIsrWdUtORP8AbQ8K1V+KsciJ/dmqAAAAAAAAAAAAAAAAAAsb7BWnW4Xs/wBPIOj7s2auz3XKvirUd7Jv4cRcp+98SuQtl2MxiYbZnRuN7qNdDhKntERP21ia53+ZVAzMAAAAAAAAAAAABVP2j/f1rj77s/mKR+SB2j/f1rj77s/mKR+By1YJrVqKrXjWSaZ6RxsTxc5V4RP4lvui8JBprSGH09WRqQ4yjDUZ3fBUjYjefx45Ktuz/i25ne7RmOkb345MzWfI3jnljJEe5P4NUtfAAAAAAAAAAAAAAAAAAAAAAAAAAACCe3Xp5uc7PWTtozvTYa1Bfj4Tr9b2T/8AJK5fwK3S23eLFJm9ptW4lW95bWGtRsT+0sTu6v4LwpUkAAAAAAAAAAAAAAAAALitPwJWwOPrI3uJFViYjfThiJwU6lxWn7CW8Dj7SLyk1WKRF+bEUDvAAAAAAAAAAAAAKp+0f7+tcffdn8xSPyQO0f7+tcffdn8xSPwJe7GsCWO0ro+NW97iaw/j92tK7/4LOisXsaTJB2ltHvc7uos1hnP71aVvH488FnQAAAAAAAAAAAAAAAAAAAAAAAAAAAcN6BLNKes5EVJY3MVF8F5TgptLkr07atKey76sMbpF+SJyU2gAAAAAAAAAAAAAAAAC2bY3KNzOzWjckj+86bC1faL/AG0ia1/+ZFKmSxzsF6hTNdn6lQc9HS4a7YpO69e6rvat5/CXhP3QJ8AAAAAAAAAAAAAVT9o/39a4++7P5ikfkgdo/wB/WuPvuz+YpH4Gddn7Jph98NF33ORrGZqsyRyrxwx8iMcv8HKWvFNlSxLUtw2oHqyaGRskbk8nIvKL/FC37R2ag1JpLEahqq32OTow22ceCJIxHcfhyB6oAAAAAAAAAAAAAAAAAAAAAAAAAAxXeDJtwu1Grcqr+4tXDW5Gqnj3khd3U/FeEKkSyLt16hbg+z1k6jX9ybMWoKEfr1f7R3+SJyfiVugAAAAAAAAAAAAAAAADar9HNrBmN19mtGWZkbHmarbFVrl8Z4OVVqfFY3OVfhGaqnu7famvaM1vh9VY7rZxltlhreeEkRF+kxV9HN5avwVQLewedpfNY/UmnMdn8VMk1HI1o7MD/Vj2oqc+i9eFTyXk9EAAAAAAAAAAAKp+0f7+tcffdn8xSPyQO0f7+tcffdn8xSPwBYr2CdYJqPZCPCTy965p60+o5FXlywuX2kTvl9JzE/uyuonfsP6+Zoveetjr06RYzULEx8yuX6LZlXmF3/P9D5SKBZCAAAAAAAAAAB8TxMngkhk73ckarXd1ytXhU4XhU6p80PsAaF9qnRu7G1uVfnMHr7Wd3SFuXiKVczZc+k9V6RSr3/D7L/PwXr4wR/ObuT/WDqz/AKzY/wDMtgzOMx+ZxVrFZWnDdo24lingmYjmSMVOFRUUrq7VOwGQ2tyr85g2TXdIW5eIpV5c+k9V6RSr6fZf5+C9fEI0/nN3J/rB1Z/1mx/5j+c3cn+sHVn/AFmx/wCZiQAy5m5+5THo9u4WrOWryn/rFhf/ALm8nZO7QtTcihFpfVE0NXV1eP6LujWZFjU6vYngkiJ1cxP3k6co2u058fct46/BfoWZqtuvI2WGaJ6tfG9q8o5qp1RUXzAuRBrz2Tu0LU3IoRaX1RNDV1dXj+i7o1mRY1Or2J4JIidXMT95OnKN2GAAHR1Dl6GAwV/N5SdtejQrvsWJF/ZYxquVf4IBpL+kb1gl/WmC0TWm5ixVZ1y01q9PbTdGoqerWN5T4SGp5kO5Gqrut9eZrVmQRWz5O2+fud5Xezaq8MYir5NajWp8EQx4AAAAAAAAAAAAAAAAAAAN1v0e+6bJ6NjazMWeJoO/awqvX67F5dNCnxReXonor/Q3CKd9N5nJadz9HO4e0+pkKE7Z68zF6te1eU+aeSp4KnKKWkbB7n4rdbQFbUFFY4b0aJDkqaO61p0Tqnr3F8Wr5p8UXgJAAAAAAAAAAAFU/aP9/WuPvuz+YpH5IHaP9/WuPvuz+YpH4A+o3vjkbJG5zHtVFa5q8Kip5ofIAtB7LO6MW6O11XIWZmLnMdxUysaL19oifRl49Ht+l6c95P2SVyq/s7bpX9p9xK2diSSfFzolfKVWr/roFXqqJ4d9q/Sb8U454VS0LT+XxufwlPNYe5Fcx92Fs1eeNeWvY5OUX/8APFF6KB3gAAAAAAAAAAOpmcZj8zirWKytOG7RtxLFPBMxHMkYqcKiop2wBW/2qdgMhtblX5zBsmu6Qty8RSry59J6r0ilX0+y/wA/BevjA5cbmcZj8zirWKytOG7RtxLFPBMxHMkYqcKiopXV2qdgchtZlXZzBsmu6Qty8RSry59J6r0ilX0+y/z8F6+IQOAAOfH3LeOvwX6FmarbryNlhmierXxvavKOaqdUVF8ywvsndoWpuRQi0vqiaGrq6vH9F3RrMixqdXsTwSRE6uYn7ydOUbXac+PuW8dfgv0LM1W3XkbLDNE9Wvje1eUc1U6oqL5gXImoX6QjdJtTF1trsPa/0m33LWYVjvqRIvMUK/Fyoj1Tx4a3ycfe3XbBxybTZGXV0Pf1ljK6NqxsYqR5R6/RY/p0YqLwr06dOVbz9VNM9U53Kam1Ffz+atOtZG/M6axK79py+ieSJ4InkiIgHmgAAAAAAAAAAAAAAAAAAAABnuxm6Gc2o1vFqDEf09eREhv0nu4Zah55Vvwcni13kvqiqi4EALdNttb6d3C0lV1Npm6lmnOnDmr0kgkT60cjf2XJz4fJU5RUVckKqNjt2dTbTaoTLYST9YpTKjb+OleqRWmJ6/ZcnK8OROU+KKqLY/s5ulpPdPTjctpu4nt42tS5RlXieo9U+q5PNPHhydF4+aIGcAAAAAAAAqn7R/v61x992fzFI/JA7R/v61x992fzFI/AAAAbFdkDf2XbrKR6S1RZc/SVyVVZK7lVx0rvF6efs1X6zfJfpJ15R2uoAuUrTwWq0VmtNHPBKxHxyRuRzXtVOUcip0VFTrychXX2Xu0flNtZotN6odaymk3uRI0R3elx6qvV0fPiz1Z+LeF5R1gems7h9S4Stm8Dka+Rx1pnfhsQP7zXJ4L8lReUVF6oqKigeiAAAAAAAAAAB1MzjMfmcVaxWVpw3aNuJYp4JmI5kjFThUVFO2AK3+1TsBkNrcq/OYNk13SFuXiKVeXPpPVekUq+n2X+fgvXxgcuNzOMx+ZxVrFZWnDdo24lingmYjmSMVOFRUUrq7VOwGQ2tyr85g2TXdIW5eIpV5c+k9V6RSr6fZf5+C9fEIHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD1tI6lz2ks9XzumsraxeRrrzHPA/hePNqp4OavHVqoqL5op5IA3u2M7X2BzcUGH3KjiweSREYmTha5as6+SvanKxL4cr1b4ry1OibRY29SyVGG/jrle5Unb34p68iSRyN9WuTlFT4oU3mZ7abo6726tum0lqG1RievMtVVSSvIvq6N3Lefjxz8QLZQab7fdtqFzY6+vNJPY7ojrmIfyi+qrFIvKJ8nr8iedIb/7QaoYz9R1xjKsrunscg9aj0X0/pe6ir8lUCTwcFG5UvVm2aNqC1A76skMiPavyVOhzgVT9o/39a4++7P5ikfkgdo/39a4++7P5ikfgAAAAAAz7ZvdvWW1eYdc01eRaszkW1j7HL69jj7TeU4dx+0iov4dDAQBZZsp2ldv9xmwY+zabp3PvREWhekRGSO9IpejX/BF7rl+z05JsKZyXNrO0Tuht+yKpSza5bFxqiJQyiLPG1qJx3WO5R7E9Ea5E+AFngNXdA9tDQ+TZHBrDC5LT9lU+lNAn61X+fKcSJ8kYvzJs0ru1tnqhsf8AIeucFZkk+rA622KZf+G/h/8AgBmwPxjmvYj2ORzXJyiovKKh+gADht2q1OB09uxDXhb9aSV6Nan4r0A5gRprDfnaPSzXpktc4qaZnPMFGRbcnP2VSJHd1fnwQTuH22aETJK2gdKTWZPBtzLP7jE+KRRqquRfi9vyA27vW6lCnLcvWYataFqvlmmkRjGNTxVzl6InxU1U7Rvao0dDhcjpHRtGpqua3C6vYs2Y+9QYi9FREXrMvy4b4Lyvgan7m7r6+3HnR+rNRWbldru9HTZxFXj9OI28NVU+0vLviYQB+r1Xnjj4H4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHYoXrtCb21G5Yqy/bhkVjv4opklTczceo3u1NwNWV0444izFhv/s/4GJgDsZK9dyV+fIZG5Yu3LD1knsWJFkklevVXOc7lVVfVTrgAAAAAAAAAAAAAAHpYnPZ3EcfyTmslQ4XlP1a0+Lj/AJVQ96HdPc6BiRw7jawjYng1mbson+DzDwBllvczce41WW9wNWWGqnCpLmLDk/xeY7kMjkMjN7bIXrVyX7c8rpHfxVTqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//9k=" alt="CryptoQuant" style={{width:52,height:52,objectFit:"contain",mixBlendMode:"screen",marginBottom:32}}/>
          <div style={{fontSize:11,fontFamily:"'IBM Plex Mono',monospace",letterSpacing:"0.12em",color:"rgba(255,255,255,0.4)",textTransform:"uppercase",marginBottom:12}}>CryptoQuant</div>
          <div style={{fontSize:28,fontWeight:600,color:"#ffffff",lineHeight:1.25,letterSpacing:"-0.02em",marginBottom:16}}>Campaign<br/>Intelligence</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,0.45)",lineHeight:1.6,maxWidth:280}}>Analytics suite for managing bounty programs, media citations, and campaign performance.</div>
        </div>
        <div style={{position:"relative",zIndex:1}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.25)",letterSpacing:"0.06em"}}>AUTHORIZED PERSONNEL ONLY</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="cq-login-right" style={{flex:1,background:"#f5f6f9",display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 32px"}}>
        <div style={{width:"min(var(--modal-sm),100%)",animation:"fadeUp .5s ease both"}}>

          <div style={{marginBottom:32}}>
            <div style={{fontSize:22,fontWeight:700,color:"var(--text)",letterSpacing:"-0.02em",marginBottom:6}}>{isRegister?"Create Account":"Sign In"}</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>{isRegister?"Fill in your details to create an account.":"Enter your credentials to continue."}</div>
          </div>

          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:28,boxShadow:"0 1px 3px rgba(0,0,0,0.06),0 8px 24px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <Field label="Username">
                <div style={{position:"relative"}}>
                  <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--dim)"}}><Icons.User/></div>
                  <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username"
                    onKeyDown={e=>e.key==="Enter"&&(!isRegister?handleLogin():handleRegister())}
                    style={{...iStyle,paddingLeft:38}}/>
                </div>
              </Field>

              {isRegister && (
                <Field label="Display Name (optional)">
                  <input value={displayName} onChange={e=>setDN(e.target.value)} placeholder="Your full name" style={iStyle}/>
                </Field>
              )}

              {isRegister && (
                <Field label="Account Type">
                  <div style={{display:"flex",gap:6}}>
                    {[{id:"author",label:"Author",desc:"Submit bounties",color:"#1a3a5c"},{id:"admin",label:"Admin",desc:"Full access",color:"#7c3aed"},{id:"client",label:"Client",desc:"Read-only",color:"#0f766e"}].map(role=>{
                      const active = regRole===role.id;
                      return (
                        <button key={role.id} onClick={()=>setRegRole(role.id)}
                          style={{flex:1,padding:"8px 6px",borderRadius:7,border:`1px solid ${active?role.color+"60":"var(--border)"}`,background:active?role.color+"0d":"transparent",cursor:"pointer",textAlign:"center",transition:"all .15s"}}>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:500,color:active?role.color:"var(--muted)",marginBottom:2}}>{role.label}</div>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>{role.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </Field>
              )}

              {isRegister && regRole === "client" && (
                <Field label="Company / Client Name">
                  <input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="e.g. Binance" style={iStyle}/>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:4}}>Must match the client tag used in campaign entries.</div>
                </Field>
              )}

              <Field label="Password">
                <div style={{position:"relative"}}>
                  <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--dim)"}}><Icons.Lock/></div>
                  <input type={showPass?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)}
                    placeholder={isRegister?"Min. 6 characters":"Enter your password"}
                    onKeyDown={e=>e.key==="Enter"&&(!isRegister?handleLogin():handleRegister())}
                    style={{...iStyle,paddingLeft:38,paddingRight:40}}/>
                  <button onClick={()=>setShowPass(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"transparent",border:"none",cursor:"pointer",color:showPass?"var(--accent)":"var(--dim)"}}>
                    <Icons.Eye/>
                  </button>
                </div>
              </Field>

              {isRegister && (
                <Field label="Confirm Password">
                  <div style={{position:"relative"}}>
                    <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--dim)"}}><Icons.Lock/></div>
                    <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Re-enter your password"
                      onKeyDown={e=>e.key==="Enter"&&handleRegister()}
                      style={{...iStyle,paddingLeft:38,...(confirm&&confirm!==password?{borderColor:"rgba(220,38,38,0.5)"}:{})}}/>
                  </div>
                  {confirm && confirm!==password && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--red)",marginTop:4}}>Passwords don't match</div>}
                </Field>
              )}
            </div>

            {error   && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--red)",  marginTop:14,padding:"8px 12px",background:"rgba(220,38,38,0.06)",border:"1px solid rgba(220,38,38,0.2)",borderRadius:7}}>{error}</div>}
            {success && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--green)",marginTop:14,padding:"8px 12px",background:"rgba(22,163,74,0.06)",border:"1px solid rgba(22,163,74,0.2)",borderRadius:7}}>{success}</div>}

            <button onClick={isRegister?handleRegister:handleLogin} disabled={loading}
              style={{width:"100%",marginTop:20,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:"13px",borderRadius:8,border:"none",background:"#0d1f33",color:"#fff",cursor:"pointer",letterSpacing:"0.06em",fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s",opacity:loading?0.7:1}}
              onMouseEnter={e=>e.currentTarget.style.background="#1a3a5c"}
              onMouseLeave={e=>e.currentTarget.style.background="#0d1f33"}>
              {loading?<><Icons.Spin/>{isRegister?"CREATING…":"SIGNING IN…"}</>:isRegister?"CREATE ACCOUNT →":"SIGN IN →"}
            </button>
          </div>

          <div style={{textAlign:"center",marginTop:20}}>
            {!isRegister ? (
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>
                Need an account?{" "}
                <button onClick={()=>switchMode("register")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,textDecoration:"underline"}}>Request access</button>
              </span>
            ) : (
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>
                Already have an account?{" "}
                <button onClick={()=>switchMode("signin")} style={{background:"none",border:"none",cursor:"pointer",color:"var(--accent)",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,textDecoration:"underline"}}>Sign in</button>
              </span>
            )}
          </div>

        </div>
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
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:20,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",width:"min(var(--modal-md),100%)",maxHeight:"90vh",overflowY:"auto",padding:32,position:"relative",animation:"modalIn .25s ease"}}>
        <button onClick={onClose} style={{position:"absolute",top:18,right:18,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.1em",color:"var(--purple)",textTransform:"uppercase",marginBottom:6}}>// {isEdit?"edit":"new"} user</div>
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
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase",marginBottom:10}}>
              Bounty Access
              {form.role==="author" && <span style={{marginLeft:8,color:"var(--muted)",textTransform:"none",fontSize:9,letterSpacing:0}}>— which campaigns this author can post to</span>}
            </div>
            {!campaignsList.length ? (
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)",padding:"12px",background:"var(--surface2)",borderRadius:8,border:"1px solid var(--border)"}}>
                No campaigns created yet. Create campaigns first, then assign access here.
              </div>
            ) : (
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {campaignsList.map(cl=>{
                  const allowed = (form.allowedCampaigns||[]).includes(cl.id);
                  return (
                    <button key={cl.id} onClick={()=>toggleCampaign(cl.id)}
                      style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",borderRadius:10,border:`1px solid ${allowed?cl.color+"60":"var(--border)"}`,background:allowed?cl.color+"0e":"var(--surface2)",cursor:"pointer",transition:"all .15s",textAlign:"left"}}>
                      <div style={{width:18,height:18,borderRadius:5,border:`2px solid ${allowed?cl.color:"var(--border2)"}`,background:allowed?cl.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .15s"}}>
                        {allowed && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{width:10,height:10,borderRadius:"50%",background:cl.color,flexShrink:0}}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:500,color:allowed?cl.color:"var(--text)"}}>{cl.name}</div>
                      </div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:allowed?cl.color:"var(--dim)"}}>
                        {allowed?"ALLOWED":"NO ACCESS"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {(form.allowedCampaigns||[]).length===0 && campaignsList.length>0 && (
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--yellow)",marginTop:8,padding:"8px 12px",background:"rgba(26,58,92,0.04)",border:"1px solid rgba(217,119,6,0.2)",borderRadius:7}}>
                {form.role==="author"?"⚠ No campaigns selected — author won't be able to post to any campaign.":"⚠ No campaigns selected — client won't see any data."}
              </div>
            )}
          </div>
        )}

        <div style={{marginTop:16,padding:"12px 14px",background:"var(--surface2)",borderRadius:8,border:"1px solid var(--border)"}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase",marginBottom:6}}>Role permissions</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--muted)",lineHeight:1.8}}>
            {form.role==="admin"  && "Full access · View, create, edit & delete all entries · Manage users"}
            {form.role==="author" && "Can post to assigned campaigns only · Edit only their own entries"}
            {form.role==="client" && "Read-only · Sees only campaigns granted by admin"}
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20,paddingTop:20,borderTop:"1px solid var(--border)"}}>
          <button onClick={onClose} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
          <button onClick={handleSave} disabled={saving} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 22px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.07)",color:"var(--purple)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:7}}>
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
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--purple)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>// user management</div>
          <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>Team & Access</h2>
        </div>
        <button onClick={()=>{setEditUser(null);setShowForm(true)}} style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 16px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.07)",color:"var(--purple)",cursor:"pointer",fontWeight:500}}>
          <Icons.Plus/> ADD USER
        </button>
      </div>
      <div className="cq-3col" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
        {["admin","author","client"].map(role=>{
          const rm = ROLE_META[role];
          const count = users.filter(u=>u.role===role).length;
          return (
            <div key={role} style={{background:"var(--surface)",border:`1px solid var(--border)`,borderRadius:12,padding:"18px 20px",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${rm.color},transparent)`,opacity:.8}}/>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:4,background:rm.bg,border:`1px solid ${rm.border}`,color:rm.color,textTransform:"uppercase",letterSpacing:"0.06em"}}>{rm.label}</span>
              </div>
              <div style={{fontSize:28,fontWeight:500,color:rm.color}}>{count}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:2}}>active {rm.label.toLowerCase()}s</div>
            </div>
          );
        })}
      </div>
      <div className="cq-table-scroll"><div style={{minWidth:550}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 100px 1fr 120px 60px",padding:"10px 20px",borderBottom:"1px solid var(--border)",background:"var(--surface)"}}>
          {["User","Role","Bounty Access","Created",""].map(h=><div key={h} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase"}}>{h}</div>)}
        </div>
        {users.length===0 ? (
          <div style={{textAlign:"center",padding:"48px 20px",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--dim)"}}>No users yet</div>
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
                  <div style={{fontSize:13,fontWeight:500}}>{u.username}{isMe&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,marginLeft:6,color:"var(--green)"}}>you</span>}</div>
                  {u.displayName&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>{u.displayName}</div>}
                </div>
              </div>
              <div><span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:4,background:rm.bg,border:`1px solid ${rm.border}`,color:rm.color,textTransform:"uppercase",letterSpacing:"0.06em"}}>{rm.label}</span></div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap",alignItems:"center"}}>
                {u.role==="client" ? (
                  (u.allowedCampaigns||[]).length===0
                    ? <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>No access</span>
                    : (u.allowedCampaigns||[]).map(cid=>{
                        const cl = campaignsList.find(c=>c.id===cid);
                        if(!cl) return null;
                        return <span key={cid} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:4,background:cl.color+"18",border:`1px solid ${cl.color}44`,color:cl.color}}>{cl.name}</span>;
                      })
                ) : u.role==="author" ? (
                  (u.allowedCampaigns||[]).length===0
                    ? <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>No access</span>
                    : (u.allowedCampaigns||[]).map(cid=>{
                        const cl = campaignsList.find(c=>c.id===cid);
                        if(!cl) return null;
                        return <span key={cid} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:4,background:cl.color+"18",border:`1px solid ${cl.color}44`,color:cl.color}}>{cl.name}</span>;
                      })
                ) : (
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>All campaigns</span>
                )}
              </div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>{u.createdAt?new Date(u.createdAt).toLocaleDateString():"—"}</div>
              <div style={{display:"flex",gap:4,justifyContent:"flex-end"}}>
                <RowBtn onClick={()=>{setEditUser(u);setShowForm(true)}} title="Edit" hb="var(--accent)" hc="var(--accent)" hbg="rgba(26,58,92,0.06)"><Icons.Edit/></RowBtn>
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
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.1em",color:"var(--accent)",textTransform:"uppercase",marginBottom:6}}>//{isEdit?"edit":"new"} bounty entry</div>
        <div style={{fontSize:18,fontWeight:500,marginBottom:24}}>{isEdit?"Edit Bounty":"Add Bounty Entry"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Field label="Date"><input type="date" value={form.date} onChange={e=>set("date",e.target.value)} style={iStyle}/></Field>
          <Field label="Author"><input value={form.author} onChange={e=>set("author",e.target.value)} placeholder="e.g. Darkfost" disabled={locked&&!isEdit} style={{...iStyle,opacity:locked&&!isEdit?.6:1}}/></Field>
          <Field label="Title" full><textarea value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Post title or description…" rows={3} style={{...iStyle,resize:"vertical",lineHeight:1.5}}/></Field>
          <Field label="Quicktake Link" full><input type="url" value={form.cqLink} onChange={e=>set("cqLink",e.target.value)} placeholder="https://cryptoquant.com/quicktake/…" style={iStyle}/></Field>
          <Field label="Analytics Link" full><input type="url" value={form.analyticsLink||""} onChange={e=>set("analyticsLink",e.target.value)} placeholder="https://cryptoquant.com/community/dashboard/…" style={iStyle}/></Field>
          <Field label="Author Twitter Link" full><input type="url" value={form.authorTwitterLink||""} onChange={e=>set("authorTwitterLink",e.target.value)} placeholder="https://x.com/…" style={iStyle}/></Field>
          <Field label="CryptoQuant Twitter Link" full><input type="url" value={form.cqTwitterLink||""} onChange={e=>set("cqTwitterLink",e.target.value)} placeholder="https://x.com/CryptoQuant_IO/…" style={iStyle}/></Field>
          <Field label="Telegram Link" full><input type="url" value={form.telegramLink||""} onChange={e=>set("telegramLink",e.target.value)} placeholder="https://t.me/cryptoquant_official/…" style={iStyle}/></Field>
          <div style={{paddingTop:12,borderTop:"1px solid var(--border)",marginTop:4}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Campaign-Specific Fields</div>
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
          <button onClick={onClose} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
          <button onClick={handleSave} disabled={saving} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 22px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:7}}>
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
      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>{start}–{end} of {total}</span>
      <div style={{display:"flex",gap:4}}>
        <button onClick={()=>onChange(1)} disabled={page===1} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"5px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:page===1?"default":"pointer",opacity:page===1?.4:1}}>«</button>
        <button onClick={()=>onChange(page-1)} disabled={page===1} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:page===1?"default":"pointer",opacity:page===1?.4:1}}>Prev</button>
        {Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1).reduce((acc,p,i,arr)=>{
          if(i>0&&arr[i-1]!==p-1) acc.push("…");
          acc.push(p);
          return acc;
        },[]).map((p,i)=>
          p==="…"
            ? <span key={`e${i}`} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"5px 8px",color:"var(--dim)"}}>…</span>
            : <button key={p} onClick={()=>onChange(p)} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"5px 11px",borderRadius:7,border:`1px solid ${page===p?"rgba(26,58,92,0.2)":"var(--border)"}`,background:page===p?"rgba(26,58,92,0.08)":"var(--surface)",color:page===p?"var(--accent)":"var(--muted)",cursor:"pointer",fontWeight:page===p?700:400}}>{p}</button>
        )}
        <button onClick={()=>onChange(page+1)} disabled={page===totalPages} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:page===totalPages?"default":"pointer",opacity:page===totalPages?.4:1}}>Next</button>
        <button onClick={()=>onChange(totalPages)} disabled={page===totalPages} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"5px 10px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:page===totalPages?"default":"pointer",opacity:page===totalPages?.4:1}}>»</button>
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
const BountyDetailModal = ({entry, onEdit, onClose, canEdit:isEditable}) => {
  const ac = getAuthorColor(entry.author);
  const InfoBlock = ({label, value, full=false}) => !value ? null : (
    <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)",gridColumn:full?"1/-1":"auto"}}>
      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
      <div style={{fontSize:13,fontWeight:500,wordBreak:"break-word"}}>{value}</div>
    </div>
  );
  const LinkBtn = ({label, url}) => !url ? null : (
    <a href={url} target="_blank" rel="noreferrer"
      style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"6px 14px",borderRadius:8,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
      {label} ↗
    </a>
  );
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.15)",width:"min(var(--modal-md),100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",position:"relative",animation:"modalIn .2s ease"}}>
        {/* Header */}
        <div style={{padding:"24px 28px 16px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>// bounty entry</div>
          <h2 style={{fontSize:16,fontWeight:500,lineHeight:1.4,paddingRight:24}}>{entry.title||"—"}</h2>
        </div>
        {/* Scrollable body */}
        <div style={{overflowY:"auto",padding:"20px 28px",flex:1}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <InfoBlock label="Date" value={fmtDate(entry.date)}/>
            <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Author</div>
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
          {(entry.cqLink||entry.analyticsLink||entry.authorTwitterLink||entry.cqTwitterLink||entry.telegramLink)&&(
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Links</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <LinkBtn label="Quicktake" url={entry.cqLink}/>
                <LinkBtn label="Analytics" url={entry.analyticsLink}/>
                <LinkBtn label="Author X" url={entry.authorTwitterLink}/>
                <LinkBtn label="CQ X" url={entry.cqTwitterLink}/>
                <LinkBtn label="Telegram" url={entry.telegramLink}/>
              </div>
            </div>
          )}
        </div>
        {/* Footer */}
        <div style={{padding:"14px 28px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
          <button onClick={onClose} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 16px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>Close</button>
          {isEditable&&<button onClick={onEdit} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 18px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:6}}><Icons.Edit/> Edit</button>}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  CAMPAIGN TABLE
// ─────────────────────────────────────────────────────────
const CampaignTable = ({campaigns, citations=[], onSave, onDelete, onDeleteAll, currentUser, readOnly=false, onBountySummaryUpdate}) => {
  const [contentMode,setContentMode] = useState("all");
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

  const resetFilters = () => { setSearch(""); setFA("all"); setDateFrom(""); setDateTo(""); setPage(1); };
  const runSummarize = async (scope) => {
    const unsumm = scope.filter(b => !b.summary && b.cqLink);
    if (!unsumm.length) {
      setSumBatch({running:false,total:0,processed:0,saved:0,skipped:0,errors:0,lastMsg:"No un-summarized bounties with a cqLink."});
      return;
    }
    setSumBatch({running:true,total:unsumm.length,processed:0,saved:0,skipped:0,errors:0,lastMsg:""});
    const CONCURRENCY = 3;
    const queue = [...unsumm];
    const worker = async () => {
      while (queue.length) {
        const b = queue.shift();
        if (!b) break;
        try {
          const r = await fetch("/api/summarize-bounty", {
            method:"POST", headers:{"Content-Type":"application/json"},
            body: JSON.stringify({ bountyId: b.id }),
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
    await Promise.all(Array.from({length:CONCURRENCY}, worker));
    setSumBatch(s => ({...s, running:false}));
  };

  const activeCampaigns = contentMode==="cq_research" ? campaigns.filter(c=>(c.author||"").toLowerCase()==="cq research") : campaigns;
  const activeCitations = contentMode==="cq_research" ? citations.filter(c=>(c.author||"").toLowerCase()==="cq research") : [];

  const canAdd  = !readOnly && contentMode==="all";
  const canEdit = entry => !readOnly && contentMode==="all" && (currentUser.role==="admin" || entry.author===currentUser.displayName||entry.author===currentUser.username);

  const filtered = useMemo(()=>activeCampaigns.filter(c=>{
    const q = search.toLowerCase();
    const matchQ = !q || (c.title||"").toLowerCase().includes(q)||(c.author||"").toLowerCase().includes(q);
    const matchA = filterAuthor==="all" || c.author===filterAuthor;
    const matchFrom = !filterDateFrom || (c.date||"") >= filterDateFrom;
    const matchTo   = !filterDateTo   || (c.date||"") <= filterDateTo;
    return matchQ && matchA && matchFrom && matchTo;
  }),[activeCampaigns,search,filterAuthor,filterDateFrom,filterDateTo]);

  const sortedFiltered = useMemo(()=>[...filtered].sort((a,b)=>(b.date||"").localeCompare(a.date||"")),[filtered]);
  const paged = useMemo(()=>sortedFiltered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE),[sortedFiltered,page]);
  const authors = useMemo(()=>[...new Set(activeCampaigns.map(c=>c.author).filter(Boolean))],[activeCampaigns]);
  const withTw=activeCampaigns.filter(c=>c.twitterLink).length;
  const clientNames=[...new Set(activeCampaigns.map(c=>c.client).filter(Boolean))];
  const dateRange = useMemo(()=>{
    const sortedDates = activeCampaigns.filter(c=>c.date).map(c=>c.date).sort();
    return sortedDates.length?(sortedDates[0]===sortedDates[sortedDates.length-1]?fmtDate(sortedDates[0]):`${fmtDate(sortedDates[0]).split(",")[0]} – ${fmtDate(sortedDates[sortedDates.length-1]).split(",")[0]}`):"—";
  },[activeCampaigns]);

  // CQ Research analytics data
  const cqResearchData = useMemo(()=>{
    if(contentMode!=="cq_research") return null;
    const cits = activeCitations;
    const uniqueOutlets = [...new Set(cits.map(c=>c.media).filter(Boolean))];

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

    return {uniqueOutlets,topOutlets,maxOutlet,topHeadlines,maxHeadline,tierEntries,cits};
  },[contentMode,activeCampaigns,activeCitations]);

  // CQ Research citations pagination
  const [cqCitPage,setCqCitPage] = useState(1);
  const [viewCitation,setViewCitation] = useState(null);
  const cqCitRef = useRef(null);
  const pagedCqCits = cqResearchData ? cqResearchData.cits.slice((cqCitPage-1)*PAGE_SIZE, cqCitPage*PAGE_SIZE) : [];

  return (
    <>
      {/* Content mode pills */}
      <div style={{display:"flex",alignItems:"center",gap:2,marginBottom:20,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:3,width:"fit-content",animation:"fadeUp .5s ease both"}}>
        {[{id:"all",label:"All Content"},{id:"cq_research",label:"CQ Research"}].map(m=>(
          <button key={m.id} onClick={()=>{setContentMode(m.id);setPage(1);setCqCitPage(1);resetFilters();}}
            style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"6px 16px",borderRadius:6,border:"none",background:contentMode===m.id?"var(--surface)":"transparent",color:contentMode===m.id?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:contentMode===m.id?600:400,boxShadow:contentMode===m.id?"0 1px 3px rgba(0,0,0,0.08)":"none",transition:"all .15s",letterSpacing:"0.02em"}}>
            {m.label}
          </button>
        ))}
      </div>

      {/* Stat cards */}
      {contentMode==="all" ? (
        <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:28,animation:"fadeUp .5s ease both"}}>
          <StatCard label="Total Posts"       value={activeCampaigns.length} sub={dateRange}                                    c="var(--accent)"/>
          <StatCard label="Unique Authors"     value={authors.length}   sub="Contributing analysts"                        c="var(--purple)"/>
        </div>
      ) : (
        <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28,animation:"fadeUp .5s ease both"}}>
          <StatCard label="Bounties" value={activeCampaigns.length} sub="Posts published" c="var(--accent)"/>
          <StatCard label="Media Citations" value={activeCitations.length} sub="Total coverage" c="#4a7fa8"/>
          <StatCard label="Media Outlets" value={cqResearchData?.uniqueOutlets.length||0} sub="Unique publications" c="var(--accent)"/>
        </div>
      )}

      {/* CQ Research analytics */}
      {contentMode==="cq_research"&&cqResearchData&&(<>
        {/* Leaderboards */}
        {(cqResearchData.topHeadlines.length>0||cqResearchData.topOutlets.length>0||cqResearchData.tierEntries.length>0)&&(
          <div className="cq-3col" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:16,animation:"fadeUp .5s ease .08s both"}}>
            {/* Top Headlines */}
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Top Headlines</div>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{cqResearchData.topHeadlines.length}</span>
              </div>
              {cqResearchData.topHeadlines.length===0
                ?<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>No data</div>
                :<div style={{display:"flex",flexDirection:"column",gap:9}}>
                  {cqResearchData.topHeadlines.map((h,i)=>(
                    <div key={h.label}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{i+1}</span>
                          <span title={h.label} style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.label}</span>
                        </div>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"#4a7fa8",fontWeight:600,flexShrink:0,marginLeft:8}}>{h.count}</span>
                      </div>
                      <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                        <div style={{width:`${(h.count/cqResearchData.maxHeadline)*100}%`,height:"100%",background:"#4a7fa8",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
            {/* Top Outlets */}
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Top Outlets</div>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{cqResearchData.uniqueOutlets.length}</span>
              </div>
              {cqResearchData.topOutlets.length===0
                ?<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>No data</div>
                :<div style={{display:"flex",flexDirection:"column",gap:9}}>
                  {cqResearchData.topOutlets.map((o,i)=>(
                    <div key={o.label}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                        <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{i+1}</span>
                          <span title={o.label} style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.label}</span>
                        </div>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600,flexShrink:0,marginLeft:8}}>{o.count}</span>
                      </div>
                      <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                        <div style={{width:`${(o.count/cqResearchData.maxOutlet)*100}%`,height:"100%",background:"var(--accent)",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
                      </div>
                    </div>
                  ))}
                </div>
              }
            </div>
            {/* Media Tier */}
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Media Tier</div>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{cqResearchData.cits.length} total</span>
              </div>
              {cqResearchData.tierEntries.length===0
                ?<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>No tier data</div>
                :<div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {cqResearchData.tierEntries.map(([tier,count])=>{
                    const tc=getTierColor(tier);
                    const pct=(count/cqResearchData.cits.length)*100;
                    return (
                      <div key={tier}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color}}>Tier {tier}</span>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,color:tc.color}}>{count} <span style={{color:"var(--dim)",fontWeight:400}}>({Math.round(pct)}%)</span></span>
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
      </>)}

      {/* Bounty activity chart (All mode only) */}
      {contentMode==="all"&&activeCampaigns.length > 1 && (()=>{
        const GranularityToggle = ({value, onChange}) => (
          <div style={{display:"flex",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:2,gap:1}}>
            {[["weekly","Wk"],["daily","Day"]].map(([val,lbl])=>(
              <button key={val} onClick={()=>onChange(val)}
                style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:5,border:"none",background:value===val?"var(--surface)":"transparent",color:value===val?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:value===val?700:400,boxShadow:value===val?"0 1px 3px rgba(0,0,0,0.1)":"none",transition:"all .15s"}}>
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
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 20px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{gran==="daily"?"Daily":"Weekly"} Posting Activity</div>
                  <GranularityToggle value={gran} onChange={setGran}/>
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={chartData} margin={{top:2,right:4,left:-28,bottom:0}}>
                    <defs>
                      <linearGradient id="gbChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#1a3a5c" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#1a3a5c" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                    <XAxis dataKey="label" tick={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,fill:"#9ca3af"}} axisLine={false} tickLine={false} interval={Math.max(0,Math.ceil(chartData.length/(gran==="daily"?10:6))-1)}/>
                    <YAxis tick={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,fill:"#9ca3af"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={({active,payload,label})=>active&&payload?.length?(
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:4}}>{label}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,color:"var(--accent)"}}>{payload[0].value} bounties</div>
                      </div>
                    ):null}/>
                    <Area type="monotone" dataKey="count" stroke="#1a3a5c" strokeWidth={2} fill="url(#gbChart)" dot={false} activeDot={{r:3,fill:"#1a3a5c"}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 20px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Top Authors</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {topAuthors.map(([name,count],i)=>(
                    <div key={name}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"65%"}}>{name}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",fontWeight:600}}>{count}</span>
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
      {/* Filter bar */}
      {(()=>{
        const hasFilters = search||filterAuthor!=="all"||filterDateFrom||filterDateTo;
        return (
          <div style={{marginBottom:16,animation:"fadeUp .5s ease .08s both"}}>
            <div className="cq-filter-bar" style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{position:"relative",flex:1,maxWidth:320}}>
                <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--dim)",pointerEvents:"none"}}><Icons.Search/></div>
                <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search title or author…" style={{...iStyle,padding:"8px 10px 8px 30px",fontSize:11}}/>
              </div>
              <button onClick={()=>setShowFilters(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:`1px solid ${showFilters||hasFilters?"rgba(26,58,92,0.3)":"var(--border)"}`,background:showFilters||hasFilters?"rgba(26,58,92,0.07)":"var(--surface)",color:showFilters||hasFilters?"var(--accent)":"var(--muted)",cursor:"pointer",transition:"all .15s"}}>
                ⚙ Filters {hasFilters&&<span style={{background:"var(--accent)",color:"#fff",borderRadius:100,padding:"1px 6px",fontSize:9,fontWeight:500}}>{[search,filterAuthor!=="all",filterDateFrom,filterDateTo].filter(Boolean).length}</span>}
              </button>
              {hasFilters&&<button onClick={resetFilters} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"8px 12px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer"}}>Clear</button>}
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",marginLeft:4}}>{filtered.length} result{filtered.length!==1?"s":""}</span>
              {currentUser.role==="admin"&&contentMode==="all"&&activeCampaigns.length>0&&<button onClick={()=>{const cid=activeCampaigns[0]?.campaignId;if(cid&&window.confirm(`Delete all bounties for this campaign? This cannot be undone.`)){onDeleteAll&&onDeleteAll(cid);}}} style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(220,38,38,0.25)",background:"rgba(220,38,38,0.06)",color:"var(--red)",cursor:"pointer",fontWeight:500}}><Icons.Trash/> DELETE ALL</button>}
              {onBountySummaryUpdate && currentUser.role==="admin" && contentMode==="all" && (()=>{
                const unsumCount = filtered.filter(b=>!b.summary && b.cqLink).length;
                return <button onClick={()=>{if(sumBatch.running)return;if(!window.confirm(`Generate summaries for ${unsumCount} bounty${unsumCount!==1?"s":""}? ~$${(unsumCount*0.001).toFixed(2)} on Haiku.`))return;runSummarize(filtered);}}
                  disabled={sumBatch.running||unsumCount===0}
                  style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(15,118,110,0.25)",background:sumBatch.running?"rgba(15,118,110,0.04)":"rgba(15,118,110,0.08)",color:"#0f766e",cursor:sumBatch.running?"wait":(unsumCount===0?"not-allowed":"pointer"),fontWeight:500,opacity:unsumCount===0?0.5:1}}>
                  {sumBatch.running?`SUMMARIZING ${sumBatch.processed}/${sumBatch.total}…`:`📝 SUMMARIZE ${unsumCount} BOUNTIES`}
                </button>;
              })()}
              {canAdd&&<button onClick={()=>{setEdit(null);setShowForm(true)}} style={{marginLeft:onBountySummaryUpdate&&currentUser.role==="admin"&&contentMode==="all"?0:"auto",display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:"pointer",fontWeight:500}}><Icons.Plus/> ADD ENTRY</button>}
            </div>
            {(sumBatch.running||sumBatch.processed>0||sumBatch.lastMsg)&&(
              <div style={{marginTop:10,padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                {sumBatch.running?(
                  <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:200}}>
                    <div style={{flex:1,height:4,borderRadius:4,background:"var(--border)",overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${sumBatch.total?(sumBatch.processed/sumBatch.total)*100:0}%`,background:"#0f766e",transition:"width .3s"}}/>
                    </div>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--muted)",whiteSpace:"nowrap"}}>{sumBatch.processed}/{sumBatch.total}</span>
                  </div>
                ):(
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--muted)"}}>
                    {sumBatch.total>0?`Summarize done · `:""}
                    <b style={{color:"#0f766e"}}>{sumBatch.saved} saved</b> · {sumBatch.skipped} skipped · {sumBatch.errors} errors
                    {sumBatch.lastMsg && ` · ${sumBatch.lastMsg}`}
                  </span>
                )}
                {!sumBatch.running && sumBatch.processed>0 && (
                  <button onClick={()=>setSumBatch({running:false,total:0,processed:0,saved:0,skipped:0,errors:0,lastMsg:""})}
                    style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer",marginLeft:"auto"}}>dismiss</button>
                )}
              </div>
            )}
            {showFilters&&(
              <div style={{marginTop:10,padding:"14px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:140}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Author</span>
                  <select value={filterAuthor} onChange={e=>{setFA(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                    <option value="all">All Authors</option>
                    {authors.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>From</span>
                  <input type="date" value={filterDateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>To</span>
                  <input type="date" value={filterDateTo} onChange={e=>{setDateTo(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
              </div>
            )}
            {hasFilters&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                {search&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>"{search}"</span>}
                {filterAuthor!=="all"&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>{filterAuthor}</span>}
                {filterDateFrom&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>From {filterDateFrom}</span>}
                {filterDateTo&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>To {filterDateTo}</span>}
              </div>
            )}
          </div>
        );
      })()}
      <div className="cq-table-scroll"><div style={{minWidth:600}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.04)",animation:"fadeUp .5s ease .12s both"}}>
        <div style={{display:"grid",gridTemplateColumns:"108px 1fr 130px 110px 54px",padding:"11px 20px",borderBottom:"2px solid var(--border)",background:"var(--surface3)"}}>
          {["Date","Title & Links","Impressions","Author",""].map(h=><div key={h} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,letterSpacing:"0.08em",color:"var(--muted)",textTransform:"uppercase"}}>{h}</div>)}
        </div>
        {!activeCampaigns.length
          ? <div style={{textAlign:"center",padding:"60px 20px"}}>
              <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⬡</div>
              <div style={{fontSize:14,fontWeight:500,color:"var(--muted)",marginBottom:6}}>{contentMode==="cq_research"?"No CQ Research entries":"No entries yet"}</div>
              {canAdd&&<button onClick={()=>{setEdit(null);setShowForm(true)}} style={{marginTop:16,display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.07)",color:"var(--accent)",cursor:"pointer"}}><Icons.Plus/>ADD FIRST ENTRY</button>}
            </div>
          : filtered.length===0
            ? <div style={{textAlign:"center",padding:"48px 20px"}}>
                <div style={{fontSize:24,marginBottom:8,opacity:.25}}>⬡</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--muted)",marginBottom:4}}>No matches</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>Try clearing filters or widening the date range</div>
              </div>
            : paged.map((c,i)=>{
                const ac=getAuthorColor(c.author);
                const dp=fmtDate(c.date).split(", ");
                const editable=canEdit(c);
                return (
                  <div key={c.id} onClick={()=>setView(c)}
                    style={{display:"grid",gridTemplateColumns:"108px 1fr 130px 110px 54px",padding:"14px 20px",borderBottom:"1px solid var(--border)",alignItems:"center",cursor:"pointer",transition:"background .15s",animation:`rowIn .3s ease ${i*.025}s both`,background:i%2?"rgba(26,58,92,0.025)":"transparent"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.06)"}
                    onMouseLeave={e=>e.currentTarget.style.background=i%2?"rgba(26,58,92,0.025)":"transparent"}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>
                      <span style={{display:"block",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{dp[0]}</span>{dp[1]||""}
                    </div>
                    <div style={{paddingRight:14,minWidth:0}}>
                      <div title={c.title||""} style={{fontSize:12,fontWeight:500,lineHeight:1.4,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{c.title}</div>
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                        {c.cqLink&&<a href={c.cqLink} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none"}}>Quicktake↗</a>}
                        {c.analyticsLink&&<a href={c.analyticsLink} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none"}}>Analytics↗</a>}
                        {c.authorTwitterLink&&<a href={c.authorTwitterLink} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none"}}>Author X↗</a>}
                        {c.cqTwitterLink&&<a href={c.cqTwitterLink} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none"}}>CQ X↗</a>}
                        {c.telegramLink&&<a href={c.telegramLink} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none"}}>Telegram↗</a>}
                      </div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:3,minWidth:0}}>
                      {(c.twitterImpressions||c.telegramImpressions)?(
                        <>
                          {c.twitterImpressions&&<div style={{display:"flex",alignItems:"center",gap:5}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--dim)"}}>𝕏</span>
                            <span className="tabular" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,color:"var(--accent)"}}>{Number(String(c.twitterImpressions).replace(/,/g,"")).toLocaleString()}</span>
                          </div>}
                          {c.telegramImpressions&&<div style={{display:"flex",alignItems:"center",gap:5}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--dim)"}}>TG</span>
                            <span className="tabular" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,color:"#4a7fa8"}}>{Number(String(c.telegramImpressions).replace(/,/g,"")).toLocaleString()}</span>
                          </div>}
                        </>
                      ):<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",opacity:0.45}}>—</span>}
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0,cursor:c.author?"pointer":"default"}} onClick={e=>{if(c.author){e.stopPropagation();window.dispatchEvent(new CustomEvent("cq-nav-author",{detail:{name:c.author,cid:c.campaignId}}));}}}>
                      <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500,flexShrink:0,background:ac.bg,color:ac.color,border:"1px solid var(--border2)"}}>{initials(c.author)}</div>
                      <span title={c.author||""} style={{fontSize:11,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0,textDecoration:c.author?"underline":"none",textDecorationColor:"var(--border2)",textUnderlineOffset:2}}>{c.author}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}} onClick={e=>e.stopPropagation()}>
                      {editable&&<RowBtn onClick={()=>{setEdit(c);setShowForm(true)}} title="Edit" hb="var(--accent)" hc="var(--accent)" hbg="rgba(26,58,92,0.06)"><Icons.Edit/></RowBtn>}
                      {editable&&<RowBtn onClick={()=>setConfId(c.id)} title="Delete" hb="var(--red)" hc="var(--red)" hbg="rgba(220,38,38,0.07)"><Icons.Trash/></RowBtn>}
                    </div>
                  </div>
                );
              })
        }
        <Pagination page={page} total={sortedFiltered.length} onChange={p=>{setPage(p);window.scrollTo({top:0,behavior:'smooth'})}}/>
      </div>
      </div></div>
      {/* CQ Research citations table */}
      {contentMode==="cq_research"&&cqResearchData&&cqResearchData.cits.length>0&&(
        <div ref={cqCitRef} style={{marginTop:20}}>
          <div className="cq-table-scroll"><div style={{minWidth:500}}>
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)",animation:"fadeUp .5s ease .16s both"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:"2px solid var(--border)",background:"var(--surface3)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--muted)",fontWeight:600}}>Media Citations</div>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--dim)"}}>{cqResearchData.cits.length}</span>
            </div>
            {pagedCqCits.map((c,i)=>{
              const tc=getTierColor(c.mediaTier);
              return (
                <div key={c.id} onClick={()=>setViewCitation(c)}
                  style={{display:"grid",gridTemplateColumns:"100px 1fr 1fr 110px 60px",padding:"14px 20px",borderBottom:"1px solid var(--border)",alignItems:"center",cursor:"pointer",transition:"background .15s",animation:`rowIn .3s ease ${i*.025}s both`,background:i%2?"rgba(26,58,92,0.025)":"transparent"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.06)"}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2?"rgba(26,58,92,0.025)":"transparent"}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>{c.date||"—"}</div>
                  <div style={{minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.media||"—"}</div>
                    {c.mediaTier&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,padding:"1px 5px",borderRadius:3,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,marginTop:2,display:"inline-block"}}>Tier {c.mediaTier}</span>}
                  </div>
                  <div style={{minWidth:0}}>
                    {c.headline&&<div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.headline}</div>}
                    {c.topic&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.topic}</div>}
                    {!c.headline&&!c.topic&&<span style={{color:"var(--dim)",fontSize:11,opacity:0.45}}>—</span>}
                  </div>
                  <div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.reporter||"—"}</div>
                  <div onClick={e=>e.stopPropagation()}>
                    {c.articleLink?<a href={c.articleLink} target="_blank" rel="noopener noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textDecoration:"none"}}>↗ Read</a>:<span style={{color:"var(--dim)",fontSize:10,opacity:0.45}}>—</span>}
                  </div>
                </div>
              );
            })}
            <Pagination page={cqCitPage} total={cqResearchData.cits.length} onChange={p=>{setCqCitPage(p);cqCitRef.current?.scrollIntoView({behavior:"smooth",block:"start"});}}/>
          </div>
          </div></div>
        </div>
      )}
      {viewCitation&&<CitationDetailModal entry={viewCitation} canEdit={false} onEdit={()=>{}} onClose={()=>setViewCitation(null)}/>}
      {view&&<BountyDetailModal entry={view} canEdit={canEdit(view)} onEdit={()=>{setEdit(view);setShowForm(true);setView(null);}} onClose={()=>setView(null)}/>}
      {showForm&&<CampForm initial={editEntry} isEdit={!!editEntry} onSave={async f=>{await onSave(f,editEntry);setShowForm(false);setEdit(null)}} onClose={()=>{setShowForm(false);setEdit(null)}} currentUser={currentUser}/>}
      {confirmId&&<ConfirmDelete onConfirm={()=>{onDelete(confirmId);setConfId(null)}} onCancel={()=>setConfId(null)}/>}
    </>
  );
};

// ─────────────────────────────────────────────────────────
//  CITATION DETAIL MODAL
// ─────────────────────────────────────────────────────────
const CitationDetailModal = ({entry, onEdit, onClose, canEdit:isEditable, bounties, onCitedBountyUpdate}) => {
  const mc = getPaletteColor(AUTHOR_PALETTE,"media",entry.media||"?");
  const [matchState, setMatchState] = useState({loading:false, result:null, error:null});
  const [savingId, setSavingId] = useState(null);
  const currentCitedBounty = entry.citedBountyId && bounties ? bounties.find(b => b.id === entry.citedBountyId) : null;
  const saveMatch = async (bountyId) => {
    if (!onCitedBountyUpdate) return;
    setSavingId(bountyId);
    try { await onCitedBountyUpdate(entry.id, bountyId); }
    finally { setSavingId(null); }
  };
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
      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
      <div style={{fontSize:13,fontWeight:500,wordBreak:"break-word"}}>{value}</div>
    </div>
  );
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.15)",width:"min(var(--modal-md),100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",position:"relative",animation:"modalIn .2s ease"}}>
        {/* Header */}
        <div style={{padding:"24px 28px 16px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>// media citation</div>
          <h2 style={{fontSize:16,fontWeight:500,lineHeight:1.4,paddingRight:24}}>{entry.headline||entry.topic||"—"}</h2>
          {entry.headline&&entry.topic&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:4}}>{entry.topic}</div>}
        </div>
        {/* Scrollable body */}
        <div style={{overflowY:"auto",padding:"20px 28px",flex:1}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <InfoBlock label="Date" value={fmtDate(entry.date)}/>
            <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Media Outlet</div>
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
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Article Link</div>
              <a href={entry.articleLink} target="_blank" rel="noreferrer"
                style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"6px 14px",borderRadius:8,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
                Open Article ↗
              </a>
            </div>
          )}
          {currentCitedBounty && (
            <div style={{marginBottom:16,padding:"10px 12px",borderRadius:10,border:"1px solid rgba(15,118,110,0.2)",background:"rgba(15,118,110,0.05)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#0f766e",textTransform:"uppercase",letterSpacing:"0.08em"}}>Cited Bounty</div>
                {isEditable && onCitedBountyUpdate && (
                  <button onClick={()=>saveMatch("")} disabled={savingId!==null}
                    style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:savingId!==null?"wait":"pointer"}}>
                    clear
                  </button>
                )}
              </div>
              <div style={{fontSize:12,fontWeight:500,marginBottom:3}}>{currentCitedBounty.title||"(untitled)"}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:6}}>
                {currentCitedBounty.author||"—"} · {fmtDate(currentCitedBounty.date)}{currentCitedBounty.asset?` · ${currentCitedBounty.asset}`:""}
              </div>
              {currentCitedBounty.cqLink && (
                <a href={currentCitedBounty.cqLink} target="_blank" rel="noreferrer"
                  style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"4px 10px",borderRadius:6,background:"rgba(15,118,110,0.1)",border:"1px solid rgba(15,118,110,0.25)",color:"#0f766e",textDecoration:"none",display:"inline-flex"}}>
                  Open Bounty ↗
                </a>
              )}
            </div>
          )}
          {isEditable && entry.articleLink && entry.campaignId && (
            <div style={{marginBottom:16,padding:"14px 16px",borderRadius:10,border:"1px dashed var(--border2)",background:"var(--surface2)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:matchState.result||matchState.error?10:0}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Bounty Match</div>
                <button onClick={runMatch} disabled={matchState.loading}
                  style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:6,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:matchState.loading?"wait":"pointer",fontWeight:500}}>
                  {matchState.loading?"MATCHING…":"🔗 FIND CITED BOUNTY"}
                </button>
              </div>
              {matchState.error && (
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#b91c1c",marginTop:8}}>Error: {matchState.error}</div>
              )}
              {matchState.result && (
                <div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:8}}>
                    method: <b>{matchState.result.method}</b>
                    {matchState.result.bountiesChecked!=null && ` · ${matchState.result.bountiesChecked} bounties`}
                    {matchState.result.candidatesConsidered!=null && ` → ${matchState.result.candidatesConsidered} candidates`}
                    {matchState.result.authorFiltered && ` (author-filtered)`}
                    {matchState.result.articleFetched===false && ` · article fetch failed`}
                    {matchState.result.articleExcerptLength!=null && ` · ${matchState.result.articleExcerptLength} char excerpt`}
                    {matchState.result.fetchError && ` (${matchState.result.fetchError})`}
                    {matchState.result.usage && ` · ${matchState.result.usage.input_tokens}+${matchState.result.usage.output_tokens} tok`}
                    {matchState.result.hallucinatedIds>0 && ` · ${matchState.result.hallucinatedIds} invalid IDs dropped`}
                  </div>
                  {matchState.result.matches.length === 0 ? (
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--muted)"}}>
                      No match — {
                        matchState.result.bountiesChecked === 0 ? "this campaign has no bounties" :
                        matchState.result.candidatesConsidered === 0 ? "no candidate bounties after filtering" :
                        "model couldn't find a confident match"
                      }
                    </div>
                  ) : (
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {matchState.result.matches.map(m => (
                        <div key={m.bountyId} style={{padding:"10px 12px",background:"var(--surface)",borderRadius:6,border:"1px solid var(--border)"}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8,marginBottom:4}}>
                            <div style={{fontSize:12,fontWeight:500,lineHeight:1.35}}>{m.title||"(untitled)"}</div>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,flexShrink:0,
                              background: m.confidence==="high"?"rgba(15,118,110,0.1)":m.confidence==="medium"?"rgba(234,179,8,0.12)":"rgba(100,116,139,0.1)",
                              color: m.confidence==="high"?"#0f766e":m.confidence==="medium"?"#a16207":"#475569",
                              border: m.confidence==="high"?"1px solid rgba(15,118,110,0.25)":m.confidence==="medium"?"1px solid rgba(234,179,8,0.3)":"1px solid rgba(100,116,139,0.25)"
                            }}>{m.confidence}</span>
                          </div>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:6}}>
                            {m.author||"—"} · {fmtDate(m.date)}{m.asset?` · ${m.asset}`:""}
                          </div>
                          {m.reason && <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.45,fontStyle:"italic"}}>{m.reason}</div>}
                          <div style={{display:"flex",gap:8,alignItems:"center",marginTop:6}}>
                            {m.cqLink && <a href={m.cqLink} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--accent)",textDecoration:"none"}}>View bounty ↗</a>}
                            {isEditable && onCitedBountyUpdate && entry.citedBountyId !== m.bountyId && (
                              <button onClick={()=>saveMatch(m.bountyId)} disabled={savingId!==null}
                                style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:5,border:"1px solid rgba(15,118,110,0.3)",background:"rgba(15,118,110,0.08)",color:"#0f766e",cursor:savingId!==null?"wait":"pointer",fontWeight:500}}>
                                {savingId===m.bountyId?"SAVING…":"SAVE AS CITED"}
                              </button>
                            )}
                            {entry.citedBountyId === m.bountyId && (
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"#0f766e",fontWeight:600}}>✓ saved</span>
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
        </div>
        {/* Footer */}
        <div style={{padding:"14px 28px",borderTop:"1px solid var(--border)",display:"flex",justifyContent:"flex-end",gap:8,flexShrink:0}}>
          <button onClick={onClose} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 16px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>Close</button>
          {isEditable&&<button onClick={onEdit} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 18px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:6}}><Icons.Edit/> Edit</button>}
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
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.1em",color:"var(--accent)",textTransform:"uppercase",marginBottom:6}}>//{isEdit?"edit":"new"} media citation</div>
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
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Campaign-Specific Fields</div>
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
          <button onClick={onClose} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
          <button onClick={handleSave} disabled={saving} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 22px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.07)",color:"var(--orange)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:7}}>{saving?<><Icons.Spin/>SAVING…</>:"SAVE CITATION"}</button>
        </div>
      </div>
    </div>
  );
};

const MediaTable = ({citations,onSave,onDelete,onDeleteAll,currentUser,readOnly,bounties,onCitedBountyUpdate}) => {
  const bountyById = useMemo(()=>Object.fromEntries((bounties||[]).map(b=>[b.id,b])),[bounties]);
  const [batch,setBatch] = useState({running:false, total:0, processed:0, saved:0, skipped:0, errors:0, lastMsg:""});
  const [search,setSearch]=useState("");
  const [filterAuthor,setFA]=useState("all");
  const [filterMedia,setFM]=useState("all");
  const [filterTier,setFT]=useState("all");
  const [filterDateFrom,setDateFrom]=useState("");
  const [filterDateTo,setDateTo]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [editEntry,setEdit]=useState(null);
  const [confirmId,setConfId]=useState(null);
  const [view,setView]=useState(null);
  const [page,setPage]=useState(1);
  const [showFilters,setShowFilters]=useState(false);
  const resetFilters=()=>{setSearch("");setFA("all");setFM("all");setFT("all");setDateFrom("");setDateTo("");setPage(1);};
  const runAutoMatch = async (scope) => {
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
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || `HTTP ${r.status}`);
          const top = data.matches?.[0];
          const autoSave = top && (
            data.method === "url" ||
            data.method === "author-singleton" ||
            (data.method === "llm" && top.confidence === "high")
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
    return matchQ&&matchA&&matchM&&matchT&&matchFrom&&matchTo;
  }),[citations,search,filterAuthor,filterMedia,filterTier,filterDateFrom,filterDateTo]);
  const sortedFiltered=useMemo(()=>[...filtered].sort((a,b)=>(b.date||"").localeCompare(a.date||"")),[filtered]);
  const paged=useMemo(()=>sortedFiltered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE),[sortedFiltered,page]);
  const medias=useMemo(()=>[...new Set(citations.map(c=>c.media).filter(Boolean))],[citations]);
  const authors=useMemo(()=>[...new Set(citations.map(c=>c.author).filter(Boolean))],[citations]);
  const tiers=useMemo(()=>[...new Set(citations.map(c=>(c.mediaTier||"").trim()).filter(Boolean))].sort(),[citations]);
  const COLS="108px 15% 11% 11% 1fr 64px 72px 54px";
  return (
    <>
      <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:28,animation:"fadeUp .5s ease both"}}>
        <StatCard label="Total Citations" value={citations.length} sub="All media mentions" c="var(--accent)"/>
        <StatCard label="Media Outlets"   value={medias.length}    sub={medias.slice(0,3).join(", ")||"—"} c="var(--accent)"/>
      </div>

      {/* Media activity charts */}
      {citations.length > 1 && (()=>{
        const GranularityToggle = ({value, onChange}) => (
          <div style={{display:"flex",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:2,gap:1}}>
            {[["weekly","Wk"],["daily","Day"]].map(([val,lbl])=>(
              <button key={val} onClick={()=>onChange(val)}
                style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:5,border:"none",background:value===val?"var(--surface)":"transparent",color:value===val?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:value===val?700:400,boxShadow:value===val?"0 1px 3px rgba(0,0,0,0.1)":"none",transition:"all .15s"}}>
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
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 20px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{gran==="daily"?"Daily":"Weekly"} Coverage</div>
                  <GranularityToggle value={gran} onChange={setGran}/>
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={chartData} margin={{top:2,right:4,left:-28,bottom:0}}>
                    <defs>
                      <linearGradient id="gcChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4a7fa8" stopOpacity={0.18}/>
                        <stop offset="95%" stopColor="#4a7fa8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false}/>
                    <XAxis dataKey="label" tick={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,fill:"#9ca3af"}} axisLine={false} tickLine={false} interval={Math.max(0,Math.ceil(chartData.length/(gran==="daily"?10:6))-1)}/>
                    <YAxis tick={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,fill:"#9ca3af"}} axisLine={false} tickLine={false} allowDecimals={false}/>
                    <Tooltip content={({active,payload,label})=>active&&payload?.length?(
                      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",boxShadow:"0 4px 12px rgba(0,0,0,0.1)"}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:4}}>{label}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,color:"#4a7fa8"}}>{payload[0].value} articles</div>
                      </div>
                    ):null}/>
                    <Area type="monotone" dataKey="count" stroke="#4a7fa8" strokeWidth={2} fill="url(#gcChart)" dot={false} activeDot={{r:3,fill:"#4a7fa8"}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {tierEntries.length > 0 && (
                <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 20px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Media Tier Breakdown</div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {tierEntries.map(([tier,count])=>{
                      const pct = Math.round((count/citations.length)*100);
                      const tc = getTierColor(tier);
                      return (
                        <div key={tier}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color}}>Tier {tier}</span>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--muted)"}}>{count} <span style={{color:"var(--dim)"}}>({pct}%)</span></span>
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
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 20px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:12}}>Top Outlets</div>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {topOutlets.map(([name,count],i)=>(
                    <div key={name}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:"65%"}}>{name}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#4a7fa8",fontWeight:600}}>{count}</span>
                      </div>
                      <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                        <div style={{width:`${(count/maxOutlet)*100}%`,height:"100%",background:"#4a7fa8",opacity:1-i*0.15,borderRadius:99}}/>
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
      {/* Filter bar */}
      {(()=>{
        const hasFilters = search||filterAuthor!=="all"||filterMedia!=="all"||filterTier!=="all"||filterDateFrom||filterDateTo;
        return (
          <div style={{marginBottom:16,animation:"fadeUp .5s ease .08s both"}}>
            <div className="cq-filter-bar" style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{position:"relative",flex:1,maxWidth:320}}>
                <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--dim)",pointerEvents:"none"}}><Icons.Search/></div>
                <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search media, reporter, topic…" style={{...iStyle,padding:"8px 10px 8px 30px",fontSize:11}}/>
              </div>
              <button onClick={()=>setShowFilters(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:`1px solid ${showFilters||hasFilters?"rgba(26,58,92,0.3)":"var(--border)"}`,background:showFilters||hasFilters?"rgba(26,58,92,0.07)":"var(--surface)",color:showFilters||hasFilters?"var(--accent)":"var(--muted)",cursor:"pointer",transition:"all .15s"}}>
                ⚙ Filters {hasFilters&&<span style={{background:"var(--accent)",color:"#fff",borderRadius:100,padding:"1px 6px",fontSize:9,fontWeight:500}}>{[search,filterAuthor!=="all",filterMedia!=="all",filterTier!=="all",filterDateFrom,filterDateTo].filter(Boolean).length}</span>}
              </button>
              {hasFilters&&<button onClick={resetFilters} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"8px 12px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer"}}>Clear</button>}
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",marginLeft:4}}>{filtered.length} result{filtered.length!==1?"s":""}</span>
              {currentUser.role==="admin"&&citations.length>0&&<button onClick={()=>{const cid=citations[0]?.campaignId;if(cid&&window.confirm(`Delete all citations for this campaign? This cannot be undone.`)){onDeleteAll&&onDeleteAll(cid);}}} style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(220,38,38,0.25)",background:"rgba(220,38,38,0.06)",color:"var(--red)",cursor:"pointer",fontWeight:500}}><Icons.Trash/> DELETE ALL</button>}
              {onCitedBountyUpdate && currentUser.role==="admin" && (()=>{
                const unlinkedCount = filtered.filter(c=>!c.citedBountyId && c.articleLink).length;
                return <button onClick={()=>{if(batch.running)return;if(!window.confirm(`Run bounty match on ${unlinkedCount} unlinked citation${unlinkedCount!==1?"s":""}? Only high-confidence matches will be auto-saved.`))return;runAutoMatch(filtered);}}
                  disabled={batch.running||unlinkedCount===0}
                  style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(15,118,110,0.25)",background:batch.running?"rgba(15,118,110,0.04)":"rgba(15,118,110,0.08)",color:"#0f766e",cursor:batch.running?"wait":(unlinkedCount===0?"not-allowed":"pointer"),fontWeight:500,opacity:unlinkedCount===0?0.5:1}}>
                  {batch.running?`MATCHING ${batch.processed}/${batch.total}…`:`🔗 AUTO-MATCH ${unlinkedCount} UNLINKED`}
                </button>;
              })()}
              {canAdd&&<button onClick={()=>{setEdit(null);setShowForm(true)}} style={{marginLeft:onCitedBountyUpdate&&currentUser.role==="admin"?0:"auto",display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.07)",color:"var(--accent)",cursor:"pointer",fontWeight:500}}><Icons.Plus/> ADD CITATION</button>}
            </div>
            {(batch.running||batch.processed>0||batch.lastMsg)&&(
              <div style={{marginTop:10,padding:"10px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                {batch.running?(
                  <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:200}}>
                    <div style={{flex:1,height:4,borderRadius:4,background:"var(--border)",overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${batch.total?(batch.processed/batch.total)*100:0}%`,background:"#0f766e",transition:"width .3s"}}/>
                    </div>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--muted)",whiteSpace:"nowrap"}}>{batch.processed}/{batch.total}</span>
                  </div>
                ):(
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--muted)"}}>
                    {batch.total>0?`Auto-match done · `:""}
                    <b style={{color:"#0f766e"}}>{batch.saved} saved</b> · {batch.skipped} skipped · {batch.errors} errors
                    {batch.lastMsg && ` · ${batch.lastMsg}`}
                  </span>
                )}
                {!batch.running && batch.processed>0 && (
                  <button onClick={()=>setBatch({running:false,total:0,processed:0,saved:0,skipped:0,errors:0,lastMsg:""})}
                    style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer",marginLeft:"auto"}}>dismiss</button>
                )}
              </div>
            )}
            {showFilters&&(
              <div style={{marginTop:10,padding:"14px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
                <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:140}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Author</span>
                  <select value={filterAuthor} onChange={e=>{setFA(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                    <option value="all">All Authors</option>
                    {authors.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:160}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Media Outlet</span>
                  <select value={filterMedia} onChange={e=>{setFM(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                    <option value="all">All Outlets</option>
                    {medias.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                {tiers.length>0&&(
                  <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:120}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Media Tier</span>
                    <select value={filterTier} onChange={e=>{setFT(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                      <option value="all">All Tiers</option>
                      {tiers.map(t=><option key={t} value={t}>Tier {t}</option>)}
                    </select>
                  </div>
                )}
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>From</span>
                  <input type="date" value={filterDateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>To</span>
                  <input type="date" value={filterDateTo} onChange={e=>{setDateTo(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
              </div>
            )}
            {hasFilters&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                {search&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>"{search}"</span>}
                {filterAuthor!=="all"&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>{filterAuthor}</span>}
                {filterMedia!=="all"&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>{filterMedia}</span>}
                {filterTier!=="all"&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>Tier {filterTier}</span>}
                {filterDateFrom&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>From {filterDateFrom}</span>}
                {filterDateTo&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>To {filterDateTo}</span>}
              </div>
            )}
          </div>
        );
      })()}
      <div className="cq-table-scroll"><div style={{minWidth:700}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 16px rgba(0,0,0,0.05)",animation:"fadeUp .5s ease .12s both"}}>
            <div style={{display:"grid",gridTemplateColumns:COLS,padding:"10px 20px",borderBottom:"2px solid var(--border)",background:"var(--surface3)"}}>
              {["Date","Media","Reporter","Author","Topic","Bounty","Link",""].map(h=><div key={h} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,letterSpacing:"0.08em",color:"var(--muted)",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</div>)}
            </div>
            {!citations.length
              ? <div style={{textAlign:"center",padding:"60px 20px"}}>
                  <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⬡</div>
                  <div style={{fontSize:14,fontWeight:500,color:"var(--muted)",marginBottom:6}}>No citations yet</div>
                  {canAdd&&<button onClick={()=>{setEdit(null);setShowForm(true)}} style={{marginTop:16,display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.07)",color:"var(--accent)",cursor:"pointer"}}><Icons.Plus/>ADD FIRST CITATION</button>}
                </div>
              : filtered.length===0
                ? <div style={{textAlign:"center",padding:"48px 20px"}}>
                    <div style={{fontSize:24,marginBottom:8,opacity:.25}}>⬡</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--muted)",marginBottom:4}}>No matches</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>Try clearing filters or widening the date range</div>
                  </div>
                : paged.map((c,i)=>{
                    const mc=getPaletteColor(AUTHOR_PALETTE,"media",c.media||"?");
                    const dp=fmtDate(c.date).split(", ");
                    const editable=canEdit(c);
                    return (
                      <div key={c.id} onClick={()=>setView(c)} style={{display:"grid",gridTemplateColumns:COLS,padding:"12px 20px",borderBottom:"1px solid var(--border)",alignItems:"center",transition:"background .15s",animation:`rowIn .3s ease ${i*.025}s both`,cursor:"pointer",background:i%2?"rgba(26,58,92,0.025)":"transparent"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.06)"}
                        onMouseLeave={e=>e.currentTarget.style.background=i%2?"rgba(26,58,92,0.025)":"transparent"}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>
                          <span style={{display:"block",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{dp[0]}</span>{dp[1]||""}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,paddingRight:8,minWidth:0}}>
                          <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:500,flexShrink:0,background:mc.bg,color:mc.color,border:"1px solid var(--border2)"}}>{initials(c.media)}</div>
                          <span title={c.media||""} style={{fontSize:11,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{c.media||"—"}</span>
                        </div>
                        <div title={c.reporter||""} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{c.reporter||"—"}</div>
                        <div title={c.author||""} onClick={e=>{if(c.author){e.stopPropagation();window.dispatchEvent(new CustomEvent("cq-nav-author",{detail:{name:c.author,cid:c.campaignId}}));}}} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:c.author?"var(--accent)":"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0,cursor:c.author?"pointer":"default",textDecoration:c.author?"underline":"none",textDecorationColor:"var(--border2)",textUnderlineOffset:2}}>{c.author||"—"}</div>
                        <div style={{paddingRight:8,minWidth:0}}>
                          <div title={c.topic||""} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{c.topic||"—"}</div>
                          {c.headline&&<div title={c.headline} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{c.headline}</div>}
                          <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                            {c.mediaTier&&(()=>{const tc=getTierColor(c.mediaTier);return <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 5px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color}}>{c.mediaTier}</span>})()}
                            {c.language&&c.language.toLowerCase()!=="english"&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(100,116,139,0.08)",border:"1px solid rgba(100,116,139,0.2)",color:"#475569"}}>{c.language}</span>}
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                          {(()=>{const cb = c.citedBountyId && bountyById[c.citedBountyId]; return cb && cb.cqLink
                            ? <a href={cb.cqLink} target="_blank" rel="noreferrer" title={cb.title||""} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,background:"rgba(15,118,110,0.08)",border:"1px solid rgba(15,118,110,0.25)",color:"#0f766e",textDecoration:"none",whiteSpace:"nowrap"}}>Bounty↗</a>
                            : <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",opacity:0.45}}>—</span>;})()}
                        </div>
                        <div style={{display:"flex",alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                          {c.articleLink
                            ? <a href={c.articleLink} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none",whiteSpace:"nowrap"}}>Article↗</a>
                            : <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",opacity:0.45}}>—</span>}
                        </div>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:4}} onClick={e=>e.stopPropagation()}>
                          {editable&&<RowBtn onClick={()=>{setEdit(c);setShowForm(true)}} title="Edit" hb="var(--accent)" hc="var(--accent)" hbg="rgba(26,58,92,0.06)"><Icons.Edit/></RowBtn>}
                          {editable&&<RowBtn onClick={()=>setConfId(c.id)} title="Delete" hb="var(--red)" hc="var(--red)" hbg="rgba(220,38,38,0.07)"><Icons.Trash/></RowBtn>}
                        </div>
                      </div>
                    );
                  })
            }
        <Pagination page={page} total={sortedFiltered.length} onChange={p=>{setPage(p);window.scrollTo({top:0,behavior:'smooth'})}}/>
      </div>
      </div></div>
      {view&&<CitationDetailModal entry={citations.find(c=>c.id===view.id)||view} canEdit={canEdit(view)} onEdit={()=>{setEdit(view);setShowForm(true);setView(null);}} onClose={()=>setView(null)} bounties={bounties} onCitedBountyUpdate={onCitedBountyUpdate}/>}
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

  const linkStyle = {fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textDecoration:"none"};
  const onLink  = e=>e.currentTarget.style.textDecoration="underline";
  const offLink = e=>e.currentTarget.style.textDecoration="none";

  const Section = ({title, count, children}) => (
    <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,marginBottom:16,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 22px",borderBottom:"1px solid var(--border)"}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,textTransform:"uppercase",letterSpacing:"0.12em",color:"var(--dim)",fontWeight:600}}>{title}</div>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--dim)"}}>{count}</span>
      </div>
      {children}
    </div>
  );

  const EmptyRow = ({msg}) => (
    <div style={{padding:"32px 22px",textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>{msg}</div>
  );

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      {viewBounty   && <BountyDetailModal   entry={viewBounty}   canEdit={false} onEdit={()=>{}} onClose={()=>setViewBounty(null)}/>}
      {viewCitation && <CitationDetailModal entry={viewCitation} canEdit={false} onEdit={()=>{}} onClose={()=>setViewCitation(null)}/>}

      <PageHeader label="// cq research" title="CQ Research"/>

      <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:28}}>
        <StatCard label="Bounties" value={bounties.length} sub="Posts published" c="var(--accent)"/>
        <StatCard label="Media Citations" value={cits.length} sub="Total coverage" c="#4a7fa8"/>
        <StatCard label="Media Outlets" value={uniqueOutlets.length} sub="Unique publications" c="var(--accent)"/>
      </div>

      {/* Leaderboards */}
      {(topHeadlines.length>0||topOutlets.length>0||tierEntries.length>0)&&(
        <div className="cq-3col" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:16}}>

          {/* Top Headlines */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Top Headlines</div>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{topHeadlines.length}</span>
            </div>
            {topHeadlines.length===0
              ?<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>No data</div>
              :<div style={{display:"flex",flexDirection:"column",gap:9}}>
                {topHeadlines.map((h,i)=>(
                  <div key={h.label}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{i+1}</span>
                        <span title={h.label} style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.label}</span>
                      </div>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"#4a7fa8",fontWeight:600,flexShrink:0,marginLeft:8}}>{h.count}</span>
                    </div>
                    <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                      <div style={{width:`${(h.count/maxHeadline)*100}%`,height:"100%",background:"#4a7fa8",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>

          {/* Top Outlets */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Top Outlets</div>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{uniqueOutlets.length}</span>
            </div>
            {topOutlets.length===0
              ?<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>No data</div>
              :<div style={{display:"flex",flexDirection:"column",gap:9}}>
                {topOutlets.map((o,i)=>(
                  <div key={o.label}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                      <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{i+1}</span>
                        <span title={o.label} style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.label}</span>
                      </div>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600,flexShrink:0,marginLeft:8}}>{o.count}</span>
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
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"18px 20px",boxShadow:"0 1px 4px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>Media Tier</div>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{cits.length} total</span>
            </div>
            {tierEntries.length===0
              ?<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>No tier data</div>
              :<div style={{display:"flex",flexDirection:"column",gap:10}}>
                {tierEntries.map(([tier,count])=>{
                  const tc=getTierColor(tier);
                  const pct=(count/cits.length)*100;
                  return (
                    <div key={tier}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color}}>Tier {tier}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,color:tc.color}}>{count} <span style={{color:"var(--dim)",fontWeight:400}}>({Math.round(pct)}%)</span></span>
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
                  <th key={h} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--dim)",fontWeight:600,padding:"10px 22px",textAlign:"left"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedBounties.map((b,i)=>(
                <tr key={b.id||i} onClick={()=>setViewBounty(b)} style={{borderBottom:"1px solid var(--border)",transition:"background .1s",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)",padding:"11px 22px",whiteSpace:"nowrap"}}>{b.date||"—"}</td>
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
                  <th key={h} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--dim)",fontWeight:600,padding:"10px 22px",textAlign:"left"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedCits.map((c,i)=>(
                <tr key={c.id||i} onClick={()=>setViewCitation(c)} style={{borderBottom:"1px solid var(--border)",transition:"background .1s",cursor:"pointer"}}
                  onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)",padding:"11px 22px",whiteSpace:"nowrap"}}>{c.date||"—"}</td>
                  <td style={{fontSize:13,fontWeight:500,color:"var(--text)",padding:"11px 22px",whiteSpace:"nowrap"}}>{c.media||"—"}</td>
                  <td style={{fontSize:12,color:"var(--muted)",padding:"11px 22px",maxWidth:360}}>
                    {c.headline&&<div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.headline}</div>}
                    {c.topic&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.topic}</div>}
                    {!c.headline&&!c.topic&&<span style={{color:"var(--dim)",opacity:0.45}}>—</span>}
                  </td>
                  <td style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)",padding:"11px 22px",whiteSpace:"nowrap"}}>{c.reporter||"—"}</td>
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

const AnalyticsTab = ({campaigns, citations, clientName}) => {
  const [range, setRange]           = useState("all");
  const [granularity, setGranularity] = useState("daily"); // "daily" | "weekly"

  const totalBounties  = campaigns.length;
  const totalCitations = citations.length;

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

  const {chartData, allWeeks, uniqueAuthors, uniqueOutlets, totalImpressions} = useMemo(()=>{
    const bucketMap = {};
    const addTo = (iso, key) => {
      if(!iso) return;
      const bkey = granularity === "daily" ? iso : getWeekKey(iso);
      if(!bkey) return;
      if(!bucketMap[bkey]) bucketMap[bkey] = {period:bkey, bounties:0, citations:0};
      bucketMap[bkey][key]++;
    };
    campaigns.forEach(c => addTo(c.date, "bounties"));
    citations.forEach(c => addTo(c.date, "citations"));

    const weekMap = {};
    campaigns.forEach(c => { if(!c.date) return; const wk=getWeekKey(c.date); if(wk){if(!weekMap[wk])weekMap[wk]={week:wk,bounties:0,citations:0};weekMap[wk].bounties++;} });
    citations.forEach(c => { if(!c.date) return; const wk=getWeekKey(c.date); if(wk){if(!weekMap[wk])weekMap[wk]={week:wk,bounties:0,citations:0};weekMap[wk].citations++;} });

    let allWeeks = Object.values(weekMap).sort((a,b)=>a.week.localeCompare(b.week));
    let allBuckets = Object.values(bucketMap).sort((a,b)=>a.period.localeCompare(b.period));

    if(range !== "all") {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - parseInt(range));
      const cutStr = cutoff.toISOString().slice(0,10);
      allWeeks   = allWeeks.filter(w => w.week >= cutStr);
      allBuckets = allBuckets.filter(b => b.period >= cutStr);
    }

    let cumB = 0, cumC = 0;
    const chartData = allBuckets.map(w => {
      cumB += w.bounties; cumC += w.citations;
      try {
        const d = new Date(w.period+"T00:00:00");
        const label = isNaN(d.getTime()) ? w.period : d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
        return { ...w, label, cumBounties: cumB, cumCitations: cumC };
      } catch { return { ...w, label: w.period, cumBounties: cumB, cumCitations: cumC }; }
    });

    const uniqueAuthors = [...new Set([...campaigns.map(c=>c.author),...citations.map(c=>c.author)].filter(Boolean))];
    const uniqueOutlets = [...new Set(citations.map(c=>c.media).filter(Boolean))];

    const rangeStart = allWeeks.length ? allWeeks[0].week : null;
    const inRange = arr => rangeStart ? arr.filter(c=>c.date&&c.date>=rangeStart) : arr;
    const parseNum = v => { if(!v) return 0; const s=String(v).replace(/,/g,"").trim(); if(/k$/i.test(s)) return Math.round(parseFloat(s)*1000); if(/m$/i.test(s)) return Math.round(parseFloat(s)*1000000); return parseInt(s)||0; };
    const totalImpressions = inRange(campaigns).reduce((s,c)=>s+parseNum(c.twitterImpressions)+parseNum(c.telegramImpressions),0);

    return {chartData, allWeeks, uniqueAuthors, uniqueOutlets, totalImpressions};
  },[campaigns, citations, range, granularity]);

  const fmtNum = n => n>=1000000 ? `${(n/1000000).toFixed(1)}M` : n>=1000 ? `${(n/1000).toFixed(0)}k` : n.toString();

  const SUMMARY = [
    {label:"Bounties",          value:totalBounties,           sub:"Posts published",       c:"var(--accent)"},
    {label:"Media Citations",   value:totalCitations,          sub:"Total coverage",         c:"#4a7fa8"},
    {label:"Authors",           value:uniqueAuthors.length,    sub:"Unique contributors",    c:"var(--accent)"},
    {label:"Media Outlets",     value:uniqueOutlets.length,    sub:"Unique publications",    c:"#4a7fa8"},
    {label:"Total Impressions", value:fmtNum(totalImpressions),sub:"Twitter + Telegram",     c:"var(--accent)"},
  ];

  const CustomTooltip = ({active,payload,label,nameMap={}}) => {
    if(!active||!payload?.length) return null;
    return (
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 16px",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",marginBottom:8}}>{label}</div>
        {payload.map(p=>(
          <div key={p.dataKey} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:p.color}}/>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)",textTransform:"capitalize"}}>{nameMap[p.dataKey]||p.dataKey}:</span>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:500,color:"var(--text)"}}>{p.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>// performance summary</div>
          <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>Analytics</h2>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["3","3M"],["6","6M"],["12","1Y"],["all","All"]].map(([val,label])=>(
            <button key={val} onClick={()=>setRange(val)}
              style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"6px 12px",borderRadius:7,border:`1px solid ${range===val?"rgba(26,58,92,0.25)":"var(--border)"}`,background:range===val?"rgba(26,58,92,0.07)":"transparent",color:range===val?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:range===val?700:400,transition:"all .15s"}}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards — 4 primary + impressions if available */}
      <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:`repeat(${totalImpressions>0?5:4},1fr)`,gap:14,marginBottom:28}}>
        {SUMMARY.slice(0, totalImpressions>0 ? 5 : 4).map((s,i)=>(
          <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderLeft:`3px solid ${s.c}`,borderRadius:10,padding:"16px 18px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:500,marginBottom:8}}>{s.label}</div>
            <div className="tabular" style={{fontSize:30,fontWeight:700,color:"var(--text)",lineHeight:1,marginBottom:6,letterSpacing:"-0.03em"}}>{s.value}</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div style={{textAlign:"center",padding:"60px 20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12}}>
          <div style={{fontSize:28,marginBottom:10,opacity:.25}}>⬡</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--dim)"}}>No data in selected range</div>
        </div>
      ) : (
        <>
          {/* Combined chart */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"24px",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{granularity === "daily" ? "Daily" : "Weekly"} Activity & Running Total</div>
                {/* Daily / Weekly toggle */}
                <div style={{display:"flex",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:6,padding:2,gap:1}}>
                  {[["weekly","Wk"],["daily","Day"]].map(([val,lbl])=>(
                    <button key={val} onClick={()=>setGranularity(val)}
                      style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 10px",borderRadius:5,border:"none",background:granularity===val?"var(--surface)":"transparent",color:granularity===val?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:granularity===val?700:400,boxShadow:granularity===val?"0 1px 3px rgba(0,0,0,0.1)":"none",transition:"all .15s"}}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                {[{color:"rgba(26,58,92,0.3)",label:`Bounties (${granularity==="daily"?"daily":"weekly"})`},{color:"rgba(74,127,168,0.5)",label:`Citations (${granularity==="daily"?"daily":"weekly"})`},{color:"#1a3a5c",label:"Bounties (total)",line:true},{color:"#4a7fa8",label:"Citations (total)",line:true}].map((l,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                    {l.line
                      ? <div style={{width:16,height:2,background:l.color,borderRadius:1}}/>
                      : <div style={{width:10,height:10,borderRadius:2,background:l.color}}/>}
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={chartData} margin={{top:4,right:48,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a3a5c" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#1a3a5c" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4a7fa8" stopOpacity={0.12}/>
                    <stop offset="95%" stopColor="#4a7fa8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false}/>
                <XAxis dataKey="label" tick={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fill:"#6e7f92"}} axisLine={false} tickLine={false} interval={Math.max(0,Math.ceil(chartData.length/(granularity==="daily"?10:8))-1)}/>
                <YAxis yAxisId="monthly" tick={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fill:"#6e7f92"}} axisLine={false} tickLine={false} width={28} allowDecimals={false}/>
                <YAxis yAxisId="cumulative" orientation="right" tick={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fill:"#6e7f92"}} axisLine={false} tickLine={false} width={36} allowDecimals={false}/>
                <Tooltip content={({active,payload,label})=>{
                  if(!active||!payload?.length) return null;
                  const names={bounties:`Bounties / ${granularity==="daily"?"day":"wk"}`,citations:`Citations / ${granularity==="daily"?"day":"wk"}`,cumBounties:"Total Bounties",cumCitations:"Total Citations"};
                  return (
                    <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 16px",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",marginBottom:8}}>{label}</div>
                      {payload.map(p=>(
                        <div key={p.dataKey} style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:p.color}}/>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>{names[p.dataKey]||p.dataKey}:</span>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:500,color:"var(--text)"}}>{p.value}</span>
                        </div>
                      ))}
                    </div>
                  );
                }}/>
                <Bar yAxisId="monthly" dataKey="bounties"  fill="#1a3a5c" fillOpacity={0.35} radius={[3,3,0,0]}/>
                <Bar yAxisId="monthly" dataKey="citations" fill="#4a7fa8" fillOpacity={0.35} radius={[3,3,0,0]}/>
                <Line yAxisId="cumulative" type="monotone" dataKey="cumBounties"  stroke="#1a3a5c" strokeWidth={2} dot={false} activeDot={{r:4}} strokeDasharray="0"/>
                <Line yAxisId="cumulative" type="monotone" dataKey="cumCitations" stroke="#4a7fa8" strokeWidth={2} dot={false} activeDot={{r:4}} strokeDasharray="0"/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Leaderboards — 3-column compact grid */}
          {(()=>{
            // Topics
            const topicMap = {};
            citations.forEach(c=>{
              const t=((c.headline||c.topic)||"").trim()||"Uncategorised";
              const tk=t.toLowerCase();
              if(!topicMap[tk]) topicMap[tk]={topic:t,count:0};
              topicMap[tk].count++;
            });
            const allTopics  = Object.values(topicMap).sort((a,b)=>b.count-a.count);
            const topTopics  = allTopics.slice(0,10);
            const maxTopic   = allTopics[0]?.count||1;

            // Authors
            const authorMap = {};
            campaigns.forEach(c=>{ const a=c.author||"Unknown"; const ak=a.toLowerCase(); if(!authorMap[ak]) authorMap[ak]={author:a,bounties:0,citations:0}; authorMap[ak].bounties++; });
            citations.forEach(c=>{ const a=c.author||"Unknown"; const ak=a.toLowerCase(); if(!authorMap[ak]) authorMap[ak]={author:a,bounties:0,citations:0}; authorMap[ak].citations++; });
            const allAuthors = Object.values(authorMap).sort((a,b)=>(b.bounties+b.citations)-(a.bounties+a.citations));
            const topAuthors = allAuthors.slice(0,5);
            const maxAuthor  = (allAuthors[0]?.bounties||0)+(allAuthors[0]?.citations||0)||1;

            // Outlets
            const mediaMap = {};
            citations.forEach(c=>{ const m=(c.media||"").trim()||"Unknown"; const mk=m.toLowerCase(); if(!mediaMap[mk]) mediaMap[mk]={media:m,count:0}; mediaMap[mk].count++; });
            const allOutlets = Object.values(mediaMap).sort((a,b)=>b.count-a.count);
            const topOutlets = allOutlets.slice(0,5);
            const maxOutlet  = allOutlets[0]?.count||1;

            // Media tiers (shared by Panel cards + "View all" modal)
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

            // "View all" modal
            const AllModal = ({title, onClose, children}) => (
              <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.55)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
                <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:14,width:"min(var(--modal-md),100%)",maxHeight:"80vh",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,0.18)",animation:"modalIn .2s ease"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 22px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--text)"}}>{title}</div>
                    <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)"}}><Icons.X/></button>
                  </div>
                  <div style={{overflowY:"auto",padding:"16px 22px"}}>{children}</div>
                </div>
              </div>
            );

            const ModalRow = ({rank,label,value,pct,color,sub}) => (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",width:20,flexShrink:0,textAlign:"right"}}>{rank}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:3}}>
                    <span title={label} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
                    <span className="tabular" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,color:color,flexShrink:0,marginLeft:10}}>{value}</span>
                  </div>
                  {sub&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginBottom:3}}>{sub}</div>}
                  <div style={{height:2,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:color,opacity:0.7,borderRadius:99}}/>
                  </div>
                </div>
              </div>
            );

            const Leaderboards = () => {
              const [modal,setModal] = useState(null); // "topics"|"authors"|"outlets"
              const [tierModal,setTierModal] = useState(null); // tier key or null

              const Panel = ({title,badge,onViewAll,children}) => (
                <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:"var(--r-lg)",padding:"20px 24px",boxShadow:"var(--shadow-sm)",minWidth:0,overflow:"hidden"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>{title}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {badge&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"2px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{badge}</span>}
                      {onViewAll&&<button onClick={onViewAll} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--accent)",background:"none",border:"none",cursor:"pointer",padding:0,letterSpacing:"0.04em"}}>View all →</button>}
                    </div>
                  </div>
                  {children}
                </div>
              );

              const Row = ({rank,label,value,pct,color="#1a3a5c",sub}) => (
                <div style={{marginBottom:10}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{rank}</span>
                      <div style={{minWidth:0}}>
                        <div title={label} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</div>
                        {sub&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:1}}>{sub}</div>}
                      </div>
                    </div>
                    <span className="tabular" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:600,color:color,flexShrink:0,marginLeft:8}}>{value}</span>
                  </div>
                  <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                    <div style={{width:`${pct}%`,height:"100%",background:color,opacity:0.75,borderRadius:99,transition:"width .5s ease"}}/>
                  </div>
                </div>
              );

              return (
                <>
                  {/* Row 1: Media Tier Breakdown — full width with rich per-tier cards */}
                  {tierEntries.length>0 && (
                    <div style={{marginTop:16}}>
                      <Panel title="Media Tier Breakdown" badge={`${totalTierCits} citations`}>
                        <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(tierEntries.length,4)},1fr)`,gap:14}}>
                            {tierEntries.map(([tier,data])=>{
                              const tc=getTierColor(tier);
                              const pct=(data.count/totalTierCits)*100;
                              const topOutlets=Object.values(data.outlets).sort((a,b)=>b.count-a.count).slice(0,3);
                              const sortedDates=[...data.dates].sort();
                              const lastDate=sortedDates[sortedDates.length-1]||null;
                              return (
                                <div
                                  key={tier}
                                  onClick={()=>setTierModal(tier)}
                                  onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 6px 18px ${tc.border}`;}}
                                  onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}
                                  title={`View all ${data.count} citation${data.count!==1?"s":""} in Tier ${tier}`}
                                  style={{position:"relative",background:"var(--surface)",border:`1px solid ${tc.border}`,borderRadius:10,padding:"16px 18px",overflow:"hidden",cursor:"pointer",transition:"transform .15s ease, box-shadow .15s ease"}}
                                >
                                  {/* Top accent stripe */}
                                  <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:tc.color}}/>

                                  {/* Tier badge + count */}
                                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,marginTop:4}}>
                                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:5,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color,letterSpacing:"0.04em"}}>TIER {tier}</span>
                                    <span className="tabular" style={{fontSize:22,fontWeight:700,color:tc.color,letterSpacing:"-0.02em",lineHeight:1}}>{data.count}</span>
                                  </div>

                                  {/* Pct bar */}
                                  <div style={{height:4,borderRadius:99,background:"var(--surface2)",overflow:"hidden",marginBottom:10}}>
                                    <div style={{width:`${pct}%`,height:"100%",background:tc.color,borderRadius:99,transition:"width .5s"}}/>
                                  </div>

                                  {/* Mini stats row */}
                                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>
                                    <span><span style={{color:tc.color,fontWeight:600}}>{Math.round(pct)}%</span> share</span>
                                    <span style={{color:"var(--border2)"}}>·</span>
                                    <span><span style={{color:"var(--text)",fontWeight:600}}>{data.authors.size}</span> author{data.authors.size!==1?"s":""}</span>
                                    <span style={{color:"var(--border2)"}}>·</span>
                                    <span><span style={{color:"var(--text)",fontWeight:600}}>{Object.keys(data.outlets).length}</span> outlet{Object.keys(data.outlets).length!==1?"s":""}</span>
                                  </div>

                                  {/* Top outlets */}
                                  <div style={{borderTop:"1px solid var(--border)",paddingTop:10}}>
                                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:7,fontWeight:600}}>Top Outlets</div>
                                    {topOutlets.length ? topOutlets.map((o,i)=>{
                                      const oPct=(o.count/data.count)*100;
                                      return (
                                        <div key={o.label} style={{marginBottom:i<topOutlets.length-1?6:0}}>
                                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8,marginBottom:3}}>
                                            <span title={o.label} style={{fontSize:11,color:"var(--text)",fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,minWidth:0}}>{o.label}</span>
                                            <span className="tabular" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:tc.color,fontWeight:600,flexShrink:0}}>{o.count}</span>
                                          </div>
                                          <div style={{height:2,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                                            <div style={{width:`${oPct}%`,height:"100%",background:tc.color,opacity:0.6,borderRadius:99}}/>
                                          </div>
                                        </div>
                                      );
                                    }) : <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",opacity:0.45}}>—</div>}
                                  </div>

                                  {/* Footer: last activity */}
                                  {lastDate && (
                                    <div style={{marginTop:10,paddingTop:8,borderTop:"1px solid var(--border)",fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.06em"}}>
                                      Last seen {lastDate}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </Panel>
                      </div>
                  )}

                  {/* Row 2: Top Topics — full width, 2 columns filled top-to-bottom */}
                  <div style={{marginTop:14}}>
                    <Panel title="Top Topics" badge={`${allTopics.length} total`} onViewAll={allTopics.length>10?()=>setModal("topics"):null}>
                      {topTopics.length ? (() => {
                        const half = Math.ceil(topTopics.length/2);
                        const leftCol  = topTopics.slice(0, half);
                        const rightCol = topTopics.slice(half);
                        return (
                          <div className="cq-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 32px"}}>
                            <div style={{minWidth:0}}>
                              {leftCol.map((r,i)=>(
                                <Row key={r.topic} rank={i+1} label={r.topic} value={r.count} pct={(r.count/maxTopic)*100} color="#4a7fa8"/>
                              ))}
                            </div>
                            <div style={{minWidth:0}}>
                              {rightCol.map((r,i)=>(
                                <Row key={r.topic} rank={half+i+1} label={r.topic} value={r.count} pct={(r.count/maxTopic)*100} color="#4a7fa8"/>
                              ))}
                            </div>
                          </div>
                        );
                      })() : <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>No data</div>}
                    </Panel>
                  </div>

                  {/* Row 2: Top Authors + Top Outlets */}
                  <div className="cq-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
                    <Panel title="Top Authors" badge={`${allAuthors.length} total`} onViewAll={allAuthors.length>5?()=>setModal("authors"):null}>
                      {topAuthors.length ? topAuthors.map((r,i)=>{
                        const total=r.bounties+r.citations;
                        return <Row key={r.author} rank={i+1} label={r.author} value={total} pct={(total/maxAuthor)*100} color="var(--accent)" sub={`${r.bounties}B · ${r.citations}C`}/>;
                      }) : <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>No data</div>}
                    </Panel>
                    <Panel title="Top Outlets" badge={`${allOutlets.length} total`} onViewAll={allOutlets.length>5?()=>setModal("outlets"):null}>
                      {topOutlets.length ? topOutlets.map((r,i)=>(
                        <Row key={r.media} rank={i+1} label={r.media} value={r.count} pct={(r.count/maxOutlet)*100} color="#4a7fa8"/>
                      )) : <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>No data</div>}
                    </Panel>
                  </div>

                  {/* Row 4: Language + Direct Relationship */}
                  {(()=>{
                    const langMap={}, drMap={};
                    citations.forEach(c=>{
                      if(c.language){const l=c.language.trim();const lk=normKey(l);if(lk)langMap[lk]=(langMap[lk]||0)+1;}
                      if(c.directRelationship){const d=c.directRelationship.trim();const dk=normKey(d);if(dk)drMap[dk]=(drMap[dk]||0)+1;}
                    });
                    const langEntries=Object.entries(langMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
                    const drEntries=Object.entries(drMap).sort((a,b)=>b[1]-a[1]);
                    const maxLang=langEntries[0]?.[1]||1;
                    const maxDR=drEntries[0]?.[1]||1;
                    if(!langEntries.length&&!drEntries.length) return null;
                    return (
                      <div className="cq-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
                        <Panel title="Language Breakdown" badge={`${langEntries.length} languages`}>
                          {langEntries.length ? langEntries.map(([lang,count],i)=>(
                            <Row key={lang} rank={i+1} label={lang} value={count} pct={(count/maxLang)*100} color="#4a7fa8"/>
                          )) : <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>No language data</div>}
                        </Panel>
                        <Panel title="Direct Relationship">
                          {drEntries.length ? drEntries.map(([dr,count],i)=>(
                            <Row key={dr} rank={i+1} label={dr} value={count} pct={(count/maxDR)*100} color="var(--accent)"/>
                          )) : <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>No data</div>}
                        </Panel>
                      </div>
                    );
                  })()}

                  {/* Row 3: Asset, Branding */}
                  {(()=>{
                    const assetMap={}, brandMap={};
                    citations.forEach(c=>{
                      if(c.asset){const a=c.asset.trim();const ak=normKey(a);if(ak)assetMap[ak]=(assetMap[ak]||0)+1;}
                      if(c.branding){const b=c.branding.trim();const bk=normKey(b);if(bk)brandMap[bk]=(brandMap[bk]||0)+1;}
                    });
                    const assetEntries=Object.entries(assetMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
                    const brandEntries=Object.entries(brandMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
                    const maxAsset=assetEntries[0]?.[1]||1;
                    const maxBrand=brandEntries[0]?.[1]||1;
                    if(!assetEntries.length&&!brandEntries.length) return null;
                    return (
                      <div className="cq-2col" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:14}}>
                        <Panel title="Top Assets">
                          {assetEntries.length ? assetEntries.map(([asset,count],i)=>(
                            <Row key={asset} rank={i+1} label={asset} value={count} pct={(count/maxAsset)*100} color="var(--accent)"/>
                          )) : <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>No asset data</div>}
                        </Panel>
                        <Panel title="Branding Mentions">
                          {brandEntries.length ? brandEntries.map(([brand,count],i)=>(
                            <Row key={brand} rank={i+1} label={brand} value={count} pct={(count/maxBrand)*100} color="#4a7fa8"/>
                          )) : <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>No branding data</div>}
                        </Panel>
                      </div>
                    );
                  })()}

                  {modal==="topics" && (
                    <AllModal title={`All Topics (${allTopics.length})`} onClose={()=>setModal(null)}>
                      {allTopics.map((r,i)=><ModalRow key={r.topic} rank={i+1} label={r.topic} value={r.count} pct={(r.count/maxTopic)*100} color="#4a7fa8"/>)}
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
                      {allOutlets.map((r,i)=><ModalRow key={r.media} rank={i+1} label={r.media} value={r.count} pct={(r.count/maxOutlet)*100} color="#4a7fa8"/>)}
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
                            <span className="tabular" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:tc.color,fontWeight:600,width:68,flexShrink:0,paddingTop:2}}>{c.date||"—"}</span>
                            <div style={{flex:1,minWidth:0}}>
                              <div title={c.headline||c.topic||""} style={{fontSize:12,color:"var(--text)",fontWeight:500,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.headline||c.topic||"—"}</div>
                              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                                {c.media||"—"}{c.author?` · ${c.author}`:""}
                              </div>
                            </div>
                            {c.articleLink?<a href={c.articleLink} target="_blank" rel="noopener noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none",flexShrink:0}}>↗ Read</a>:null}
                          </div>
                        )) : <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>No citations</div>}
                      </AllModal>
                    );
                  })()}
                </>
              );
            };

            return <Leaderboards/>;
          })()}
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
    const allDates = [...campaigns.map(c=>c.date),...citations.map(c=>c.date)].filter(Boolean).sort();
    if(!allDates.length) return;
    const lastDate = new Date(allDates[allDates.length-1]+"T00:00:00");
    const lastMonday = getMondayOf(lastDate);
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

  // Previous week for WoW delta
  const prevStart = new Date(weekStart); prevStart.setDate(prevStart.getDate()-7);
  const prevEnd   = new Date(weekStart); prevEnd.setDate(prevEnd.getDate()-1);
  const prevStartStr = prevStart.toISOString().slice(0,10);
  const prevEndStr   = prevEnd.toISOString().slice(0,10);
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
      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:col,display:"inline-flex",alignItems:"center",gap:3}}>
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
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>{item.author}</div>
        </>;
      }
      return <>
        <div title={item.topic||item.media} style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.topic||item.media}</div>
        {item.headline&&<div title={item.headline} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.headline}</div>}
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>{item.media}{item.reporter&&item.reporter!=="Publisher"?` · ${item.reporter}`:""}</div>
      </>;
    };
    const rowLink=(item)=>{
      const kind = itemKind==="mixed" ? item._type : itemKind;
      return kind==="bounty" ? item.cqLink : item.articleLink;
    };
    return (
      <div style={{animation:"fadeUp .4s ease both"}}>
        <button onClick={()=>setDrill(null)} style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",marginBottom:20}}>
          ← Back to Summary
        </button>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{dateRange}</div>
        <h3 style={{fontSize:18,fontWeight:600,letterSpacing:"-0.01em",marginBottom:20}}>{drillTitle} <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:400,color:"var(--dim)",marginLeft:8}}>{items.length}</span></h3>
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
          {sorted.length===0
            ?<div style={{padding:"40px",textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--dim)"}}>No activity this period</div>
            :<>
              <div style={{maxHeight:"520px",overflowY:"auto"}}>
                {visible.map((item,i)=>{
                  const link=rowLink(item);
                  return (
                  <div key={item.id} style={{display:"grid",gridTemplateColumns:"90px 1fr auto",alignItems:"center",gap:12,padding:"11px 20px",borderBottom:i<visible.length-1?"1px solid var(--border)":"none",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.04)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>{item.date}</div>
                    <div style={{minWidth:0}}>{renderRow(item)}</div>
                    {link&&(
                      <a href={link} target="_blank" rel="noreferrer"
                        style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:4,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.1)",color:"var(--accent)",textDecoration:"none",flexShrink:0}}>↗</a>
                    )}
                  </div>
                  );
                })}
              </div>
              {sorted.length>10&&(
                <button onClick={()=>setDrillExpanded(v=>!v)}
                  style={{width:"100%",padding:"10px",border:"none",borderTop:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
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
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{dateRange}</div>
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
                style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:6,border:"none",background:mode===m?"var(--surface)":"transparent",color:mode===m?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:mode===m?700:400,boxShadow:mode===m?"0 1px 3px rgba(0,0,0,0.08)":"none",transition:"all .15s"}}>
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
                style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"6px 12px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface)",color:"var(--muted)",cursor:"pointer",letterSpacing:"0.04em",transition:"all .15s"}}
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
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>→</span>
              <input type="date" value={customTo} onChange={e=>{setCustomTo(e.target.value);setDrill(null);}}
                style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards with WoW delta */}
      <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          {label:"Bounties",      curr:weekBounties.length,  prev:mode==="weekly"?prevBounties.length:null,  sub:"Posts published",   c:"var(--accent)", key:"bounties"},
          {label:"Citations",     curr:weekCitations.length, prev:mode==="weekly"?prevCitations.length:null, sub:"Media mentions",    c:"#4a7fa8",       key:"citations"},
          {label:"Active Authors",curr:authorsSet.size,      prev:null,                 sub:"Contributors",      c:"var(--accent)", key:null},
          {label:"Media Outlets", curr:outletsSet.size,      prev:null,                 sub:"Unique publications",c:"#4a7fa8",      key:null},
        ].map((s,i)=>(
          <div key={i} onClick={s.key?()=>{setDrill({type:s.key});setDrillExpanded(false);}:undefined}
            style={{background:"var(--surface)",border:"1px solid var(--border)",borderLeft:`3px solid ${s.c}`,borderRadius:10,padding:"16px 18px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)",cursor:s.key?"pointer":"default",transition:"all .15s"}}
            onMouseEnter={e=>{if(s.key){e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)";e.currentTarget.style.transform="translateY(-1px)";}}}
            onMouseLeave={e=>{if(s.key){e.currentTarget.style.boxShadow="0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.04)";e.currentTarget.style.transform="none";}}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>
              {s.label}{s.key&&<span style={{marginLeft:5,opacity:.4}}>→</span>}
            </div>
            <div className="tabular" style={{fontSize:30,fontWeight:700,letterSpacing:"-0.03em",color:s.curr===0?"var(--border2)":"var(--text)",lineHeight:1,marginBottom:6}}>{s.curr}</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>{s.sub}</div>
              {s.prev!==null&&<Delta curr={s.curr} prev={s.prev}/>}
            </div>
          </div>
        ))}
      </div>

      {/* Activity chart + recent feed — side by side */}
      <div className="cq-chart-row" style={{display:"grid",gridTemplateColumns:"1fr 300px",gap:14,marginBottom:14}}>

        {/* Daily bar chart */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexShrink:0}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Daily Activity</div>
            <div style={{display:"flex",gap:14}}>
              {[{color:"var(--accent)",label:"Bounties"},{color:"#4a7fa8",label:"Citations"}].map((l,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                  <div style={{width:8,height:8,borderRadius:2,background:l.color,opacity:.8}}/>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>{l.label}</span>
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
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:isEmpty?"transparent":"var(--accent)",fontWeight:600,marginBottom:3,height:13,flexShrink:0}}>{total||""}</div>
                  <div style={{flex:1,width:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"stretch",gap:0,position:"relative"}}>
                    {isEmpty
                      ? <div style={{width:"100%",height:"100%",background:"var(--surface2)",borderRadius:4,border:"1px dashed var(--border)"}}/>
                      : <>
                          {d.citations>0&&<div style={{width:"100%",height:`${cPct}%`,minHeight:4,background:"#4a7fa8",opacity:.75,borderRadius:d.bounties>0?"3px 3px 0 0":"3px 3px 0 0",transition:"height .4s ease"}}/>}
                          {d.bounties>0&&<div style={{width:"100%",height:`${bPct}%`,minHeight:4,background:"var(--accent)",opacity:.85,borderRadius:d.citations>0?"0":"3px 3px 0 0",transition:"height .4s ease"}}/>}
                          <div style={{height:2,background:color,width:"100%",opacity:.4,flexShrink:0}}/>
                        </>
                    }
                  </div>
                  <div style={{textAlign:"center",marginTop:7,flexShrink:0}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:600,color:isEmpty?"var(--border2)":"var(--text)"}}>{d.label}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--dim)"}}>{d.date}</div>
                  </div>
                </div>
              );
            })}
          </div>
          {totalActivity===0&&(
            <div style={{marginTop:8,textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",flexShrink:0}}>
              No activity recorded in this period
            </div>
          )}
        </div>

        {/* Recent entries feed */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",display:"flex",flexDirection:"column"}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Recent Activity</div>
          {recentAll.length===0
            ? <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,padding:"20px 0"}}>
                <div style={{fontSize:28,opacity:.15}}>◎</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textAlign:"center"}}>Nothing posted this week</div>
              </div>
            : <div style={{display:"flex",flexDirection:"column",gap:0,flex:1}}>
                {recentAll.map((item,i)=>(
                  <div key={item.id} style={{display:"flex",alignItems:"flex-start",gap:9,padding:"8px 0",borderBottom:i<recentAll.length-1?"1px solid var(--border)":"none"}}>
                    <div style={{width:5,height:5,borderRadius:"50%",background:item._type==="bounty"?"var(--accent)":"#4a7fa8",flexShrink:0,marginTop:5}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:1}}>
                        {item._type==="bounty"?item.title:(item.headline||item.media||"—")}
                      </div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>
                        {item._type==="bounty"?item.author:item.media} · {item.date}
                      </div>
                    </div>
                    {(item._type==="bounty"?item.cqLink:item.articleLink)&&(
                      <a href={item._type==="bounty"?item.cqLink:item.articleLink} target="_blank" rel="noreferrer"
                        style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--accent)",textDecoration:"none",flexShrink:0,opacity:.6}}>↗</a>
                    )}
                  </div>
                ))}
              </div>
          }
          {(weekBounties.length+weekCitations.length)>6&&(
            <div style={{marginTop:8,display:"flex",gap:8}}>
              {weekBounties.length>0&&<button onClick={()=>{setDrill({type:"bounties"});setDrillExpanded(false);}} style={{flex:1,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"5px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",letterSpacing:"0.04em",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)";e.currentTarget.style.borderColor="rgba(26,58,92,0.3)"}}
                onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)";e.currentTarget.style.borderColor="var(--border)"}}>
                All bounties →
              </button>}
              {weekCitations.length>0&&<button onClick={()=>{setDrill({type:"citations"});setDrillExpanded(false);}} style={{flex:1,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"5px",borderRadius:6,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",letterSpacing:"0.04em",transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.color="#4a7fa8";e.currentTarget.style.borderColor="rgba(74,127,168,0.3)"}}
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
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Top Headlines</div>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{topHeadlines.length}</span>
          </div>
          {topHeadlines.length===0
            ?<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No citations this week</div>
            :<div style={{display:"flex",flexDirection:"column",gap:9}}>
              {topHeadlines.map((h,i)=>(
                <div key={h.label} onClick={()=>{setDrill({type:"headline",value:h.label});setDrillExpanded(false);}}
                  style={{cursor:"pointer",borderRadius:6,padding:"4px 6px",margin:"-4px -6px",transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(74,127,168,0.06)"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{i+1}</span>
                      <span title={h.label} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.label}</span>
                    </div>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"#4a7fa8",fontWeight:600,flexShrink:0,marginLeft:8}}>{h.count}</span>
                  </div>
                  <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                    <div style={{width:`${(h.count/maxHeadline)*100}%`,height:"100%",background:"#4a7fa8",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        {/* Media Tier */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Media Tier</div>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{weekCitations.length} total</span>
          </div>
          {tierEntries.length===0
            ?<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No tier data this week</div>
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
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color}}>Tier {tier}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,color:tc.color}}>{count} <span style={{color:"var(--dim)",fontWeight:400}}>({Math.round(pct)}%)</span></span>
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
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Top Authors</div>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{authorsSet.size}</span>
            </div>
            {topAuthors.length===0
              ?<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No author activity</div>
              :<div style={{display:"flex",flexDirection:"column",gap:9}}>
                {topAuthors.map((a,i)=>{
                  const total=a.bounties+a.citations;
                  return (
                    <div key={a.name} onClick={()=>window.dispatchEvent(new CustomEvent("cq-nav-author",{detail:a.name}))}
                      style={{cursor:"pointer",borderRadius:6,padding:"4px 6px",margin:"-4px -6px",transition:"background .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.05)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",width:14,textAlign:"right"}}>{i+1}</span>
                          <span style={{fontSize:12,fontWeight:500,color:"var(--text)"}}>{a.name}</span>
                        </div>
                        <div style={{display:"flex",gap:8,alignItems:"center"}}>
                          {a.bounties>0&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--accent)",fontWeight:600}}>{a.bounties}b</span>}
                          {a.citations>0&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"#4a7fa8",fontWeight:600}}>{a.citations}c</span>}
                        </div>
                      </div>
                      <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                        <div style={{display:"flex",height:"100%"}}>
                          <div style={{width:`${maxAuthorTotal?(a.bounties/maxAuthorTotal)*100:0}%`,background:"var(--accent)",opacity:.8,transition:"width .4s"}}/>
                          <div style={{width:`${maxAuthorTotal?(a.citations/maxAuthorTotal)*100:0}%`,background:"#4a7fa8",opacity:.7,transition:"width .4s"}}/>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>

          {/* Top outlets */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Top Media Outlets</div>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"1px 7px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{outletsSet.size}</span>
            </div>
            {topOutlets.length===0
              ?<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No media coverage this week</div>
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
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",width:14,textAlign:"right"}}>{i+1}</span>
                        <span title={display} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{display}</span>
                      </div>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"#4a7fa8",fontWeight:600,flexShrink:0,marginLeft:8}}>{count}</span>
                    </div>
                    <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                      <div style={{width:`${(count/maxOutlet)*100}%`,height:"100%",background:"#4a7fa8",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
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
const PdfReportModal = ({campaigns, citations, campaignName, onClose}) => {
  const today = new Date().toISOString().slice(0,10);
  const earliest = [...campaigns.map(c=>c.date),...citations.map(c=>c.date)].filter(Boolean).sort()[0] || today;

  const [dateFrom, setDateFrom] = useState(earliest);
  const [dateTo,   setDateTo]   = useState(today);

  // Section toggles — all on by default except full lists
  const [inclStats,     setInclStats]     = useState(true);
  const [inclChart,     setInclChart]     = useState(true);
  const [inclAuthors,   setInclAuthors]   = useState(true);
  const [inclOutlets,   setInclOutlets]   = useState(true);
  const [inclTopics,    setInclTopics]    = useState(true);
  const [inclTier,      setInclTier]      = useState(true);
  const [inclLanguage,  setInclLanguage]  = useState(true);
  const [inclDR,        setInclDR]        = useState(true);
  const [inclAsset,     setInclAsset]     = useState(true);
  const [inclBranding,  setInclBranding]  = useState(true);
  const [inclImpr,      setInclImpr]      = useState(true);
  const [inclBounties,  setInclBounties]  = useState(false);
  const [inclCitations, setInclCitations] = useState(false);

  const b = campaigns.filter(c=>c.date&&c.date>=dateFrom&&c.date<=dateTo);
  const c = citations.filter(x=>x.date&&x.date>=dateFrom&&x.date<=dateTo);

  const generatePDF = () => {
    const uniqueAuthors  = [...new Set([...b.map(x=>x.author),...c.map(x=>x.author)].filter(Boolean))];
    const uniqueOutlets  = [...new Set(c.map(x=>x.media).filter(Boolean))];
    const uniqueAnalysts = [...new Set(b.map(x=>x.author).filter(Boolean))];
    const parseNum = v => { if(!v) return 0; const s=String(v).replace(/,/g,"").trim(); if(/k$/i.test(s)) return Math.round(parseFloat(s)*1000); if(/m$/i.test(s)) return Math.round(parseFloat(s)*1000000); return parseInt(s)||0; };
    const totalTwitter  = b.reduce((s,x)=>s+parseNum(x.twitterImpressions),0);
    const totalTelegram = b.reduce((s,x)=>s+parseNum(x.telegramImpressions),0);
    const totalImpr     = totalTwitter+totalTelegram;
    const fmtNum = n => n>=1000000?`${(n/1000000).toFixed(1)}M`:n>=1000?`${(n/1000).toFixed(0)}k`:String(n);

    const authorMap={};
    b.forEach(x=>{const ak=normKey(x.author||"—");if(!authorMap[ak])authorMap[ak]={name:x.author||"—",b:0,c:0};authorMap[ak].b++;});
    c.forEach(x=>{const ak=normKey(x.author||"—");if(!authorMap[ak])authorMap[ak]={name:x.author||"—",b:0,c:0};authorMap[ak].c++;});
    const topAuthors = Object.values(authorMap).sort((a,z)=>(z.b+z.c)-(a.b+a.c)).slice(0,10);
    const outletMap={};
    c.forEach(x=>{const mk=normKey(x.media||"—");outletMap[mk]=(outletMap[mk]||0)+1;});
    const topOutlets = Object.entries(outletMap).sort((a,z)=>z[1]-a[1]).slice(0,10);
    const topicMap={};
    c.forEach(x=>{const tk=normKey(((x.headline||x.topic)||"—").trim());topicMap[tk]=(topicMap[tk]||0)+1;});
    const topTopics = Object.entries(topicMap).sort((a,z)=>z[1]-a[1]).slice(0,10);

    const tierMap={},langMap={},drMap={},assetMap={},brandMap={};
    c.forEach(x=>{
      if(x.mediaTier){const k=normKey(String(x.mediaTier).trim());if(k)tierMap[k]=(tierMap[k]||0)+1;}
      if(x.language){const k=normKey(x.language.trim());if(k)langMap[k]=(langMap[k]||0)+1;}
      if(x.directRelationship){const k=normKey(x.directRelationship.trim());if(k)drMap[k]=(drMap[k]||0)+1;}
      if(x.asset){const k=normKey(x.asset.trim());if(k)assetMap[k]=(assetMap[k]||0)+1;}
      if(x.branding){const k=normKey(x.branding.trim());if(k)brandMap[k]=(brandMap[k]||0)+1;}
    });
    const tierEntries=Object.entries(tierMap).sort((a,z)=>a[0].localeCompare(z[0]));
    const langEntries=Object.entries(langMap).sort((a,z)=>z[1]-a[1]).slice(0,8);
    const drEntries=Object.entries(drMap).sort((a,z)=>z[1]-a[1]);
    const assetEntries=Object.entries(assetMap).sort((a,z)=>z[1]-a[1]).slice(0,8);
    const brandEntries=Object.entries(brandMap).sort((a,z)=>z[1]-a[1]).slice(0,8);
    // using global getTierColor

    const dayMap={};
    b.forEach(x=>{if(!x.date)return;if(!dayMap[x.date])dayMap[x.date]={wk:x.date,b:0,c:0};dayMap[x.date].b++;});
    c.forEach(x=>{if(!x.date)return;if(!dayMap[x.date])dayMap[x.date]={wk:x.date,b:0,c:0};dayMap[x.date].c++;});
    const weeks=Object.values(dayMap).sort((a,z)=>a.wk.localeCompare(z.wk));
    const maxWk=Math.max(...weeks.map(w=>w.b+w.c),1);
    const CW=760,BA=80,CH=110;
    const bW=weeks.length?Math.min(40,Math.floor(CW/weeks.length)-4):30;
    const gp=weeks.length>1?(CW-(bW*weeks.length))/(weeks.length-1):0;
    const le=Math.max(1,Math.ceil(weeks.length/8));
    const fmtMD=iso=>{try{const d=new Date(iso+"T00:00:00");return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});}catch{return iso;}};
    const bars=weeks.map((w,i)=>{const x=i*(bW+gp);const bH=maxWk?(w.b/maxWk)*BA:0;const cH=maxWk?(w.c/maxWk)*BA:0;return `<rect x="${x}" y="${BA-cH}" width="${bW}" height="${cH}" fill="#4a7fa8" opacity="0.75" rx="2"/><rect x="${x}" y="${BA-cH-bH}" width="${bW}" height="${bH}" fill="#1a3a5c" opacity="0.85" rx="2"/>${i%le===0?`<text x="${x+bW/2}" y="${CH+12}" text-anchor="middle" font-family="monospace" font-size="8" fill="#9ca3af">${fmtMD(w.wk)}</text>`:""}`; }).join("");
    const guides=[0,0.25,0.5,0.75,1].map(p=>{const y=BA-(p*BA);return `<line x1="0" y1="${y}" x2="${CW}" y2="${y}" stroke="#f3f4f6" stroke-width="1"/><text x="-4" y="${y+3}" text-anchor="end" font-family="monospace" font-size="7" fill="#d1d5db">${Math.round(p*maxWk)}</text>`;}).join("");
    const chartSvg=weeks.length?`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CW} ${CH+20}" width="${CW}" height="${CH+20}" style="overflow:visible">${guides}${bars}</svg>`:`<div style="text-align:center;font-family:monospace;font-size:10px;color:#9ca3af;padding:20px">No activity in selected range</div>`;

    const fmtD=iso=>{if(!iso)return"—";const [y,m,d]=iso.split("-");return`${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]||"?"} ${+d}, ${y}`;};
    const TH=s=>`<th style="font-family:monospace;font-size:7.5px;letter-spacing:0.08em;text-transform:uppercase;color:#6b7280;padding:5px 8px;background:#f9fafb;border-bottom:1px solid #e5e7eb;text-align:left">${s}</th>`;
    const TD=(s,extra="")=>`<td style="padding:5px 8px;border-bottom:1px solid #f3f4f6;color:#374151;vertical-align:top;${extra}">${s}</td>`;
    const sHdr=(t,n)=>`<div style="font-family:monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;font-weight:600;padding-bottom:6px;border-bottom:2px solid #e5e7eb;margin-bottom:12px">${t}${n!=null?` (${n})`:""}</div>`;
    const bRow=(rank,name,val,maxV,col="#1a3a5c")=>{const pct=(val/(maxV||1))*100;return `<tr><td style="font-family:monospace;color:#9ca3af;font-size:9px;width:18px;padding:5px 8px;border-bottom:1px solid #f3f4f6">${rank}</td><td style="padding:5px 8px;border-bottom:1px solid #f3f4f6"><div style="font-weight:500;margin-bottom:3px;font-size:10px">${name}</div><div style="height:3px;background:#e5e7eb;border-radius:99px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${col};opacity:0.75;border-radius:99px"></div></div></td><td style="font-family:monospace;font-weight:600;color:${col};text-align:right;padding:5px 8px;border-bottom:1px solid #f3f4f6;white-space:nowrap;font-size:10px">${val}</td></tr>`;};

    const numCols=inclStats?(totalImpr>0&&inclImpr?6:5):0;
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${campaignName} — Performance Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:11px;color:#111827;background:#fff;}
.page{padding:44px 52px;max-width:920px;margin:0 auto;}
.hdr{display:flex;align-items:flex-start;justify-content:space-between;padding-bottom:20px;border-bottom:2px solid #111827;margin-bottom:28px;}
.hdr h1{font-size:22px;font-weight:700;letter-spacing:-0.03em;margin-bottom:3px;}
.sub{font-family:monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;}
.hdr-r{text-align:right;font-family:monospace;font-size:9px;color:#6b7280;line-height:1.9;}
.stats{display:grid;grid-template-columns:repeat(${numCols||5},1fr);gap:10px;margin-bottom:24px;}
.stat{background:#f5f6f9;border-left:3px solid #1a3a5c;padding:10px 12px;border-radius:4px;}
.stat .lbl{font-family:monospace;font-size:7px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;margin-bottom:4px;}
.stat .val{font-size:20px;font-weight:700;letter-spacing:-0.03em;color:#111827;line-height:1;}
.chart-wrap{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:16px 16px 6px;margin-bottom:24px;overflow:hidden;}
.chart-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;}
.chart-title{font-family:monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;font-weight:600;}
.legend{display:flex;gap:14px;}
.leg-item{display:flex;align-items:center;gap:5px;font-family:monospace;font-size:8px;color:#6b7280;}
.leg-dot{width:8px;height:8px;border-radius:2px;}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;}
.panel{border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;}
.ph{font-family:monospace;font-size:9px;letter-spacing:0.1em;text-transform:uppercase;color:#6b7280;font-weight:600;padding:8px 10px;background:#f9fafb;border-bottom:1px solid #e5e7eb;}
.panel table{width:100%;border-collapse:collapse;font-size:10px;}
.section{margin-bottom:28px;}
.footer{padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-family:monospace;font-size:8.5px;color:#9ca3af;margin-top:28px;}
table.full{width:100%;border-collapse:collapse;font-size:9px;}
table.full tr:nth-child(even) td{background:#fafafa;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}.page{padding:28px 36px;}}
</style></head><body><div class="page">

<div class="hdr">
  <div><h1>${campaignName}</h1><div class="sub">Campaign Performance Report</div></div>
  <div class="hdr-r"><div>Period: ${fmtD(dateFrom)} – ${fmtD(dateTo)}</div><div>Generated: ${fmtD(today)}</div><div>CryptoQuant Bounty Tracker</div></div>
</div>

${inclStats?`<div class="stats">
  <div class="stat"><div class="lbl">Bounties</div><div class="val">${b.length}</div></div>
  <div class="stat"><div class="lbl">Citations</div><div class="val">${c.length}</div></div>
  <div class="stat"><div class="lbl">Unique Analysts</div><div class="val">${uniqueAnalysts.length}</div></div>
  <div class="stat"><div class="lbl">Authors</div><div class="val">${uniqueAuthors.length}</div></div>
  <div class="stat"><div class="lbl">Media Outlets</div><div class="val">${uniqueOutlets.length}</div></div>
  ${totalImpr>0&&inclImpr?`<div class="stat"><div class="lbl">Total Impressions</div><div class="val">${fmtNum(totalImpr)}</div></div>`:""}
</div>`:""}

${inclChart?`<div class="chart-wrap">
  <div class="chart-hdr">
    <div class="chart-title">Daily Activity</div>
    <div class="legend">
      <div class="leg-item"><div class="leg-dot" style="background:#1a3a5c;opacity:0.85"></div>Bounties</div>
      <div class="leg-item"><div class="leg-dot" style="background:#4a7fa8;opacity:0.75"></div>Citations</div>
    </div>
  </div>
  ${chartSvg}
</div>`:""}

${(inclAuthors&&topAuthors.length)||(inclOutlets&&topOutlets.length)||(inclTopics&&topTopics.length)?`<div class="grid3">
  ${inclAuthors&&topAuthors.length?`<div class="panel"><div class="ph">Top Authors</div><table><tbody>${topAuthors.map((a,i)=>bRow(i+1,a.name,a.b+a.c,(topAuthors[0].b+topAuthors[0].c)||1)).join("")}</tbody></table></div>`:"<div></div>"}
  ${inclOutlets&&topOutlets.length?`<div class="panel"><div class="ph">Top Media Outlets</div><table><tbody>${topOutlets.map(([n,v],i)=>bRow(i+1,n,v,topOutlets[0][1],"#4a7fa8")).join("")}</tbody></table></div>`:"<div></div>"}
  ${inclTopics&&topTopics.length?`<div class="panel"><div class="ph">Top Headlines</div><table><tbody>${topTopics.map(([t,v],i)=>bRow(i+1,t,v,topTopics[0][1],"#4a7fa8")).join("")}</tbody></table></div>`:"<div></div>"}
</div>`:""}

${(inclTier&&tierEntries.length)||(inclLanguage&&langEntries.length)||(inclDR&&drEntries.length)?`<div class="grid3">
  ${inclTier&&tierEntries.length?`<div class="panel"><div class="ph">Media Tier Breakdown</div><table><tbody>${tierEntries.map(([tier,n])=>{const tc=getTierColor(tier);const pct=Math.round((n/c.length)*100);return`<tr><td style="padding:7px 10px;border-bottom:1px solid #f3f4f6"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><span style="font-family:monospace;font-weight:600;font-size:10px;padding:2px 8px;border-radius:4px;background:${tc.bg};border:1px solid ${tc.border};color:${tc.color}">Tier ${tier}</span><span style="font-family:monospace;font-size:10px;color:#374151">${n} (${pct}%)</span></div><div style="height:4px;background:#e5e7eb;border-radius:99px;overflow:hidden"><div style="width:${pct}%;height:100%;background:${tc.color};border-radius:99px"></div></div></td></tr>`;}).join("")}</tbody></table></div>`:"<div></div>"}
  ${inclLanguage&&langEntries.length?`<div class="panel"><div class="ph">Language Breakdown</div><table><tbody>${langEntries.map(([l,v],i)=>bRow(i+1,l,v,langEntries[0][1],"#4a7fa8")).join("")}</tbody></table></div>`:"<div></div>"}
  ${inclDR&&drEntries.length?`<div class="panel"><div class="ph">Direct Relationship</div><table><tbody>${drEntries.map(([d,v],i)=>bRow(i+1,d,v,drEntries[0][1])).join("")}</tbody></table></div>`:"<div></div>"}
</div>`:""}

${(inclAsset&&assetEntries.length)||(inclBranding&&brandEntries.length)?`<div class="grid2">
  ${inclAsset&&assetEntries.length?`<div class="panel"><div class="ph">Top Assets</div><table><tbody>${assetEntries.map(([a,v],i)=>bRow(i+1,a,v,assetEntries[0][1])).join("")}</tbody></table></div>`:"<div></div>"}
  ${inclBranding&&brandEntries.length?`<div class="panel"><div class="ph">Branding Mentions</div><table><tbody>${brandEntries.map(([a,v],i)=>bRow(i+1,a,v,brandEntries[0][1],"#4a7fa8")).join("")}</tbody></table></div>`:"<div></div>"}
</div>`:""}

${inclImpr&&totalImpr>0?`<div class="grid2" style="margin-bottom:24px">
  <div class="stat"><div class="lbl">Twitter Impressions</div><div class="val">${fmtNum(totalTwitter)}</div></div>
  <div class="stat"><div class="lbl">Telegram Impressions</div><div class="val">${fmtNum(totalTelegram)}</div></div>
</div>`:""}

<div class="footer">
  <span>CryptoQuant Bounty Program · ${campaignName}</span>
  <span>Generated ${new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"})}</span>
</div>

${inclBounties&&b.length?`<div class="section" style="margin-top:36px">
  ${sHdr("All Bounties",b.length)}
  <table class="full"><thead><tr>${["Date","Title","Author","Category","Asset","Twitter Impr","Telegram Impr","Links"].map(TH).join("")}</tr></thead>
  <tbody>${[...b].sort((a,z)=>(z.date||"").localeCompare(a.date||"")).map((x,i)=>`<tr style="${i%2===0?"":"background:#fafafa"}">
    ${TD(x.date||"—","font-family:monospace;font-size:8px;color:#6b7280;white-space:nowrap")}
    ${TD(`<span style="font-weight:500">${(x.title||"—").slice(0,80)}${x.title&&x.title.length>80?"…":""}</span>`)}
    ${TD(x.author||"—")}
    ${TD(x.category||"—")}
    ${TD(x.asset||"—")}
    ${TD(x.twitterImpressions?Number(String(x.twitterImpressions).replace(/,/g,"")).toLocaleString():"—","text-align:right;font-family:monospace;font-size:9px")}
    ${TD(x.telegramImpressions?Number(String(x.telegramImpressions).replace(/,/g,"")).toLocaleString():"—","text-align:right;font-family:monospace;font-size:9px")}
    ${TD([x.cqLink?`<a href="${x.cqLink}" style="color:#1a3a5c;font-size:8px;font-family:monospace;text-decoration:none;margin-right:4px">QT↗</a>`:"",x.cqTwitterLink?`<a href="${x.cqTwitterLink}" style="color:#1a3a5c;font-size:8px;font-family:monospace;text-decoration:none">X↗</a>`:""].filter(Boolean).join("")||"—")}
  </tr>`).join("")}</tbody></table>
</div>`:""}

${inclCitations&&c.length?`<div class="section" style="margin-top:36px">
  ${sHdr("All Media Citations",c.length)}
  <table class="full"><thead><tr>${["Date","Outlet","Reporter","Headline / Topic","Tier","Lang","Direct Rel","Asset","Branding","Link"].map(TH).join("")}</tr></thead>
  <tbody>${[...c].sort((a,z)=>(z.date||"").localeCompare(a.date||"")).map((x,i)=>`<tr style="${i%2===0?"":"background:#fafafa"}">
    ${TD(x.date||"—","font-family:monospace;font-size:8px;color:#6b7280;white-space:nowrap")}
    ${TD(`<span style="font-weight:500">${x.media||"—"}</span>`)}
    ${TD(x.reporter||"—")}
    ${TD(`${x.headline?`<div style="font-weight:500">${x.headline.slice(0,60)+(x.headline.length>60?"…":"")}</div>`:""}${x.topic?`<div style="font-size:8px;color:#6b7280;margin-top:1px">${x.topic}</div>`:""}`||"—")}
    ${TD(x.mediaTier||"—","font-family:monospace;text-align:center")}
    ${TD(x.language||"—")}
    ${TD(x.directRelationship||"—")}
    ${TD(x.asset||"—")}
    ${TD(x.branding||"—")}
    ${TD(x.articleLink?`<a href="${x.articleLink}" style="color:#1a3a5c;font-size:8px;font-family:monospace;text-decoration:none">↗</a>`:"—")}
  </tr>`).join("")}</tbody></table>
</div>`:""}

</div></body></html>`;

    const w=window.open("","_blank","width=1100,height=900");
    w.document.write(html);
    w.document.close();
    w.onload=()=>w.print();
  };

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.55)",backdropFilter:"blur(6px)",zIndex:400,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:14,width:"min(var(--modal-md),100%)",display:"flex",flexDirection:"column",boxShadow:"0 24px 64px rgba(0,0,0,0.18)",animation:"modalIn .2s ease"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:"var(--text)",letterSpacing:"-0.01em"}}>Download Report</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",marginTop:2}}>{campaignName}</div>
          </div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--muted)"}}><Icons.X/></button>
        </div>

        {/* Body */}
        <div style={{padding:"20px 24px",overflowY:"auto",maxHeight:"70vh"}}>
          {/* Date range */}
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Date Range</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <Field label="From">
              <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{...iStyle,padding:"9px 12px",fontSize:12}}/>
            </Field>
            <Field label="To">
              <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{...iStyle,padding:"9px 12px",fontSize:12}}/>
            </Field>
          </div>

          {/* Live preview counts */}
          <div className="cq-3col" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:20}}>
            {[
              {label:"Bounties",  value:b.length,  c:"var(--accent)"},
              {label:"Citations", value:c.length,  c:"#4a7fa8"},
              {label:"Authors",   value:[...new Set([...b.map(x=>x.author),...c.map(x=>x.author)].filter(Boolean))].length, c:"var(--accent)"},
            ].map(s=>(
              <div key={s.label} style={{background:"var(--surface2)",border:"1px solid var(--border)",borderLeft:`3px solid ${s.c}`,borderRadius:7,padding:"9px 12px"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:3}}>{s.label}</div>
                <div className="tabular" style={{fontSize:20,fontWeight:700,color:"var(--text)",letterSpacing:"-0.02em"}}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Section checkboxes */}
          {(()=>{
            const Check = ({label, checked, onChange, sub}) => (
              <label style={{display:"flex",alignItems:"flex-start",gap:9,cursor:"pointer",padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
                <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}
                  style={{width:14,height:14,cursor:"pointer",accentColor:"var(--accent)",marginTop:2,flexShrink:0}}/>
                <div>
                  <div style={{fontSize:12,color:"var(--text)",fontWeight:500}}>{label}</div>
                  {sub&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:1}}>{sub}</div>}
                </div>
              </label>
            );
            return (
              <div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.12em",color:"var(--dim)",textTransform:"uppercase",marginBottom:6}}>Summary</div>
                <Check label="Stat cards" sub="Bounties, Citations, Authors, Outlets, Impressions" checked={inclStats} onChange={setInclStats}/>
                <Check label="Weekly activity chart" checked={inclChart} onChange={setInclChart}/>
                {inclStats&&<Check label="Impression breakdown" sub="Twitter + Telegram split (if data exists)" checked={inclImpr} onChange={setInclImpr}/>}

                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.12em",color:"var(--dim)",textTransform:"uppercase",marginTop:12,marginBottom:6}}>Leaderboards</div>
                <Check label="Top Authors" checked={inclAuthors} onChange={setInclAuthors}/>
                <Check label="Top Media Outlets" checked={inclOutlets} onChange={setInclOutlets}/>
                <Check label="Top Headlines" checked={inclTopics} onChange={setInclTopics}/>

                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.12em",color:"var(--dim)",textTransform:"uppercase",marginTop:12,marginBottom:6}}>Citation Breakdowns</div>
                <Check label="Media Tier Breakdown" checked={inclTier} onChange={setInclTier}/>
                <Check label="Language Breakdown" checked={inclLanguage} onChange={setInclLanguage}/>
                <Check label="Direct Relationship" checked={inclDR} onChange={setInclDR}/>
                <Check label="Top Assets" checked={inclAsset} onChange={setInclAsset}/>
                <Check label="Branding Mentions" checked={inclBranding} onChange={setInclBranding}/>

                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.12em",color:"var(--dim)",textTransform:"uppercase",marginTop:12,marginBottom:6}}>Full Data Tables (appended at end)</div>
                <Check label={`All bounties (${b.length})`} sub="Date, Title, Author, Category, Asset, Impressions, Links" checked={inclBounties} onChange={setInclBounties}/>
                <Check label={`All media citations (${c.length})`} sub="Date, Outlet, Reporter, Topic, Tier, Language, Direct Rel, Asset, Branding, Link" checked={inclCitations} onChange={setInclCitations}/>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div style={{padding:"14px 24px",borderTop:"1px solid var(--border)",display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 20px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
          <button onClick={generatePDF}
            style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 20px",borderRadius:8,border:"none",background:"#0d1f33",color:"#fff",cursor:"pointer",fontWeight:600,display:"flex",alignItems:"center",gap:7,letterSpacing:"0.04em"}}
            onMouseEnter={e=>e.currentTarget.style.background="#1a3a5c"}
            onMouseLeave={e=>e.currentTarget.style.background="#0d1f33"}>
            ↓ GENERATE PDF
          </button>
        </div>

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  CAMPAIGNS PANEL (Admin only)
// ─────────────────────────────────────────────────────────
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
  const handleSave = async () => {
    if (!name.trim()){alert("Campaign name required.");return;}
    setSaving(true); await onSave({name:name.trim(),color,status,sheetBounties:dataMode==="sheets"?sheetBounties:"",sheetMedia:dataMode==="sheets"?sheetMedia:"",sheetLink}); setSaving(false);
  };
  return (
    <Portal>
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:20,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",width:"min(var(--modal-md),100%)",maxHeight:"90vh",overflowY:"auto",padding:32,position:"relative",animation:"modalIn .25s ease"}}>
        <button onClick={onClose} style={{position:"absolute",top:18,right:18,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.1em",color:"var(--yellow)",textTransform:"uppercase",marginBottom:6}}>// {isEdit?"edit":"new"} campaign</div>
        <div style={{fontSize:20,fontWeight:500,marginBottom:24}}>{isEdit?"Edit Campaign":"New Campaign"}</div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Field label="Campaign Name">
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Binance, NEXO, Kraken" style={iStyle}/>
          </Field>
          <Field label="Color">
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{position:"relative",width:40,height:40,borderRadius:10,overflow:"hidden",border:"2px solid var(--border)",cursor:"pointer",flexShrink:0}} title="Pick a color">
                <div style={{width:"100%",height:"100%",background:color}}/>
                <input type="color" value={color.startsWith("#")?color:"#1a3a5c"} onChange={e=>setColor(e.target.value)}
                  style={{position:"absolute",inset:0,opacity:0,width:"100%",height:"100%",cursor:"pointer",border:"none",padding:0}}/>
              </div>
              <div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text)",fontWeight:500}}>{color.toUpperCase()}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:2}}>Click swatch to change</div>
              </div>
            </div>
          </Field>
          <Field label="Status">
            <button onClick={()=>setStatus(status==="active"?"completed":"active")}
              style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:`1px solid ${status==="active"?"rgba(22,101,52,0.4)":"rgba(100,116,139,0.4)"}`,background:status==="active"?"rgba(22,101,52,0.08)":"rgba(100,116,139,0.08)",color:status==="active"?"#166534":"#475569",cursor:"pointer",textTransform:"uppercase",letterSpacing:"0.06em",transition:"all .15s",width:"100%"}}>
              {status==="active"?"● Active":"✓ Completed"}
            </button>
          </Field>
          <div style={{paddingTop:16,borderTop:"1px solid var(--border)"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Data Entry Mode</div>
            <div style={{display:"flex",gap:8,marginBottom:14}}>
              {[{id:"manual",label:"✏ Manual Entry"},{id:"sheets",label:"⟳ Google Sheets"}].map(m=>(
                <button key={m.id} onClick={()=>setDataMode(m.id)}
                  style={{flex:1,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px",borderRadius:8,
                    border:`1px solid ${dataMode===m.id?"rgba(26,58,92,0.3)":"var(--border)"}`,
                    background:dataMode===m.id?"rgba(26,58,92,0.08)":"transparent",
                    color:dataMode===m.id?"var(--accent)":"var(--muted)",
                    cursor:"pointer",transition:"all .15s"}}>
                  {m.label}
                </button>
              ))}
            </div>
            {dataMode==="manual"&&(
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"8px 10px",background:"var(--surface2)",borderRadius:6,lineHeight:1.6}}>
                Data will be entered manually through the Bounties and Media Citations tabs.
              </div>
            )}
            {dataMode==="sheets"&&(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                <Field label="Bounties Sheet CSV URL">
                  <input value={sheetBounties} onChange={e=>setSheetBounties(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..." style={iStyle}/>
                </Field>
                <Field label="Media Citations Sheet CSV URL">
                  <input value={sheetMedia} onChange={e=>setSheetMedia(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=..." style={iStyle}/>
                </Field>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"8px 10px",background:"var(--surface2)",borderRadius:6,lineHeight:1.6}}>
                  Sheet must be "Anyone with the link can view". Change /edit to /export?format=csv in the URL.
                </div>
              </div>
            )}
            <div style={{paddingTop:14,borderTop:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>General Spreadsheet Link</div>
              <Field label="Google Sheet URL" full>
                <input value={sheetLink} onChange={e=>setSheetLink(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." style={iStyle}/>
              </Field>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:6}}>A direct link to the full Google Sheet for this campaign (visible to all users).</div>
            </div>
            {false&&(
              <span/>
            )}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"var(--surface2)",borderRadius:10,border:"1px solid var(--border)"}}>
            <div style={{width:36,height:36,borderRadius:10,background:color+"18",border:`1px solid ${color}55`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:color}}>{name?initials(name):"??"}</div>
            <div>
              <div style={{fontSize:13,fontWeight:500,color:color}}>{name||"Campaign Name"}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>Preview</div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:24,paddingTop:20,borderTop:"1px solid var(--border)"}}>
          <button onClick={onClose} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
          <button onClick={handleSave} disabled={saving} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 22px",borderRadius:8,border:"1px solid rgba(217,119,6,0.35)",background:"rgba(26,58,92,0.07)",color:"var(--yellow)",cursor:"pointer",fontWeight:500,display:"flex",alignItems:"center",gap:7}}>
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
  const isSyncing = useRef(false);
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
    // If it doesn't look like a valid date, return empty string instead of garbage
    const test = new Date(s);
    if(isNaN(test.getTime())) return "";
    return s;
  };
  const parseCSV = (text) => {
    const lines = text.split("\n").map(l=>l.replace(/\r$/,"")).filter(l=>l.trim());
    const firstCol = l => l.split(",")[0].replace(/^"|"$/g,"").replace(/\*/g,"").trim().toLowerCase();
    const headerIdx = lines.findIndex(l=>firstCol(l)==="date"||firstCol(l)==="no");
    if(headerIdx===-1) return [];
    const headers = lines[headerIdx].split(",").map(h=>h.replace(/^"|"$/g,"").replace(/\*/g,"").trim().toLowerCase());
    return lines.slice(headerIdx+1).map(line=>{
      const vals=[]; let cur="",inQ=false;
      for(let ch of line){if(ch==='"'){inQ=!inQ;}else if(ch===","&&!inQ){vals.push(cur.trim());cur="";}else{cur+=ch;}}
      vals.push(cur.trim());
      return Object.fromEntries(headers.map((h,i)=>[h,vals[i]?.replace(/^"|"$/g,"")||""]));
    }).filter(r=>{const d=(r["date"]||"").trim();const n=(r["no"]||"").trim();if(n&&isNaN(Number(n)))return false;return d&&!d.toLowerCase().startsWith("yyyy")&&!d.toLowerCase().startsWith("date");});
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
      const {data:existingB} = await supabase.from("bounties").select("cq_link,sheet_row_no").eq("campaign_id",program.id);
      const {data:existingM} = await supabase.from("citations").select("article_link,sheet_row_no").eq("campaign_id",program.id);
      const exB = existingB||[], exM = existingM||[];
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
            const inNew=newBounties.some(b=>rowNo?b.sheetRowNo===rowNo:(link&&b.cqLink===link));
            const inDB=rowNo?exB.some(b=>b.sheet_row_no===rowNo):(link&&exB.some(b=>b.cq_link===link));
            if(inNew||inDB){skipped++;continue;}
            newBounties.push({id:uid(),campaignId:program.id,date:normalizeDate(r["date"]),author:norm(r["author"]),title,cqLink:link,analyticsLink:safe(r["analytics link"]||r["cq analytics link"]),authorTwitterLink:safe(r["author twitter/x"]||r["analyst twitter/x post"]),cqTwitterLink:safe(r["cq twitter/x"]||r["twitter/x link"]),telegramLink:safe(r["telegram link"]),category:titleCase(safe(r["category"])),asset:titleCase(safe(r["asset"])),twitterImpressions:safe(r["twitter impressions"]||r["cq twitter/x impressions"]),telegramImpressions:safe(r["telegram impressions"]),sheetRowNo:rowNo,createdBy:"sheet_sync"});
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
            const inNewM=newMedia.some(m=>rowNo2?m.sheetRowNo===rowNo2:(link&&m.articleLink===link));
            const inDBM=rowNo2?exM.some(m=>m.sheet_row_no===rowNo2):(link&&exM.some(m=>m.article_link===link));
            if(inNewM||inDBM){skipped++;continue;}
            newMedia.push({id:uid(),campaignId:program.id,date:normalizeDate(r["date"]),media:titleCase(media),reporter:titleCase(safe(r["reporter"])),author:norm(r["author"]),topic:titleCase(safe(r["topic"])),articleLink:link,headline:safe(r["headline"]),mediaTier:safe(r["media tier"]),directRelationship:titleCase(safe(r["direct relationship"])),language:titleCase(safe(r["language"])),asset:titleCase(safe(r["asset"])),branding:titleCase(safe(r["branding"])),sheetRowNo:rowNo2,createdBy:"sheet_sync"});
          }catch(rowErr){badRows++;console.warn("Skipped bad media row:",rowErr,r);}
        }
      }
      if(newBounties.length){await db.batchInsertBounties(newBounties);setCampaigns(prev=>[...newBounties,...prev]);added+=newBounties.length;}
      if(newMedia.length){await db.batchInsertCitations(newMedia);setCitations(prev=>[...newMedia,...prev]);added+=newMedia.length;}
      setResult(`✓ ${added} added, ${skipped} skipped`+(badRows?`, ${badRows} bad row${badRows>1?"s":""} skipped`:""));
    } catch(err){ setResult(`Error: ${err.message}`); }
    setSyncing(false);
    isSyncing.current = false;
  };
  return (
    <div style={{display:"flex",alignItems:darkMode?"stretch":"center",flexDirection:darkMode?"column":"row",gap:darkMode?6:8}}>
      <button onClick={doSync} disabled={syncing}
        style={darkMode
          ? {display:"flex",alignItems:"center",justifyContent:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,0.15)",background:"rgba(255,255,255,0.08)",color:"#ffffff",cursor:"pointer",transition:"all .15s",width:"100%",letterSpacing:"0.04em"}
          : {display:"flex",alignItems:"center",gap:5,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.06)",color:"var(--accent)",cursor:"pointer",transition:"all .15s"}
        }>
        {syncing?<><Icons.Spin/>Syncing…</>:"⟳ Sync Sheet"}
      </button>
      {result&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:darkMode?10:9,color:darkMode?(result.startsWith("✓")?"rgba(134,239,172,0.9)":"rgba(252,165,165,0.9)"):(result.startsWith("✓")?"#166534":"var(--red)"),textAlign:darkMode?"center":"left",padding:darkMode?"4px 8px":"0",background:darkMode?(result.startsWith("✓")?"rgba(134,239,172,0.08)":"rgba(252,165,165,0.08)"):"transparent",borderRadius:darkMode?6:0,border:darkMode?`1px solid ${result.startsWith("✓")?"rgba(134,239,172,0.2)":"rgba(252,165,165,0.2)"}`:"none"}}>{result}</span>}
    </div>
  );
};

const CampaignsPanel = ({programs,campaigns,citations,onSave,onDelete,onSaveCamp,onDeleteCamp,onSaveMedia,onDeleteMedia,currentUser,showToast,setCampaigns,setCitations,onSelectCampaign}) => {
  const [showForm,setShowForm]   = useState(false);
  const [editClient,setEdit]     = useState(null);
  const [confirmId,setConfId]    = useState(null);

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>// bounty management</div>
          <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>Campaigns</h2>
        </div>
        <button onClick={()=>{setEdit(null);setShowForm(true)}} style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 16px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.06)",color:"var(--accent)",cursor:"pointer",fontWeight:500}}>
          <Icons.Plus/> NEW CAMPAIGN
        </button>
      </div>
      {!programs.length ? (
        <div style={{textAlign:"center",padding:"60px 20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12}}>
          <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⬡</div>
          <div style={{fontSize:15,fontWeight:500,color:"var(--muted)",marginBottom:6}}>No campaigns yet</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)",marginBottom:20}}>Create your first campaign to start tracking data separately</div>
          <button onClick={()=>{setEdit(null);setShowForm(true)}} style={{display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.06)",color:"var(--accent)",cursor:"pointer"}}><Icons.Plus/>CREATE FIRST CAMPAIGN</button>
        </div>
      ) : (()=>{
        const activeCampaigns    = programs.filter(cl=>cl.status!=="completed");
        const completedCampaigns = programs.filter(cl=>cl.status==="completed");

        const CampaignRow = ({cl, i, total}) => {
          const campCount = campaigns.filter(c=>c.campaignId===cl.id).length;
          const citeCount = citations.filter(c=>c.campaignId===cl.id).length;
          const isLast = i === total - 1;
          return (
            <div onClick={()=>{if(onSelectCampaign) onSelectCampaign(cl.id)}}
              style={{display:"grid",gridTemplateColumns:"3px 1fr auto",alignItems:"center",borderBottom:isLast?"none":"1px solid var(--border)",cursor:"pointer",transition:"background .12s"}}
              onMouseEnter={e=>e.currentTarget.style.background="var(--surface2)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              {/* colour stripe */}
              <div style={{alignSelf:"stretch",background:cl.status==="completed"?"#94a3b8":cl.color}}/>
              {/* main content */}
              <div style={{display:"flex",alignItems:"center",gap:14,padding:"13px 20px",minWidth:0}}>
                <div style={{width:8,height:8,borderRadius:"50%",background:cl.status==="completed"?"#94a3b8":cl.color,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,color:cl.status==="completed"?"var(--muted)":"var(--text)",letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.name}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:2}}>Created {new Date(cl.createdAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                </div>
                <div style={{display:"flex",gap:16,alignItems:"center",flexShrink:0}}>
                  <div style={{textAlign:"right"}}>
                    <div className="tabular" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:700,color:"var(--text)"}}>{campCount}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.07em"}}>Bounties</div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div className="tabular" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:700,color:"var(--text)"}}>{citeCount}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.07em"}}>Citations</div>
                  </div>
                </div>
              </div>
              {/* actions */}
              <div style={{display:"flex",alignItems:"center",gap:4,paddingRight:14}} onClick={e=>e.stopPropagation()}>
                {cl.sheetLink&&<a href={cl.sheetLink} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 7px",borderRadius:5,border:"1px solid rgba(26,58,92,0.18)",background:"rgba(26,58,92,0.05)",color:"var(--accent)",textDecoration:"none"}}>Sheet↗</a>}
                {(cl.sheetBounties||cl.sheetMedia)&&<DrillSync program={cl} drillCamps={campaigns.filter(c=>c.campaignId===cl.id)} drillCites={citations.filter(c=>c.campaignId===cl.id)} setCampaigns={setCampaigns} setCitations={setCitations}/>}
                <span onClick={e=>{e.stopPropagation();onSave({...cl,status:cl.status==="completed"?"active":"completed"},cl)}}
                  style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:5,cursor:"pointer",
                  background:cl.status==="completed"?"rgba(100,116,139,0.08)":"rgba(22,101,52,0.07)",
                  border:cl.status==="completed"?"1px solid rgba(100,116,139,0.2)":"1px solid rgba(22,101,52,0.2)",
                  color:cl.status==="completed"?"#475569":"#166634"}}>
                  {cl.status==="completed"?"Completed":"Active"}
                </span>
                <RowBtn onClick={()=>{setEdit(cl);setShowForm(true)}} title="Edit" hb="var(--accent)" hc="var(--accent)" hbg="rgba(26,58,92,0.06)"><Icons.Edit/></RowBtn>
                <RowBtn onClick={()=>setConfId(cl.id)} title="Delete" hb="var(--red)" hc="var(--red)" hbg="rgba(220,38,38,0.07)"><Icons.Trash/></RowBtn>
              </div>
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
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",color:"var(--muted)"}}>{label}</span>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 7px",borderRadius:99,background:accentBg,border:`1px solid ${accentBorder}`,color:accent}}>{items.length}</span>
              </button>
              {open&&(
                <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
                  {/* Column headers */}
                  <div style={{display:"grid",gridTemplateColumns:"3px 1fr auto",borderBottom:"1px solid var(--border)",background:"var(--surface2)"}}>
                    <div/>
                    <div style={{padding:"7px 20px",display:"flex",gap:14,alignItems:"center"}}>
                      <div style={{width:8,flexShrink:0}}/>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase",flex:1}}>Campaign</span>
                      <div style={{display:"flex",gap:16}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase",width:48,textAlign:"right"}}>Bounties</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase",width:48,textAlign:"right"}}>Citations</span>
                      </div>
                    </div>
                    <div style={{paddingRight:14,display:"flex",alignItems:"center"}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.08em",color:"var(--dim)",textTransform:"uppercase"}}>Actions</span>
                    </div>
                  </div>
                  {items.map((cl,i)=><CampaignRow key={cl.id} cl={cl} i={i} total={items.length}/>)}
                </div>
              )}
            </div>
          );
        };

        return (
          <div>
            <Section label="Active" items={activeCampaigns} accent="#166634" accentBg="rgba(22,101,52,0.07)" accentBorder="rgba(22,101,52,0.2)" defaultOpen={true}/>
            <Section label="Completed" items={completedCampaigns} accent="#475569" accentBg="rgba(100,116,139,0.08)" accentBorder="rgba(100,116,139,0.2)" defaultOpen={false}/>
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
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>// my contributions</div>
        <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>My Creations</h2>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:20,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:9,padding:4,width:"fit-content",boxShadow:"inset 0 1px 2px rgba(0,0,0,0.04)"}}>
        {[{id:"bounties",label:"Bounties",count:myBounties.length},{id:"citations",label:"Media Citations",count:myCitations.length}].map(t=>{
          const ia = sub===t.id;
          return (
            <button key={t.id} onClick={()=>setSub(t.id)}
              style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"7px 16px",borderRadius:8,border:`1px solid ${ia?"rgba(26,58,92,0.1)":"transparent"}`,background:ia?"var(--surface2)":"transparent",color:ia?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:ia?700:400,letterSpacing:"0.04em",transition:"all .15s"}}>
              {t.label}
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:100,background:ia?"rgba(26,58,92,0.07)":"transparent",color:ia?"var(--accent)":"var(--dim)"}}>{t.count}</span>
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

  const maxTotal = authors.reduce((m,a)=>Math.max(m,a.total),1);

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
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>// contributors</div>
          <h2 style={{fontSize:22,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)"}}>Authors <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:400,color:"var(--dim)",marginLeft:8}}>{authors.length}</span></h2>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{position:"relative"}}>
            <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--dim)",pointerEvents:"none"}}><Icons.Search/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search authors…" style={{...iStyle,padding:"7px 10px 7px 30px",fontSize:11,width:220}}/>
          </div>
          <div style={{display:"flex",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,padding:3,gap:2}}>
            {[["activity","Activity"],["recent","Recent"],["name","Name"]].map(([v,l])=>(
              <button key={v} onClick={()=>setSort(v)}
                style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:6,border:"none",background:sort===v?"var(--surface)":"transparent",color:sort===v?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:sort===v?700:400,boxShadow:sort===v?"0 1px 3px rgba(0,0,0,0.08)":"none",transition:"all .15s"}}>
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
            {label:"Total Bounties", val:totalBounties,             sub:"Posts published",     c:"var(--accent)"},
            {label:"Citations",      val:totalCitations,            sub:"Media mentions",      c:"#4a7fa8"},
            {label:"Avg per Author", val:avgPerAuthor,              sub:`${mostActive?.name||"—"} leads`, c:"#4a7fa8"},
          ].map((s,i)=>(
            <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderLeft:`3px solid ${s.c}`,borderRadius:10,padding:"14px 16px",boxShadow:"0 1px 2px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.03)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{s.label}</div>
              <div className="tabular" style={{fontSize:24,fontWeight:700,letterSpacing:"-0.03em",color:"var(--text)",lineHeight:1,marginBottom:4}}>{s.val}</div>
              <div title={s.sub} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {filtered.length===0
        ? <div style={{textAlign:"center",padding:"80px 20px",background:"var(--surface)",border:"1px dashed var(--border)",borderRadius:12}}>
            <div style={{fontSize:32,opacity:.15,marginBottom:8}}>◎</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>{search?"No authors match your search":"No authors in this campaign yet"}</div>
          </div>
        : <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
            {/* Header row */}
            <div style={{display:"grid",gridTemplateColumns:"44px minmax(200px,1.6fr) 90px 90px 80px 110px 150px",alignItems:"center",gap:12,padding:"12px 18px",background:"var(--surface2)",borderBottom:"1px solid var(--border)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:600}}>
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
                      <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:26,height:26,borderRadius:"50%",background:rankMedals[i]+"22",border:`1px solid ${rankMedals[i]}`,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:700,color:rankMedals[i]}}>{i+1}</div>
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
                        <span style={{display:"inline-flex",alignItems:"center",gap:4,fontFamily:"'IBM Plex Mono',monospace",fontSize:8,padding:"1px 6px",borderRadius:99,background:status.bg,color:status.color,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.06em"}}>
                          <span style={{width:4,height:4,borderRadius:"50%",background:status.color}}/>{status.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bounties */}
                  <div className="tabular" style={{textAlign:"right",fontSize:16,fontWeight:700,letterSpacing:"-0.02em",color:a.bounties>0?"var(--accent)":"var(--border2)"}}>{a.bounties}</div>

                  {/* Citations */}
                  <div className="tabular" style={{textAlign:"right",fontSize:16,fontWeight:700,letterSpacing:"-0.02em",color:a.citations>0?"#4a7fa8":"var(--border2)"}}>{a.citations}</div>

                  {/* Weeks */}
                  <div className="tabular" style={{textAlign:"right",fontSize:14,fontWeight:600,color:"var(--text)"}}>{a.activeWeeks}</div>

                  {/* Last active */}
                  <div style={{textAlign:"right",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>{last||"—"}</div>

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
        style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",marginBottom:20}}>
        ← Back
      </button>

      {/* Header card */}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"22px 26px",marginBottom:18,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
          <div style={{width:64,height:64,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:600,background:ac.bg,color:ac.color,border:"1px solid var(--border2)",flexShrink:0}}>{initials(displayName)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Author profile</div>
              {program && (
                <span style={{display:"inline-flex",alignItems:"center",gap:5,fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:99,background:"var(--surface2)",border:"1px solid var(--border)",color:"var(--muted)"}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:program.color}}/>{program.name}
                </span>
              )}
            </div>
            <h2 style={{fontSize:26,fontWeight:600,letterSpacing:"-0.02em",color:"var(--text)",marginBottom:6}}>{displayName}</h2>
            {firstDate && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>Active {fmtDate(firstDate)} → {fmtDate(lastDate)}</div>}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="cq-stat-grid" style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12,marginBottom:18}}>
        {[
          {label:"Bounties", val:bounties.length, c:"var(--accent)"},
          {label:"Citations", val:cits.length, c:"#4a7fa8"},
          {label:"Active Weeks", val:weekSet.size, c:"var(--accent)"},
          {label:"Weekly Avg", val:weeklyAvg, c:"#4a7fa8"},
          {label:"Longest Streak", val:`${longestStreak}w`, c:"var(--accent)"},
        ].map((s,i)=>(
          <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderLeft:`3px solid ${s.c}`,borderRadius:10,padding:"14px 16px",boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:6}}>{s.label}</div>
            <div className="tabular" style={{fontSize:24,fontWeight:700,letterSpacing:"-0.03em",color:"var(--text)",lineHeight:1}}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Heatmap (90 days) */}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"16px 20px",marginBottom:18,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Last 90 Days</div>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>less</span>
              {[0.15,0.35,0.6,0.85,1].map((o,i)=>(
                <div key={i} style={{width:10,height:10,borderRadius:2,background:`rgba(26,58,92,${o})`}}/>
              ))}
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>more</span>
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
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Top Outlets Covering Them</div>
          {topOutlets.length===0
            ? <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No media coverage</div>
            : <div style={{display:"flex",flexDirection:"column",gap:9}}>
              {topOutlets.map((o,i)=>(
                <div key={o.label}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",width:14,flexShrink:0,textAlign:"right"}}>{i+1}</span>
                      <span title={o.label} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.label}</span>
                    </div>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"#4a7fa8",fontWeight:600,flexShrink:0,marginLeft:8}}>{o.count}</span>
                  </div>
                  <div style={{height:3,borderRadius:99,background:"var(--surface2)",overflow:"hidden"}}>
                    <div style={{width:`${(o.count/maxOutlet)*100}%`,height:"100%",background:"#4a7fa8",opacity:.7,borderRadius:99,transition:"width .4s"}}/>
                  </div>
                </div>
              ))}
            </div>
          }
        </div>

        {/* Media Tier */}
        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,padding:"18px 20px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:14}}>Media Tier</div>
          {tierEntries.length===0
            ? <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",padding:"12px 0"}}>No tier data</div>
            : <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {tierEntries.map(([tier,count])=>{
                const tc=getTierColor(tier);
                const pct=(count/cits.length)*100;
                return (
                  <div key={tier}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:4,background:tc.bg,border:`1px solid ${tc.border}`,color:tc.color}}>Tier {tier}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:600,color:tc.color}}>{count} <span style={{color:"var(--dim)",fontWeight:400}}>({Math.round(pct)}%)</span></span>
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
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 20px",borderBottom:"1px solid var(--border)",background:"var(--surface2)",gap:12,flexWrap:"wrap"}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Full Timeline</div>
          <div style={{display:"flex",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,padding:3,gap:2}}>
            {[
              {id:"bounties",  label:"Bounties",  count:bountyTimeline.length,   accent:"var(--accent)"},
              {id:"citations", label:"Citations", count:citationTimeline.length, accent:"#4a7fa8"},
            ].map(t=>{
              const active = timelineTab===t.id;
              return (
                <button key={t.id} onClick={()=>{setTimelineTab(t.id);setShowAll(false);}}
                  style={{display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"5px 12px",borderRadius:6,border:"none",background:active?"var(--surface2)":"transparent",color:active?t.accent:"var(--dim)",cursor:"pointer",fontWeight:active?700:500,boxShadow:active?"0 1px 3px rgba(0,0,0,0.08)":"none",transition:"all .15s",textTransform:"uppercase",letterSpacing:"0.06em"}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:t.accent,opacity:active?1:0.4}}/>
                  {t.label}
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:99,background:active?t.accent+"15":"var(--surface2)",color:active?t.accent:"var(--dim)",fontWeight:600}}>{t.count}</span>
                </button>
              );
            })}
          </div>
        </div>
        {activeTimeline.length===0
          ? <div style={{padding:"40px",textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--dim)"}}>No {timelineTab} recorded</div>
          : <>
            <div style={{maxHeight:"560px",overflowY:"auto"}}>
              {visibleTimeline.map((item,i)=>{
                const link = item._type==="bounty" ? item.cqLink : item.articleLink;
                return (
                  <div key={item.id} style={{display:"grid",gridTemplateColumns:"90px 14px 1fr auto",alignItems:"flex-start",gap:12,padding:"12px 20px",borderBottom:i<visibleTimeline.length-1?"1px solid var(--border)":"none",transition:"background .15s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.04)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",paddingTop:2}}>{item.date}</div>
                    <div style={{width:8,height:8,borderRadius:"50%",background:item._type==="bounty"?"var(--accent)":"#4a7fa8",marginTop:6}}/>
                    <div style={{minWidth:0}}>
                      {item._type==="bounty"
                        ? <>
                            <div title={item.title} style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.title}</div>
                            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.06em"}}>Bounty</div>
                          </>
                        : <>
                            <div title={item.topic||item.media} style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.topic||item.media}</div>
                            {item.headline&&<div title={item.headline} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{item.headline}</div>}
                            <div style={{display:"flex",alignItems:"center",gap:8}}>
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"#4a7fa8",textTransform:"uppercase",letterSpacing:"0.06em"}}>Citation</span>
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>· {item.media}</span>
                            </div>
                          </>
                      }
                    </div>
                    {link && (
                      <a href={link} target="_blank" rel="noreferrer"
                        style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:4,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.1)",color:"var(--accent)",textDecoration:"none",flexShrink:0}}>↗</a>
                    )}
                  </div>
                );
              })}
            </div>
            {activeTimeline.length>20 && (
              <button onClick={()=>setShowAll(v=>!v)}
                style={{width:"100%",padding:"10px",border:"none",borderTop:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
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
//  ROOT APP
// ─────────────────────────────────────────────────────────
export default function App() {
  const [theme, setTheme] = useState(() => {
    if(typeof window === "undefined") return "light";
    return localStorage.getItem("cq_theme") || "light";
  });
  useEffect(()=>{
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("cq_theme", theme);
  },[theme]);
  const toggleTheme = () => setTheme(t => t==="dark" ? "light" : "dark");

  useEffect(()=>{
    document.title = "CryptoQuant Bounty Tracker";
    const link = document.querySelector("link[rel~='icon']") || Object.assign(document.createElement('link'),{rel:'icon'});
    link.type = 'image/png';
    link.href = 'data:image/png;base64,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';
    document.head.appendChild(link);
  },[]);
  const [user,setUser]           = useState(null);
  const [users,setUsers]         = useState([]);
  const [programs,setPrograms]     = useState([]);   // named campaigns: [{id,name,color}]
  const [activeCid,setActiveCid] = useState(null); // active campaign id
  const [campaigns,setCampaigns] = useState([]);   // bounties entries
  const [citations,setCitations] = useState([]);   // media citation entries
  const [loading,setLoading]     = useState(true);
  const [saving,setSaving]       = useState(false);
  const [toast,setToast]         = useState(null);
  const [tab,setTab]             = useState("weekly");
  const [clientActiveCid,setClientActiveCid] = useState(null);
  const [showPdfModal,setShowPdfModal] = useState(false);
  const [sidebarCampaignOpen,setSidebarCampaignOpen] = useState(false);
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

  // Sync state → hash whenever tab or activeCid changes
  useEffect(()=>{ if(user && tab) pushHash(tab, activeCid, authorView); },[tab, activeCid, authorView]);

  // Listen for author-navigation events from nested components
  useEffect(()=>{
    const h = e => { const d=e.detail; if(typeof d==="string") navigateToAuthor(d); else navigateToAuthor(d.name, d.cid); };
    window.addEventListener("cq-nav-author", h);
    return ()=>window.removeEventListener("cq-nav-author", h);
  },[activeCid]);

  // Close sidebar campaign dropdown on click outside
  useEffect(()=>{
    const h = e => { if(sidebarCampaignRef.current&&!sidebarCampaignRef.current.contains(e.target)) setSidebarCampaignOpen(false); };
    document.addEventListener("mousedown",h);
    return ()=>document.removeEventListener("mousedown",h);
  },[]);

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
    const {cid:hashCid, tab:hashTab, author:hashAuthor} = parseHash();
    if(hashTab==="author" && hashAuthor) setAuthorView(hashAuthor);
    if(user.role==="admin"){
      const mostRecent = [...programs].sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
      if(hashTab==="author") { setTab("author"); setActiveCid(hashCid||mostRecent?.id||null); }
      else if(hashTab) { setTab(hashTab); setActiveCid(hashCid||mostRecent?.id||null); }
      else { setTab("weekly"); setActiveCid(mostRecent?.id||null); }
    } else if(user.role==="author"){
      const allowed = (user.allowedCampaigns||[]).filter(id=>programs.some(p=>p.id===id));
      const mostRecent = allowed.map(id=>programs.find(p=>p.id===id)).filter(Boolean).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
      if(hashTab==="author") { setTab("author"); }
      else if(hashTab && hashCid && allowed.includes(hashCid)) { setTab(hashTab); setActiveCid(hashCid); }
      else { setTab("weekly"); setActiveCid(mostRecent?.id||null); }
    } else if(user.role==="client"){
      const allowed = (user.allowedCampaigns||[]).filter(id=>programs.some(p=>p.id===id));
      const mostRecent = allowed.map(id=>programs.find(p=>p.id===id)).filter(Boolean).sort((a,b)=>(b.createdAt||0)-(a.createdAt||0))[0];
      if(hashTab==="author") { setTab("author"); }
      else if(hashTab && hashCid && allowed.includes(hashCid)) { setTab(hashTab); setClientActiveCid(hashCid); }
      else { setTab("weekly"); if(mostRecent) setClientActiveCid(mostRecent.id); }
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
  useEffect(()=>{
    (async()=>{
      try {
        const [loadedUsers, loadedPrograms, loadedCamps, loadedCits, nexoSeeded, nexoCitSeeded] = await Promise.all([
          db.getUsers().catch(()=>[]),
          db.getPrograms().catch(()=>[]),
          db.getCampaigns().catch(()=>[]),
          db.getCitations().catch(()=>[]),
          db.getFlag(NEXO_SEEDED_KEY).catch(()=>false),
          db.getFlag(NEXO_CIT_SEEDED_KEY).catch(()=>false),
        ]);

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
      } finally { setLoading(false); }
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
      showToast("Entry updated ✓");
    } else {
      const newEntry={...entry,id:uid(),createdBy:user?.id,createdAt:Date.now()};
      await db.upsertBounty(newEntry);
      setCampaigns([newEntry,...campaigns]);
      showToast("Entry added ✓");
    }
  };
  const handleDeleteCamp=async(id)=>{
    await db.deleteBounty(id);
    setCampaigns(campaigns.filter(c=>c.id!==id));
    showToast("Entry deleted");
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

  // ── ACTIVE CAMPAIGN OBJECT ──
  const activeClient = programs.find(c=>c.id===activeCid)||null;

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

  const handleLogin = (u) => { setUser(u); try{localStorage.setItem("cq_session",u.id);}catch{} };
  const handleLogout = () => { setUser(null); try{localStorage.removeItem("cq_session");}catch{} };

  if(!user && !loading) return (<><style>{css}</style><LoginScreen onLogin={handleLogin}/></>);

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"var(--bg)",flexDirection:"column",gap:14}}>
      <style>{css}</style>
      <Icons.Spin/><div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)",letterSpacing:"0.08em"}}>LOADING…</div>
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

  const myAuthorName = (user.displayName||user.username).toLowerCase();
  const myBounties   = scopedCampaigns.filter(c=>(c.author||"").toLowerCase()===myAuthorName);
  const myCitations  = scopedCitations.filter(c=>(c.author||"").toLowerCase()===myAuthorName);
  const scopedAuthorsCount = new Set([...scopedCampaigns.map(c=>(c.author||"").trim().toLowerCase()),...scopedCitations.map(c=>(c.author||"").trim().toLowerCase())].filter(Boolean)).size;

  const TABS = [
    {id:"weekly",      label:"Weekly Summary",  icon:<Icons.Analytics/>, accent:"var(--accent)", count:""},
    {id:"campaign",    label:"Content",           icon:<Icons.Chart/>,     accent:"var(--accent)", count:scopedCampaigns.length},
    {id:"media",       label:"Media Citations",  icon:<Icons.News/>,      accent:"var(--accent)", count:scopedCitations.length},
    {id:"authors",     label:"Authors",          icon:<Icons.Users/>,     accent:"var(--accent)", count:scopedAuthorsCount},
    ...(user.role==="client"||user.role==="admin"?[{id:"analytics", label:"Analytics", icon:<Icons.Analytics/>, accent:"var(--accent)", count:""}]:[]),
    ...(user.role==="author"?[{id:"mine", label:"My Creations", icon:<Icons.User/>, accent:"var(--accent)", count:myBounties.length+myCitations.length}]:[]),
    ...(user.role==="admin"?[
      {id:"campaigns_mgmt", label:"Campaigns",     icon:<Icons.Brief/>,     accent:"var(--accent)", count:programs.length},
      {id:"users",          label:"Users & Access", icon:<Icons.Users/>,     accent:"var(--accent)", count:users.length},
    ]:[]),
  ];

  return (
    <>
      <style>{css}</style>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}
      {showPdfModal&&effectiveClient&&<PdfReportModal campaigns={scopedCampaigns} citations={scopedCitations} campaignName={effectiveClient.name} onClose={()=>setShowPdfModal(false)}/>}

      {/* LAYOUT */}
      <div style={{display:"flex",minHeight:"100vh"}}>
        {/* Mobile overlay */}
        <div className={`cq-overlay${sidebarOpen?" active":""}`} style={{display:"none",position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:499}} onClick={()=>setSidebarOpen(false)}/>
        {/* Mobile hamburger */}
        <button className="cq-hamburger" onClick={()=>setSidebarOpen(v=>!v)} style={{display:"none",position:"fixed",top:12,left:12,zIndex:501,width:36,height:36,borderRadius:8,border:"1px solid var(--border)",background:"var(--surface)",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,0.1)",color:"var(--accent)",fontSize:16,padding:0}}>
          {sidebarOpen?"✕":"☰"}
        </button>
        {/* SIDEBAR */}
        <nav className={`cq-sidebar${sidebarOpen?" open":""}`} style={{width:216,flexShrink:0,background:"#0d1f33",borderRight:"1px solid rgba(255,255,255,0.07)",padding:"20px 8px",display:"flex",flexDirection:"column",gap:2,position:"sticky",top:0,height:"100vh",overflowY:"auto"}}>
          <div style={{padding:"4px 10px",marginBottom:16}}>
            <div style={{fontSize:13,fontWeight:600,letterSpacing:"-0.01em",color:"#ffffff"}}>CryptoQuant</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:"0.06em",marginTop:1}}>CAMPAIGN INTELLIGENCE</div>
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
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.14em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase",marginBottom:6}}>Campaign</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"rgba(255,255,255,0.35)",padding:"8px 0"}}>No campaigns assigned.</div>
              </div>
            );
            return (
              <div ref={sidebarCampaignRef} style={{padding:"0 4px",marginBottom:16}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.14em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase",padding:"0 6px",marginBottom:6}}>Campaign</div>
                <button onClick={()=>setSidebarCampaignOpen(v=>!v)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:sidebarCampaignOpen?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.04)",border:"1px solid "+(sidebarCampaignOpen?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.08)"),borderRadius:6,cursor:"pointer",transition:"all .15s",textAlign:"left"}}
                  onMouseEnter={e=>{if(!sidebarCampaignOpen)e.currentTarget.style.background="rgba(255,255,255,0.06)"}}
                  onMouseLeave={e=>{if(!sidebarCampaignOpen)e.currentTarget.style.background="rgba(255,255,255,0.04)"}}>
                  {activeCl&&<div style={{width:7,height:7,borderRadius:"50%",background:activeCl.color,flexShrink:0}}/>}
                  <span style={{flex:1,fontSize:12,fontWeight:500,color:activeCl?"rgba(255,255,255,0.9)":"rgba(255,255,255,0.4)",letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeCl?.name||"Select…"}</span>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.3)",transition:"transform .15s",display:"inline-block",transform:sidebarCampaignOpen?"rotate(180deg)":"none"}}>▾</span>
                </button>
                {sidebarCampaignOpen&&(
                  <div style={{marginTop:4,background:"#162a42",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,overflow:"hidden",animation:"fadeUp .15s ease",maxHeight:240,overflowY:"auto"}}>
                    {visibleCampaigns.map((cl,i)=>{
                      const ia=currentCid===cl.id;
                      const bc=campaigns.filter(c=>c.campaignId===cl.id).length;
                      const cc=citations.filter(c=>c.campaignId===cl.id).length;
                      return (
                        <button key={cl.id} onClick={()=>{setCid(cl.id);pushHash(tab,cl.id);setSidebarCampaignOpen(false);}}
                          style={{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",width:"100%",background:ia?"rgba(255,255,255,0.08)":"transparent",border:"none",borderLeft:`3px solid ${ia?cl.color:"transparent"}`,borderBottom:i<visibleCampaigns.length-1?"1px solid rgba(255,255,255,0.06)":"none",cursor:"pointer",transition:"background .1s",textAlign:"left"}}
                          onMouseEnter={e=>{if(!ia)e.currentTarget.style.background="rgba(255,255,255,0.05)"}}
                          onMouseLeave={e=>{if(!ia)e.currentTarget.style.background="transparent"}}>
                          <div style={{width:7,height:7,borderRadius:"50%",background:cl.color,flexShrink:0,opacity:ia?1:0.5}}/>
                          <span style={{flex:1,fontSize:12,fontWeight:ia?600:400,color:ia?"rgba(255,255,255,0.95)":"rgba(255,255,255,0.5)",letterSpacing:"-0.01em",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cl.name}</span>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"rgba(255,255,255,0.3)"}}>{bc+cc}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.14em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase",padding:"0 10px",marginBottom:10}}>Navigation</div>
          {TABS.map((t,idx)=>{
            const ia=tab===t.id;
            const isFirstAdmin = user.role==="admin" && t.id==="campaigns_mgmt";
            return (
              <React.Fragment key={t.id}>
                {isFirstAdmin&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,letterSpacing:"0.14em",color:"rgba(255,255,255,0.3)",textTransform:"uppercase",padding:"0 10px",marginTop:12,marginBottom:10}}>Admin</div>}
                <button onClick={()=>navigate(t.id)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",background:ia?"rgba(255,255,255,0.1)":"transparent",color:ia?"#ffffff":"rgba(255,255,255,0.5)",cursor:"pointer",fontWeight:ia?600:400,fontSize:13,textAlign:"left",width:"100%",transition:"all .15s",fontFamily:"'Plus Jakarta Sans','Inter',sans-serif"}}
                  onMouseEnter={e=>{if(!ia){e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="rgba(255,255,255,0.85)";}}}
                  onMouseLeave={e=>{if(!ia){e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.5)";}}}>
                  <span style={{color:ia?"#ffffff":"rgba(255,255,255,0.4)",flexShrink:0}}>{t.icon}</span>
                  <span style={{flex:1}}>{t.label}</span>
                  {t.count!==""&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"1px 6px",borderRadius:100,background:ia?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.08)",color:ia?"#ffffff":"rgba(255,255,255,0.4)"}}>{t.count}</span>}
                </button>
              </React.Fragment>
            );
          })}
          {/* PDF Report — visible when a campaign is active */}
          {effectiveCid && tab!=="campaigns_mgmt" && (
            <button onClick={()=>setShowPdfModal(true)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",background:"transparent",color:"rgba(255,255,255,0.5)",cursor:"pointer",fontWeight:400,fontSize:13,textAlign:"left",width:"100%",transition:"all .15s",fontFamily:"'Plus Jakarta Sans','Inter',sans-serif"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";e.currentTarget.style.color="rgba(255,255,255,0.85)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="rgba(255,255,255,0.5)";}}>
              <span style={{color:"rgba(255,255,255,0.35)",flexShrink:0,fontSize:12}}>↓</span>
              <span style={{flex:1}}>PDF Report</span>
            </button>
          )}
          {effectiveClient&&(effectiveClient.sheetBounties||effectiveClient.sheetMedia)&&(
            <div style={{marginTop:"auto",padding:"0 4px",marginBottom:10}}>
              <DrillSync program={effectiveClient} drillCamps={scopedCampaigns} drillCites={scopedCitations} setCampaigns={setCampaigns} setCitations={setCitations} darkMode/>
            </div>
          )}
          <div style={{marginTop:effectiveClient&&(effectiveClient.sheetBounties||effectiveClient.sheetMedia)?0:"auto",paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
            {saving&&<div style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"rgba(255,255,255,0.4)",padding:"0 12px",marginBottom:8}}><Icons.Spin/>SAVING…</div>}
            <div style={{padding:"8px 12px",borderRadius:8,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500,color:"rgba(255,255,255,0.8)",flexShrink:0}}>{initials(user.username)}</div>
                <span style={{fontSize:12,fontWeight:500,color:"rgba(255,255,255,0.9)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.username}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:6}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:4,background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",color:"rgba(255,255,255,0.55)",textTransform:"uppercase"}}>{rm.label}</span>
                <div style={{display:"flex",alignItems:"center",gap:4}}>
                  <button onClick={toggleTheme} title={theme==="dark"?"Switch to light mode":"Switch to dark mode"} style={{width:24,height:24,borderRadius:6,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.3)";e.currentTarget.style.color="rgba(255,255,255,0.9)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";e.currentTarget.style.color="rgba(255,255,255,0.4)"}}>
                    {theme==="dark"?<Icons.Sun/>:<Icons.Moon/>}
                  </button>
                  <button onClick={handleLogout} title="Sign out" style={{width:24,height:24,borderRadius:6,border:"1px solid rgba(255,255,255,0.12)",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"rgba(255,255,255,0.4)",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.color="var(--red)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";e.currentTarget.style.color="rgba(255,255,255,0.4)"}}>
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
        {!effectiveCid && (tab==="weekly"||tab==="campaign"||tab==="media"||tab==="authors"||tab==="mine") && programs.length>0 && (
          <div style={{textAlign:"center",padding:"60px 20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,animation:"fadeUp .5s ease .1s both"}}>
            <div style={{fontSize:15,fontWeight:500,color:"var(--muted)",marginBottom:6}}>Select a campaign in the sidebar to view data</div>
          </div>
        )}

        {/* CONTENT */}
        {tab==="weekly"&&(effectiveCid||user.role==="client")&&<WeeklySummaryTab key={effectiveCid} campaigns={scopedCampaigns} citations={scopedCitations} color={effectiveClient?.color||"var(--accent)"}/>}
        {(tab==="campaign")&&(effectiveCid||user.role==="client")&&<CampaignTable campaigns={scopedCampaigns} citations={scopedCitations} onSave={handleSaveCamp} onDelete={handleDeleteCamp} onDeleteAll={handleDeleteAllCamp} currentUser={user} readOnly={readOnly||(user.role==="author"&&!(user.allowedCampaigns||[]).includes(activeCid))} onBountySummaryUpdate={handleBountySummaryUpdate}/>}
        {(tab==="media")&&(effectiveCid||user.role==="client")&&<MediaTable citations={scopedCitations} onSave={handleSaveMedia} onDelete={handleDeleteMedia} onDeleteAll={handleDeleteAllMedia} currentUser={user} readOnly={readOnly||(user.role==="author"&&!(user.allowedCampaigns||[]).includes(activeCid))} bounties={scopedCampaigns} onCitedBountyUpdate={handleCitedBountyUpdate}/>}
        {(tab==="authors")&&(effectiveCid||user.role==="client")&&<AuthorsTab key={effectiveCid} campaigns={scopedCampaigns} citations={scopedCitations}/>}
        {tab==="analytics"&&(user.role==="client"||user.role==="admin")&&<AnalyticsTab campaigns={scopedCampaigns} citations={scopedCitations} clientName={user.role==="admin"?effectiveClient?.name||"":user.clientName}/>}
        {tab==="mine"&&user.role==="author"&&<MyCreationsTab myBounties={myBounties} myCitations={myCitations} onSaveCamp={handleSaveCamp} onDeleteCamp={handleDeleteCamp} onSaveMedia={handleSaveMedia} onDeleteMedia={handleDeleteMedia} currentUser={user} activeCid={activeCid} allBounties={scopedCampaigns} onCitedBountyUpdate={handleCitedBountyUpdate}/>}
        {tab==="author"&&authorView&&(effectiveCid||user.role==="client")&&<AuthorDetailTab key={authorView+"|"+effectiveCid} authorName={authorView} campaigns={scopedCampaigns} citations={scopedCitations} program={effectiveClient} onBack={()=>{ if(window.history.length>1) window.history.back(); else navigate("weekly"); }}/>}
        {tab==="campaigns_mgmt"&&user.role==="admin"&&<CampaignsPanel programs={programs} campaigns={campaigns} citations={citations} onSave={handleSaveProgram} onDelete={handleDeleteProgram} onSaveCamp={(f,ex,cid)=>handleSaveCamp(f,ex,cid)} onDeleteCamp={handleDeleteCamp} onSaveMedia={(f,ex,cid)=>handleSaveMedia(f,ex,cid)} onDeleteMedia={handleDeleteMedia} currentUser={user} showToast={showToast} setCampaigns={setCampaigns} setCitations={setCitations} onSelectCampaign={(cid)=>navigate("weekly",cid)}/>}
        {tab==="users"&&user.role==="admin"&&<UsersPanel users={users} campaigns={campaigns} citations={citations} campaignsList={programs} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} showToast={showToast} currentUser={user}/>}
        {/* cq_research merged into Content tab */}
        </main>
      </div>

      <footer className="cq-footer" style={{borderTop:"1px solid var(--border)",padding:"14px 36px",background:"var(--surface)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>CryptoQuant <span style={{color:"var(--accent)"}}>Bounty Program</span> · Analytics Suite v2</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>
          {programs.length} campaign{programs.length!==1?"s":""} · {campaigns.length} entries · {citations.length} citations · <span style={{color:"var(--green)"}}>synced</span>
        </div>
      </footer>
    </>
  );
}
