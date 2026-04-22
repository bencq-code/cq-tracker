import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tzoysqzcpivdhkspnhdy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_kjSTm_bgCQR-Y7pvmp_oGg_YQAqsbCv";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

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

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const input = req.method === "POST" ? (req.body || {}) : (req.query || {});
  const bountyId = input.bountyId;
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
      return res.status(200).json({ bountyId, skipped: true, reason: "No cqLink to fetch" });
    }
    if (bounty.summary && !input.force) {
      return res.status(200).json({ bountyId, skipped: true, reason: "Already has summary", summary: bounty.summary });
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    let html = "", fetchError = null;
    try {
      const r = await fetch(bounty.cq_link, {
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

    if (fetchError || !html) {
      return res.status(200).json({ bountyId, skipped: true, reason: `Fetch failed: ${fetchError||"empty"}` });
    }

    const bodyText = extractArticleText(html).slice(0, 8000);
    if (bodyText.length < 150) {
      return res.status(200).json({ bountyId, skipped: true, reason: `Body too short (${bodyText.length} chars)` });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });

    const anthropic = new Anthropic({ apiKey });
    const prompt = `Summarize this CryptoQuant analysis in 3-4 sentences. Capture: the main finding/claim, the asset(s) involved, any specific numbers (% changes, $ amounts, thresholds), and the bullish/bearish/neutral implication. Be concrete — prefer "BTC exchange inflows rose 22% to $2.1B, suggesting distribution pressure" over "analysis of Bitcoin market dynamics".

TITLE: ${bounty.title || "(untitled)"}
AUTHOR: ${bounty.author || "unknown"}
ASSET: ${bounty.asset || "—"}

CONTENT:
"""
${bodyText}
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
      bodyLength: bodyText.length,
      usage: {
        input_tokens: llmResponse.usage.input_tokens,
        output_tokens: llmResponse.usage.output_tokens,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
