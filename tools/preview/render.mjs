// usage: node render.mjs OUTDIR x y w h variant...   (variant = "de.wurst.graphite/Vanilla" or "original")
// Renders docs/preview with each theme in headless Chromium on CDP :9333; the site must be served on :8766
// with themes/ next to preview/ (see AGENTS.md "Preview & thumbnails").
import fs from "fs";
const [out, x, y, w, h, ...variants] = process.argv.slice(2);
const pages = await (await fetch("http://localhost:9333/json")).json();
const ws = new WebSocket(pages.find(p => p.type === "page").webSocketDebuggerUrl);
let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); pend[m.id]?.(m); };
const send = (method, params) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
const ev = async expr => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.result?.value;
await new Promise(r => ws.onopen = r);
await send("Emulation.setDeviceMetricsOverride", { width: 1896, height: 1016, deviceScaleFactor: 1, mobile: false });
fs.mkdirSync(out, { recursive: true });
for (const v of variants) {
  const page = v === "original" ? "original" : "themed";
  await send("Page.navigate", { url: `http://localhost:8766/preview/${page}.html?${Date.now()}` });
  await ev(`new Promise(r => { const t = () => document.readyState === "complete" ? r(1) : setTimeout(t, 50); t(); })`);
  if (v !== "original") await ev(`new Promise(r => { const l = document.getElementById("userStyle"); l.onload = l.onerror = r; l.href = "/themes/${v}.css"; })`);
  await ev(`document.fonts.ready.then(() => new Promise(r => { document.querySelectorAll("[data-demo-scroll]").forEach(e => e.scrollTop = +e.dataset.demoScroll); setTimeout(r, 400); }))`);
  const r = await send("Page.captureScreenshot", { format: "png", clip: { x: +x, y: +y, width: +w, height: +h, scale: 1 } });
  fs.writeFileSync(`${out}/${v.replace("/", "__")}.png`, Buffer.from(r.result.data, "base64"));
  console.log("rendered", v);
}
ws.close();
