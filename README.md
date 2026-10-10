# Coding Gen — free in-browser code runner (static site)

**Implemented:** JavaScript (Web Worker) and Python (Pyodide 0.26.4 in a Web Worker), Monaco 0.52.2 editor (plain-textarea fallback), stdin panel, stop/timeout, examples, local projects, import/export, dark/light theme, responsive layout, AdSense switch (off by default).
**Not implemented:** C, C++, Java. Shown as disabled options. They need large browser toolchains (a WASM Clang or a JVM-in-browser) that were not integrated or verified; faking them would be dishonest.

## Deploy to GitHub Pages
1. Push this folder's contents to a repo. 2. Settings → Pages → Deploy from branch → `main` / root. 3. Open `https://<user>.github.io/<repo>/`.
All paths are relative, so project-URL hosting works; there is no server routing.

## Run locally
`python3 -m http.server 8000` in this folder, open http://localhost:8000 (ES modules and workers need http, not file://).

## How it works / limits
- Runtimes load from jsDelivr (pinned versions) on demand. Pyodide (~10 MB) downloads on the first Python run and is then browser-cached. Needs internet at least once; offline first-run shows an error with retry (press Run again).
- Stop and timeout **terminate the worker**; Python must reload its runtime afterwards (from cache).
- Python `input()` reads lines from the Input panel; JS uses `readLine()` (returns `null` at end). Python packages: only those Pyodide supports.
- Isolation = Web Worker (no DOM/main-page access). It is **not** a perfect sandbox: user code can still make network requests and consume CPU/memory. No quotas are imposed by the site; limits come from your device.
- Storage: localStorage only; not synced, can be cleared by the browser.

## AdSense
Edit `js/config.js` with your real publisher ID and slot IDs after approval. Empty = no Google script loaded. Fill in the Contact section of `index.html` and review the Privacy text first. No approval or revenue is guaranteed.

## Optional CSP
If you add a CSP meta tag, allow `script-src 'self' https://cdn.jsdelivr.net 'unsafe-eval' 'wasm-unsafe-eval' blob:`, `worker-src 'self' blob:`, `connect-src 'self' https://cdn.jsdelivr.net`, `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`, `font-src https://cdn.jsdelivr.net data:`. Untested; remove it first if anything breaks.

## Manual test checklist (run these after deploying)
JS: `console.log("Hello, Coding Gen!")`; syntax error; `while(true){}` (should time out); Stop. Python: hello; `name = input(); print("Hello", name)` with input `Ada`; `1/0`. Also: theme toggle, save/reload project, refresh page (code restored), import/download, widths 320–1440, DevTools Network shows no requests carrying your code.

## Roadmap
C/C++: evaluate a self-hosted WASM Clang/WASI toolchain (large assets; Pages file-size limits apply). Java: evaluate CheerpJ (license terms apply) or TeaVM-based approaches.
