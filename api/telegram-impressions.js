import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────
//  Telegram view-count ("impression") fetcher
//
//  Telegram has no impressions API, but every PUBLIC channel post exposes a
//  view count. The no-JS preview page  https://t.me/<channel>/<id>?embed=1
//  contains  <span class="tgme_widget_message_views">12.3K</span>.
//
//  For each bounty we pull the ANALYST post (author_telegram_link) AND the
//  CryptoQuant post (telegram_link), sum the views, and write the total into
//  the bounty's `telegram_impressions` column. Mirrors twitter-impressions.js.
//
//  No Telegram credentials needed (public channels only). Numbers are the
//  rounded figures Telegram shows (e.g. "12.3K" → 12300).
//
//  Runs on deployed Vercel only — local `npm run dev` does not serve /api.
// ─────────────────────────────────────────────────────────

export const config = { maxDuration: 60 };

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tzoysqzcpivdhkspnhdy.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "sb_publishable_kjSTm_bgCQR-Y7pvmp_oGg_YQAqsbCv";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const CONCURRENCY = 6;

// t.me/<channel>/<id>  or  t.me/s/<channel>/<id>  (ignores ?query / #frag)
const extractTgRef = (value) => {
  if (!value) return null;
  const m = String(value).trim().match(/t\.me\/(?:s\/)?([A-Za-z0-9_]+)\/(\d+)/);
  return m ? { channel: m[1], id: m[2], key: `${m[1]}/${m[2]}` } : null;
};

// "12.3K" → 12300, "1.2M" → 1200000, "1,234" → 1234
const parseCount = (s) => {
  if (!s) return null;
  const m = String(s).trim().replace(/,/g, "").match(/^([\d.]+)\s*([KkMmBb]?)/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (isNaN(n)) return null;
  const suf = m[2].toUpperCase();
  if (suf === "K") n *= 1e3;
  else if (suf === "M") n *= 1e6;
  else if (suf === "B") n *= 1e9;
  return Math.round(n);
};

async function fetchViews(ref) {
  const url = `https://t.me/${ref.channel}/${ref.id}?embed=1&mode=tme`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "en" } });
    if (!r.ok) return null;
    const html = await r.text();
    const m = html.match(/tgme_widget_message_views[^>]*>([^<]+)</);
    return m ? parseCount(m[1]) : null;
  } catch {
    return null;
  }
}

// Fetch views for a list of refs with limited concurrency → { key: views|null }
async function fetchViewsMap(refs) {
  const out = {};
  let i = 0;
  const worker = async () => {
    while (i < refs.length) {
      const ref = refs[i++];
      out[ref.key] = await fetchViews(ref);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, refs.length) }, worker));
  return out;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    const { bountyId, bountyIds, links } = req.body || {};

    // ── Mode A: ad-hoc links (dry test, no DB writes) ──
    if (Array.isArray(links) && links.length) {
      const refToLink = {};
      for (const l of links) { const ref = extractTgRef(l); if (ref) refToLink[ref.key] = { link: l, ref }; }
      const refs = Object.values(refToLink).map(v => v.ref);
      const views = refs.length ? await fetchViewsMap(refs) : {};
      return res.status(200).json({
        mode: "links",
        results: Object.values(refToLink).map(({ link, ref }) => ({ link, postId: ref.key, views: views[ref.key] ?? null })),
      });
    }

    // ── Mode B: by bounty id(s) — fetch analyst + CQ post, sum, persist ──
    const idList = bountyId ? [bountyId] : (Array.isArray(bountyIds) ? bountyIds : []);
    if (!idList.length) {
      return res.status(400).json({ error: "Provide bountyId, bountyIds[], or links[]" });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: rows, error } = await supabase
      .from("bounties")
      .select("id,author_telegram_link,telegram_link")
      .in("id", idList);
    if (error) throw error;

    // Collect unique post refs across all bounties so we fetch each post once.
    const perBounty = [];
    const allRefs = new Map();
    for (const b of (rows || [])) {
      const aRef = extractTgRef(b.author_telegram_link);
      const cRef = extractTgRef(b.telegram_link);
      if (aRef) allRefs.set(aRef.key, aRef);
      if (cRef) allRefs.set(cRef.key, cRef);
      perBounty.push({ id: b.id, aKey: aRef?.key || null, cKey: cRef?.key || null });
    }

    const views = allRefs.size ? await fetchViewsMap([...allRefs.values()]) : {};

    const updated = [];
    let saved = 0, skipped = 0;
    for (const pb of perBounty) {
      const a = pb.aKey ? views[pb.aKey] : null;
      const c = pb.cKey ? views[pb.cKey] : null;
      if (a == null && c == null) {
        skipped++;
        updated.push({ bountyId: pb.id, total: null, analyst: null, cq: null, skipped: true });
        continue;
      }
      const total = (a || 0) + (c || 0);
      const { error: upErr } = await supabase
        .from("bounties")
        .update({ telegram_impressions: String(total) })
        .eq("id", pb.id);
      if (upErr) throw upErr;
      saved++;
      updated.push({ bountyId: pb.id, total, analyst: a ?? null, cq: c ?? null });
    }

    return res.status(200).json({ mode: "bounties", postsChecked: allRefs.size, saved, skipped, updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
