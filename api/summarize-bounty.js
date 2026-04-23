import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tzoysqzcpivdhkspnhdy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_kjSTm_bgCQR-Y7pvmp_oGg_YQAqsbCv";
const RSS_URL      = "https://cryptoquant.com/rss/insights/quicktake";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

let rssCache = { at: 0, items: null };
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

const fetchRss = async () => {
  if (rssCache.items && (Date.now() - rssCache.at) < RSS_TTL_MS) return rssCache.items;
  const r = await fetch(RSS_URL, { headers: { "User-Agent": UA, "Accept": "application/rss+xml,application/xml,text/xml" } });
  if (!r.ok) throw new Error(`RSS fetch failed: HTTP ${r.status}`);
  const xml = await r.text();
  const items = parseRss(xml);
  rssCache = { at: Date.now(), items };
  return items;
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

const extractArticleText = (html) => {
  const strip = (s) => s
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, " ")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, " ")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, " ")
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[#\w]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const articleMatches = [...html.matchAll(/<article[^>]*>([\s\S]*?)<\/article>/gi)];
  if (articleMatches.length) {
    const t = strip(articleMatches.map(m => m[1]).join(" "));
    if (t.length >= 300) return t;
  }
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    const t = strip(mainMatch[1]);
    if (t.length >= 300) return t;
  }
  return strip(html);
};

const fetchViaScrapingBee = async (url) => {
  const sbKey = process.env.SCRAPINGBEE_API_KEY;
  if (!sbKey) return { html: "", err: "SCRAPINGBEE_API_KEY not set" };
  const sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${encodeURIComponent(sbKey)}&url=${encodeURIComponent(url)}&render_js=false&premium_proxy=true`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const r = await fetch(sbUrl, { signal: controller.signal });
    if (!r.ok) return { html: "", err: `ScrapingBee HTTP ${r.status}` };
    const html = await r.text();
    return { html, err: null };
  } catch (e) {
    return { html: "", err: e.name === "AbortError" ? "ScrapingBee timeout" : e.message };
  } finally {
    clearTimeout(timer);
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
      try {
        const items = await fetchRss();
        const bountySlug = extractSlug(bounty.cq_link);
        entry = items.find(item =>
          (bountySlug && (item.guid === bountySlug || extractSlug(item.link) === bountySlug)) ||
          (item.link && item.link.includes(bounty.cq_link))
        );
        if (entry) {
          source = (entry.description || entry.title || "").replace(/\s+/g, " ").trim().slice(0, 6000);
          sourceType = "rss";
        }
      } catch {}

      if (!source || source.length < 80) {
        const sb = await fetchViaScrapingBee(bounty.cq_link);
        if (sb.html) {
          source = extractArticleText(sb.html).slice(0, 12000);
          sourceType = "scrapingbee";
        }
        if (!source || source.length < 80) {
          return res.status(200).json({
            bountyId, skipped: true,
            reason: source ? `Content too short (${source.length} chars)` : (sb.err || "no content available — paste manually in the modal"),
          });
        }
      }
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

    const anthropic = new Anthropic({ apiKey });
    const prompt = `Summarize this CryptoQuant analysis in 3-4 sentences. Capture: the main finding, the asset(s), specific numbers (% changes, $ amounts, thresholds), and the bullish/bearish/neutral implication. Prefer concrete phrasings like "BTC exchange inflows rose 22%..." over vague ones like "analysis of Bitcoin trends".

TITLE: ${(entry?.title) || bounty.title || "(untitled)"}
AUTHOR: ${(entry?.creator) || bounty.author || "unknown"}
ASSET: ${bounty.asset || "—"}

CONTENT:
"""
${source}
"""

Return only the summary text, no preamble.`;

    let llmResponse;
    try {
      llmResponse = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 512,
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
