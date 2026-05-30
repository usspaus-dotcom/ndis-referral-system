import { pgTable, text, integer, boolean, bigint, pgEnum, serial, real } from "drizzle-orm/pg-core";
// ── Enums ─────────────────────────────────────────────────────────────────────
export const leadStatusEnum = pgEnum("lead_status", ["pending", "contacted", "enrolled", "paid"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "staff"]);
// ── Users (admin/staff) ───────────────────────────────────────────────────────
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: userRoleEnum("role").default("staff").notNull(),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
// ── Leads ─────────────────────────────────────────────────────────────────────
export const leads = pgTable("leads", {
    id: serial("id").primaryKey(),
    // Participant details
    participantName: text("participant_name").notNull(),
    participantPhone: text("participant_phone").notNull(),
    participantEmail: text("participant_email"),
    suburb: text("suburb"),
    state: text("state"),
    postcode: text("postcode"),
    disabilityType: text("disability_type"),
    supportNeeds: text("support_needs"),
    ndisStatus: text("ndis_status"),
    age: integer("age"),
    citizenship: text("citizenship"),
    // Referrer / Introducer details
    referrerName: text("referrer_name"),
    referrerPhone: text("referrer_phone"),
    referrerEmail: text("referrer_email"),
    referrerRelation: text("referrer_relation"),
    // Status & workflow
    status: leadStatusEnum("status").default("pending").notNull(),
    notes: text("notes"),
    carePlan: text("care_plan"),
    contactedAt: bigint("contacted_at", { mode: "number" }),
    enrolledAt: bigint("enrolled_at", { mode: "number" }),
    // Commission
    grossCommission: integer("gross_commission").default(1000),
    referrerPayout: integer("referrer_payout").default(200),
    netCommission: integer("net_commission").default(800),
    giftCardSent: boolean("gift_card_sent").default(false),
    // IP Geolocation & referral source
    ipCity: text("ip_city"),
    ipState: text("ip_state"),
    ipCountry: text("ip_country"),
    ipPostcode: text("ip_postcode"),
    ipLat: real("ip_lat"),
    ipLng: real("ip_lng"),
    referralSource: text("referral_source"),
    // Timestamps
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
// ── Chat sessions ─────────────────────────────────────────────────────────────
export const chatSessions = pgTable("chat_sessions", {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull().unique(),
    visitorName: text("visitor_name"),
    visitorEmail: text("visitor_email"),
    status: text("status").default("active").notNull(), // active | escalated | resolved
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export const chatMessages = pgTable("chat_messages", {
    id: serial("id").primaryKey(),
    sessionId: text("session_id").notNull(),
    role: text("role").notNull(), // user | assistant | staff
    content: text("content").notNull(),
    staffId: integer("staff_id"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
});
