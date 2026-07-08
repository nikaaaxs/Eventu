/* ═══════════════════════════════════════════════════════════════════════════
   EVENTU CRM — organizer admin panel

   • Staff login (JWT) → real-time booking board over WebSocket (/ws/organizers)
   • Bookings Kanban: Reserved → Confirmed → Attended (+ cancel), atomic on the API
   • Events CRUD (with capacity/date/venue/price/tags + image upload)
   • Categories CRUD

   Talks to the FastAPI backend defined in config.js (window.APP_CONFIG).
═══════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const CFG = window.APP_CONFIG || {};
    const API = CFG.API_BASE_URL || 'http://localhost:8000';
    const WS_URL = CFG.WS_URL || API.replace(/^http/, 'ws') + '/ws/organizers';
    const SITES = CFG.EVENT_SITES || [{ key: 'eventu', label: 'Eventu' }, { key: 'campus', label: 'Campus' }];

    let token = localStorage.getItem('eventu_staff_token') || '';
    let username = localStorage.getItem('eventu_staff_name') || '';
    let role = localStorage.getItem('eventu_staff_role') || '';
    let ws = null;
    let wsReconnect = null;
    let bookings = [];
    let events = [];
    let categories = [];
    let staffList = [];

    const $ = (id) => document.getElementById(id);
    const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const icons = () => window.lucide && window.lucide.createIcons();

    // ── Toasts ────────────────────────────────────────────────────────────────
    function toast(msg, kind = 'info') {
        const c = $('toast-container');
        if (!c) return;
        const el = document.createElement('div');
        const color = kind === 'error' ? '#ef4444' : kind === 'success' ? '#22c55e' : '#e07fa2';
        el.style.cssText = `background:#0f172a;color:#fff;border-left:4px solid ${color};padding:12px 16px;margin-top:8px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.4);font-size:14px;max-width:320px;`;
        el.textContent = msg;
        c.appendChild(el);
        setTimeout(() => el.remove(), 3500);
    }

    // ── API helper ──────────────────────────────────────────────────────────────
    async function api(path, { method = 'GET', body = null, auth = true, raw = false } = {}) {
        const headers = {};
        if (!raw) headers['Content-Type'] = 'application/json';
        if (auth && token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API}${path}`, {
            method, headers, body: raw ? body : (body ? JSON.stringify(body) : null),
        });
        if (res.status === 401) { logout(); throw new Error('unauthorized'); }
        return res;
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    async function login() {
        const name = $('login-name').value.trim();
        const password = $('login-password').value;
        $('login-error').style.display = 'none';
        if (!name || !password) return;
        try {
            const res = await fetch(`${API}/auth/staff/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: name, password }),
            });
            if (!res.ok) { showLoginError(res.status === 401 ? 'Invalid credentials.' : `Error ${res.status}`); return; }
            const d = await res.json();
            token = d.access_token; username = d.username || name;
            role = d.role || '';
            localStorage.setItem('eventu_staff_token', token);
            localStorage.setItem('eventu_staff_name', username);
            localStorage.setItem('eventu_staff_role', role);
            enterDashboard();
        } catch {
            showLoginError('Server unavailable. Please try again.');
        }
    }

    function showLoginError(msg) {
        $('login-error-text').textContent = msg;
        $('login-error').style.display = 'block';
    }

    function logout() {
        token = ''; username = ''; role = '';
        localStorage.removeItem('eventu_staff_token');
        localStorage.removeItem('eventu_staff_name');
        localStorage.removeItem('eventu_staff_role');
        if (ws) { try { ws.close(); } catch {} ws = null; }
        $('dashboard').classList.add('hidden');
        $('login-overlay').style.display = 'flex';
    }

    // ── Dashboard bootstrap ──────────────────────────────────────────────────
    function enterDashboard() {
        $('login-overlay').style.display = 'none';
        $('dashboard').classList.remove('hidden');
        $('manager-display-name').textContent = username;
        $('manager-avatar').textContent = (username[0] || '?').toUpperCase();
        $('tab-btn-team').classList.toggle('hidden', !(role === 'super_admin' || role === 'admin'));
        connectWS();
        refreshAll();
        icons();
    }

    async function refreshAll() {
        await Promise.all([fetchCategories(), fetchEvents(), fetchBookings()]);
    }

    // ── WebSocket ───────────────────────────────────────────────────────────────
    function setConnection(on) {
        const badge = $('connection-badge');
        badge.classList.toggle('disconnected', !on);
        badge.classList.toggle('connected', on);
        $('connection-label').textContent = on ? 'Live' : 'Offline';
    }

    function connectWS() {
        if (ws) { try { ws.close(); } catch {} }
        try { ws = new WebSocket(WS_URL); } catch { setConnection(false); return; }
        ws.onopen = () => ws.send(JSON.stringify({ action: 'auth', token }));
        ws.onmessage = (e) => {
            let msg = {}; try { msg = JSON.parse(e.data); } catch { return; }
            if (msg.action === 'auth_ok') { setConnection(true); return; }
            if (msg.action === 'error') { toast(msg.message || 'WS error', 'error'); return; }
            // Any booking event → refresh the board (the API stays the source of truth).
            if ((msg.event && String(msg.event).startsWith('booking')) || msg.event === 'new_booking') {
                fetchBookings();
            }
        };
        ws.onclose = () => { setConnection(false); scheduleReconnect(); };
        ws.onerror = () => { setConnection(false); };
    }

    function scheduleReconnect() {
        if (wsReconnect) return;
        wsReconnect = setTimeout(() => { wsReconnect = null; if (token) connectWS(); }, 5000);
    }

    // ── Bookings board ───────────────────────────────────────────────────────
    async function fetchBookings() {
        try {
            const res = await api('/bookings?limit=500');
            if (!res.ok) throw new Error('http ' + res.status);
            bookings = await res.json();
            renderBookings();
        } catch (err) { if (String(err.message) !== 'unauthorized') console.warn('fetchBookings', err); }
    }

    function eventTitle(eventId) {
        const ev = events.find(e => String(e.id) === String(eventId));
        if (!ev) return eventId || '—';
        return (ev.title && (ev.title.en || ev.title.ua)) || eventId;
    }

    function bookingCard(b) {
        const actions = [];
        if (b.status === 'pending') {
            actions.push(`<button data-act="confirm" data-id="${b.id}" class="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase bg-green-500/90 text-white hover:bg-green-500">Confirm</button>`);
            actions.push(`<button data-act="cancel" data-id="${b.id}" class="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase bg-red-500/80 text-white hover:bg-red-500">Cancel</button>`);
        } else if (b.status === 'confirmed') {
            actions.push(`<button data-act="checkin" data-id="${b.id}" class="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase bg-purple-500/90 text-white hover:bg-purple-500">Check-in</button>`);
            actions.push(`<button data-act="cancel" data-id="${b.id}" class="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase bg-red-500/80 text-white hover:bg-red-500">Cancel</button>`);
        }
        return `
        <div class="rounded-xl border border-white/10 bg-white/5 p-4 mb-3">
            <div class="flex justify-between items-start gap-2">
                <div class="font-bold text-white text-sm">${esc(eventTitle(b.event_id))}</div>
                <span class="text-[10px] font-mono text-accent">${esc(b.ticket_code || '')}</span>
            </div>
            <div class="text-xs text-slate-300 mt-1">${esc(b.student_name)} · ×${esc(b.quantity)}</div>
            <div class="text-[11px] text-slate-400 mt-0.5">${esc(b.email || b.phone || '')}</div>
            ${b.comment ? `<div class="text-[11px] text-slate-400 mt-1 italic">"${esc(b.comment)}"</div>` : ''}
            ${actions.length ? `<div class="flex gap-2 mt-3">${actions.join('')}</div>` : ''}
        </div>`;
    }

    function renderBookings() {
        const cols = { pending: [], confirmed: [], checked_in: [] };
        bookings.forEach(b => { if (cols[b.status]) cols[b.status].push(b); });
        Object.keys(cols).forEach(status => {
            const el = $('col-' + status);
            if (el) el.innerHTML = cols[status].map(bookingCard).join('') || '<div class="text-xs text-slate-500 py-6 text-center">No bookings</div>';
            const cnt = $('count-' + status);
            if (cnt) cnt.textContent = cols[status].length;
        });
        $('total-count').textContent = bookings.length;
        document.querySelectorAll('.column-cards [data-act]').forEach(btn => {
            btn.addEventListener('click', () => bookingAction(btn.dataset.act, btn.dataset.id));
        });
        icons();
    }

    async function bookingAction(act, id) {
        try {
            const res = await api(`/bookings/${id}/${act}`, { method: 'POST' });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                toast(d.detail || `Could not ${act}`, 'error');
            } else {
                toast(`Booking ${act === 'checkin' ? 'checked in' : act + 'ed'}`, 'success');
            }
        } catch (err) { if (String(err.message) !== 'unauthorized') toast('Action failed', 'error'); }
        fetchBookings();
    }

    // ── Events ──────────────────────────────────────────────────────────────────
    async function fetchEvents() {
        try {
            const res = await fetch(`${API}/events`);
            events = res.ok ? await res.json() : [];
        } catch { events = []; }
        renderEvents();
    }

    function renderEvents() {
        const list = $('events-list');
        // Organizers see/manage only their own events; super_admins & admins see all.
        const canSeeAll = role === 'super_admin' || role === 'admin';
        const visible = canSeeAll ? events : events.filter(ev => ev.owner === username);
        $('events-total-count').textContent = visible.length;
        if (!visible.length) { list.innerHTML = '<div class="text-slate-500 text-sm py-8 text-center">No events yet.</div>'; return; }
        list.innerHTML = visible.map(ev => {
            const title = (ev.title && (ev.title.en || ev.title.ua)) || '';
            const seats = (ev.seats_available === null || ev.seats_available === undefined)
                ? 'unlimited' : `${ev.seats_available}/${ev.capacity} left`;
            return `
            <div class="rounded-xl border border-white/10 bg-white/5 p-4 mb-3 flex justify-between items-center gap-3">
                <div>
                    <div class="font-bold text-white">${esc(title)} <span class="text-[10px] text-accent uppercase ml-1">${esc(ev.type || '')}</span></div>
                    <div class="text-xs text-slate-400 mt-1">${esc(ev.venue || '—')} · ${esc(ev.starts_at || '—')} · ${esc(ev.price || 'Free')} · ${esc(seats)}${ev.owner ? ' · by ' + esc(ev.owner) : ''}</div>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button data-edit-event="${esc(ev.id)}" class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button data-del-event="${esc(ev.id)}" class="p-2 rounded-lg bg-red-500/70 hover:bg-red-500 text-white"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>`;
        }).join('');
        list.querySelectorAll('[data-edit-event]').forEach(b => b.addEventListener('click', () => openEventModal(b.dataset.editEvent)));
        list.querySelectorAll('[data-del-event]').forEach(b => b.addEventListener('click', () => deleteEvent(b.dataset.delEvent)));
        icons();
    }

    function populateEventForm() {
        $('event-type').innerHTML = categories.map(c => `<option value="${esc(c.id)}">${esc((c.label && (c.label.en || c.label.ua)) || c.id)}</option>`).join('');
        $('event-sites').innerHTML = SITES.map(s => `<label class="job-checkbox"><input type="checkbox" data-site="${esc(s.key)}"><span>${esc(s.label)}</span></label>`).join('');
    }

    function toLocalInput(iso) {
        const d = new Date(String(iso).replace(' ', 'T'));
        if (isNaN(d.getTime())) return '';
        const pad = n => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }

    function openEventModal(eventId) {
        populateEventForm();
        $('event-form-error').textContent = '';
        const ev = eventId ? events.find(e => String(e.id) === String(eventId)) : null;
        $('event-modal-title').textContent = ev ? 'Edit Event' : 'Add Event';
        $('event-id').value = ev ? ev.id : '';
        $('event-title-ua').value = ev ? (ev.title?.ua || '') : '';
        $('event-title-en').value = ev ? (ev.title?.en || '') : '';
        if (ev && ev.type) $('event-type').value = ev.type;
        $('event-venue').value = ev ? (ev.venue || '') : '';
        $('event-starts-at').value = ev && ev.starts_at ? toLocalInput(ev.starts_at) : '';
        $('event-price').value = ev ? (ev.price || '') : '';
        $('event-capacity').value = ev ? (ev.capacity || 0) : 0;
        $('event-tags').value = ev && Array.isArray(ev.tags) ? ev.tags.join(', ') : '';
        $('event-group').value = ev ? (ev.telegram_group_id || '') : '';
        $('event-description').value = ev ? (ev.description || '') : '';
        $('event-is-featured').checked = ev ? !!ev.featured : true;
        $('event-image').value = '';
        const evSites = (ev && ev.sites) || [];
        document.querySelectorAll('#event-sites [data-site]').forEach(cb => { cb.checked = evSites.includes(cb.dataset.site); });
        $('event-modal-overlay').classList.remove('hidden');
        icons();
    }

    function closeEventModal() { $('event-modal-overlay').classList.add('hidden'); }

    async function saveEvent(e) {
        e.preventDefault();
        const id = $('event-id').value;
        const sites = [...document.querySelectorAll('#event-sites [data-site]')].filter(cb => cb.checked).map(cb => cb.dataset.site);
        const startsRaw = $('event-starts-at').value;
        const payload = {
            title_ua: $('event-title-ua').value.trim(),
            title_en: $('event-title-en').value.trim(),
            type: $('event-type').value,
            venue: $('event-venue').value.trim() || null,
            starts_at: startsRaw ? new Date(startsRaw).toISOString() : null,
            price: $('event-price').value.trim() || null,
            capacity: Math.max(0, parseInt($('event-capacity').value || '0', 10)),
            tags: $('event-tags').value.split(',').map(t => t.trim()).filter(Boolean),
            description: $('event-description').value.trim() || null,
            is_featured: $('event-is-featured').checked,
            telegram_group_id: $('event-group').value.trim() || null,
            sites,
        };
        if (!payload.title_ua || !payload.title_en || !payload.type) {
            $('event-form-error').textContent = 'Titles and category are required.'; return;
        }
        try {
            const res = await api(id ? `/events/${id}` : '/events', { method: id ? 'PUT' : 'POST', body: payload });
            if (!res.ok) { const d = await res.json().catch(() => ({})); $('event-form-error').textContent = d.detail || `Error ${res.status}`; return; }
            const saved = await res.json();
            const eventId = id || saved.id;
            const file = $('event-image').files[0];
            if (file && eventId) await uploadEventImage(eventId, file);
            toast('Event saved', 'success');
            closeEventModal();
            fetchEvents();
        } catch (err) { if (String(err.message) !== 'unauthorized') $('event-form-error').textContent = 'Save failed.'; }
    }

    async function uploadEventImage(eventId, file) {
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await api(`/events/${eventId}/image`, { method: 'POST', body: fd, raw: true });
            if (!res.ok) toast('Image upload failed', 'error');
        } catch { toast('Image upload failed', 'error'); }
    }

    async function deleteEvent(id) {
        if (!confirm('Delete this event?')) return;
        try {
            const res = await api(`/events/${id}`, { method: 'DELETE' });
            if (!res.ok) { toast('Delete failed', 'error'); return; }
            toast('Event deleted', 'success');
            fetchEvents();
        } catch (err) { if (String(err.message) !== 'unauthorized') toast('Delete failed', 'error'); }
    }

    // ── Categories ────────────────────────────────────────────────────────────
    async function fetchCategories() {
        try {
            const res = await fetch(`${API}/categories`);
            categories = res.ok ? await res.json() : [];
        } catch { categories = []; }
        renderCategories();
    }

    function renderCategories() {
        const list = $('categories-list');
        $('categories-total-count').textContent = categories.length;
        if (!categories.length) { list.innerHTML = '<div class="text-slate-500 text-sm py-8 text-center">No categories.</div>'; return; }
        list.innerHTML = categories.map(c => {
            const label = c.label || {};
            return `
            <div class="rounded-xl border border-white/10 bg-white/5 p-4 mb-3 flex justify-between items-center gap-3">
                <div>
                    <div class="font-bold text-white">${esc(label.en || c.id)}</div>
                    <div class="text-xs text-slate-400 mt-1">${esc(label.ua || '')} · <span class="font-mono">${esc(c.id)}</span></div>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button data-edit-cat="${esc(c.id)}" class="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"><i data-lucide="pencil" class="w-4 h-4"></i></button>
                    <button data-del-cat="${esc(c.id)}" class="p-2 rounded-lg bg-red-500/70 hover:bg-red-500 text-white"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            </div>`;
        }).join('');
        list.querySelectorAll('[data-edit-cat]').forEach(b => b.addEventListener('click', () => openCategoryModal(b.dataset.editCat)));
        list.querySelectorAll('[data-del-cat]').forEach(b => b.addEventListener('click', () => deleteCategory(b.dataset.delCat)));
        icons();
    }

    function openCategoryModal(catId) {
        $('category-form-error').textContent = '';
        const c = catId ? categories.find(x => x.id === catId) : null;
        $('category-modal-title').textContent = c ? 'Edit Category' : 'Add Category';
        $('category-id').value = c ? c.id : '';
        $('category-label-ua').value = c ? (c.label?.ua || '') : '';
        $('category-label-en').value = c ? (c.label?.en || '') : '';
        $('category-modal-overlay').classList.remove('hidden');
        icons();
    }

    function closeCategoryModal() { $('category-modal-overlay').classList.add('hidden'); }

    async function saveCategory(e) {
        e.preventDefault();
        const id = $('category-id').value;
        const payload = {
            label_ua: $('category-label-ua').value.trim(),
            label_en: $('category-label-en').value.trim(),
        };
        if (!payload.label_ua || !payload.label_en) {
            $('category-form-error').textContent = 'Both labels are required.'; return;
        }
        try {
            const res = await api(id ? `/categories/${id}` : '/categories', { method: id ? 'PUT' : 'POST', body: payload });
            if (!res.ok) { const d = await res.json().catch(() => ({})); $('category-form-error').textContent = d.detail || `Error ${res.status}`; return; }
            toast('Category saved', 'success');
            closeCategoryModal();
            fetchCategories();
        } catch (err) { if (String(err.message) !== 'unauthorized') $('category-form-error').textContent = 'Save failed.'; }
    }

    async function deleteCategory(id) {
        if (!confirm('Delete this category?')) return;
        try {
            const res = await api(`/categories/${id}`, { method: 'DELETE' });
            if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.detail || 'Delete failed', 'error'); return; }
            toast('Category deleted', 'success');
            fetchCategories();
        } catch (err) { if (String(err.message) !== 'unauthorized') toast('Delete failed', 'error'); }
    }

    // ── Team (super_admin manages organizers) ───────────────────────────────────
    async function fetchStaff() {
        try {
            const res = await api('/staff');
            staffList = res.ok ? await res.json() : [];
        } catch { staffList = []; }
        renderStaff();
    }

    function renderStaff() {
        const list = $('staff-list');
        if (!list) return;
        $('staff-total-count').textContent = staffList.length;
        if (!staffList.length) { list.innerHTML = '<div class="text-slate-500 text-sm py-8 text-center">No staff.</div>'; return; }
        list.innerHTML = staffList.map(s => {
            // Admins may delete only organizers; nobody deletes themselves.
            const canDelete = s.username !== username && (role === 'super_admin' || s.role === 'organizer');
            const del = canDelete
                ? `<button data-del-staff="${esc(s.id)}" class="p-2 rounded-lg bg-red-500/70 hover:bg-red-500 text-white"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`
                : '';
            const badge = s.role === 'super_admin' ? 'Super-admin' : s.role === 'admin' ? 'Admin' : 'Organizer';
            const by = s.created_by ? ` · created by ${esc(s.created_by)}` : '';
            return `
            <div class="rounded-xl border border-white/10 bg-white/5 p-4 mb-3 flex justify-between items-center gap-3">
                <div>
                    <div class="font-bold text-white">${esc(s.username)} <span class="text-[10px] text-accent uppercase ml-1">${esc(badge)}</span></div>
                    <div class="text-xs text-slate-400 mt-1">${esc(s.full_name || '—')}${by}</div>
                </div>
                <div class="flex gap-2 shrink-0">${del}</div>
            </div>`;
        }).join('');
        list.querySelectorAll('[data-del-staff]').forEach(b => b.addEventListener('click', () => deleteStaff(b.dataset.delStaff)));
        icons();
    }

    function openStaffModal() {
        $('staff-form-error').textContent = '';
        $('staff-username').value = '';
        $('staff-password').value = '';
        $('staff-fullname').value = '';
        // super_admin can create admins or organizers; a regular admin — organizers only.
        $('staff-role').innerHTML = role === 'super_admin'
            ? '<option value="organizer">Organizer</option><option value="admin">Admin</option>'
            : '<option value="organizer">Organizer</option>';
        $('staff-role').value = 'organizer';
        $('staff-modal-overlay').classList.remove('hidden');
        icons();
    }
    function closeStaffModal() { $('staff-modal-overlay').classList.add('hidden'); }

    async function saveStaff(e) {
        e.preventDefault();
        const payload = {
            username: $('staff-username').value.trim(),
            password: $('staff-password').value,
            full_name: $('staff-fullname').value.trim() || null,
            role: $('staff-role').value,
        };
        if (!payload.username || (payload.password || '').length < 6) {
            $('staff-form-error').textContent = 'Username and a password (min 6 chars) are required.'; return;
        }
        try {
            const res = await api('/staff', { method: 'POST', body: payload });
            if (!res.ok) { const d = await res.json().catch(() => ({})); $('staff-form-error').textContent = d.detail || `Error ${res.status}`; return; }
            toast('Organizer created', 'success');
            closeStaffModal();
            fetchStaff();
        } catch (err) { if (String(err.message) !== 'unauthorized') $('staff-form-error').textContent = 'Save failed.'; }
    }

    async function deleteStaff(id) {
        if (!confirm('Delete this staff account?')) return;
        try {
            const res = await api(`/staff/${id}`, { method: 'DELETE' });
            if (!res.ok) { const d = await res.json().catch(() => ({})); toast(d.detail || 'Delete failed', 'error'); return; }
            toast('Staff deleted', 'success');
            fetchStaff();
        } catch (err) { if (String(err.message) !== 'unauthorized') toast('Delete failed', 'error'); }
    }

    // ── Check-in by ticket code (перевірка списків) ─────────────────────────────
    function showCheckinResult(msg, ok) {
        const el = $('checkin-result');
        if (!el) return;
        el.textContent = msg;
        el.style.color = ok ? '#22c55e' : '#ef4444';
    }

    async function checkinByCode() {
        const code = $('checkin-code').value.trim().toUpperCase();
        if (!code) { showCheckinResult('Enter a ticket code.', false); return; }
        showCheckinResult('Checking…', true);
        try {
            const res = await api('/bookings/checkin-by-code', { method: 'POST', body: { ticket_code: code } });
            const d = await res.json().catch(() => ({}));
            if (!res.ok) { showCheckinResult(d.detail || `Error ${res.status}`, false); return; }
            const who = d.student_name ? ` — ${d.student_name}` : '';
            showCheckinResult((d.message || '') + who, !!d.ok);
            if (d.ok) { $('checkin-code').value = ''; fetchBookings(); }
        } catch (err) { if (String(err.message) !== 'unauthorized') showCheckinResult('Check-in failed', false); }
    }

    // ── Tabs ──────────────────────────────────────────────────────────────────
    function initTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
                $('tab-' + tab).classList.remove('hidden');
                if (tab === 'team') fetchStaff();
            });
        });
    }

    // ── Clock ─────────────────────────────────────────────────────────────────
    function initClock() {
        const tick = () => { $('clock').textContent = new Date().toLocaleTimeString(); };
        tick(); setInterval(tick, 1000);
    }

    // ── Wire up ─────────────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        icons();
        initTabs();
        initClock();
        $('btn-login').addEventListener('click', login);
        $('login-password').addEventListener('keydown', (e) => { if (e.key === 'Enter') login(); });
        $('btn-logout').addEventListener('click', logout);
        $('btn-refresh').addEventListener('click', refreshAll);
        $('btn-add-event').addEventListener('click', () => openEventModal(null));
        $('btn-add-category').addEventListener('click', () => openCategoryModal(null));
        $('event-form').addEventListener('submit', saveEvent);
        $('event-cancel').addEventListener('click', closeEventModal);
        $('event-modal-close').addEventListener('click', closeEventModal);
        $('category-form').addEventListener('submit', saveCategory);
        $('category-cancel').addEventListener('click', closeCategoryModal);
        $('category-modal-close').addEventListener('click', closeCategoryModal);
        $('btn-add-staff').addEventListener('click', openStaffModal);
        $('staff-form').addEventListener('submit', saveStaff);
        $('staff-cancel').addEventListener('click', closeStaffModal);
        $('staff-modal-close').addEventListener('click', closeStaffModal);
        $('btn-checkin-code').addEventListener('click', checkinByCode);
        $('checkin-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkinByCode(); });

        if (token) enterDashboard();
        else $('login-overlay').style.display = 'flex';
    });
})();
