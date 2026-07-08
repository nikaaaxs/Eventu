/* ═══════════════════════════════════════════════════════════════════════════
   EVENTU CRM — runtime frontend configuration (organizer admin panel)

   No build step → detect the environment at runtime:
     • localhost / 127.0.0.1  → local FastAPI on :8000 (development)
     • any other host         → PRODUCTION_API_URL below

   Must be https:// so the derived WebSocket URL becomes wss:// (secure).

   Loaded as a plain <script> BEFORE admin.js so window.APP_CONFIG exists first.
═══════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    const PRODUCTION_API_URL = 'https://socialist-willyt-7557-c129c458.koyeb.app';

    const host = window.location.hostname;
    const isLocal =
        host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '';

    const apiBase = isLocal ? 'http://localhost:8000' : PRODUCTION_API_URL;

    if (!isLocal && apiBase.includes('YOUR-BACKEND-DOMAIN')) {
        console.error(
            '[config] PRODUCTION_API_URL is not set — API/WS calls will fail. ' +
            'Edit Job_Program/config.js and set your backend URL.'
        );
    }

    // Portals an event can be published to (matches backend KNOWN_SITES).
    const EVENT_SITES = [
        { key: 'eventu', label: 'Eventu (main portal)' },
        { key: 'campus', label: 'Campus portal' },
    ];

    window.APP_CONFIG = Object.freeze({
        API_BASE_URL: apiBase,
        WS_URL: apiBase.replace(/^http/, 'ws') + '/ws/organizers',
        EVENT_SITES,
    });
})();
