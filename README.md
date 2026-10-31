# Enkupanet — Corporate Website (Static Prototype)

A premium, responsive English / Simplified Chinese website for **Enkupanet Agro Trading One Member PLC**, based on its 2026 company profile.

## How to preview

1. **Quickest:** open `index.html` in Chrome, Edge, Firefox, or Safari.
2. **Local server (optional):** in this folder run `python -m http.server 4173` and open http://localhost:4173 .

There is no build process, package manager, CMS, backend, form, hosting integration, or external dependency.

## Files

- `index.html` — semantic page sections and product detail dialog
- `styles.css` — brand styling, layouts, animations, mobile breakpoints
- `app.js` — language switcher, catalog filtering, product details
- `assets/` — brand mark and optimized product images extracted from the supplied profile

## Website features

- English / Simplified Chinese switcher (language selectable using `?lang=zh`)
- Four commodity categories
- Nine products / product groups with details from the profile
- Mobile navigation and responsive layouts
- Company introduction, coffee origins, six-stage quality approach
- Simple published company email and telephone in footer; no contact form

## Source accuracy

Copy and numeric specifications were adapted from the user-supplied `Enkupanet_Premium_Bilingual_Profile_2026.pdf`. Confirm specifications and official contact details before publication. Red kidney, green mung, and speckled kidney bean images were generated for this website and optimized as separate card and detail WebP assets. The remaining illustrative photography originates in the supplied profile. Photo credits are disclosed in the footer (original profile page 20). The brand icon is a web-optimized extraction from the profile cover.

## GitHub repository and preview publishing

- Repository: https://github.com/yohannesmulugeta/Enkupanet
- All source files live in the `main` branch.
- To activate the GitHub Pages preview, open **Settings → Pages → Build and deployment** and select **GitHub Actions** as the source.
- Next, open **Actions → Deploy Enkupanet Website → Run workflow** (or re-run the previously failed workflow).
- Once deployment succeeds, the preview will be available at `https://yohannesmulugeta.github.io/Enkupanet/`.

This is a static prototype/preview. Use hosting suitable for a commercial business before treating it as a production company website.
