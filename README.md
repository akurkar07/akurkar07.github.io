# akurkar07.github.io

Static personal website for Alex Kurkar, hosted with GitHub Pages.

The site presents my Computer Science background, project timeline, hackathon work, and interests in compilers, interpreters, language design, mathematics, and low-level systems. It is intentionally lightweight: plain HTML, shared CSS, and a small JavaScript file for theme handling, canvas decoration, and interactive page behavior.

## Pages

- `index.html` is the homepage, with a personal introduction and chronological project/hackathon timeline.
- `about.html` gives a fuller background, current focus, and working style.
- `architecture.html` is an interactive architecture style sampler with image galleries, style-specific copy, and visual treatments for each architectural period.
- `Alex_Kurkar_CV.pdf` is linked from the site navigation as a downloadable CV.

## Project Structure

```text
.
+-- index.html
+-- about.html
+-- architecture.html
+-- Alex_Kurkar_CV.pdf
+-- image.png
+-- assets/
    +-- css/
    |   +-- site.css
    +-- js/
    |   +-- site.js
    +-- img/
        +-- architecture/
```

## Implementation Notes

- The site is static and can be served directly by GitHub Pages.
- `assets/css/site.css` contains the shared visual system, responsive layout rules, dark/light theme styling, timeline styling, and architecture-page treatments.
- `assets/js/site.js` handles theme persistence, canvas-generated decorative panels, the homepage title interaction, responsive hero sizing, and the architecture sampler.
- Architecture images are stored in `assets/img/architecture/` and referenced from the data objects in `assets/js/site.js`.

## Local Development

No build step is required. Open `index.html` directly in a browser, or serve the folder with any static file server.
