import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tzoysqzcpivdhkspnhdy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_kjSTm_bgCQR-Y7pvmp_oGg_YQAqsbCv";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

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
  } catch { return []; }
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

const extractArticleText = (html) => {
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch    = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const target = articleMatch?.[1] || mainMatch?.[1] || html;
  return target
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
};

const authorKey = s => (s||"").toLowerCase().replace(/[^a-z0-9]/g,"");
const authorToks = s => (s||"").toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length >= 3);
const authorSim = (a, b) => {
  if (!a || !b) return 0;
  const ak = authorKey(a), bk = authorKey(b);
  if (!ak || !bk) return 0;
  if (ak === bk) return 1;
  if (ak.length >= 3 && bk.length >= 3 && (ak.includes(bk) || bk.includes(ak))) return 0.9;
  const aT = authorToks(a), bT = authorToks(b);
  const shared = aT.filter(t => bT.includes(t)).length;
  if (shared > 0) return 0.6 + Math.min(0.2, shared * 0.1);
  return 0;
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
  if (!articleLink || !campaignId) {
    return res.status(400).json({ error: "Missing articleLink or campaignId" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: bounties, error: dbErr } = await supabase
      .from("bounties")
      .select("id,title,date,author,asset,summary,cq_link,author_twitter_link,cq_twitter_link,analytics_link,telegram_link")
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

    if (html) {
      const urlHits = urlMatch(html, bounties);
      if (urlHits.length) {
        return res.status(200).json({
          articleLink, campaignId, method: "url",
          matches: urlHits.map(h => ({
            bountyId: h.bounty.id, title: h.bounty.title, date: h.bounty.date,
            author: h.bounty.author, asset: h.bounty.asset,
            matchedUrl: h.matchedUrl, confidence: "high",
            reason: "Article contains a direct link to the bounty.",
          })),
          bountiesChecked: bounties.length,
        });
      }
    }

    let candidates = bounties;
    let authorFiltered = false;
    if (citationAuthor) {
      const matched = bounties.filter(b => authorSim(b.author, citationAuthor) >= 0.6);
      if (matched.length) { candidates = matched; authorFiltered = true; }
    }
    if (citationDate) {
      const cd = new Date(citationDate).getTime();
      if (!isNaN(cd)) {
        candidates = [...candidates].sort((a, b) => {
          const ta = new Date(a.date).getTime();
          const tb = new Date(b.date).getTime();
          const da = isNaN(ta) ? Infinity : Math.abs(cd - ta);
          const db = isNaN(tb) ? Infinity : Math.abs(cd - tb);
          return da - db;
        });
      }
    }
    candidates = candidates.slice(0, 30);

    if (candidates.length === 0) {
      return res.status(200).json({
        articleLink, campaignId, method: "none",
        matches: [], bountiesChecked: bounties.length, fetchError,
        note: "No candidate bounties available",
      });
    }

    if (authorFiltered && candidates.length === 1) {
      const b = candidates[0];
      return res.status(200).json({
        articleLink, campaignId, method: "author-singleton",
        matches: [{
          bountyId: b.id, title: b.title, date: b.date, author: b.author,
          asset: b.asset, cqLink: b.cq_link,
          confidence: "medium",
          reason: `Only bounty by ${b.author} in this campaign — auto-matched on author alone.`,
        }],
        bountiesChecked: bounties.length,
        candidatesConsidered: 1,
        authorFiltered: true,
        articleFetched: !!html,
        fetchError,
      });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY not set in Vercel env vars" });
    }

    const articleExcerpt = html ? extractArticleText(html).slice(0, 6000) : "";

    const candidatesList = candidates.map((b, i) => {
      const line = `#${i+1} | ${b.date} | ${b.author||"—"} | asset:${b.asset || "—"} | "${b.title}"`;
      return b.summary ? `${line}\n   summary: ${b.summary}` : line;
    }).join("\n");

    const userPrompt = `Match this media citation to the CryptoQuant bounty(ies) it references. Only return a bounty if the article genuinely references or draws on that specific bounty's analysis. If nothing clearly matches, return an empty array.

CITATION
- Date: ${citationDate || "unknown"}
- Headline: ${citationHeadline || "unknown"}
- Topic: ${citationTopic || "—"}
- Asset: ${citationAsset || "—"}
- CQ Author: ${citationAuthor || "unknown"}

ARTICLE EXCERPT
"""
${articleExcerpt || "(article could not be fetched — match based on headline/topic/asset alone if possible)"}
"""

CANDIDATE BOUNTIES (${candidates.length} total, sorted by date proximity to citation)
${candidatesList}

Return matches by the candidate NUMBER (e.g. 1, 2, 3 — NOT by any other identifier). Use this confidence scale:
- high: article clearly references the specific bounty's findings or title
- medium: plausible connection via asset/topic/author and date proximity, wording overlaps
- low: weak signal — avoid unless it's the only defensible option

Prefer precision over recall. An empty matches array is fine.`;

    const anthropic = new Anthropic({ apiKey });

    let llmResponse;
    try {
      llmResponse = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        messages: [{ role: "user", content: userPrompt }],
        output_config: {
          format: {
            type: "json_schema",
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                matches: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      candidateNumber: { type: "integer" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                      reason: { type: "string" },
                    },
                    required: ["candidateNumber", "confidence", "reason"],
                  },
                },
              },
              required: ["matches"],
            },
          },
        },
      });
    } catch (e) {
      if (e instanceof Anthropic.AuthenticationError) {
        return res.status(500).json({ error: "Invalid ANTHROPIC_API_KEY" });
      }
      if (e instanceof Anthropic.RateLimitError) {
        return res.status(429).json({ error: "Rate limited by Anthropic API — retry in a moment" });
      }
      throw e;
    }

    const textBlock = llmResponse.content.find(b => b.type === "text");
    if (!textBlock) {
      return res.status(500).json({ error: "No text in LLM response", response: llmResponse });
    }
    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch (e) {
      return res.status(500).json({ error: "LLM returned non-JSON", raw: textBlock.text });
    }

    const validated = (parsed.matches || [])
      .filter(m => Number.isInteger(m.candidateNumber) && m.candidateNumber >= 1 && m.candidateNumber <= candidates.length)
      .map(m => {
        const b = candidates[m.candidateNumber - 1];
        return {
          bountyId: b.id,
          title: b.title,
          date: b.date,
          author: b.author,
          asset: b.asset,
          cqLink: b.cq_link,
          confidence: m.confidence,
          reason: m.reason,
        };
      });
    const hallucinated = (parsed.matches || []).filter(m =>
      !Number.isInteger(m.candidateNumber) || m.candidateNumber < 1 || m.candidateNumber > candidates.length
    ).length;

    return res.status(200).json({
      articleLink, campaignId,
      method: validated.length ? "llm" : "none",
      matches: validated,
      bountiesChecked: bounties.length,
      candidatesConsidered: candidates.length,
      authorFiltered,
      articleFetched: !!html,
      articleExcerptLength: articleExcerpt.length,
      fetchError,
      hallucinatedIds: hallucinated,
      usage: {
        input_tokens: llmResponse.usage.input_tokens,
        output_tokens: llmResponse.usage.output_tokens,
        cache_read_input_tokens: llmResponse.usage.cache_read_input_tokens || 0,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
