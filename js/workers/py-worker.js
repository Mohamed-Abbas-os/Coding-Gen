// Pyodide in a classic worker; runtime downloaded from jsDelivr (pinned) on first run, then browser-cached.
const VER = "0.26.4", BASE = `https://cdn.jsdelivr.net/pyodide/v${VER}/full/`;
let py = null, loading = null;
const msg = m => self.postMessage(m);
async function init() {
  msg({ type: "status", text: `Downloading Python runtime (Pyodide ${VER}, ~10 MB; cached afterwards)…` });
  importScripts(BASE + "pyodide.js");
  py = await loadPyodide({ indexURL: BASE });
}
self.onmessage = async ({ data }) => {
  if (data.type !== "run") return;
  try { await (loading || (loading = init().catch(e => { loading = null; throw e; }))); }
  catch (e) { msg({ type: "fatal", text: "Could not load the Python runtime (offline or CDN blocked?): " + (e.message || e) }); return; }
  const lines = data.input.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
  py.setStdin({ stdin: () => lines.length ? lines.shift() : undefined });
  py.setStdout({ batched: t => msg({ type: "out", stream: "out", text: t }) });
  py.setStderr({ batched: t => msg({ type: "out", stream: "err", text: t }) });
  msg({ type: "status", text: "Running…" });
  try { await py.runPythonAsync(data.code, { globals: py.toPy({ __name__: "__main__" }) }); msg({ type: "done", ok: true }); }
  catch (e) { msg({ type: "out", stream: "err", text: String(e.message || e) }); msg({ type: "done", ok: false }); }
};
