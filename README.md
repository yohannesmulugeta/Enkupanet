# Enkupanet website

A bilingual, static website for Enkupanet Agro Trading One Member PLC, based on the supplied 2026 company profile. The public preview is at [GitHub Pages](https://yohannesmulugeta.github.io/Enkupanet/).

## Preview and publish

Run the static generator, then serve its output:

```powershell
node scripts/build-site.mjs
python -m http.server 4173 --bind 127.0.0.1 --directory _site
```

Open `http://127.0.0.1:4173/`. GitHub Actions runs the same generator on pushes to `main` and deploys `_site` to GitHub Pages. Node.js is needed only to generate the pages; the published site uses plain HTML, CSS and JavaScript without a CMS, backend, form or runtime package dependency.

## Structure and content

- `index.html`, `styles.css`, `premium.css`, and `app.js` form the homepage and its interactive catalog, origin view and sourcing journey.
- `site-data.js` holds the nine product records, bilingual copy and inquiry email text shared by the browser and generator. Change product facts there, then rebuild.
- `scripts/build-site.mjs` generates English and Chinese homepages plus 18 product pages. The generated `_site` folder is ignored by Git.
- `product.css` styles the product pages and comparison tables. Comparisons show only specifications present in the company profile; absent values are labeled as such.
- `assets/` contains the brand mark, product photographs and an illustrative Ethiopia outline. `sitemap.xml` and `robots.txt` support discovery.

Each product has a direct English URL such as `/products/humera/` and a Chinese URL such as `/zh/products/humera/`. Homepage cards open a quick view when JavaScript is available; their links lead to the full pages for direct visits, modified clicks and visitors without JavaScript. Older `?product=` and `?lang=zh` URLs redirect in the browser to the static pages.

## Source notes

Product copy and numeric specifications were adapted from `Enkupanet_Premium_Bilingual_Profile_2026.pdf`. The owner should reconfirm specifications, availability, terms and contact details for current trading. Red kidney, green mung, white pea and speckled kidney bean images were generated for this website; other product photography comes from the supplied profile. The story photograph is a modified version of [Lemazelalem3's Ethiopian farmland photograph](https://commons.wikimedia.org/wiki/File:Beautiful_green_farm_land_in_Eastern_Ethiopia.jpg), licensed [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Credits are disclosed in the footer. The brand icon was extracted from the profile cover.

The Ethiopia outline in `assets/ethiopia-outline.svg` is simplified from [Natural Earth 1:110m Admin 0 countries](https://www.naturalearthdata.com/about/terms-of-use/) (public domain). Origin markers give approximate regional orientation and do not identify farms or current lots.
