import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tzoysqzcpivdhkspnhdy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_kjSTm_bgCQR-Y7pvmp_oGg_YQAqsbCv";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const STOPWORDS = new Set(["the","a","an","of","in","on","at","to","for","and","or","is","are","was","were","be","been","by","with","as","that","this","it","its","from","but","not","has","have","had","will","would","could","should","may","can","we","they","their","our","up","down","over","under","new","more","most","than","into","out","about","also"]);

const extractIdentifiers = (url) => {
  if (!url) return [];
  try {
    const u = new URL(url);
    const ids = [];
    const tweetMatch = u.pathname.match(/\/status\/(\d+)/);
    if (tweetMatch && tweetMatch[1].length >= 15) ids.push(tweetMatch[1]);
    const path = u.pathname.replace(/\/+$/, "");
    if (path && path.length >= 8 && path !== "/") ids.push(path);
    return ids;
  } catch {
    return [];
  }
};

const urlMatch = (html, bounties) => {
  const hits = [];
  for (const b of bounties) {
    const urls = [b.cq_link, b.author_twitter_link, b.cq_twitter_link, b.analytics_link, b.telegram_link].filter(Boolean);
    for (const url of urls) {
      const ids = extractIdentifiers(url);
      const found = ids.find(id => html.includes(id));
      if (found) { hits.push({ bounty: b, matchedUrl: url, identifier: found }); break; }
    }
  }
  return hits;
};

const stripHtml = (html) => html
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&[#\w]+;/g, " ");

const normalize = (s) => (s||"").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
const stem = t => (t.length >= 5 && t.endsWith("s") && !t.endsWith("ss") && !t.endsWith("us") && !t.endsWith("is")) ? t.slice(0, -1) : t;
const tokens = (s) => normalize(s).split(" ").filter(t => t.length >= 3 && !STOPWORDS.has(t)).map(stem);

const keywordMatch = (html, bounties, ctx = {}) => {
  const { citationDate, citationHeadline, citationTopic, citationAsset } = ctx;
  const articleText = stripHtml(html);
  const articleNorm = normalize(articleText);
  const haystack = [articleText, citationHeadline, citationTopic].filter(Boolean).join(" ");
  const articleSet = new Set(tokens(haystack));

  const parseDate = d => { const t = new Date(d); return isNaN(t.getTime()) ? null : t.getTime(); };
  const citTs = citationDate ? parseDate(citationDate) : null;
  const citAssetKey = (citationAsset||"").toLowerCase().trim();

  const scored = bounties.map(b => {
    const titleTokens = tokens(b.title || "");
    if (titleTokens.length < 3) return null;
    const hits = titleTokens.filter(t => articleSet.has(t)).length;
    const jaccard = hits / titleTokens.length;
    const titleNorm = normalize(b.title || "");
    const exact = titleNorm.length >= 12 && articleNorm.includes(titleNorm);
    const assetMatch = !!(citAssetKey && b.asset && b.asset.toLowerCase().trim() === citAssetKey);
    const assetBonus = (assetMatch && hits >= 2) ? 0.2 : 0;
    let score = jaccard + (exact ? 0.4 : 0) + assetBonus;

    if (citTs) {
      const bTs = parseDate(b.date);
      if (bTs) {
        const daysBefore = (citTs - bTs) / 86400000;
        if (daysBefore < -2 || daysBefore > 21) score *= 0.5;
      }
    }

    return { bounty: b, score: Math.min(1, score), hits, titleTokens: titleTokens.length, exact, assetMatch };
  }).filter(Boolean);

  return scored.sort((a, b) => b.score - a.score);
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const input = req.method === "POST" ? (req.body || {}) : (req.query || {});
  const articleLink      = input.articleLink;
  const campaignId       = input.campaignId;
  const citationDate     = input.citationDate || null;
  const citationAuthor   = (input.citationAuthor || "").trim();
  const citationHeadline = (input.citationHeadline || "").trim();
  const citationTopic    = (input.citationTopic || "").trim();
  const citationAsset    = (input.citationAsset || "").trim();
  const threshold        = Number(input.threshold ?? 0.5);
  if (!articleLink || !campaignId) {
    return res.status(400).json({ error: "Missing articleLink or campaignId" });
  }
  const authorKey    = s => (s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
  const authorTokens = s => (s||"").toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 3);
  const authorSim = (a, b) => {
    if (!a || !b) return 0;
    const ak = authorKey(a), bk = authorKey(b);
    if (!ak || !bk) return 0;
    if (ak === bk) return 1;
    if (ak.length >= 3 && bk.length >= 3 && (ak.includes(bk) || bk.includes(ak))) return 0.9;
    const aT = authorTokens(a), bT = authorTokens(b);
    const shared = aT.filter(t => bT.includes(t)).length;
    if (shared > 0) return 0.6 + Math.min(0.2, shared * 0.1);
    return 0;
  };

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: bounties, error: dbErr } = await supabase
      .from("bounties")
      .select("id,title,date,author,asset,cq_link,author_twitter_link,cq_twitter_link,analytics_link,telegram_link")
      .eq("campaign_id", campaignId);
    if (dbErr) throw dbErr;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    let html = "", fetchError = null;
    try {
      const r = await fetch(articleLink, {
        headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,*/*" },
        redirect: "follow",
        signal: controller.signal,
      });
      if (!r.ok) fetchError = `HTTP ${r.status}`;
      else html = await r.text();
    } catch (e) {
      fetchError = e.name === "AbortError" ? "timeout" : e.message;
    } finally {
      clearTimeout(timer);
    }

    if (fetchError) {
      return res.status(200).json({ articleLink, campaignId, method: "none", matches: [], bountiesChecked: bounties.length, fetchError });
    }

    const urlHits = urlMatch(html, bounties);
    if (urlHits.length) {
      return res.status(200).json({
        articleLink, campaignId, method: "url",
        matches: urlHits.map(h => ({ bountyId: h.bounty.id, title: h.bounty.title, date: h.bounty.date, author: h.bounty.author, matchedUrl: h.matchedUrl, identifier: h.identifier, confidence: "high" })),
        bountiesChecked: bounties.length, htmlLength: html.length,
      });
    }

    const AUTHOR_SIM_MIN = 0.6;
    const authorScoped = citationAuthor
      ? bounties.filter(b => authorSim(b.author, citationAuthor) >= AUTHOR_SIM_MIN)
      : bounties;
    const kwPool = authorScoped.length ? authorScoped : bounties;
    const authorFiltered = kwPool !== bounties;
    const matchedAuthors = authorFiltered
      ? [...new Set(kwPool.map(b => b.author).filter(Boolean))]
      : [];
    const kwScored = keywordMatch(html, kwPool, { citationDate, citationHeadline, citationTopic, citationAsset });
    const top = kwScored.filter(s => s.score >= threshold).slice(0, 5);
    const confOf = s => s >= 0.8 ? "high" : s >= 0.6 ? "medium" : "low";

    return res.status(200).json({
      articleLink, campaignId, method: top.length ? "keyword" : "none",
      matches: top.map(s => ({ bountyId: s.bounty.id, title: s.bounty.title, date: s.bounty.date, author: s.bounty.author, asset: s.bounty.asset, score: Number(s.score.toFixed(3)), hits: s.hits, titleTokens: s.titleTokens, exactTitleMatch: s.exact, assetMatch: s.assetMatch, confidence: confOf(s.score) })),
      bountiesChecked: bounties.length,
      bountiesScored: kwPool.length,
      authorFiltered,
      matchedAuthors,
      htmlLength: html.length,
      topCandidates: kwScored.slice(0, 3).map(s => ({ title: s.bounty.title, author: s.bounty.author, score: Number(s.score.toFixed(3)) })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
