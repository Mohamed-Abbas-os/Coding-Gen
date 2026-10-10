// Untrusted JS runs inside a Web Worker (no DOM). Infinite loops are stopped by the main thread terminating this worker.
const fmt = a => { if (typeof a === "string") return a; try { return typeof a === "object" && a !== null ? JSON.stringify(a) : String(a); } catch { return String(a); } };
const AsyncFn = Object.getPrototypeOf(async function () {}).constructor;
self.onmessage = async ({ data }) => {
  if (data.type !== "run") return;
  const lines = data.input.split("\n"); if (lines[lines.length - 1] === "") lines.pop();
  const post = (stream, text) => self.postMessage({ type: "out", stream, text });
  const j = a => a.map(fmt).join(" ");
  const con = { log: (...a) => post("out", j(a)), info: (...a) => post("out", j(a)), warn: (...a) => post("err", "warn: " + j(a)), error: (...a) => post("err", j(a)) };
  const readLine = () => lines.length ? lines.shift() : null;
  try { await new AsyncFn("console", "readLine", data.code)(con, readLine); self.postMessage({ type: "done", ok: true }); }
  catch (e) { post("err", (e && e.stack) || String(e)); self.postMessage({ type: "done", ok: false }); }
};
