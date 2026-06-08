import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────
//  Twitter / X impression fetcher
//
//  Pulls live impression_count for the ANALYST tweet (author_twitter_link)
//  AND the CryptoQuant tweet (cq_twitter_link) of each bounty, sums them,
//  and writes the total into the bounty's `twitter_impressions` column.
//
//  This replaces the old approach of hand-typing a single CQ-only number
//  in the spreadsheet — it now captures analyst tweets too.
//
//  Requires env var  X_BEARER_TOKEN  (or TWITTER_BEARER_TOKEN) on Vercel.
//  Needs an X API tier that returns public_metrics.impression_count (Basic+).
//  Runs on deployed Vercel only — local `npm run dev` does not serve /api.
// ─────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tzoysqzcpivdhkspnhdy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_kjSTm_bgCQR-Y7pvmp_oGg_YQAqsbCv";
const X_API  = "https://api.x.com/2/tweets";
const BATCH  = 100; // X allows up to 100 ids per request

// Accepts a full URL (with or without ?s=20 etc.) or a raw numeric id.
const extractTweetId = (value) => {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{10,25}$/.test(s)) return s;                       // raw id
  const m = s.match(/\/status\/(\d{10,25})/);                // .../status/<id>
  return m ? m[1] : null;
};

// Fetch impressions for a list of tweet ids → { id: impression_count | null }
async function fetchImpressions(ids, token) {
  const out = {};
  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH);
    const params = new URLSearchParams({ ids: batch.join(","), "tweet.fields": "public_metrics" });
    const url = `${X_API}?${params.toString()}`;
    const opts = { headers: { Authorization: `Bearer ${token}` } };

    let r = await fetch(url, opts);
    if (r.status === 429) { // rate limited — wait for reset, retry once
      const resetSec = Number(r.headers.get("x-rate-limit-reset")) || 0;
      const wait = Math.min(Math.max(resetSec * 1000 - Date.now(), 1000), 60000);
      await new Promise(res => setTimeout(res, wait));
      r = await fetch(url, opts);
    }
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      throw new Error(`X API ${r.status}: ${body.slice(0, 200)}`);
    }
    const data = await r.json();
    for (const t of (data.data || [])) {
      out[t.id] = t.public_metrics?.impression_count ?? null;
    }
    for (const e of (data.errors || [])) { // deleted / protected / suspended
      const tid = e.resource_id || e.value;
      if (tid && !(tid in out)) out[tid] = null;
    }
  }
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const token = process.env.X_BEARER_TOKEN || process.env.TWITTER_BEARER_TOKEN;
  if (!token) return res.status(500).json({ error: "X_BEARER_TOKEN not set in environment" });

  try {
    const { bountyId, bountyIds, links } = req.body || {};

    // ── Mode A: ad-hoc links (dry test, no DB writes) ──
    if (Array.isArray(links) && links.length) {
      const idToLink = {};
      for (const l of links) { const id = extractTweetId(l); if (id) idToLink[id] = l; }
      const ids = Object.keys(idToLink);
      const imp = ids.length ? await fetchImpressions(ids, token) : {};
      return res.status(200).json({
        mode: "links",
        results: ids.map(id => ({ link: idToLink[id], tweetId: id, impressions: imp[id] ?? null })),
      });
    }

    // ── Mode B: by bounty id(s) — fetch author + CQ tweet, sum, persist ──
    const idList = bountyId ? [bountyId] : (Array.isArray(bountyIds) ? bountyIds : []);
    if (!idList.length) {
      return res.status(400).json({ error: "Provide bountyId, bountyIds[], or links[]" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: rows, error } = await supabase
      .from("bounties")
      .select("id,author_twitter_link,cq_twitter_link")
      .in("id", idList);
    if (error) throw error;

    // Collect unique tweet ids across all bounties so we batch X calls.
    const perBounty = [];
    const allIds = new Set();
    for (const b of (rows || [])) {
      const authorTweetId = extractTweetId(b.author_twitter_link);
      const cqTweetId     = extractTweetId(b.cq_twitter_link);
      if (authorTweetId) allIds.add(authorTweetId);
      if (cqTweetId)     allIds.add(cqTweetId);
      perBounty.push({ id: b.id, authorTweetId, cqTweetId });
    }

    const imp = allIds.size ? await fetchImpressions([...allIds], token) : {};

    const updated = [];
    let saved = 0, skipped = 0;
    for (const pb of perBounty) {
      const a = pb.authorTweetId ? imp[pb.authorTweetId] : null;
      const c = pb.cqTweetId     ? imp[pb.cqTweetId]     : null;
      if (a == null && c == null) {
        skipped++;
        updated.push({ bountyId: pb.id, total: null, author: null, cq: null, skipped: true });
        continue;
      }
      const total = (a || 0) + (c || 0);
      const { error: upErr } = await supabase
        .from("bounties")
        .update({ twitter_impressions: String(total) })
        .eq("id", pb.id);
      if (upErr) throw upErr;
      saved++;
      updated.push({ bountyId: pb.id, total, author: a ?? null, cq: c ?? null });
    }

    return res.status(200).json({ mode: "bounties", tweetsChecked: allIds.size, saved, skipped, updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
