import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { ComposedChart, AreaChart, Area, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { db, supabase } from "./db.js";

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

const AUTHOR_PALETTE = [
  {bg:"rgba(26,58,92,0.07)",color:"#1a3a5c"},{bg:"rgba(26,58,92,0.07)",color:"#243d55"},
  {bg:"rgba(26,58,92,0.07)",color:"#1e4570"},{bg:"rgba(26,58,92,0.07)",color:"#152e48"},
  {bg:"rgba(26,58,92,0.07)",color:"#1a3a5c"},{bg:"rgba(26,58,92,0.07)",color:"#243d55"},
  {bg:"rgba(26,58,92,0.07)",color:"#1e4570"},{bg:"rgba(26,58,92,0.07)",color:"#152e48"},
];
const CLIENT_PALETTE = [
  {bg:"rgba(26,58,92,0.07)",border:"rgba(26,58,92,0.2)",color:"#1a3a5c"},
  {bg:"rgba(26,58,92,0.07)",border:"rgba(26,58,92,0.2)",color:"#1a3a5c"},
  {bg:"rgba(26,58,92,0.07)",border:"rgba(26,58,92,0.2)",color:"#1a3a5c"},
  {bg:"rgba(26,58,92,0.07)",border:"rgba(26,58,92,0.2)",color:"#1a3a5c"},
  {bg:"rgba(26,58,92,0.07)",border:"rgba(26,58,92,0.2)",color:"#1a3a5c"},
  {bg:"rgba(26,58,92,0.07)",border:"rgba(26,58,92,0.2)",color:"#1a3a5c"},
];
const TIER_COLORS = {
  "Tier 1":{bg:"rgba(26,58,92,0.08)",border:"rgba(26,58,92,0.2)",color:"#1a3a5c"},
  "Tier 2":{bg:"rgba(26,58,92,0.06)",border:"rgba(26,58,92,0.2)",color:"#1a3a5c"},
  "Tier 3":{bg:"rgba(26,58,92,0.04)",border:"rgba(26,58,92,0.1)",color:"#3d6a94"},
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
const getTierColor   = t => TIER_COLORS[t]||{bg:"rgba(255,255,255,0.04)",border:"rgba(255,255,255,0.1)",color:"#6b849e"};

const initials = (n="") => { const p=n.trim().split(/\s+/); return p.length>=2?(p[0][0]+p[1][0]).toUpperCase():n.slice(0,2).toUpperCase(); };
const fmtDate  = iso => { if(!iso)return"—"; const [y,m,d]=iso.split("-"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+m-1]} ${+d}, ${y}`; };
const uid = () => Date.now().toString(36)+Math.random().toString(36).slice(2);
const hashPass = s => btoa(encodeURIComponent(s));

// ─────────────────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500&family=Inter:wght@400;500;600;700;800&display=swap');
@keyframes spin    { to{transform:rotate(360deg)} }
@keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes rowIn   { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
@keyframes modalIn { from{opacity:0;transform:scale(0.97) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
@keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
* { margin:0; padding:0; box-sizing:border-box; }
:root {
  --bg:#e4e8ee;
  --surface:#f4f6f9;
  --surface2:#eaedf2;
  --surface3:#e0e4eb;
  --border:#c4cdd9;
  --border2:#a8b5c4;
  --text:#1e2d3d;
  --muted:#3d5468;
  --dim:#6a7f90;
  --accent:#1a3a5c;
  --accent-light:#e8eef5;
  --purple:#1a3a5c;
  --green:#1a3a5c;
  --red:#c0272d;
  --yellow:#1a3a5c;
  --orange:#1a3a5c;
  --positive:#166534;
  --negative:#c0272d;
  --tag:#1a3a5c;
}
body { background:var(--bg); color:var(--text); font-family:'Inter',sans-serif; min-height:100vh; }
::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:var(--bg)} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px}
input,select,textarea { color-scheme:light; }
input[type=date]::-webkit-calendar-picker-indicator{cursor:pointer;opacity:0.5}
a { color:var(--accent); }
button { font-family:'Inter',sans-serif; }
input:focus,textarea:focus,select:focus { border-color:var(--accent) !important; outline:2px solid rgba(26,58,92,0.1) !important; }
tr:hover td { background:var(--surface2) !important; transition:background .1s; }
`

// ─────────────────────────────────────────────────────────
//  DESIGN PRIMITIVES
// ─────────────────────────────────────────────────────────
const iStyle = {background:"var(--surface)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:"10px 13px",outline:"none",width:"100%",boxShadow:"inset 0 1px 2px rgba(0,0,0,0.04)",transition:"border-color .15s"};
const lStyle = {fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase"};
const Field = ({label,children,full}) => (
  <div style={{display:"flex",flexDirection:"column",gap:6,...(full?{gridColumn:"1/-1"}:{})}}>
    <label style={lStyle}>{label}</label>{children}
  </div>
);

// Icons
const Ic = ({d,w=14,h=14,sw=2,extra}) => <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={extra}>{d}</svg>;
const Icons = {
  Plus:  ()=><Ic w={13} h={13} sw={2.5} d={<><path d="M12 5v14M5 12h14"/></>}/>,
  Edit:  ()=><Ic w={11} h={11} d={<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>}/>,
  Trash: ()=><Ic w={11} h={11} d={<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></>}/>,
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
};

// Shared UI
const Toast = ({msg,type}) => (
  <div style={{position:"fixed",bottom:28,right:28,zIndex:500,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"10px 18px",borderRadius:10,background:"var(--surface)",border:`1px solid ${type==="error"?"rgba(185,28,28,0.3)":"rgba(22,101,52,0.3)"}`,color:type==="error"?"var(--negative)":"var(--positive)",boxShadow:"0 4px 16px rgba(0,0,0,0.12)",letterSpacing:"0.04em",animation:"fadeUp .3s ease"}}>
    {msg}
  </div>
);

const ConfirmDelete = ({onConfirm,onCancel}) => (
  <div onClick={onCancel} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
    <div onClick={e=>e.stopPropagation()} style={{background:"var(--surface)",border:"1px solid #fecaca",borderRadius:16,padding:28,boxShadow:"0 20px 60px rgba(0,0,0,0.18)",width:"min(380px,100%)",animation:"modalIn .2s ease"}}>
      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.1em",color:"var(--red)",textTransform:"uppercase",marginBottom:10}}>// confirm delete</div>
      <div style={{fontSize:16,fontWeight:500,marginBottom:8}}>Delete this entry?</div>
      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--muted)",marginBottom:24,lineHeight:1.6}}>This action cannot be undone.</div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 18px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--muted)",cursor:"pointer"}}>CANCEL</button>
        <button onClick={onConfirm} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 18px",borderRadius:8,border:"1px solid rgba(220,38,38,0.35)",background:"rgba(220,38,38,0.1)",color:"var(--red)",cursor:"pointer",fontWeight:500}}>DELETE</button>
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
  <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"20px 22px",position:"relative",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
    <div style={{position:"absolute",top:0,left:0,width:3,height:"100%",background:c,opacity:.7,borderRadius:"0 2px 2px 0"}}/>
    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:"0.12em",color:"var(--dim)",textTransform:"uppercase",marginBottom:10}}>{label}</div>
    <div style={{fontSize:28,fontWeight:500,letterSpacing:"-0.02em",color:"var(--text)",lineHeight:1}}>{value}</div>
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
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#e8eef5 0%,#f0f2f5 50%,#e4eaf3 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-20%",left:"-10%",width:"60%",height:"60%",background:"radial-gradient(ellipse,rgba(26,58,92,0.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:"-10%",right:"-10%",width:"50%",height:"50%",background:"radial-gradient(ellipse,rgba(26,58,92,0.06) 0%,transparent 70%)",pointerEvents:"none"}}/>
      <div style={{width:"min(420px,100%)",animation:"fadeUp .6s ease both",position:"relative",zIndex:1}}>

        {/* Logo */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32,justifyContent:"center"}}>
          <img src="data:image/png;base64,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" alt="CQ" style={{width:40,height:40,borderRadius:12,objectFit:"contain",background:"#fff",padding:4}}/>
          <span style={{fontSize:18,fontWeight:500,letterSpacing:"-0.01em",color:"var(--text)"}}>Crypto<span style={{color:"var(--accent)"}}>Quant</span></span>
        </div>

        {/* Tab toggle */}
        <div style={{display:"flex",gap:4,marginBottom:24,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:4}}>
          {[{id:"signin",label:"Sign In"},{id:"register",label:"Create Account"}].map(t=>{
            const ia = mode===t.id;
            return (
              <button key={t.id} onClick={()=>switchMode(t.id)} style={{flex:1,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px",borderRadius:9,border:`1px solid ${ia?"rgba(255,255,255,0.08)":"transparent"}`,background:ia?"var(--surface2)":"transparent",color:ia?"var(--accent)":"var(--dim)",cursor:"pointer",letterSpacing:"0.04em",fontWeight:ia?700:400,transition:"all .2s"}}>
                {t.label}
              </button>
            );
          })}
        </div>

        <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:20,padding:32,boxShadow:"0 4px 24px rgba(0,0,0,0.12)"}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.1em",color:"var(--accent)",textTransform:"uppercase",marginBottom:8}}>
            {isRegister?"// new account":"// secure access"}
          </div>
          <div style={{fontSize:22,fontWeight:500,marginBottom:4}}>{isRegister?"Create Account":"Welcome Back"}</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)",marginBottom:24}}>
            {isRegister?"Choose your account type below. Admins can update roles at any time.":"Bounty Program Analytics Suite"}
          </div>

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
                <div style={{position:"relative"}}>
                  <div style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--dim)"}}><Icons.User/></div>
                  <input value={displayName} onChange={e=>setDN(e.target.value)} placeholder="How your name appears on posts"
                    style={{...iStyle,paddingLeft:38}}/>
                </div>
              </Field>
            )}

            {isRegister && (
              <Field label="Account Type">
                <div style={{display:"flex",gap:10}}>
                  {[
                    {id:"author", label:"Author",  desc:"Post & manage content", color:"var(--green)",  border:"rgba(22,163,74,0.4)",  bg:"rgba(26,58,92,0.07)"},
                    {id:"client", label:"Client",  desc:"View campaign results", color:"var(--accent)", border:"rgba(26,58,92,0.25)",    bg:"rgba(26,58,92,0.07)"},
                  ].map(r => {
                    const active = regRole === r.id;
                    return (
                      <button key={r.id} onClick={()=>setRegRole(r.id)}
                        style={{flex:1,padding:"10px 12px",borderRadius:9,border:`1px solid ${active?r.border:"var(--border)"}`,background:active?r.bg:"transparent",cursor:"pointer",textAlign:"left",transition:"all .15s"}}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:500,color:active?r.color:"var(--muted)",marginBottom:2}}>{r.label}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </Field>
            )}

            {isRegister && regRole === "client" && (
              <Field label="Company / Client Name">
                <input value={clientName} onChange={e=>setClientName(e.target.value)} placeholder="e.g. Binance"
                  style={iStyle}/>
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
                    style={{...iStyle,paddingLeft:38, ...(confirm&&confirm!==password?{borderColor:"rgba(220,38,38,0.5)"}:{})}}/>
                </div>
                {confirm && confirm!==password && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--red)",marginTop:4}}>Passwords don't match</div>}
              </Field>
            )}
          </div>

          {error   && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--red)",  marginTop:14,padding:"8px 12px",background:"rgba(220,38,38,0.06)",border:"1px solid rgba(220,38,38,0.2)",borderRadius:7}}>{error}</div>}
          {success && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--green)",marginTop:14,padding:"8px 12px",background:"rgba(22,163,74,0.06)",border:"1px solid rgba(22,163,74,0.2)",borderRadius:7}}>{success}</div>}

          <button onClick={isRegister?handleRegister:handleLogin} disabled={loading}
            style={{width:"100%",marginTop:20,fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:"12px",borderRadius:10,border:`1px solid ${isRegister?"rgba(26,58,92,0.2)":"rgba(26,58,92,0.2)"}`,background:isRegister?"rgba(26,58,92,0.07)":"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:"pointer",letterSpacing:"0.06em",fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:8,transition:"all .2s"}}
            onMouseEnter={e=>e.currentTarget.style.background=isRegister?"rgba(26,58,92,0.1)":"rgba(26,58,92,0.1)"}
            onMouseLeave={e=>e.currentTarget.style.background=isRegister?"rgba(26,58,92,0.07)":"rgba(26,58,92,0.08)"}>
            {loading?<><Icons.Spin/>{isRegister?"CREATING…":"SIGNING IN…"}</>:isRegister?"CREATE ACCOUNT →":"SIGN IN →"}
          </button>

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
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:20,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",width:"min(520px,100%)",maxHeight:"90vh",overflowY:"auto",padding:32,position:"relative",animation:"modalIn .25s ease"}}>
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
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase",marginBottom:10}}>
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
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase",marginBottom:6}}>Role permissions</div>
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
          <h2 style={{fontSize:22,fontWeight:500}}>Team & Access</h2>
        </div>
        <button onClick={()=>{setEditUser(null);setShowForm(true)}} style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 16px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.07)",color:"var(--purple)",cursor:"pointer",fontWeight:500}}>
          <Icons.Plus/> ADD USER
        </button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:28}}>
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
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 100px 1fr 120px 60px",padding:"10px 20px",borderBottom:"1px solid var(--border)",background:"var(--surface)"}}>
          {["User","Role","Bounty Access","Created",""].map(h=><div key={h} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase"}}>{h}</div>)}
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
      {showForm&&<UserForm initial={editUser} onSave={async f=>{await onSaveUser(f,editUser);setShowForm(false);setEditUser(null)}} onClose={()=>{setShowForm(false);setEditUser(null)}} campaignsList={campaignsList}/>}
      {confirmId&&<ConfirmDelete onConfirm={()=>{onDeleteUser(confirmId);setConfirmId(null)}} onCancel={()=>setConfirmId(null)}/>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  CAMPAIGN TABLE (shared, role-aware)
// ─────────────────────────────────────────────────────────
const CAMP_EMPTY = {date:"",author:"",title:"",cqLink:"",analyticsLink:"",authorTwitterLink:"",cqTwitterLink:"",telegramLink:"",category:"",asset:"",twitterImpressions:"",telegramImpressions:"",note1:"",note2:"",note3:""};
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
      <div style={{background:"var(--surface)",borderLeft:"1px solid var(--border)",boxShadow:"-4px 0 32px rgba(13,21,32,0.12)",width:"min(480px,100%)",height:"100%",overflowY:"auto",padding:"32px 30px 48px",position:"relative",animation:"slideIn .22s cubic-bezier(0.22,1,0.36,1)",display:"flex",flexDirection:"column",gap:0}}>
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
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Campaign-Specific Fields</div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",gap:10}}>
                <Field label="Category"><input value={form.category||""} onChange={e=>set("category",e.target.value)} placeholder="e.g. Spot, Macro" style={iStyle}/></Field>
                <Field label="Asset"><input value={form.asset||""} onChange={e=>set("asset",e.target.value)} placeholder="e.g. BTC, ETH" style={iStyle}/></Field>
              </div>
              <div style={{display:"flex",gap:10}}>
                <Field label="Twitter Impressions"><input value={form.twitterImpressions||""} onChange={e=>set("twitterImpressions",e.target.value)} placeholder="e.g. 21300" style={iStyle}/></Field>
                <Field label="Telegram Impressions"><input value={form.telegramImpressions||""} onChange={e=>set("telegramImpressions",e.target.value)} placeholder="e.g. 7100" style={iStyle}/></Field>
              </div>
              <Field label="Note 1" full><input value={form.note1||""} onChange={e=>set("note1",e.target.value)} placeholder="Custom field…" style={iStyle}/></Field>
              <Field label="Note 2" full><input value={form.note2||""} onChange={e=>set("note2",e.target.value)} placeholder="Custom field…" style={iStyle}/></Field>
              <Field label="Note 3" full><input value={form.note3||""} onChange={e=>set("note3",e.target.value)} placeholder="Custom field…" style={iStyle}/></Field>
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
      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
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
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.15)",width:"min(560px,100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",position:"relative",animation:"modalIn .2s ease"}}>
        {/* Header */}
        <div style={{padding:"24px 28px 16px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>// bounty entry</div>
          <h2 style={{fontSize:16,fontWeight:500,lineHeight:1.4,paddingRight:24}}>{entry.title||"—"}</h2>
        </div>
        {/* Scrollable body */}
        <div style={{overflowY:"auto",padding:"20px 28px",flex:1}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <InfoBlock label="Date" value={fmtDate(entry.date)}/>
            <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Author</div>
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
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Links</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <LinkBtn label="Quicktake" url={entry.cqLink}/>
                <LinkBtn label="Analytics" url={entry.analyticsLink}/>
                <LinkBtn label="Author X" url={entry.authorTwitterLink}/>
                <LinkBtn label="CQ X" url={entry.cqTwitterLink}/>
                <LinkBtn label="Telegram" url={entry.telegramLink}/>
              </div>
            </div>
          )}
          {(entry.note1||entry.note2||entry.note3)&&(
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Notes</div>
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {[{l:"Note 1",v:entry.note1},{l:"Note 2",v:entry.note2},{l:"Note 3",v:entry.note3}].filter(x=>x.v).map(x=>(
                  <div key={x.l} style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)"}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",marginBottom:4}}>{x.l}</div>
                    <div style={{fontSize:13,color:"var(--text)"}}>{x.v}</div>
                  </div>
                ))}
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
const CampaignTable = ({campaigns, onSave, onDelete, onDeleteAll, currentUser, readOnly=false}) => {
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

  const resetFilters = () => { setSearch(""); setFA("all"); setDateFrom(""); setDateTo(""); setPage(1); };

  const canAdd  = !readOnly;
  const canEdit = entry => !readOnly && (currentUser.role==="admin" || entry.author===currentUser.displayName||entry.author===currentUser.username);

  const filtered = campaigns.filter(c=>{
    const q = search.toLowerCase();
    const matchQ = !q || (c.title||"").toLowerCase().includes(q)||(c.author||"").toLowerCase().includes(q);
    const matchA = filterAuthor==="all" || c.author===filterAuthor;
    const matchFrom = !filterDateFrom || (c.date||"") >= filterDateFrom;
    const matchTo   = !filterDateTo   || (c.date||"") <= filterDateTo;
    return matchQ && matchA && matchFrom && matchTo;
  });

  const sortedFiltered = [...filtered].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const paged = sortedFiltered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);
  const authors=[...new Set(campaigns.map(c=>c.author).filter(Boolean))];
  const withTw=campaigns.filter(c=>c.twitterLink).length;
  const clientNames=[...new Set(campaigns.map(c=>c.client).filter(Boolean))];
  const sortedDates = campaigns.filter(c=>c.date).map(c=>c.date).sort();
  const dateRange = sortedDates.length?(sortedDates[0]===sortedDates[sortedDates.length-1]?fmtDate(sortedDates[0]):`${fmtDate(sortedDates[0]).split(",")[0]} – ${fmtDate(sortedDates[sortedDates.length-1]).split(",")[0]}`):"—";

  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28,animation:"fadeUp .5s ease both"}}>
        <StatCard label="Total Posts"       value={campaigns.length} sub={dateRange}                                    c="var(--accent)"/>
        <StatCard label="Unique Authors"     value={authors.length}   sub="Contributing analysts"                        c="var(--purple)"/>
      </div>
      {/* Filter bar */}
      {(()=>{
        const hasFilters = search||filterAuthor!=="all"||filterDateFrom||filterDateTo;
        return (
          <div style={{marginBottom:16,animation:"fadeUp .5s ease .08s both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
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
              {currentUser.role==="admin"&&campaigns.length>0&&<button onClick={()=>{const cid=campaigns[0]?.campaignId;if(cid&&window.confirm(`Delete all bounties for this campaign? This cannot be undone.`)){onDeleteAll&&onDeleteAll(cid);}}} style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(220,38,38,0.25)",background:"rgba(220,38,38,0.06)",color:"var(--red)",cursor:"pointer",fontWeight:500}}><Icons.Trash/> DELETE ALL</button>}
              {canAdd&&<button onClick={()=>{setEdit(null);setShowForm(true)}} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.08)",color:"var(--accent)",cursor:"pointer",fontWeight:500}}><Icons.Plus/> ADD ENTRY</button>}
            </div>
            {showFilters&&(
              <div style={{marginTop:10,padding:"14px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:140}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Author</span>
                  <select value={filterAuthor} onChange={e=>{setFA(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                    <option value="all">All Authors</option>
                    {authors.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>From</span>
                  <input type="date" value={filterDateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>To</span>
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
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)",animation:"fadeUp .5s ease .12s both"}}>
        <div style={{display:"grid",gridTemplateColumns:"108px 1fr 110px 54px",padding:"10px 20px",borderBottom:"1px solid var(--border)",background:"var(--surface)"}}>
          {["Date","Title & Links","Author",""].map(h=><div key={h} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase"}}>{h}</div>)}
        </div>
        {!campaigns.length
          ? <div style={{textAlign:"center",padding:"60px 20px"}}>
              <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⬡</div>
              <div style={{fontSize:14,fontWeight:500,color:"var(--muted)",marginBottom:6}}>No entries yet</div>
              {canAdd&&<button onClick={()=>{setEdit(null);setShowForm(true)}} style={{marginTop:16,display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.07)",color:"var(--accent)",cursor:"pointer"}}><Icons.Plus/>ADD FIRST ENTRY</button>}
            </div>
          : filtered.length===0
            ? <div style={{textAlign:"center",padding:"40px 20px",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--dim)"}}>No matches</div>
            : paged.map((c,i)=>{
                const ac=getAuthorColor(c.author);
                const dp=fmtDate(c.date).split(", ");
                const editable=canEdit(c);
                return (
                  <div key={c.id} onClick={()=>setView(c)}
                    style={{display:"grid",gridTemplateColumns:"108px 1fr 110px 54px",padding:"12px 20px",borderBottom:"1px solid var(--border)",alignItems:"center",cursor:"pointer",transition:"background .15s",animation:`rowIn .3s ease ${i*.025}s both`}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.04)"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>
                      <span style={{display:"block",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{dp[0]}</span>{dp[1]||""}
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
                    <div style={{display:"flex",alignItems:"center",gap:7,minWidth:0}}>
                      <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500,flexShrink:0,background:ac.bg,color:ac.color,border:"1px solid var(--border2)"}}>{initials(c.author)}</div>
                      <span title={c.author||""} style={{fontSize:11,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{c.author}</span>
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
      {view&&<BountyDetailModal entry={view} canEdit={canEdit(view)} onEdit={()=>{setEdit(view);setShowForm(true);setView(null);}} onClose={()=>setView(null)}/>}
      {showForm&&<CampForm initial={editEntry} isEdit={!!editEntry} onSave={async f=>{await onSave(f,editEntry);setShowForm(false);setEdit(null)}} onClose={()=>{setShowForm(false);setEdit(null)}} currentUser={currentUser}/>}
      {confirmId&&<ConfirmDelete onConfirm={()=>{onDelete(confirmId);setConfId(null)}} onCancel={()=>setConfId(null)}/>}
    </>
  );
};

// ─────────────────────────────────────────────────────────
//  CITATION DETAIL MODAL
// ─────────────────────────────────────────────────────────
const CitationDetailModal = ({entry, onEdit, onClose, canEdit:isEditable}) => {
  const mc = getPaletteColor(AUTHOR_PALETTE,"media",entry.media||"?");
  const InfoBlock = ({label, value, full=false}) => !value ? null : (
    <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)",gridColumn:full?"1/-1":"auto"}}>
      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
      <div style={{fontSize:13,fontWeight:500,wordBreak:"break-word"}}>{value}</div>
    </div>
  );
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",backdropFilter:"blur(6px)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.15)",width:"min(560px,100%)",maxHeight:"90vh",display:"flex",flexDirection:"column",position:"relative",animation:"modalIn .2s ease"}}>
        {/* Header */}
        <div style={{padding:"24px 28px 16px",borderBottom:"1px solid var(--border)",flexShrink:0}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"var(--muted)"}}><Icons.X/></button>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:8}}>// media citation</div>
          <h2 style={{fontSize:16,fontWeight:500,lineHeight:1.4,paddingRight:24}}>{entry.topic||"—"}</h2>
        </div>
        {/* Scrollable body */}
        <div style={{overflowY:"auto",padding:"20px 28px",flex:1}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
            <InfoBlock label="Date" value={fmtDate(entry.date)}/>
            <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Media Outlet</div>
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
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:8}}>Article Link</div>
              <a href={entry.articleLink} target="_blank" rel="noreferrer"
                style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"6px 14px",borderRadius:8,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none",display:"inline-flex",alignItems:"center",gap:4}}>
                Open Article ↗
              </a>
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
      <div style={{background:"var(--surface)",borderLeft:"1px solid var(--border)",boxShadow:"-4px 0 32px rgba(13,21,32,0.12)",width:"min(480px,100%)",height:"100%",overflowY:"auto",padding:"32px 30px 48px",position:"relative",animation:"slideIn .22s cubic-bezier(0.22,1,0.36,1)",display:"flex",flexDirection:"column",gap:0}}>
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
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Campaign-Specific Fields</div>
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

const MediaTable = ({citations,onSave,onDelete,onDeleteAll,currentUser,readOnly}) => {
  const [search,setSearch]=useState("");
  const [filterAuthor,setFA]=useState("all");
  const [filterMedia,setFM]=useState("all");
  const [filterDateFrom,setDateFrom]=useState("");
  const [filterDateTo,setDateTo]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [editEntry,setEdit]=useState(null);
  const [confirmId,setConfId]=useState(null);
  const [view,setView]=useState(null);
  const [page,setPage]=useState(1);
  const [showFilters,setShowFilters]=useState(false);
  const resetFilters=()=>{setSearch("");setFA("all");setFM("all");setDateFrom("");setDateTo("");setPage(1);};
  const canAdd=!readOnly;
  const canEdit=entry=>{
    if(readOnly)return false;
    if(currentUser.role==="admin")return true;
    if(currentUser.role==="author"){const name=(currentUser.displayName||currentUser.username).toLowerCase();return(entry.author||"").toLowerCase()===name;}
    return false;
  };
  const filtered=citations.filter(c=>{
    const q=search.toLowerCase();
    const matchQ=!q||c.media?.toLowerCase().includes(q)||c.reporter?.toLowerCase().includes(q)||c.author?.toLowerCase().includes(q)||c.topic?.toLowerCase().includes(q);
    const matchA=filterAuthor==="all"||c.author===filterAuthor;
    const matchM=filterMedia==="all"||c.media===filterMedia;
    const matchFrom=!filterDateFrom||(c.date||"")>=filterDateFrom;
    const matchTo=!filterDateTo||(c.date||"")<=filterDateTo;
    return matchQ&&matchA&&matchM&&matchFrom&&matchTo;
  });
  const sortedFiltered=[...filtered].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  const paged=sortedFiltered.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
  const medias=[...new Set(citations.map(c=>c.media).filter(Boolean))];
  const authors=[...new Set(citations.map(c=>c.author).filter(Boolean))];
  const COLS="108px 15% 12% 12% 1fr 54px";
  return (
    <>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16,marginBottom:28,animation:"fadeUp .5s ease both"}}>
        <StatCard label="Total Citations" value={citations.length} sub="All media mentions" c="var(--accent)"/>
        <StatCard label="Media Outlets"   value={medias.length}    sub={medias.slice(0,3).join(", ")||"—"} c="var(--accent)"/>
      </div>
      {/* Filter bar */}
      {(()=>{
        const hasFilters = search||filterAuthor!=="all"||filterMedia!=="all"||filterDateFrom||filterDateTo;
        return (
          <div style={{marginBottom:16,animation:"fadeUp .5s ease .08s both"}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{position:"relative",flex:1,maxWidth:320}}>
                <div style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:"var(--dim)",pointerEvents:"none"}}><Icons.Search/></div>
                <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search media, reporter, topic…" style={{...iStyle,padding:"8px 10px 8px 30px",fontSize:11}}/>
              </div>
              <button onClick={()=>setShowFilters(v=>!v)}
                style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:`1px solid ${showFilters||hasFilters?"rgba(26,58,92,0.3)":"var(--border)"}`,background:showFilters||hasFilters?"rgba(26,58,92,0.07)":"var(--surface)",color:showFilters||hasFilters?"var(--accent)":"var(--muted)",cursor:"pointer",transition:"all .15s"}}>
                ⚙ Filters {hasFilters&&<span style={{background:"var(--accent)",color:"#fff",borderRadius:100,padding:"1px 6px",fontSize:9,fontWeight:500}}>{[search,filterAuthor!=="all",filterMedia!=="all",filterDateFrom,filterDateTo].filter(Boolean).length}</span>}
              </button>
              {hasFilters&&<button onClick={resetFilters} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"8px 12px",borderRadius:8,border:"1px solid var(--border)",background:"transparent",color:"var(--dim)",cursor:"pointer"}}>Clear</button>}
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",marginLeft:4}}>{filtered.length} result{filtered.length!==1?"s":""}</span>
              {currentUser.role==="admin"&&citations.length>0&&<button onClick={()=>{const cid=citations[0]?.campaignId;if(cid&&window.confirm(`Delete all citations for this campaign? This cannot be undone.`)){onDeleteAll&&onDeleteAll(cid);}}} style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(220,38,38,0.25)",background:"rgba(220,38,38,0.06)",color:"var(--red)",cursor:"pointer",fontWeight:500}}><Icons.Trash/> DELETE ALL</button>}
              {canAdd&&<button onClick={()=>{setEdit(null);setShowForm(true)}} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 14px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.07)",color:"var(--accent)",cursor:"pointer",fontWeight:500}}><Icons.Plus/> ADD CITATION</button>}
            </div>
            {showFilters&&(
              <div style={{marginTop:10,padding:"14px 16px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:10,display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
                <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:140}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Author</span>
                  <select value={filterAuthor} onChange={e=>{setFA(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                    <option value="all">All Authors</option>
                    {authors.map(a=><option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:160}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Media Outlet</span>
                  <select value={filterMedia} onChange={e=>{setFM(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,cursor:"pointer"}}>
                    <option value="all">All Outlets</option>
                    {medias.map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>From</span>
                  <input type="date" value={filterDateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>To</span>
                  <input type="date" value={filterDateTo} onChange={e=>{setDateTo(e.target.value);setPage(1)}} style={{...iStyle,padding:"6px 10px",fontSize:11,width:140}}/>
                </div>
              </div>
            )}
            {hasFilters&&(
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
                {search&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>"{search}"</span>}
                {filterAuthor!=="all"&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>{filterAuthor}</span>}
                {filterMedia!=="all"&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>{filterMedia}</span>}
                {filterDateFrom&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>From {filterDateFrom}</span>}
                {filterDateTo&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:"2px 8px",borderRadius:4,background:"rgba(26,58,92,0.07)",border:"1px solid rgba(26,58,92,0.15)",color:"var(--accent)"}}>To {filterDateTo}</span>}
              </div>
            )}
          </div>
        );
      })()}
      <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,boxShadow:"0 1px 4px rgba(0,0,0,0.06)",animation:"fadeUp .5s ease .12s both"}}>
            <div style={{display:"grid",gridTemplateColumns:COLS,padding:"10px 20px",borderBottom:"1px solid var(--border)",background:"var(--surface)"}}>
              {["Date","Media","Reporter","Author","Topic",""].map(h=><div key={h} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</div>)}
            </div>
            {!citations.length
              ? <div style={{textAlign:"center",padding:"60px 20px"}}>
                  <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⬡</div>
                  <div style={{fontSize:14,fontWeight:500,color:"var(--muted)",marginBottom:6}}>No citations yet</div>
                  {canAdd&&<button onClick={()=>{setEdit(null);setShowForm(true)}} style={{marginTop:16,display:"inline-flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"9px 18px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.07)",color:"var(--accent)",cursor:"pointer"}}><Icons.Plus/>ADD FIRST CITATION</button>}
                </div>
              : filtered.length===0
                ? <div style={{textAlign:"center",padding:"40px 20px",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--dim)"}}>No matches</div>
                : paged.map((c,i)=>{
                    const mc=getPaletteColor(AUTHOR_PALETTE,"media",c.media||"?");
                    const dp=fmtDate(c.date).split(", ");
                    const editable=canEdit(c);
                    return (
                      <div key={c.id} onClick={()=>setView(c)} style={{display:"grid",gridTemplateColumns:COLS,padding:"12px 20px",borderBottom:"1px solid var(--border)",alignItems:"center",transition:"background .15s",animation:`rowIn .3s ease ${i*.025}s both`,cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.04)"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>
                          <span style={{display:"block",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em"}}>{dp[0]}</span>{dp[1]||""}
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:6,paddingRight:8,minWidth:0}}>
                          <div style={{width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:500,flexShrink:0,background:mc.bg,color:mc.color,border:"1px solid var(--border2)"}}>{initials(c.media)}</div>
                          <span title={c.media||""} style={{fontSize:11,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{c.media||"—"}</span>
                        </div>
                        <div title={c.reporter||""} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{c.reporter||"—"}</div>
                        <div title={c.author||""} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{c.author||"—"}</div>
                        <div style={{paddingRight:8,minWidth:0}}>
                          <div title={c.topic||""} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{c.topic||"—"}</div>
                          {c.headline&&<div title={c.headline} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{c.headline}</div>}
                          <div style={{display:"flex",gap:4,flexWrap:"wrap",alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                            {c.mediaTier&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(22,101,52,0.07)",border:"1px solid rgba(22,101,52,0.2)",color:"#166534"}}>{c.mediaTier}</span>}
                            {c.language&&c.language.toLowerCase()!=="english"&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 5px",borderRadius:4,background:"rgba(100,116,139,0.08)",border:"1px solid rgba(100,116,139,0.2)",color:"#475569"}}>{c.language}</span>}
                            {c.articleLink&&<a href={c.articleLink} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 6px",borderRadius:4,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.2)",color:"var(--accent)",textDecoration:"none"}}>Link↗</a>}
                          </div>
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
      {view&&<CitationDetailModal entry={view} canEdit={canEdit(view)} onEdit={()=>{setEdit(view);setShowForm(true);setView(null);}} onClose={()=>setView(null)}/>}
      {showForm&&<MediaForm initial={editEntry} isEdit={!!editEntry} onSave={async f=>{await onSave(f,editEntry);setShowForm(false);setEdit(null)}} onClose={()=>{setShowForm(false);setEdit(null)}}/>}
      {confirmId&&<ConfirmDelete onConfirm={()=>{onDelete(confirmId);setConfId(null)}} onCancel={()=>setConfId(null)}/>}
    </>
  );
};

// ─────────────────────────────────────────────────────────
//  ANALYTICS TAB (Client only)
// ─────────────────────────────────────────────────────────
const AnalyticsTab = ({campaigns, citations, clientName}) => {
  const [range, setRange]       = useState("all");

  const totalBounties  = campaigns.length;
  const totalCitations = citations.length;

  // Build weekly series
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
  const weekMap = {};
  const addTo = (iso, key) => {
    if(!iso) return;
    const wk = getWeekKey(iso);
    if(!wk) return;
    if(!weekMap[wk]) weekMap[wk] = {week:wk, bounties:0, citations:0};
    weekMap[wk][key]++;
  };
  campaigns.forEach(c => addTo(c.date, "bounties"));
  citations.forEach(c => addTo(c.date, "citations"));

  let allWeeks = Object.values(weekMap).sort((a,b)=>a.week.localeCompare(b.week));

  if(range !== "all" && allWeeks.length > 0) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - parseInt(range));
    const cutStr = cutoff.toISOString().slice(0,10);
    allWeeks = allWeeks.filter(w => w.week >= cutStr);
  }

  let cumB = 0, cumC = 0;
  const chartData = allWeeks.map(w => {
    cumB += w.bounties; cumC += w.citations;
    try {
      const d = new Date(w.week+"T00:00:00");
      return {
        ...w,
        label: isNaN(d.getTime()) ? w.week : d.toLocaleDateString("en-US",{month:"short",day:"numeric"}),
        cumBounties: cumB,
        cumCitations: cumC,
      };
    } catch {
      return { ...w, label: w.week, cumBounties: cumB, cumCitations: cumC };
    }
  });

  const SUMMARY = [
    {label:"Bounties Created", value:totalBounties,  sub:"Bounty posts"},
    {label:"Media Citations",  value:totalCitations, sub:"Total coverage"},
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
          <h2 style={{fontSize:22,fontWeight:500}}>Analytics</h2>
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

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28}}>
        {SUMMARY.map((s,i)=>(
          <div key={i} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"20px 22px",position:"relative",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:"var(--accent)",opacity:.5}}/>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:500,marginBottom:8}}>{s.label}</div>
            <div style={{fontSize:32,fontWeight:500,color:"var(--accent)",lineHeight:1,marginBottom:4}}>{s.value}</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--muted)"}}>{s.sub}</div>
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
          {/* Combined monthly + cumulative chart */}
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"24px",marginBottom:16,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Weekly Activity & Running Total</div>
              <div style={{display:"flex",gap:16}}>
                {[{color:"rgba(26,58,92,0.3)",label:"Bounties (weekly)"},{color:"rgba(74,127,168,0.5)",label:"Citations (weekly)"},{color:"#1a3a5c",label:"Bounties (total)",line:true},{color:"#4a7fa8",label:"Citations (total)",line:true}].map((l,i)=>(
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
                <XAxis dataKey="label" tick={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fill:"#6e7f92"}} axisLine={false} tickLine={false}/>
                <YAxis yAxisId="monthly" tick={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fill:"#6e7f92"}} axisLine={false} tickLine={false} width={28} allowDecimals={false}/>
                <YAxis yAxisId="cumulative" orientation="right" tick={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fill:"#6e7f92"}} axisLine={false} tickLine={false} width={36} allowDecimals={false}/>
                <Tooltip content={({active,payload,label})=>{
                  if(!active||!payload?.length) return null;
                  const names={bounties:"Bounties / wk",citations:"Citations / wk",cumBounties:"Total Bounties",cumCitations:"Total Citations"};
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

          {/* Top Topics */}
          {(()=>{
            const topicMap = {};
            citations.forEach(c=>{
              const t = (c.topic||"").trim()||"Uncategorised";
              if(!topicMap[t]) topicMap[t]={topic:t,count:0,outlets:new Set(),authors:new Set()};
              topicMap[t].count++;
              if(c.media) topicMap[t].outlets.add(c.media);
              if(c.author) topicMap[t].authors.add(c.author);
            });
            const ranked = Object.values(topicMap)
              .map(r=>({...r,outlets:r.outlets.size,authors:r.authors.size}))
              .sort((a,b)=>b.count-a.count);
            if(!ranked.length) return null;
            const maxCount = ranked[0].count;
            const TopicsBlock = () => {
              const [expanded,setExpanded] = useState(false);
              const visible = expanded ? ranked : ranked.slice(0,10);
              return (
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"24px",marginTop:16,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Top Media Citation Topics</div>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"2px 8px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{ranked.length} topics</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14,maxHeight:expanded?"420px":"none",overflowY:expanded?"auto":"visible",paddingRight:expanded?"4px":"0"}}>
                  {(expanded ? ranked : ranked.slice(0,5)).map((r,i)=>(
                    <div key={r.topic}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:7,gap:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",width:18,flexShrink:0}}>{i+1}</span>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:13,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.topic}</div>
                            <div style={{display:"flex",gap:12,marginTop:3}}>
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>
                                <span style={{color:"var(--muted)",fontWeight:500}}>{r.outlets}</span> outlet{r.outlets!==1?"s":""}
                              </span>
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>
                                <span style={{color:"var(--muted)",fontWeight:500}}>{r.authors}</span> author{r.authors!==1?"s":""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:500,color:"#4a7fa8"}}>{r.count}</span>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>mention{r.count!==1?"s":""}</span>
                        </div>
                      </div>
                      <div style={{height:4,borderRadius:99,background:"var(--surface2)",border:"1px solid var(--border)",overflow:"hidden"}}>
                        <div style={{width:`${(r.count/maxCount)*100}%`,height:"100%",background:"#4a7fa8",opacity:.7,borderRadius:99,transition:"width .5s ease"}}/>
                      </div>
                    </div>
                  ))}
                </div>
                {ranked.length > 5 && (
                  <button onClick={()=>setExpanded(v=>!v)}
                    style={{marginTop:16,width:"100%",padding:"9px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--accent)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)"}}>
                    {expanded?`▲ SHOW LESS`:`▼ SHOW ALL ${ranked.length} TOPICS`}
                  </button>
                )}
              </div>
              );
            };
            return <TopicsBlock/>;
          })()}

          {/* Top Authors */}
          {(()=>{
            const authorMap = {};
            campaigns.forEach(c=>{
              const a = c.author||"Unknown";
              if(!authorMap[a]) authorMap[a]={author:a,bounties:0,citations:0};
              authorMap[a].bounties++;
            });
            citations.forEach(c=>{
              const a = c.author||"Unknown";
              if(!authorMap[a]) authorMap[a]={author:a,bounties:0,citations:0};
              authorMap[a].citations++;
            });
            const ranked = Object.values(authorMap).sort((a,b)=>(b.bounties+b.citations)-(a.bounties+a.citations));
            if(!ranked.length) return null;
            const maxTotal = ranked[0].bounties + ranked[0].citations;
            const AuthorsBlock = () => {
              const [expanded,setExpanded] = useState(false);
              return (
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"24px",marginTop:16,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:20}}>Top Authors</div>
                <div style={{display:"flex",flexDirection:"column",gap:12,maxHeight:expanded?"420px":"none",overflowY:expanded?"auto":"visible",paddingRight:expanded?"4px":"0"}}>
                  {(expanded ? ranked : ranked.slice(0,5)).map((r,i)=>{
                    const total = r.bounties + r.citations;
                    return (
                      <div key={r.author}>
                        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",width:18}}>{i+1}</span>
                            <span style={{fontSize:14,fontWeight:500,color:"var(--text)"}}>{r.author}</span>
                          </div>
                          <div style={{display:"flex",gap:14,alignItems:"center"}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>
                              <span style={{color:"var(--accent)",fontWeight:500}}>{r.bounties}</span> bounties
                            </span>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>
                              <span style={{color:"#4a7fa8",fontWeight:500}}>{r.citations}</span> citations
                            </span>
                            
                          </div>
                        </div>
                        <div style={{height:5,borderRadius:99,background:"var(--surface2)",border:"1px solid var(--border)",overflow:"hidden"}}>
                          <div style={{display:"flex",height:"100%"}}>
                            <div style={{width:`${maxTotal?(r.bounties/maxTotal)*100:0}%`,background:"var(--accent)",opacity:.75,transition:"width .4s ease"}}/>
                            <div style={{width:`${maxTotal?(r.citations/maxTotal)*100:0}%`,background:"#4a7fa8",opacity:.65,transition:"width .4s ease"}}/>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {ranked.length > 5 && (
                  <button onClick={()=>setExpanded(v=>!v)}
                    style={{marginTop:16,width:"100%",padding:"9px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--accent)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)"}}>
                    {expanded?`▲ SHOW LESS`:`▼ SHOW ALL ${ranked.length} AUTHORS`}
                  </button>
                )}
              </div>
              );
            };
            return <AuthorsBlock/>;
          })()}

          {/* Top Media Outlets */}
          {(()=>{
            const mediaMap = {};
            citations.forEach(c=>{
              const m = (c.media||"").trim()||"Unknown";
              if(!mediaMap[m]) mediaMap[m]={media:m,count:0,topics:new Set(),authors:new Set()};
              mediaMap[m].count++;
              if(c.topic) mediaMap[m].topics.add(c.topic);
              if(c.author) mediaMap[m].authors.add(c.author);
            });
            const ranked = Object.values(mediaMap)
              .map(r=>({...r,topics:r.topics.size,authors:r.authors.size}))
              .sort((a,b)=>b.count-a.count);
            if(!ranked.length) return null;
            const maxCount = ranked[0].count;
            const MediaBlock = () => {
              const [expanded,setExpanded] = useState(false);
              return (
              <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"24px",marginTop:16,boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Top Media Outlets</div>
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"2px 8px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{ranked.length} outlets</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:14,maxHeight:expanded?"420px":"none",overflowY:expanded?"auto":"visible",paddingRight:expanded?"4px":"0"}}>
                  {(expanded ? ranked : ranked.slice(0,5)).map((r,i)=>(
                    <div key={r.media}>
                      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:7,gap:12}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",width:18,flexShrink:0}}>{i+1}</span>
                          <div style={{minWidth:0}}>
                            <div title={r.media} style={{fontSize:13,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.media}</div>
                            <div style={{display:"flex",gap:12,marginTop:3}}>
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>
                                <span style={{color:"var(--muted)",fontWeight:500}}>{r.topics}</span> topic{r.topics!==1?"s":""}
                              </span>
                              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>
                                <span style={{color:"var(--muted)",fontWeight:500}}>{r.authors}</span> author{r.authors!==1?"s":""}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:500,color:"#4a7fa8"}}>{r.count}</span>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>article{r.count!==1?"s":""}</span>
                        </div>
                      </div>
                      <div style={{height:4,borderRadius:99,background:"var(--surface2)",border:"1px solid var(--border)",overflow:"hidden"}}>
                        <div style={{width:`${(r.count/maxCount)*100}%`,height:"100%",background:"#4a7fa8",opacity:.7,borderRadius:99,transition:"width .5s ease"}}/>
                      </div>
                    </div>
                  ))}
                </div>
                {ranked.length > 5 && (
                  <button onClick={()=>setExpanded(v=>!v)}
                    style={{marginTop:16,width:"100%",padding:"9px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--accent)"}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)"}}>
                    {expanded?`▲ SHOW LESS`:`▼ SHOW ALL ${ranked.length} OUTLETS`}
                  </button>
                )}
              </div>
              );
            };
            return <MediaBlock/>;
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
  const [drill, setDrill] = useState(null); // "bounties" | "citations" | null

  const today = new Date();
  today.setHours(23,59,59,999);
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - 6);
  cutoff.setHours(0,0,0,0);
  const cutStr = cutoff.toISOString().slice(0,10);

  // Check if there's any data in the last 7 days — if not, fall back to last available 7 days
  const hasRecentData = campaigns.some(c=>c.date>=cutStr) || citations.some(c=>c.date>=cutStr);

  let activeCutStr = cutStr;
  let isHistorical = false;

  if(!hasRecentData) {
    const allDates = [
      ...campaigns.map(c=>c.date),
      ...citations.map(c=>c.date)
    ].filter(Boolean).sort();
    if(allDates.length) {
      const lastDate = new Date(allDates[allDates.length-1]+"T00:00:00");
      const fallbackCutoff = new Date(lastDate);
      fallbackCutoff.setDate(lastDate.getDate() - 6);
      activeCutStr = fallbackCutoff.toISOString().slice(0,10);
      isHistorical = true;
    }
  }

  const weekBounties  = campaigns.filter(c=>c.date && c.date>=activeCutStr);
  const weekCitations = citations.filter(c=>c.date && c.date>=activeCutStr);

  const authorsSet  = new Set([...weekBounties.map(c=>c.author),...weekCitations.map(c=>c.author)].filter(Boolean));
  const outletsSet  = new Set(weekCitations.map(c=>c.media).filter(Boolean));

  // Top authors by activity
  const authorMap = {};
  weekBounties.forEach(c=>{ const a=c.author||"Unknown"; if(!authorMap[a]) authorMap[a]={name:a,bounties:0,citations:0}; authorMap[a].bounties++; });
  weekCitations.forEach(c=>{ const a=c.author||"Unknown"; if(!authorMap[a]) authorMap[a]={name:a,bounties:0,citations:0}; authorMap[a].citations++; });
  const allWeekAuthors = Object.values(authorMap).sort((a,b)=>(b.bounties+b.citations)-(a.bounties+a.citations));

  // Top outlets
  const outletMap = {};
  weekCitations.forEach(c=>{ const m=c.media||"Unknown"; if(!outletMap[m]) outletMap[m]=0; outletMap[m]++; });
  const allWeekOutlets = Object.entries(outletMap).sort((a,b)=>b[1]-a[1]);

  const windowStart = new Date(activeCutStr+"T00:00:00");
  const windowEnd   = new Date(activeCutStr+"T00:00:00");
  windowEnd.setDate(windowStart.getDate()+6);
  const dateRange = `${windowStart.toLocaleDateString("en-US",{month:"short",day:"numeric"})} – ${windowEnd.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}`;

  const STATS = [
    {label:"Bounties",      value:weekBounties.length,  sub:"New posts",          c:"var(--accent)", key:"bounties"},
    {label:"Citations",     value:weekCitations.length, sub:"Media mentions",     c:"#4a7fa8",       key:"citations"},
    {label:"Active Authors",value:authorsSet.size,      sub:"Contributors",       c:"var(--accent)", key:null},
    {label:"Media Outlets", value:outletsSet.size,      sub:"Unique publications", c:"#4a7fa8",       key:null},
  ];

  if(drill) {
    const items = drill==="bounties" ? weekBounties : weekCitations;
    const sorted = [...items].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
    const DrillList = () => {
      const [expanded, setExpanded] = useState(false);
      const visible = expanded ? sorted : sorted.slice(0,10);
      return (
        <div style={{animation:"fadeUp .4s ease both"}}>
          <button onClick={()=>setDrill(null)} style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",cursor:"pointer",marginBottom:20}}>
            ← Back to Summary
          </button>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>{dateRange}</div>
          <h3 style={{fontSize:18,fontWeight:500,marginBottom:20}}>{drill==="bounties"?"Bounties":"Media Citations"} This Week <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:13,fontWeight:400,color:"var(--dim)",marginLeft:8}}>{items.length} total</span></h3>
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}>
            {sorted.length===0
              ? <div style={{padding:"40px",textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:"var(--dim)"}}>No activity this week</div>
              : <>
                <div style={{maxHeight:expanded?"600px":"520px",overflowY:"auto"}}>
                  {visible.map((item,i)=>(
                    <div key={item.id} style={{display:"grid",gridTemplateColumns:"90px 1fr auto",alignItems:"center",gap:12,padding:"12px 20px",borderBottom:i<visible.length-1?"1px solid var(--border)":"none",transition:"background .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(26,58,92,0.04)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>{item.date}</div>
                      <div style={{minWidth:0}}>
                        <div title={drill==="bounties"?item.title:item.topic} style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{drill==="bounties"?item.title:(item.topic||item.media)}</div>
                        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>{drill==="bounties"?item.author:`${item.media}${item.reporter&&item.reporter!=="Publisher"?` · ${item.reporter}`:""}`}</div>
                      </div>
                      {(drill==="bounties"?item.cqLink:item.articleLink)&&(
                        <a href={drill==="bounties"?item.cqLink:item.articleLink} target="_blank" rel="noreferrer"
                          style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"3px 8px",borderRadius:4,background:"rgba(26,58,92,0.06)",border:"1px solid rgba(26,58,92,0.1)",color:"var(--accent)",textDecoration:"none",flexShrink:0}}>↗</a>
                      )}
                    </div>
                  ))}
                </div>
                {sorted.length>10&&(
                  <button onClick={()=>setExpanded(v=>!v)}
                    style={{width:"100%",padding:"10px",border:"none",borderTop:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
                    onMouseEnter={e=>{e.currentTarget.style.color="var(--accent)"}}
                    onMouseLeave={e=>{e.currentTarget.style.color="var(--muted)"}}>
                    {expanded?`▲ SHOW LESS`:`▼ SHOW ALL ${sorted.length} ENTRIES`}
                  </button>
                )}
              </>
            }
          </div>
        </div>
      );
    };
    return <DrillList/>;
  }

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em"}}>{dateRange}</div>
          {isHistorical&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"2px 8px",borderRadius:4,background:"rgba(217,119,6,0.08)",border:"1px solid rgba(217,119,6,0.2)",color:"var(--orange)"}}>Last available data</span>}
        </div>
        <h2 style={{fontSize:22,fontWeight:500}}>Weekly Summary</h2>
      </div>

      {/* Stats - clickable for bounties/citations */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:28}}>
        {STATS.map((s,i)=>(
          <div key={i} onClick={s.key?()=>setDrill(s.key):undefined}
            style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"20px 22px",position:"relative",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",cursor:s.key?"pointer":"default",transition:"all .15s"}}
            onMouseEnter={e=>{if(s.key){e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)";}}}
            onMouseLeave={e=>{if(s.key){e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.boxShadow="0 1px 3px rgba(0,0,0,0.05)";}}}
          >
            <div style={{position:"absolute",top:0,left:0,bottom:0,width:3,background:s.c,opacity:.7,borderRadius:"12px 0 0 12px"}}/>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:500,marginBottom:8,paddingLeft:10}}>
              {s.label}{s.key&&<span style={{marginLeft:6,opacity:.5}}>→</span>}
            </div>
            <div style={{fontSize:32,fontWeight:500,color:"var(--text)",lineHeight:1,marginBottom:4,paddingLeft:10}}>{s.value}</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--muted)",paddingLeft:10}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Daily activity chart */}
      {(()=>{
        const days = Array.from({length:7},(_,i)=>{
          const d = new Date(activeCutStr+"T00:00:00");
          d.setDate(d.getDate()+i);
          return d.toISOString().slice(0,10);
        });
        const dayData = days.map(day=>({
          day,
          short: new Date(day+"T00:00:00").toLocaleDateString("en-US",{weekday:"short"}),
          date:  new Date(day+"T00:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"}),
          bounties:  weekBounties.filter(c=>c.date===day).length,
          citations: weekCitations.filter(c=>c.date===day).length,
        }));
        const maxVal = Math.max(...dayData.map(d=>d.bounties+d.citations), 1);
        return (
          <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"20px 22px",marginBottom:16,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Daily Activity</div>
              <div style={{display:"flex",gap:14}}>
                {[{color:"var(--accent)",label:"Bounties"},{color:"#4a7fa8",label:"Citations"}].map((l,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:5}}>
                    <div style={{width:8,height:8,borderRadius:2,background:l.color}}/>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",alignItems:"flex-end",gap:8,height:120,paddingTop:24}}>
              {dayData.map((d,i)=>{
                const bPct = maxVal ? (d.bounties/maxVal)*88 : 0;
                const cPct = maxVal ? (d.citations/maxVal)*88 : 0;
                const total = d.bounties + d.citations;
                return (
                  <div key={d.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4,height:"100%",justifyContent:"flex-end"}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:total>0?"var(--accent)":"var(--border2)",fontWeight:total>0?500:400,marginBottom:2}}>{total>0?total:""}</div>
                    <div style={{width:"100%",display:"flex",flexDirection:"column",gap:2,alignItems:"center"}}>
                      {d.citations>0&&<div style={{width:"80%",height:`${cPct}px`,minHeight:d.citations>0?4:0,background:"#4a7fa8",opacity:.75,borderRadius:"3px 3px 0 0",transition:"height .4s ease"}}/>}
                      {d.bounties>0&&<div style={{width:"80%",height:`${bPct}px`,minHeight:d.bounties>0?4:0,background:"var(--accent)",opacity:.8,borderRadius:d.citations>0?"0":"3px 3px 0 0",transition:"height .4s ease"}}/>}
                      {total===0&&<div style={{width:"80%",height:3,background:"var(--border)",borderRadius:2}}/>}
                    </div>
                    <div style={{textAlign:"center",marginTop:6}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:500,color:total>0?"var(--text)":"var(--dim)"}}>{d.short}</div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:"var(--dim)"}}>{d.date}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Two column: top authors + top outlets */}
      {(()=>{
        const WeekAuthorsBlock = () => {
          const [expanded,setExpanded] = useState(false);
          const visible = expanded ? allWeekAuthors : allWeekAuthors.slice(0,5);
          return (
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"20px 22px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Top Authors</div>
                {allWeekAuthors.length>0&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"2px 8px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{allWeekAuthors.length}</span>}
              </div>
              {allWeekAuthors.length===0
                ? <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>No activity this week</div>
                : <>
                  <div style={{display:"flex",flexDirection:"column",maxHeight:expanded?"320px":"none",overflowY:expanded?"auto":"visible",paddingRight:expanded?"4px":"0"}}>
                    {visible.map((a,i)=>(
                      <div key={a.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:i<visible.length-1?"1px solid var(--border)":"none"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",width:16}}>{i+1}</span>
                          <span style={{fontSize:13,fontWeight:500,color:"var(--text)"}}>{a.name}</span>
                        </div>
                        <div style={{display:"flex",gap:10}}>
                          {a.bounties>0&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",fontWeight:500}}>{a.bounties}b</span>}
                          {a.citations>0&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#4a7fa8",fontWeight:500}}>{a.citations}c</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {allWeekAuthors.length>5&&(
                    <button onClick={()=>setExpanded(v=>!v)}
                      style={{marginTop:12,width:"100%",padding:"7px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--accent)"}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)"}}>
                      {expanded?`▲ SHOW LESS`:`▼ SHOW ALL ${allWeekAuthors.length} AUTHORS`}
                    </button>
                  )}
                </>
              }
            </div>
          );
        };
        const WeekOutletsBlock = () => {
          const [expanded,setExpanded] = useState(false);
          const visible = expanded ? allWeekOutlets : allWeekOutlets.slice(0,5);
          return (
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"20px 22px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Top Media Outlets</div>
                {allWeekOutlets.length>0&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"2px 8px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{allWeekOutlets.length}</span>}
              </div>
              {allWeekOutlets.length===0
                ? <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>No citations this week</div>
                : <>
                  <div style={{display:"flex",flexDirection:"column",maxHeight:expanded?"320px":"none",overflowY:expanded?"auto":"visible",paddingRight:expanded?"4px":"0"}}>
                    {visible.map(([outlet,count],i)=>(
                      <div key={outlet} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:i<visible.length-1?"1px solid var(--border)":"none"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",width:16}}>{i+1}</span>
                          <span title={outlet} style={{fontSize:13,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:160}}>{outlet}</span>
                        </div>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"#4a7fa8",fontWeight:500}}>{count} article{count!==1?"s":""}</span>
                      </div>
                    ))}
                  </div>
                  {allWeekOutlets.length>5&&(
                    <button onClick={()=>setExpanded(v=>!v)}
                      style={{marginTop:12,width:"100%",padding:"7px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--accent)"}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)"}}>
                      {expanded?`▲ SHOW LESS`:`▼ SHOW ALL ${allWeekOutlets.length} OUTLETS`}
                    </button>
                  )}
                </>
              }
            </div>
          );
        };
        return (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <WeekAuthorsBlock/>
            <WeekOutletsBlock/>
          </div>
        );
      })()}

      {/* Top Topics */}
      {(()=>{
        const topicMap = {};
        weekCitations.forEach(c=>{
          const t = (c.topic||"").trim()||"Uncategorised";
          if(!topicMap[t]) topicMap[t]={topic:t,count:0,outlets:new Set(),authors:new Set()};
          topicMap[t].count++;
          if(c.media) topicMap[t].outlets.add(c.media);
          if(c.author) topicMap[t].authors.add(c.author);
        });
        const ranked = Object.values(topicMap)
          .map(r=>({...r,outlets:r.outlets.size,authors:r.authors.size}))
          .sort((a,b)=>b.count-a.count);
        if(!ranked.length) return null;
        const maxCount = ranked[0].count;
        const WeekTopicsBlock = () => {
          const [expanded,setExpanded] = useState(false);
          const visible = expanded ? ranked : ranked.slice(0,5);
          return (
            <div style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"20px 22px",marginTop:16,boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em"}}>Top Topics</div>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",padding:"2px 8px",borderRadius:4,background:"var(--surface2)",border:"1px solid var(--border)"}}>{ranked.length} topics</span>
              </div>
              <div style={{display:"flex",flexDirection:"column",gap:12,maxHeight:expanded?"320px":"none",overflowY:expanded?"auto":"visible",paddingRight:expanded?"4px":"0"}}>
                {visible.map((r,i)=>(
                  <div key={r.topic}>
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:6,gap:10}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,minWidth:0}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)",width:16,flexShrink:0}}>{i+1}</span>
                        <div style={{minWidth:0}}>
                          <div title={r.topic} style={{fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.topic}</div>
                          <div style={{display:"flex",gap:10,marginTop:2}}>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}><span style={{color:"var(--muted)",fontWeight:500}}>{r.outlets}</span> outlet{r.outlets!==1?"s":""}</span>
                            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}><span style={{color:"var(--muted)",fontWeight:500}}>{r.authors}</span> author{r.authors!==1?"s":""}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:500,color:"#4a7fa8"}}>{r.count}</span>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)"}}>mention{r.count!==1?"s":""}</span>
                      </div>
                    </div>
                    <div style={{height:3,borderRadius:99,background:"var(--surface2)",border:"1px solid var(--border)",overflow:"hidden"}}>
                      <div style={{width:`${(r.count/maxCount)*100}%`,height:"100%",background:"#4a7fa8",opacity:.7,borderRadius:99,transition:"width .5s ease"}}/>
                    </div>
                  </div>
                ))}
              </div>
              {ranked.length>5&&(
                <button onClick={()=>setExpanded(v=>!v)}
                  style={{marginTop:12,width:"100%",padding:"7px",borderRadius:7,border:"1px solid var(--border)",background:"var(--surface2)",color:"var(--muted)",fontFamily:"'IBM Plex Mono',monospace",fontSize:10,cursor:"pointer",letterSpacing:"0.06em",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--border2)";e.currentTarget.style.color="var(--accent)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--muted)"}}>
                  {expanded?`▲ SHOW LESS`:`▼ SHOW ALL ${ranked.length} TOPICS`}
                </button>
              )}
            </div>
          );
        };
        return <WeekTopicsBlock/>;
      })()}
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
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",backdropFilter:"blur(10px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:20,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",width:"min(440px,100%)",padding:32,position:"relative",animation:"modalIn .25s ease"}}>
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
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>Data Entry Mode</div>
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
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:10}}>General Spreadsheet Link</div>
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
  );
};

const DrillSync = ({program, drillCamps, drillCites, setCampaigns, setCitations}) => {
  const [syncing,setSyncing] = useState(false);
  const [result,setResult]   = useState(null);
  const isSyncing = useRef(false);
  const norm = s => (s||'').trim().toLowerCase();
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
    console.log("doSync called, isSyncing:", isSyncing.current, "program:", program.id, "bounties URL:", program.sheetBounties, "media URL:", program.sheetMedia);
    if(isSyncing.current) return;
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
      if(program.sheetBounties){
        const text = await fetchSheet(program.sheetBounties);
        const rows = parseCSV(text);
        for(const r of rows){
          const link=r["quicktake link"]||r["quicktake_link"]||r["cq_link"]||r["link"]||"";
          const title=r["title"]||"";
          const rowNo=(r["no"]||r["#"]||"").trim();
          if(!rowNo&&!title&&!link) continue;
          const inNew=newBounties.some(b=>rowNo?b.sheetRowNo===rowNo:(link&&b.cqLink===link));
          const inDB=rowNo?exB.some(b=>b.sheet_row_no===rowNo):(link&&exB.some(b=>b.cq_link===link));
          if(inNew||inDB){skipped++;continue;}
          newBounties.push({id:uid(),campaignId:program.id,date:r["date"]||"",author:norm(r["author"]),title:title.trim(),cqLink:link,analyticsLink:(r["analytics link"]||r["cq analytics link"]||"").trim(),authorTwitterLink:(r["author twitter/x"]||r["analyst twitter/x post"]||"").trim(),cqTwitterLink:(r["cq twitter/x"]||r["twitter/x link"]||"").trim(),telegramLink:(r["telegram link"]||"").trim(),category:(r["category"]||"").trim(),asset:(r["asset"]||"").trim(),twitterImpressions:(r["twitter impressions"]||r["cq twitter/x impressions"]||"").trim(),telegramImpressions:(r["telegram impressions"]||"").trim(),note1:(r["note 1"]||r["note1"]||"").trim(),note2:(r["note 2"]||r["note2"]||"").trim(),note3:(r["note 3"]||r["note3"]||"").trim(),sheetRowNo:rowNo,createdBy:"sheet_sync"});
        }
      }
      if(program.sheetMedia){
        const text = await fetchSheet(program.sheetMedia);
        const rows = parseCSV(text);
        for(const r of rows){
          const link=r["article link"]||r["article_link"]||"";
          const media=(r["media outlet"]||r["media_outlet"]||r["media"]||"").trim();
          const rowNo2=(r["no"]||r["#"]||"").trim();
          if(!rowNo2&&!media) continue;
          const inNewM=newMedia.some(m=>rowNo2?m.sheetRowNo===rowNo2:(link&&m.articleLink===link));
          const inDBM=rowNo2?exM.some(m=>m.sheet_row_no===rowNo2):(link&&exM.some(m=>m.article_link===link));
          if(inNewM||inDBM){skipped++;continue;}
          newMedia.push({id:uid(),campaignId:program.id,date:r["date"]||"",media:media,reporter:(r["reporter"]||"").trim(),author:norm(r["author"]),topic:(r["topic"]||"").trim(),articleLink:link,headline:(r["headline"]||"").trim(),mediaTier:(r["media tier"]||"").trim(),directRelationship:(r["direct relationship"]||"").trim(),language:(r["language"]||"").trim(),asset:(r["asset"]||"").trim(),branding:(r["branding"]||"").trim(),sheetRowNo:rowNo2,createdBy:"sheet_sync"});
        }
      }
      if(newBounties.length){await db.batchInsertBounties(newBounties);setCampaigns(prev=>[...newBounties,...prev]);added+=newBounties.length;}
      if(newMedia.length){await db.batchInsertCitations(newMedia);setCitations(prev=>[...newMedia,...prev]);added+=newMedia.length;}
      setResult(`✓ ${added} added, ${skipped} skipped`);
    } catch(err){ setResult(`Error: ${err.message}`); }
    setSyncing(false);
    isSyncing.current = false;
  };
  return (
    <div style={{display:"flex",alignItems:"center",gap:8}}>
      {result&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:result.startsWith("✓")?"#166534":"var(--red)"}}>{result}</span>}
      <button onClick={doSync} disabled={syncing}
        style={{display:"flex",alignItems:"center",gap:5,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"7px 14px",borderRadius:8,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.06)",color:"var(--accent)",cursor:"pointer",transition:"all .15s"}}>
        {syncing?<><Icons.Spin/>Syncing…</>:"⟳ Sync Sheet"}
      </button>
    </div>
  );
};

const CampaignsPanel = ({programs,campaigns,citations,onSave,onDelete,onSaveCamp,onDeleteCamp,onSaveMedia,onDeleteMedia,currentUser,showToast,setCampaigns,setCitations}) => {
  const [showForm,setShowForm]   = useState(false);
  const [editClient,setEdit]     = useState(null);
  const [confirmId,setConfId]    = useState(null);
  const [drillId,setDrillId]     = useState(null); // campaign being viewed
  const [drillTab,setDrillTab]   = useState("weekly");

  const drillProgram = programs.find(c=>c.id===drillId)||null;
  const drillCamps  = campaigns.filter(c=>c.campaignId===drillId);
  const drillCites  = citations.filter(c=>c.campaignId===drillId);

  const Back = () => (
    <button onClick={()=>setDrillId(null)}
      style={{display:"inline-flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)",background:"transparent",border:"none",cursor:"pointer",padding:"0 0 16px 0",letterSpacing:"0.04em"}}
      onMouseEnter={e=>e.currentTarget.style.color="var(--accent)"}
      onMouseLeave={e=>e.currentTarget.style.color="var(--muted)"}>
      ← Back to Campaigns
    </button>
  );

  if (drillProgram) return (
    <div style={{animation:"fadeUp .4s ease both"}}>
      <Back/>
      {/* Drill header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:44,height:44,borderRadius:12,background:drillProgram.color+"18",border:`1px solid ${drillProgram.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:500,color:drillProgram.color}}>{initials(drillProgram.name)}</div>
          <div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.1em",fontWeight:500,marginBottom:3}}>// bounty detail</div>
            <h2 style={{fontSize:24,fontWeight:500,color:drillProgram.color}}>{drillProgram.name}</h2>
          </div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          {(drillProgram.sheetBounties||drillProgram.sheetMedia)&&<DrillSync program={drillProgram} drillCamps={drillCamps} drillCites={drillCites} setCampaigns={setCampaigns} setCitations={setCitations}/>}

          {currentUser.role==="admin"&&<RowBtn onClick={()=>{setEdit(drillProgram);setShowForm(true)}} title="Edit campaign" hb="var(--accent)" hc="var(--accent)" hbg="rgba(26,58,92,0.06)"><Icons.Edit/></RowBtn>}
          {currentUser.role==="admin"&&<RowBtn onClick={()=>setConfId(drillProgram.id)} title="Delete campaign" hb="var(--red)" hc="var(--red)" hbg="rgba(220,38,38,0.07)"><Icons.Trash/></RowBtn>}
        </div>
      </div>
      {/* Sub-tabs */}
      <div style={{display:"flex",gap:4,marginBottom:20,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:9,padding:4,width:"fit-content",boxShadow:"inset 0 1px 2px rgba(0,0,0,0.04)"}}>
        {[{id:"weekly",label:"Weekly Summary",count:""},{id:"posts",label:"Bounties",count:drillCamps.length},{id:"media",label:"Media Citations",count:drillCites.length},{id:"analytics",label:"Analytics",count:""}].map(t=>{
          const ia=drillTab===t.id;
          return (
            <button key={t.id} onClick={()=>setDrillTab(t.id)}
              style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"7px 16px",borderRadius:8,border:`1px solid ${ia?"rgba(26,58,92,0.1)":"transparent"}`,background:ia?"var(--surface2)":"transparent",color:ia?"var(--accent)":"var(--dim)",cursor:"pointer",fontWeight:ia?700:400,letterSpacing:"0.04em",transition:"all .15s"}}>
              {t.label}
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:100,background:ia?"rgba(26,58,92,0.07)":"transparent",color:ia?"var(--accent)":"var(--dim)"}}>{t.count}</span>
            </button>
          );
        })}
      </div>
      {drillTab==="weekly"   && <WeeklySummaryTab campaigns={drillCamps} citations={drillCites} color={drillProgram.color}/>}
      {drillTab==="posts"    && <CampaignTable campaigns={drillCamps} onSave={(f,ex)=>onSaveCamp(f,ex,drillId)} onDelete={onDeleteCamp} onDeleteAll={async(cid)=>{await db.deleteAllBounties(cid);setCampaigns(prev=>prev.filter(c=>c.campaignId!==cid));}} currentUser={currentUser} readOnly={false}/>}
      {drillTab==="media"    && <MediaTable citations={drillCites} onSave={(f,ex)=>onSaveMedia(f,ex,drillId)} onDelete={onDeleteMedia} onDeleteAll={async(cid)=>{await db.deleteAllCitations(cid);setCitations(prev=>prev.filter(c=>c.campaignId!==cid));}} currentUser={currentUser} readOnly={false}/>}
      {drillTab==="analytics"&& <AnalyticsTab campaigns={drillCamps} citations={drillCites} clientName={drillProgram.name}/>}
      {showForm&&<CampaignForm initial={editClient} onSave={async f=>{await onSave(f,editClient);setShowForm(false);setEdit(null)}} onClose={()=>{setShowForm(false);setEdit(null)}}/>}
      {confirmId&&<ConfirmDelete onConfirm={async()=>{await onDelete(confirmId);setConfId(null);setDrillId(null)}} onCancel={()=>setConfId(null)}/>}
    </div>
  );

  return (
    <div style={{animation:"fadeUp .5s ease both"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>// bounty management</div>
          <h2 style={{fontSize:22,fontWeight:500}}>Campaigns</h2>
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
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {programs.map((cl,i)=>{
            const campCount = campaigns.filter(c=>c.campaignId===cl.id).length;
            const citeCount = citations.filter(c=>c.campaignId===cl.id).length;
            return (
              <div key={cl.id} onClick={()=>{setDrillId(cl.id);setDrillTab("weekly")}}
                style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,padding:"20px 22px",position:"relative",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)",animation:`rowIn .3s ease ${i*.05}s both`,cursor:"pointer",transition:"all .2s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=cl.color+"80";e.currentTarget.style.boxShadow=`0 4px 16px rgba(0,0,0,0.08)`;e.currentTarget.style.transform="translateY(-1px)"}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="none"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:cl.color}}/>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:40,height:40,borderRadius:10,background:cl.color+"18",border:`1px solid ${cl.color}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:500,color:cl.color}}>{initials(cl.name)}</div>
                    <div>
                      <div style={{fontSize:16,fontWeight:500}}>{cl.name}</div>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",marginTop:2}}>Created {new Date(cl.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:4,alignItems:"center"}} onClick={e=>e.stopPropagation()}>
                    <span onClick={e=>{e.stopPropagation();onSave({...cl,status:cl.status==="completed"?"active":"completed"},cl)}}
                      style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"4px 8px",borderRadius:6,cursor:"pointer",
                      background:cl.status==="completed"?"rgba(100,116,139,0.1)":"rgba(22,101,52,0.08)",
                      border:cl.status==="completed"?"1px solid rgba(100,116,139,0.25)":"1px solid rgba(22,101,52,0.25)",
                      color:cl.status==="completed"?"#475569":"#166534"}}>
                      {cl.status==="completed"?"Completed":"Active"}
                    </span>
                    <RowBtn onClick={()=>{setEdit(cl);setShowForm(true)}} title="Edit" hb="var(--accent)" hc="var(--accent)" hbg="rgba(26,58,92,0.06)"><Icons.Edit/></RowBtn>
                    <RowBtn onClick={()=>setConfId(cl.id)} title="Delete" hb="var(--red)" hc="var(--red)" hbg="rgba(220,38,38,0.07)"><Icons.Trash/></RowBtn>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border2)"}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Bounties</div>
                    <div style={{fontSize:22,fontWeight:500,color:cl.color}}>{campCount}</div>
                  </div>
                  <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 12px",border:"1px solid var(--border2)"}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:"var(--dim)",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>Media Citations</div>
                    <div style={{fontSize:22,fontWeight:500,color:cl.color}}>{citeCount}</div>
                  </div>
                </div>
                <div style={{marginTop:12,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}>View details →</div>
                  {cl.sheetLink&&<a href={cl.sheetLink} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"4px 8px",borderRadius:6,border:"1px solid rgba(26,58,92,0.2)",background:"rgba(26,58,92,0.06)",color:"var(--accent)",textDecoration:"none",display:"flex",alignItems:"center",gap:4}}>📊 Sheet↗</a>}
                  {(cl.sheetBounties||cl.sheetMedia)&&<div onClick={e=>e.stopPropagation()}><DrillSync program={cl} drillCamps={campaigns.filter(c=>c.campaignId===cl.id)} drillCites={citations.filter(c=>c.campaignId===cl.id)} setCampaigns={setCampaigns} setCitations={setCitations}/></div>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showForm&&<CampaignForm initial={editClient} onSave={async f=>{await onSave(f,editClient);setShowForm(false);setEdit(null)}} onClose={()=>{setShowForm(false);setEdit(null)}}/>}
      {confirmId&&<ConfirmDelete onConfirm={()=>{onDelete(confirmId);setConfId(null)}} onCancel={()=>setConfId(null)}/>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  MY CREATIONS TAB (Author only)
// ─────────────────────────────────────────────────────────
const MyCreationsTab = ({myBounties, myCitations, onSaveCamp, onDeleteCamp, onSaveMedia, onDeleteMedia, currentUser, activeCid}) => {
  const [sub, setSub] = useState("bounties");
  return (
    <div style={{animation:"fadeUp .4s ease both"}}>
      <div style={{marginBottom:20}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--accent)",textTransform:"uppercase",letterSpacing:"0.1em",marginBottom:4}}>// my contributions</div>
        <h2 style={{fontSize:22,fontWeight:500}}>My Creations</h2>
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
      {sub==="citations"  && <MediaTable   citations={myCitations} onSave={(f,ex)=>onSaveMedia(f,ex,activeCid)} onDelete={onDeleteMedia} currentUser={currentUser} readOnly={false}/>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────
//  ROOT APP
// ─────────────────────────────────────────────────────────
export default function App() {
  const [user,setUser]           = useState(null);
  const [users,setUsers]         = useState([]);
  const [programs,setPrograms]     = useState([]);   // named campaigns: [{id,name,color}]
  const [activeCid,setActiveCid] = useState(null); // active campaign id
  const [campaigns,setCampaigns] = useState([]);   // bounties entries
  const [citations,setCitations] = useState([]);   // media citation entries
  const [loading,setLoading]     = useState(true);
  const [saving,setSaving]       = useState(false);
  const [toast,setToast]         = useState(null);
  const [tab,setTab]             = useState("campaign");
  const [clientActiveCid,setClientActiveCid] = useState(null);

  const showToast=(msg,type="success")=>{setToast({msg,type});setTimeout(()=>setToast(null),2800)};

  // Set default tab based on role after login
  useEffect(()=>{
    if(!user) return;
    if(user.role==="admin") setTab("campaigns_mgmt");
    else setTab("weekly");
  },[user?.role]);

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
        const [loadedUsers, loadedPrograms, loadedCamps, loadedCits] = await Promise.all([
          db.getUsers().catch(()=>[]),
          db.getPrograms().catch(()=>[]),
          db.getCampaigns().catch(()=>[]),
          db.getCitations().catch(()=>[]),
        ]);

        // Bootstrap admin if no users exist
        if (!loadedUsers.length) {
          const adminUser = {id:uid(),username:"admin",passwordHash:hashPass("admin123"),role:"admin",createdAt:Date.now()};
          await db.setUsers([adminUser]);
          setUsers([adminUser]);
        } else {
          setUsers(loadedUsers);
        }

        setPrograms(loadedPrograms);
        if(loadedPrograms.length) setActiveCid(loadedPrograms[0].id);

        // Seed Nexo bounties if not yet done
        const nexoSeeded = await db.getFlag(NEXO_SEEDED_KEY).catch(()=>false);
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
        const nexoCitSeeded = await db.getFlag(NEXO_CIT_SEEDED_KEY).catch(()=>false);
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

  if(loading) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"var(--bg)",flexDirection:"column",gap:14}}>
      <Icons.Spin/><div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)",letterSpacing:"0.08em"}}>LOADING…</div>
    </div>
  );

  if(!user) return (<><style>{css}</style><LoginScreen onLogin={setUser}/></>);

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

  const TABS = user.role==="admin"
    ? [
        {id:"weekly",         label:"Weekly Summary", icon:<Icons.Analytics/>, accent:"var(--accent)", count:""},
        {id:"campaigns_mgmt", label:"Campaigns",     icon:<Icons.Brief/>,     accent:"var(--accent)", count:programs.length},
        {id:"users",          label:"Users & Access", icon:<Icons.Users/>,     accent:"var(--accent)", count:users.length},
      ]
    : [
        {id:"weekly",   label:"Weekly Summary", icon:<Icons.Analytics/>,  accent:"var(--accent)", count:""},
        {id:"campaign",   label:"Bounties", icon:<Icons.Chart/>,     accent:"var(--accent)", count:scopedCampaigns.length},
        {id:"media",      label:"Media Citations",  icon:<Icons.News/>,      accent:"var(--accent)", count:scopedCitations.length},
        ...(user.role==="client"?[{id:"analytics", label:"Analytics", icon:<Icons.Analytics/>, accent:"var(--accent)", count:""}]:[]),
        ...(user.role==="author"?[{id:"mine", label:"My Creations", icon:<Icons.User/>, accent:"var(--accent)", count:myBounties.length+myCitations.length}]:[]),
      ];

  return (
    <>
      <style>{css}</style>
      {toast&&<Toast msg={toast.msg} type={toast.type}/>}

      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:100,background:"rgba(228,232,238,0.97)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:"1px solid var(--border)",boxShadow:"0 1px 0 var(--border)",padding:"0 32px",display:"flex",alignItems:"center",justifyContent:"space-between",height:58}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAGQAZADASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAYJBwgDBAUCAf/EAEgQAAEEAQMBBQQGBQcLBQAAAAABAgMEBQYHESEIEjFBURM3YXEiMlJ1gbMJFEJykRUXI1dioaIkM0NTc4OSlbLB0iWCscLh/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ANywAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAoCgAAAAAAAAAAAAAAAAAAAAAAHFbtVqkSzWrENeNPF8r0aifipHre4Wgaj+5b1xpmu70lysDV/vcBJgcFC5UyFKG9QtQW6s7EkhngkR8cjV6o5rk6Ki+qHOAAAAAAAAAAAAAAAdLJ5fE4tveyeUo0k455sWGx/8AUqHhS7k7dRPVkuvtKscni12Yrov/AFgSoEZq7h6AtPRlXXOmJ3qvCNjy0DlVfwcSCnbq3YUmp2YbMS+D4pEe3+KAcwAAAAAAAAAAAAAAAAAABQFAAAAAAAAAAAAAAAB5eq9RYPSuDnzeo8pVxmOrpzJPYf3W/BE83OXyanKr5IB6hEdx9y9DbeUm2dX6iqY5XpzFAqrJPL+7E1FeqfHjhPNUNRd8e2DmstLNh9soX4egiq12UnYjrMyerGLykSePVeXeC/RXoasZK9dyd+bIZK5YuW53q+aeeRXySOXzc5eqqBuJuH22eJJK2gNJo5qdG3Mw/wAflDGvh6Kr/wAPIwPq/tD7xame/wDWtbZCjC5ekONVKjWp6cx8OVPmqmKgB2slkchkrC2MjetXJl/0liV0jv4uVVOqABaz2cPcLof7krfloT8gHZw9wuh/uSt+WhPwAAAAAAAQXeDdfRm1uF/X9T5FG2JWqtWhBw+zZVPsN56J6udw1PXnhAJ0Yo3U7Qm2G3rpKuRzjcnk2couPxnE8rVTyeqKjWL8HORfgaX729pjXu4i2MbRnXTmn3qrUp0pFSWVnpLL0V3xRO631RTBwG1Gvu2lrLIyPg0bgMdgq3Ko2e0q2rCp5L5Mb8la75mE9Vbx7panc/8AlnXecmjf9aGKysES/wC7j7rf7iBgD7lkklkdJLI6R7l5c5y8qv4nwAAOzj797HWEsY+5YqTJ4SQSuY5PxReTrADKWj+0HvBpd0aUtb5G5Czp7HIqltqp6cyIrkT5KhnfbztsyI6Otr7SbXN6I67iH8KnTxWGRevX0enyNNgBbPtvufoTcSssuktR1L8rGo6WtysdiJP7UbuHInlzxxz4KTEpvxt67jb0N/HXLFO3A7vwz15Fjkjd6tc1UVF+KG0exna+z2Elgw+5UcucxqqjEycLWpagTyV7U4SVPDlejvFeXL0UN7QeTpHUuB1bga+d01lauUx1hOY54H8pz5tVPFrk56tVEVPNEPWAAAAAAAAAAAAFAUAAAAAAAAAAAABBN8dzsHtToefUWX/p53L7KjSa9EfamVOjU9Gp4ud5J6rwih8b3braZ2n0suYz0qzWZuWUaETk9taeieCejU6cuXonKeKqiLXDvJutq7dTUC5LUd1UrRuX9Tx8Kqleq1fJrfN3Hi5eq/LhE8rc7XWotxdXWdS6luLPamXuxxt5SOvGi/Rjjb+y1Ofmq8qvKqqkYAAAAAAAAAtZ7OHuF0P9yVvy0J+QDs4e4XQ/3JW/LQn4AAAADXvtdb+xbZ4tdL6akZLq29D3kfwjm4+J3T2jk83r17rV/eXpwjg5e1B2jMXtjDJpzTqQZTVsrOrFdzFQRU6Ol48X+CpH06dV4ThHV86o1BmtUZ2znNQZKxkcjad3pp53cud8PRETwRE4RE6IdK9as3rk127Yls2Z5HSTTSvVz5HuXlXOVeqqq9eVOEAAAAAAAAAAAAAAAACcbO7par2t1I3Labur7F7m/rlGRVWC2xP2Xp5L1XhydU/ii2P7Gbs6a3Z0q3LYaRK96FGtyGOkeiy1Xr6/aYvC91yJwvwVFRKqCRbc6zz+gdW09TabuOrXaz+Vaqr7OZn7UciIqd5i+afinCoigW7AgOxe6OD3X0TFn8T/AEFqJUiyFFzuX1ZuOVb8Wr4td5p6Kiok+AAAAAAAAABQFAAAAAAAAAAADoahzGN0/grubzFqOpj6MDp7Ez16MY1OVX4r8PFV6FXPaA3Rym6+v7Gfud+DHw8wYymq9K8CL059XO+s5fVePBERNgv0g+6rpbcG1mGtcRQ9yzmlYv1nqiOihX5Jw9firPQ06AAAAAAAAAAAC1ns4e4XQ/3JW/LQn5AOzh7hdD/clb8tCfgAD8cqNarnKiIicqq+QGO+0Nuhj9qNurWfn9nNkpl/V8XUcv8An51Tpz/YanLnL06JxzyqFXmo8zktQ569nMzbkt5C9O6exM/xe9y8r8k9EToicIhkvtV7oy7n7pWrdWdz8FjFdTxTEd9F0aO+lMiesipzz491GIvgYkAAAAAAAAAAAAAAAAAAAAAAJ/sNudltqdfVtQ0O/PTfxDkaaO4bZgVeqfByeLV8lT0VUW0jTGcxmpdPUM/hrTbWPvwNnryt/aa5OeqeSp4KniioqFPBt9+j43UWpkrG1uYsL7C2r7WHc5ejJURVlh+TkTvonq13m4DdoAAAAAAAAKAoAAAAAAAAA8PX2paOjtFZjVGSdxVxlR9h6eb1RPosT4udw1PiqHuGrH6RfWC4zbzD6NrycTZq2s9hE/1EHC8L85HMVP3FA0g1Rmr+o9R5HP5SZ013IWZLM71Xxc9yqv4deETyQ80AAAAAAAAAAAALWezh7hdD/clb8tCfkA7OHuF0P9yVvy0J+AMF9trcF+h9mrNGhYSLK6geuPg4XhzIlTmZ6fJv0efJZEXyM6Fdnb31iuo97X4OCbv0tPVm1GtRyq32z0SSV3wXqxi/7MDXoAAAAAAAAAAAAAAAAAAAAAAAA7+nsvfwGdoZvFzur3qFhlivIn7L2ORyL/FDoAC3jbjVNLW2hMNqvH9K+TqMn7v+rd4PYvxa5HN/AkBqj+jk1gt/RWd0VZl5lxVltuq1V/0M3KORPgj2qq/7Q2uAAAAAAAUBQAAAAAAAABXL29dROzXaAuY9snehwtKCk1E8O8rfau/HmXhf3Sxoqa30ya5nefWWS7yubNm7fs1VefoJK5rf8KIBDAAAAAAAAAAAAAFrPZw9wuh/uSt+WhPyAdnD3C6H+5K35aE/A47U8NWrLasSJHDCxZJHr4Naicqv8CoLWmbn1Lq/Mahsq5Zsnemtu73iiyPV3H4c8FpHaAyjsNsjrPIxv7kkeFssjdzx3XvjVjV/i5CqAAAAAAAAAAAAAAAAAAAAAAAAAAAAM7dhTULsH2hcZUV/dgzNWehLz4fU9qz/ABxNT8SyIqS2cyq4TdnSWWR3dSrmasj1/spK3vJ+KcoW2gAAAAAAKAoAAAAAAAAAp11BOtrPZCyru+stqV6u9eXqvJcUU66grrUz+QqqnCw2pY1T5PVP+wHRAAAAAAAAAAAAAWs9nD3C6H+5K35aE/IB2cPcLof7krfloT8DEPbKnWv2atYSI7u8w12c/vWYm/8AcrFLOu2VCs/Zp1gxre8qQ138fu2Ync/hxyVigAAAAAAAAAAAAAAAAAAAAAAAAAABzUZ1rXoLLVVFika9FTxTheS5IptowOtXoKzfrTSNjT5qvBckAAAAAAAoCgAAAAAAAACprfPFuw282ssare62HNWvZp/YWVzmf4VQtlK5O3pp5cL2gbt9rFbFmaVe63p07yN9k7j8Yuf/AHAYCAAAAAAAAAAAAAWs9nD3C6H+5K35aE/IB2cPcLof7krfloT8CDdoHGLmNj9aUGtVz34Wy+NqJzy9kavan8WoVQFyduvFbqTVZ2I+GZjo5Gr5tVOFT+BUFrHCz6b1bmNPWkd7bGXpqj+fFVjerefx4A8kAAAAAAAAAAAAAAAAAAAAAAAAAASrZ/GOzW6+ksUjO+lrM1I3Ivh3Vmb3l+SJypbcVu9hTTzs52hcZbczvQ4erPfk9OjPZt/xytX8CyIAAAAAABQFAAAAAAAAAGq36RnR78loHC6zrQq6TDWnV7Tmp4QT8Ijl+CSNYifGQ2pPC3B0zR1nojMaVyPStk6j67nccrGqp9F6J6tdw5PiiAVCA9LVGFyGm9R5HAZWFYb2OsyVp2ej2OVF49U6covmnB5oAAAAAAAAAAAWs9nD3C6H+5K35aE/IB2cPcLof7krfloT8AV19vbR66c3vkzcEXdp6hqsttVE4akzE9nK35/Ra9f9oWKGCO3BoF+tNmLORowLLk9PPXIQo1PpOiROJm/8H0/nGgFbwAAAAAAAAAAH3BK+CeOaPu9+NyOb3mo5OUXlOUXovyU+ABvp2VtZbT7pYpmDzmgdGUtX1IuZYkw1ZrLrETrLEnc8ftM8vFOnhnj+bLbb+r7Sf/Jq/wD4FT2GyeQw2Vq5XFXJqV6pKksE8L1a+N6LyioqFi3ZW3/x+6WKZg84+Glq+pFzLEnDWXWInWWJPX7TPLxTp4Bkv+bLbb+r7Sf/ACav/wCA/my22/q+0n/yav8A+BLABEn7YbavYrHbe6T4cnC/+j10/wDoaN9rHs9W9t78uqNLwzWtI2JPpN6ufjnuXox6+KxqvRr1/dXrwrrETgyFOpkaE9C/WhtVLEbopoZWI5kjHJwrXIvRUVPICm4Gw/ax7PVvbe/LqjS8M1rSNiT6Tern457l6Mevisar0a9f3V68K7XgAAd/T2Iv5/O0MJi4HWL1+wyvXjT9p73I1E/ioG7X6OTR60NF53W1mHiXK2W06rnJ19jD1cqfBz3cfOM2vI/tvpWlojQeF0nj1R0GMqMg7/dRvtHInL3qiebnK5y/FVJAAAAAAAAoCgAAAAAAAAAABpT+kI2sfBer7p4etzDP3Kua7ifUenDYZl+CpwxV9UZ6mnpcRqTDY3UWAvYLMVWW8ffgdBYhenRzHJwvyXzRfFF4VCrjfzbDK7U6/s6fvJJNRkVZsbcVvSzAq9F9O+ng5PJfgqchj4AAAAAAAAAAWs9nD3C6H+5K35aE/IB2cPcLof7krfloT8AfkjGSRujka17HIqOa5OUVF8lP0AVf9qba6Xa7dG1j60L0weR5t4qRU6ezVfpRc+rHfR9eO6v7RictQ7RO1tDdjbuzgpVjgykCrYxdpyf5mdE6Iq+Pccn0XfBeeOUQq+1BiMlgM3cwuYpy08hSmdDYgkThzHtXhU//AHwVOqAdAAAAAAAAAAADt4bJ5DDZWrlcVcmpXqkqSwTwvVr43ovKKiodQAWQ9lbf/H7pYpmDzj4aWr6kXMsScNZdYidZYk9ftM8vFOnhncpyw2TyGGytXK4q5NSvVJUlgnherXxvReUVFQsW7K2/2P3TxTcHnHw0tX1IuZYk4ay6xE6yxJ6/aZ5eKdPAM7gADgyFOpkaE9C/WhtVLEbopoZWI5kjHJwrXIvRUVPIr17WPZ6t7b35dUaXhmtaRsSfSb1c/HPcvRj18VjVejXr+6vXhXWInBkKdTI0J6F+tDaqWI3RTQysRzJGOThWuReioqeQFNxt7+j42sdcytndHMVf8mqd+rh0en15VTiWZPVGoqsRfDlzvNp87i9j7IruzjotIzdzRuTsK61I96LJi2J9J7OvV6KnKMXr14R3H1l3L0tgsXpnTtDAYWq2rjqELYa8Tf2Wp6r5qviq+aqqgekAAAAAAAAFAUAAAAAAAAAAABAt89rsFuvomXT+X5gsxqstC6xOX1puOEd8Wr4Ob5p6KiKk9AFRm5OiNRbe6ttaZ1NSWtcgXlrk6xzxr9WSN37TV48fmi8KiokaLWN8dptM7s6XXE5uP9XuworqGRiYiy1Xr6faavCctVeF+CoipXBvHtbqzazUjsTqSmvsJHOWneiTmC2xF+s1fJfDlq9U5+SqEGAAAAAAABaz2cPcLof7krfloT8gHZw9wuh/uSt+WhPwAAAGuva/2Ci3FxcmrdL1ms1bTiRHxN4RMjE3wYvl7RE+q7z47q9OFbsUAKa7ME9WzLWswyQTxPVkkcjVa5jkXhWqi9UVF6cHGWKdqHs4YvcqGXUml21cXqxjVWRVb3YsgiJ0bJx4P9H/AIO5ThW1+alwWY01m7OEz2OsY7I1X9yavOzuuavinzRU4VFToqKioB5wAAAAAAAAAAHbw2TyGGytXK4q5NSvVJUlgnherXxvReUVFQ6gAsh7K2/+P3SxTMHnHw0tX1IuZYk4ay6xE6yxJ6/aZ5eKdPDO5TlhsnkMNlauVxVyaleqSpLBPC9Wvjei8oqKhYt2Vt/8fulimYPOPhpavqRcyxJw1l1iJ1liT1+0zy8U6eAZ3AAAAAAAAAAAAAAoCgAAAAAAAAAAAAAA8nV2msDq3A2MFqXFVcpjrCcSQTs5Tnyci+LXJz0cioqeSoesANEt8+yDnsJLPmNtZJc5jVVXrjJnNS1AnmjHLwkqePCdHeCcOXqurmSo3cbemoZGnYp24HdyWCxGsckbvRzV4VF+ClyBDdy9rtCbi1Gw6t09VvSsTiK0iLHYjT0bI3h3Hw54+AFTINyNwexLM10ljQerWPb1VtPLs4VPREljThV+bE+ZgbV+wG7+l3v/AF7Q+TtRN6+2x7EtsVPX+i7yonzRAMYA571O3RsurXqs9Wdv1o5o1Y5Pmi9TgAtZ7OHuF0P9yVvy0J+QDs4e4XQ/3JW/LQn4AAAAAAIDvJtJo3dTDtp6loqlqFqpVyFfhlivz9l3C8t5/ZVFT8epPgBWpvX2atwNuXz5CtVdqLAMVVS/RjVXxt9ZYurmfFU7zU+114MJFzBiTdPs7bX7gPlt3cImJykiKq38WqQSOcq8957eFY9fVXNVfiBWEDaPX3Yv1xjHyT6PzWN1BWRfowzr+q2PlwvMa/NXp8jCWqtpdzNLuk/lzQ2drRx/WnbUdLCn+8Zyz+8CEg+ntcx6se1WuavCoqcKinyAAOapVs3J2wVK81iZ31Y4mK5y/gnUDhBkvR+w27mqXMXG6GysML+OJ70aVI+PtIsqt7yfLkzvt52Jr8r47OvtVw1o/F1PEs771+CyyIiNVPgx3zA1Eo1Ld+5FTo1prVmZyMihhjV73uXwRrU6qvwQ2q7OXZX1jNmsdq7WV63pSGpM2xXrVpO7feqdUVVTpCnz5d4pwnibY7Z7UaB24gVmk9O1qdhze7JcfzLYk9eZHcuRF+ynDfgTYAnROOefiAAAAAAAAAAAAABQFAAAAAAAAAAAAAAAAAAAAAAOvfo0r8Psb1Ovai+xNGj2/wAFQjlvbPbi27vW9v8ASdheeeZcPXd/8s+JKwB18bRpY2hBj8dTr0qddiRwV68aRxxMTojWtbwiInoh2AAAAAAAAAAAAAAADzstgcFl+f5VwuOv8pwv6zVZLz/xIp4M21m2M8iyTbc6Pkevi5+ErKv97CXgCKVNs9uKbkfU2/0nXci8osWHrtX+5hIsdjsfjofY4+jVpxfYgibG3+CIdkAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACgKB//2Q==" alt="CQ" style={{width:32,height:32,borderRadius:9,objectFit:"contain",background:"#fff",padding:3}}/>
          <span style={{fontSize:15,fontWeight:500,letterSpacing:"-0.01em",color:"var(--text)"}}>Crypto<span style={{color:"var(--accent)"}}>Quant</span></span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {saving&&<div style={{display:"flex",alignItems:"center",gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:"var(--dim)"}}><Icons.Spin/>SAVING…</div>}
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"5px 12px 5px 6px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:100,boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:rm.bg,border:`1px solid ${rm.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:500,color:rm.color}}>{initials(user.username)}</div>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--text)"}}>{user.username}</span>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:4,background:rm.bg,border:`1px solid ${rm.border}`,color:rm.color,textTransform:"uppercase"}}>{rm.label}</span>
          </div>
          <button onClick={()=>setUser(null)} title="Sign out" style={{width:32,height:32,borderRadius:8,border:"1px solid var(--border)",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--dim)",transition:"all .15s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--red)";e.currentTarget.style.color="var(--red)"}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--border)";e.currentTarget.style.color="var(--dim)"}}>
            <Icons.Logout/>
          </button>
        </div>
      </header>

      {/* MAIN */}
      <main style={{maxWidth:1400,margin:"0 auto",padding:"36px 36px 100px"}}>

        {/* PAGE HEADER */}
        <div style={{marginBottom:20,animation:"fadeUp .5s ease both"}}>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:"0.12em",color:rm.color,textTransform:"uppercase",marginBottom:6}}>
            // {rm.label.toLowerCase()} portal
          </div>
          <h1 style={{fontSize:"clamp(22px,3vw,32px)",fontWeight:500,letterSpacing:"-0.02em",lineHeight:1.15}}>
            Analytics <span style={{color:"var(--accent)"}}>Suite</span>
          </h1>
        </div>

        {/* CLIENT switcher + notice */}
        {user.role==="client"&&(
          <div style={{marginBottom:20,animation:"fadeUp .5s ease .05s both"}}>
            {allowedClientCampaigns.length===0 ? (
              <div style={{padding:"12px 16px",background:"rgba(220,38,38,0.05)",border:"1px solid rgba(220,38,38,0.15)",borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
                <Icons.Eye/>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>No campaigns have been shared with your account yet. Contact your admin.</span>
              </div>
            ) : allowedClientCampaigns.length===1 ? (
              <div style={{padding:"10px 16px",background:"rgba(26,58,92,0.04)",border:"1px solid rgba(26,58,92,0.15)",borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
                <Icons.Eye/>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>Read-only · <span style={{color:effectiveClient?.color||"var(--accent)"}}>{effectiveClient?.name||"your campaign"}</span></span>
              </div>
            ) : (
              <div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase",marginBottom:8}}>Your Campaigns</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  {allowedClientCampaigns.map(cl=>{
                    const ia=(clientActiveCid||allowedClientCampaigns[0]?.id)===cl.id;
                    return (
                      <button key={cl.id} onClick={()=>setClientActiveCid(cl.id)}
                        style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:10,border:`1px solid ${ia?cl.color+"60":"var(--border)"}`,background:ia?cl.color+"12":"var(--surface)",cursor:"pointer",transition:"all .2s"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:ia?cl.color:"var(--dim)",boxShadow:ia?`0 0 6px ${cl.color}`:"none"}}/>
                        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:ia?700:400,color:ia?cl.color:"var(--muted)"}}>{cl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* NO CAMPAIGN SELECTED warning for data tabs */}
        {!effectiveCid && (tab==="weekly"||tab==="campaign"||tab==="media"||tab==="mine") && programs.length>0 && (
          <div style={{textAlign:"center",padding:"60px 20px",background:"var(--surface)",border:"1px solid var(--border)",borderRadius:12,animation:"fadeUp .5s ease .1s both"}}>
            <div style={{fontSize:32,marginBottom:12,opacity:.3}}>⬡</div>
            <div style={{fontSize:15,fontWeight:500,color:"var(--muted)",marginBottom:6}}>Select a campaign above to view data</div>
          </div>
        )}

        {/* TABS */}
        <div style={{display:"flex",gap:4,marginBottom:24,background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:4,width:"fit-content",animation:"fadeUp .5s ease .06s both"}}>
          {TABS.map(t=>{
            const ia=tab===t.id;
            return (
              <button key={t.id} onClick={()=>setTab(t.id)}
                style={{display:"flex",alignItems:"center",gap:7,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:"8px 18px",borderRadius:9,border:`1px solid ${ia?"rgba(255,255,255,0.08)":"transparent"}`,background:ia?"var(--surface2)":"transparent",color:ia?t.accent:"var(--dim)",cursor:"pointer",letterSpacing:"0.04em",fontWeight:ia?700:400,transition:"all .2s"}}>
                <span style={{color:ia?t.accent:"var(--dim)"}}>{t.icon}</span>
                {t.label}
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:100,background:ia?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.03)",color:ia?t.accent:"var(--dim)"}}>{t.count}</span>
              </button>
            );
          })}
        </div>

        {/* CAMPAIGN SWITCHER — admin/author only */}
        {user.role!=="client" && (tab==="weekly"||tab==="campaign"||tab==="media"||tab==="mine"||tab==="campaigns_mgmt") && tab!=="campaigns_mgmt" && (()=>{
          const visibleCampaigns = user.role==="admin"
            ? programs
            : programs.filter(c=>(user.allowedCampaigns||[]).includes(c.id)); // authors only see assigned campaigns
          return (
          <div style={{marginBottom:20,animation:"fadeUp .5s ease .04s both"}}>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,letterSpacing:"0.1em",color:"var(--dim)",textTransform:"uppercase",marginBottom:8}}>Active Campaign</div>
            {!visibleCampaigns.length ? (
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10}}>
                <Icons.Brief/>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--muted)"}}>
                  {user.role==="admin"?"No campaigns yet. ":"No campaigns assigned to your account. Contact an admin."}
                </span>
                {user.role==="admin"&&<button onClick={()=>setTab("campaigns_mgmt")} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--accent)",background:"transparent",border:"none",cursor:"pointer",textDecoration:"underline"}}>Create your first campaign →</button>}
              </div>
            ) : (
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {visibleCampaigns.map(cl=>{
                  const ia=activeCid===cl.id;
                  return (
                    <button key={cl.id} onClick={()=>setActiveCid(cl.id)}
                      style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:10,border:`1px solid ${ia?cl.color+"60":"var(--border)"}`,background:ia?cl.color+"12":"var(--surface)",cursor:"pointer",transition:"all .2s"}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:ia?cl.color:"var(--dim)",boxShadow:ia?`0 0 6px ${cl.color}`:"none",flexShrink:0}}/>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,fontWeight:ia?700:400,color:ia?cl.color:"var(--muted)",letterSpacing:"0.02em"}}>{cl.name}</span>
                      <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:"1px 6px",borderRadius:100,background:ia?cl.color+"18":"rgba(255,255,255,0.03)",color:ia?cl.color:"var(--dim)"}}>
                        {campaigns.filter(c=>c.campaignId===cl.id).length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          );
        })()}

        {/* CONTENT */}
        {tab==="weekly"&&(effectiveCid||user.role==="client")&&<WeeklySummaryTab campaigns={scopedCampaigns} citations={scopedCitations} color={effectiveClient?.color||"var(--accent)"}/>}
        {(tab==="campaign")&&(effectiveCid||user.role==="client")&&<CampaignTable campaigns={scopedCampaigns} onSave={handleSaveCamp} onDelete={handleDeleteCamp} onDeleteAll={handleDeleteAllCamp} currentUser={user} readOnly={readOnly||(user.role==="author"&&!(user.allowedCampaigns||[]).includes(activeCid))}/>}
        {(tab==="media")&&(effectiveCid||user.role==="client")&&<MediaTable citations={scopedCitations} onSave={handleSaveMedia} onDelete={handleDeleteMedia} onDeleteAll={handleDeleteAllMedia} currentUser={user} readOnly={readOnly||(user.role==="author"&&!(user.allowedCampaigns||[]).includes(activeCid))}/>}
        {tab==="analytics"&&user.role==="client"&&<AnalyticsTab campaigns={scopedCampaigns} citations={scopedCitations} clientName={user.clientName}/>}
        {tab==="mine"&&user.role==="author"&&<MyCreationsTab myBounties={myBounties} myCitations={myCitations} onSaveCamp={handleSaveCamp} onDeleteCamp={handleDeleteCamp} onSaveMedia={handleSaveMedia} onDeleteMedia={handleDeleteMedia} currentUser={user} activeCid={activeCid}/>}
        {tab==="campaigns_mgmt"&&user.role==="admin"&&<CampaignsPanel programs={programs} campaigns={campaigns} citations={citations} onSave={handleSaveProgram} onDelete={handleDeleteProgram} onSaveCamp={(f,ex,cid)=>handleSaveCamp(f,ex,cid)} onDeleteCamp={handleDeleteCamp} onSaveMedia={(f,ex,cid)=>handleSaveMedia(f,ex,cid)} onDeleteMedia={handleDeleteMedia} currentUser={user} showToast={showToast} setCampaigns={setCampaigns} setCitations={setCitations}/>}
        {tab==="users"&&user.role==="admin"&&<UsersPanel users={users} campaigns={campaigns} citations={citations} campaignsList={programs} onSaveUser={handleSaveUser} onDeleteUser={handleDeleteUser} showToast={showToast} currentUser={user}/>}
      </main>

      <footer style={{borderTop:"1px solid var(--border2)",padding:"16px 32px",background:"var(--surface)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>CryptoQuant <span style={{color:"var(--accent)"}}>Bounty Program</span> · Analytics Suite</div>
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:"var(--dim)"}}>
          {programs.length} campaign{programs.length!==1?"s":""} · {campaigns.length} entries · {citations.length} citations · <span style={{color:"var(--green)"}}>synced</span>
        </div>
      </footer>
    </>
  );
}
