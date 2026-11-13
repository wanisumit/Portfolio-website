# Sumit Wani · Portfolio website

Motion designer portfolio, version 3 ("Viewfinder"). A static site: plain HTML, CSS and JavaScript, no build step.

- Dark only, on Neutral 950 (#0C0E0E), following the Sumit Wani brand guideline.
- Type: Sora 600 (display), DM Sans (body), DM Mono 500 (labels), self-hosted in `assets/fonts`.
- The hero logo is a live 3D model of the Sumit Wani mark (mint #27E68D over Deep Teal #0F4C5C), built with three.js (`vendor/`, MIT licence).
- The work section shows 8 demo projects. Contact details are placeholders.

## Run locally

Serve the folder with any static server, for example:

```
npx serve .
```

Opening `index.html` straight from disk will not load the 3D logo, because browsers block ES modules on `file://`.

## Files

- `index.html`, `style.css`, `main.js`: page, styles, scroll motion, warp section, dialogs.
- `mark3d.js`: the 3D logo.
- `assets/`: work stills, the hero film used as the reel, fonts, social image.
- `vendor/`: three.js r180 and RoomEnvironment.
