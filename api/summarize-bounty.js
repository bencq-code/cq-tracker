import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tzoysqzcpivdhkspnhdy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_kjSTm_bgCQR-Y7pvmp_oGg_YQAqsbCv";
const RSS_BASE     = "https://cryptoquant.com/rss/insights/quicktake";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

const rssCache = new Map();
const RSS_TTL_MS = 5 * 60 * 1000;

const parseRss = (xml) => {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRegex.exec(xml)) !== null) {
    const body = m[1];
    const getTag = (tag) => {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const found = body.match(re);
      if (!found) return "";
      return found[1].replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim();
    };
    items.push({
      title:       getTag("title"),
      description: getTag("description"),
      link:        getTag("link"),
      guid:        getTag("guid"),
      creator:     getTag("dc:creator"),
    });
  }
  return items;
};

const fetchRssChunk = async ({ start, limit = 100 } = {}) => {
  const cacheKey = `${start || "latest"}_${limit}`;
  const cached = rssCache.get(cacheKey);
  if (cached && (Date.now() - cached.at) < RSS_TTL_MS) return cached.items;
  const params = new URLSearchParams();
  if (start) params.set("start", start);
  params.set("limit", String(limit));
  const url = `${RSS_BASE}?${params.toString()}`;
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/rss+xml,application/xml,text/xml" } });
  if (!r.ok) throw new Error(`RSS fetch failed: HTTP ${r.status}`);
  const xml = await r.text();
  const items = parseRss(xml);
  rssCache.set(cacheKey, { at: Date.now(), items });
  return items;
};

const fetchRssWindowFor = async (bountyDate) => {
  if (!bountyDate) return await fetchRssChunk({ limit: 100 });
  const d = new Date(bountyDate);
  if (isNaN(d.getTime())) return await fetchRssChunk({ limit: 100 });
  d.setDate(d.getDate() - 7);
  const start = d.toISOString().slice(0, 10);
  return await fetchRssChunk({ start, limit: 100 });
};

const extractSlug = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
};


export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const input = req.method === "POST" ? (req.body || {}) : (req.query || {});
  const bountyId   = input.bountyId;
  const rawContent = (input.rawContent || "").toString().trim();
  if (!bountyId) return res.status(400).json({ error: "Missing bountyId" });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: bounty, error: dbErr } = await supabase
      .from("bounties")
      .select("id,title,author,asset,cq_link,summary")
      .eq("id", bountyId)
      .maybeSingle();
    if (dbErr) throw dbErr;
    if (!bounty) return res.status(404).json({ error: "Bounty not found" });
    if (!bounty.cq_link) {
      return res.status(200).json({ bountyId, skipped: true, reason: "No cqLink to look up" });
    }
    if (bounty.summary && !input.force && !rawContent) {
      return res.status(200).json({ bountyId, skipped: true, reason: "Already has summary", summary: bounty.summary });
    }

    let source = "";
    let sourceType = "";
    let entry = null;

    if (rawContent && rawContent.length >= 80) {
      source = rawContent.replace(/\s+/g, " ").trim().slice(0, 12000);
      sourceType = "manual";
    } else {
      let rssError = null;
      try {
        const bountyDate = bounty.date || bounty.created_at;
        const items = await fetchRssWindowFor(bountyDate);
        const bountySlug = extractSlug(bounty.cq_link);
        entry = items.find(item =>
          (bountySlug && (item.guid === bountySlug || extractSlug(item.link) === bountySlug)) ||
          (item.link && item.link.includes(bounty.cq_link))
        );
        if (entry) {
          source = (entry.description || entry.title || "").replace(/\s+/g, " ").trim().slice(0, 6000);
          sourceType = "rss";
        }
      } catch (e) {
        rssError = e.message;
      }

      if (!source || source.length < 80) {
        return res.status(200).json({
          bountyId, skipped: true,
          reason: source
            ? `RSS content too short (${source.length} chars)`
            : rssError
              ? `RSS fetch failed: ${rssError}. Paste content manually in the modal.`
              : "Bounty not found in RSS feed for that date window. Paste content manually in the modal.",
        });
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

    const anthropic = new Anthropic({ apiKey });
    const prompt = `Summarize this CryptoQuant analysis in EXACTLY 2-3 sentences, maximum 50 words total. Be dense and concrete: pack in the asset, specific numbers (% changes, $ amounts, thresholds), and the bullish/bearish/neutral read. No preamble, no bullet points, no line breaks — one short paragraph.

Good example: "BTC exchange inflows on Binance rose 22% to $2.1B in one week while long-term holder reserves hit a new high. Short-term holder cost basis sits at $68K. Bullish signal — accumulation outpacing distribution pressure."

TITLE: ${(entry?.title) || bounty.title || "(untitled)"}
AUTHOR: ${(entry?.creator) || bounty.author || "unknown"}
ASSET: ${bounty.asset || "—"}

CONTENT:
"""
${source}
"""

Return only the summary text.`;

    let llmResponse;
    try {
      llmResponse = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 180,
        messages: [{ role: "user", content: prompt }],
      });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) return res.status(500).json({ error: "Invalid ANTHROPIC_API_KEY" });
      if (e instanceof Anthropic.RateLimitError) return res.status(429).json({ error: "Rate limited — retry soon" });
      throw e;
    }

    const textBlock = llmResponse.content.find(b => b.type === "text");
    const summary = textBlock?.text?.trim() || "";
    if (!summary) return res.status(500).json({ error: "Empty LLM response" });

    const { error: upErr } = await supabase.from("bounties").update({ summary }).eq("id", bountyId);
    if (upErr) throw upErr;

    return res.status(200).json({
      bountyId,
      summary,
      sourceType,
      sourceLength: source.length,
      usage: {
        input_tokens: llmResponse.usage.input_tokens,
        output_tokens: llmResponse.usage.output_tokens,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
