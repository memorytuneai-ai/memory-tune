/**
 * QUESTIONARIO.JS — 5-Step Modern Funnel Controller
 * State persistence (Anti-Loss), AI lyrics generation, Suno/Kie AI production,
 * progressive audio unlocking, audio protection, and Meta/GA4 tracking.
 */

const STORAGE_KEY = 'mt_funnel_draft';
const API_BASE = window.location.origin;

// Audio samples for genres
const GENRES = [
    { id: "Modern emotional pop", name: "Pop Romântico", icon: "fa-heart", desc: "Suave, envolvente e moderno", sample: "love-story.mp3" },
    { id: "Piano cinematic", name: "Balada Emocional", icon: "fa-music", desc: "Intensa, acústica e comovente", sample: "baby-arrival.mp3" },
    { id: "Acoustic folk", name: "Voz e Violão Acústico", icon: "fa-guitar", desc: "Íntimo, delicado e autêntico", sample: "marriage-proposal.mp3" },
    { id: "Sertanejo (Brazil)", name: "Sertanejo Acústico", icon: "fa-compact-disc", desc: "Harmônico, apaixonado e marcante", sample: "mothers-day.mp3" },
    { id: "UK pop ballad", name: "UK Pop / Ed Sheeran style", icon: "fa-microphone", desc: "Melódico, poético e cativante", sample: "love-story.mp3" },
    { id: "R&B", name: "R&B Soul", icon: "fa-wave-square", desc: "Groove suave e interpretação calorosa", sample: "baby-arrival.mp3" },
    { id: "Rock", name: "Rock Acústico", icon: "fa-bolt", desc: "Vibrante com energia e emoção", sample: "marriage-proposal.mp3" },
    { id: "Lo-fi emotional", name: "Lo-fi Suave", icon: "fa-headphones", desc: "Aconchegante e contemporâneo", sample: "mothers-day.mp3" },
];

const OCCASIONS_DATA = {
    "romantic-song": {
        label: "Romantic Song",
        title: "A love song for your special someone",
        intro: "Tell us the memories, small moments and phrases that make your bond unique.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is creating this song?", required: true },
            { id: "lovedOneName", label: "Name of the loved one", type: "text", placeholder: "Example: Isabella", required: true },
            { id: "howMet", label: "How did your story begin?", type: "textarea", placeholder: "Where and how did you first meet?", rows: 3 },
            { id: "specialMoment", label: "What moment marked your story most?", type: "textarea", placeholder: "A trip, a conversation, a rainy afternoon...", rows: 3 },
            { id: "whatYouLoveMost", label: "What do you admire most about them?", type: "textarea", placeholder: "Their smile, kindness, support, laugh...", rows: 3 },
            { id: "specialDetail", label: "Any nickname or inside joke to include?", type: "text", placeholder: "Example: My sunshine, coffee dates, etc." }
        ]
    },
    "aniversario": {
        label: "Birthday",
        title: "A birthday song full of affection",
        intro: "Celebrate their life with gratitude, joyful memories and wishes for the future.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is giving this gift?", required: true },
            { id: "personName", label: "Birthday person's name", type: "text", placeholder: "Example: Charlotte", required: true },
            { id: "relationship", label: "Who are they to you?", type: "text", placeholder: "My wife, husband, mother, best friend..." },
            { id: "favoriteMemory", label: "A memory that shines bright", type: "textarea", placeholder: "Share a story that always brings a smile.", rows: 3 },
            { id: "admiredTraits", label: "Qualities that make them unforgettable", type: "textarea", placeholder: "Strength, joy, dedication, warmth...", rows: 3 }
        ]
    },
    "casamento": {
        label: "Marriage proposal",
        title: "A song for a lifetime promise",
        intro: "A cinematic soundtrack designed for an unforgettable proposal or anniversary.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who will ask the question?", required: true },
            { id: "personName", label: "Their name", type: "text", placeholder: "Example: Emily", required: true },
            { id: "coupleStory", label: "The journey that brought you here", type: "textarea", placeholder: "How you built your connection over time...", rows: 3 },
            { id: "turningPoint", label: "The moment you knew it was forever", type: "textarea", placeholder: "When did you know you wanted to spend your life together?", rows: 3 },
            { id: "futureDream", label: "The future you dream of building together", type: "textarea", placeholder: "A home, travels, growing old together...", rows: 3 }
        ]
    },
    "revelacao": {
        label: "Baby arrival",
        title: "Welcoming a new life with music",
        intro: "Capture tenderness, waiting with open hearts and the miracle of a child.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is requesting this song?", required: true },
            { id: "parentsNames", label: "Parents' names", type: "text", placeholder: "Example: Olivia & James", required: true },
            { id: "babyMessage", label: "Message for the baby", type: "textarea", placeholder: "What do you want this baby to feel when hearing this song?", rows: 3 },
            { id: "boyName", label: "Chosen name (if boy)", type: "text", placeholder: "Example: Theo" },
            { id: "girlName", label: "Chosen name (if girl)", type: "text", placeholder: "Example: Grace" }
        ]
    },
    "homenagem": {
        label: "Tribute & Gratitude",
        title: "Honouring someone who shaped your story",
        intro: "Turn deep gratitude and love into a song that will be kept as a family treasure.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Your name", required: true },
            { id: "personName", label: "Name of the person being honoured", type: "text", placeholder: "Example: Margaret", required: true },
            { id: "relationship", label: "Your relationship to them", type: "text", placeholder: "Grandmother, mentor, father, mother..." },
            { id: "lifeImpact", label: "How did they shape your life?", type: "textarea", placeholder: "Lessons, kindness, protection, love...", rows: 4 },
            { id: "specialTraits", label: "Qualities that must be mentioned", type: "textarea", placeholder: "Their faith, patience, embrace...", rows: 3 }
        ]
    },
    "desculpa": {
        label: "Apology & Reconciliation",
        title: "A sincere song from the heart",
        intro: "Built for vulnerability, truth and the hope of rebuilding what matters.",
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is apologising?", required: true },
            { id: "personName", label: "Their name", type: "text", placeholder: "Example: Amelia", required: true },
            { id: "whatHappened", label: "What happened (honestly)", type: "textarea", placeholder: "Speak from the heart without excuses...", rows: 3 },
            { id: "hopeMessage", label: "What you hope to rebuild", type: "textarea", placeholder: "What does forgiveness mean for you both?", rows: 3 }
        ]
    },
    "letraPronta": {
        label: "Ready Lyrics",
        title: "Paste your custom lyrics",
        intro: "Paste your own poem or lyrics below. You have total creative freedom!",
        ownLyrics: true,
        fields: [
            { id: "clientName", label: "Your name", type: "text", placeholder: "Who is the author?", required: true },
            { id: "songTitle", label: "Song Title", type: "text", placeholder: "Example: Our Eternal Song" },
            { id: "customLyrics", label: "Paste your complete lyrics here", type: "textarea", placeholder: "Paste your verses, chorus and lines here (no character limit)...", rows: 12, required: true }
        ]
    }
};

// Funnel State Object
let state = {
    currentStep: 1,
    occasion: "romantic-song",
    fields: {},
    style: "Modern emotional pop",
    voiceGender: "female",
    lyricsBlocks: {
        verse1: "",
        chorus: "",
        verse2: "",
        bridge: "",
        final: ""
    },
    sessionId: null,
    taskId: null,
    conversionId1: null,
    conversionId2: null,
    audioUrl1: null,
    audioUrl2: null,
    customerPhone: "",
    customerEmail: ""
};

// DOM Elements
const stepperLine = document.getElementById("stepperLine");
const stepNodes = document.querySelectorAll(".step-node");
const stepPanels = document.querySelectorAll(".step-panel");
const occasionSelect = document.getElementById("occasionSelect");
const step1Title = document.getElementById("step1Title");
const step1Intro = document.getElementById("step1Intro");
const step1DynamicFields = document.getElementById("step1DynamicFields");
const step1Form = document.getElementById("step1Form");
const genreSelectionGrid = document.getElementById("genreSelectionGrid");
const lyricsLoadingOverlay = document.getElementById("lyricsLoadingOverlay");
const lyricsLoadingMessage = document.getElementById("lyricsLoadingMessage");
const draftSaveIndicator = document.getElementById("draftSaveIndicator");

// Lyric block inputs
const lyricBlock1 = document.getElementById("lyricBlock1");
const lyricBlockChorus = document.getElementById("lyricBlockChorus");
const lyricBlock2 = document.getElementById("lyricBlock2");
const lyricBlockBridge = document.getElementById("lyricBlockBridge");
const lyricBlockFinal = document.getElementById("lyricBlockFinal");
const clientPhoneInput = document.getElementById("clientPhoneInput");
const clientEmailInput = document.getElementById("clientEmailInput");

// Production & Audio elements
const productionStatusText = document.getElementById("productionStatusText");
const studioMeterFill = document.getElementById("studioMeterFill");
const playBtn1 = document.getElementById("playBtn1");
const playBtn2 = document.getElementById("playBtn2");
const audioEl1 = document.getElementById("audioEl1");
const audioEl2 = document.getElementById("audioEl2");
const timeCurrent1 = document.getElementById("timeCurrent1");
const timeCurrent2 = document.getElementById("timeCurrent2");
const progressFill1 = document.getElementById("progressFill1");
const progressFill2 = document.getElementById("progressFill2");
const previewNotice1 = document.getElementById("previewNotice1");
const previewNotice2 = document.getElementById("previewNotice2");
const playerCard1 = document.getElementById("playerCard1");
const playerCard2 = document.getElementById("playerCard2");
const btnStep4Continue = document.getElementById("btnStep4Continue");
const btnStripeCheckout = document.getElementById("btnStripeCheckout");

// Audio Preview Player for Genre selection
let currentGenreAudio = null;
let currentGenreBtn = null;

// =========================================================
// INITIALIZATION
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    loadDraftState();
    parseUrlParams();
    renderStep1Fields();
    renderGenreCards();
    setupEvents();
    goToStep(state.currentStep || 1);
});

// Load state from localStorage (Anti-Perda)
function loadDraftState() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            state = Object.assign(state, parsed);
        }
    } catch (e) {
        console.warn("Could not load draft state", e);
    }
}

// Save state to localStorage
function saveDraftState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        if (draftSaveIndicator) {
            draftSaveIndicator.style.opacity = "1";
            setTimeout(() => { draftSaveIndicator.style.opacity = "0.7"; }, 1500);
        }
    } catch (e) {
        console.warn("Could not save draft state", e);
    }
}

// Read URL params
function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const occ = params.get("ocasiao") || params.get("occasion");
    if (occ && OCCASIONS_DATA[occ]) {
        state.occasion = occ;
        occasionSelect.value = occ;
    }
}

// =========================================================
// STEP NAVIGATION CONTROLLER
// =========================================================
function goToStep(stepNumber) {
    state.currentStep = stepNumber;
    saveDraftState();

    // Update stepper visual nodes
    stepNodes.forEach((node) => {
        const step = parseInt(node.dataset.step, 10);
        node.classList.remove("is-active", "is-complete");
        if (step === stepNumber) {
            node.classList.add("is-active");
        } else if (step < stepNumber) {
            node.classList.add("is-complete");
        }
    });

    // Update progress bar line
    const progressPercentages = [10, 30, 52, 75, 100];
    stepperLine.style.width = `${progressPercentages[stepNumber - 1]}%`;

    // Show panel
    stepPanels.forEach((panel) => {
        const panelStep = parseInt(panel.dataset.panel, 10);
        if (panelStep === stepNumber) {
            panel.hidden = false;
            panel.classList.add("is-visible");
        } else {
            panel.hidden = true;
            panel.classList.remove("is-visible");
        }
    });

    // Scroll to top of container smoothly
    window.scrollTo({ top: 120, behavior: "smooth" });

    // Tracking
    triggerStepAnalytics(stepNumber);
}

function triggerStepAnalytics(stepNumber) {
    if (stepNumber === 1) {
        if (typeof window.fbq === "function") window.fbq("track", "ViewContent", { content_name: "Step 1: Details" });
        if (typeof window.gtag === "function") window.gtag("event", "view_step_1");
    } else if (stepNumber === 3) {
        if (typeof window.fbq === "function") {
            window.fbq("track", "Lead", { content_name: state.occasion, value: 1, currency: "GBP" });
            window.fbq("trackCustom", "GenerateLyrics");
        }
        if (typeof window.gtag === "function") window.gtag("event", "generate_lyrics");
    } else if (stepNumber === 4) {
        if (typeof window.fbq === "function") window.fbq("trackCustom", "MusicGenerated");
        if (typeof window.gtag === "function") window.gtag("event", "music_generated");
    } else if (stepNumber === 5) {
        if (typeof window.fbq === "function") {
            window.fbq("track", "InitiateCheckout", {
                content_name: "Personalised Song Master HD",
                value: 9.90,
                currency: "GBP",
                num_items: 1
            });
        }
        if (typeof window.gtag === "function") {
            window.gtag("event", "begin_checkout", {
                value: 9.90,
                currency: "GBP",
                items: [{ item_name: "Memory Tune Personal Song", price: 9.90, quantity: 1 }]
            });
        }
    }
}

// =========================================================
// STEP 1: DYNAMIC FIELDS & OCCASION
// =========================================================
function renderStep1Fields() {
    const occConfig = OCCASIONS_DATA[state.occasion] || OCCASIONS_DATA["romantic-song"];
    step1Title.textContent = occConfig.title || occConfig.label;
    step1Intro.textContent = occConfig.intro;

    let html = "";
    occConfig.fields.forEach((field) => {
        const val = state.fields[field.id] || "";
        const isFull = field.type === "textarea" || occConfig.ownLyrics;
        const requiredAttr = field.required ? "required" : "";

        html += `
            <div class="input-field-group ${isFull ? 'field-full-width' : ''}">
                <label for="${field.id}">${field.label} ${field.required ? '<span style="color:#e09f67">*</span>' : ''}</label>
                ${field.type === "textarea" 
                    ? `<textarea id="${field.id}" name="${field.id}" rows="${field.rows || 3}" placeholder="${field.placeholder || ''}" ${requiredAttr}>${val}</textarea>`
                    : `<input type="${field.type || 'text'}" id="${field.id}" name="${field.id}" value="${val}" placeholder="${field.placeholder || ''}" ${requiredAttr}>`
                }
            </div>
        `;
    });

    step1DynamicFields.innerHTML = html;

    // Listen to changes for auto-save
    step1DynamicFields.querySelectorAll("input, textarea").forEach((input) => {
        input.addEventListener("input", () => {
            state.fields[input.name] = input.value;
            saveDraftState();
        });
    });
}

occasionSelect.addEventListener("change", () => {
    state.occasion = occasionSelect.value;
    saveDraftState();
    renderStep1Fields();
});

step1Form.addEventListener("submit", (e) => {
    e.preventDefault();
    // Validate inputs
    const inputs = step1DynamicFields.querySelectorAll("input[required], textarea[required]");
    for (let input of inputs) {
        if (!input.value.trim()) {
            input.focus();
            return;
        }
    }
    goToStep(2);
});

// =========================================================
// STEP 2: GENRE & VOICE SELECTION
// =========================================================
function renderGenreCards() {
    genreSelectionGrid.innerHTML = GENRES.map((g) => {
        const isSelected = state.style === g.id;
        return `
            <div class="genre-card ${isSelected ? 'is-selected' : ''}" data-style="${g.id}">
                <div class="genre-card-head">
                    <span class="genre-name">${g.name}</span>
                    <i class="fa-solid ${g.icon} genre-icon"></i>
                </div>
                <p class="genre-desc">${g.desc}</p>
                <button type="button" class="genre-preview-btn" data-sample="${g.sample}">
                    <i class="fa-solid fa-play"></i> Sample
                </button>
            </div>
        `;
    }).join("");

    // Genre click selection
    genreSelectionGrid.querySelectorAll(".genre-card").forEach((card) => {
        card.addEventListener("click", (e) => {
            if (e.target.closest(".genre-preview-btn")) return; // handled by audio btn
            genreSelectionGrid.querySelectorAll(".genre-card").forEach((c) => c.classList.remove("is-selected"));
            card.classList.add("is-selected");
            state.style = card.dataset.style;
            saveDraftState();
        });
    });

    // Audio preview click
    genreSelectionGrid.querySelectorAll(".genre-preview-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const sampleUrl = btn.dataset.sample;
            playGenreSample(sampleUrl, btn);
        });
    });

    // Set voice gender radios
    document.querySelectorAll('input[name="voiceGender"]').forEach((radio) => {
        if (radio.value === state.voiceGender) radio.checked = true;
        radio.closest(".voice-card").classList.toggle("is-selected", radio.value === state.voiceGender);

        radio.addEventListener("change", () => {
            state.voiceGender = radio.value;
            document.querySelectorAll(".voice-card").forEach((c) => c.classList.remove("is-selected"));
            radio.closest(".voice-card").classList.add("is-selected");
            saveDraftState();
        });
    });
}

function playGenreSample(url, btn) {
    if (currentGenreAudio) {
        currentGenreAudio.pause();
        currentGenreAudio = null;
        if (currentGenreBtn) {
            currentGenreBtn.classList.remove("is-playing");
            currentGenreBtn.innerHTML = '<i class="fa-solid fa-play"></i> Sample';
        }
        if (currentGenreBtn === btn) {
            currentGenreBtn = null;
            return;
        }
    }

    const audio = new Audio(url);
    currentGenreAudio = audio;
    currentGenreBtn = btn;
    btn.classList.add("is-playing");
    btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause';

    audio.play().catch(() => {});
    audio.onended = () => {
        btn.classList.remove("is-playing");
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Sample';
        currentGenreAudio = null;
        currentGenreBtn = null;
    };
}

document.getElementById("btnBackToStep1").addEventListener("click", () => goToStep(1));
document.getElementById("btnStep2Continue").addEventListener("click", () => {
    if (currentGenreAudio) {
        currentGenreAudio.pause();
        currentGenreAudio = null;
    }
    goToStep(3);
    prepareStep3Lyrics();
});

// =========================================================
// STEP 3: LYRICS COMPOSITION & EDITING
// =========================================================
async function prepareStep3Lyrics() {
    // If lyrics already generated/edited in draft, restore them
    if (state.lyricsBlocks && (state.lyricsBlocks.verse1 || state.lyricsBlocks.chorus)) {
        populateLyricTextareas();
        return;
    }

    // If occasion is custom lyrics (letraPronta), populate directly
    const occConfig = OCCASIONS_DATA[state.occasion];
    if (occConfig && occConfig.ownLyrics) {
        const raw = state.fields.customLyrics || "";
        parseCustomLyricsIntoBlocks(raw);
        populateLyricTextareas();
        return;
    }

    // Otherwise, generate with AI
    await generateLyricsWithAI();
}

async function generateLyricsWithAI() {
    lyricsLoadingOverlay.hidden = false;

    // Rotate affective loading messages
    const messages = [
        "Afinando as notas e acordes...",
        "Transformando suas memórias em poesia...",
        "Escrevendo o refrão com os momentos marcantes...",
        "Ritmando cada verso com a emoção certa...",
        "Finalizando a harmonia da canção..."
    ];
    let msgIndex = 0;
    const interval = setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        lyricsLoadingMessage.textContent = messages[msgIndex];
    }, 2500);

    try {
        const response = await fetch(`${API_BASE}/api/generate-lyrics`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                occasionLabel: OCCASIONS_DATA[state.occasion]?.label || "Personal Song",
                style: state.style,
                fields: state.fields
            })
        });

        const data = await response.json();
        clearInterval(interval);
        lyricsLoadingOverlay.hidden = true;

        if (data.blocks && data.blocks.length > 0) {
            assignBlocksToState(data.blocks);
        } else if (data.text) {
            parseCustomLyricsIntoBlocks(data.text);
        } else {
            throw new Error(data.error || "Could not generate lyrics.");
        }

        populateLyricTextareas();
        saveDraftState();
    } catch (err) {
        clearInterval(interval);
        lyricsLoadingOverlay.hidden = true;
        alert("A IA demorou um pouco para responder. Por favor, clique em 'Regerar Letra' para tentar novamente.");
    }
}

function assignBlocksToState(blocks) {
    // Map blocks to 5 sections: Verse 1, Chorus, Verse 2, Bridge, Final
    state.lyricsBlocks = {
        verse1: "",
        chorus: "",
        verse2: "",
        bridge: "",
        final: ""
    };

    blocks.forEach((b) => {
        const h = (b.heading || "").toLowerCase();
        if (h.includes("verse 1") || h.includes("verso 1") || h.includes("intro")) {
            state.lyricsBlocks.verse1 = (state.lyricsBlocks.verse1 ? state.lyricsBlocks.verse1 + "\n\n" : "") + b.text;
        } else if (h.includes("chorus") || h.includes("refrão") || h.includes("refrao")) {
            if (!state.lyricsBlocks.chorus) state.lyricsBlocks.chorus = b.text;
            else if (!state.lyricsBlocks.final) state.lyricsBlocks.final = b.text;
        } else if (h.includes("verse 2") || h.includes("verso 2")) {
            state.lyricsBlocks.verse2 = b.text;
        } else if (h.includes("bridge") || h.includes("ponte")) {
            state.lyricsBlocks.bridge = b.text;
        } else if (h.includes("final") || h.includes("outro")) {
            state.lyricsBlocks.final = b.text;
        } else {
            if (!state.lyricsBlocks.verse1) state.lyricsBlocks.verse1 = b.text;
            else if (!state.lyricsBlocks.verse2) state.lyricsBlocks.verse2 = b.text;
            else state.lyricsBlocks.final = b.text;
        }
    });
}

function parseCustomLyricsIntoBlocks(text) {
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
    state.lyricsBlocks = {
        verse1: paragraphs[0] || text.slice(0, 150),
        chorus: paragraphs[1] || "Nosso amor é para sempre, em cada acorde e canção.",
        verse2: paragraphs[2] || "",
        bridge: paragraphs[3] || "",
        final: paragraphs[4] || ""
    };
}

function populateLyricTextareas() {
    lyricBlock1.value = state.lyricsBlocks.verse1 || "";
    lyricBlockChorus.value = state.lyricsBlocks.chorus || "";
    lyricBlock2.value = state.lyricsBlocks.verse2 || "";
    lyricBlockBridge.value = state.lyricsBlocks.bridge || "";
    lyricBlockFinal.value = state.lyricsBlocks.final || "";

    if (state.customerPhone) clientPhoneInput.value = state.customerPhone;
    if (state.customerEmail) clientEmailInput.value = state.customerEmail;
}

// Bind lyric textarea changes
[lyricBlock1, lyricBlockChorus, lyricBlock2, lyricBlockBridge, lyricBlockFinal].forEach((t) => {
    t.addEventListener("input", () => {
        state.lyricsBlocks.verse1 = lyricBlock1.value;
        state.lyricsBlocks.chorus = lyricBlockChorus.value;
        state.lyricsBlocks.verse2 = lyricBlock2.value;
        state.lyricsBlocks.bridge = lyricBlockBridge.value;
        state.lyricsBlocks.final = lyricBlockFinal.value;
        saveDraftState();
    });
});

clientPhoneInput.addEventListener("input", () => {
    state.customerPhone = clientPhoneInput.value.trim();
    saveDraftState();
});

clientEmailInput.addEventListener("input", () => {
    state.customerEmail = clientEmailInput.value.trim();
    saveDraftState();
});

document.getElementById("btnBackToStep2").addEventListener("click", () => goToStep(2));
document.getElementById("btnRegenerateLyrics").addEventListener("click", async () => {
    if (confirm("Deseja regerar a letra inteira com novas ideias?")) {
        await generateLyricsWithAI();
    }
});

document.getElementById("btnStep3Continue").addEventListener("click", () => {
    if (!clientPhoneInput.value.trim()) {
        alert("Por favor, digite seu número de WhatsApp para vincular suas músicas.");
        clientPhoneInput.focus();
        return;
    }
    if (!clientEmailInput.value.trim() || !clientEmailInput.value.includes("@")) {
        alert("Por favor, digite um e-mail válido para receber o comprovante.");
        clientEmailInput.focus();
        return;
    }

    state.customerPhone = clientPhoneInput.value.trim();
    state.customerEmail = clientEmailInput.value.trim();
    saveDraftState();

    goToStep(4);
    startMusicProduction();
});

// =========================================================
// STEP 4: PRODUCTION & SPOTIFY-STYLE PLAYERS
// =========================================================
function buildFullLyricsText() {
    return [
        `[Verse 1]\n${lyricBlock1.value.trim()}`,
        `[Chorus]\n${lyricBlockChorus.value.trim()}`,
        lyricBlock2.value.trim() ? `[Verse 2]\n${lyricBlock2.value.trim()}` : "",
        lyricBlockBridge.value.trim() ? `[Bridge]\n${lyricBlockBridge.value.trim()}` : "",
        `[Chorus]\n${lyricBlockChorus.value.trim()}`,
        lyricBlockFinal.value.trim() ? `[Final]\n${lyricBlockFinal.value.trim()}` : ""
    ].filter(Boolean).join("\n\n");
}

async function startMusicProduction() {
    // If already generated and we have audio urls, load players directly
    if (state.audioUrl1 && state.audioUrl2) {
        setupPlayer(1, state.audioUrl1);
        setupPlayer(2, state.audioUrl2);
        productionStatusText.textContent = "Suas 2 versões estão prontas para ouvir!";
        studioMeterFill.style.width = "100%";
        btnStep4Continue.disabled = false;
        return;
    }

    // Generate a unique session ID if not exists
    if (!state.sessionId) {
        state.sessionId = "mt_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
        saveDraftState();
    }

    const fullLyrics = buildFullLyricsText();
    productionStatusText.textContent = "Enviando composição para o estúdio de IA...";
    studioMeterFill.style.width = "25%";

    try {
        const response = await fetch(`${API_BASE}/api/music/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: state.sessionId,
                lyrics: fullLyrics,
                music_style: state.style,
                voice_gender: state.voiceGender,
                occasion: OCCASIONS_DATA[state.occasion]?.label || "Personal Song",
                customer_phone: state.customerPhone,
                customer_email: state.customerEmail
            })
        });

        const data = await response.json();
        if (!response.ok || data.error) {
            throw new Error(data.error || "Falha ao iniciar produção musical.");
        }

        state.taskId = data.task_id;
        state.conversionId1 = data.conversion_id_1;
        state.conversionId2 = data.conversion_id_2;
        saveDraftState();

        productionStatusText.textContent = "Estúdio renderizando as 2 versões em paralelo...";
        studioMeterFill.style.width = "50%";

        pollMusicVariants();
    } catch (err) {
        productionStatusText.textContent = "Erro na produção: " + err.message;
        alert(err.message);
    }
}

// Progressive polling: releases Track 1 immediately when ready!
let pollInterval = null;
function pollMusicVariants() {
    if (pollInterval) clearInterval(pollInterval);

    let progress1Done = false;
    let progress2Done = false;

    pollInterval = setInterval(async () => {
        try {
            // Check Version 1
            if (!progress1Done && state.conversionId1) {
                const res1 = await fetch(`${API_BASE}/api/music/status?conversion_id=${encodeURIComponent(state.conversionId1)}&session_id=${encodeURIComponent(state.sessionId)}`);
                const data1 = await res1.json();
                if (data1.audio_url && data1.status === "COMPLETED") {
                    progress1Done = true;
                    state.audioUrl1 = data1.audio_url;
                    saveDraftState();
                    setupPlayer(1, data1.audio_url);
                    productionStatusText.textContent = "Versão 1 pronta! Versão 2 finalizando em segundo plano...";
                    studioMeterFill.style.width = "75%";
                    btnStep4Continue.disabled = false; // allows advance!
                }
            }

            // Check Version 2
            if (!progress2Done && state.conversionId2) {
                const res2 = await fetch(`${API_BASE}/api/music/status?conversion_id=${encodeURIComponent(state.conversionId2)}&session_id=${encodeURIComponent(state.sessionId)}`);
                const data2 = await res2.json();
                if (data2.audio_url && data2.status === "COMPLETED") {
                    progress2Done = true;
                    state.audioUrl2 = data2.audio_url;
                    saveDraftState();
                    setupPlayer(2, data2.audio_url);
                }
            }

            // When both are done, stop polling
            if (progress1Done && progress2Done) {
                clearInterval(pollInterval);
                productionStatusText.textContent = "Parabéns! As 2 versões exclusivas foram concluídas com sucesso.";
                studioMeterFill.style.width = "100%";
                btnStep4Continue.disabled = false;
            }
        } catch (e) {
            console.warn("Polling error", e);
        }
    }, 4500);
}

// Setup custom player with 40-second preview protection
function setupPlayer(versionNum, audioUrl) {
    const audioEl = versionNum === 1 ? audioEl1 : audioEl2;
    const playBtn = versionNum === 1 ? playBtn1 : playBtn2;
    const playerCard = versionNum === 1 ? playerCard1 : playerCard2;
    const progressFill = versionNum === 1 ? progressFill1 : progressFill2;
    const timeCurrent = versionNum === 1 ? timeCurrent1 : timeCurrent2;
    const previewNotice = versionNum === 1 ? previewNotice1 : previewNotice2;

    audioEl.src = audioUrl;
    playBtn.disabled = false;
    playerCard.classList.add("is-ready");

    playBtn.onclick = () => {
        // Pause the other player
        const otherAudio = versionNum === 1 ? audioEl2 : audioEl1;
        const otherBtn = versionNum === 1 ? playBtn2 : playBtn1;
        otherAudio.pause();
        otherBtn.innerHTML = '<i class="fa-solid fa-play"></i>';

        if (audioEl.paused) {
            audioEl.play().catch(() => {});
            playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        } else {
            audioEl.pause();
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        }
    };

    audioEl.ontimeupdate = () => {
        const cur = audioEl.currentTime;
        const maxTime = 40; // 40-second complimentary preview limit
        const pct = Math.min(100, (cur / maxTime) * 100);
        progressFill.style.width = `${pct}%`;

        const mins = Math.floor(cur / 60);
        const secs = Math.floor(cur % 60).toString().padStart(2, "0");
        timeCurrent.textContent = `${mins}:${secs}`;

        // 40s preview limit enforcement
        if (cur >= maxTime) {
            audioEl.pause();
            playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
            previewNotice.hidden = false;
        }
    };

    audioEl.onended = () => {
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    };
}

btnStep4Continue.addEventListener("click", () => goToStep(5));

// =========================================================
// STEP 5: UNLOCK & STRIPE CHECKOUT
// =========================================================
btnStripeCheckout.addEventListener("click", async () => {
    btnStripeCheckout.disabled = true;
    btnStripeCheckout.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparando checkout seguro...';

    try {
        const response = await fetch(`${API_BASE}/api/payment/stripe/create`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                session_id: state.sessionId,
                client_name: state.fields.clientName || "Customer",
                customer_phone: state.customerPhone,
                customer_email: state.customerEmail,
                traffic_source: "funnel_v2"
            })
        });

        const data = await response.json();
        if (!response.ok || !data.checkout_url) {
            throw new Error(data.error || "Não foi possível gerar o link de pagamento.");
        }

        // Save session locally so My Songs recovers it
        localStorage.setItem("ss_current_music_session", state.sessionId);
        localStorage.setItem("ss_customer_phone", state.customerPhone);

        // Redirect to Stripe Checkout
        window.location.href = data.checkout_url;
    } catch (err) {
        alert(err.message);
        btnStripeCheckout.disabled = false;
        btnStripeCheckout.innerHTML = '<i class="fa-solid fa-lock"></i> Unlock Both Songs (£9.90) <i class="fa-solid fa-arrow-right"></i>';
    }
});

function setupEvents() {
    // Prevent right click on audio elements
    document.addEventListener("contextmenu", (e) => {
        if (e.target.closest("audio") || e.target.closest(".spotify-track-card")) {
            e.preventDefault();
        }
    });
}
