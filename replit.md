# Project X — 3D Portfolio Studio

## Overview
A high-end, interactive 3D portfolio/studio website built with Vite, Three.js, and GSAP. Features a dark minimalist aesthetic with real-time 3D graphics and scroll-triggered animations.

## Tech Stack
- **Build System:** Vite (v8+)
- **Package Manager:** npm
- **Languages:** JavaScript (ESM), HTML5, CSS3
- **Key Libraries:**
  - Three.js — 3D scenes and WebGL rendering
  - GSAP + ScrollTrigger — animations and scroll effects
  - @emailjs/browser — contact form email delivery (client-side, no backend)

## Project Structure
```
index.html          # Site entry point
style.css           # All styling and CSS variables
src/
  main.js           # Central logic: UI, audio, cursor, 3D init
  scenes/
    BackgroundScene.js  # Interactive starfield background
    WorkScene.js        # 3D geometries for work/service cards
public/
  sounds/           # ambient-loop.mp3, hover.mp3
  *.jpg             # Team member avatars
  favicon.png
vite.config.js      # Vite config: host 0.0.0.0, port 5000, allowedHosts: true
```

## Running the App
- **Dev:** `npm run dev` (starts on port 5000)
- **Build:** `npm run build` (outputs to `dist/`)

## Deployment
Configured as a **static** site deployment:
- Build command: `npm run build`
- Public directory: `dist`

## Notes
- No backend — fully client-side application
- Contact form uses EmailJS (requires EmailJS account/keys configured in source)
- WebGL is required for 3D features; falls back gracefully in environments without GPU
