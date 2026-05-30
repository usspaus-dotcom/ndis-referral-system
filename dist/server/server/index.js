import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { signToken, requireAuth, requireAdmin } from "./auth.js";
import * as db from "./db.js";
import { pool } from "./db.js";
import fs from "fs";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
}));
app.use(express.json({ limit: "2mb" }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use("/api/", limiter);
// ── Auth Routes ───────────────────────────────────────────────────────────────
app.post("/api/auth/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: "Email and password required" });
            return;
        }
        const user = await db.getUserByEmail(email.toLowerCase().trim());
        if (!user) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/auth/me", requireAuth, (req, res) => {
    res.json({ user: req.user });
});
// ── Leads Routes ──────────────────────────────────────────────────────────────
app.post("/api/leads", async (req, res) => {
    try {
        const body = req.body;
        const now = Date.now();
        // Auto-detect referral source from referer header
        const referer = req.headers.referer || req.headers.referrer || "";
        let referralSource = "Direct";
        if (referer.includes("facebook") || referer.includes("fb."))
            referralSource = "Facebook";
        else if (referer.includes("google"))
            referralSource = "Google";
        else if (referer.includes("instagram"))
            referralSource = "Instagram";
        else if (referer.includes("whatsapp"))
            referralSource = "WhatsApp";
        else if (referer.includes("linkedin"))
            referralSource = "LinkedIn";
        else if (referer && !referer.includes(req.headers.host || ""))
            referralSource = "Other";
        // IP Geolocation
        let ipCity, ipState, ipCountry, ipPostcode, ipLat, ipLng;
        try {
            const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
            if (ip && ip !== "127.0.0.1" && ip !== "::1") {
                const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
                if (geoRes.ok) {
                    const geo = await geoRes.json();
                    ipCity = geo.city;
                    ipState = geo.region;
                    ipCountry = geo.country_name;
                    ipPostcode = geo.postal;
                    ipLat = geo.latitude;
                    ipLng = geo.longitude;
                }
            }
        }
        catch { /* non-critical */ }
        const lead = await db.createLead({
            participantName: body.participantName,
            participantPhone: body.participantPhone,
            participantEmail: body.participantEmail,
            suburb: body.suburb,
            state: body.state,
            postcode: body.postcode,
            disabilityType: body.disabilityType,
            supportNeeds: body.supportNeeds,
            ndisStatus: body.ndisStatus,
            age: body.age ? Number(body.age) : undefined,
            citizenship: body.citizenship,
            referrerName: body.referrerName,
            referrerPhone: body.referrerPhone,
            referrerEmail: body.referrerEmail,
            referrerRelation: body.referrerRelation,
            referralSource,
            ipCity, ipState, ipCountry, ipPostcode, ipLat, ipLng,
            createdAt: now,
            updatedAt: now,
        });
        res.json({ success: true, lead });
    }
    catch (err) {
        console.error("Create lead error:", err);
        res.status(500).json({ error: "Failed to submit referral" });
    }
});
app.get("/api/leads", requireAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        const leads = await db.listLeads(status ? { status: status } : undefined);
        res.json({ leads });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/leads/:id", requireAdmin, async (req, res) => {
    try {
        const lead = await db.getLead(Number(req.params.id));
        if (!lead) {
            res.status(404).json({ error: "Not found" });
            return;
        }
        res.json({ lead });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.patch("/api/leads/:id/status", requireAdmin, async (req, res) => {
    try {
        const { status, notes } = req.body;
        const lead = await db.updateLeadStatus(Number(req.params.id), status, notes ? { notes } : undefined);
        res.json({ lead });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.patch("/api/leads/:id/care-plan", requireAdmin, async (req, res) => {
    try {
        const lead = await db.updateLeadCarePlan(Number(req.params.id), req.body.carePlan);
        res.json({ lead });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.patch("/api/leads/:id/gift-card", requireAdmin, async (req, res) => {
    try {
        const lead = await db.updateGiftCardSent(Number(req.params.id), req.body.sent);
        res.json({ lead });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/leads/summary/commission", requireAdmin, async (req, res) => {
    try {
        const summary = await db.getCommissionSummary();
        res.json({ summary });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// ── Analytics Routes ──────────────────────────────────────────────────────────
app.get("/api/analytics/overview", requireAdmin, async (req, res) => {
    try {
        const [funnel, summary] = await Promise.all([
            db.getConversionFunnel(),
            db.getCommissionSummary(),
        ]);
        res.json({ funnel, summary });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/analytics/suburbs", requireAdmin, async (req, res) => {
    try {
        const data = await db.getSuburbBreakdown();
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/analytics/states", requireAdmin, async (req, res) => {
    try {
        const data = await db.getStateSummary();
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/analytics/services", requireAdmin, async (req, res) => {
    try {
        const data = await db.getServiceDemand();
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/analytics/referrers", requireAdmin, async (req, res) => {
    try {
        const data = await db.getReferrerLeaderboard();
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/analytics/trend", requireAdmin, async (req, res) => {
    try {
        const days = Number(req.query.days) || 30;
        const data = await db.getDailyTrend(days);
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/analytics/sources", requireAdmin, async (req, res) => {
    try {
        const data = await db.getReferralSourceBreakdown();
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/analytics/locations", requireAdmin, async (req, res) => {
    try {
        const data = await db.getIpLocationBreakdown();
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/analytics/recent-leads", requireAdmin, async (req, res) => {
    try {
        const limit = Number(req.query.limit) || 20;
        const data = await db.getRecentLeads(limit);
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// ── AI Outreach Generator ─────────────────────────────────────────────────────
app.post("/api/ai/outreach", requireAdmin, async (req, res) => {
    try {
        const { leadId, type } = req.body;
        const lead = await db.getLead(Number(leadId));
        if (!lead) {
            res.status(404).json({ error: "Lead not found" });
            return;
        }
        if (!process.env.OPENAI_API_KEY) {
            // Fallback template without AI
            const msg = type === "sms"
                ? `Hi ${lead.referrerName || "there"}, thank you for referring ${lead.participantName} to Accurate Home Care! We'll be in touch shortly. Once enrolled, you'll receive your $200 gift card. Questions? Call 0420 686 964.`
                : `Dear ${lead.referrerName || "Valued Referrer"},\n\nThank you for referring ${lead.participantName} to Accurate Home Care.\n\nWe will contact them shortly to discuss their NDIS support needs. Once they are enrolled as a client, we will send you a $200 gift card as our way of saying thank you.\n\nIf you have any questions, please call us on 0420 686 964 or email accuratehomecare.cs@gmail.com.\n\nWarm regards,\nAccurate Home Care Team`;
            res.json({ message: msg });
            return;
        }
        const prompt = type === "sms"
            ? `Write a short, warm SMS (max 160 chars) from Accurate Home Care NDIS provider thanking ${lead.referrerName || "the referrer"} for referring ${lead.participantName}. Mention the $200 gift card reward on enrollment. Include phone 0420 686 964.`
            : `Write a professional, warm email from Accurate Home Care NDIS provider to ${lead.referrerName || "the referrer"} thanking them for referring ${lead.participantName} (${lead.disabilityType || "disability support needs"}). Mention the $200 gift card reward on enrollment. Include contact: 0420 686 964, accuratehomecare.cs@gmail.com.`;
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
            body: JSON.stringify({ model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }], max_tokens: 300 }),
        });
        const aiData = await aiRes.json();
        res.json({ message: aiData.choices?.[0]?.message?.content || "Failed to generate message" });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// ── Chat Routes ───────────────────────────────────────────────────────────────
app.post("/api/chat/message", async (req, res) => {
    try {
        const { sessionId, message } = req.body;
        if (!sessionId || !message) {
            res.status(400).json({ error: "Missing fields" });
            return;
        }
        await db.getOrCreateChatSession(sessionId);
        await db.addChatMessage({ sessionId, role: "user", content: message });
        // AI response if OpenAI key available
        let reply = "Thank you for your message! Our team will respond shortly. For urgent enquiries, please call 0420 686 964.";
        if (process.env.OPENAI_API_KEY) {
            try {
                const history = await db.getChatMessages(sessionId);
                const messages = [
                    { role: "system", content: "You are a helpful assistant for Accurate Home Care, a registered NDIS provider in Melbourne, Australia. Help answer questions about NDIS services, eligibility (age 7-65, Australian citizen/resident with disability), support categories, and the referral program ($200 gift card). Be warm, professional and concise. If asked about legal/medical advice or complex eligibility, say you'll connect them with a specialist." },
                    ...history.slice(-10).map(m => ({ role: m.role === "staff" ? "assistant" : m.role, content: m.content })),
                ];
                const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
                    body: JSON.stringify({ model: "gpt-4o-mini", messages, max_tokens: 200 }),
                });
                const aiData = await aiRes.json();
                reply = aiData.choices?.[0]?.message?.content || reply;
            }
            catch { /* use fallback */ }
        }
        await db.addChatMessage({ sessionId, role: "assistant", content: reply });
        res.json({ reply });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/chat/sessions", requireAdmin, async (req, res) => {
    try {
        const sessions = await db.listChatSessions();
        res.json({ sessions });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.get("/api/chat/sessions/:sessionId/messages", requireAdmin, async (req, res) => {
    try {
        const messages = await db.getChatMessages(req.params.sessionId);
        res.json({ messages });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.post("/api/chat/sessions/:sessionId/reply", requireAdmin, async (req, res) => {
    try {
        const { content } = req.body;
        const user = req.user;
        await db.addChatMessage({ sessionId: req.params.sessionId, role: "staff", content, staffId: user.userId });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
app.patch("/api/chat/sessions/:sessionId/status", requireAdmin, async (req, res) => {
    try {
        await db.updateChatSessionStatus(req.params.sessionId, req.body.status);
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});
// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// ── Serve React Frontend ──────────────────────────────────────────────────────
const clientDist = path.join(__dirname, "../../../client/dist");
app.use(express.static(clientDist));
app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
});
async function startServer() {
    // Auto-run migrations and seed admin on startup
    try {
        const migrationSQL = fs.readFileSync(path.join(__dirname, "../../../drizzle/0001_init.sql"), "utf8");
        const client = await pool.connect();
        try {
            // Run migration statements one by one
            const stmts = migrationSQL
                .split(";")
                .map((s) => s.trim())
                .filter((s) => s.length > 0 && !s.startsWith("--"));
            for (const stmt of stmts) {
                try {
                    await client.query(stmt);
                }
                catch (e) {
                    // Ignore "already exists" errors
                    if (!e.message?.includes("already exists"))
                        console.warn("Migration warn:", e.message);
                }
            }
            console.log("[startup] Migrations applied");
            // Seed admin user if not exists
            const existing = await client.query("SELECT id FROM users WHERE email = $1", ["accuratehomecare.cs@gmail.com"]);
            if (existing.rows.length === 0) {
                const bcrypt = await import("bcryptjs");
                const hash = await bcrypt.default.hash("Sanjaya7777777$", 12);
                await client.query("INSERT INTO users (email, password_hash, name, role, created_at) VALUES ($1, $2, $3, $4, $5)", ["accuratehomecare.cs@gmail.com", hash, "Sanjaya Admin", "admin", Date.now()]);
                console.log("[startup] Admin user seeded");
            }
            else {
                console.log("[startup] Admin user already exists");
            }
        }
        finally {
            client.release();
        }
    }
    catch (err) {
        console.error("[startup] Migration/seed error:", err);
    }
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
startServer();
export default app;
