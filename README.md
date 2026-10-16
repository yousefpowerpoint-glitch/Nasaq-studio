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
https://nasaq-studio-psi.vercel.app — Vercel deploys every push to `main`.

## Adding a project
1. Put screenshots in `assets/work/`.
2. In `assets/projects.js`, copy a block, set a new `id`, fill in the text, `cover`, `gallery` and `url`.
