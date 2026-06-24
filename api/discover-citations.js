import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────
//  Citation discovery (BETA) — finds candidate media articles that mention
//  CryptoQuant + the campaign, via Google News RSS (free, no key). Returns a
//  review queue; it does NOT write to the DB. Dedupes against existing citations.
//  Runs on deployed Vercel only.
// ─────────────────────────────────────────────────────────
export const config = { maxDuration: 30 };

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tzoysqzcpivdhkspnhdy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_kjSTm_bgCQR-Y7pvmp_oGg_YQAqsbCv";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const decode = (s) => (s || "")
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&#39;/g, "'").replace(/&apos;/g, "'").replace(/&quot;/g, '"')
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .trim();

const parseRssItems = (xml) => {
  const items = [];
  const blocks = String(xml || "").split(/<item>/i).slice(1);
  for (const b of blocks) {
    const get = (tag) => { const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i")); return m ? decode(m[1]) : ""; };
    const titleRaw = get("title");
    const link = get("link");
    const pubDate = get("pubDate");
    const sourceM = b.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
    const source = sourceM ? decode(sourceM[1]) : "";
    // Google News appends " - Source" to titles — strip it for a clean headline.
    let title = titleRaw;
    if (source && title.endsWith(` - ${source}`)) title = title.slice(0, -(source.length + 3)).trim();
    if (!title || !link) continue;
    items.push({ title, link, source, pubDate });
  }
  return items;
};

const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { campaignId, campaignName, customQuery, extraTerms, afterDate } = req.body || {};

    // Clean the client name (drop trailing "(2025-2026)" / "Marketing" noise) for the query.
    const name = (campaignName || "").replace(/\b(marketing|campaign)\b/gi, "").replace(/\s*\(.*?\)\s*/g, "").replace(/\s*\d{4}(-\d{4})?\s*/g, "").replace(/\s+/g, " ").trim();

    // A custom query is used verbatim (full control); otherwise build defaults from the campaign.
    let queries;
    if (customQuery && customQuery.trim()) {
      queries = [customQuery.trim()];
    } else if (name) {
      queries = [
        `"CryptoQuant" "${name}"`,
        `CryptoQuant ${name} on-chain data`,
        ...(extraTerms ? [`"CryptoQuant" ${name} ${extraTerms}`] : []),
      ];
    } else {
      return res.status(400).json({ error: "Provide a customQuery or a campaignName" });
    }

    // Don't search for coverage that predates the campaign — Google News supports an `after:` operator.
    const after = /^\d{4}-\d{2}-\d{2}$/.test(afterDate || "") ? afterDate : null;
    if (after) queries = queries.map((q) => (/\bafter:/i.test(q) ? q : `${q} after:${after}`));

    // Existing citations for this campaign → dedupe set.
    let existing = [];
    if (campaignId) {
      try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        const { data } = await supabase.from("citations").select("media,headline,topic").eq("campaign_id", campaignId);
        existing = data || [];
      } catch { /* dedupe just degrades to none */ }
    }
    const existingTitles = new Set(existing.map((c) => norm(c.headline || c.topic)).filter(Boolean));

    const seen = new Set();
    const candidates = [];
    for (const q of queries) {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
      let xml = "";
      try {
        const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/rss+xml,application/xml,text/xml" } });
        if (r.ok) xml = await r.text();
      } catch { /* skip this query */ }
      for (const it of parseRssItems(xml)) {
        const key = norm(it.title);
        if (!key || seen.has(key)) continue;
        // Belt-and-suspenders: drop anything published before the campaign started.
        if (after && it.pubDate) { const d = new Date(it.pubDate); if (!isNaN(d) && d < new Date(after)) continue; }
        seen.add(key);
        // Light relevance heuristic: title or source should plausibly relate.
        const hay = norm(`${it.title} ${it.source}`);
        const mentionsCQ = hay.includes("cryptoquant");
        const mentionsClient = name && hay.includes(norm(name));
        candidates.push({ ...it, query: q, already: existingTitles.has(key), mentionsCQ, mentionsClient });
      }
    }
    candidates.sort((a, b) => (Number(a.already) - Number(b.already)) || (new Date(b.pubDate || 0) - new Date(a.pubDate || 0)));

    return res.status(200).json({
      campaignName: name,
      queries,
      afterDate: after,
      existingCount: existing.length,
      total: candidates.length,
      newCount: candidates.filter((c) => !c.already).length,
      candidates: candidates.slice(0, 60),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
