import { createClient } from "@supabase/supabase-js";
/* global process */

// ─────────────────────────────────────────────────────────
//  Citation discovery (BETA) — finds candidate media articles that mention
//  CryptoQuant + the campaign, via free discovery sources. Returns a review
//  queue; it does NOT write to the DB. Dedupes against existing citations.
// ─────────────────────────────────────────────────────────
export const config = { maxDuration: 45 };

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tzoysqzcpivdhkspnhdy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_kjSTm_bgCQR-Y7pvmp_oGg_YQAqsbCv";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const decode = (s) => (s || "")
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .trim();

const stripHtml = (s) => decode(s)
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();
const uniq = (arr) => [...new Set(arr.filter(Boolean))];
const quote = (s) => `"${String(s || "").replace(/"/g, "").trim()}"`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Run an async fn over items with a bounded number of concurrent workers.
const mapLimit = async (items, limit, fn) => {
  const out = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length || 1) }, async () => {
    while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx], idx); }
  });
  await Promise.all(workers);
  return out;
};

// GDELT over-ANDs long quoted queries → reduce to its 2 strongest phrases (drops the `after:` token).
const simplifyForGdelt = (q) => {
  const phrases = q.match(/"[^"]+"/g);
  if (phrases && phrases.length) return phrases.slice(0, 2).join(" ");
  return q.replace(/\s+\bafter:\d{4}-\d{2}-\d{2}\b/gi, "").trim();
};

const cleanCampaignName = (campaignName) => (campaignName || "")
  .replace(/\b(marketing|campaign)\b/gi, "")
  .replace(/\s*\(.*?\)\s*/g, "")
  .replace(/\s*\d{4}(-\d{4})?\s*/g, "")
  .replace(/\s+/g, " ")
  .trim();

const canonicalUrl = (raw) => {
  if (!raw) return "";
  try {
    const u = new URL(raw);
    // Google News <link> values are opaque redirects, not the real article URL — useless as a dedup key.
    if (/(^|\.)news\.google\.com$/i.test(u.hostname)) return "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "mc_cid", "mc_eid"].forEach((p) => u.searchParams.delete(p));
    u.hash = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return String(raw).trim();
  }
};

const parseDateMs = (value) => {
  const s = String(value || "").trim();
  const compact = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?$/);
  if (compact) {
    const [, y, mo, d, h = "00", mi = "00", sec = "00"] = compact;
    return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(sec));
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? NaN : t;
};

const normalizePubDate = (value) => {
  const t = parseDateMs(value);
  return Number.isNaN(t) ? (value || "") : new Date(t).toISOString();
};

const campaignAliases = (name) => {
  const aliases = [name];
  const n = norm(name);
  if (n.includes("binance")) aliases.push("BNB", "BNB Chain", "Binance Research");
  if (n.includes("gate")) aliases.push("Gate.io", "Gate exchange", "Gate");
  if (n.includes("nexo")) aliases.push("Nexo", "Nexo loans", "Nexo credit");
  if (n.includes("okx")) aliases.push("OKX", "OKX exchange");
  if (n.includes("bybit")) aliases.push("Bybit", "Bybit exchange");
  if (n.includes("coinbase")) aliases.push("Coinbase", "Coinbase exchange");
  return uniq(aliases.map((a) => String(a || "").trim()).filter((a) => a.length >= 2));
};

const phraseFromTitle = (title) => {
  const t = stripHtml(title).replace(/\s+/g, " ").trim();
  if (!t || t.length < 18) return "";
  return t.split(/\s+/).slice(0, 10).join(" ").slice(0, 90).trim();
};

const phraseFromSummary = (summary) => {
  const text = stripHtml(summary);
  const metric = text.match(/\b(?:\$?\d+(?:\.\d+)?%?|\d+(?:\.\d+)?\s?(?:M|B|K|million|billion))\b.{0,60}/i)?.[0];
  if (metric && metric.length >= 18) return metric.trim();
  return text.split(/[.!?]/).map((s) => s.trim()).find((s) => s.length >= 24 && s.length <= 110) || "";
};

const buildQueries = ({ name, customQuery, extraTerms, bounties }) => {
  if (customQuery && customQuery.trim()) return [customQuery.trim()];
  if (!name) return [];

  const aliases = campaignAliases(name);
  const queries = [];
  for (const a of aliases.slice(0, 4)) queries.push(`${quote("CryptoQuant")} ${quote(a)}`);
  queries.push(`CryptoQuant ${aliases[0]} on-chain data`);
  if (extraTerms) queries.push(`${quote("CryptoQuant")} ${aliases[0]} ${extraTerms}`);

  const recent = [...(bounties || [])]
    .filter((b) => b.title || b.summary)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 8);

  for (const b of recent) {
    if (b.asset) queries.push(`${quote("CryptoQuant")} ${quote(b.asset)} ${quote(aliases[0])}`);
    if (b.author && b.asset) queries.push(`${quote(b.author)} ${quote("CryptoQuant")} ${quote(b.asset)}`);
    const titlePhrase = phraseFromTitle(b.title);
    if (titlePhrase) queries.push(`${quote("CryptoQuant")} ${quote(titlePhrase)}`);
    const summaryPhrase = phraseFromSummary(b.summary);
    if (summaryPhrase) queries.push(`${quote("CryptoQuant")} ${quote(summaryPhrase)}`);
  }

  return uniq(queries).slice(0, 14);
};

const parseRssItems = (xml) => {
  const items = [];
  const blocks = String(xml || "").split(/<item>/i).slice(1);
  for (const b of blocks) {
    const get = (tag) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
      return m ? decode(m[1]) : "";
    };
    const titleRaw = get("title");
    const link = get("link");
    const pubDate = get("pubDate");
    const description = stripHtml(get("description"));
    const sourceM = b.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const source = sourceM ? decode(sourceM[1]) : "";
    let title = titleRaw;
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3)).trim();
    if (!title || !link) continue;
    items.push({ title, link, source, pubDate, description, provider: "google_news" });
  }
  return items;
};

const fetchGoogleNews = async (q) => {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/rss+xml,application/xml,text/xml" } });
    if (!r.ok) return [];
    return parseRssItems(await r.text());
  } catch {
    return [];
  }
};

const fetchGdelt = async (q, { after } = {}) => {
  const gdeltQuery = q.replace(/\s+\bafter:\d{4}-\d{2}-\d{2}\b/gi, "").trim();
  const params = new URLSearchParams({
    query: gdeltQuery,
    mode: "artlist",
    format: "json",
    maxrecords: "25",
    sort: "datedesc",
  });
  // GDELT doesn't understand `after:` — use its native absolute date range instead.
  if (after) {
    params.set("startdatetime", `${after.replace(/-/g, "")}000000`);
    params.set("enddatetime", new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14));
  }
  try {
    const r = await fetch(`https://api.gdeltproject.org/api/v2/doc/doc?${params.toString()}`, {
      headers: { "User-Agent": UA, "Accept": "application/json" },
    });
    if (!r.ok) return [];
    // On rate-limit / bad query GDELT returns plain text, not JSON — don't let that throw.
    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch { return []; }
    return (data.articles || []).map((a) => ({
      title: a.title || "",
      link: a.url || "",
      source: a.domain || a.sourceCountry || "",
      pubDate: normalizePubDate(a.seendate || a.datetime || ""),
      description: a.snippet || "",
      provider: "gdelt",
    })).filter((it) => it.title && it.link);
  } catch {
    return [];
  }
};

const scoreCandidate = (item, { aliases }) => {
  const title = norm(item.title);
  const hay = norm(`${item.title} ${item.description || ""} ${item.source || ""}`);
  const reasons = [];
  let score = 0;

  const hasCQTitle = title.includes("cryptoquant") || title.includes("cq research");
  const hasCQAny = hay.includes("cryptoquant") || hay.includes("cq research");
  if (hasCQTitle) { score += 45; reasons.push("CryptoQuant in title"); }
  else if (hasCQAny) { score += 25; reasons.push("CryptoQuant in snippet/source"); }

  const aliasHits = aliases.filter((a) => {
    const n = norm(a);
    return n && hay.includes(n);
  });
  if (aliasHits.length) {
    const titleHit = aliasHits.some((a) => title.includes(norm(a)));
    score += titleHit ? 35 : 18;
    reasons.push(`${titleHit ? "Title" : "Snippet"} mentions ${aliasHits.slice(0, 2).join(", ")}`);
  }

  if (item.provider === "gdelt") { score += 6; reasons.push("Found by GDELT"); }
  if (item.provider === "google_news") { score += 8; reasons.push("Found by Google News"); }
  if ((item.description || "").length >= 80) score += 6;

  return {
    score: Math.min(score, 100),
    reasons,
    mentionsCQ: hasCQAny,
    mentionsClient: aliasHits.length > 0,
  };
};

const mergeCandidate = (map, item, meta) => {
  const urlKey = canonicalUrl(item.link);
  const titleKey = norm(item.title);
  const key = urlKey || titleKey;
  if (!key) return;

  const scored = scoreCandidate(item, meta);
  const existing = map.get(key);
  if (existing) {
    existing.providers = uniq([...existing.providers, item.provider]);
    existing.queries = uniq([...existing.queries, item.query]);
    existing.score = Math.max(existing.score, scored.score);
    existing.reasons = uniq([...existing.reasons, ...scored.reasons]);
    existing.mentionsCQ = existing.mentionsCQ || scored.mentionsCQ;
    existing.mentionsClient = existing.mentionsClient || scored.mentionsClient;
    if (!existing.description && item.description) existing.description = item.description;
    return;
  }

  map.set(key, {
    title: item.title,
    link: item.link,
    canonicalUrl: urlKey,
    source: item.source,
    pubDate: item.pubDate,
    description: item.description || "",
    provider: item.provider,
    providers: [item.provider],
    query: item.query,
    queries: [item.query],
    score: scored.score,
    reasons: scored.reasons,
    mentionsCQ: scored.mentionsCQ,
    mentionsClient: scored.mentionsClient,
    already: meta.existingTitles.has(titleKey) || (urlKey && meta.existingUrls.has(urlKey)),
  });
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { campaignId, campaignName, customQuery, extraTerms, afterDate, providers: requestedProviders } = req.body || {};
    const name = cleanCampaignName(campaignName);
    const after = /^\d{4}-\d{2}-\d{2}$/.test(afterDate || "") ? afterDate : null;
    const providerList = Array.isArray(requestedProviders) && requestedProviders.length
      ? requestedProviders
      : ["google_news", "gdelt"];

    let existing = [];
    let bounties = [];
    if (campaignId) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const [{ data: existingRows }, { data: bountyRows }] = await Promise.all([
          supabase.from("citations").select("media,headline,topic,article_link").eq("campaign_id", campaignId),
          supabase.from("bounties").select("title,date,author,asset,summary,cq_link").eq("campaign_id", campaignId),
        ]);
        existing = existingRows || [];
        bounties = bountyRows || [];
      } catch { /* discovery degrades without DB context */ }
    }

    let queries = buildQueries({ name, customQuery, extraTerms, bounties });
    if (!queries.length) return res.status(400).json({ error: "Provide a customQuery or a campaignName" });
    if (after) queries = queries.map((q) => (/\bafter:/i.test(q) ? q : `${q} after:${after}`));

    const aliases = campaignAliases(name);
    const existingTitles = new Set(existing.map((c) => norm(c.headline || c.topic)).filter(Boolean));
    const existingUrls = new Set(existing.map((c) => canonicalUrl(c.article_link)).filter(Boolean));
    const merged = new Map();
    const afterMs = after ? new Date(after).getTime() : null;

    // Google News: independent requests → fan out (capped to avoid throttling).
    const gnLists = providerList.includes("google_news")
      ? await mapLimit(queries, 5, (q) => fetchGoogleNews(q).then((items) => items.map((it) => ({ ...it, query: q }))))
      : [];

    // GDELT enforces a hard 1-request-per-5s limit (returns a plain-text scolding otherwise) and
    // over-ANDs long queries → throttle a small, simplified set and degrade quietly when it balks.
    const gdItems = [];
    if (providerList.includes("gdelt")) {
      const gdQueries = uniq(queries.map(simplifyForGdelt)).slice(0, 4);
      for (let i = 0; i < gdQueries.length; i++) {
        if (i) await sleep(5000);
        const items = await fetchGdelt(gdQueries[i], { after });
        for (const it of items) gdItems.push({ ...it, query: gdQueries[i] });
      }
    }

    for (const item of [...gnLists.flat(), ...gdItems]) {
      if (afterMs && item.pubDate) {
        const t = parseDateMs(item.pubDate);
        if (!Number.isNaN(t) && t < afterMs) continue;
      }
      mergeCandidate(merged, item, { aliases, existingTitles, existingUrls });
    }

    // Auto mode: drop pure noise that mentions neither CryptoQuant nor the client anywhere.
    // Custom queries are trusted as-is (the user may search a topic that never names CryptoQuant).
    const isCustom = !!(customQuery && customQuery.trim());
    let candidates = [...merged.values()];
    if (!isCustom) candidates = candidates.filter((c) => c.already || c.mentionsCQ || c.mentionsClient);
    candidates.sort((a, b) =>
      (Number(a.already) - Number(b.already)) ||
      (b.score - a.score) ||
      ((parseDateMs(b.pubDate) || 0) - (parseDateMs(a.pubDate) || 0))
    );

    return res.status(200).json({
      campaignName: name,
      aliases,
      queries,
      providers: providerList,
      afterDate: after,
      existingCount: existing.length,
      bountiesUsed: bounties.length,
      total: candidates.length,
      newCount: candidates.filter((c) => !c.already).length,
      candidates: candidates.slice(0, 80),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
