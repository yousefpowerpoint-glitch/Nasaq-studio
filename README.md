# Nasaq Studio — portfolio

Static site (HTML, CSS, JS). No build step, no server.

| File | What it is |
|---|---|
| `index.html` | Home: hero, selected work, services, process, contact |
| `project.html#<id>` | One project's page, built from `assets/projects.js` |
| `assets/projects.js` | **The project list.** Add a project by copying one block |
| `assets/style.css` | Colours, type and layout (tokens at the top) |
| `assets/main.js` | Motion: iris transition, text reveals, smooth scroll, hover effects |
| `assets/vendor/` | GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13 (kept locally, no CDN) |

## Live
https://nasaqstudio.online — Vercel deploys every push to `main`.

## Adding a project
Use the dashboard below, or by hand: put screenshots in `assets/work/<id>/`, then in `assets/projects.js`
copy a block, set a new `id`, and fill in the text, `cover`, `gallery` and `url`.

## Dashboard (/admin)

`nasaqstudio.online/admin` edits projects, brand identity boards and site settings, uploads images,
and publishes with one button. Each save is one commit on `main`, so Vercel redeploys the site (~1 min).

Setup, once, in Vercel → Project → Settings → Environment Variables (then Redeploy):

- `ADMIN_PASSWORD`: the dashboard password, 10+ characters.
- `GITHUB_TOKEN`: a fine-grained GitHub token for this repository only, with **Contents: Read and write**.

Code: `admin.html`, `assets/admin.js`, `assets/admin.css`, and the serverless API in `api/`.
Try it locally against the working copy: `node tools/admin-dev.js` → http://localhost:8790/admin.html (password `localpassword`).
