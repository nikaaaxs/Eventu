import { translations } from './translations.js';

// API base URL comes from config.js (window.APP_CONFIG), which auto-detects
// local vs production. Falls back to localhost only if config.js failed to load.
const API_BASE_URL = (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || 'http://localhost:8000';

// Which portal this is (config.js). Used to fetch only this portal's events via
// /events?site=<key>. Empty/missing → fetch all (safe fallback).
const SITE_KEY = (window.APP_CONFIG && window.APP_CONFIG.SITE_KEY) || '';

// State
let currentLang = localStorage.getItem('lang') || 'ua';
let user = (() => { try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; } })();
let authToken = localStorage.getItem('student_token') || '';   // student JWT (Bearer)
let cookieConsent = localStorage.getItem('cookie-consent') === 'true';

let eventsData = [];
let categoriesData = [];   // admin-managed categories: [{id, label:{ua,en}}]
let comments = [];

let activeFilter = 'All';
let gdprAgreed = false;

function escHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

const LOCALES = { ua: 'uk-UA', en: 'en-GB' };
function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(String(iso).replace(' ', 'T'));
    if (isNaN(d.getTime())) return escHtml(iso);
    try {
        return d.toLocaleString(LOCALES[currentLang] || 'en-GB', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    } catch { return d.toISOString(); }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
    initModals();
    initBookForm();
    initMobileMenu();
    fetchCategories();
    fetchEvents();
    fetchReviews();
    initCounters();
    initCookieConsent();
    updateAuthUI();
    validateSession();
    initGoogleAuth();
    lucide.createIcons();
});

async function fetchEvents() {
    try {
        const url = `${API_BASE_URL}/events${SITE_KEY ? `?site=${encodeURIComponent(SITE_KEY)}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch events (HTTP ${response.status})`);
        eventsData = await response.json();
    } catch (err) {
        console.warn('Could not load events from API:', err);
        eventsData = [];
    } finally {
        window.__eventuEvents = eventsData;   // expose for the AI widget (classic script)
        renderEvents();
        openEventFromHash();
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/categories`);
        if (!response.ok) throw new Error(`Failed to fetch categories (HTTP ${response.status})`);
        categoriesData = await response.json();
    } catch (err) {
        console.warn('Could not load categories from API:', err);
        categoriesData = [];
    } finally {
        initEventFilters();
        renderEvents();
    }
}

function categoryLabelFor(typeId) {
    const c = categoriesData.find(c => c.id === typeId);
    if (c && c.label) return c.label[currentLang] || c.label.en || typeId;
    return typeId || '';
}

async function fetchReviews() {
    try {
        const url = `${API_BASE_URL}/reviews${SITE_KEY ? `?site=${encodeURIComponent(SITE_KEY)}` : ''}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        comments = await response.json();
    } catch (err) {
        console.warn('Reviews API unavailable:', err);
        comments = [];
    } finally {
        renderReviews();
    }
}

// ── i18n ────────────────────────────────────────────────────────────────────
function initLanguage() {
    updateLanguage(currentLang);
    document.querySelectorAll('[data-lang]').forEach(el => {
        el.addEventListener('click', () => setLanguage(el.getAttribute('data-lang')));
    });
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    updateLanguage(lang);
    initEventFilters();
    renderEvents();
    renderReviews();
    renderVenues();
    renderLegalInfo();

    document.querySelectorAll('[data-lang]').forEach(el => {
        const on = el.getAttribute('data-lang') === lang;
        el.classList.toggle('opacity-60', !on);
        el.classList.toggle('text-primary', on);
        el.classList.toggle('dark:text-accent', on);
        el.classList.toggle('font-bold', on);
    });
    document.querySelectorAll('#lang-selector-mobile button').forEach(el => {
        const on = el.getAttribute('data-lang') === lang;
        el.classList.toggle('text-primary', on);
        el.classList.toggle('dark:text-accent', on);
        el.classList.toggle('text-slate-600', !on);
        el.classList.toggle('dark:text-slate-500', !on);
    });
}

function updateLanguage(lang) {
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const keys = el.getAttribute('data-i18n').split('.');
        let value = t;
        keys.forEach(key => { value = value ? value[key] : null; });
        if (value) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = value;
            else el.textContent = value;
        }
    });
}

// ── Theme ─────────────────────────────────────────────────────────────────────
function initTheme() {
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const dark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
    });
}

function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    btn.addEventListener('click', () => menu.classList.toggle('hidden'));
    menu.querySelectorAll('a, button').forEach(el => el.addEventListener('click', () => menu.classList.add('hidden')));
}

// ── Modals ──────────────────────────────────────────────────────────────────
function initModals() {
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
        el.addEventListener('click', (e) => {
            if (el.classList.contains('modal-overlay') && e.target !== el) return;
            closeAllModals();
        });
    });
    document.querySelectorAll('#auth-tabs [data-auth-tab]').forEach(tabBtn => {
        tabBtn.addEventListener('click', () => switchAuthTab(tabBtn.dataset.authTab));
    });
    document.getElementById('login-form')?.addEventListener('submit', handleEmailLogin);
    document.getElementById('register-form')?.addEventListener('submit', handleRegister);
    document.getElementById('gdpr-checkbox-container').addEventListener('click', () => setGdprState(!gdprAgreed));
}

function openModal(el) {
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    // Google buttons must render while the modal is visible, else they get 0 width.
    if (el && el.id === 'auth-modal' && window.google?.accounts?.id) {
        renderGoogleButton('google-signin-btn', 'signin_with');
        renderGoogleButton('google-signup-btn', 'signup_with');
    }
}
function closeAllModals() {
    document.querySelectorAll('#auth-modal, #book-modal, #event-details-modal').forEach(el => el.classList.add('hidden'));
    document.body.style.overflow = 'auto';
}

// ── Booking flow ──────────────────────────────────────────────────────────────
function requireBookingReady() {
    if (!cookieConsent) { alert(translations[currentLang].cookies.required); return false; }
    if (!authToken) {
        openModal(document.getElementById('auth-modal'));
        showAuthError(translations[currentLang].auth.loginRequired);
        return false;
    }
    return true;
}

function openBookModal(eventId) {
    const ev = eventsData.find(e => String(e.id) === String(eventId));
    if (!ev) return;
    if (!requireBookingReady()) return;

    const t = translations[currentLang];
    resetBookForm();
    document.getElementById('book-event-id').value = ev.id;
    const title = (ev.title && (ev.title[currentLang] || ev.title.en)) || '';
    document.getElementById('book-event-badge').innerHTML =
        `<i data-lucide="ticket" class="w-4 h-4"></i> ${escHtml(title)}`;
    // One ticket per account per event — the quantity field stays locked at 1.
    const qty = document.getElementById('book-quantity');
    qty.value = 1; qty.max = 1;
    if (user) {
        if (user.displayName && user.displayName !== 'User') document.getElementById('book-name').value = user.displayName;
        if (user.email) document.getElementById('book-email').value = user.email;
    }
    openModal(document.getElementById('book-modal'));
    lucide.createIcons();
}

function resetBookForm() {
    document.getElementById('book-step-1').classList.remove('hidden');
    document.getElementById('book-success').classList.add('hidden');
    document.getElementById('book-form').reset();
    document.getElementById('book-quantity').value = 1;
    setGdprState(false);
}

function setGdprState(agreed) {
    gdprAgreed = agreed;
    const gdprBox = document.getElementById('gdpr-checkbox');
    const submitBtn = document.getElementById('btn-book-submit');
    if (!gdprBox || !submitBtn) return;
    const icon = gdprBox.querySelector('i, svg');
    if (agreed) {
        gdprBox.style.backgroundColor = 'var(--accent)';
        gdprBox.style.borderColor = 'var(--accent)';
        if (icon) icon.classList.remove('hidden');
    } else {
        gdprBox.style.backgroundColor = '';
        gdprBox.style.borderColor = '';
        if (icon) icon.classList.add('hidden');
    }
    submitBtn.disabled = !agreed;
}

function flashFieldError(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.classList.add('ring-2', '!ring-red-400', '!border-red-400');
    el.focus();
    setTimeout(() => el.classList.remove('ring-2', '!ring-red-400', '!border-red-400'), 2000);
}

function initBookForm() {
    const form = document.getElementById('book-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const t = translations[currentLang].book;
        const btn = document.getElementById('btn-book-submit');

        const eventId = document.getElementById('book-event-id').value;
        const name = (document.getElementById('book-name').value || '').trim();
        const email = (document.getElementById('book-email').value || '').trim();
        const phone = (document.getElementById('book-phone').value || '').trim();
        const quantity = Math.max(1, parseInt(document.getElementById('book-quantity').value || '1', 10));
        const comment = (document.getElementById('book-comment').value || '').trim();

        if (!name || name.length < 2) { flashFieldError('book-name'); return; }
        if (!email) { flashFieldError('book-email'); return; }
        if (!eventId) return;

        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-5 h-5 inline animate-spin"></i>';
        lucide.createIcons();

        const payload = {
            student_name: name, email, phone: phone || null,
            event_id: eventId, quantity, comment: comment || null,
            consent: true, lang: currentLang,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/bookings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.status === 409) { showBookError(t.soldOut); await fetchEvents(); return; }
            if (!response.ok) throw new Error(`API ${response.status}`);
            const data = await response.json();

            document.getElementById('book-step-1').classList.add('hidden');
            const success = document.getElementById('book-success');
            success.classList.remove('hidden');
            document.getElementById('book-ticket-code').textContent =
                data.ticket_code ? `${t.ticketCode}: ${data.ticket_code}` : '';
            await fetchEvents();  // refresh seat availability
            lucide.createIcons();
        } catch (err) {
            console.error('Booking error:', err);
            showBookError(t.error);
        } finally {
            btn.innerHTML = `<span data-i18n="book.submit">${translations[currentLang].book.submit}</span>`;
            btn.disabled = !gdprAgreed;
            lucide.createIcons();
        }
    });
}

function showBookError(msg) {
    const btn = document.getElementById('btn-book-submit');
    const el = document.createElement('p');
    el.className = 'text-red-500 text-xs font-bold text-center mt-3 animate-fade-in';
    el.textContent = msg;
    btn.insertAdjacentElement('afterend', el);
    setTimeout(() => el.remove(), 4000);
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function logout() {
    user = null; authToken = '';
    localStorage.removeItem('user');
    localStorage.removeItem('student_token');
    if (window.google?.accounts?.id) google.accounts.id.disableAutoSelect();
    updateAuthUI();
    renderReviews();
}

function setSession(token, fullName, email) {
    authToken = token || '';
    user = { displayName: fullName || email || 'User', email: email || '' };
    localStorage.setItem('student_token', authToken);
    localStorage.setItem('user', JSON.stringify(user));
    closeAllModals();
    updateAuthUI();
    renderReviews();
}

function showAuthError(msg) {
    const el = document.getElementById('auth-error');
    if (!el) { alert(msg); return; }
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
}

async function validateSession() {
    if (!authToken) return;
    try {
        const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (res.status === 401) { logout(); return; }
        if (!res.ok) return;
        const d = await res.json();
        user = { displayName: d.full_name || d.email || 'User', email: d.email || '' };
        localStorage.setItem('user', JSON.stringify(user));
        updateAuthUI();
        renderReviews();
    } catch (err) {
        console.warn('Session validation skipped (offline):', err);
    }
}

function switchAuthTab(tab) {
    document.querySelectorAll('#auth-tabs [data-auth-tab]').forEach(b => {
        const on = b.dataset.authTab === tab;
        b.classList.toggle('bg-primary', on);
        b.classList.toggle('dark:bg-accent', on);
        b.classList.toggle('text-white', on);
        b.classList.toggle('dark:text-slate-900', on);
        b.classList.toggle('glass', !on);
        b.classList.toggle('text-slate-600', !on);
    });
    document.getElementById('login-form')?.classList.toggle('hidden', tab !== 'login');
    document.getElementById('register-form')?.classList.toggle('hidden', tab !== 'register');
    document.getElementById('auth-error')?.classList.add('hidden');
    // Re-render the now-visible tab's Google button so it lays out at full width.
    if (tab === 'register') renderGoogleButton('google-signup-btn', 'signup_with');
    else renderGoogleButton('google-signin-btn', 'signin_with');
}

async function handleEmailLogin(e) {
    e.preventDefault();
    if (!cookieConsent) { showAuthError(translations[currentLang].cookies.required); return; }
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value;
    if (!email || !password) return;
    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        if (res.status === 401) { showAuthError('Incorrect email or password.'); return; }
        if (res.status === 429) { showAuthError('Too many attempts. Try again shortly.'); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        setSession(d.access_token, d.full_name, d.email);
    } catch (err) {
        console.error('Login error:', err);
        showAuthError('Server unavailable. Please try again.');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    if (!cookieConsent) { showAuthError(translations[currentLang].cookies.required); return; }
    const full_name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-pass').value;
    if (!full_name || !email || !password) { showAuthError('Please fill in all fields.'); return; }
    if (password.length < 6) { showAuthError('Password must be at least 6 characters.'); return; }
    try {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ full_name, email, password }),
        });
        if (res.status === 409) { showAuthError('This email is already registered.'); return; }
        if (res.status === 429) { showAuthError('Too many attempts. Try again shortly.'); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        setSession(d.access_token, d.full_name, d.email);
    } catch (err) {
        console.error('Register error:', err);
        showAuthError('Server unavailable. Please try again.');
    }
}

// ── Google Identity Services ────────────────────────────────────────────────
function googleClientId() {
    const id = window.APP_CONFIG && window.APP_CONFIG.GOOGLE_CLIENT_ID;
    return (id && !id.startsWith('YOUR_GOOGLE_CLIENT_ID')) ? id : null;
}

async function handleGoogleCredential(response) {
    if (!cookieConsent) { alert(translations[currentLang].cookies.required); return; }
    try {
        const res = await fetch(`${API_BASE_URL}/auth/google`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: response.credential }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = await res.json();
        setSession(d.access_token, d.full_name, d.email);
    } catch (err) {
        console.error('Google login error:', err);
        showAuthError('Google sign-in failed. Please try again.');
    }
}

// Render a Google button into one container. `text` picks the label Google shows:
// 'signin_with' (Login tab) or 'signup_with' (Register tab) — both hit /auth/google,
// which creates the account if new (registration) or signs in if it exists (login).
function renderGoogleButton(id, text) {
    const c = document.getElementById(id);
    if (!c || !window.google?.accounts?.id) return;
    c.innerHTML = '';
    const locale = (typeof currentLang !== 'undefined' && currentLang === 'ua') ? 'uk' : 'en';
    google.accounts.id.renderButton(c, {
        theme: 'outline', size: 'large', shape: 'pill', width: 300, text, locale,
    });
}

function initGoogleAuth() {
    const clientId = googleClientId();
    if (!clientId || !window.google?.accounts?.id) return;
    google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCredential, auto_select: false });
    renderGoogleButton('google-signin-btn', 'signin_with');   // Login tab
    renderGoogleButton('google-signup-btn', 'signup_with');   // Register tab
}
window.onGoogleLibraryLoad = initGoogleAuth;

function updateAuthUI() {
    const desktop = document.getElementById('auth-status-desktop');
    const t = translations[currentLang];
    if (user) {
        const firstName = (user.displayName || user.email || '').split(' ')[0];
        desktop.innerHTML = `
            <div class="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-6">
               <span class="text-slate-600 dark:text-slate-400 capitalize font-bold">Hi, ${escHtml(firstName)}</span>
               <button data-action="my-bookings" title="${escHtml(t.mybookings.button)}" class="text-primary dark:text-accent hover:text-accent transition-colors cursor-pointer"><i data-lucide="ticket" class="w-3.5 h-3.5"></i></button>
               <button data-action="logout" class="text-primary dark:text-accent hover:text-red-500 transition-colors cursor-pointer"><i data-lucide="log-out" class="w-3.5 h-3.5"></i></button>
             </div>`;
    } else {
        desktop.innerHTML = `
            <button data-action="open-auth" class="flex items-center gap-1.5 text-primary dark:text-accent hover:text-accent transition-colors border-l border-slate-200 dark:border-slate-800 pl-6 cursor-pointer">
                <i data-lucide="log-in" class="w-3 h-3"></i>
                <span data-i18n="auth.login">${t.auth.login}</span>
            </button>`;
    }
    lucide.createIcons();
}

// Global delegated action handler (survives innerHTML re-renders; also covers the
// hero "My tickets" button which lives outside #auth-status-desktop).
document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === 'logout') logout();
    else if (action === 'open-auth') openModal(document.getElementById('auth-modal'));
    else if (action === 'my-bookings') openMyBookings();
});

// ── Event alerts: email subscribe ─────────────────────────────────────────────
(function initSubscribe() {
    const form = document.getElementById('subscribe-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const input = document.getElementById('subscribe-email');
        const msg = document.getElementById('subscribe-msg');
        const t = translations[currentLang].alerts;
        const email = (input.value || '').trim();
        if (!email) return;
        msg.classList.remove('hidden');
        try {
            const res = await fetch(`${API_BASE_URL}/subscribe`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, site: SITE_KEY, lang: currentLang }),
            });
            msg.textContent = res.ok ? t.success : t.error;
            msg.className = 'text-sm mt-3 font-bold ' + (res.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500');
            if (res.ok) input.value = '';
        } catch {
            msg.textContent = t.error;
            msg.className = 'text-sm mt-3 font-bold text-red-500';
        }
    });
})();

// ── "My tickets": logged-in student's bookings + their status ──────────────────
async function openMyBookings() {
    if (!authToken) { openModal(document.getElementById('auth-modal')); return; }
    const t = translations[currentLang];
    let modal = document.getElementById('mybookings-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'mybookings-modal';
        modal.className = 'fixed inset-0 z-[1000] flex items-center justify-center p-4 hidden';
        modal.innerHTML =
            '<div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" data-close></div>' +
            '<div class="relative w-full max-w-lg max-h-[80vh] overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">' +
              '<div class="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">' +
                '<h3 class="font-black uppercase tracking-tight text-primary dark:text-white" data-mb="title"></h3>' +
                '<button data-close class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><i data-lucide="x" class="w-4 h-4"></i></button>' +
              '</div>' +
              '<div data-mb="body" class="p-5 overflow-y-auto space-y-3 text-sm"></div>' +
            '</div>';
        document.body.appendChild(modal);
        modal.querySelectorAll('[data-close]').forEach((el) =>
            el.addEventListener('click', () => { modal.classList.add('hidden'); modal.classList.remove('flex'); }));
    }
    modal.querySelector('[data-mb="title"]').textContent = t.mybookings.title;
    const body = modal.querySelector('[data-mb="body"]');
    body.innerHTML = '<div class="text-center text-slate-400 py-10"><i data-lucide="loader-2" class="w-6 h-6 inline animate-spin"></i></div>';
    modal.classList.remove('hidden'); modal.classList.add('flex');
    lucide.createIcons();

    try {
        const res = await fetch(`${API_BASE_URL}/my-bookings`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (!res.ok) throw new Error('http ' + res.status);
        const data = await res.json();
        const bookings = data.bookings || [];
        if (!bookings.length) { body.innerHTML = `<p class="text-center text-slate-400 py-10">${escHtml(t.mybookings.empty)}</p>`; return; }
        const badge = {
            reserved:  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
            confirmed: 'bg-green-500/15 text-green-600 dark:text-green-400',
            attended:  'bg-purple-500/15 text-purple-600 dark:text-purple-400',
            cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
        };
        body.innerHTML = bookings.map((b) => {
            const st = b.status || 'reserved';
            const ev = eventsData.find(e => String(e.id) === String(b.event_id));
            const title = ev ? ((ev.title && (ev.title[currentLang] || ev.title.en)) || b.event_id) : b.event_id;
            let date = '';
            try { date = b.created_at ? new Date(String(b.created_at).replace(' ', 'T')).toLocaleDateString() : ''; } catch {}
            return '<div class="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">' +
                `<div><div class="font-bold text-primary dark:text-white">${escHtml(title)}</div>` +
                `<div class="text-xs text-slate-400">${escHtml(b.ticket_code || '')} · ×${escHtml(String(b.quantity || 1))} · ${escHtml(date)}</div></div>` +
                `<span class="text-[10px] font-bold px-2.5 py-1 rounded-full ${badge[st] || badge.reserved}">${escHtml(t.mybookings[st] || st)}</span>` +
            '</div>';
        }).join('');
    } catch {
        body.innerHTML = `<p class="text-center text-red-500 py-10">${escHtml(t.mybookings.error)}</p>`;
    }
    lucide.createIcons();
}

// ── Events ────────────────────────────────────────────────────────────────────
function initEventFilters() {
    const container = document.getElementById('event-filters');
    if (!container) return;
    const categories = [
        { id: 'All', label: { ua: 'Всі', en: 'All' } },
        ...categoriesData.map(c => ({ id: c.id, label: c.label || {} })),
    ];
    container.innerHTML = categories.map(cat => `
        <button data-filter="${escHtml(cat.id)}" class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeFilter === cat.id ? 'bg-primary dark:bg-accent text-white dark:text-slate-900 shadow-lg' : 'glass-card border-none text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}">
            ${escHtml(cat.label[currentLang] || cat.label.en || cat.id)}
        </button>`).join('');
    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => { activeFilter = btn.getAttribute('data-filter'); initEventFilters(); renderEvents(); });
    });
}

function openEventFromHash() {
    const m = (location.hash || '').match(/^#event-(.+)$/);
    if (!m) return;
    const id = decodeURIComponent(m[1]);
    if (Array.isArray(eventsData) && eventsData.some(e => String(e.id) === String(id))) openEventDetails(id);
}

function seatsBadge(ev, t) {
    const avail = ev.seats_available;
    if (avail === null || avail === undefined) return `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-400/15 text-slate-500 dark:text-slate-400">${escHtml(t.events.unlimited)}</span>`;
    if (avail <= 0) return `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 dark:text-red-400">${escHtml(t.events.soldOut)}</span>`;
    return `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400">${avail} ${escHtml(t.events.seatsLeft)}</span>`;
}

function injectEventLD() {
    const prev = document.getElementById('event-ld');
    if (prev) prev.remove();
    if (!Array.isArray(eventsData) || !eventsData.length) return;
    const cfg = window.APP_CONFIG || {};
    const siteUrl = (cfg.SITE_URL || location.origin).replace(/\/$/, '');
    const toISO = (s) => { if (!s) return undefined; const d = new Date(String(s).replace(' ', 'T')); return isNaN(d.getTime()) ? undefined : d.toISOString(); };
    const lang = currentLang;
    const items = eventsData.map((ev) => {
        const name = (ev.title && (ev.title[lang] || ev.title.en || ev.title.ua)) || '';
        if (!name) return null;
        const item = {
            '@context': 'https://schema.org', '@type': 'Event', name,
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            url: `${siteUrl}/#event-${encodeURIComponent(ev.id)}`,
        };
        const start = toISO(ev.starts_at); if (start) item.startDate = start;
        if (ev.venue) item.location = { '@type': 'Place', name: ev.venue };
        if (ev.description) item.description = ev.description;
        if (ev.image_url) item.image = ev.image_url;
        return item;
    }).filter(Boolean);
    if (!items.length) return;
    const el = document.createElement('script');
    el.type = 'application/ld+json'; el.id = 'event-ld';
    el.textContent = JSON.stringify(items);
    document.head.appendChild(el);
}

function renderEvents() {
    injectEventLD();
    const container = document.getElementById('event-container');
    const t = translations[currentLang];
    const filtered = activeFilter === 'All'
        ? eventsData
        : eventsData.filter(e => (e.type || e.category) === activeFilter);

    if (filtered.length === 0) {
        container.innerHTML = `<div class="col-span-full glass border border-dashed border-slate-300 dark:border-slate-700 p-12 rounded-2xl text-center text-slate-500 font-bold transition-colors">${escHtml(t.events.empty)}</div>`;
        return;
    }

    container.innerHTML = filtered.map((ev) => {
        const title = (ev.title && (ev.title[currentLang] || ev.title.en)) || '';
        const type = categoryLabelFor(ev.type || ev.category);
        const price = ev.price || t.events.free;
        const soldOut = ev.seats_available !== null && ev.seats_available !== undefined && ev.seats_available <= 0;
        const imageHtml = ev.image_url ? `<img src="${escHtml(ev.image_url)}" alt="${escHtml(title)}" loading="lazy" class="w-full h-44 object-cover">` : '';
        const descHtml = ev.description ? `<p class="text-sm text-slate-600 dark:text-slate-400 mt-4 leading-relaxed line-clamp-2 transition-colors">${escHtml(ev.description)}</p>` : '';
        return `
        <div class="glass-card overflow-hidden group border-slate-200 dark:border-slate-800" data-event-id="${escHtml(String(ev.id ?? ''))}">
            ${imageHtml}
            <div class="p-6">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <div class="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-1">${escHtml(type)}</div>
                        <h3 class="text-xl font-bold text-primary dark:text-white group-hover:text-accent transition-colors cursor-pointer" data-open-details="${escHtml(String(ev.id ?? ''))}">${escHtml(title)}</h3>
                    </div>
                    ${ev.featured ? '<span class="text-[9px] font-black uppercase tracking-widest text-accent bg-accent/10 px-2 py-1 rounded-full">' + escHtml(t.events.featured) + '</span>' : ''}
                </div>
                <div class="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                    ${ev.starts_at ? `<div class="flex items-center gap-2"><i data-lucide="calendar" class="w-3.5 h-3.5 text-accent"></i><span>${escHtml(formatDate(ev.starts_at))}</span></div>` : ''}
                    ${ev.venue ? `<div class="flex items-center gap-2"><i data-lucide="map-pin" class="w-3.5 h-3.5 text-accent"></i><span>${escHtml(ev.venue)}</span></div>` : ''}
                    <div class="flex items-center gap-2"><i data-lucide="banknote" class="w-3.5 h-3.5 text-accent"></i><span class="font-bold text-primary dark:text-accent">${escHtml(price)}</span></div>
                </div>
                ${descHtml}
                <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
                    ${seatsBadge(ev, t)}
                    <button data-book="${escHtml(String(ev.id ?? ''))}" ${soldOut ? 'disabled' : ''} class="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 ${soldOut ? 'bg-slate-300 text-slate-500 dark:bg-slate-700 cursor-not-allowed' : 'bg-primary dark:bg-accent text-white dark:text-slate-900 hover:opacity-90'}">
                        ${escHtml(soldOut ? t.events.soldOut : t.events.book)}
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    container.querySelectorAll('[data-open-details]').forEach(el =>
        el.addEventListener('click', () => openEventDetails(el.dataset.openDetails)));
    container.querySelectorAll('[data-book]').forEach(btn =>
        btn.addEventListener('click', (e) => { e.stopPropagation(); if (!btn.disabled) openBookModal(btn.dataset.book); }));
    lucide.createIcons();
}

function openEventDetails(eventId) {
    const ev = eventsData.find(e => String(e.id) === String(eventId));
    if (!ev) return;
    const t = translations[currentLang];
    const el = document.getElementById('event-details-content');
    if (!el) return;
    const title = (ev.title && (ev.title[currentLang] || ev.title.en)) || '';
    const cat = categoryLabelFor(ev.type || ev.category);
    const price = ev.price || t.events.free;
    const soldOut = ev.seats_available !== null && ev.seats_available !== undefined && ev.seats_available <= 0;
    const imageHtml = ev.image_url ? `<img src="${escHtml(ev.image_url)}" alt="${escHtml(title)}" class="w-full h-56 object-cover">` : '';
    const descHtml = ev.description ? `<p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">${escHtml(ev.description)}</p>` : '';
    el.innerHTML = `
        ${imageHtml}
        <div class="p-8 sm:p-10">
            <div class="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-1">${escHtml(cat)}</div>
            <h2 class="text-2xl font-black text-primary dark:text-white mb-4 transition-colors">${escHtml(title)}</h2>
            <div class="space-y-2 mb-5 text-sm text-slate-600 dark:text-slate-300">
                ${ev.starts_at ? `<div class="flex items-center gap-2"><i data-lucide="calendar" class="w-4 h-4 text-accent"></i><span>${escHtml(formatDate(ev.starts_at))}</span></div>` : ''}
                ${ev.venue ? `<div class="flex items-center gap-2"><i data-lucide="map-pin" class="w-4 h-4 text-accent"></i><span>${escHtml(ev.venue)}</span></div>` : ''}
                <div class="flex items-center gap-2"><i data-lucide="banknote" class="w-4 h-4 text-accent"></i><span class="font-bold text-primary dark:text-accent">${escHtml(price)}</span></div>
                <div class="flex items-center gap-2">${seatsBadge(ev, t)}</div>
            </div>
            ${descHtml}
            <button id="details-book-btn" ${soldOut ? 'disabled' : ''} class="mt-8 w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg active:scale-95 ${soldOut ? 'bg-slate-300 text-slate-500 dark:bg-slate-700 cursor-not-allowed' : 'bg-primary dark:bg-accent text-white dark:text-slate-900 hover:opacity-90'}">
                ${escHtml(soldOut ? t.events.soldOut : t.events.book)}
            </button>
        </div>`;
    el.querySelector('#details-book-btn')?.addEventListener('click', () => {
        if (soldOut) return;
        closeAllModals();
        openBookModal(ev.id);
    });
    openModal(document.getElementById('event-details-modal'));
    lucide.createIcons();
}

// ── Reviews ─────────────────────────────────────────────────────────────────
function renderReviews() {
    const container = document.getElementById('reviews-container');
    const formContainer = document.getElementById('review-form-container');
    const t = translations[currentLang];

    if (comments.length === 0) {
        container.innerHTML = `<div class="glass border border-dashed border-slate-300 dark:border-slate-700 p-12 rounded-2xl text-center text-slate-500 font-bold">${escHtml(t.reviews.noReviews)}</div>`;
    } else {
        container.innerHTML = `<div class="columns-1 md:columns-2 gap-6 space-y-6">
            ${comments.map(review => `
                <div class="break-inside-avoid glass-card p-6 relative overflow-hidden group text-left border-slate-200 dark:border-slate-800 animate-fade-in-up">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">${(review.userName?.[0] || '?').toUpperCase()}</div>
                        <div>
                            <div class="font-bold text-primary dark:text-white text-sm transition-colors">${escHtml(review.userName)}</div>
                            <div class="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest transition-colors">${new Date(review.createdAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <p class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium transition-colors">"${escHtml(review.text)}"</p>
                </div>`).join('')}
        </div>`;
    }

    if (user) {
        formContainer.innerHTML = `
            <form id="review-form" class="space-y-4 text-left">
                <input type="text" disabled value="${escHtml(user.displayName || user.email)}" class="w-full glass border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 font-bold">
                <textarea required id="review-text" placeholder="${cookieConsent ? escHtml(t.reviews.textPlaceholder) : escHtml(t.cookies.required)}" rows="4" class="w-full glass border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all shadow-inner text-slate-900 dark:text-white font-medium ${!cookieConsent ? 'opacity-50 cursor-not-allowed' : ''}"></textarea>
                <button type="submit" id="btn-submit-review" class="w-full bg-primary dark:bg-accent text-white dark:text-slate-900 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 dark:hover:bg-accent-light disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                    <i data-lucide="send" class="w-3.5 h-3.5"></i> <span data-i18n="reviews.submit">${t.reviews.submit}</span>
                </button>
            </form>`;
        document.getElementById('review-form').addEventListener('submit', handleReviewSubmit);
    } else {
        formContainer.innerHTML = `
            <div class="text-center py-6">
                <p class="text-slate-500 dark:text-slate-400 text-sm mb-6 transition-colors">${escHtml(t.reviews.loginRequired)}</p>
                <button id="btn-review-login" class="bg-primary dark:bg-accent text-white dark:text-slate-900 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-accent-light transition-all shadow-lg active:scale-95">${escHtml(t.auth.login)}</button>
            </div>`;
        document.getElementById('btn-review-login')?.addEventListener('click', () => openModal(document.getElementById('auth-modal')));
    }
    lucide.createIcons();
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!cookieConsent) return;
    const textEl = document.getElementById('review-text');
    const text = textEl.value.trim();
    if (!text) return;
    const btn = document.getElementById('btn-submit-review');
    btn.disabled = true; btn.innerText = '...';
    try {
        const payload = { userName: user.displayName || user.email, text, createdAt: new Date().toISOString(), site: SITE_KEY };
        const headers = { 'Content-Type': 'application/json' };
        if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
        const response = await fetch(`${API_BASE_URL}/reviews`, { method: 'POST', headers, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API error ${response.status}`);
        textEl.value = '';
        await fetchReviews();
    } catch (err) {
        console.error('Review submit failed:', err);
        const t = translations[currentLang];
        const formEl = document.getElementById('review-form');
        const errMsg = document.createElement('p');
        errMsg.className = 'text-red-500 text-xs font-bold text-center mt-2';
        errMsg.textContent = t.reviews.error;
        formEl?.appendChild(errMsg);
        setTimeout(() => errMsg.remove(), 4000);
    } finally {
        btn.disabled = false;
        lucide.createIcons();
    }
}

// ── Venues & Legal info ───────────────────────────────────────────────────────
function renderVenues() {
    const list = document.getElementById('branch-list');
    const t = translations[currentLang];
    const venues = ["Main Hall", "Aula Maxima", "Sports Arena", "Faculty Theatre", "Library Atrium"];
    document.getElementById('branch-map-title').innerText = t.contact.branchMap;
    list.innerHTML = venues.map(v => `
        <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase transition-colors">
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-accent"></i> <span>${escHtml(v)}</span>
        </div>`).join('');
    lucide.createIcons();
}

function renderLegalInfo() {
    const container = document.getElementById('legal-info');
    const t = translations[currentLang];
    container.innerHTML = `
        <p class="font-bold text-slate-200 uppercase tracking-widest text-[10px] mb-2">${escHtml(t.legal.title)}</p>
        <p>${escHtml(t.legal.address)}</p>
        <p>${escHtml(t.legal.ico)} | ${escHtml(t.legal.dic)}</p>
        <p class="italic opacity-80">${escHtml(t.legal.reg)}</p>`;
}

// ── Stats animation ───────────────────────────────────────────────────────────
function initCounters() {
    const numbers = document.querySelectorAll('.animated-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateValue(entry.target, 0, parseInt(entry.target.getAttribute('data-value')), 2000);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    numbers.forEach(num => observer.observe(num));
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}

// ── Cookie consent ────────────────────────────────────────────────────────────
function initCookieConsent() {
    if (!cookieConsent) document.getElementById('cookie-consent').classList.remove('hidden');
    document.getElementById('btn-cookie-accept').addEventListener('click', () => {
        cookieConsent = true;
        localStorage.setItem('cookie-consent', 'true');
        document.getElementById('cookie-consent').classList.add('hidden');
        renderReviews();
    });
    document.getElementById('btn-cookie-decline').addEventListener('click', () => {
        document.getElementById('cookie-consent').classList.add('hidden');
    });
}

// Initial static content
renderVenues();
renderLegalInfo();
