const WHATSAPP_NUMBER = "5511916609867";

function normalizeVoiceGender(value = "") {
    const normalized = String(value || "").trim().toLowerCase();
    if (["male", "masculina", "masculine", "man"].includes(normalized)) return "male";
    if (["female", "feminina", "feminine", "woman"].includes(normalized)) return "female";
    return "female";
}

function sanitizeLyricsText(value = "") {
    return String(value || "")
        .replace(/\r/g, "")
        .replace(/^\s*(Conte\?do n\?o retornado pelo modelo\.?|Conteúdo não retornado pelo modelo\.?|Content not returned by the model\.?)\s*$/gim, "")
        .replace(/\s*Conte\?do n\?o retornado pelo modelo\.?\s*/gi, "\n")
        .replace(/\s*Conteúdo não retornado pelo modelo\.?\s*/gi, "\n")
        .replace(/\s*Content not returned by the model\.?\s*/gi, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

const OCCASIONS = {
    revelacao: {
        label: "Baby arrival",
        type: "Family",
        intro: "Questions designed to capture anticipation, tenderness, and the emotion of welcoming a new life.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is creating this song?" },
            { id: "parentsNames", label: "Parents' names", type: "text", placeholder: "Example: Olivia and James" },
            { id: "babyMessage", label: "Message for the baby", type: "textarea", placeholder: "What would you love this baby to hear one day?", rows: 4 },
            { id: "specialMoment", label: "What makes this moment special?", type: "textarea", placeholder: "Share the story behind this reveal.", rows: 4 },
            { id: "familyMentions", label: "Any family members to mention?", type: "textarea", placeholder: "Grandparents, siblings, or anyone who should be part of the song.", rows: 3 },
            { id: "siblingsInfo", label: "Will this baby have siblings?", type: "textarea", placeholder: "Tell us if this is the first child or part of a growing family.", rows: 3 },
            { id: "tributeSomeone", label: "Would you like to honour someone special?", type: "textarea", placeholder: "You can include someone dearly missed or deeply loved.", rows: 3 },
            { id: "boyName", label: "Chosen name if it's a boy", type: "text", placeholder: "Example: Theo" },
            { id: "girlName", label: "Chosen name if it's a girl", type: "text", placeholder: "Example: Grace" },
            { id: "emotionStyle", label: "Mood", type: "select", options: ["Emotional", "Delicate", "Joyful", "Hopeful"] }
        ],
        buildPreview: (values) => ({
            badge: "Baby arrival",
            title: `A song for ${values.parentsNames || "this new chapter"}`,
            subtitle: `Preview created from the story shared by ${values.clientName || "you"}.`,
            blocks: [
                { heading: "Verse 1", text: `${values.specialMoment || "Before we even meet you, the room is already full of wonder"} There is love here already, waiting for your first hello.` },
                { heading: "Pre-Chorus", text: `${values.parentsNames || "This family"} is already learning how to wait with open hearts. ${values.siblingsInfo || "The future feels closer now, gentle and bright."}` },
                { heading: "Chorus", text: `${values.boyName || "If you are a boy"} or ${values.girlName || "if you are a girl"}, you are already deeply wanted. ${values.babyMessage || "You are a promise wrapped in love."} ${values.tributeSomeone || "And this moment carries every heart that loves you."}` }
            ]
        })
    },
    aniversario: {
        label: "Birthday",
        type: "Celebration",
        intro: "Perfect for turning memories, affection, and admiration into a warm, celebratory song.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is giving this gift?" },
            { id: "personName", label: "Name of the person being celebrated", type: "text", placeholder: "Example: Charlotte" },
            { id: "age", label: "New age", type: "text", placeholder: "Example: 30" },
            { id: "relationship", label: "Who this person is to you", type: "text", placeholder: "Example: My wife, my mum, my best friend" },
            { id: "favoriteMemory", label: "A memory that should be included", type: "textarea", placeholder: "Share a moment that says who they are.", rows: 4 },
            { id: "admiredTraits", label: "What you admire most", type: "textarea", placeholder: "What makes them unforgettable?", rows: 3 },
            { id: "emotionStyle", label: "Tone", type: "select", options: ["Emotional", "Joyful", "Playful", "Romantic"] }
        ],
        buildPreview: (values) => ({
            badge: "Birthday",
            title: `${values.personName || "Someone special"} deserves a song`,
            subtitle: `A birthday preview with a ${String(values.emotionStyle || "emotional").toLowerCase()} tone.`,
            blocks: [
                { heading: "Verse 1", text: `${values.age || "Another beautiful year"} arrives with the kind of light only ${values.personName || "you"} can bring. ${values.relationship || "The people who love you"} know how deeply you brighten the room.` },
                { heading: "Verse 2", text: `${values.favoriteMemory || "There is a memory that always returns like a smile."} ${values.admiredTraits || "You carry a rare kind of warmth that stays with people."}` },
                { heading: "Chorus", text: `${values.personName || "You"}, may this new chapter return the love you have given so naturally. May there always be joy, tenderness, and beautiful roads ahead.` }
            ]
        })
    },
    homenagem: {
        label: "Tribute",
        type: "Affection",
        intro: "For gratitude, admiration, and honouring someone whose presence shaped your life.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is creating this tribute?" },
            { id: "personName", label: "Name of the person being honoured", type: "text", placeholder: "Example: Margaret" },
            { id: "relationship", label: "Your relationship to them", type: "text", placeholder: "Example: My grandmother, my godfather, my friend" },
            { id: "lifeImpact", label: "How they shaped your life", type: "textarea", placeholder: "Describe the impact they had on your story.", rows: 4 },
            { id: "specialTraits", label: "Qualities that belong in the song", type: "textarea", placeholder: "Strength, kindness, faith, humour, grace...", rows: 3 },
            { id: "emotionStyle", label: "Mood", type: "select", options: ["Deep", "Comforting", "Grateful", "Inspiring"] }
        ],
        buildPreview: (values) => ({
            badge: "Tribute",
            title: `A tribute to ${values.personName || "someone unforgettable"}`,
            subtitle: "A preview shaped to turn gratitude and remembrance into song.",
            blocks: [
                { heading: "Verse 1", text: `${values.personName || "This name"} means more than memory alone. ${values.lifeImpact || "Their presence left something lasting and beautiful behind."}` },
                { heading: "Pre-Chorus", text: `${values.relationship || "This bond"} became a place of shelter, direction, and care.` },
                { heading: "Chorus", text: `This song is a way of saying thank you. ${values.specialTraits || "Their light, strength, and tenderness"} still live inside the life they helped shape.` }
            ]
        })
    },
    "dia-dos-pais": {
        label: "Father's Day",
        type: "Family",
        intro: "Focused on gratitude, legacy, and the quiet ways a father leaves love behind.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is creating this tribute?" },
            { id: "fatherName", label: "Father's name", type: "text", placeholder: "Example: David" },
            { id: "bestMemory", label: "A memory that moves you most", type: "textarea", placeholder: "Share a moment you still carry with you.", rows: 4 },
            { id: "lifeLesson", label: "The greatest lesson he gave you", type: "textarea", placeholder: "What did life with him teach you?", rows: 3 },
            { id: "admiredTraits", label: "The quality that defines him", type: "textarea", placeholder: "Strength, steadiness, care, humour...", rows: 3 },
            { id: "emotionStyle", label: "Tone", type: "select", options: ["Emotional", "Grateful", "Warm", "Inspiring"] }
        ],
        buildPreview: (values) => ({
            badge: "Father's Day",
            title: `For ${values.fatherName || "a remarkable father"}`,
            subtitle: "A family-centred preview built around gratitude and memory.",
            blocks: [
                { heading: "Verse 1", text: `${values.bestMemory || "Some kinds of love protect without needing praise."} A father's presence can stay with us long after the moment has passed.` },
                { heading: "Verse 2", text: `${values.lifeLesson || "His example became part of the way I move through life."}` },
                { heading: "Chorus", text: `${values.fatherName || "Dad"}, this song is a quiet embrace in melody. ${values.admiredTraits || "Your care and strength"} helped make my story steadier and brighter.` }
            ]
        })
    },
    "dia-das-maes": {
        label: "Mother's Day",
        type: "Family",
        intro: "A gentle path for writing a song about care, gratitude, resilience, and love.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is creating this tribute?" },
            { id: "motherName", label: "Mother's name", type: "text", placeholder: "Example: Eleanor" },
            { id: "bestMemory", label: "A memory you never forget", type: "textarea", placeholder: "Tell us about a moment that still lives with you.", rows: 4 },
            { id: "gratitudeMessage", label: "What you want to thank her for", type: "textarea", placeholder: "What must be said in this song?", rows: 3 },
            { id: "admiredTraits", label: "Her strongest quality", type: "textarea", placeholder: "Love, courage, gentleness, steadiness...", rows: 3 },
            { id: "emotionStyle", label: "Mood", type: "select", options: ["Delicate", "Emotional", "Strong", "Comforting"] }
        ],
        buildPreview: (values) => ({
            badge: "Mother's Day",
            title: `A song for ${values.motherName || "a special mother"}`,
            subtitle: "A preview built around tenderness, gratitude, and emotional memory.",
            blocks: [
                { heading: "Verse 1", text: `${values.bestMemory || "Some love learns to care even in silence."} The kind of love that turns ordinary days into something unforgettable.` },
                { heading: "Verse 2", text: `${values.gratitudeMessage || "Thank you for every gesture that held me up."} ${values.admiredTraits || "Your strength and softness"} continue to bloom in who I am.` },
                { heading: "Chorus", text: `${values.motherName || "Mum"}, this song holds what the heart cannot always say fully. Your love was home, guidance, and peace.` }
            ]
        })
    },
    desculpa: {
        label: "Apology",
        type: "Reconnection",
        intro: "Built for sincerity, regret, and the hope of rebuilding something that still matters.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is apologising?" },
            { id: "personName", label: "Their name", type: "text", placeholder: "Example: Amelia" },
            { id: "whatHappened", label: "What happened", type: "textarea", placeholder: "Explain the situation honestly.", rows: 4 },
            { id: "regretMessage", label: "What you need to say", type: "textarea", placeholder: "What words of regret need to be heard?", rows: 3 },
            { id: "hopeMessage", label: "What you hope to rebuild", type: "textarea", placeholder: "Speak about forgiveness, healing, and the future.", rows: 3 },
            { id: "emotionStyle", label: "Tone", type: "select", options: ["Sincere", "Delicate", "Deep", "Hopeful"] }
        ],
        buildPreview: (values) => ({
            badge: "Apology",
            title: `An honest attempt for ${values.personName || "someone you love"}`,
            subtitle: "A draft shaped around vulnerability, truth, and repair.",
            blocks: [
                { heading: "Verse 1", text: `${values.whatHappened || "Some moments leave a silence that feels heavier than words."}` },
                { heading: "Verse 2", text: `${values.regretMessage || "I am coming back without pride, only with honesty."}` },
                { heading: "Chorus", text: `${values.personName || "You"}, if this song reaches the part of you that still has room for me, ${values.hopeMessage || "let it be the beginning of a gentler way back to each other."}` }
            ]
        })
    },
    namoro: {
        label: "Relationship proposal",
        type: "Romance",
        intro: "For romantic songs that build naturally toward asking someone to begin a love story with you.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who will ask the question?" },
            { id: "personName", label: "Their name", type: "text", placeholder: "Example: Sophie" },
            { id: "howMet", label: "How you met", type: "textarea", placeholder: "Tell us where this story began.", rows: 4 },
            { id: "specialMoment", label: "The moment everything changed", type: "textarea", placeholder: "What made your feelings undeniable?", rows: 3 },
            { id: "whatAdmire", label: "What you admire most", type: "textarea", placeholder: "Their energy, smile, kindness, presence...", rows: 3 },
            { id: "emotionStyle", label: "Mood", type: "select", options: ["Romantic", "Sweet", "Surprising", "Emotional"] }
        ],
        buildPreview: (values) => ({
            badge: "Relationship proposal",
            title: `${values.personName || "Someone special"}, will you begin this with me?`,
            subtitle: "A romantic preview designed to turn feeling into a meaningful question.",
            blocks: [
                { heading: "Verse 1", text: `${values.howMet || "Something felt different from the very beginning."}` },
                { heading: "Verse 2", text: `${values.specialMoment || "There was a moment when everything became clear."} ${values.whatAdmire || "Your way of being quietly changed the rhythm of my life."}` },
                { heading: "Chorus", text: `${values.personName || "You"}, if this melody finds you smiling, I want you to know that life became softer and brighter with you in it. Will you be with me?` }
            ]
        })
    },
    "romantic-song": {
        label: "Romantic Song",
        type: "Romance",
        intro: "A timeless romantic song shaped around how your story began, what deepened it, and the details that make this love feel unmistakably yours.",
        fields: [
            { id: "lovedOneName", label: "Name of the loved one", type: "text", placeholder: "Example: Isabella" },
            { id: "clientName", label: "Who is requesting the song?", type: "text", placeholder: "Who is creating this song?" },
            { id: "howMet", label: "How did you meet?", type: "textarea", placeholder: "Tell us how your story began.", rows: 4 },
            { id: "specialMoment", label: "What moment marked your story the most?", type: "textarea", placeholder: "Describe the moment that changed everything.", rows: 4 },
            { id: "whatYouLoveMost", label: "What do you love most about this person?", type: "textarea", placeholder: "Their presence, kindness, energy, smile, way of loving...", rows: 3 },
            { id: "specialDetail", label: "Is there any phrase, nickname or special detail that cannot be left out?", type: "textarea", placeholder: "A nickname, a line you always say, or a tiny detail that belongs only to your story.", rows: 3 },
            { id: "emotionStyle", label: "How would you like the song to feel?", type: "select", options: ["💖 Romantic", "🥹 Emotional", "✨ Poetic"] }
        ],
        buildPreview: (values) => ({
            badge: "Romantic Song",
            title: `A love song for ${values.lovedOneName || "someone unforgettable"}`,
            subtitle: `A romantic preview built from the story shared by ${values.clientName || "you"}.`,
            blocks: [
                { heading: "Verse 1", text: `${values.howMet || "Some stories begin so softly that you only realise later how deeply they changed your life."}` },
                { heading: "Verse 2", text: `${values.specialMoment || "There was a moment when this love stopped feeling like chance and started feeling like home."} ${values.whatYouLoveMost || "There is something about this person that makes the whole world feel gentler."}` },
                { heading: "Chorus", text: `${values.lovedOneName || "You"}, ${values.specialDetail || "there are details in our story that no one else could ever repeat the same way."} This song keeps the tenderness, the feeling, and the quiet certainty of what you mean to me.` }
            ]
        })
    },
    casamento: {
        label: "Marriage proposal",
        type: "Romance",
        intro: "For songs that hold history, courage, tenderness, and the promise of a shared future.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who will ask the question?" },
            { id: "personName", label: "Their name", type: "text", placeholder: "Example: Emily" },
            { id: "coupleStory", label: "A summary of your story together", type: "textarea", placeholder: "Share the path that brought you here.", rows: 4 },
            { id: "turningPoint", label: "The moment it felt like forever", type: "textarea", placeholder: "What memory carries that certainty?", rows: 3 },
            { id: "futureDream", label: "The future you dream about together", type: "textarea", placeholder: "What kind of life do you imagine together?", rows: 3 },
            { id: "emotionStyle", label: "Tone", type: "select", options: ["Romantic", "Grand", "Delicate", "Deep"] }
        ],
        buildPreview: (values) => ({
            badge: "Marriage proposal",
            title: `A promise for ${values.personName || "the love of your life"}`,
            subtitle: "A preview created for a moment that asks for courage, history, and future.",
            blocks: [
                { heading: "Verse 1", text: `${values.coupleStory || "Our story learned to deepen with time."}` },
                { heading: "Verse 2", text: `${values.turningPoint || "There was a moment when the future stopped feeling abstract."}` },
                { heading: "Chorus", text: `${values.personName || "My love"}, if forever has a beginning, I want it to begin beside you. ${values.futureDream || "A lifetime of partnership, warmth, and truth."} Will you marry me?` }
            ]
        })
    },
    letraPronta: {
        label: "I already have the lyrics",
        type: "Ready lyrics",
        intro: "Paste your lyrics and choose the voice and style to generate the song without filling in the questionnaire.",
        ownLyrics: true,
        fields: []
    }
};

const occasionGrid = document.getElementById("occasionGrid");
const form = document.getElementById("musicBuilderForm");
const formTitle = document.getElementById("formTitle");
const formIntro = document.getElementById("formIntro");
const dynamicFields = document.getElementById("dynamicFields");
const formActions = document.getElementById("formActions");
const resultEmpty = document.getElementById("resultEmpty");
const resultContent = document.getElementById("resultContent");
const resultBadge = document.getElementById("resultBadge");
const resultTitle = document.getElementById("resultTitle");
const resultSubtitle = document.getElementById("resultSubtitle");
const lyricsOutput = document.getElementById("lyricsOutput");
const whatsappBriefLink = document.getElementById("whatsappBriefLink");
const restartBuilder = document.getElementById("restartBuilder");
const floatingCta = document.querySelector(".floating-cta");
const builderStatus = document.getElementById("builderStatus");
const progressTracker = document.getElementById("progressTracker");
const progressSteps = document.getElementById("progressSteps");
const progressTitle = document.getElementById("progressTitle");
const progressSubtitle = document.getElementById("progressSubtitle");
const progressFill = document.getElementById("progressFill");
let isMusicGenerating = false;
let hasMusicReady = false;

let downloadUrl1 = "";
let downloadUrl2 = "";
let previewUrl1 = "";
let previewUrl2 = "";
let paymentApproved = false;
let previewPlaybackUnlocked = true;
const LOCAL_LIBRARY_KEY = "ss_music_library_cache";
const LOCAL_LIBRARY_TTL_MS = 24 * 60 * 60 * 1000;
const customerLibraryKey = (() => {
    const key = "ss_customer_library_key";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = "customer_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    localStorage.setItem(key, id);
    return id;
})();
const CURRENT_SESSION_KEY = "ss_current_music_session";
const TRAFFIC_SOURCE_KEY = "ss_traffic_source";
let currentMusicSessionId = localStorage.getItem(CURRENT_SESSION_KEY) || "";

let currentOccasionKey = null;
let lastFormValues = {};
let lastOccasionConfig = null;

function createMusicSessionId() {
    return "ss_" + Date.now() + "_" + Math.random().toString(16).slice(2);
}

function setCurrentMusicSessionId(sessionId) {
    currentMusicSessionId = sessionId;
    if (sessionId) {
        localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    } else {
        localStorage.removeItem(CURRENT_SESSION_KEY);
    }
}

function buildLibraryUrl({ sessionId = currentMusicSessionId, paymentStatus = "sucesso" } = {}) {
    const params = new URLSearchParams();
    if (paymentStatus) params.set("pagamento", paymentStatus);
    if (sessionId) params.set("session_id", sessionId);
    if (customerLibraryKey) params.set("customer_key", customerLibraryKey);
    const phone = getNormalizedPreviewPhone();
    if (phone) params.set("customer_phone", phone);
    return `/my-songs?${params.toString()}`;
}

function redirectToLibraryPage(options = {}) {
    window.location.assign(buildLibraryUrl(options));
}

function escapeHtml(value) {
    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function getTrafficSource() {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
    const current = keys.reduce((acc, key) => {
        const value = params.get(key);
        if (value) acc[key] = value;
        return acc;
    }, {});

    if (Object.keys(current).length) {
        const source = {
            ...current,
            landing_page: window.location.href,
            captured_at: new Date().toISOString(),
        };
        localStorage.setItem(TRAFFIC_SOURCE_KEY, JSON.stringify(source));
        return source;
    }

    try {
        return JSON.parse(localStorage.getItem(TRAFFIC_SOURCE_KEY) || "{}");
    } catch (error) {
        return {};
    }
}

const trafficSource = getTrafficSource();

function getLocalLibraryItems() {
    try {
        const raw = localStorage.getItem(LOCAL_LIBRARY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];
        const now = Date.now();
        const filtered = parsed.filter((item) => {
            const expiresAt = new Date(item?.expires_at || 0).getTime();
            return item?.session_id && expiresAt > now;
        });
        if (filtered.length !== parsed.length) {
            localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(filtered));
        }
        return filtered;
    } catch (error) {
        return [];
    }
}

function saveLocalLibraryItems(items) {
    try {
        const raw = localStorage.getItem(LOCAL_LIBRARY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        const preserved = Array.isArray(parsed)
            ? parsed.filter((entry) => !items.some((item) => item?.session_id === entry?.session_id))
            : [];
        localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify([...items, ...preserved]));
    } catch (error) {
        localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(items));
    }
}

function upsertLocalLibraryItem(item) {
    if (!item?.session_id) return;
    const items = getLocalLibraryItems();
    const existing = items.find((entry) => entry.session_id === item.session_id) || {};
    const nextItems = [
        {
            ...existing,
            ...item,
            paid: Boolean(item.paid),
            download_url_1: item.paid ? item.download_url_1 || existing.download_url_1 || "" : "",
            download_url_2: item.paid ? item.download_url_2 || existing.download_url_2 || "" : "",
            preview_url_1: item.preview_url_1 || item.download_url_1 || existing.preview_url_1 || existing.download_url_1 || "",
            preview_url_2: item.preview_url_2 || item.download_url_2 || existing.preview_url_2 || existing.download_url_2 || "",
            updated_at: item.updated_at || new Date().toISOString(),
        },
        ...items.filter((entry) => entry.session_id !== item.session_id),
    ];
    saveLocalLibraryItems(nextItems);
}

function buildLocalLibraryItem(payload = {}) {
    const nowIso = new Date().toISOString();
    return {
        session_id: currentMusicSessionId,
        customer_key: customerLibraryKey,
        traffic_source: payload.traffic_source || trafficSource,
        title: payload.title || resultTitle?.textContent || "Your song is ready",
        subtitle: payload.subtitle || "We restored your temporary session so you can continue where you left off.",
        badge: payload.badge || resultBadge?.textContent || "Song ready",
        client_name: payload.client_name || lastFormValues?.clientName || "",
        customer_phone: payload.customer_phone || getNormalizedPreviewPhone() || "",
        customer_email: payload.customer_email || getNormalizedPreviewEmail() || "",
        occasion: payload.occasion || lastOccasionConfig?.label || "",
        style: payload.style || (musicStyle ? musicStyle.value : ""),
        voice_gender: normalizeVoiceGender(payload.voice_gender || voiceGender?.value),
        lyrics: payload.lyrics || getEditedLyricsText() || "",
        paid: Boolean(payload.paid),
        preview_url_1: payload.preview_url_1 || previewUrl1 || payload.download_url_1 || downloadUrl1,
        preview_url_2: payload.preview_url_2 || previewUrl2 || payload.download_url_2 || downloadUrl2,
        preview_locked: payload.preview_locked ?? !previewPlaybackUnlocked,
        download_url_1: payload.paid ? payload.download_url_1 || downloadUrl1 : "",
        download_url_2: payload.paid ? payload.download_url_2 || downloadUrl2 : "",
        created_at: payload.created_at || nowIso,
        updated_at: nowIso,
        expires_at: payload.expires_at || new Date(Date.now() + LOCAL_LIBRARY_TTL_MS).toISOString(),
        paid_at: payload.paid_at || null,
        is_permanent: false,
    };
}

function getApiBaseUrl() {
    const { protocol, hostname, port, origin } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    const isFileProtocol = protocol === "file:";

    // In local development, force API calls to the Node server even if the page
    // was opened by another static server or directly from disk.
    if (isFileProtocol || (isLocalHost && port && port !== "3000")) {
        return "http://localhost:3000";
    }

    return origin;
}

function apiUrl(path) {
    return `${getApiBaseUrl()}${path}`;
}

async function saveGeneratedMusicSession(payload) {
    const response = await fetch(apiUrl("/api/music-session/save"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            session_id: currentMusicSessionId,
            customer_key: customerLibraryKey,
            traffic_source: trafficSource,
            ...payload,
        }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "We could not save the temporary song session.");
    }

    return response.json();
}

async function fetchGeneratedMusicSession() {
    if (!currentMusicSessionId) return null;
    const response = await fetch(apiUrl(`/api/music-session?session_id=${encodeURIComponent(currentMusicSessionId)}`));
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        return null;
    }

    return data;
}

function setStatus(message, isError = false) {
    if (!builderStatus) return;

    if (!message) {
        builderStatus.hidden = true;
        builderStatus.textContent = "";
        builderStatus.classList.remove("is-error");
        return;
    }

    builderStatus.hidden = false;
    builderStatus.textContent = message;
    builderStatus.classList.toggle("is-error", isError);
}
function setProgress(step, title, subtitle, percent) {
    if (!progressTracker) return;
    const steps = progressSteps ? progressSteps.querySelectorAll(".progress-step") : [];
    steps.forEach((item) => {
        const stepNumber = Number(item.dataset.step || 0);
        item.classList.toggle("is-active", stepNumber === step);
        item.classList.toggle("is-complete", stepNumber < step);
    });

    if (progressTitle) progressTitle.textContent = title || "";
    if (progressSubtitle) progressSubtitle.textContent = subtitle || "";
    if (progressFill && typeof percent === "number") {
        progressFill.style.width = `${Math.min(100, Math.max(5, percent))}%`;
    }
}
function createFieldMarkup(field) {
    const baseLabel = `<label for="${field.id}">${field.label}</label>`;

    if (field.type === "textarea") {
        return `
            <div class="form-row">
                ${baseLabel}
                <textarea id="${field.id}" name="${field.id}" rows="${field.rows || 4}" placeholder="${field.placeholder || ""}" required></textarea>
            </div>
        `;
    }

    if (field.type === "select") {
        const options = field.options.map((option) => `<option value="${option}">${option}</option>`).join("");
        return `
            <div class="form-row">
                ${baseLabel}
                <select id="${field.id}" name="${field.id}" required>
                    <option value="" selected disabled>Select</option>
                    ${options}
                </select>
            </div>
        `;
    }

    return `
        <div class="form-row">
            ${baseLabel}
            <input id="${field.id}" name="${field.id}" type="${field.type || "text"}" placeholder="${field.placeholder || ""}" required>
        </div>
    `;
}

function renderOccasionCards() {
    occasionGrid.innerHTML = Object.entries(OCCASIONS)
        .map(([key, config]) => `
            <button class="occasion-card" type="button" data-occasion="${key}">
                ${config.image ? `<span class="occasion-card-media"><img src="${config.image}" alt="${config.label}"></span>` : ""}
                <span class="occasion-type">${config.type}</span>
                <h3>${config.label}</h3>
                <p>${config.intro}</p>
                <span class="occasion-cta">Choose <i class="fa-solid fa-arrow-right"></i></span>
            </button>
        `)
        .join("");

    occasionGrid.querySelectorAll(".occasion-card").forEach((button) => {
        button.addEventListener("click", () => {
            const selectedKey = button.dataset.occasion;
            const selectedConfig = OCCASIONS[selectedKey];
            trackGa("occasion_select", {
                page: "fazer-minha-musica",
                occasion: selectedConfig?.label || selectedKey || "desconhecida",
            });
            selectOccasion(selectedKey);
        });
    });
}

function setFloatingCtaHiddenOnMobile(isHidden) {
    if (!floatingCta) return;
    floatingCta.classList.toggle("is-hidden-mobile", isHidden);
}

function renderOwnLyricsFlow(config) {
    lastOccasionConfig = config;
    lastFormValues = {
        clientName: lastFormValues?.clientName || "",
        ownLyricsText: lastFormValues?.ownLyricsText || "",
    };

    formTitle.textContent = config.label;
    formIntro.textContent = "Paste your lyrics below, then choose the musical style and voice to generate your song.";
    dynamicFields.classList.remove("empty-state");
    dynamicFields.innerHTML = "";
    dynamicFields.innerHTML = `
        <div class="form-row">
            <label for="ownLyricsClientName">Your name</label>
            <input id="ownLyricsClientName" name="ownLyricsClientName" type="text" placeholder="Who is creating this song?" value="${escapeHtml(lastFormValues.clientName || "")}" required>
        </div>
        <div class="form-row own-lyrics-row">
            <label for="ownLyricsText">Song lyrics</label>
            <textarea id="ownLyricsText" class="lyrics-editor own-lyrics-editor" name="ownLyricsText" rows="18" placeholder="Paste your lyrics here.">${escapeHtml(lastFormValues.ownLyricsText || "")}</textarea>
        </div>
    `;
    formActions.hidden = true;

    resultBadge.textContent = "Lyrics provided by you";
    resultTitle.textContent = "Now choose the style and voice";
    resultSubtitle.textContent = "Your lyrics will be used as the foundation for the complete song.";
    lyricsOutput.innerHTML = "";
    resultEmpty.hidden = true;
    resultContent.hidden = false;
    resultContent.classList.add("own-lyrics-mode");
    resetGeneratedMusicState({ clearSession: true });

    if (musicGenPanel) {
        musicGenPanel.hidden = false;
    }

    dynamicFields.querySelector("#ownLyricsClientName")?.addEventListener("input", (event) => {
        lastFormValues.clientName = event.target.value.trim();
    });
    dynamicFields.querySelector("#ownLyricsText")?.addEventListener("input", (event) => {
        lastFormValues.ownLyricsText = event.target.value;
    });

    updateWhatsAppLink();
    setFloatingCtaHiddenOnMobile(true);
    setProgress(3, "Lyrics ready to become a song", "Choose the style and voice to generate your song.", 78);

    const builderTarget = document.getElementById("builderStart");
    const ownLyricsTextField = dynamicFields.querySelector("#ownLyricsText");
    (builderTarget || dynamicFields).scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
        if (!ownLyricsTextField) return;
        try {
            ownLyricsTextField.focus({ preventScroll: true });
        } catch (error) {
            ownLyricsTextField.focus();
        }
    }, 420);
}

function selectOccasion(key) {
    const config = OCCASIONS[key];
    if (!config) return;

    currentOccasionKey = key;

    occasionGrid.querySelectorAll(".occasion-card").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.occasion === key);
    });

    if (config.ownLyrics) {
        renderOwnLyricsFlow(config);
        return;
    }

    setFloatingCtaHiddenOnMobile(true);

    if (resultContent?.classList.contains("own-lyrics-mode")) {
        resultContent.classList.remove("own-lyrics-mode");
        resultContent.hidden = true;
        resultEmpty.hidden = false;
    }

    formTitle.textContent = `Questionnaire for ${config.label}`;
    formIntro.textContent = config.intro;
    dynamicFields.classList.remove("empty-state");
    dynamicFields.innerHTML = config.fields.map(createFieldMarkup).join("");
    formActions.hidden = false;
    dynamicFields.scrollIntoView({ behavior: "smooth", block: "start" });
    setProgress(1, "Details in progress", "Complete the questionnaire so we can shape your lyrics.", 25);
}

function getEditedLyricsText() {
    const field = document.querySelector("#ownLyricsText") || document.querySelector(".lyrics-editor");
    return field ? field.value.trim() : "";
}

function updateWhatsAppLink() {
    if (!lastOccasionConfig) return;

    const lines = [];
    lines.push("I am creating a song on the site and would love some help.");
    const message = encodeURIComponent(lines.join(""));
    whatsappBriefLink.href = `https://wa.me/${lastOccasionConfig.whatsappNumber || WHATSAPP_NUMBER}?text=${message}`;
}

if (whatsappBriefLink) {
    whatsappBriefLink.addEventListener("click", () => {
        trackPixel("Contact", {
            content_name: "WhatsApp",
            content_category: lastOccasionConfig?.label || "Create my song",
        });
        trackGa("contato_whatsapp", {
            page: "fazer-minha-musica",
            occasion: lastOccasionConfig?.label || "Create my song",
            link_url: whatsappBriefLink.href,
        });
    });
}

function getFieldMap(config, values) {
    return config.fields.reduce((accumulator, field) => {
        accumulator[field.label] = values[field.id] || "";
        return accumulator;
    }, {});
}

async function generateLyricsWithApi(config, values) {
    const response = await fetch(apiUrl("/api/generate-lyrics"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            occasionKey: currentOccasionKey,
            occasionLabel: config.label,
            style: values.emotionStyle || values.style || "Emocionante e profissional",
            fields: getFieldMap(config, values),
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "We could not generate the lyrics right now.");
    }

    return {
        badge: config.label,
        title: `Lyrics created for ${config.label}`,
        subtitle: "Created from the answers shared in your questionnaire.",
        blocks: data.blocks,
    };
}

function formatLyricsBlocksForEditor(blocks = []) {
    return blocks
        .map((block) => {
            const heading = String(block?.heading || "").trim();
            const text = sanitizeLyricsText(block?.text || "");
            if (!heading && !text) return "";
            if (!heading) return text;
            return `[${heading}]\n${text}`.trim();
        })
        .filter(Boolean)
        .join("\n\n");
}

function renderPreview(preview, config, values) {
    lastFormValues = values;
    lastOccasionConfig = config;
    resultContent.classList.remove("own-lyrics-mode");

    resultBadge.textContent = preview.badge;
    resultTitle.textContent = preview.title;
    resultSubtitle.textContent = preview.subtitle;
    const fullLyrics = formatLyricsBlocksForEditor(preview.blocks);

    lyricsOutput.innerHTML = `
        <div class="lyrics-block lyrics-block-single">
            <textarea class="lyrics-editor lyrics-editor-single" rows="18">${fullLyrics}</textarea>
        </div>
    `;

    const editor = lyricsOutput.querySelector(".lyrics-editor");
    if (editor) {
        editor.addEventListener("input", updateWhatsAppLink);
    }

    updateWhatsAppLink();
    setFloatingCtaHiddenOnMobile(true);
    resultEmpty.hidden = true;
    resultContent.hidden = false;
    resultContent.scrollIntoView({ behavior: "smooth", block: "start" });
    resetGeneratedMusicState({ clearSession: true });
    if (musicGenPanel) {
        musicGenPanel.hidden = false;
    }
}

async function hydrateSavedMusicSession(session) {
    const restoredPreviewUrl1 = session?.preview_url_1 || session?.download_url_1 || "";
    const restoredPreviewUrl2 = session?.preview_url_2 || session?.download_url_2 || "";
    if (!restoredPreviewUrl1 || !restoredPreviewUrl2) return;

    setCurrentMusicSessionId(session.session_id || currentMusicSessionId);
    paymentApproved = Boolean(session.paid);
    previewPlaybackUnlocked = paymentApproved || !Boolean(session.preview_locked);
    previewUrl1 = restoredPreviewUrl1;
    previewUrl2 = restoredPreviewUrl2;
    downloadUrl1 = paymentApproved ? session.download_url_1 || "" : "";
    downloadUrl2 = paymentApproved ? session.download_url_2 || "" : "";
    hasMusicReady = true;

    if (resultBadge) resultBadge.textContent = session.badge || "Song ready";
    if (resultTitle) resultTitle.textContent = session.title || "Your song is ready";
    if (resultSubtitle) resultSubtitle.textContent = session.subtitle || "We restored your temporary session so you can continue.";

    if (lyricsOutput) {
        const restoredLyrics = sanitizeLyricsText(session.lyrics || "");
        lyricsOutput.innerHTML = restoredLyrics
            ? `
                <div class="lyrics-block lyrics-block-single">
                    <textarea class="lyrics-editor lyrics-editor-single" rows="18">${restoredLyrics}</textarea>
                </div>
            `
            : "";
    }

    if (musicStyle && session.style) {
        musicStyle.value = session.style;
    }

    if (voiceGender && session.voice_gender) {
        voiceGender.value = normalizeVoiceGender(session.voice_gender);
    }

    if (previewPhone && session.customer_phone) {
        previewPhone.value = session.customer_phone;
    }

    if (previewEmail && session.customer_email) {
        previewEmail.value = session.customer_email;
    }

    if (currentOccasionKey === "letraPronta") {
        const ownLyricsClientName = dynamicFields?.querySelector("#ownLyricsClientName");
        const ownLyricsText = dynamicFields?.querySelector("#ownLyricsText");

        if (ownLyricsClientName && session.client_name) {
            ownLyricsClientName.value = session.client_name;
        }
        if (ownLyricsText && session.lyrics) {
            ownLyricsText.value = session.lyrics;
        }
        lastFormValues.clientName = session.client_name || "";
        lastFormValues.ownLyricsText = session.lyrics || "";
    }

    applyPreviewPlaybackState();

    if (previewPlaybackUnlocked || paymentApproved) {
        await Promise.all([
            waitForAudioReady(previewAudio1),
            waitForAudioReady(previewAudio2),
        ]);
    }

    if (resultEmpty) resultEmpty.hidden = true;
    if (resultContent) resultContent.hidden = false;
    setFloatingCtaHiddenOnMobile(true);
    if (musicGenPanel) musicGenPanel.hidden = false;
    if (musicPreviews) musicPreviews.hidden = false;
    if (musicDownloads) musicDownloads.hidden = false;
    if (buyPreviewCreditBtn) buyPreviewCreditBtn.hidden = paymentApproved;
    if (musicUnlockWarning) musicUnlockWarning.hidden = paymentApproved || previewPlaybackUnlocked;
    updatePaidDownloadActions();

    setProgress(3, "Session restored", "We found your saved session so you can continue.", 100);
    setMusicStatus(paymentApproved
        ? "We found your song. Your download is already available."
        : previewPlaybackUnlocked
            ? "We found your song. Your previews are ready and you can continue to payment when you are ready."
            : "We found your song. Your previews are ready and will be released for listening after payment.");

    upsertLocalLibraryItem(buildLocalLibraryItem({
        session_id: session.session_id,
        title: session.title,
        subtitle: session.subtitle,
        badge: session.badge,
        client_name: session.client_name,
        customer_phone: session.customer_phone,
        occasion: session.occasion,
        style: session.style,
        voice_gender: session.voice_gender,
        lyrics: session.lyrics,
        paid: paymentApproved,
        preview_locked: !previewPlaybackUnlocked,
        preview_url_1: restoredPreviewUrl1,
        preview_url_2: restoredPreviewUrl2,
        download_url_1: paymentApproved ? session.download_url_1 : "",
        download_url_2: paymentApproved ? session.download_url_2 : "",
        created_at: session.created_at,
        expires_at: session.expires_at,
        paid_at: session.paid_at,
        is_permanent: session.is_permanent,
    }));
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!currentOccasionKey) return;

    const config = OCCASIONS[currentOccasionKey];
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());
    const submitButton = form.querySelector('button[type="submit"]');
    const originalLabel = submitButton ? submitButton.textContent : "";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Generating lyrics...";
    }

    setStatus("We are creating your personalised lyrics. This may take a few seconds.");
        setProgress(2, "Creating your lyrics", "Refining the composition...", 55);
    let lyricsStatusInterval = startLyricsStatusLoop();
    trackGa("generate_lyrics", {
        page: "fazer-minha-musica",
        occasion: config.label,
    });

    try {
        const preview = await generateLyricsWithApi(config, values);
        stopLyricsStatusLoop(lyricsStatusInterval);
        renderPreview(preview, config, values);
        setProgress(2, "Lyrics ready", "Review the lyrics and continue to song creation.", 70);
        setStatus("Your lyrics are ready. You can refine any lines before generating the full song.");
        trackPixel("Lead", { content_name: config.label || "Create my song", value: 1, currency: "GBP" });
    } catch (error) {
        stopLyricsStatusLoop(lyricsStatusInterval);
        setProgress(2, "Lyrics unavailable", "The lyric service did not respond just now. Please try again.", 50);
        setStatus(error.message || "We could not generate the lyrics right now. Please try again.", true);
    } finally {
        stopLyricsStatusLoop(lyricsStatusInterval);
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalLabel;
        }
    }
});

restartBuilder.addEventListener("click", () => {
    currentOccasionKey = null;
    lastFormValues = {};
    lastOccasionConfig = null;
    hasTrackedFormStart = false;
    setFloatingCtaHiddenOnMobile(false);
    form.reset();
    formTitle.textContent = "Choose an occasion to begin";
    formIntro.textContent = "Once you choose an option, we will load the right questions for this kind of song.";
    dynamicFields.classList.add("empty-state");
    dynamicFields.innerHTML = `
        <div class="placeholder-block">
            <i class="fa-solid fa-sliders"></i>
            <p>Your guided questions will appear here once you choose an occasion.</p>
        </div>
    `;
    formActions.hidden = true;
    resultContent.hidden = true;
    resultEmpty.hidden = false;
    if (musicGenPanel) {
        musicGenPanel.hidden = true;
    }
    occasionGrid.querySelectorAll(".occasion-card").forEach((button) => button.classList.remove("is-active"));
    setProgress(1, "Begin with the details", "Choose the occasion and answer the questionnaire to get started.", 18);
    window.scrollTo({ top: 0, behavior: "smooth" });
});
function initReveal() {
    const revealTargets = document.querySelectorAll(".reveal");
    const staggerTargets = document.querySelectorAll(".reveal-stagger");

    const observer = new IntersectionObserver(
        (entries, currentObserver) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("is-visible");
                currentObserver.unobserve(entry.target);
            });
        },
        {
            threshold: 0.12,
            rootMargin: "0px 0px -40px 0px"
        }
    );

    revealTargets.forEach((element) => observer.observe(element));
    staggerTargets.forEach((element) => observer.observe(element));
}

function init3DEffects() {
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduceMotion) return;

    const tiltTargets = document.querySelectorAll(".occasion-card");

    tiltTargets.forEach((element) => {
        element.addEventListener("pointermove", (event) => {
            const rect = element.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            const rotateY = (x - 0.5) * 18;
            const rotateX = (0.5 - y) * 14;

            element.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
            element.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
            element.style.setProperty("--glow-x", `${(x * 100).toFixed(1)}%`);
            element.style.setProperty("--glow-y", `${(y * 100).toFixed(1)}%`);
        });

        element.addEventListener("pointerleave", () => {
            element.style.setProperty("--tilt-x", "0deg");
            element.style.setProperty("--tilt-y", "0deg");
            element.style.setProperty("--glow-x", "50%");
            element.style.setProperty("--glow-y", "20%");
        });
    });
}

async function restoreGeneratedMusicSession() {
    try {
        const localItems = getLocalLibraryItems();
        const localCurrent = currentMusicSessionId
            ? localItems.find((item) => item.session_id === currentMusicSessionId)
            : null;

        if (localCurrent) {
            await hydrateSavedMusicSession(localCurrent);
            return;
        }

        const session = await fetchGeneratedMusicSession();
        if (!session) return;
        await hydrateSavedMusicSession(session);
    } catch (error) {
        console.error("We could not restore the temporary song session.", error);
    }
}

function initPromoCountdown() {
    const promoBadge = document.querySelector(".price-countdown");
    const labelEl = document.getElementById("promoCountdownLabel");
    const timerEl = document.getElementById("promoCountdownTimer");
    if (!promoBadge || !labelEl || !timerEl) return;

    const deadline = new Date("2026-06-01T00:00:00-03:00");

    const updateCountdown = () => {
        const diff = deadline.getTime() - Date.now();

        if (diff <= 0) {
            labelEl.textContent = "Mother's Day special offer";
            timerEl.textContent = "Valid until May 31, 2026 · ended";
            return;
        }

        const totalSeconds = Math.floor(diff / 1000);
        const totalHours = diff / (1000 * 60 * 60);
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        labelEl.textContent = "Mother's Day special offer";
        const dayLabel = days > 0 ? `${days}d ` : "";
        timerEl.textContent = `Valid until May 31, 2026 · ${dayLabel}${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s left`;
    };

    updateCountdown();
    window.setInterval(updateCountdown, 1000);
}

initPromoCountdown();
renderOccasionCards();
initReveal();
init3DEffects();
setProgress(1, "Begin with the details", "Choose the occasion and answer the questionnaire to get started.", 18);
restoreGeneratedMusicSession();
function trackPixel(eventName, data) {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", eventName, data || {});
}

function trackGa(eventName, params) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", eventName, params || {});
}

document.querySelectorAll('a[href="#occasionStart"]').forEach((link) => {
    link.addEventListener("click", () => {
        trackGa("click_cta", {
            page: "fazer-minha-musica",
            label: link.textContent?.trim() || "Create my song",
        });
    });
});

let hasTrackedFormStart = false;
form?.addEventListener("input", () => {
    if (hasTrackedFormStart) return;
    hasTrackedFormStart = true;
    trackGa("form_start", {
        page: "fazer-minha-musica",
        occasion: lastOccasionConfig?.label || currentOccasionKey || "",
    });
});

const CHECKOUT_VALUE = 14.99;
const CHECKOUT_ITEM = {
    item_id: "memory-tune-personalised-song",
    item_name: "Memory Tune personalised song",
    price: CHECKOUT_VALUE,
    quantity: 1,
};

function buildCheckoutAnalyticsParams(extra = {}) {
    return {
        currency: "GBP",
        value: CHECKOUT_VALUE,
        items: [CHECKOUT_ITEM],
        page: "fazer-minha-musica",
        ...extra,
    };
}



const musicGenPanel = document.getElementById("musicGenPanel");
const musicStyle = document.getElementById("musicStyle");
const musicDuration = document.getElementById("musicDuration");
const musicVocal = document.getElementById("musicVocal");
const voiceGenderRow = document.getElementById("voiceGenderRow");
const voiceGender = document.getElementById("voiceGender");
let previewPhone = document.getElementById("previewPhone");
let testModeBadge = document.getElementById("testModeBadge");
const generateMusicBtn = document.getElementById("generateMusicBtn");
let buyPreviewCreditBtn = document.getElementById("buyPreviewCreditBtn");
const musicGenStatus = document.getElementById("musicGenStatus");
const musicLeaveWarning = document.getElementById("musicLeaveWarning");
const musicUnlockWarning = document.getElementById("musicUnlockWarning");
const musicDownloads = document.getElementById("musicDownloads");
const downloadBothBtn = document.getElementById("downloadBothBtn");
const downloadVersion1Btn = document.getElementById("downloadVersion1Btn");
const downloadVersion2Btn = document.getElementById("downloadVersion2Btn");
const confirmPaymentBtn = document.getElementById("confirmPaymentBtn");
const musicPreviews = document.getElementById("musicPreviews");
const previewAudio1 = document.getElementById("previewAudio1");
const previewAudio2 = document.getElementById("previewAudio2");
const previewUnlockNote = musicPreviews?.querySelector(".preview-unlock-note");
let previewEmail = document.getElementById("previewEmail");
const isTestMode = new URLSearchParams(window.location.search).get("test") === "true";
let shouldWarnBeforeUnload = false;

function ensurePreviewCreditFields() {
    if (!generateMusicBtn) return;

    const actions = generateMusicBtn.closest(".musicgen-actions");
    if (!previewPhone) {
        const creditBox = document.createElement("div");
        creditBox.className = "preview-credit-box";
        creditBox.innerHTML = `
            <label for="previewPhone">To unlock your complimentary preview, enter your WhatsApp number</label>
            <input id="previewPhone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Example: +44 7700 900123">
            <small>We only use this to deliver your song and help you find it again later.</small>
            <span id="testModeBadge" class="test-mode-badge" hidden>Test mode active</span>
        `;
        actions?.parentNode?.insertBefore(creditBox, actions);
        previewPhone = document.getElementById("previewPhone");
        testModeBadge = document.getElementById("testModeBadge");
    }

    if (!buyPreviewCreditBtn && actions) {
        buyPreviewCreditBtn = document.createElement("button");
        buyPreviewCreditBtn.id = "buyPreviewCreditBtn";
        buyPreviewCreditBtn.type = "button";
        buyPreviewCreditBtn.className = "btn btn-outline";
        buyPreviewCreditBtn.hidden = true;
        buyPreviewCreditBtn.textContent = "Unlock my full song for £14.99";
        generateMusicBtn.insertAdjacentElement("afterend", buyPreviewCreditBtn);
    }
}

ensurePreviewCreditFields();

function resetGeneratedMusicState({ clearSession = false } = {}) {
    isMusicGenerating = false;
    hasMusicReady = false;
    paymentApproved = false;
    previewPlaybackUnlocked = true;
    previewUrl1 = "";
    previewUrl2 = "";
    downloadUrl1 = "";
    downloadUrl2 = "";

    if (clearSession) {
        setCurrentMusicSessionId("");
    }

    if (musicDownloads) musicDownloads.hidden = true;
    if (musicPreviews) musicPreviews.hidden = true;
    if (buyPreviewCreditBtn) buyPreviewCreditBtn.hidden = true;
    if (musicUnlockWarning) musicUnlockWarning.hidden = true;
    if (confirmPaymentBtn) confirmPaymentBtn.hidden = true;
    if (downloadBothBtn) {
        downloadBothBtn.textContent = "Unlock my full song for £14.99";
        downloadBothBtn.classList.remove("is-waiting", "is-ready");
        downloadBothBtn.disabled = false;
    }
    if (downloadVersion1Btn) downloadVersion1Btn.hidden = true;
    if (downloadVersion2Btn) downloadVersion2Btn.hidden = true;
    if (previewAudio1) previewAudio1.src = "";
    if (previewAudio2) previewAudio2.src = "";
    applyPreviewPlaybackState();
    setMusicStatus("");
}

if (testModeBadge) {
    testModeBadge.hidden = !isTestMode;
}

function normalizePreviewPhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    return digits.slice(0, 15);
}

function isValidPreviewPhone(phone) {
    return /^\d{10,15}$/.test(phone);
}

function getNormalizedPreviewPhone() {
    return normalizePreviewPhone(previewPhone?.value || "");
}

function getNormalizedPreviewEmail() {
    return String(previewEmail?.value || "").trim().toLowerCase();
}

function isValidPreviewEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePreviewPhone() {
    const phone = getNormalizedPreviewPhone();
    if (isTestMode) return phone || "447700900123";
    if (!isValidPreviewPhone(phone)) {
        throw new Error("To unlock your complimentary preview, enter a valid WhatsApp number with country code.");
    }
    return phone;
}

function validatePreviewEmail() {
    const email = getNormalizedPreviewEmail();
    if (!email) {
        throw new Error("Enter your email address to receive your song.");
    }
    if (!isValidPreviewEmail(email)) {
        throw new Error("Enter a valid email address to receive your song.");
    }
    return email;
}

function setMusicStatus(message, isError = false) {
    if (!musicGenStatus) return;
    if (!message) {
        musicGenStatus.hidden = true;
        musicGenStatus.textContent = "";
        musicGenStatus.classList.remove("is-error");
        musicGenStatus.classList.remove("is-loading");
        return;
    }
    musicGenStatus.hidden = false;
    musicGenStatus.textContent = message;
    musicGenStatus.classList.toggle("is-error", isError);
    if (isError) {
        if (musicDownloads) musicDownloads.hidden = true;
        if (musicPreviews) musicPreviews.hidden = true;
        if (previewAudio1) previewAudio1.src = "";
        if (previewAudio2) previewAudio2.src = "";
        previewUrl1 = "";
        previewUrl2 = "";
        downloadUrl1 = "";
        downloadUrl2 = "";
    }
}

function setMusicGeneratingState(isGenerating) {
    shouldWarnBeforeUnload = isGenerating;
    if (musicGenPanel) {
        musicGenPanel.classList.toggle("is-generating", isGenerating);
    }
    if (musicGenStatus) {
        musicGenStatus.classList.toggle("is-loading", isGenerating);
        musicGenStatus.setAttribute("aria-live", "polite");
        musicGenStatus.setAttribute("role", "status");
    }
    if (generateMusicBtn) {
        generateMusicBtn.hidden = isGenerating;
        generateMusicBtn.disabled = isGenerating;
    }
    if (musicLeaveWarning) {
        musicLeaveWarning.hidden = !isGenerating;
    }
    if (isGenerating && musicUnlockWarning) {
        musicUnlockWarning.hidden = true;
    }
    [musicStyle, musicDuration, musicVocal, voiceGender, previewPhone, previewEmail].forEach((control) => {
        if (control) control.disabled = isGenerating;
    });
}

window.addEventListener("beforeunload", (event) => {
    if (!shouldWarnBeforeUnload) return;
    event.preventDefault();
    event.returnValue = "";
});

function triggerDownload(url) {
    if (!url) return;
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noopener";
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function updatePaidDownloadActions() {
    const hasPaidDownloads = paymentApproved && downloadUrl1 && downloadUrl2;

    if (downloadBothBtn) {
        downloadBothBtn.hidden = hasPaidDownloads;
        downloadBothBtn.textContent = "Unlock my full song for £14.99";
        downloadBothBtn.classList.toggle("is-ready", paymentApproved);
        downloadBothBtn.classList.remove("is-waiting");
        downloadBothBtn.disabled = false;
    }

    if (downloadVersion1Btn) {
        downloadVersion1Btn.hidden = !hasPaidDownloads;
        downloadVersion1Btn.disabled = !downloadUrl1;
    }

    if (downloadVersion2Btn) {
        downloadVersion2Btn.hidden = !hasPaidDownloads;
        downloadVersion2Btn.disabled = !downloadUrl2;
    }
}

const PREVIEW_SECONDS = 40;

function attachPreviewLimiter(audioEl) {
    if (!audioEl) return;
    audioEl.removeEventListener("timeupdate", audioEl.__limitHandler || (() => {}));
    audioEl.removeEventListener("play", audioEl.__resetHandler || (() => {}));
    audioEl.removeEventListener("contextmenu", audioEl.__contextHandler || (() => {}));

    const limitHandler = () => {
        if (Number.isNaN(audioEl.currentTime)) return;
        if (audioEl.currentTime >= PREVIEW_SECONDS) {
            audioEl.pause();
        }
    };

    const resetHandler = () => {
        if (audioEl.currentTime >= PREVIEW_SECONDS) {
            audioEl.currentTime = 0;
        }
    };

    const contextHandler = (event) => {
        event.preventDefault();
    };

    audioEl.__limitHandler = limitHandler;
    audioEl.__resetHandler = resetHandler;
    audioEl.__contextHandler = contextHandler;
    audioEl.addEventListener("timeupdate", limitHandler);
    audioEl.addEventListener("play", resetHandler);
    audioEl.addEventListener("contextmenu", contextHandler);
}

function applyPreviewPlaybackState() {
    const previewsAreReady = Boolean(previewUrl1 && previewUrl2);
    const canListenNow = paymentApproved || previewPlaybackUnlocked;

    [previewAudio1, previewAudio2].forEach((audioEl, index) => {
        if (!audioEl) return;
        const nextUrl = index === 0 ? previewUrl1 : previewUrl2;

        if (previewsAreReady && canListenNow && nextUrl) {
            if (audioEl.src !== nextUrl) {
                audioEl.src = nextUrl;
            }
            audioEl.controls = true;
            attachPreviewLimiter(audioEl);
        } else {
            audioEl.pause();
            audioEl.removeAttribute("src");
            audioEl.load();
            audioEl.controls = false;
        }
    });

    if (previewUnlockNote) {
        previewUnlockNote.innerHTML = canListenNow
            ? "<strong>40-second previews.</strong><span>Unlock the complete song when you are happy to continue.</span>"
            : "<strong>Your previews are ready.</strong><span>Complete payment to listen and unlock the full song.</span>";
    }
}

function waitForAudioReady(audioEl) {
    if (!audioEl) return Promise.resolve();
    if (audioEl.readyState >= 2 && !Number.isNaN(audioEl.duration) && audioEl.duration > 0) {
        return Promise.resolve();
    }
    return new Promise((resolve) => {
        const done = () => {
            audioEl.removeEventListener("loadedmetadata", done);
            audioEl.removeEventListener("canplaythrough", done);
            audioEl.removeEventListener("error", done);
            resolve();
        };
        audioEl.addEventListener("loadedmetadata", done);
        audioEl.addEventListener("canplaythrough", done);
        audioEl.addEventListener("error", done);
        setTimeout(done, 8000);
    });
}

const lyricStatusSteps = [
    "Organizando suas ideias...",
    "Writing the opening lines...",
    "Shaping the chorus...",
    "Refining the composition..."
];

const lyricStatusPercents = [45, 50, 55, 60];

const startLyricsStatusLoop = () => {
    let index = 0;
    setProgress(2, "Creating your lyrics", lyricStatusSteps[index], lyricStatusPercents[index]);
    const interval = setInterval(() => {
        index = (index + 1) % lyricStatusSteps.length;
        const percent = lyricStatusPercents[index] ?? 60;
        setProgress(2, "Creating your lyrics", lyricStatusSteps[index], percent);
    }, 4500);
    return interval;
};

const stopLyricsStatusLoop = (interval) => {
    if (interval) clearInterval(interval);
};

const statusSteps = [
    "Refining the melody...",
    "Building the arrangement...",
    "Adding the vocal...",
    "Finishing an emotional preview..."
];

const startStatusLoop = () => {
    let index = 0;
    setMusicStatus(statusSteps[index]);
    const interval = setInterval(() => {
        index = (index + 1) % statusSteps.length;
        setMusicStatus(statusSteps[index]);
    }, 6000);
    return interval;
};

const stopStatusLoop = (interval) => {
    if (interval) clearInterval(interval);
};
function toggleVoiceFields() {
    if (!musicVocal || !voiceGenderRow) return;
    const isInstrumental = musicVocal.value === "instrumental";
    voiceGenderRow.style.display = isInstrumental ? "none" : "block";
}

async function createMusicTask(payload) {
    const response = await fetch(apiUrl("/api/music/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
        const error = new Error(data.error || "We could not start song generation.");
        error.code = data.code || "";
        error.status = response.status;
        throw error;
    }
    return data;
}

async function fetchConversion(conversionId) {
    const response = await fetch(apiUrl(`/api/music/status?conversion_id=${conversionId}`));
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "We could not check the song status.");
    }
    return data;
}

async function waitForConversion(conversionId, onProgress) {
    const maxAttempts = 90;
    let attempt = 0;
    while (attempt < maxAttempts) {
        attempt += 1;
        const data = await fetchConversion(conversionId);
        if (onProgress) onProgress(data, attempt);
        const status = String(data.status || "").toUpperCase();
        if ((status === "COMPLETED" || status === "SUCCESS" || status === "FINISHED" || status === "DONE") && data.audio_url) {
            return data;
        }
        if (!status && data.audio_url) {
            return data;
        }
        if (status === "FAILED" || status === "ERROR") {
            throw new Error("Song generation failed.");
        }
        await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    throw new Error("Generation is taking longer than expected. Please try again in a few minutes.");
}

if (musicVocal) {
    musicVocal.addEventListener("change", toggleVoiceFields);
    toggleVoiceFields();
}

if (generateMusicBtn) {
    generateMusicBtn.addEventListener("click", async () => {
        const lyrics = getEditedLyricsText();
        if (!lyrics) {
            setMusicStatus("Please complete the lyrics before generating the song.", true);
            return;
        }
        let customerPhone = "";
        let customerEmail = "";
        try {
            customerPhone = validatePreviewPhone();
            customerEmail = validatePreviewEmail();
        } catch (error) {
            setMusicStatus(error.message, true);
            if (!getNormalizedPreviewPhone()) {
                previewPhone?.focus();
            } else {
                previewEmail?.focus();
            }
            return;
        }
        if (lastOccasionConfig?.ownLyrics) {
            const ownLyricsClientName = dynamicFields?.querySelector("#ownLyricsClientName")?.value.trim() || "";
            if (!ownLyricsClientName) {
                setMusicStatus("Please enter your name before generating the song.", true);
                dynamicFields?.querySelector("#ownLyricsClientName")?.focus();
                return;
            }
            lastFormValues.clientName = ownLyricsClientName;
        }
        const shouldKeepPaidSession = paymentApproved && currentMusicSessionId && !hasMusicReady;
        if (!shouldKeepPaidSession) {
            setCurrentMusicSessionId(createMusicSessionId());
            paymentApproved = false;
            previewUrl1 = "";
            previewUrl2 = "";
            downloadUrl1 = "";
            downloadUrl2 = "";
        }
        const payload = {
            lyrics,
            music_style: musicStyle ? musicStyle.value : "Modern emotional pop",
            output_length: Number(musicDuration?.value || 150),
            make_instrumental: musicVocal?.value === "instrumental",
            voice_gender: normalizeVoiceGender(voiceGender?.value),
            occasion: lastOccasionConfig?.label || "",
            customer_phone: customerPhone,
            customer_email: customerEmail,
            session_id: currentMusicSessionId,
            test_mode: isTestMode,
        };

        setMusicGeneratingState(true);
        setMusicStatus("We are creating your full song. This may take a few minutes...");
        setProgress(3, "Creating the melody", "We are producing your song.", 85);
        trackGa("generate_music", {
            page: "fazer-minha-musica",
            occasion: lastOccasionConfig?.label || "",
            style: musicStyle ? musicStyle.value : "",
            duration_seconds: Number(musicDuration?.value || 150),
            voice: musicVocal?.value || "",
            voice_gender: voiceGender?.value || "",
            test_mode: isTestMode,
        });

        isMusicGenerating = true;
        hasMusicReady = false;
        if (musicDownloads) musicDownloads.hidden = true;
        if (musicPreviews) musicPreviews.hidden = true;
        if (buyPreviewCreditBtn) buyPreviewCreditBtn.hidden = true;
        if (previewAudio1) previewAudio1.src = "";
        if (previewAudio2) previewAudio2.src = "";
        previewUrl1 = "";
        previewUrl2 = "";
        downloadUrl1 = "";
        downloadUrl2 = "";
        previewPlaybackUnlocked = true;
        applyPreviewPlaybackState();

        let statusInterval = null;
        try {
            const task = await createMusicTask(payload);
            const creditsRemaining = typeof task.credits_remaining === "number" ? task.credits_remaining : null;
            const previewAccessGranted = Boolean(task.preview_access || paymentApproved);
            statusInterval = startStatusLoop();
            const id1 = task.conversion_id_1;
            const id2 = task.conversion_id_2;

            const [conv1, conv2] = await Promise.all([
                waitForConversion(id1),
                waitForConversion(id2),
            ]);

            if (!conv1.audio_url || !conv2.audio_url) {
                throw new Error("Generation is taking longer than expected. Please try again in a few minutes.");
            }

            previewUrl1 = conv1.audio_url;
            previewUrl2 = conv2.audio_url;
            previewPlaybackUnlocked = previewAccessGranted;
            downloadUrl1 = paymentApproved ? conv1.audio_url : "";
            downloadUrl2 = paymentApproved ? conv2.audio_url : "";
            applyPreviewPlaybackState();
            if (previewPlaybackUnlocked || paymentApproved) {
                await Promise.all([
                    waitForAudioReady(previewAudio1),
                    waitForAudioReady(previewAudio2)
                ]);
            }
            await saveGeneratedMusicSession({
                client_name: lastFormValues?.clientName || "",
                customer_phone: customerPhone,
                customer_email: customerEmail,
                traffic_source: trafficSource,
                occasion: lastOccasionConfig?.label || "",
                style: musicStyle ? musicStyle.value : "",
                voice_gender: normalizeVoiceGender(voiceGender?.value),
                lyrics,
                title: resultTitle?.textContent || "Your song is ready",
                subtitle: "We restored your temporary session so you can continue where you left off.",
                badge: resultBadge?.textContent || "Song ready",
                download_url_1: conv1.audio_url,
                download_url_2: conv2.audio_url,
                preview_locked: !previewPlaybackUnlocked,
            });
            upsertLocalLibraryItem(buildLocalLibraryItem({
                client_name: lastFormValues?.clientName || "",
                customer_phone: customerPhone,
                customer_email: customerEmail,
                traffic_source: trafficSource,
                occasion: lastOccasionConfig?.label || "",
                style: musicStyle ? musicStyle.value : "",
                voice_gender: normalizeVoiceGender(voiceGender?.value),
                lyrics,
                paid: paymentApproved,
                preview_locked: !previewPlaybackUnlocked,
                preview_url_1: conv1.audio_url,
                preview_url_2: conv2.audio_url,
                download_url_1: paymentApproved ? conv1.audio_url : "",
                download_url_2: paymentApproved ? conv2.audio_url : "",
                paid_at: paymentApproved ? new Date().toISOString() : null,
            }));
            const shouldShowPreviews = true;
            if (musicPreviews) musicPreviews.hidden = !shouldShowPreviews;
            if (musicDownloads) musicDownloads.hidden = false;
            setProgress(
                3,
                paymentApproved ? "Full song ready" : previewPlaybackUnlocked ? "40-second previews ready" : "Previews ready to unlock",
                paymentApproved ? "Your download is now available." : previewPlaybackUnlocked ? "Unlock your full song for £14.99." : "Complete payment to listen to your previews and unlock the full song.",
                100
            );
            if (confirmPaymentBtn) confirmPaymentBtn.hidden = true;
            updatePaidDownloadActions();
            if (buyPreviewCreditBtn) buyPreviewCreditBtn.hidden = paymentApproved;
            if (musicUnlockWarning) musicUnlockWarning.hidden = paymentApproved || previewPlaybackUnlocked;

            isMusicGenerating = false;
            hasMusicReady = true;
            stopStatusLoop(statusInterval);
            const creditMessage = creditsRemaining === null
                ? ""
                : ` You still have ${creditsRemaining} ${creditsRemaining === 1 ? "complimentary preview" : "complimentary previews"}.`;
            setMusicStatus(
                paymentApproved
                    ? "Your full song is ready. You can now download both versions."
                    : previewPlaybackUnlocked
                        ? `Your 40-second previews are ready. Unlock your full song for £14.99.${creditMessage}`
                        : "Your previews are ready. Complete payment to listen and unlock your full song."
            );
        } catch (error) {
            if (musicDownloads) musicDownloads.hidden = true;
            if (musicPreviews) musicPreviews.hidden = true;
            if (previewAudio1) previewAudio1.src = "";
            if (previewAudio2) previewAudio2.src = "";
            previewUrl1 = "";
            previewUrl2 = "";
            downloadUrl1 = "";
            downloadUrl2 = "";
            previewPlaybackUnlocked = true;
            applyPreviewPlaybackState();
            setProgress(3, "Waiting for another try", "Please try again in a few minutes.", 75);

            isMusicGenerating = false;
            hasMusicReady = false;
            stopStatusLoop(statusInterval);
            setMusicStatus(error.message || "We could not generate the song.", true);
        } finally {
            setMusicGeneratingState(false);
        }
    });
}
            

















const checkPaymentStatus = async () => {
    try {
        const response = await fetch(apiUrl(`/api/payment/status?session_id=${encodeURIComponent(currentMusicSessionId)}`));
        const data = await response.json();
        if (response.ok && data?.paid) {
            paymentApproved = true;
            return data;
        }
    } catch (error) {
        console.error(error);
    }
    return null;
};

const getApprovedDownloadUrl = async (version) => {
    const paymentStatus = await checkPaymentStatus();
    const url = version === 1
        ? paymentStatus?.download_url_1 || ""
        : paymentStatus?.download_url_2 || "";

    if (!paymentStatus?.paid || !url) {
        paymentApproved = false;
        downloadUrl1 = "";
        downloadUrl2 = "";
        updatePaidDownloadActions();
        throw new Error("The download will be released after payment confirmation.");
    }

    downloadUrl1 = paymentStatus.download_url_1 || "";
    downloadUrl2 = paymentStatus.download_url_2 || "";
    updatePaidDownloadActions();
    return url;
};

const pollPaymentStatus = () => {
    const start = Date.now();
    const interval = setInterval(async () => {
        const paymentStatus = await checkPaymentStatus();
        if (paymentStatus) {
            clearInterval(interval);
            paymentApproved = true;
            previewPlaybackUnlocked = true;
            downloadUrl1 = paymentStatus.download_url_1 || downloadUrl1;
            downloadUrl2 = paymentStatus.download_url_2 || downloadUrl2;
            const hasDownloads = Boolean(downloadUrl1 && downloadUrl2);
            const rewardText = typeof paymentStatus.credits_remaining === "number"
                ? ` You received +2 additional complimentary previews and now have ${paymentStatus.credits_remaining} ${paymentStatus.credits_remaining === 1 ? "credit" : "credits"}.`
                : paymentStatus.credit_rewarded
                    ? " You received +2 new complimentary previews."
                    : "";
            setMusicStatus(hasDownloads
                ? `Payment confirmed. Your download is already available.${rewardText}`
                : "Payment confirmed. Click Generate full song to produce and download your track.");
            if (buyPreviewCreditBtn) buyPreviewCreditBtn.hidden = true;
            upsertLocalLibraryItem(buildLocalLibraryItem({
                paid: true,
                preview_locked: false,
                download_url_1: downloadUrl1,
                download_url_2: downloadUrl2,
            }));
            trackGa("purchase", buildCheckoutAnalyticsParams({
                transaction_id: currentMusicSessionId,
                payment_status: "approved",
            }));
            trackGa("conversion_event_purchase", buildCheckoutAnalyticsParams({
                transaction_id: currentMusicSessionId,
                payment_status: "approved",
            }));
            trackPixel("Purchase", {
                content_name: CHECKOUT_ITEM.item_name,
                content_ids: [CHECKOUT_ITEM.item_id],
                content_type: "product",
                value: CHECKOUT_VALUE,
                currency: "GBP",
            });
            closeEmbeddedPaymentModal();
            applyPreviewPlaybackState();
            if (musicPreviews && previewUrl1 && previewUrl2) {
                musicPreviews.hidden = false;
            }
            updatePaidDownloadActions();
            if (musicUnlockWarning) musicUnlockWarning.hidden = true;
            if (hasDownloads) {
                setMusicStatus("Payment confirmed. Taking you to My songs...");
                window.setTimeout(() => redirectToLibraryPage({ paymentStatus: "sucesso" }), 1200);
            }
        } else if (Date.now() - start > 5 * 60 * 1000) {
            clearInterval(interval);
            setMusicStatus("Payment has not been confirmed yet. If you already paid, please wait a few minutes.");
        }
    }, 5000);
};

const createPayment = async (extra = {}) => {
    const response = await fetch(apiUrl("/api/payment/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: currentMusicSessionId,
            customer_key: customerLibraryKey,
            traffic_source: trafficSource,
            client_name: lastFormValues?.clientName || "",
            customer_phone: getNormalizedPreviewPhone(),
            customer_email: getNormalizedPreviewEmail(),
            ...extra,
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "We could not start payment.");
    }
    return data;
};

let paymentConfigPromise = null;
let embeddedPaymentModal = null;
let embeddedPayPalButtonsController = null;

function getEmbeddedPaymentModal() {
    if (embeddedPaymentModal) return embeddedPaymentModal;

    const overlay = document.createElement("div");
    overlay.className = "payment-modal-overlay";
    overlay.hidden = true;
    overlay.innerHTML = `
        <div class="payment-modal-backdrop" data-close-payment-modal></div>
        <div class="payment-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="paymentModalTitle">
            <button type="button" class="payment-modal-close" aria-label="Close payment" data-close-payment-modal>
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="payment-modal-head">
                <span class="mini-label">Payment</span>
                <h3 id="paymentModalTitle">Complete your song without leaving the site</h3>
                <p id="paymentModalSubtitle">Secure payment via PayPal. Release remains automatic.</p>
            </div>
            <p id="paymentModalStatus" class="builder-status payment-modal-status" hidden></p>
            <div id="paymentModalBrick" class="payment-modal-brick"></div>
            <div id="paymentModalResult" class="payment-modal-result" hidden></div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll("[data-close-payment-modal]").forEach((element) => {
        element.addEventListener("click", () => {
            closeEmbeddedPaymentModal();
        });
    });

    embeddedPaymentModal = {
        overlay,
        status: overlay.querySelector("#paymentModalStatus"),
        brick: overlay.querySelector("#paymentModalBrick"),
        result: overlay.querySelector("#paymentModalResult"),
        subtitle: overlay.querySelector("#paymentModalSubtitle"),
    };

    return embeddedPaymentModal;
}

function setEmbeddedPaymentStatus(message, isError = false) {
    const modal = getEmbeddedPaymentModal();
    if (!message) {
        modal.status.hidden = true;
        modal.status.textContent = "";
        modal.status.classList.remove("is-error");
        return;
    }
    modal.status.hidden = false;
    modal.status.textContent = message;
    modal.status.classList.toggle("is-error", isError);
}

async function destroyEmbeddedPaymentBrick() {
    if (!embeddedPayPalButtonsController?.close) {
        const modal = embeddedPaymentModal;
        if (modal?.brick) modal.brick.innerHTML = "";
        embeddedPayPalButtonsController = null;
        return;
    }
    try {
        embeddedPayPalButtonsController.close();
    } catch (error) {
        console.error("We could not dispose the current PayPal checkout.", error);
    } finally {
        const modal = embeddedPaymentModal;
        if (modal?.brick) modal.brick.innerHTML = "";
        embeddedPayPalButtonsController = null;
    }
}

function closeEmbeddedPaymentModal() {
    const modal = getEmbeddedPaymentModal();
    modal.overlay.hidden = true;
    document.body.classList.remove("payment-modal-open");
}

function openEmbeddedPaymentModal() {
    const modal = getEmbeddedPaymentModal();
    modal.overlay.hidden = false;
    modal.result.hidden = true;
    modal.result.innerHTML = "";
    modal.brick.hidden = false;
    modal.brick.innerHTML = "";
    modal.subtitle.textContent = "Secure payment via PayPal. Release remains automatic.";
    setEmbeddedPaymentStatus("Loading payment options...", false);
    document.body.classList.add("payment-modal-open");
}

function renderEmbeddedPaymentResult(result) {
    const modal = getEmbeddedPaymentModal();
    const fragments = [];

    if (result?.paid) {
        fragments.push(`
            <div class="payment-result-card is-success">
                <strong>Payment approved</strong>
                <p>Your song will be released automatically. You can close this window.</p>
            </div>
        `);
    } else {
        fragments.push(`
            <div class="payment-result-card">
                <strong>Payment pending</strong>
                <p>We are tracking the confirmation. As soon as PayPal approves it, your song will be released.</p>
            </div>
        `);
    }

    modal.result.innerHTML = fragments.join("");
    modal.result.hidden = false;

    window.setTimeout(() => {
        modal.result.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
}

async function fetchPaymentConfig() {
    if (!paymentConfigPromise) {
        paymentConfigPromise = fetch(apiUrl("/api/payment/config"))
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.error || "We could not load the payment configuration.");
                }
                return data;
            })
            .catch((error) => {
                paymentConfigPromise = null;
                throw error;
            });
    }
    return paymentConfigPromise;
}

async function createStripeCheckout(extra = {}) {
    const response = await fetch(apiUrl("/api/payment/stripe/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: currentMusicSessionId,
            customer_key: customerLibraryKey,
            traffic_source: trafficSource,
            client_name: lastFormValues?.clientName || "",
            customer_phone: getNormalizedPreviewPhone(),
            customer_email: getNormalizedPreviewEmail(),
            ...extra,
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "We could not start the Stripe checkout.");
    }
    return data;
}

async function startStripeCheckout(analyticsExtra = {}, extraPayload = {}) {
    const config = await fetchPaymentConfig().catch(() => null);
    if (config?.provider !== "stripe" || !config?.stripe?.enabled) {
        throw new Error("Stripe is not available right now.");
    }

    const checkout = await createStripeCheckout(extraPayload);
    if (!checkout?.checkout_url) {
        throw new Error("We could not generate the Stripe checkout link.");
    }

    trackGa("payment_checkout_opened", buildCheckoutAnalyticsParams({
        checkout_provider: "stripe",
        checkout_mode: "redirect",
        ...analyticsExtra,
    }));
    setMusicStatus("Redirecting you to the secure card checkout...");
    window.location.assign(checkout.checkout_url);
}

async function loadPayPalSdk(config) {
    if (window.paypal) return window.paypal;
    await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-paypal-sdk="true"]');
        if (existing) {
            existing.addEventListener("load", resolve, { once: true });
            existing.addEventListener("error", reject, { once: true });
            return;
        }

        const script = document.createElement("script");
        const clientId = encodeURIComponent(config?.client_id || "");
        const currency = encodeURIComponent(config?.currency || "GBP");
        script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&intent=capture&components=buttons&locale=en_GB&commit=true`;
        script.async = true;
        script.dataset.paypalSdk = "true";
        script.addEventListener("load", resolve, { once: true });
        script.addEventListener("error", reject, { once: true });
        document.head.appendChild(script);
    });

    return window.paypal;
}

async function processEmbeddedPayment(orderId, captureData) {
    const response = await fetch(apiUrl("/api/payment/process"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: currentMusicSessionId,
            customer_key: customerLibraryKey,
            traffic_source: trafficSource,
            client_name: lastFormValues?.clientName || "",
            customer_phone: getNormalizedPreviewPhone(),
            customer_email: getNormalizedPreviewEmail(),
            order_id: orderId,
            capture_data: captureData,
        }),
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "We could not process the payment.");
    }

    return data;
}

async function openEmbeddedCheckout(payment, analyticsExtra = {}) {
    const config = await fetchPaymentConfig().catch(() => null);
    if (config?.provider !== "paypal" || !config?.client_id || !payment?.order_id) {
        return false;
    }

    try {
        await loadPayPalSdk(config);
    } catch (error) {
        console.error("We could not load the PayPal SDK.", error);
        return false;
    }

    openEmbeddedPaymentModal();
    await destroyEmbeddedPaymentBrick();

    const modal = getEmbeddedPaymentModal();
    modal.subtitle.textContent = "Pay with PayPal without leaving this page. Your song will be released automatically after approval.";
    trackGa("payment_checkout_opened", buildCheckoutAnalyticsParams({
        checkout_provider: "paypal",
        checkout_mode: "embedded",
        ...analyticsExtra,
    }));

    const container = document.createElement("div");
    container.className = "paypal-buttons-wrap";
    modal.brick.appendChild(container);

    const buttons = window.paypal.Buttons({
        style: {
            layout: "vertical",
            shape: "rect",
            label: "paypal",
            tagline: false,
        },
        createOrder: async () => payment.order_id,
        onInit: () => {
            setEmbeddedPaymentStatus("");
        },
        onApprove: async (data, actions) => {
            setEmbeddedPaymentStatus("Confirming payment...", false);
            try {
                const captureData = await actions.order.capture();
                const result = await processEmbeddedPayment(data.orderID || payment.order_id, captureData);
                renderEmbeddedPaymentResult(result);
                pollPaymentStatus();
                if (result?.paid) {
                    setEmbeddedPaymentStatus("Payment approved. Releasing your song...", false);
                    window.setTimeout(() => {
                        closeEmbeddedPaymentModal();
                    }, 1200);
                } else {
                    setEmbeddedPaymentStatus("Payment started. As soon as approval happens, your song will be released automatically.", false);
                }
            } catch (error) {
                setEmbeddedPaymentStatus(error.message || "We could not process the payment.", true);
                throw error;
            }
        },
        onError: (error) => {
            console.error("PayPal checkout error", error);
            setEmbeddedPaymentStatus("We could not load the embedded PayPal checkout right now.", true);
        },
        onCancel: () => {
            setEmbeddedPaymentStatus("Payment was cancelled. You can try again whenever you are ready.", true);
        },
    });

    if (!buttons?.isEligible || !buttons.isEligible()) {
        setEmbeddedPaymentStatus("PayPal checkout is not available right now.", true);
        return false;
    }

    await buttons.render(container);
    embeddedPayPalButtonsController = buttons;

    return true;
}

if (buyPreviewCreditBtn) {
    buyPreviewCreditBtn.addEventListener("click", async () => {
        let customerPhone = "";
        let customerEmail = "";
        try {
            customerPhone = validatePreviewPhone();
            customerEmail = validatePreviewEmail();
        } catch (error) {
            setMusicStatus(error.message, true);
            if (!getNormalizedPreviewPhone()) {
                previewPhone?.focus();
            } else {
                previewEmail?.focus();
            }
            return;
        }

        if (!currentMusicSessionId || hasMusicReady) {
            setCurrentMusicSessionId(createMusicSessionId());
        }

        buyPreviewCreditBtn.disabled = true;
        trackGa("begin_checkout", buildCheckoutAnalyticsParams({
            checkout_step: "sem_creditos",
            checkout_provider: "stripe",
            customer_phone: customerPhone,
        }));

        try {
            if (musicUnlockWarning) {
                musicUnlockWarning.hidden = false;
            }
            await startStripeCheckout(
                { checkout_step: "sem_creditos" },
                {
                    customer_phone: customerPhone,
                    customer_email: customerEmail,
                }
            );
        } catch (error) {
            setMusicStatus(error.message || "We could not start payment.", true);
        } finally {
            buyPreviewCreditBtn.disabled = false;
        }
    });
}

if (downloadBothBtn) {
    downloadBothBtn.addEventListener("click", async () => {
        if (!currentMusicSessionId || !hasMusicReady) {
            setMusicStatus("The songs are not ready to unlock yet.", true);
            return;
        }
        downloadBothBtn.disabled = true;
        trackGa("click_payment_button", {
            event_category: "checkout",
            event_label: "Unlock my full song",
            currency: "GBP",
            value: CHECKOUT_VALUE,
            page: "fazer-minha-musica",
        });
        trackGa("begin_checkout", buildCheckoutAnalyticsParams({
            checkout_step: "click_liberar_musica",
            checkout_provider: "stripe",
        }));
        trackPixel("InitiateCheckout", {
            content_name: CHECKOUT_ITEM.item_name,
            content_ids: [CHECKOUT_ITEM.item_id],
            content_type: "product",
            value: CHECKOUT_VALUE,
            currency: "GBP",
            num_items: 1,
        });
        try {
            if (downloadBothBtn) {
                downloadBothBtn.textContent = "Redirecting to checkout...";
                downloadBothBtn.classList.add("is-waiting");
            }
            await startStripeCheckout({
                checkout_step: "click_liberar_musica",
            });
        } catch (error) {
            setMusicStatus(error.message || "We could not start payment.", true);
            if (downloadBothBtn) {
                downloadBothBtn.textContent = "Unlock my full song for £14.99";
                downloadBothBtn.classList.remove("is-waiting");
            }
        } finally {
            downloadBothBtn.disabled = false;
        }
    });
}

if (downloadVersion1Btn) {
    downloadVersion1Btn.addEventListener("click", async () => {
        downloadVersion1Btn.disabled = true;
        try {
            const url = await getApprovedDownloadUrl(1);
            triggerDownload(url);
        } catch (error) {
            setMusicStatus(error.message || "The download will be released after payment confirmation.", true);
        } finally {
            downloadVersion1Btn.disabled = false;
        }
    });
}

if (downloadVersion2Btn) {
    downloadVersion2Btn.addEventListener("click", async () => {
        downloadVersion2Btn.disabled = true;
        try {
            const url = await getApprovedDownloadUrl(2);
            triggerDownload(url);
        } catch (error) {
            setMusicStatus(error.message || "The download will be released after payment confirmation.", true);
        } finally {
            downloadVersion2Btn.disabled = false;
        }
    });
}
