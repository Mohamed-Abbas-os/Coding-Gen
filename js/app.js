import { ADSENSE, MONACO } from "./config.js";
import { EXAMPLES, TEMPLATE } from "./examples.js";
const $ = s => document.querySelector(s);
const LANGS = { javascript: { ext: "js", worker: "js/workers/js-worker.js" }, python: { ext: "py", worker: "js/workers/py-worker.js" } };
const store = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { setStatus("Storage unavailable", "err"); } }
};
let lang = store.get("cg:lang", "javascript"); if (!LANGS[lang]) lang = "javascript";
let ed, worker = null, job = null, clean = "";

// ---------- status / console ----------
function setStatus(t, cls = "") { const s = $("#status"); s.textContent = t; s.className = cls; }
function print(text, cls = "") {
  const out = $("#out"), near = out.scrollTop + out.clientHeight >= out.scrollHeight - 20;
  const sp = document.createElement("span"); sp.className = cls; sp.textContent = text + "\n"; out.appendChild(sp); // textContent: no HTML injection
  if (near) out.scrollTop = out.scrollHeight;
}

// ---------- editor (Monaco, with plain-textarea fallback) ----------
function loadMonaco() {
  return new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = MONACO + "/vs/loader.js";
    s.onerror = () => rej(new Error("Monaco download failed"));
    s.onload = () => {
      window.require.config({ paths: { vs: MONACO + "/vs" } });
      window.MonacoEnvironment = { getWorkerUrl: () => URL.createObjectURL(new Blob([`self.MonacoEnvironment={baseUrl:'${MONACO}/'};importScripts('${MONACO}/vs/base/worker/workerMain.js');`], { type: "text/javascript" })) };
      window.require(["vs/editor/editor.main"], () => res(window.monaco), rej);
    };
    document.head.appendChild(s);
  });
}
async function initEditor() {
  const host = $("#editor"), code = store.get("cg:code:" + lang, TEMPLATE[lang]);
  const theme = () => document.documentElement.dataset.theme === "light" ? "vs" : "vs-dark";
  try {
    const m = await loadMonaco();
    const e = m.editor.create(host, { value: code, language: lang, theme: theme(), automaticLayout: true, fontSize: +$("#fsize").value, wordWrap: "off", minimap: { enabled: false }, folding: true, matchBrackets: "always", tabSize: 4, scrollBeyondLastLine: false, fontFamily: "ui-monospace, Consolas, 'Courier New', monospace" });
    e.addCommand(m.KeyMod.CtrlCmd | m.KeyCode.Enter, run); // Cmd on macOS, Ctrl elsewhere
    ed = { get: () => e.getValue(), set: v => e.setValue(v), lang: l => m.editor.setModelLanguage(e.getModel(), l), font: n => e.updateOptions({ fontSize: n }), wrap: w => e.updateOptions({ wordWrap: w ? "on" : "off" }), theme: () => m.editor.setTheme(theme()), onChange: f => e.onDidChangeModelContent(f) };
  } catch (err) {
    print("Monaco could not load (" + err.message + "). Using a basic editor instead.", "s");
    const t = document.createElement("textarea"); t.value = code; t.spellcheck = false; t.setAttribute("aria-label", "Code editor"); host.appendChild(t);
    t.addEventListener("keydown", e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); run(); } });
    ed = { get: () => t.value, set: v => (t.value = v), lang() {}, font: n => (t.style.fontSize = n + "px"), wrap: w => (t.wrap = w ? "soft" : "off"), theme() {}, onChange: f => t.addEventListener("input", f) };
  }
  clean = ed.get(); let tm; ed.onChange(() => { clearTimeout(tm); tm = setTimeout(() => store.set("cg:code:" + lang, ed.get()), 400); });
  setStatus("Ready", "ok");
}
const dirty = () => ed.get() !== clean && ed.get() !== TEMPLATE[lang] && ed.get().trim() !== "";
const confirmReplace = () => !dirty() || confirm("Replace the current code? Unsaved changes will be lost.");
function setCode(v) { ed.set(v); clean = v; store.set("cg:code:" + lang, v); }

// ---------- execution ----------
function killWorker() { if (worker) { worker.terminate(); worker = null; } }
function finish(text, cls) { clearTimeout(job?.timer); job = null; $("#run").disabled = false; $("#stop").disabled = true; setStatus(text, cls); }
function run() {
  if (job || !ed) return;
  const code = ed.get(); if (!code.trim()) return setStatus("Nothing to run", "err");
  if (!worker || worker.lang !== lang) { killWorker(); worker = new Worker(LANGS[lang].worker); worker.lang = lang; }
  const w = worker, ms = +$("#timeout").value;
  job = { timer: setTimeout(() => { killWorker(); print(`[timed out after ${ms / 1000}s — execution stopped]`, "e"); finish("Timed out", "err"); }, ms) };
  $("#run").disabled = true; $("#stop").disabled = false; setStatus(lang === "python" && !w.warm ? "Loading Python…" : "Running…");
  w.onmessage = ({ data: d }) => {
    if (w !== worker) return;
    if (d.type === "out") print(d.text, d.stream === "err" ? "e" : "");
    else if (d.type === "status") setStatus(d.text);
    else if (d.type === "fatal") { print(d.text, "e"); killWorker(); finish("Runtime failed — press Run to retry", "err"); }
    else if (d.type === "done") { w.warm = true; finish(d.ok ? "Finished" : "Finished with errors", d.ok ? "ok" : "err"); }
  };
  w.onerror = e => { print("Worker error: " + e.message, "e"); killWorker(); finish("Error", "err"); };
  w.postMessage({ type: "run", code, input: $("#stdin").value });
}
function stop() { if (!job) return; killWorker(); print("[stopped by user]", "s"); finish("Stopped"); }

// ---------- projects ----------
const projs = () => { try { return JSON.parse(store.get("cg:projects", "{}")); } catch { return {}; } };
function refreshProjects() {
  const sel = $("#projects"); sel.length = 1;
  for (const n of Object.keys(projs())) sel.add(new Option(`${n} (${projs()[n].lang})`, n));
}
function download(name, text) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
function switchLang(l, keepCode) {
  if (job) stop(); lang = l; store.set("cg:lang", l); $("#lang").value = l; ed.lang(l);
  const ex = $("#examples"); ex.length = 1; for (const n of Object.keys(EXAMPLES[l])) ex.add(new Option(n, n));
  if (!keepCode) { const c = store.get("cg:code:" + l, TEMPLATE[l]); ed.set(c); clean = c; }
}

// ---------- ads (off unless real IDs configured) ----------
function initAds() {
  if (!/^ca-pub-\d+$/.test(ADSENSE.publisherId)) return;
  const s = document.createElement("script"); s.async = true; s.crossOrigin = "anonymous";
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADSENSE.publisherId; document.head.appendChild(s);
  document.querySelectorAll(".ad").forEach(el => { const slot = ADSENSE.slots[el.dataset.ad]; if (!slot) return;
    el.hidden = false; el.innerHTML = `<ins class="adsbygoogle" style="display:block" data-ad-client="${ADSENSE.publisherId}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
    (window.adsbygoogle = window.adsbygoogle || []).push({}); });
}

// ---------- wiring ----------
document.documentElement.dataset.theme = store.get("cg:theme", "dark");
$("#themeBtn").onclick = () => { const t = document.documentElement.dataset.theme === "dark" ? "light" : "dark"; document.documentElement.dataset.theme = t; store.set("cg:theme", t); ed?.theme(); };
$("#menuBtn").onclick = e => { const o = $("#nav").classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", o); };
$("#nav").onclick = () => $("#nav").classList.remove("open");
$("#run").onclick = run; $("#stop").onclick = stop; $("#clear").onclick = () => ($("#out").textContent = "");
$("#lang").onchange = e => { if (!confirmReplace()) return (e.target.value = lang); store.set("cg:code:" + lang, ed.get()); switchLang(e.target.value); };
$("#examples").onchange = e => { const n = e.target.value; if (n && confirmReplace()) setCode(EXAMPLES[lang][n]); e.target.value = ""; };
$("#reset").onclick = () => confirmReplace() && setCode(TEMPLATE[lang]);
$("#newp").onclick = () => confirmReplace() && setCode("");
$("#copy").onclick = async () => { try { await navigator.clipboard.writeText(ed.get()); setStatus("Copied", "ok"); } catch { setStatus("Copy blocked by browser", "err"); } };
$("#download").onclick = () => download("main." + LANGS[lang].ext, ed.get());
$("#import").onchange = async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  const ext = f.name.split(".").pop().toLowerCase(), l = Object.keys(LANGS).find(k => LANGS[k].ext === ext);
  if (f.size > 512 * 1024) return setStatus("File too large (max 512 KB)", "err");
  if (!l && ext !== "txt") return setStatus("Unsupported file type", "err");
  if (!confirmReplace()) return; const text = await f.text();
  if (l && l !== lang) switchLang(l, true); setCode(text);
};
$("#save").onclick = () => { const n = prompt("Project name:"); if (!n) return; const p = projs(); if (p[n] && !confirm("Overwrite existing project?")) return; p[n] = { lang, code: ed.get() }; store.set("cg:projects", JSON.stringify(p)); refreshProjects(); $("#projects").value = n; clean = ed.get(); setStatus("Saved locally", "ok"); };
$("#projects").onchange = e => { const p = projs()[e.target.value]; if (!p || !confirmReplace()) return; if (p.lang !== lang) switchLang(p.lang, true); setCode(p.code); };
$("#rename").onclick = () => { const o = $("#projects").value; if (!o) return; const n = prompt("New name:", o); if (!n || n === o) return; const p = projs(); p[n] = p[o]; delete p[o]; store.set("cg:projects", JSON.stringify(p)); refreshProjects(); $("#projects").value = n; };
$("#del").onclick = () => { const o = $("#projects").value; if (!o || !confirm(`Delete "${o}"?`)) return; const p = projs(); delete p[o]; store.set("cg:projects", JSON.stringify(p)); refreshProjects(); };
$("#fsize").oninput = e => ed?.font(+e.target.value || 14);
$("#wrap").onchange = e => ed?.wrap(e.target.checked);
$("#stdin").value = store.get("cg:stdin", ""); $("#stdin").oninput = e => store.set("cg:stdin", e.target.value);
window.addEventListener("beforeunload", e => { if (job) { e.preventDefault(); e.returnValue = ""; } });

$("#run").disabled = true; refreshProjects(); initAds();
initEditor().then(() => { switchLang(lang, true); $("#run").disabled = false; });
