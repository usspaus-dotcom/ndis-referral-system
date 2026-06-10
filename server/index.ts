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
    if (!email || !password) { res.status(400).json({ error: "Email and password required" }); return; }
    const user = await db.getUserByEmail(email.toLowerCase().trim());
    if (!user) { res.status(401).json({ error: "Invalid credentials" }); return; }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) { res.status(401).json({ error: "Invalid credentials" }); return; }
    const token = signToken({ userId: user.id, email: user.email, name: user.name, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  res.json({ user: (req as any).user });
});

// ── Leads Routes ──────────────────────────────────────────────────────────────
app.post("/api/leads", async (req, res) => {
  try {
    const body = req.body;
    const now = Date.now();

    // Auto-detect referral source from referer header
    const referer = req.headers.referer || req.headers.referrer || "";
    let referralSource = "Direct";
    if (referer.includes("facebook") || referer.includes("fb.")) referralSource = "Facebook";
    else if (referer.includes("google")) referralSource = "Google";
    else if (referer.includes("instagram")) referralSource = "Instagram";
    else if (referer.includes("whatsapp")) referralSource = "WhatsApp";
    else if (referer.includes("linkedin")) referralSource = "LinkedIn";
    else if (referer && !referer.includes(req.headers.host || "")) referralSource = "Other";

    // IP Geolocation
    let ipCity, ipState, ipCountry, ipPostcode, ipLat, ipLng;
    try {
      const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "";
      if (ip && ip !== "127.0.0.1" && ip !== "::1") {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        if (geoRes.ok) {
          const geo = await geoRes.json() as any;
          ipCity = geo.city;
          ipState = geo.region;
          ipCountry = geo.country_name;
          ipPostcode = geo.postal;
          ipLat = geo.latitude;
          ipLng = geo.longitude;
        }
      }
    } catch { /* non-critical */ }

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
  } catch (err) {
    console.error("Create lead error:", err);
    res.status(500).json({ error: "Failed to submit referral" });
  }
});

app.get("/api/leads", requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const leads = await db.listLeads(status ? { status: status as string } : undefined);
    res.json({ leads });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/leads/:id", requireAdmin, async (req, res) => {
  try {
    const lead = await db.getLead(Number(req.params.id));
    if (!lead) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/leads/:id/status", requireAdmin, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const lead = await db.updateLeadStatus(Number(req.params.id), status, notes ? { notes } : undefined);
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/leads/:id/care-plan", requireAdmin, async (req, res) => {
  try {
    const lead = await db.updateLeadCarePlan(Number(req.params.id), req.body.carePlan);
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/leads/:id/gift-card", requireAdmin, async (req, res) => {
  try {
    const lead = await db.updateGiftCardSent(Number(req.params.id), req.body.sent);
    res.json({ lead });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/leads/summary/commission", requireAdmin, async (req, res) => {
  try {
    const summary = await db.getCommissionSummary();
    res.json({ summary });
  } catch (err) {
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
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/suburbs", requireAdmin, async (req, res) => {
  try {
    const data = await db.getSuburbBreakdown();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/states", requireAdmin, async (req, res) => {
  try {
    const data = await db.getStateSummary();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/services", requireAdmin, async (req, res) => {
  try {
    const data = await db.getServiceDemand();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/referrers", requireAdmin, async (req, res) => {
  try {
    const data = await db.getReferrerLeaderboard();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/trend", requireAdmin, async (req, res) => {
  try {
    const days = Number(req.query.days) || 30;
    const data = await db.getDailyTrend(days);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/sources", requireAdmin, async (req, res) => {
  try {
    const data = await db.getReferralSourceBreakdown();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/locations", requireAdmin, async (req, res) => {
  try {
    const data = await db.getIpLocationBreakdown();
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/analytics/recent-leads", requireAdmin, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const data = await db.getRecentLeads(limit);
    res.json({ data });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── AI Outreach Generator ─────────────────────────────────────────────────────
app.post("/api/ai/outreach", requireAdmin, async (req, res) => {
  try {
    const { leadId, type } = req.body;
    const lead = await db.getLead(Number(leadId));
    if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }

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
    const aiData = await aiRes.json() as any;
    res.json({ message: aiData.choices?.[0]?.message?.content || "Failed to generate message" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Chat Routes ───────────────────────────────────────────────────────────────
app.post("/api/chat/message", async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) { res.status(400).json({ error: "Missing fields" }); return; }

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
        const aiData = await aiRes.json() as any;
        reply = aiData.choices?.[0]?.message?.content || reply;
      } catch { /* use fallback */ }
    }

    await db.addChatMessage({ sessionId, role: "assistant", content: reply });
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/chat/sessions", requireAdmin, async (req, res) => {
  try {
    const sessions = await db.listChatSessions();
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/chat/sessions/:sessionId/messages", requireAdmin, async (req, res) => {
  try {
    const messages = await db.getChatMessages(req.params.sessionId as string);
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/chat/sessions/:sessionId/reply", requireAdmin, async (req, res) => {
  try {
    const { content } = req.body;
    const user = (req as any).user;
    await db.addChatMessage({ sessionId: req.params.sessionId as string, role: "staff", content, staffId: user.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.patch("/api/chat/sessions/:sessionId/status", requireAdmin, async (req, res) => {
  try {
    await db.updateChatSessionStatus(req.params.sessionId as string, req.body.status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ── Settings ────────────────────────────────────────────────────────────────
app.get("/api/settings", requireAdmin, async (req, res) => {
  try {
    const rows = await pool.query("SELECT key, value FROM settings");
    const settings: Record<string, string> = {};
    for (const row of rows.rows) {
      settings[row.key] = row.value || "";
    }
    res.json({ settings });
  } catch (err) {
    console.error("Settings fetch error:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

app.put("/api/settings", requireAdmin, async (req, res) => {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        "INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, $3) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = $3",
        [key, value, Date.now()]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Settings update error:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// ── Daily Content Generator ────────────────────────────────────────────────
const POST_TYPES = [
  "NDIS News Update",
  "Disability Awareness Tip",
  "Referral Program Promo",
  "Service Highlight",
  "Motivational & Inspiring",
  "NDIS Funding Tip",
  "Community Support Story",
];

// Fetch latest NDIS news headlines from Google News RSS
async function fetchNDISNews(): Promise<string[]> {
  try {
    const res = await fetch(
      "https://news.google.com/rss/search?q=NDIS+Australia&hl=en-AU&gl=AU&ceid=AU:en",
      { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(8000) }
    );
    const xml = await res.text();
    const titles: string[] = [];
    const titleRegex = /<item>[\s\S]*?<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<item>[\s\S]*?<title>([^<]+)<\/title>/g;
    let match;
    while ((match = titleRegex.exec(xml)) !== null && titles.length < 8) {
      const t = (match[1] || match[2] || "").trim();
      if (t && !t.includes("Google News")) titles.push(t);
    }
    // Fallback: simple split approach
    if (titles.length === 0) {
      const parts = xml.split("<item>");
      for (let i = 1; i < parts.length && titles.length < 8; i++) {
        const m = parts[i].match(/<title>(?:<!\[CDATA\[)?([^\]<]+)(?:\]\]>)?<\/title>/);
        if (m && m[1] && !m[1].includes("Google")) titles.push(m[1].trim());
      }
    }
    return titles;
  } catch (e) {
    return [];
  }
}

app.get("/api/content/history", requireAdmin, async (req, res) => {
  try {
    const rows = await pool.query(
      "SELECT * FROM daily_content ORDER BY created_at DESC LIMIT 14"
    );
    res.json({ posts: rows.rows });
  } catch (err) {
    console.error("Content history error:", err);
    res.status(500).json({ error: "Failed to fetch content history" });
  }
});

app.post("/api/content/generate", requireAdmin, async (req, res) => {
  try {
    const { postType } = req.body;
    const type = postType || POST_TYPES[new Date().getDay() % POST_TYPES.length];

    // Fetch live NDIS news headlines
    const newsHeadlines = await fetchNDISNews();
    const newsContext = newsHeadlines.length > 0
      ? `Current NDIS news headlines (use these as inspiration):\n${newsHeadlines.slice(0, 5).map((h, i) => `${i + 1}. ${h}`).join("\n")}`
      : "";

    const baseInstructions = `You are a social media expert for Accurate Home Care, an NDIS provider in Melbourne, VIC, Australia.
Phone: 0420 686 964 | Website: ndis-referral-system.onrender.com
${newsContext}

Generate a Facebook Reel post for post type: "${type}"

Return ONLY a JSON object with exactly these 4 fields (no markdown, no code blocks):
{
  "hook": "1-2 punchy lines that stop the scroll. Use an emoji. Make it bold and attention-grabbing.",
  "main_text": "3-4 lines of the core message. Engaging, warm, informative. Reference current NDIS news if relevant.",
  "description_hashtags": "2-3 lines of description followed by a blank line then 8-10 relevant hashtags. Include #NDIS #AccurateHomeCare #Melbourne #DisabilitySupport",
  "first_comment": "A ready-to-paste first comment with 5-6 additional hashtags and a short CTA like 'Drop a ❤️ if this helped you!' or 'Tag someone who needs to see this!'"
}`;

    let hook = "", mainText = "", descHashtags = "", firstComment = "";

    if (process.env.OPENAI_API_KEY) {
      try {
        const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: baseInstructions }],
            max_tokens: 600,
            response_format: { type: "json_object" }
          }),
        });
        const aiData = await aiRes.json() as any;
        const parsed = JSON.parse(aiData.choices?.[0]?.message?.content || "{}");
        hook = parsed.hook || "";
        mainText = parsed.main_text || "";
        descHashtags = parsed.description_hashtags || "";
        firstComment = parsed.first_comment || "";
      } catch (e) { /* fall through to fallback */ }
    }

    // Fallback structured content when no AI key or AI fails
    if (!hook) {
      const newsLine = newsHeadlines.length > 0 ? newsHeadlines[0].replace(/ - [^-]+$/, "") : "";
      const fallbacks: Record<string, { hook: string; main_text: string; description_hashtags: string; first_comment: string }> = {
        "NDIS News Update": {
          hook: `📢 NDIS UPDATE YOU NEED TO KNOW ABOUT!\n${newsLine ? `"${newsLine}"` : "Big changes are coming to the NDIS in 2026!"}`,
          main_text: `The NDIS is constantly evolving to better support Australians with disability.\n\nAt Accurate Home Care, we stay across every update so your plan works harder for you.\n\nNot sure how the latest changes affect you? Our team is here to help — no jargon, just clear answers.\n\n📞 Call us: 0420 686 964`,
          description_hashtags: `Stay informed about the latest NDIS changes with Accurate Home Care — Melbourne's trusted NDIS provider.\n\n#NDIS #NDISAustralia #AccurateHomeCare #Melbourne #DisabilitySupport #NDISProvider #NDISNews #DisabilityCare #SupportWorker #NDISParticipant`,
          first_comment: `💬 Have questions about the latest NDIS changes? Drop them below and we'll answer!\n\n#NDISHelp #NDISMelbourne #DisabilityAdvocacy #NDISFunding #AccurateHomeCare`,
        },
        "Referral Program Promo": {
          hook: `🎁 EARN $200 JUST FOR HELPING SOMEONE!\nKnow someone who needs NDIS support? We'll reward you for it.`,
          main_text: `Refer a friend, family member, or client to Accurate Home Care and receive a $200 gift card when they enrol as an NDIS participant!\n\n✅ Simple referral process\n✅ We handle everything\n✅ $200 gift card guaranteed on enrolment\n\n📞 Call: 0420 686 964`,
          description_hashtags: `Accurate Home Care's referral program rewards you for connecting people with the NDIS support they deserve. Melbourne-based, Australia-wide support.\n\n#NDISReferral #GiftCard #NDIS #AccurateHomeCare #Melbourne #DisabilitySupport #NDISProvider #EarnRewards #ReferAFriend #NDISAustralia`,
          first_comment: `Tag someone who might benefit from NDIS support! You could earn $200 🎁\n\n#NDISMelbourne #NDISHelp #DisabilityCommunity #AccurateHomeCare #NDISFunding`,
        },
        "Disability Awareness Tip": {
          hook: `💡 NDIS TIP MOST PEOPLE DON'T KNOW!\nYour NDIS funding covers WAY more than you think.`,
          main_text: `Did you know NDIS participants can use funding for community participation, social activities, and building independence — not just personal care?\n\nMany families miss out on thousands in funding simply because they don't know what's available.\n\nAt Accurate Home Care, we help you understand and maximise every dollar of your NDIS plan.\n\n📞 Call: 0420 686 964`,
          description_hashtags: `Helping NDIS participants and families in Melbourne understand their rights and maximise their funding.\n\n#NDIS #DisabilityAwareness #NDISTips #AccurateHomeCare #Melbourne #NDISSupport #DisabilityCare #InclusionMatters #NDISFunding #DisabilityRights`,
          first_comment: `Drop a ❤️ if this helped you! Share with someone who needs to know this.\n\n#NDISAustralia #NDISParticipant #DisabilityAdvocacy #AccurateHomeCare #NDISMelbourne`,
        },
      };
      const fb = fallbacks[type] || fallbacks["NDIS News Update"];
      hook = fb.hook; mainText = fb.main_text; descHashtags = fb.description_hashtags; firstComment = fb.first_comment;
    }

    const content = JSON.stringify({ hook, main_text: mainText, description_hashtags: descHashtags, first_comment: firstComment });

    // Save to database
    await pool.query(
      "INSERT INTO daily_content (post_type, content, created_at) VALUES ($1, $2, $3)",
      [type, content, Date.now()]
    );

    res.json({
      post: {
        post_type: type,
        hook,
        main_text: mainText,
        description_hashtags: descHashtags,
        first_comment: firstComment,
        news_headlines: newsHeadlines.slice(0, 3),
        created_at: Date.now()
      }
    });
  } catch (err) {
    console.error("Content generate error:", err);
    res.status(500).json({ error: "Failed to generate content" });
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
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, "../../../drizzle/0001_init.sql"),
      "utf8"
    );
    const client = await pool.connect();
    try {
      // Run entire migration SQL as one query (supports DO $$ blocks)
      try {
        await client.query(migrationSQL);
      } catch (e: any) {
        // If full run fails, try statement by statement (skip DO blocks)
        console.warn("[startup] Full migration failed, trying per-statement:", e.message);
        const stmts = migrationSQL
          .split(/;(?![^$]*\$\$)/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 0 && !s.startsWith("--"));
        for (const stmt of stmts) {
          try { await client.query(stmt); } catch (e2: any) {
            if (!e2.message?.includes("already exists") && !e2.message?.includes("duplicate")) {
              console.warn("Migration warn:", e2.message);
            }
          }
        }
      }
      console.log("[startup] Migrations applied");

      // Seed admin user if not exists
      const existing = await client.query("SELECT id FROM users WHERE email = $1", ["accuratehomecare.cs@gmail.com"]);
      if (existing.rows.length === 0) {
        const bcrypt = await import("bcryptjs");
        const hash = await bcrypt.default.hash("Sanjaya7777777$", 12);
        await client.query(
          "INSERT INTO users (email, password_hash, name, role, created_at) VALUES ($1, $2, $3, $4, $5)",
          ["accuratehomecare.cs@gmail.com", hash, "Sanjaya Admin", "admin", Date.now()]
        );
        console.log("[startup] Admin user seeded");
      } else {
        console.log("[startup] Admin user already exists");
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("[startup] Migration/seed error:", err);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

export default app;
