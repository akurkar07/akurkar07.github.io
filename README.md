# akurkar07.github.io

Static personal website for Alex Kurkar, hosted with GitHub Pages.

Live site: <https://akurkar07.github.io>

The site presents my Computer Science background, project timeline, hackathon work, and interests in compilers, interpreters, language design, mathematics, and low-level systems. It is intentionally lightweight: plain HTML, shared CSS, and a small JavaScript file for theme handling, canvas decoration, and interactive page behavior.

## Pages

- `index.html` is the homepage, with a personal introduction and chronological project/hackathon timeline.
- `about.html` gives a fuller background, current focus, and working style.
- `interpreter.html` is a live Pascal interpreter demo powered by lazily loaded Pyodide.
- `architecture.html` is an interactive architecture style sampler with image galleries, style-specific copy, and visual treatments for each architectural period.
- `Alex_Kurkar_CV.pdf` is linked from the site navigation as a downloadable CV.
- `samples/pascal/` contains the Pascal programs used by the live interpreter demo, including browser-input examples.

## Project Structure

```text
.
+-- index.html
+-- about.html
+-- interpreter.html
+-- architecture.html
+-- Alex_Kurkar_CV.pdf
+-- image.png
+-- samples/
    +-- pascal/
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
- `assets/js/interpreter-demo.js` lazy-loads Pyodide, loads sample Pascal files from `samples/pascal/`, and runs the interpreter demo in the browser.
- Architecture images are stored in `assets/img/architecture/` and referenced from the data objects in `assets/js/site.js`.

## Local Development

No build step is required. Open `index.html` directly in a browser, or serve the folder with any static file server.
