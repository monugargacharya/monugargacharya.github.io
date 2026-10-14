# Manvendra Sharma — Portfolio

A hand-built static portfolio: plain HTML, CSS and vanilla JavaScript. There's no framework and no build step.

```
index.html              page content (all sections + case-study dialogs)
assets/css/style.css    design tokens, layout, components, light/dark themes
assets/js/main.js       theme toggle, nav, scroll reveal, counters, dialogs
assets/img/profile.jpg  your headshot (4:5 portrait works best)
assets/resume/*.pdf     downloadable résumés (India + International, 2- and 3-page)
favicon.svg             "MS" monogram
.nojekyll               tells GitHub Pages to serve files as-is
```

## Preview locally

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy to GitHub Pages

This repository (`monugargacharya/portfolio`) deploys from the `release/prod` branch.

1. Push changes to `release/prod`.
2. In the repository, go to **Settings → Pages**. Set **Source** to "Deploy from a branch", choose branch `release/prod` and folder `/ (root)`, then **Save**.
3. The site goes live at `https://monugargacharya.github.io/portfolio/` in about a minute. For a custom domain, add it under **Settings → Pages → Custom domain**.

## Updating content

- **Text, projects, numbers:** edit `index.html`. Each project has a card in the `#work` section and a matching `<dialog>` case study at the bottom of the file.
- **Résumés:** replace the PDFs in `assets/resume/` and keep the same file names.
- **Photo:** replace `assets/img/profile.jpg`. If the file is missing, the site shows the "MS" monogram instead.
