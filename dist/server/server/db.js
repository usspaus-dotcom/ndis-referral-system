import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, sql, gte } from "drizzle-orm";
import * as schema from "../drizzle/schema.js";
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
// ── Users ─────────────────────────────────────────────────────────────────────
export async function getUserByEmail(email) {
    const rows = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
    return rows[0] ?? null;
}
export async function createUser(data) {
    const rows = await db.insert(schema.users).values(data).returning();
    return rows[0];
}
// ── Leads ─────────────────────────────────────────────────────────────────────
export async function createLead(data) {
    const rows = await db.insert(schema.leads).values(data).returning();
    return rows[0];
}
export async function listLeads(filters) {
    if (filters?.status) {
        return db.select().from(schema.leads)
            .where(eq(schema.leads.status, filters.status))
            .orderBy(desc(schema.leads.createdAt));
    }
    return db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt));
}
export async function getLead(id) {
    const rows = await db.select().from(schema.leads).where(eq(schema.leads.id, id)).limit(1);
    return rows[0] ?? null;
}
export async function updateLeadStatus(id, status, extra) {
    const now = Date.now();
    const updates = { status, updatedAt: now, ...extra };
    if (status === "contacted")
        updates.contactedAt = now;
    if (status === "enrolled")
        updates.enrolledAt = now;
    const rows = await db.update(schema.leads).set(updates).where(eq(schema.leads.id, id)).returning();
    return rows[0];
}
export async function updateLeadCarePlan(id, carePlan) {
    const rows = await db.update(schema.leads)
        .set({ carePlan, updatedAt: Date.now() })
        .where(eq(schema.leads.id, id))
        .returning();
    return rows[0];
}
export async function updateGiftCardSent(id, sent) {
    const rows = await db.update(schema.leads)
        .set({ giftCardSent: sent, updatedAt: Date.now() })
        .where(eq(schema.leads.id, id))
        .returning();
    return rows[0];
}
// ── Commission Summary ────────────────────────────────────────────────────────
export async function getCommissionSummary() {
    const result = await db.select({
        totalLeads: sql `count(*)`,
        enrolledCount: sql `count(*) filter (where status = 'enrolled' or status = 'paid')`,
        paidCount: sql `count(*) filter (where status = 'paid')`,
        totalGross: sql `coalesce(sum(gross_commission) filter (where status = 'enrolled' or status = 'paid'), 0)`,
        totalPaidOut: sql `coalesce(sum(referrer_payout) filter (where gift_card_sent = true), 0)`,
        totalNet: sql `coalesce(sum(net_commission) filter (where status = 'enrolled' or status = 'paid'), 0)`,
    }).from(schema.leads);
    return result[0];
}
// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getConversionFunnel() {
    const result = await db.select({
        total: sql `count(*)`,
        contacted: sql `count(*) filter (where status != 'pending')`,
        enrolled: sql `count(*) filter (where status = 'enrolled' or status = 'paid')`,
        paid: sql `count(*) filter (where status = 'paid')`,
    }).from(schema.leads);
    return result[0];
}
export async function getSuburbBreakdown() {
    return db.select({
        suburb: schema.leads.suburb,
        state: schema.leads.state,
        count: sql `count(*)`,
    }).from(schema.leads)
        .where(sql `suburb is not null`)
        .groupBy(schema.leads.suburb, schema.leads.state)
        .orderBy(desc(sql `count(*)`))
        .limit(15);
}
export async function getStateSummary() {
    return db.select({
        state: schema.leads.state,
        count: sql `count(*)`,
    }).from(schema.leads)
        .where(sql `state is not null`)
        .groupBy(schema.leads.state)
        .orderBy(desc(sql `count(*)`));
}
export async function getServiceDemand() {
    return db.select({
        disabilityType: schema.leads.disabilityType,
        count: sql `count(*)`,
    }).from(schema.leads)
        .where(sql `disability_type is not null`)
        .groupBy(schema.leads.disabilityType)
        .orderBy(desc(sql `count(*)`))
        .limit(12);
}
export async function getReferrerLeaderboard() {
    return db.select({
        referrerName: schema.leads.referrerName,
        referrerEmail: schema.leads.referrerEmail,
        totalLeads: sql `count(*)`,
        enrolled: sql `count(*) filter (where status = 'enrolled' or status = 'paid')`,
        giftCardsSent: sql `count(*) filter (where gift_card_sent = true)`,
        totalEarned: sql `coalesce(sum(net_commission) filter (where status = 'enrolled' or status = 'paid'), 0)`,
    }).from(schema.leads)
        .where(sql `referrer_name is not null`)
        .groupBy(schema.leads.referrerName, schema.leads.referrerEmail)
        .orderBy(desc(sql `count(*) filter (where status = 'enrolled' or status = 'paid')`))
        .limit(20);
}
export async function getDailyTrend(days = 30) {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return db.select({
        day: sql `to_char(to_timestamp(created_at / 1000), 'YYYY-MM-DD')`,
        count: sql `count(*)`,
        enrolled: sql `count(*) filter (where status = 'enrolled' or status = 'paid')`,
    }).from(schema.leads)
        .where(gte(schema.leads.createdAt, since))
        .groupBy(sql `to_char(to_timestamp(created_at / 1000), 'YYYY-MM-DD')`)
        .orderBy(sql `to_char(to_timestamp(created_at / 1000), 'YYYY-MM-DD')`);
}
export async function getReferralSourceBreakdown() {
    return db.select({
        source: schema.leads.referralSource,
        count: sql `count(*)`,
    }).from(schema.leads)
        .where(sql `referral_source is not null`)
        .groupBy(schema.leads.referralSource)
        .orderBy(desc(sql `count(*)`));
}
export async function getIpLocationBreakdown() {
    return db.select({
        city: schema.leads.ipCity,
        state: schema.leads.ipState,
        count: sql `count(*)`,
    }).from(schema.leads)
        .where(sql `ip_city is not null`)
        .groupBy(schema.leads.ipCity, schema.leads.ipState)
        .orderBy(desc(sql `count(*)`))
        .limit(20);
}
export async function getRecentLeads(limit = 20) {
    return db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(limit);
}
// ── Chat ──────────────────────────────────────────────────────────────────────
export async function getOrCreateChatSession(sessionId) {
    const existing = await db.select().from(schema.chatSessions)
        .where(eq(schema.chatSessions.sessionId, sessionId)).limit(1);
    if (existing[0])
        return existing[0];
    const now = Date.now();
    const rows = await db.insert(schema.chatSessions)
        .values({ sessionId, status: "active", createdAt: now, updatedAt: now })
        .returning();
    return rows[0];
}
export async function getChatMessages(sessionId) {
    return db.select().from(schema.chatMessages)
        .where(eq(schema.chatMessages.sessionId, sessionId))
        .orderBy(schema.chatMessages.createdAt);
}
export async function addChatMessage(data) {
    const rows = await db.insert(schema.chatMessages)
        .values({ ...data, createdAt: Date.now() })
        .returning();
    await db.update(schema.chatSessions)
        .set({ updatedAt: Date.now() })
        .where(eq(schema.chatSessions.sessionId, data.sessionId));
    return rows[0];
}
export async function listChatSessions() {
    return db.select().from(schema.chatSessions).orderBy(desc(schema.chatSessions.updatedAt));
}
export async function updateChatSessionStatus(sessionId, status) {
    return db.update(schema.chatSessions)
        .set({ status, updatedAt: Date.now() })
        .where(eq(schema.chatSessions.sessionId, sessionId));
}
