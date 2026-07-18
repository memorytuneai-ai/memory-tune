require("dotenv").config();

const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Stripe = require("stripe");

const app = express();
const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_TEMPERATURE = Number(process.env.GEMINI_TEMPERATURE || 0.82);
const KIE_SUNO_API_KEY = process.env.KIE_SUNO_API_KEY || process.env.KIE_API_KEY || "";
const KIE_SUNO_MODEL = process.env.KIE_SUNO_MODEL || "V4_5";
const KIE_SUNO_CALLBACK_URL = process.env.KIE_SUNO_CALLBACK_URL || "";
const KIE_SUNO_NEGATIVE_TAGS = process.env.KIE_SUNO_NEGATIVE_TAGS || "";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET || "";
const PAYPAL_ENV = String(process.env.PAYPAL_ENV || "sandbox").toLowerCase() === "live" ? "live" : "sandbox";
const LEGACY_PAYPAL_PRICE_GBP = Number(process.env.PAYPAL_PRICE_GBP || (isPromo ? 9.90 : 14.99));
const LEGACY_PAYPAL_CURRENCY = process.env.PAYPAL_CURRENCY || "GBP";
const LEGACY_PAYPAL_TITLE = process.env.PAYPAL_TITLE || "Memory Tune personalised song";
const CHECKOUT_TITLE = process.env.CHECKOUT_TITLE || process.env.STRIPE_TITLE || LEGACY_PAYPAL_TITLE;
const PROMO_END = new Date("2026-07-20T02:59:59Z").getTime();
const isPromo = Date.now() < PROMO_END;
const CHECKOUT_PRICE_GBP = Number(process.env.STRIPE_PRICE_GBP || (isPromo ? 9.90 : 14.99));
const STRIPE_CURRENCY = String(process.env.STRIPE_CURRENCY || "gbp").toLowerCase();
const PAYPAL_PRICE_GBP = LEGACY_PAYPAL_PRICE_GBP;
const PAYPAL_CURRENCY = LEGACY_PAYPAL_CURRENCY;
const PAYPAL_TITLE = LEGACY_PAYPAL_TITLE;
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "";
const RESEND_REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || "";
const GOOGLE_SHEETS_WEBHOOK_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL || "";
const GOOGLE_SHEETS_WEBHOOK_SECRET = process.env.GOOGLE_SHEETS_WEBHOOK_SECRET || "";
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : __dirname;
const paidSessions = new Map();
const tempMusicSessions = new Map();
const paidMusicSessions = new Map();
const previewCreditWallets = new Map();
const orderReports = new Map();
const TEMP_MUSIC_LIBRARY_FILE = path.join(DATA_DIR, ".tmp-music-library.json");
const PAID_MUSIC_LIBRARY_FILE = path.join(DATA_DIR, ".paid-music-library.json");
const PREVIEW_CREDIT_WALLETS_FILE = path.join(DATA_DIR, ".preview-credit-wallets.json");
const ORDER_REPORT_FILE = path.join(DATA_DIR, ".music-orders-report.json");
const TEMP_MUSIC_TTL_MS = 24 * 60 * 60 * 1000;
const PAID_MUSIC_TTL_MS = 15 * 24 * 60 * 60 * 1000;
const INITIAL_PREVIEW_CREDITS = Number(process.env.INITIAL_PREVIEW_CREDITS || 3);
const PURCHASE_REWARD_CREDITS = Number(process.env.PURCHASE_REWARD_CREDITS || 2);
let stripeClient = null;
const WHITELISTED_PREVIEW_PHONES = new Set(
    String(process.env.PREVIEW_WHITELIST_PHONES || "")
        .split(",")
        .map((phone) => phone.replace(/\D/g, ""))
        .filter(Boolean)
);

try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
} catch (error) {
    console.error("Erro ao preparar pasta de dados persistentes", error);
}

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "fazer-minha-musica.html"));
});

app.get("/my-songs", (req, res) => {
    res.sendFile(path.join(__dirname, "minhas-musicas.html"));
});

app.get("/create-song", (req, res) => {
    res.redirect(301, "/");
});

app.get("/terms", (req, res) => {
    res.sendFile(path.join(__dirname, "terms-and-conditions.html"));
});

app.get("/privacy", (req, res) => {
    res.sendFile(path.join(__dirname, "privacy-policy.html"));
});

app.get("/delivery-and-support", (req, res) => {
    res.sendFile(path.join(__dirname, "delivery-and-support.html"));
});

app.get("/cookies", (req, res) => {
    res.sendFile(path.join(__dirname, "cookie-policy.html"));
});

app.get("/fazer-minha-musica.html", (req, res) => {
    res.redirect(301, "/");
});

app.get("/minhas-musicas.html", (req, res) => {
    res.redirect(301, "/my-songs");
});

app.get("/terms-and-conditions.html", (req, res) => {
    res.redirect(301, "/terms");
});

app.get("/privacy-policy.html", (req, res) => {
    res.redirect(301, "/privacy");
});

app.get("/cookie-policy.html", (req, res) => {
    res.redirect(301, "/cookies");
});

app.get("/delivery-and-support.html", (req, res) => {
    res.redirect(301, "/delivery-and-support");
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
});

app.get("/api/payment/config", (req, res) => {
    res.json({
        provider: "stripe",
        amount: CHECKOUT_PRICE_GBP,
        currency: STRIPE_CURRENCY,
        title: CHECKOUT_TITLE,
        stripe: {
            enabled: Boolean(STRIPE_SECRET_KEY),
            publishable_key: STRIPE_PUBLISHABLE_KEY || null,
            amount: CHECKOUT_PRICE_GBP,
            currency: STRIPE_CURRENCY,
            title: CHECKOUT_TITLE,
        },
    });
});

function getStripeClient() {
    if (!STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY not configured.");
    }
    if (!stripeClient) {
        stripeClient = new Stripe(STRIPE_SECRET_KEY);
    }
    return stripeClient;
}

async function applyStripeCheckoutSuccess(sessionId, checkoutSession, req) {
    if (!sessionId || !checkoutSession) return null;

    const existingSession = getTempMusicSession(sessionId) || getPaidMusicSession(sessionId) || {};
    upsertTempMusicSession(sessionId, {
        customerKey: existingSession.customerKey || checkoutSession.metadata?.customer_key || "",
        clientName: existingSession.clientName || checkoutSession.metadata?.client_name || "",
        customerPhone: normalizeWhatsAppNumber(
            existingSession.customerPhone ||
            checkoutSession.metadata?.customer_phone ||
            ""
        ),
        customerEmail: normalizeEmailAddress(
            checkoutSession.customer_details?.email ||
            checkoutSession.customer_email ||
            existingSession.customerEmail ||
            ""
        ),
        title: existingSession.title || CHECKOUT_TITLE,
        subtitle: "Card checkout started to unlock song production.",
        badge: "Card checkout started",
        stripeCheckoutSessionId: checkoutSession.id,
        stripeCheckoutStatus: checkoutSession.status || null,
        stripePaymentStatus: checkoutSession.payment_status || null,
    });

    if (checkoutSession.payment_status === "paid") {
        const paymentIntentId =
            typeof checkoutSession.payment_intent === "string"
                ? checkoutSession.payment_intent
                : checkoutSession.payment_intent?.id || checkoutSession.id;
        markPaid(sessionId, { paymentId: paymentIntentId, status: "STRIPE_PAID" });
    }

    const latest = getPaidMusicSession(sessionId) || getTempMusicSession(sessionId);
    if (latest?.paid) {
        const baseUrl = getBaseUrl(req);
        setTimeout(() => {
            sendMusicReadyEmailIfEligible(sessionId, baseUrl).catch((error) => {
                console.error("Error sending automatic music-ready email after Stripe event", error);
            });
        }, 0);
    }

    return latest;
}

app.post("/api/payment/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
        return res.status(400).send("Stripe webhook is not configured.");
    }

    const signature = req.headers["stripe-signature"];
    if (!signature) {
        return res.status(400).send("Missing Stripe signature.");
    }

    let event;
    try {
        const stripe = getStripeClient();
        event = stripe.webhooks.constructEvent(req.body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (error) {
        console.error("Stripe webhook signature verification failed", error);
        return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
        if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
            const checkoutSession = event.data.object;
            const sessionId = String(checkoutSession.metadata?.session_id || "").trim();
            await applyStripeCheckoutSuccess(sessionId, checkoutSession, req);
        }
        return res.json({ received: true });
    } catch (error) {
        console.error("Stripe webhook processing failed", error);
        return res.status(500).send("Webhook processing failed.");
    }
});

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));
app.set("trust proxy", true);

function getPayPalBaseUrl() {
    return PAYPAL_ENV === "live"
        ? "https://api-m.paypal.com"
        : "https://api-m.sandbox.paypal.com";
}

async function getPayPalAccessToken() {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error("PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET not configured.");
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
    });

    const data = await response.json();
    if (!response.ok || !data?.access_token) {
        throw new Error(data?.error_description || data?.error || "Could not authenticate with PayPal.");
    }

    return data.access_token;
}

const GEMINI_FALLBACK_MODELS = ["gemini-1.5-flash"];
const GEMINI_RETRY_DELAYS = [1500, 3000, 6000];

const LYRICS_SYSTEM_INSTRUCTION = `You are a professional songwriter specialised in deeply emotional, commercially strong, and human-sounding personalised songs.

Your task is to transform the customer's answers into an original, natural, moving lyric that feels like a real professionally written song.

Core rules:
1. Always write in the same primary language used by the customer in the questionnaire answers.
2. Never translate the story into a different language.
3. If the answers are mostly in English, write fully in English. If mostly in Portuguese, write fully in Portuguese. If mostly in Spanish, write fully in Spanish.
4. The lyric must sound intimate, human, true, personal, and emotionally cinematic.
5. Avoid robotic wording, generic AI-sounding phrases, empty clichés, and forced rhymes.
6. Use concrete details from the customer's story: places, gestures, objects, memories, images, scents, sounds, promises, and emotional specifics.
7. Adapt the writing to the requested music style and emotional tone.
8. The chorus must be the most memorable and emotionally powerful part of the song.
9. Never invent facts the customer did not mention.
10. Return only the final lyric in organised song sections such as [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Final Chorus], and [Outro].

Do not include explanations, notes, AI labels, prompt instructions, or any text outside the lyric itself.`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadTempMusicSessions() {
    try {
        if (!fs.existsSync(TEMP_MUSIC_LIBRARY_FILE)) return;
        const raw = fs.readFileSync(TEMP_MUSIC_LIBRARY_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        parsed.forEach((entry) => {
            if (!entry?.sessionId || !entry?.expiresAt) return;
            if (new Date(entry.expiresAt).getTime() <= Date.now()) return;
            tempMusicSessions.set(entry.sessionId, entry);
        });
    } catch (error) {
        console.error("Erro ao carregar biblioteca temporaria de musicas", error);
    }
}

function loadPaidMusicSessions() {
    try {
        if (!fs.existsSync(PAID_MUSIC_LIBRARY_FILE)) return;
        const raw = fs.readFileSync(PAID_MUSIC_LIBRARY_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        parsed.forEach((entry) => {
            if (!entry?.sessionId) return;
            if (new Date(entry.expiresAt || 0).getTime() <= Date.now()) return;
            paidMusicSessions.set(entry.sessionId, entry);
            if (entry?.paid) {
                paidSessions.set(entry.sessionId, {
                    paid: true,
                    at: entry.paidAt || entry.updatedAt || entry.createdAt || new Date().toISOString(),
                    paymentId: entry.paymentId || null,
                    status: entry.status || "approved",
                    paidGenerationUsed: Boolean(entry.paidGenerationUsed || (entry.downloadUrl1 && entry.downloadUrl2)),
                });
            }
        });
    } catch (error) {
        console.error("Erro ao carregar biblioteca permanente de musicas pagas", error);
    }
}

function persistTempMusicSessions() {
    try {
        const payload = JSON.stringify(Array.from(tempMusicSessions.values()), null, 2);
        fs.writeFileSync(TEMP_MUSIC_LIBRARY_FILE, payload, "utf8");
    } catch (error) {
        console.error("Erro ao salvar biblioteca temporaria de musicas", error);
    }
}

function persistPaidMusicSessions() {
    try {
        const payload = JSON.stringify(Array.from(paidMusicSessions.values()), null, 2);
        fs.writeFileSync(PAID_MUSIC_LIBRARY_FILE, payload, "utf8");
    } catch (error) {
        console.error("Erro ao salvar biblioteca permanente de musicas pagas", error);
    }
}

function loadPreviewCreditWallets() {
    try {
        if (!fs.existsSync(PREVIEW_CREDIT_WALLETS_FILE)) return;
        const raw = fs.readFileSync(PREVIEW_CREDIT_WALLETS_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        parsed.forEach((entry) => {
            if (!entry?.phone) return;
            previewCreditWallets.set(entry.phone, {
                phone: entry.phone,
                credits: Number(entry.credits || 0),
                usedFreePreviews: Number(entry.usedFreePreviews || 0),
                paidPurchases: Number(entry.paidPurchases || 0),
                lastGeneratedAt: entry.lastGeneratedAt || null,
                createdAt: entry.createdAt || new Date().toISOString(),
                updatedAt: entry.updatedAt || new Date().toISOString(),
            });
        });
    } catch (error) {
        console.error("Erro ao carregar creditos de previas", error);
    }
}

function persistPreviewCreditWallets() {
    try {
        const payload = JSON.stringify(Array.from(previewCreditWallets.values()), null, 2);
        fs.writeFileSync(PREVIEW_CREDIT_WALLETS_FILE, payload, "utf8");
    } catch (error) {
        console.error("Erro ao salvar creditos de previas", error);
    }
}

function loadOrderReports() {
    try {
        if (!fs.existsSync(ORDER_REPORT_FILE)) return;
        const raw = fs.readFileSync(ORDER_REPORT_FILE, "utf8");
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return;

        parsed.forEach((entry) => {
            if (!entry?.sessionId) return;
            orderReports.set(entry.sessionId, entry);
        });
    } catch (error) {
        console.error("Erro ao carregar planilha de pedidos", error);
    }
}

function persistOrderReports() {
    try {
        const payload = JSON.stringify(Array.from(orderReports.values()), null, 2);
        fs.writeFileSync(ORDER_REPORT_FILE, payload, "utf8");
    } catch (error) {
        console.error("Erro ao salvar planilha de pedidos", error);
    }
}

function getOrderAmountBrl(existing = {}, payload = {}) {
    const amount = Number(payload.amountBrl ?? existing.amountBrl ?? CHECKOUT_PRICE_GBP ?? (isPromo ? 9.90 : 14.99));
    return Number.isFinite(amount) && amount > 0 ? amount : (isPromo ? 9.90 : 14.99);
}

function normalizeTrafficSource(source = {}) {
    return {
        utmSource: source.utm_source || source.utmSource || "",
        utmMedium: source.utm_medium || source.utmMedium || "",
        utmCampaign: source.utm_campaign || source.utmCampaign || "",
        utmContent: source.utm_content || source.utmContent || "",
        utmTerm: source.utm_term || source.utmTerm || "",
        gclid: source.gclid || "",
        fbclid: source.fbclid || "",
        landingPage: source.landing_page || source.landingPage || "",
        capturedAt: source.captured_at || source.capturedAt || "",
    };
}

function upsertOrderReport(sessionId, payload = {}, options = {}) {
    if (!sessionId) return null;
    const nowIso = new Date().toISOString();
    const existing = orderReports.get(sessionId) || {};
    const isPaid = Boolean(payload.paid ?? existing.paid);
    const existingTraffic = normalizeTrafficSource(existing.trafficSource || {});
    const payloadTraffic = normalizeTrafficSource(payload.trafficSource || payload.traffic_source || {});
    const next = {
        ...existing,
        sessionId,
        customerKey: payload.customerKey ?? existing.customerKey ?? "",
        clientName: payload.clientName ?? existing.clientName ?? "",
        customerPhone: payload.customerPhone ?? existing.customerPhone ?? "",
        customerEmail: payload.customerEmail ?? existing.customerEmail ?? "",
        occasion: payload.occasion ?? existing.occasion ?? "",
        style: payload.style ?? existing.style ?? "",
        voiceGender: normalizeVoiceGender(payload.voiceGender ?? existing.voiceGender) || "female",
        title: payload.title ?? existing.title ?? "",
        paid: isPaid,
        orderStatus: isPaid ? "pago" : "pendente",
        amountBrl: getOrderAmountBrl(existing, payload),
        paymentId: payload.paymentId ?? existing.paymentId ?? null,
        paymentStatus: payload.status ?? payload.paymentStatus ?? existing.paymentStatus ?? (isPaid ? "approved" : "pending"),
        downloadUrl1: payload.downloadUrl1 ?? existing.downloadUrl1 ?? "",
        downloadUrl2: payload.downloadUrl2 ?? existing.downloadUrl2 ?? "",
        createdAt: existing.createdAt || payload.createdAt || nowIso,
        updatedAt: nowIso,
        paidAt: payload.paidAt ?? existing.paidAt ?? null,
        expiresAt: payload.expiresAt ?? existing.expiresAt ?? null,
        trafficSource: {
            utmSource: payloadTraffic.utmSource || existingTraffic.utmSource,
            utmMedium: payloadTraffic.utmMedium || existingTraffic.utmMedium,
            utmCampaign: payloadTraffic.utmCampaign || existingTraffic.utmCampaign,
            utmContent: payloadTraffic.utmContent || existingTraffic.utmContent,
            utmTerm: payloadTraffic.utmTerm || existingTraffic.utmTerm,
            gclid: payloadTraffic.gclid || existingTraffic.gclid,
            fbclid: payloadTraffic.fbclid || existingTraffic.fbclid,
            landingPage: payloadTraffic.landingPage || existingTraffic.landingPage,
            capturedAt: payloadTraffic.capturedAt || existingTraffic.capturedAt,
        },
    };

    orderReports.set(sessionId, next);
    persistOrderReports();
    if (!options.skipSync) {
        syncOrderReportToGoogleSheets(next);
    }
    return next;
}

function upsertOrderReportFromSession(session = {}, options = {}) {
    if (!session?.sessionId) return null;
    return upsertOrderReport(session.sessionId, {
        customerKey: session.customerKey || "",
        clientName: session.clientName || "",
        customerPhone: session.customerPhone || "",
        customerEmail: session.customerEmail || "",
        occasion: session.occasion || "",
        style: session.style || "",
        voiceGender: normalizeVoiceGender(session.voiceGender) || "female",
        title: session.title || "",
        paid: Boolean(session.paid),
        paymentId: session.paymentId || null,
        paymentStatus: session.status || null,
        status: session.status || null,
        downloadUrl1: session.downloadUrl1 || "",
        downloadUrl2: session.downloadUrl2 || "",
        createdAt: session.createdAt,
        paidAt: session.paidAt || null,
        expiresAt: session.expiresAt || null,
        trafficSource: session.trafficSource || null,
    }, options);
}

function syncOrderReportsFromSessions(options = {}) {
    tempMusicSessions.forEach((session) => upsertOrderReportFromSession(session, options));
    paidMusicSessions.forEach((session) => upsertOrderReportFromSession(session, options));
}

function normalizeWhatsAppNumber(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits.slice(0, 15);
}

function isValidWhatsAppNumber(phone) {
    return /^\d{10,15}$/.test(phone);
}

function normalizeEmailAddress(email) {
    return String(email || "").trim().toLowerCase();
}

function isValidEmailAddress(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmailAddress(email));
}

function isPreviewTestMode(req) {
    return req.query.test === "true" || req.body?.test_mode === true || req.body?.test_mode === "true";
}

function isPreviewPhoneWhitelisted(phone) {
    return WHITELISTED_PREVIEW_PHONES.has(phone) || WHITELISTED_PREVIEW_PHONES.has(`55${phone}`);
}

function getPreviewCreditWallet(phone) {
    const nowIso = new Date().toISOString();
    const existing = previewCreditWallets.get(phone);
    if (existing) return existing;

    const wallet = {
        phone,
        credits: INITIAL_PREVIEW_CREDITS,
        usedFreePreviews: 0,
        paidPurchases: 0,
        lastGeneratedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
    };
    previewCreditWallets.set(phone, wallet);
    persistPreviewCreditWallets();
    return wallet;
}

function consumePreviewCredit(phone) {
    const wallet = getPreviewCreditWallet(phone);
    if (wallet.credits <= 0) {
        return { ok: false, credits: 0 };
    }

    wallet.credits -= 1;
    wallet.usedFreePreviews += 1;
    wallet.lastGeneratedAt = new Date().toISOString();
    wallet.updatedAt = wallet.lastGeneratedAt;
    previewCreditWallets.set(phone, wallet);
    persistPreviewCreditWallets();
    return { ok: true, credits: wallet.credits };
}

function refundPreviewCredit(phone) {
    if (!phone) return;
    const wallet = getPreviewCreditWallet(phone);
    wallet.credits += 1;
    wallet.updatedAt = new Date().toISOString();
    previewCreditWallets.set(phone, wallet);
    persistPreviewCreditWallets();
}

function rewardPreviewCredit(phone) {
    if (!phone || PURCHASE_REWARD_CREDITS <= 0) return null;
    const wallet = getPreviewCreditWallet(phone);
    wallet.credits += PURCHASE_REWARD_CREDITS;
    wallet.paidPurchases += 1;
    wallet.updatedAt = new Date().toISOString();
    previewCreditWallets.set(phone, wallet);
    persistPreviewCreditWallets();
    return wallet;
}

function pruneExpiredPaidMusicSessions() {
    let changed = false;
    for (const [sessionId, session] of paidMusicSessions.entries()) {
        if (!session?.expiresAt || new Date(session.expiresAt).getTime() > Date.now()) continue;
        paidMusicSessions.delete(sessionId);
        paidSessions.delete(sessionId);
        changed = true;
    }
    if (changed) {
        persistPaidMusicSessions();
    }
}

function pruneExpiredTempMusicSessions() {
    let changed = false;
    for (const [sessionId, session] of tempMusicSessions.entries()) {
        if (!session?.expiresAt || new Date(session.expiresAt).getTime() > Date.now()) continue;
        tempMusicSessions.delete(sessionId);
        changed = true;
    }
    if (changed) {
        persistTempMusicSessions();
    }
}

function upsertTempMusicSession(sessionId, payload = {}) {
    if (!sessionId) return null;

    const existing = tempMusicSessions.get(sessionId) || {};
    const createdAt = existing.createdAt || new Date().toISOString();
    const nextSession = {
        ...existing,
        ...payload,
        sessionId,
        createdAt,
        updatedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + TEMP_MUSIC_TTL_MS).toISOString(),
        paid: payload.paid ?? existing.paid ?? false,
    };

    tempMusicSessions.set(sessionId, nextSession);
    persistTempMusicSessions();
    upsertOrderReportFromSession(nextSession);
    return nextSession;
}

function getTempMusicSession(sessionId) {
    if (!sessionId) return null;
    pruneExpiredTempMusicSessions();
    return tempMusicSessions.get(sessionId) || null;
}

function upsertPaidMusicSession(sessionId, payload = {}) {
    if (!sessionId) return null;

    const tempSession = tempMusicSessions.get(sessionId) || {};
    const existing = paidMusicSessions.get(sessionId) || {};
    const createdAt = existing.createdAt || tempSession.createdAt || new Date().toISOString();
    const paidAt = payload.paidAt || existing.paidAt || tempSession.paidAt || new Date().toISOString();
    const nextSession = {
        ...tempSession,
        ...existing,
        ...payload,
        sessionId,
        createdAt,
        updatedAt: new Date().toISOString(),
        paid: true,
        paidAt,
        expiresAt: new Date(Date.now() + PAID_MUSIC_TTL_MS).toISOString(),
    };

    paidMusicSessions.set(sessionId, nextSession);
    persistPaidMusicSessions();
    upsertOrderReportFromSession(nextSession);
    return nextSession;
}

function markPaidGenerationUsed(sessionId) {
    if (!sessionId) return;
    const paidSession = paidSessions.get(sessionId);
    if (paidSession) {
        paidSessions.set(sessionId, {
            ...paidSession,
            paidGenerationUsed: true,
        });
    }

    const tempSession = tempMusicSessions.get(sessionId);
    if (tempSession) {
        tempMusicSessions.set(sessionId, {
            ...tempSession,
            paidGenerationUsed: true,
            updatedAt: new Date().toISOString(),
        });
        persistTempMusicSessions();
    }

    const permanentSession = paidMusicSessions.get(sessionId);
    if (permanentSession) {
        paidMusicSessions.set(sessionId, {
            ...permanentSession,
            paidGenerationUsed: true,
            updatedAt: new Date().toISOString(),
        });
        persistPaidMusicSessions();
    }
}

function getPaidMusicSession(sessionId) {
    if (!sessionId) return null;
    pruneExpiredPaidMusicSessions();
    return paidMusicSessions.get(sessionId) || null;
}

function serializeMusicSession(session, sessionId) {
    if (!session) return null;
    const resolvedSessionId = sessionId || session.sessionId;
    const isPaid = Boolean(session.paid || paidSessions.get(resolvedSessionId)?.paid);
    const audioUrl1 = session.downloadUrl1 || "";
    const audioUrl2 = session.downloadUrl2 || "";
    const previewLocked = !isPaid && Boolean(session.previewLocked);
    return {
        session_id: resolvedSessionId,
        customer_key: session.customerKey || "",
        client_name: session.clientName || "",
        customer_phone: session.customerPhone || "",
        customer_email: session.customerEmail || "",
        occasion: session.occasion || "",
        style: session.style || "",
        voice_gender: normalizeVoiceGender(session.voiceGender) || "female",
        lyrics: session.lyrics || "",
        title: session.title || "Your song is ready",
        subtitle: session.subtitle || "We found your saved session.",
        badge: session.badge || "Song ready",
        preview_url_1: audioUrl1,
        preview_url_2: audioUrl2,
        download_url_1: isPaid ? audioUrl1 : "",
        download_url_2: isPaid ? audioUrl2 : "",
        preview_locked: previewLocked,
        paid: isPaid,
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        expires_at: session.expiresAt || null,
        paid_at: session.paidAt || null,
        payment_id: session.paymentId || null,
        payment_status: session.status || null,
        stripe_checkout_session_id: session.stripeCheckoutSessionId || null,
        stripe_checkout_status: session.stripeCheckoutStatus || null,
        stripe_payment_status: session.stripePaymentStatus || null,
        credit_rewarded: Boolean(session.creditRewarded),
        is_permanent: false,
    };
}

function csvEscape(value) {
    const text = String(value ?? "");
    const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replace(/"/g, '""')}"`;
}

function formatOrderAmount(value) {
    const amount = Number(value || 0);
    if (!Number.isFinite(amount)) return "";
    return amount.toFixed(2).replace(".", ",");
}

function serializeOrderReport(order) {
    const trafficSource = normalizeTrafficSource(order.trafficSource || {});
    return {
        session_id: order.sessionId || "",
        status: order.orderStatus || (order.paid ? "pago" : "pendente"),
        valor: formatOrderAmount(order.amountBrl),
        valor_numero: Number(order.amountBrl || 0),
        client_name: order.clientName || "",
        customer_phone: order.customerPhone || "",
        customer_email: order.customerEmail || "",
        occasion: order.occasion || "",
        style: order.style || "",
        voice_gender: order.voiceGender || "",
        customer_key: order.customerKey || "",
        payment_id: order.paymentId || "",
        payment_status: order.paymentStatus || "",
        created_at: order.createdAt || "",
        paid_at: order.paidAt || "",
        updated_at: order.updatedAt || "",
        expires_at: order.expiresAt || "",
        download_url_1: order.downloadUrl1 || "",
        download_url_2: order.downloadUrl2 || "",
        utm_source: trafficSource.utmSource,
        utm_medium: trafficSource.utmMedium,
        utm_campaign: trafficSource.utmCampaign,
        utm_content: trafficSource.utmContent,
        utm_term: trafficSource.utmTerm,
        gclid: trafficSource.gclid,
        fbclid: trafficSource.fbclid,
        landing_page: trafficSource.landingPage,
        traffic_captured_at: trafficSource.capturedAt,
    };
}

async function syncOrderReportToGoogleSheets(order) {
    if (!GOOGLE_SHEETS_WEBHOOK_URL || !order?.sessionId) return { ok: false, skipped: true };
    const payload = {
        secret: GOOGLE_SHEETS_WEBHOOK_SECRET,
        order: serializeOrderReport(order),
    };

    try {
        const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.ok === false) {
            throw new Error(data?.error || `Google Sheets respondeu ${response.status}`);
        }
        return { ok: true };
    } catch (error) {
        console.error("Erro ao sincronizar pedido com Google Sheets", error);
        return { ok: false, error: error.message || "Erro ao sincronizar pedido." };
    }
}

async function syncAllOrderReportsToGoogleSheets() {
    if (!GOOGLE_SHEETS_WEBHOOK_URL) return { ok: false, count: 0, synced: 0, error: "GOOGLE_SHEETS_WEBHOOK_URL nao configurado." };
    const results = [];
    for (const order of Array.from(orderReports.values())) {
        results.push(await syncOrderReportToGoogleSheets(order));
        await sleep(150);
    }
    const failed = results.filter((result) => !result?.ok);
    return {
        ok: failed.length === 0,
        count: orderReports.size,
        synced: results.length - failed.length,
        failed: failed.length,
        error: failed[0]?.error || null,
    };
}

function getSortedOrderReports() {
    return Array.from(orderReports.values())
        .map(serializeOrderReport)
        .sort((left, right) => new Date(right.created_at || right.updated_at || 0).getTime() - new Date(left.created_at || left.updated_at || 0).getTime());
}

function buildOrdersCsv() {
    const headers = [
        "Status",
        "Valor",
        "Nome de quem pediu",
        "WhatsApp",
        "Ocasiao",
        "Estilo",
        "Voz",
        "Session ID",
        "Customer Key",
        "ID do pagamento",
        "Status do pagamento",
        "Criado em",
        "Pago em",
        "Atualizado em",
        "Expira em",
        "Link versao 1",
        "Link versao 2",
        "UTM Source",
        "UTM Medium",
        "UTM Campaign",
        "UTM Content",
        "UTM Term",
        "GCLID",
        "FBCLID",
        "Landing Page",
        "Trafego capturado em",
    ];

    const rows = getSortedOrderReports().map((order) => [
        order.status,
        order.valor,
        order.client_name,
        order.customer_phone,
        order.occasion,
        order.style,
        order.voice_gender,
        order.session_id,
        order.customer_key,
        order.payment_id,
        order.payment_status,
        order.created_at,
        order.paid_at,
        order.updated_at,
        order.expires_at,
        order.download_url_1,
        order.download_url_2,
        order.utm_source,
        order.utm_medium,
        order.utm_campaign,
        order.utm_content,
        order.utm_term,
        order.gclid,
        order.fbclid,
        order.landing_page,
        order.traffic_captured_at,
    ]);

    return [headers, ...rows].map((row) => row.map(csvEscape).join(";")).join("\r\n");
}

loadTempMusicSessions();
loadPaidMusicSessions();
loadPreviewCreditWallets();
loadOrderReports();
syncOrderReportsFromSessions({ skipSync: true });
syncAllOrderReportsToGoogleSheets();
pruneExpiredTempMusicSessions();
pruneExpiredPaidMusicSessions();
setInterval(pruneExpiredTempMusicSessions, 15 * 60 * 1000);
setInterval(pruneExpiredPaidMusicSessions, 15 * 60 * 1000);

function getGeminiErrorMessage(data) {
    return data?.error?.message || data?.error?.status || "Falha ao gerar a letra com o Gemini.";
}

function shouldRetryGemini(status, data) {
    if (status === 429 || status === 503) return true;
    const message = String(getGeminiErrorMessage(data)).toLowerCase();
    return message.includes("high demand") || message.includes("quota") || message.includes("rate") || message.includes("limit");
}

async function callGemini(prompt, model) {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-goog-api-key": GEMINI_API_KEY,
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: LYRICS_SYSTEM_INSTRUCTION }],
                },
                generationConfig: {
                    temperature: GEMINI_TEMPERATURE,
                    topP: 0.95,
                    candidateCount: 1,
                },
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }],
                    },
                ],
            }),
        }
    );

    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
}
async function generateWithRetries(prompt) {
    const models = [GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS];
    let lastError = null;
    let lastStatus = 503;
    let lastRetryable = false;

    for (const model of models) {
        for (let attempt = 0; attempt <= GEMINI_RETRY_DELAYS.length; attempt += 1) {
            const result = await callGemini(prompt, model);
            if (result.ok) {
                return { data: result.data };
            }

            const retryable = shouldRetryGemini(result.status, result.data);
            const message = getGeminiErrorMessage(result.data);
            lastError = message;
            lastStatus = result.status || 503;
            lastRetryable = retryable;

            if (!retryable) {
                return { error: message, status: lastStatus, retryable: false };
            }

            if (attempt < GEMINI_RETRY_DELAYS.length) {
                await sleep(GEMINI_RETRY_DELAYS[attempt]);
            }
        }
    }

    return { error: lastError || "The AI is under high demand right now. Please try again in a few minutes.", status: lastStatus || 503, retryable: lastRetryable };
}

function buildPrompt({ occasionLabel, style, fields }) {
    const internalOnlyLabels = new Set(["Your name"]);
    const entries = Object.entries(fields || {}).filter(([, value]) => String(value || "").trim());
    const lyricEntries = entries.filter(([label]) => !internalOnlyLabels.has(String(label || "").trim()));
    const fieldLines = lyricEntries
        .map(([label, value]) => `- ${label}: ${value || "-"}`)
        .join("\n");

    const concreteElements = lyricEntries
        .map(([, value]) => String(value || "").trim())
        .filter(Boolean)
        .slice(0, 8)
        .join(" | ");

    const normalizedOccasion = (occasionLabel || "").toLowerCase();
    const isReveal = normalizedOccasion.includes("baby reveal") || normalizedOccasion.includes("baby arrival");

    const promptParts = [
        "Write a deeply personalised song lyric based on the customer brief below.",
        "Write in the same primary language used by the customer in their answers.",
        "Never translate the story into another language.",
        "Turn facts into scenes, memories, mental images, places, gestures, scents, sounds, and small human details.",
        "Do not repeat the brief word-for-word.",
        "The song must feel human, emotional, commercial, natural, and ready to be sung.",
        "Avoid generic clichés, empty lines, artificial wording, and AI-sounding phrasing.",
        "Use rhyme only when it improves the song naturally.",
        "Fully adapt the writing to the requested music style.",
        "The chorus should be the strongest, most memorable, and most moving moment in the song.",
        "Return only the lyric in named song sections using square brackets.",
        "Preferred structure:",
        "[Intro]",
        "[Verse 1]",
        "[Pre-Chorus]",
        "[Chorus]",
        "[Verse 2]",
        "[Bridge]",
        "[Final Chorus]",
        "[Outro]",
        "Each section should contain complete, natural, singable lines.",
        "If the story calls for it, let the emotional intensity grow throughout the song.",
        "Do not include explanations, comments, lists, JSON, or notes outside the lyric.",
        "Do not use quotation marks around the lyric.",
        `Occasion: ${occasionLabel}`,
        `Requested style or mood: ${style || "Emotional and premium"}`,
        "Brand context: Memory Tune turns real stories into refined, emotionally powerful songs.",
        concreteElements ? `Concrete details that should appear organically in the lyric: ${concreteElements}` : "",
        "The field 'Your name' refers only to the person placing the order and must never appear in the lyric unless it is clearly part of the story.",
        "Only use names that genuinely belong to the story itself.",
        "Customer brief:",
        fieldLines || "- No additional details provided.",
    ].filter(Boolean);

    if (isReveal) {
        promptParts.push("If it fits the story, include a delicate moment of discovery or the baby's arrival. If a name exists, use it naturally. If not, use a tender and subtle image.");
    }

    return promptParts.join("\n");
}
function parseLyrics(text, occasionLabel) {
    const normalized = (text || "")
        .replace(/\r/g, "")
        .replace(/^\s*(Conte\?do n\?o retornado pelo modelo\.?|Conteúdo não retornado pelo modelo\.?|Content not returned by the model\.?)\s*$/gim, "")
        .replace(/\s*Conte\?do n\?o retornado pelo modelo\.?\s*/gi, "\n")
        .replace(/\s*Conteúdo não retornado pelo modelo\.?\s*/gi, "\n")
        .replace(/\s*Content not returned by the model\.?\s*/gi, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    const labelVariants = [
        { key: "Intro", aliases: ["[Intro]", "Intro", "Intro:"] },
        { key: "Verse 1", aliases: ["[Verse 1]", "Verse 1", "Verse 1:"] },
        { key: "Pre-Chorus", aliases: ["[Pre-Chorus]", "Pre-Chorus", "Pre-Chorus:"] },
        { key: "Chorus", aliases: ["[Chorus]", "Chorus", "Chorus:"] },
        { key: "Verse 2", aliases: ["[Verse 2]", "Verse 2", "Verse 2:"] },
        { key: "Bridge", aliases: ["[Bridge]", "Bridge", "Bridge:"] },
        { key: "Final Chorus", aliases: ["[Final Chorus]", "Final Chorus", "Final Chorus:", "[Final]", "Final", "Final:"] },
        { key: "Outro", aliases: ["[Outro]", "Outro", "Outro:"] },
    ];

    const positions = labelVariants.map(({ key, aliases }) => {
        const matches = aliases
            .map((alias) => ({ alias, index: normalized.indexOf(alias) }))
            .filter((entry) => entry.index !== -1)
            .sort((a, b) => a.index - b.index);

        if (!matches.length) return null;

        return {
            key,
            alias: matches[0].alias,
            index: matches[0].index,
        };
    }).filter(Boolean).sort((a, b) => a.index - b.index);

    const blocks = positions.map((entry, index) => {
        const start = entry.index;
        const end = index < positions.length - 1 ? positions[index + 1].index : normalized.length;
        const blockText = normalized
            .slice(start + entry.alias.length, end)
            .replace(/^[:\-\s\]]+/, "")
            .trim();

        if (!blockText) return null;

        return {
            heading: entry.key,
            text: blockText,
        };
    }).filter(Boolean);

    if (blocks.length) {
        return blocks;
    }

    const paragraphs = normalized
        .split(/\n\s*\n/)
        .map((chunk) => chunk.trim())
        .filter(Boolean);

    const promptParts = [
        { heading: "Verse 1", text: paragraphs[0] || normalized || "" },
        { heading: "Verse 2", text: paragraphs[1] || paragraphs[0] || normalized || "" },
        { heading: "Bridge", text: paragraphs[2] || paragraphs[1] || paragraphs[0] || "" },
        { heading: "Pre-Chorus", text: paragraphs[3] || paragraphs[2] || paragraphs[1] || "" },
        { heading: "Chorus", text: paragraphs[4] || paragraphs[3] || paragraphs[2] || "" },
        { heading: "Final", text: paragraphs[5] || paragraphs[4] || paragraphs[3] || "" }
    ].filter((block) => String(block.text || "").trim());

    return promptParts;
}

function formatLyricsBlocks(blocks) {
    return (Array.isArray(blocks) ? blocks : [])
        .map((block) => {
            const heading = String(block?.heading || "").trim();
            const text = String(block?.text || "").trim();
            if (!heading && !text) return "";
            if (!heading) return text;
            return `[${heading}]\n${text}`.trim();
        })
        .filter(Boolean)
        .join("\n\n")
        .trim();
}

function cleanAudioUrl(value) {
    return typeof value === "string" ? value.trim() : "";
}

function resolveAudioUrl(conversion, conversionId) {
    if (!conversion || typeof conversion !== "object") return "";

    const cleanUrl = (value) => (typeof value === "string" ? value.replace(/\s+/g, "").trim() : "");

    if (conversionId) {
        if (conversion.conversion_id_1 === conversionId || conversion.conversionId1 === conversionId) {
            const direct = cleanUrl(conversion.conversion_path_1) || cleanUrl(conversion.conversion_path_mp3_1) || cleanUrl(conversion.conversion_path_wav_1);
            if (direct) return direct;
        }
        if (conversion.conversion_id_2 === conversionId || conversion.conversionId2 === conversionId) {
            const direct = cleanUrl(conversion.conversion_path_2) || cleanUrl(conversion.conversion_path_mp3_2) || cleanUrl(conversion.conversion_path_wav_2);
            if (direct) return direct;
        }
    }

    const candidates = [
        conversion.audio_url,
        conversion.audioUrl,
        conversion.audio,
        conversion.audio_path,
        conversion.audioPath,
        conversion.conversion_path,
        conversion.conversion_path_mp3,
        conversion.conversion_path_wav,
        conversion.conversion_path_1,
        conversion.conversion_path_2,
        conversion.conversion_path_wav_1,
        conversion.conversion_path_wav_2,
        conversion.output_path,
        conversion.outputPath,
        conversion.result_url,
        conversion.download_url,
        conversion.file_url
    ].map(cleanUrl);

    const fromList = (list) => {
        if (!Array.isArray(list)) return "";
        const found = list.find((item) => typeof item === "string" ? item : item?.url || item?.path || item?.file_url);
        if (!found) return "";
        return cleanUrl(typeof found === "string" ? found : found?.url || found?.path || found?.file_url || "");
    };

    const arrayCandidates = [
        conversion.files,
        conversion.outputs,
        conversion.output_files,
        conversion.output,
        conversion.audio_files,
        conversion.data
    ];

    const arrayHit = arrayCandidates.map(fromList).find((value) => value);
    if (arrayHit) return arrayHit;

    return candidates.find((value) => value) || "";
}

function buildSunoVariantId(taskId, index) {
    return taskId + "::" + index;
}

function normalizeBracketSectionHeadings(text, occasionLabel) {
    const blocks = parseLyrics(text, occasionLabel);
    const formatted = formatLyricsBlocks(blocks);
    return formatted || String(text || "").trim();
}

function parseSunoVariantId(rawId) {
    if (!rawId) return { taskId: "", index: 0 };
    const parts = String(rawId).split("::");
    const parsedIndex = Number(parts[1] || 0);
    return { taskId: parts[0] || String(rawId), index: Number.isFinite(parsedIndex) ? parsedIndex : 0 };
}

function buildSunoTitle({ occasion, style }) {
    const base = occasion || style || "Personalised song";
    return ("Memory Tune " + base).slice(0, 80);
}

function extractSunoTracks(payload) {
    const candidates = [payload?.response?.sunoData, payload?.data?.response?.sunoData, payload?.sunoData, payload?.data?.sunoData, payload?.response?.data, payload?.data?.data];
    const tracks = candidates.find((value) => Array.isArray(value));
    return Array.isArray(tracks) ? tracks : [];
}

function resolveSunoAudioUrl(taskPayload, variantId) {
    const { index } = parseSunoVariantId(variantId);
    const tracks = extractSunoTracks(taskPayload);
    if (!tracks.length) return "";
    const track = tracks[index] || tracks[0] || {};
    return cleanAudioUrl(track.audioUrl || track.audio_url || track.sourceAudioUrl || track.source_audio_url || "");
}

function normalizeSunoStatus(payload) {
    const rawStatus = String(payload?.status || payload?.data?.status || payload?.response?.status || "").toUpperCase();
    if (["SUCCESS", "COMPLETED", "DONE"].includes(rawStatus)) return "COMPLETED";
    if (["FAILED", "ERROR"].includes(rawStatus)) return "FAILED";
    return rawStatus || "PROCESSING";
}

function getBaseUrl(req) {
    const protoHeader = req.headers["x-forwarded-proto"];
    const proto = protoHeader ? protoHeader.split(",")[0].trim() : req.protocol;
    const host = req.headers["x-forwarded-host"] || req.get("host");
    return `${proto}://${host}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildMusicReadyEmailHtml(session, baseUrl) {
    const clientName = escapeHtml(session.clientName || "Customer");
    const title = escapeHtml(session.title || "Your Memory Tune song is ready");
    const downloadUrl1 = escapeHtml(session.downloadUrl1 || "");
    const downloadUrl2 = escapeHtml(session.downloadUrl2 || "");
    const libraryUrl = `${baseUrl}/my-songs?session_id=${encodeURIComponent(session.sessionId || "")}`;
    const supportUrl = `https://wa.me/5511916609867`;

    return `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#0d0d0d;color:#f5ead1;padding:32px 20px;">
            <div style="max-width:620px;margin:0 auto;background:#171717;border:1px solid #5f4a16;border-radius:20px;padding:32px;">
                <p style="margin:0 0 16px;font-size:16px;color:#f5ead1;">Hello, ${clientName}.</p>
                <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#fff5dc;">Your Memory Tune song is ready</h1>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#eadfbf;">${title}</p>
                <div style="margin:0 0 24px;padding:20px;border-radius:16px;background:#111725;border:1px solid #2e3a5d;">
                    <p style="margin:0 0 12px;font-size:15px;color:#cfd9ff;">Download your versions:</p>
                    <p style="margin:0 0 10px;"><a href="${downloadUrl1}" style="color:#ffd54d;">Download version 1</a></p>
                    <p style="margin:0;"><a href="${downloadUrl2}" style="color:#ffd54d;">Download version 2</a></p>
                </div>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:#eadfbf;">You can also access your library here:</p>
                <p style="margin:0 0 24px;"><a href="${escapeHtml(libraryUrl)}" style="color:#ffd54d;">Open My songs</a></p>
                <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#c8c8c8;">If you need help, our team is here:</p>
                <p style="margin:0;"><a href="${supportUrl}" style="color:#ffd54d;">Memory Tune WhatsApp</a></p>
            </div>
        </div>
    `;
}

async function sendMusicReadyEmail(session, baseUrl) {
    const to = normalizeEmailAddress(session.customerEmail);
    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: RESEND_FROM_EMAIL,
            to: [to],
            reply_to: RESEND_REPLY_TO_EMAIL || undefined,
            subject: "Your Memory Tune song is ready",
            html: buildMusicReadyEmailHtml(session, baseUrl),
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(errorText || "Failed to send email via Resend.");
    }

    return response.json().catch(() => ({}));
}

async function sendMusicReadyEmailIfEligible(sessionId, baseUrl) {
    if (!sessionId || !RESEND_API_KEY || !RESEND_FROM_EMAIL) return { skipped: true, reason: "email_disabled" };

    const tempSession = getTempMusicSession(sessionId);
    const paidSession = getPaidMusicSession(sessionId);
    const session = paidSession || tempSession;

    if (!session?.paid) return { skipped: true, reason: "not_paid" };
    if (!session.downloadUrl1 || !session.downloadUrl2) return { skipped: true, reason: "audio_not_ready" };
    if (!isValidEmailAddress(session.customerEmail)) return { skipped: true, reason: "invalid_email" };
    if (session.emailSentAt) return { skipped: true, reason: "already_sent" };

    try {
        await sendMusicReadyEmail(session, baseUrl);
        const emailPayload = {
            customerEmail: normalizeEmailAddress(session.customerEmail),
            emailSentAt: new Date().toISOString(),
            emailDeliveryStatus: "sent",
            emailLastError: "",
        };
        upsertTempMusicSession(sessionId, emailPayload);
        if (paidSession || session.paid) {
            upsertPaidMusicSession(sessionId, emailPayload);
        }
        return { ok: true };
    } catch (error) {
        const failurePayload = {
            customerEmail: normalizeEmailAddress(session.customerEmail),
            emailDeliveryStatus: "failed",
            emailLastError: String(error?.message || "Falha ao enviar e-mail.").slice(0, 300),
        };
        upsertTempMusicSession(sessionId, failurePayload);
        if (paidSession || session.paid) {
            upsertPaidMusicSession(sessionId, failurePayload);
        }
        throw error;
    }
}

function buildSunoVoiceDirectives(voiceGender, style) {
    const normalizedVoiceGender = normalizeVoiceGender(voiceGender);
    if (!normalizedVoiceGender) {
        return { style, negativeTags: [] };
    }

    const normalizedStyle = String(style || "").trim();
    if (normalizedVoiceGender === "male") {
        return {
            style: normalizedStyle ? `${normalizedStyle}, male vocals, male singer` : "male vocals, male singer",
            negativeTags: ["female vocal", "woman singing", "feminine voice", "soprano", "alto female", "duet", "multiple voices"],
        };
    }

    return {
        style: normalizedStyle ? `${normalizedStyle}, female vocals, female singer` : "female vocals, female singer",
        negativeTags: ["male vocal", "man singing", "masculine voice", "baritone", "deep male voice", "duet", "multiple voices"],
    };
}

function normalizeVoiceGender(value = "") {
    const normalized = String(value || "").trim().toLowerCase();
    if (["male", "masculina", "masculine", "man"].includes(normalized)) return "male";
    if (["female", "feminina", "feminine", "woman"].includes(normalized)) return "female";
    return "";
}
app.post("/api/generate-lyrics", async (req, res) => {
    try {
        if (!GEMINI_API_KEY) {
            return res.status(400).json({ error: "GEMINI_API_KEY is not configured in the .env file." });
        }

        const { occasionLabel, style, fields } = req.body || {};

        if (!occasionLabel || !fields || typeof fields !== "object") {
            return res.status(400).json({ error: "Questionnaire data is incomplete." });
        }

        const prompt = buildPrompt({ occasionLabel, style, fields });

        const result = await generateWithRetries(prompt);

        if (result?.error) {
            const message = String(result.error);
            if (message.toLowerCase().includes("high demand")) {
                return res.status(503).json({
                    error: "The AI is under high demand right now. Please try again in a few minutes.",
                });
            }
            return res.status(result.status || 503).json({ error: message });
        }

        const text = result?.data?.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || "")
            .join("\n")
            .trim();

        if (!text) {
            return res.status(502).json({ error: "Gemini did not return usable lyric text." });
        }

        return res.json({
            text,
            blocks: parseLyrics(text, occasionLabel),
        });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Internal error while generating lyrics." });
    }
});

app.listen(PORT, () => {
    console.log(`Memory Tune running at http://localhost:${PORT}`);
});




app.post("/api/music/create", async (req, res) => {
    let consumedPhone = "";
    let shouldRefundCredit = false;
    try {
        if (!KIE_SUNO_API_KEY) {
            return res.status(400).json({ error: "KIE_SUNO_API_KEY is not configured in the .env file." });
        }

        const {
            session_id: sessionId,
            lyrics,
            music_style: musicStyle,
            output_length: outputLength,
            make_instrumental: makeInstrumental,
            voice_gender: voiceGender,
            occasion,
            customer_phone: customerPhone,
            customer_email: customerEmail,
        } = req.body || {};

        if (!lyrics || typeof lyrics !== "string") {
            return res.status(400).json({ error: "Invalid lyrics for song generation." });
        }

        const normalizedPhone = normalizeWhatsAppNumber(customerPhone);
        const normalizedEmail = normalizeEmailAddress(customerEmail);
        const testMode = isPreviewTestMode(req);
        const whitelisted = isPreviewPhoneWhitelisted(normalizedPhone);
        const paidSession = sessionId ? paidSessions.get(sessionId) || getPaidMusicSession(sessionId) || getTempMusicSession(sessionId) : null;
        const paidSessionAlreadyGenerated = Boolean(paidSession?.downloadUrl1 && paidSession?.downloadUrl2);
        if (paidSession?.paid && (paidSession?.paidGenerationUsed || paidSessionAlreadyGenerated)) {
            return res.status(409).json({
                code: "PAID_SESSION_ALREADY_USED",
                error: "This payment has already been used for a song. To create another song, start a new payment.",
            });
        }

        const hasPaidGeneration = Boolean(paidSession?.paid);
        let previewAccess = true;

        if (!testMode && !whitelisted && !hasPaidGeneration) {
            if (!isValidWhatsAppNumber(normalizedPhone)) {
                return res.status(400).json({ error: "Enter a valid WhatsApp number with country code to unlock your complimentary preview." });
            }

            const creditUse = consumePreviewCredit(normalizedPhone);
            if (creditUse.ok) {
                consumedPhone = normalizedPhone;
                shouldRefundCredit = true;
            } else {
                previewAccess = false;
            }
        }

        const baseUrl = getBaseUrl(req);
        const callbackUrl = KIE_SUNO_CALLBACK_URL || (baseUrl + "/api/kie/suno/callback");
        const baseStyle = musicStyle || "Cinematic Pop";
        const voiceDirectives = buildSunoVoiceDirectives(makeInstrumental ? "" : voiceGender, baseStyle);
        const style = voiceDirectives.style || baseStyle;
        const sanitizedLyrics = normalizeBracketSectionHeadings(lyrics, occasion);
        const payload = {
            prompt: sanitizedLyrics,
            style,
            title: buildSunoTitle({ occasion, style }),
            customMode: true,
            instrumental: Boolean(makeInstrumental),
            model: KIE_SUNO_MODEL,
            callBackUrl: callbackUrl,
        };

        const normalizedVoiceGender = normalizeVoiceGender(voiceGender);
        if (normalizedVoiceGender && !makeInstrumental) {
            payload.vocalGender = normalizedVoiceGender === "male" ? "m" : "f";
        }

        const negativeTags = [];
        if (KIE_SUNO_NEGATIVE_TAGS) {
            negativeTags.push(KIE_SUNO_NEGATIVE_TAGS);
        }
        if (voiceDirectives.negativeTags?.length) {
            negativeTags.push(...voiceDirectives.negativeTags);
        }
        if (negativeTags.length) {
            payload.negativeTags = negativeTags.join(", ");
        }

        if (outputLength) {
            payload.extendAudio = Number(outputLength) > 180;
        }

        if (sessionId) {
            upsertTempMusicSession(sessionId, {
                customerPhone: normalizedPhone,
                customerEmail: normalizedEmail,
                occasion,
                style: baseStyle,
                voiceGender: normalizedVoiceGender || "female",
                lyrics,
            });
        }

        const response = await fetch("https://api.kie.ai/api/v1/generate", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + KIE_SUNO_API_KEY,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok || data?.code !== 200) {
            if (shouldRefundCredit) {
                refundPreviewCredit(consumedPhone);
                shouldRefundCredit = false;
            }
            return res.status(response.ok ? 502 : response.status).json({ error: data?.msg || data?.message || "Falha ao iniciar Suno via Kie AI." });
        }

        const taskId = data?.data?.taskId || data?.taskId;
        if (!taskId) {
            if (shouldRefundCredit) {
                refundPreviewCredit(consumedPhone);
            }
            return res.status(502).json({ error: "Kie AI did not return a valid taskId." });
        }

        return res.json({
            task_id: taskId,
            conversion_id_1: buildSunoVariantId(taskId, 0),
            conversion_id_2: buildSunoVariantId(taskId, 1),
            eta: data?.data?.estimatedTime || data?.estimatedTime || 180,
            credits_remaining: testMode || whitelisted || hasPaidGeneration ? null : getPreviewCreditWallet(normalizedPhone).credits,
            preview_access: previewAccess || hasPaidGeneration || testMode || whitelisted,
            test_mode: testMode,
            whitelisted,
            paid_generation: hasPaidGeneration,
            provider: "kie-suno",
        });
    } catch (error) {
        if (shouldRefundCredit) {
            refundPreviewCredit(consumedPhone);
        }
        return res.status(500).json({ error: error.message || "Erro interno ao iniciar Suno via Kie AI." });
    }
});

app.get("/api/music/status", async (req, res) => {
    try {
        if (!KIE_SUNO_API_KEY) {
            return res.status(400).json({ error: "KIE_SUNO_API_KEY is not configured in the .env file." });
        }

        const conversionId = req.query.conversion_id;
        if (!conversionId) {
            return res.status(400).json({ error: "conversion_id is required." });
        }

        const parsed = parseSunoVariantId(conversionId);
        const response = await fetch("https://api.kie.ai/api/v1/generate/record-info?taskId=" + encodeURIComponent(parsed.taskId), {
            method: "GET",
            headers: {
                Authorization: "Bearer " + KIE_SUNO_API_KEY,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();

        if (!response.ok || data?.code !== 200) {
            return res.status(response.ok ? 502 : response.status).json({ error: data?.msg || data?.message || "Falha ao consultar Suno via Kie AI." });
        }

        const taskPayload = data?.data || data;
        const audioUrl = resolveSunoAudioUrl(taskPayload, conversionId);
        const rawStatus = normalizeSunoStatus(taskPayload);
        const safeStatus = audioUrl ? "COMPLETED" : rawStatus;
        const debug = req.query.debug === "1";

        return res.json({
            status: safeStatus,
            audio_url: audioUrl || "",
            source_status: rawStatus,
            raw: debug ? taskPayload : undefined,
            provider: "kie-suno",
        });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Erro interno ao consultar Suno via Kie AI." });
    }
});

app.post("/api/kie/suno/callback", (req, res) => {
    return res.status(200).json({ ok: true });
});

function markPaid(sessionId, payload = {}) {
    if (!sessionId) return;
    const paidAt = new Date().toISOString();
    const tempSession = tempMusicSessions.get(sessionId) || {};
    const existingPaidSession = paidMusicSessions.get(sessionId) || {};
    const alreadyRewarded = Boolean(tempSession.creditRewarded || existingPaidSession.creditRewarded);
    const customerPhone = tempSession.customerPhone || existingPaidSession.customerPhone || "";
    const rewardedWallet = alreadyRewarded ? null : rewardPreviewCredit(customerPhone);
    const alreadyGeneratedMusic = Boolean(
        (tempSession.downloadUrl1 && tempSession.downloadUrl2) ||
        (existingPaidSession.downloadUrl1 && existingPaidSession.downloadUrl2)
    );
    const paidPayload = {
        paid: true,
        at: paidAt,
        paymentId: payload.paymentId || null,
        status: payload.status || null,
        creditRewarded: Boolean(alreadyRewarded || rewardedWallet),
        paidGenerationUsed: alreadyGeneratedMusic,
    };
    paidSessions.set(sessionId, paidPayload);
    const savedTempSession = upsertTempMusicSession(sessionId, { ...paidPayload, paidAt });
    upsertPaidMusicSession(sessionId, {
        ...savedTempSession,
        ...paidPayload,
        paidAt,
        paymentId: paidPayload.paymentId,
        status: paidPayload.status,
        creditRewarded: paidPayload.creditRewarded,
    });
}

async function syncPayPalOrderForSession(sessionId, req) {
    if (!sessionId) return null;

    const session = getTempMusicSession(sessionId) || getPaidMusicSession(sessionId);
    if (!session || session.paid || !session.paypalOrderId) {
        return session;
    }

    const accessToken = await getPayPalAccessToken();
    const orderResponse = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${encodeURIComponent(session.paypalOrderId)}`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
        },
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) {
        throw new Error(orderData?.message || orderData?.details?.[0]?.description || "Could not read PayPal order status.");
    }

    upsertTempMusicSession(sessionId, {
        paypalOrderId: session.paypalOrderId,
        paypalOrderStatus: orderData?.status || session.paypalOrderStatus || null,
    });

    if (orderData?.status === "COMPLETED") {
        const captureId = orderData?.purchase_units?.[0]?.payments?.captures?.[0]?.id || session.paypalOrderId;
        markPaid(sessionId, { paymentId: captureId, status: orderData.status });
    } else if (PAYPAL_ENV === "sandbox" && orderData?.status === "APPROVED") {
        // Sandbox frequently leaves approved orders without a final completed capture.
        // For local testing only, treat APPROVED as paid so the release flow can be verified.
        markPaid(sessionId, { paymentId: session.paypalOrderId, status: "APPROVED_SANDBOX" });
    }

    const latest = getPaidMusicSession(sessionId) || getTempMusicSession(sessionId);
    if (latest?.paid) {
        const baseUrl = getBaseUrl(req);
        setTimeout(() => {
            sendMusicReadyEmailIfEligible(sessionId, baseUrl).catch((error) => {
                console.error("Error sending automatic music-ready email after PayPal sync", error);
            });
        }, 0);
    }

    return latest;
}

async function syncStripeCheckoutForSession(sessionId, req, providedStripeSessionId = "") {
    if (!STRIPE_SECRET_KEY || !sessionId) return null;

    const existingSession = getTempMusicSession(sessionId) || getPaidMusicSession(sessionId);
    const stripeSessionId = String(providedStripeSessionId || existingSession?.stripeCheckoutSessionId || "").trim();
    if (!existingSession || existingSession.paid || !stripeSessionId) {
        return existingSession || null;
    }

    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId, {
        expand: ["payment_intent"],
    });
    return applyStripeCheckoutSuccess(sessionId, checkoutSession, req);
}

app.post("/api/music-session/save", (req, res) => {
    try {
        const {
            session_id: sessionId,
            customer_key: customerKey,
            client_name: clientName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            occasion,
            style,
            voice_gender: voiceGender,
            lyrics,
            title,
            subtitle,
            badge,
            download_url_1: downloadUrl1,
            download_url_2: downloadUrl2,
            preview_locked: previewLocked,
            traffic_source: trafficSource,
        } = req.body || {};

        if (!sessionId || !downloadUrl1 || !downloadUrl2) {
            return res.status(400).json({ error: "session_id and music links are required." });
        }

        const saved = upsertTempMusicSession(sessionId, {
            customerKey: customerKey || "",
            clientName: clientName || "",
            customerPhone: normalizeWhatsAppNumber(customerPhone) || "",
            customerEmail: normalizeEmailAddress(customerEmail) || "",
            occasion: occasion || "",
            style: style || "",
            voiceGender: normalizeVoiceGender(voiceGender) || "female",
            lyrics: lyrics || "",
            title: title || "Your song is ready",
            subtitle: subtitle || "We found your temporary session.",
            badge: badge || "Song ready",
            downloadUrl1,
            downloadUrl2,
            previewLocked: Boolean(previewLocked),
            trafficSource: normalizeTrafficSource(trafficSource),
        });

        if (saved?.paid || paidSessions.get(sessionId)?.paid) {
            upsertPaidMusicSession(sessionId, {
                ...saved,
                paid: true,
                paidAt: saved.paidAt || paidSessions.get(sessionId)?.at || new Date().toISOString(),
                paymentId: saved.paymentId || paidSessions.get(sessionId)?.paymentId || null,
                status: saved.status || paidSessions.get(sessionId)?.status || "approved",
                creditRewarded: saved.creditRewarded || paidSessions.get(sessionId)?.creditRewarded || false,
            });
            markPaidGenerationUsed(sessionId);
        }

        const baseUrl = getBaseUrl(req);
        setTimeout(() => {
            sendMusicReadyEmailIfEligible(sessionId, baseUrl).catch((error) => {
                console.error("Erro ao enviar e-mail automatico da musica pronta", error);
            });
        }, 0);

        return res.json({
            ok: true,
            expires_at: saved.expiresAt,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message || "We could not save the temporary song session." });
    }
});

app.get("/api/music-session", (req, res) => {
    const sessionId = req.query.session_id;
    if (!sessionId) {
        return res.status(400).json({ error: "session_id e obrigatorio." });
    }

    const session = getTempMusicSession(sessionId) || getPaidMusicSession(sessionId);
    if (!session) {
        return res.status(404).json({ error: "Sessao temporaria nao encontrada ou expirada." });
    }

    return res.json(serializeMusicSession(session, sessionId));
});

app.get("/api/music-library", (req, res) => {
    let customerKey = String(req.query.customer_key || "").trim();
    let customerPhone = normalizeWhatsAppNumber(req.query.customer_phone || "");
    const sessionId = String(req.query.session_id || "").trim();

    if (sessionId && (!customerKey || !customerPhone)) {
        const sessionMatch = getTempMusicSession(sessionId) || getPaidMusicSession(sessionId);
        if (sessionMatch) {
            customerKey = customerKey || String(sessionMatch.customerKey || "").trim();
            customerPhone = customerPhone || normalizeWhatsAppNumber(sessionMatch.customerPhone || "");
        }
    }

    if (!customerKey && !customerPhone) {
        return res.status(400).json({ error: "customer_key, customer_phone ou session_id e obrigatorio." });
    }

    pruneExpiredTempMusicSessions();
    pruneExpiredPaidMusicSessions();

    const matchesCustomer = (session) => {
        if (!session) return false;
        const sessionKey = String(session.customerKey || "").trim();
        const sessionPhone = normalizeWhatsAppNumber(session.customerPhone || "");
        if (customerKey && sessionKey === customerKey) return true;
        if (customerPhone && sessionPhone === customerPhone) return true;
        return false;
    };

    const tempItems = Array.from(tempMusicSessions.values())
        .filter(matchesCustomer)
        .map((session) => serializeMusicSession(session, session.sessionId));

    const permanentItems = Array.from(paidMusicSessions.values())
        .filter(matchesCustomer)
        .map((session) => serializeMusicSession(session, session.sessionId));

    const items = [...tempItems, ...permanentItems]
        .reduce((acc, item) => {
            const existing = acc.get(item.session_id) || {};
            acc.set(item.session_id, {
                ...existing,
                ...item,
                paid: Boolean(item.paid || existing.paid),
                is_permanent: Boolean(item.is_permanent || existing.is_permanent),
                expires_at: item.expires_at || existing.expires_at || null,
                paid_at: item.paid_at || existing.paid_at || null,
            });
            return acc;
        }, new Map());

    return res.json({
        customer_key: customerKey || null,
        customer_phone: customerPhone || null,
        items: Array.from(items.values())
            .sort((left, right) => new Date(right.updated_at || 0).getTime() - new Date(left.updated_at || 0).getTime()),
    });
});

app.get("/api/admin/music-archive", (req, res) => {
    pruneExpiredPaidMusicSessions();

    const query = String(req.query.q || "").trim().toLowerCase();
    const items = Array.from(paidMusicSessions.values())
        .map((session) => ({
            ...serializeMusicSession(session, session.sessionId),
            archive_type: "paid",
        }))
        .filter((item) => {
            if (!query) return true;
            const haystack = [
                item.session_id,
                item.customer_key,
                item.client_name,
                item.customer_phone,
                item.occasion,
                item.style,
                item.voice_gender,
                item.title,
                item.subtitle,
                item.payment_id,
                item.payment_status,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(query);
        })
        .sort((left, right) => new Date(right.paid_at || right.updated_at || 0).getTime() - new Date(left.paid_at || left.updated_at || 0).getTime());

    return res.json({
        items,
        count: items.length,
    });
});
app.get("/api/admin/orders-report", (req, res) => {
    return res.json({
        items: getSortedOrderReports(),
        count: orderReports.size,
    });
});

app.get("/api/admin/orders-report.csv", (req, res) => {
    const csv = buildOrdersCsv();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=\"pedidos-musicas.csv\"");
    return res.send(`\uFEFF${csv}`);
});

app.post("/api/admin/orders-report/sync-sheets", async (req, res) => {
    if (!GOOGLE_SHEETS_WEBHOOK_URL) {
        return res.status(400).json({ error: "GOOGLE_SHEETS_WEBHOOK_URL nao configurado." });
    }
    const result = await syncAllOrderReportsToGoogleSheets();
    if (!result.ok) {
        return res.status(502).json(result);
    }
    return res.json({
        ok: true,
        count: result.count,
        synced: result.synced,
    });
});

app.post("/api/payment/create", async (req, res) => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            return res.status(400).json({ error: "PayPal credentials are not configured in the environment." });
        }
        if (!PAYPAL_PRICE_GBP || Number.isNaN(PAYPAL_PRICE_GBP)) {
            return res.status(400).json({ error: "PAYPAL_PRICE_GBP is not configured in the environment." });
        }

        const {
            session_id: sessionId,
            customer_key: customerKey,
            client_name: clientName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            traffic_source: trafficSource,
        } = req.body || {};
        if (!sessionId) {
            return res.status(400).json({ error: "session_id is required." });
        }

        upsertTempMusicSession(sessionId, {
            customerKey: customerKey || "",
            clientName: clientName || "",
            customerPhone: normalizeWhatsAppNumber(customerPhone) || "",
            customerEmail: normalizeEmailAddress(customerEmail) || "",
            title: PAYPAL_TITLE,
            subtitle: "Payment started to unlock song production.",
            badge: "Payment started",
            trafficSource: normalizeTrafficSource(trafficSource),
        });

        const accessToken = await getPayPalAccessToken();
        const orderPayload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    reference_id: sessionId,
                    custom_id: sessionId,
                    description: PAYPAL_TITLE,
                    amount: {
                        currency_code: PAYPAL_CURRENCY,
                        value: PAYPAL_PRICE_GBP.toFixed(2),
                    },
                },
            ],
        };

        const response = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(orderPayload),
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({
                error: data?.message || data?.details?.[0]?.description || "Failed to create payment in PayPal.",
            });
        }

        upsertTempMusicSession(sessionId, {
            paypalOrderId: data?.id || null,
            paypalOrderStatus: data?.status || null,
        });

        return res.json({ order_id: data?.id || null });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Internal error while creating payment." });
    }
});

app.post("/api/payment/stripe/create", async (req, res) => {
    try {
        if (!STRIPE_SECRET_KEY) {
            return res.status(400).json({ error: "Stripe is not configured in the environment." });
        }
        if (!CHECKOUT_PRICE_GBP || Number.isNaN(CHECKOUT_PRICE_GBP)) {
            return res.status(400).json({ error: "STRIPE_PRICE_GBP is not configured in the environment." });
        }

        const {
            session_id: sessionId,
            customer_key: customerKey,
            client_name: clientName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            traffic_source: trafficSource,
        } = req.body || {};

        if (!sessionId) {
            return res.status(400).json({ error: "session_id is required." });
        }

        const normalizedPhone = normalizeWhatsAppNumber(customerPhone) || "";
        const normalizedEmail = normalizeEmailAddress(customerEmail) || "";

        upsertTempMusicSession(sessionId, {
            customerKey: customerKey || "",
            clientName: clientName || "",
            customerPhone: normalizedPhone,
            customerEmail: normalizedEmail,
            title: CHECKOUT_TITLE,
            subtitle: "Card checkout started to unlock song production.",
            badge: "Card checkout started",
            trafficSource: normalizeTrafficSource(trafficSource),
        });

        const baseUrl = getBaseUrl(req);
        const stripe = getStripeClient();
        const checkoutSession = await stripe.checkout.sessions.create({
            mode: "payment",
            success_url: `${baseUrl}/my-songs?session_id=${encodeURIComponent(sessionId)}&stripe_session_id={CHECKOUT_SESSION_ID}&payment=stripe_success`,
            cancel_url: `${baseUrl}/my-songs?session_id=${encodeURIComponent(sessionId)}&payment=stripe_cancel`,
            billing_address_collection: "auto",
            customer_email: normalizedEmail || undefined,
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: STRIPE_CURRENCY,
                        unit_amount: Math.round(CHECKOUT_PRICE_GBP * 100),
                        product_data: {
                            name: CHECKOUT_TITLE,
                            description: "Personalised Memory Tune song checkout",
                        },
                    },
                },
            ],
            metadata: {
                session_id: sessionId,
                customer_key: customerKey || "",
                customer_phone: normalizedPhone,
                client_name: clientName || "",
            },
        });

        upsertTempMusicSession(sessionId, {
            stripeCheckoutSessionId: checkoutSession.id,
            stripeCheckoutStatus: checkoutSession.status || null,
            stripePaymentStatus: checkoutSession.payment_status || null,
        });

        return res.json({
            provider: "stripe",
            checkout_url: checkoutSession.url || null,
            stripe_session_id: checkoutSession.id,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Internal error while creating Stripe checkout." });
    }
});

app.post("/api/payment/stripe/confirm", async (req, res) => {
    try {
        if (!STRIPE_SECRET_KEY) {
            return res.status(400).json({ error: "Stripe is not configured in the environment." });
        }

        const {
            session_id: requestedSessionId,
            stripe_session_id: providedStripeSessionId,
        } = req.body || {};

        const existingSession = (requestedSessionId && (getTempMusicSession(requestedSessionId) || getPaidMusicSession(requestedSessionId))) || null;
        const stripeSessionId = String(providedStripeSessionId || existingSession?.stripeCheckoutSessionId || "").trim();
        if (!stripeSessionId) {
            return res.status(400).json({ error: "stripe_session_id is required." });
        }

        const stripe = getStripeClient();
        const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId, {
            expand: ["payment_intent"],
        });

        const sessionId = String(
            requestedSessionId ||
            checkoutSession.metadata?.session_id ||
            existingSession?.sessionId ||
            ""
        ).trim();

        if (!sessionId) {
            return res.status(400).json({ error: "session_id is required to confirm Stripe payment." });
        }

        await applyStripeCheckoutSuccess(sessionId, checkoutSession, req);

        const paid = paidSessions.get(sessionId);
        const tempSession = getTempMusicSession(sessionId);
        const paidSession = getPaidMusicSession(sessionId);
        const session = paidSession || tempSession;
        const isPaid = Boolean(paid?.paid || paidSession?.paid || tempSession?.paid);
        const phone = session?.customerPhone || tempSession?.customerPhone || "";
        const wallet = phone ? previewCreditWallets.get(phone) : null;

        return res.json({
            paid: isPaid,
            payment_id: session?.paymentId || null,
            payment_status: session?.status || checkoutSession.payment_status || null,
            credits_remaining: wallet ? wallet.credits : null,
            credit_rewarded: Boolean(session?.creditRewarded || paid?.creditRewarded),
            download_url_1: isPaid ? (paidSession?.downloadUrl1 || tempSession?.downloadUrl1 || "") : "",
            download_url_2: isPaid ? (paidSession?.downloadUrl2 || tempSession?.downloadUrl2 || "") : "",
            stripe_session_id: checkoutSession.id,
            stripe_checkout_status: checkoutSession.status || null,
            stripe_payment_status: checkoutSession.payment_status || null,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Internal error while confirming Stripe payment." });
    }
});

app.post("/api/payment/process", async (req, res) => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            return res.status(400).json({ error: "PayPal credentials are not configured in the environment." });
        }
        if (!PAYPAL_PRICE_GBP || Number.isNaN(PAYPAL_PRICE_GBP)) {
            return res.status(400).json({ error: "PAYPAL_PRICE_GBP is not configured in the environment." });
        }

        const {
            session_id: sessionId,
            customer_key: customerKey,
            client_name: clientName,
            customer_phone: customerPhone,
            customer_email: customerEmail,
            order_id: orderId,
            capture_data: captureData,
        } = req.body || {};

        if (!sessionId) {
            return res.status(400).json({ error: "session_id is required." });
        }

        if (!orderId) {
            return res.status(400).json({ error: "order_id is required." });
        }

        const existing = getTempMusicSession(sessionId) || getPaidMusicSession(sessionId) || {};
        const normalizedPhone = normalizeWhatsAppNumber(customerPhone || existing.customerPhone || "") || "";
        const normalizedEmail = normalizeEmailAddress(customerEmail || existing.customerEmail || "");

        upsertTempMusicSession(sessionId, {
            customerKey: customerKey || existing.customerKey || "",
            clientName: clientName || existing.clientName || "",
            customerPhone: normalizedPhone,
            customerEmail: normalizedEmail,
            title: existing.title || PAYPAL_TITLE,
            subtitle: "Payment started to unlock song production.",
            badge: "Payment started",
            trafficSource: existing.trafficSource || null,
            paypalOrderId: orderId,
            paypalOrderStatus: existing.paypalOrderStatus || null,
        });

        const data = captureData && typeof captureData === "object" ? captureData : null;
        if (!data) {
            return res.status(400).json({ error: "capture_data is required." });
        }

        const status = data?.status || "";
        const captureId = data?.purchase_units?.[0]?.payments?.captures?.[0]?.id || orderId;
        const isPaid = status === "COMPLETED" || (PAYPAL_ENV === "sandbox" && status === "APPROVED");

        if (isPaid) {
            markPaid(sessionId, { paymentId: captureId, status: status === "APPROVED" ? "APPROVED_SANDBOX" : status });
        }

        upsertTempMusicSession(sessionId, {
            paypalOrderId: orderId,
            paypalOrderStatus: status || null,
        });

        return res.json({
            payment_id: captureId,
            status,
            status_detail: data?.purchase_units?.[0]?.payments?.captures?.[0]?.status_details?.reason || null,
            paid: isPaid,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message || "Internal error while processing payment." });
    }
});

app.get("/api/payment/status", async (req, res) => {
    const sessionId = req.query.session_id;
    const stripeSessionId = String(req.query.stripe_session_id || "").trim();
    if (!sessionId) {
        return res.status(400).json({ error: "session_id is required." });
    }
    try {
        await syncPayPalOrderForSession(sessionId, req);
    } catch (error) {
        console.error("Error while syncing PayPal payment status", error);
    }
    try {
        await syncStripeCheckoutForSession(sessionId, req, stripeSessionId);
    } catch (error) {
        console.error("Error while syncing Stripe payment status", error);
    }

    const paid = paidSessions.get(sessionId);
    const tempSession = getTempMusicSession(sessionId);
    const paidSession = getPaidMusicSession(sessionId);
    const session = paidSession || tempSession;
    const isPaid = Boolean(paid?.paid || paidSession?.paid || tempSession?.paid);
    const phone = session?.customerPhone || tempSession?.customerPhone || "";
    const downloadUrl1 = paidSession?.downloadUrl1 || tempSession?.downloadUrl1 || "";
    const downloadUrl2 = paidSession?.downloadUrl2 || tempSession?.downloadUrl2 || "";
    const wallet = phone ? previewCreditWallets.get(phone) : null;
    if (isPaid) {
        const baseUrl = getBaseUrl(req);
        setTimeout(() => {
            sendMusicReadyEmailIfEligible(sessionId, baseUrl).catch((error) => {
                console.error("Erro ao enviar e-mail automatico apos consulta de pagamento", error);
            });
        }, 0);
    }
    return res.json({
        paid: isPaid,
        is_permanent: Boolean(session && !session.expiresAt),
        credits_remaining: wallet ? wallet.credits : null,
        credit_rewarded: Boolean(session?.creditRewarded || paid?.creditRewarded),
        download_url_1: isPaid ? downloadUrl1 : "",
        download_url_2: isPaid ? downloadUrl2 : "",
        paypal_order_id: session?.paypalOrderId || null,
        paypal_order_status: session?.paypalOrderStatus || null,
        stripe_checkout_session_id: session?.stripeCheckoutSessionId || null,
        stripe_checkout_status: session?.stripeCheckoutStatus || null,
        stripe_payment_status: session?.stripePaymentStatus || null,
    });
});
