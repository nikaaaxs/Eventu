# Eventu — Frontend (static site)

This branch contains **only the static frontend**, laid out at the repository root so it
can be served directly by **GitHub Pages**.

## Deploy to GitHub Pages
Repo → **Settings → Pages → Build and deployment → Deploy from a branch** →
branch **`frontend`**, folder **`/ (root)`**. The site goes live at
`https://<user>.github.io/<repo>/`.

No build step — plain HTML/CSS/JS. `.nojekyll` disables Jekyll processing.

## Point the site at the backend
The API runs separately (the **`backend`** branch, deployed to Koyeb). After the backend
is live, set its URL in both config files, commit and push this branch:

- `config.js` → `const PRODUCTION_API_URL = 'https://<your-app>.koyeb.app';`
- `Job_Program/config.js` → same value

Then add the Pages origin (`https://<user>.github.io`) to `ALLOWED_ORIGINS` on the backend.

## Pages
- `index.html` — student portal
- `Job_Program/admin.html` — organizer CRM
- `legal/`, `pages/` — legal documents and content pages (UA/EN)
