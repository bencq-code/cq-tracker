// ─────────────────────────────────────────────────────────
//  db.js  —  Data access layer for CQ Tracker
// ─────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || "https://tzoysqzcpivdhkspnhdy.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_KEY || "sb_publishable_kjSTm_bgCQR-Y7pvmp_oGg_YQAqsbCv";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─────────────────────────────────────────────────────────
//  HELPER — fetch ALL rows by paginating in chunks of 1000
// ─────────────────────────────────────────────────────────
async function fetchAll(table, query) {
  const PAGE = 1000;
  let from = 0;
  let all = [];
  while (true) {
    const { data, error } = await query(supabase.from(table)).range(from, from + PAGE - 1);
    if (error) throw error;
    all = all.concat(data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

// ─────────────────────────────────────────────────────────
//  FIELD MAPPERS  (snake_case DB  ↔  camelCase app)
// ─────────────────────────────────────────────────────────
const fromUser = (r) => ({
  id:               r.id,
  username:         r.username,
  passwordHash:     r.password_hash,
  role:             r.role,
  displayName:      r.display_name,
  allowedCampaigns: r.allowed_campaigns || [],
  clientName:       r.client_name || "",
  createdAt:        r.created_at,
});
const toUser = (u) => ({
  id:                u.id,
  username:          u.username,
  password_hash:     u.passwordHash,
  role:              u.role,
  display_name:      u.displayName || u.username,
  allowed_campaigns: u.allowedCampaigns || [],
  client_name:       u.clientName || "",
  created_at:        u.createdAt || Date.now(),
});

const fromClient = (r) => ({
  id:              r.id,
  name:            r.name,
  color:           r.color,
  status:          r.status || "active",
  sheetBounties:   r.sheet_bounties || "",
  sheetMedia:      r.sheet_media || "",
  sheetLink:       r.sheet_link || "",
  createdAt:       r.created_at,
});
const toClient = (c) => ({
  id:              c.id,
  name:            c.name,
  color:           c.color,
  status:          c.status || "active",
  sheet_bounties:  c.sheetBounties || "",
  sheet_media:     c.sheetMedia || "",
  sheet_link:      c.sheetLink || "",
  created_at:      c.createdAt || Date.now(),
});

const fromCampaign = (r) => ({
  id:                r.id,
  campaignId:        r.campaign_id,
  date:              r.date,
  author:            r.author,
  title:             r.title,
  cqLink:            r.cq_link,
  authorTwitterLink: r.author_twitter_link,
  analyticsLink:     r.analytics_link,
  cqTwitterLink:     r.cq_twitter_link,
  telegramLink:      r.telegram_link || "",
  category:          r.category || "",
  asset:             r.asset || "",
  twitterImpressions:r.twitter_impressions || "",
  telegramImpressions:r.telegram_impressions || "",
  sheetRowNo:        r.sheet_row_no || "",
  createdBy:         r.created_by,
  createdAt:         r.created_at,
});
const toCampaign = (c) => ({
  id:                  c.id,
  campaign_id:         c.campaignId,
  date:                c.date,
  author:              c.author,
  title:               c.title,
  cq_link:             c.cqLink,
  author_twitter_link: c.authorTwitterLink,
  analytics_link:      c.analyticsLink,
  cq_twitter_link:     c.cqTwitterLink,
  telegram_link:       c.telegramLink || "",
  category:            c.category || "",
  asset:               c.asset || "",
  twitter_impressions: c.twitterImpressions || "",
  telegram_impressions:c.telegramImpressions || "",
  sheet_row_no:        c.sheetRowNo || "",
  created_by:          c.createdBy,
  created_at:          c.createdAt || Date.now(),
});

const fromCitation = (r) => ({
  id:                 r.id,
  campaignId:         r.campaign_id,
  date:               r.date,
  media:              r.media,
  reporter:           r.reporter,
  author:             r.author,
  topic:              r.topic,
  headline:           r.headline || "",
  articleLink:        r.article_link,
  mediaTier:          r.media_tier || "",
  directRelationship: r.direct_relationship || "",
  language:           r.language || "",
  asset:              r.asset || "",
  branding:           r.branding || "",
  sheetRowNo:         r.sheet_row_no || "",
  createdBy:          r.created_by,
  createdAt:          r.created_at,
});
const toCitation = (c) => ({
  id:                  c.id,
  campaign_id:         c.campaignId,
  date:                c.date,
  media:               c.media,
  reporter:            c.reporter,
  author:              c.author,
  topic:               c.topic,
  headline:            c.headline || "",
  article_link:        c.articleLink,
  media_tier:          c.mediaTier || "",
  direct_relationship: c.directRelationship || "",
  language:            c.language || "",
  asset:               c.asset || "",
  branding:            c.branding || "",
  sheet_row_no:        c.sheetRowNo || "",
  created_by:          c.createdBy,
  created_at:          c.createdAt || Date.now(),
});

// ─────────────────────────────────────────────────────────
//  DB API
// ─────────────────────────────────────────────────────────
export const db = {
  // ── Users ──
  async getUsers() {
    const data = await fetchAll("users", q => q.select("*"));
    return data.map(fromUser);
  },
  async setUsers(users) {
    const { error } = await supabase.from("users").upsert(users.map(toUser), { onConflict: "id" });
    if (error) throw error;
  },

  // ── Programs (campaigns/brands) ──
  async getPrograms() {
    const data = await fetchAll("campaigns", q => q.select("*").order("created_at"));
    return data.map(fromClient);
  },
  async setPrograms(clients) {
    const existing = await fetchAll("campaigns", q => q.select("id"));
    const existingIds = existing.map(r => r.id);
    const newIds = clients.map(c => c.id);
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    if (toDelete.length) await supabase.from("campaigns").delete().in("id", toDelete);
    if (clients.length) {
      const { error } = await supabase.from("campaigns").upsert(clients.map(toClient), { onConflict: "id" });
      if (error) throw error;
    }
  },

  // ── Bounties ──
  async getCampaigns() {
    const data = await fetchAll("bounties", q => q.select("id,campaign_id,date,author,title,cq_link,author_twitter_link,analytics_link,cq_twitter_link,telegram_link,category,asset,twitter_impressions,telegram_impressions,sheet_row_no,created_by,created_at").order("date", { ascending: false }));
    return data.map(fromCampaign);
  },
  async setCampaigns(campaigns) {
    if (!campaigns.length) return;
    // Only delete rows whose campaign_ids are represented in this batch
    const campaignIds = [...new Set(campaigns.map(c => c.campaign_id || c.campaignId))];
    const existing = await fetchAll("bounties", q => q.select("id").in("campaign_id", campaignIds));
    const existingIds = existing.map(r => r.id);
    const newIds = campaigns.map(c => c.id);
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    if (toDelete.length) await supabase.from("bounties").delete().in("id", toDelete);
    const { error } = await supabase.from("bounties").upsert(campaigns.map(toCampaign), { onConflict: "id" });
    if (error) throw error;
  },

  // ── Citations ──
  async getCitations() {
    const data = await fetchAll("citations", q => q.select("id,campaign_id,date,media,reporter,author,topic,headline,article_link,media_tier,direct_relationship,language,asset,branding,sheet_row_no,created_by,created_at").order("date", { ascending: false }));
    return data.map(fromCitation);
  },
  async setCitations(citations) {
    if (!citations.length) return;
    // Only delete rows whose campaign_ids are represented in this batch
    const campaignIds = [...new Set(citations.map(c => c.campaign_id || c.campaignId))];
    const existing = await fetchAll("citations", q => q.select("id").in("campaign_id", campaignIds));
    const existingIds = existing.map(r => r.id);
    const newIds = citations.map(c => c.id);
    const toDelete = existingIds.filter(id => !newIds.includes(id));
    if (toDelete.length) await supabase.from("citations").delete().in("id", toDelete);
    const { error } = await supabase.from("citations").upsert(citations.map(toCitation), { onConflict: "id" });
    if (error) throw error;
  },

  // ── Flags ──
  async getFlag(key) {
    const { data } = await supabase.from("flags").select("value").eq("key", key).maybeSingle();
    return !!data?.value;
  },
  async setFlag(key) {
    await supabase.from("flags").upsert({ key, value: "1" }, { onConflict: "key" });
  },
  async upsertBounty(entry) {
    const { error } = await supabase.from("bounties").upsert(toCampaign(entry), { onConflict: "id" });
    if (error) throw error;
  },
  async deleteBounty(id) {
    const { error } = await supabase.from("bounties").delete().eq("id", id);
    if (error) throw error;
  },
  async upsertCitation(entry) {
    const { error } = await supabase.from("citations").upsert(toCitation(entry), { onConflict: "id" });
    if (error) throw error;
  },
  async deleteCitation(id) {
    const { error } = await supabase.from("citations").delete().eq("id", id);
    if (error) throw error;
  },
  async deleteAllBounties(campaignId) {
    const { error } = await supabase.from("bounties").delete().eq("campaign_id", campaignId);
    if (error) throw error;
  },
  async deleteAllCitations(campaignId) {
    const { error } = await supabase.from("citations").delete().eq("campaign_id", campaignId);
    if (error) throw error;
  },
  async batchDeleteBounties(ids) {
    const { error } = await supabase.from("bounties").delete().in("id", ids);
    if (error) throw error;
  },
  async batchDeleteCitations(ids) {
    const { error } = await supabase.from("citations").delete().in("id", ids);
    if (error) throw error;
  },
  async batchInsertBounties(entries) {
    const { error } = await supabase.from("bounties").upsert(entries.map(toCampaign), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  },
  async batchInsertCitations(entries) {
    const { error } = await supabase.from("citations").upsert(entries.map(toCitation), { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  },
};

export { supabase };
