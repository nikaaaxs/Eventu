/* ═══════════════════════════════════════════════════════════════════════════
   EVENTU — runtime frontend configuration (public portal)

   This static site has no build step, so the backend URL can't be injected at
   build time. Instead we detect the environment at runtime:
     • localhost / 127.0.0.1  → local FastAPI on :8000 (development)
     • any other host         → PRODUCTION_API_URL below

   Loaded as a plain <script> BEFORE script.js so window.APP_CONFIG exists first.
═══════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';

    // Production backend origin (no trailing slash).
    const PRODUCTION_API_URL = 'https://socialist-willyt-7557-c129c458.koyeb.app';

    // Google OAuth 2.0 Web Client ID (student sign-in). The site origin must be in
    // the OAuth client's "Authorized JavaScript origins" in Google Cloud Console.
    const GOOGLE_CLIENT_ID = '507589454513-40mlla3mv87doauuqehto4p2r66f30pj.apps.googleusercontent.com';

    const host = window.location.hostname;
    const isLocal =
        host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '';

    const apiBase = isLocal ? 'http://localhost:8000' : PRODUCTION_API_URL;

    if (!isLocal && apiBase.includes('YOUR-BACKEND-DOMAIN')) {
        console.error(
            '[config] PRODUCTION_API_URL is not set — API calls will fail. ' +
            'Edit config.js and set your backend URL.'
        );
    }

    // Identifies which portal this is. The backend filters /events?site=<key>
    // so this site shows only events the admin assigned to it (plus "everywhere"
    // events). Must match a key in the backend KNOWN_SITES + the admin panel EVENT_SITES.
    const SITE_KEY = 'eventu';

    // Public identity — used for Organization/WebSite structured data.
    const BRAND = 'Eventu';
    const SITE_URL = 'https://nikaaaxs.github.io/Eventu/';
    const LOGO_URL = '';

    // AI assistant widget. Flip to true ONLY after an AI provider key is set on the
    // backend — otherwise the chat button would appear but not work.
    const AI_ENABLED = true;

    window.APP_CONFIG = Object.freeze({
        API_BASE_URL: apiBase,
        WS_URL: apiBase.replace(/^http/, 'ws') + '/ws/organizers',
        GOOGLE_CLIENT_ID,
        SITE_KEY,
        BRAND,
        SITE_URL,
        LOGO_URL,
        AI_ENABLED,
    });
})();
