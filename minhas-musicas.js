const libraryGrid = document.getElementById("libraryGrid");
const libraryEmpty = document.getElementById("libraryEmpty");
const libraryStatus = document.getElementById("libraryStatus");
const libraryIntro = document.getElementById("libraryIntro");
const libraryRecoveryForm = document.getElementById("libraryRecoveryForm");
const libraryRecoveryPhone = document.getElementById("libraryRecoveryPhone");
const LOCAL_LIBRARY_KEY = "ss_music_library_cache";
const CUSTOMER_LIBRARY_KEY_STORAGE = "ss_customer_library_key";
const CUSTOMER_PHONE_STORAGE_KEY = "ss_customer_phone";
const CURRENT_SESSION_KEY = "ss_current_music_session";
const PREVIEW_SECONDS = 40;
let stripeCheckoutEnabled = false;

function trackPixel(eventName, data) {
    if (typeof window.fbq !== "function") return;
    window.fbq("track", eventName, data || {});
}

function trackGa(eventName, params) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", eventName, params || {});
}

function normalizeVoiceGender(value = "") {
    const normalized = String(value || "").trim().toLowerCase();
    if (["male", "masculina", "masculine", "man"].includes(normalized)) return "Male";
    if (["female", "feminina", "feminine", "woman"].includes(normalized)) return "Female";
    return "Female";
}

function getApiBaseUrl() {
    const { protocol, hostname, port, origin } = window.location;
    const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
    const isFileProtocol = protocol === "file:";

    if (isFileProtocol || (isLocalHost && port && port !== "3000")) {
        return "http://localhost:3000";
    }

    return origin;
}

function apiUrl(path) {
    return `${getApiBaseUrl()}${path}`;
}

function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getQueryValue(name) {
    return new URLSearchParams(window.location.search).get(name) || "";
}

function normalizeCustomerPhone(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.slice(0, 15);
}

function rememberCustomerLibraryKey(value) {
    const normalized = String(value || "").trim();
    if (!normalized) return "";
    localStorage.setItem(CUSTOMER_LIBRARY_KEY_STORAGE, normalized);
    return normalized;
}

function rememberCustomerPhone(value) {
    const normalized = normalizeCustomerPhone(value);
    if (!normalized) return "";
    localStorage.setItem(CUSTOMER_PHONE_STORAGE_KEY, normalized);
    return normalized;
}

function getCurrentSessionSnapshot() {
    try {
        const raw = localStorage.getItem(CURRENT_SESSION_KEY);
        if (!raw) return null;
        if (raw.trim().startsWith("{")) {
            return JSON.parse(raw);
        }
        return { session_id: raw, sessionId: raw };
    } catch (error) {
        return null;
    }
}

function getCustomerLibraryKey() {
    const queryValue = String(getQueryValue("customer_key") || "").trim();
    if (queryValue) {
        return rememberCustomerLibraryKey(queryValue);
    }

    const existing = String(localStorage.getItem(CUSTOMER_LIBRARY_KEY_STORAGE) || "").trim();
    if (existing) return existing;

    const session = getCurrentSessionSnapshot();
    const sessionKey = String(session?.customer_key || session?.customerKey || "").trim();
    if (sessionKey) {
        return rememberCustomerLibraryKey(sessionKey);
    }

    try {
        const raw = localStorage.getItem(LOCAL_LIBRARY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
            const itemWithKey = parsed.find((item) => String(item?.customer_key || "").trim());
            if (itemWithKey?.customer_key) {
                return rememberCustomerLibraryKey(itemWithKey.customer_key);
            }
        }
    } catch (error) {}

    return "";
}

function getCustomerPhone() {
    const queryValue = rememberCustomerPhone(getQueryValue("customer_phone"));
    if (queryValue) return queryValue;

    const existing = rememberCustomerPhone(localStorage.getItem(CUSTOMER_PHONE_STORAGE_KEY) || "");
    if (existing) return existing;

    const session = getCurrentSessionSnapshot();
    const sessionPhone = rememberCustomerPhone(session?.customer_phone || session?.customerPhone || "");
    if (sessionPhone) return sessionPhone;

    try {
        const raw = localStorage.getItem(LOCAL_LIBRARY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (Array.isArray(parsed)) {
            const itemWithPhone = parsed.find((item) => normalizeCustomerPhone(item?.customer_phone));
            if (itemWithPhone?.customer_phone) {
                return rememberCustomerPhone(itemWithPhone.customer_phone);
            }
        }
    } catch (error) {}

    return "";
}

function getRequestedRecoveryPhone() {
    return normalizeCustomerPhone(libraryRecoveryPhone?.value || "");
}

function getLocalLibraryItems(customerKey, customerPhone) {
    try {
        const raw = localStorage.getItem(LOCAL_LIBRARY_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) return [];

        const now = Date.now();
        const validItems = parsed.filter((item) => {
            const expiresAt = new Date(item?.expires_at || 0).getTime();
            return item?.session_id && expiresAt > now;
        });

        if (validItems.length !== parsed.length) {
            localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify(validItems));
        }

        if (!customerKey && !customerPhone) return validItems;

        return validItems.filter((item) => {
            const itemKey = String(item?.customer_key || "").trim();
            const itemPhone = normalizeCustomerPhone(item?.customer_phone || "");
            if (customerKey && itemKey === customerKey) return true;
            if (customerPhone && itemPhone === customerPhone) return true;
            return false;
        });
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

function mergeLibraryItems(serverItems, localItems) {
    const merged = new Map();

    localItems.forEach((item) => {
        if (!item?.session_id) return;
        merged.set(item.session_id, {
            ...item,
            paid: Boolean(item.paid),
            download_url_1: item.paid ? item.download_url_1 || "" : "",
            download_url_2: item.paid ? item.download_url_2 || "" : "",
            preview_url_1: item.preview_url_1 || item.download_url_1 || "",
            preview_url_2: item.preview_url_2 || item.download_url_2 || "",
        });
    });

    serverItems.forEach((item) => {
        if (!item?.session_id) return;
        const existing = merged.get(item.session_id) || {};
        const isPaid = Boolean(item.paid || existing.paid);
        merged.set(item.session_id, {
            ...existing,
            ...item,
            paid: isPaid,
            download_url_1: isPaid ? item.download_url_1 || existing.download_url_1 || "" : "",
            download_url_2: isPaid ? item.download_url_2 || existing.download_url_2 || "" : "",
            preview_url_1: item.preview_url_1 || existing.preview_url_1 || item.download_url_1 || "",
            preview_url_2: item.preview_url_2 || existing.preview_url_2 || item.download_url_2 || "",
        });
    });

    return Array.from(merged.values()).sort(
        (left, right) => new Date(right.updated_at || right.created_at || 0).getTime() - new Date(left.updated_at || left.created_at || 0).getTime()
    );
}

function upsertLocalLibraryItem(item) {
    if (!item?.session_id) return;
    const customerKey = item.customer_key || getCustomerLibraryKey();
    const customerPhone = normalizeCustomerPhone(item.customer_phone || getCustomerPhone());
    if (customerKey) rememberCustomerLibraryKey(customerKey);
    if (customerPhone) rememberCustomerPhone(customerPhone);
    const existingItems = getLocalLibraryItems("", "");
    const existing = existingItems.find((entry) => entry.session_id === item.session_id) || {};
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
        ...existingItems.filter((entry) => entry.session_id !== item.session_id),
    ];
    saveLocalLibraryItems(nextItems);
}

function setLibraryStatus(message, isError = false) {
    if (!libraryStatus) return;
    if (!message) {
        libraryStatus.hidden = true;
        libraryStatus.textContent = "";
        libraryStatus.classList.remove("is-error");
        return;
    }

    libraryStatus.hidden = false;
    libraryStatus.textContent = message;
    libraryStatus.classList.toggle("is-error", isError);
}

function formatDate(dateText) {
    if (!dateText) return "Date unavailable";
    const date = new Date(dateText);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return new Intl.DateTimeFormat("en-GB", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(date);
}

function triggerDownload(url) {
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noopener";
    link.download = "";
    document.body.appendChild(link);
    link.click();
    link.remove();
}

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

async function createPayment(sessionId) {
    const item = currentLibraryItems.find((entry) => entry.session_id === sessionId) || {};
    const response = await fetch(apiUrl("/api/payment/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            customer_key: item.customer_key || getCustomerLibraryKey(),
            traffic_source: item.traffic_source || null,
            client_name: item.client_name || "",
            customer_phone: item.customer_phone || "",
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "We could not start the payment.");
    }
    return data;
}

async function createStripeCheckout(sessionId) {
    const item = currentLibraryItems.find((entry) => entry.session_id === sessionId) || {};
    const response = await fetch(apiUrl("/api/payment/stripe/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            customer_key: item.customer_key || getCustomerLibraryKey(),
            traffic_source: item.traffic_source || null,
            client_name: item.client_name || "",
            customer_phone: item.customer_phone || "",
            customer_email: item.customer_email || "",
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "We could not start the Stripe checkout.");
    }
    return data;
}

async function startCheckoutForLibraryItem(sessionId, item) {
    const payment = await createPayment(sessionId);
    const embeddedOpened = await openEmbeddedCheckout(
        payment,
        sessionId,
        item,
        async (status) => {
            upsertLocalLibraryItem({
                ...item,
                paid: true,
                download_url_1: status.download_url_1 || "",
                download_url_2: status.download_url_2 || "",
            });
            await loadLibrary();
            setLibraryStatus("Payment confirmed. Your library has been updated.");
        }
    ).catch(() => false);

    if (!embeddedOpened) {
        openEmbeddedPaymentModal();
        setEmbeddedPaymentStatus("We could not open the PayPal checkout from the library right now. Please refresh the page and try again.", true);
        throw new Error("We could not open the PayPal checkout from the library right now. Please refresh the page and try again.");
    }

    return payment;
}

async function startStripeCheckoutForLibraryItem(sessionId) {
    const checkout = await createStripeCheckout(sessionId);
    if (!checkout?.checkout_url) {
        throw new Error("We could not generate the Stripe checkout link.");
    }
    window.location.assign(checkout.checkout_url);
    return checkout;
}

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
        <div class="payment-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="libraryPaymentModalTitle">
            <button type="button" class="payment-modal-close" aria-label="Close payment" data-close-payment-modal>
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="payment-modal-head">
                <span class="mini-label">Payment</span>
                <h3 id="libraryPaymentModalTitle">Complete your song without leaving the site</h3>
                <p id="libraryPaymentModalSubtitle">Secure payment via PayPal. Release remains automatic.</p>
            </div>
            <p id="libraryPaymentModalStatus" class="builder-status payment-modal-status" hidden></p>
            <div id="libraryPaymentModalBrick" class="payment-modal-brick"></div>
            <div id="libraryPaymentModalResult" class="payment-modal-result" hidden></div>
        </div>
    `;
    document.body.appendChild(overlay);

    overlay.querySelectorAll("[data-close-payment-modal]").forEach((element) => {
        element.addEventListener("click", () => closeEmbeddedPaymentModal());
    });

    embeddedPaymentModal = {
        overlay,
        status: overlay.querySelector("#libraryPaymentModalStatus"),
        brick: overlay.querySelector("#libraryPaymentModalBrick"),
        result: overlay.querySelector("#libraryPaymentModalResult"),
        subtitle: overlay.querySelector("#libraryPaymentModalSubtitle"),
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
    setEmbeddedPaymentStatus("Loading payment options...");
    document.body.classList.add("payment-modal-open");
}

function renderEmbeddedPaymentResult(result) {
    const modal = getEmbeddedPaymentModal();
    modal.brick.hidden = true;
    modal.result.hidden = false;

    if (result?.paid) {
        modal.subtitle.textContent = "Payment approved. We are releasing your music now.";
        modal.result.innerHTML = `
            <div class="payment-result-card is-success">
                <strong>Payment approved</strong>
                <p>Your song is being released automatically. You can close this window or wait a moment while the library updates.</p>
            </div>
        `;
        return;
    }

    modal.subtitle.textContent = "Payment received. We are confirming it with PayPal.";
    modal.result.innerHTML = `
        <div class="payment-result-card">
            <strong>Payment pending</strong>
            <p>We are tracking the confirmation. As soon as PayPal approves it, your library will update.</p>
        </div>
    `;
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

async function processEmbeddedPayment(sessionId, item, orderId, captureData) {
    const response = await fetch(apiUrl("/api/payment/process"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            customer_key: item.customer_key || getCustomerLibraryKey(),
            traffic_source: item.traffic_source || null,
            client_name: item.client_name || "",
            customer_phone: item.customer_phone || "",
            customer_email: item.customer_email || "",
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

async function openEmbeddedCheckout(payment, sessionId, item, onApproved) {
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
    modal.subtitle.textContent = "Pay with PayPal without leaving this page. Your music will be released automatically after approval.";

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
            setEmbeddedPaymentStatus("Confirming payment...");
            try {
                const captureData = await actions.order.capture();
                const result = await processEmbeddedPayment(sessionId, item, data.orderID || payment.order_id, captureData);
                renderEmbeddedPaymentResult(result);
                const status = await fetchPaymentStatus(sessionId);
                if (status?.paid) {
                    setEmbeddedPaymentStatus("Payment approved. Updating your library...");
                    await onApproved(status);
                    window.setTimeout(() => {
                        closeEmbeddedPaymentModal();
                    }, 1200);
                } else {
                    setEmbeddedPaymentStatus("Payment started. As soon as approval happens, your library will update.");
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

async function fetchPaymentStatus(sessionId) {
    const response = await fetch(apiUrl(`/api/payment/status?session_id=${encodeURIComponent(sessionId)}`));
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "We could not check the payment.");
    }
    return data;
}

async function confirmStripePayment(sessionId, stripeSessionId) {
    const response = await fetch(apiUrl("/api/payment/stripe/confirm"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: sessionId,
            stripe_session_id: stripeSessionId,
        }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data?.error || "We could not confirm the Stripe payment.");
    }
    return data;
}

async function getApprovedDownloadUrl(sessionId, version) {
    const status = await fetchPaymentStatus(sessionId);
    const url = version === 1
        ? status?.download_url_1 || ""
        : status?.download_url_2 || "";

    if (!status?.paid || !url) {
        throw new Error(`The version ${version} download will be released after payment confirmation.`);
    }

    return url;
}

async function fetchLibraryItems({ customerKey = "", customerPhone = "", sessionId = "" } = {}) {
    const params = new URLSearchParams();
    if (customerKey) params.set("customer_key", customerKey);
    if (customerPhone) params.set("customer_phone", customerPhone);
    if (sessionId) params.set("session_id", sessionId);
    const response = await fetch(apiUrl(`/api/music-library?${params.toString()}`));
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.error || "We could not load the library.");
    }
    if (data?.customer_key) rememberCustomerLibraryKey(data.customer_key);
    if (data?.customer_phone) rememberCustomerPhone(data.customer_phone);
    return data.items || [];
}

async function resolveSessionIdentifiers(sessionId, customerKey, customerPhone) {
    if (!sessionId || (customerKey && customerPhone)) {
        return { customerKey, customerPhone };
    }

    try {
        const response = await fetch(apiUrl(`/api/music-session?session_id=${encodeURIComponent(sessionId)}`));
        const sessionData = await response.json().catch(() => ({}));
        if (response.ok) {
            const nextCustomerKey = customerKey || rememberCustomerLibraryKey(sessionData.customer_key || "");
            const nextCustomerPhone = customerPhone || rememberCustomerPhone(sessionData.customer_phone || "");
            if (sessionData?.session_id) {
                upsertLocalLibraryItem(sessionData);
            }
            return { customerKey: nextCustomerKey, customerPhone: nextCustomerPhone };
        }
    } catch (error) {}

    return { customerKey, customerPhone };
}

function renderLibraryItem(item) {
    const statusClass = item.paid ? "is-paid" : "is-pending";
    const statusLabel = item.paid ? "Payment approved" : "Payment pending";
    const previewUrl1 = item.preview_url_1 || item.download_url_1 || "";
    const previewUrl2 = item.preview_url_2 || item.download_url_2 || "";
    const paymentButton = item.paid
        ? ""
        : `${stripeCheckoutEnabled ? `<button type="button" class="btn btn-primary" data-action="primary">Complete payment</button>` : ""}`;
    const getVideoButton = (version, videoUrl, videoTaskId) => {
        if (videoUrl) {
            return `<button type="button" class="btn btn-outline btn-video" data-action="download-video-${version}" data-url="${videoUrl}">Download Video ${version}</button>`;
        }
        if (videoTaskId) {
            return `<button type="button" class="btn btn-outline btn-video" data-action="status-video-${version}" data-task="${videoTaskId}" disabled>Generating Video ${version}...</button>`;
        }
        return `<button type="button" class="btn btn-outline btn-video" data-action="generate-video-${version}">Generate Video ${version}</button>`;
    };

    const paidDownloadButtons = item.paid
        ? `
                <button type="button" class="btn btn-outline" data-action="download-1">Download version 1</button>
                <button type="button" class="btn btn-outline" data-action="download-2">Download version 2</button>
                ${getVideoButton(1, item.video_url_1, item.video_task_id_1)}
                ${getVideoButton(2, item.video_url_2, item.video_task_id_2)}
          `
        : "";

    const audioControlsAttrs = item.paid ? "" : 'controlsList="nodownload noplaybackrate" disablePictureInPicture';

    return `
        <article class="library-card" data-session-id="${item.session_id}">
            <div class="library-card-head">
                <div>
                    <span class="result-badge">${item.badge || "Song ready"}</span>
                    <h3>${item.title || "Your song is ready"}</h3>
                    <p>${item.subtitle || "We found your temporary session."}</p>
                </div>
                <span class="library-payment-status ${statusClass}">${statusLabel}</span>
            </div>
            <div class="library-meta">
                <span><i class="fa-regular fa-calendar"></i> ${formatDate(item.created_at || item.updated_at)}</span>
                <span><i class="fa-solid fa-music"></i> ${item.occasion || "Special occasion"}</span>
                <span><i class="fa-solid fa-wave-square"></i> ${item.style || "Style not provided"}</span>
                <span><i class="fa-solid fa-microphone-lines"></i> Voice ${normalizeVoiceGender(item.voice_gender)}</span>
            </div>
            <div class="library-audios">
                <div class="library-audio-card">
                    <strong>Preview 1</strong>
                    <audio controls ${audioControlsAttrs} src="${previewUrl1}"></audio>
                </div>
                <div class="library-audio-card">
                    <strong>Preview 2</strong>
                    <audio controls ${audioControlsAttrs} src="${previewUrl2}"></audio>
                </div>
            </div>
            <div class="library-card-actions">
                ${paymentButton}
                ${paidDownloadButtons}
                <a href="/" class="btn btn-outline">Create another song</a>
            </div>
        </article>
    `;
}

function bindLibraryActions() {
    libraryGrid.querySelectorAll(".library-card").forEach((card) => {
        const sessionId = card.dataset.sessionId;
        const button = card.querySelector('[data-action="primary"]');
        const download1Btn = card.querySelector('[data-action="download-1"]');
        const download2Btn = card.querySelector('[data-action="download-2"]');
        const audios = card.querySelectorAll("audio");

        audios.forEach((audio) => {
            attachPreviewLimiter(audio);
            audio.addEventListener("play", () => {
                audios.forEach((otherAudio) => {
                    if (otherAudio === audio) return;
                    otherAudio.pause();
                });
            });
        });

        button?.addEventListener("click", async () => {
            const item = currentLibraryItems.find((entry) => entry.session_id === sessionId);
            if (!item) return;

            button.disabled = true;
            try {
                if (item.paid) return;
                setLibraryStatus("Redirecting you to the secure card checkout...");
                await startStripeCheckoutForLibraryItem(sessionId);
            } catch (error) {
                setLibraryStatus(error.message || "We could not continue the payment.", true);
            } finally {
                button.disabled = false;
            }
        });

        download1Btn?.addEventListener("click", async () => {
            download1Btn.disabled = true;
            try {
                const url = await getApprovedDownloadUrl(sessionId, 1);
                triggerDownload(url);
            } catch (error) {
                setLibraryStatus(error.message || "The version 1 download will be released after payment confirmation.", true);
                await loadLibrary();
            } finally {
                download1Btn.disabled = false;
            }
        });

        download2Btn?.addEventListener("click", async () => {
            download2Btn.disabled = true;
            try {
                const url = await getApprovedDownloadUrl(sessionId, 2);
                triggerDownload(url);
            } catch (error) {
                setLibraryStatus(error.message || "The version 2 download will be released after payment confirmation.", true);
                await loadLibrary();
            } finally {
                download2Btn.disabled = false;
            }
        });

        const setupVideoActions = (version) => {
            const genBtn = card.querySelector(`[data-action="generate-video-${version}"]`);
            const dlBtn = card.querySelector(`[data-action="download-video-${version}"]`);
            const statusBtn = card.querySelector(`[data-action="status-video-${version}"]`);

            if (genBtn) {
                genBtn.addEventListener("click", async () => {
                    genBtn.disabled = true;
                    genBtn.textContent = "Requesting Video...";
                    try {
                        const response = await fetch(apiUrl("/api/music/create-video"), {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ sessionId, version })
                        });
                        const data = await response.json();
                        if (!response.ok) throw new Error(data.error || "Failed to generate video");
                        
                        genBtn.textContent = `Generating Video ${version}...`;
                        genBtn.classList.add("is-waiting");
                        
                        pollVideoStatus(sessionId, version, data.videoTaskId, genBtn);
                    } catch (err) {
                        setLibraryStatus(err.message, true);
                        genBtn.disabled = false;
                        genBtn.textContent = `Generate Video ${version}`;
                    }
                });
            }

            if (dlBtn) {
                dlBtn.addEventListener("click", () => {
                    triggerDownload(dlBtn.dataset.url);
                });
            }

            if (statusBtn) {
                pollVideoStatus(sessionId, version, statusBtn.dataset.task, statusBtn);
            }
        };

        setupVideoActions(1);
        setupVideoActions(2);
    });
}

async function pollVideoStatus(sessionId, version, videoTaskId, btnElement) {
    if (!videoTaskId) return;
    try {
        const response = await fetch(apiUrl(`/api/music/video-status?videoTaskId=${encodeURIComponent(videoTaskId)}&sessionId=${encodeURIComponent(sessionId)}&version=${version}`));
        const data = await response.json();

        if (data.status === "SUCCESS" && data.videoUrl) {
            btnElement.textContent = `Download Video ${version}`;
            btnElement.classList.remove("is-waiting");
            btnElement.disabled = false;
            // Overwrite click event to trigger download
            btnElement.replaceWith(btnElement.cloneNode(true));
            const newBtn = document.querySelector(`[data-action="status-video-${version}"], [data-action="generate-video-${version}"]`);
            if (newBtn) {
                newBtn.dataset.action = `download-video-${version}`;
                newBtn.dataset.url = data.videoUrl;
                newBtn.addEventListener("click", () => triggerDownload(data.videoUrl));
            }
            return;
        } else if (data.status === "FAILED") {
            btnElement.textContent = `Video ${version} Failed`;
            btnElement.classList.remove("is-waiting");
            setLibraryStatus(data.error || "Video generation failed.", true);
            return;
        }
        
        // Still pending, poll again in 10 seconds
        setTimeout(() => pollVideoStatus(sessionId, version, videoTaskId, btnElement), 10000);
    } catch (err) {
        console.error("Polling error:", err);
        setTimeout(() => pollVideoStatus(sessionId, version, videoTaskId, btnElement), 10000);
    }

let currentLibraryItems = [];

async function loadLibrary() {
    let customerKey = getCustomerLibraryKey();
    let customerPhone = getCustomerPhone();
    const sessionId = String(getQueryValue("session_id") || getCurrentSessionSnapshot()?.session_id || "").trim();
    const paymentStatus = String(getQueryValue("payment") || getQueryValue("pagamento") || "").trim();
    const stripeSessionId = String(getQueryValue("stripe_session_id") || "").trim();
    const shouldRetryAfterPayment = Boolean(sessionId && paymentStatus);
    const paymentConfig = await fetchPaymentConfig().catch(() => null);
    stripeCheckoutEnabled = Boolean(paymentConfig?.stripe?.enabled);

    if (sessionId && stripeSessionId) {
        try {
            const confirmResult = await confirmStripePayment(sessionId, stripeSessionId);
            setLibraryStatus("Stripe payment identified. We are updating your library.");
            
            if (confirmResult?.paid) {
                trackPixel("Purchase", {
                    content_name: "Memory Tune personalised song",
                    content_ids: ["memory-tune-personalised-song"],
                    content_type: "product",
                    value: confirmResult.amount || 9.90,
                    currency: "GBP",
                });
                trackGa("purchase", {
                    transaction_id: sessionId,
                    value: confirmResult.amount || 9.90,
                    currency: "GBP",
                    items: [{ item_id: "memory-tune-personalised-song", item_name: "Memory Tune personalised song", quantity: 1 }],
                });
                trackGa("conversion_event_purchase", {
                    transaction_id: sessionId,
                    value: confirmResult.amount || 9.90,
                    currency: "GBP",
                });
            }
        } catch (error) {
            setLibraryStatus(error.message || "We could not confirm your Stripe payment yet.", true);
        }
    }

    const attemptLoad = async () => {
        const identifiers = await resolveSessionIdentifiers(sessionId, customerKey, customerPhone);
        customerKey = identifiers.customerKey;
        customerPhone = identifiers.customerPhone;
        const localItems = getLocalLibraryItems(customerKey, customerPhone);
        let serverItems = [];

        try {
            serverItems = await fetchLibraryItems({ customerKey, customerPhone, sessionId });
        } catch (error) {
            if (!localItems.length) {
                throw error;
            }
            setLibraryStatus("We are showing the library saved in this browser while the server sync completes.");
        }
        return mergeLibraryItems(serverItems, localItems);
    };

    let items = await attemptLoad();

    if (!items.length && shouldRetryAfterPayment) {
        setLibraryStatus("Payment identified. We are locating your song, which may take a few seconds.");
        for (let attempt = 0; attempt < 6; attempt += 1) {
            await delay(3000);
            items = await attemptLoad().catch(() => []);
            if (items.length) {
                break;
            }
        }
    }

    items.forEach((item) => {
        if (item?.customer_key) rememberCustomerLibraryKey(item.customer_key);
        if (item?.customer_phone) rememberCustomerPhone(item.customer_phone);
    });
    saveLocalLibraryItems(items);
    currentLibraryItems = items;

    if (!items.length) {
        if (libraryGrid) libraryGrid.hidden = true;
        if (libraryEmpty) libraryEmpty.hidden = false;
        if (libraryIntro) {
            libraryIntro.textContent = shouldRetryAfterPayment
                ? "We are still looking for your paid song. If payment was just confirmed, please wait a little and refresh the page."
                : "We have not found saved songs in this library yet.";
        }
        return;
    }

    if (libraryIntro) {
        libraryIntro.textContent = `${items.length} ${items.length === 1 ? "song found" : "songs found"} in this temporary library.`;
    }

    libraryGrid.innerHTML = items.map(renderLibraryItem).join("");
    libraryGrid.hidden = false;
    libraryEmpty.hidden = true;
    if (shouldRetryAfterPayment) {
        setLibraryStatus("Your song was found and the library is now updated.");
    } else {
        setLibraryStatus("");
    }
    bindLibraryActions();
}

if (libraryRecoveryForm) {
    libraryRecoveryForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const phone = getRequestedRecoveryPhone();
        if (!/^\d{10,15}$/.test(phone)) {
            setLibraryStatus("Enter the same WhatsApp number used in your order, including the country code.", true);
            libraryRecoveryPhone?.focus();
            return;
        }

        rememberCustomerPhone(phone);
        setLibraryStatus("We are looking for your songs using that WhatsApp number...");
        if (libraryRecoveryPhone) {
            libraryRecoveryPhone.value = phone;
        }

        try {
            await loadLibrary();
            if (currentLibraryItems.length) {
                setLibraryStatus("We found your songs and updated the library.");
            } else {
                setLibraryStatus("We have not found songs for that WhatsApp number yet. If payment just happened, please wait a little and try again.", true);
            }
        } catch (error) {
            setLibraryStatus(error.message || "We could not search for your songs right now.", true);
        }
    });
}

(async () => {
    try {
        await loadLibrary();
    } catch (error) {
        setLibraryStatus(error.message || "We could not load your library right now.", true);
        libraryGrid.hidden = true;
        libraryEmpty.hidden = false;
    }
})();

