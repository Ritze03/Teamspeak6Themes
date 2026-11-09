// usage: node cdp.mjs '<js expression>'   or   node cdp.mjs --shot out.png
const pages = await (await fetch(`http://localhost:${process.env.PORT || 9222}/json`)).json();
const ws = new WebSocket(pages.find(p => p.type === "page").webSocketDebuggerUrl);
let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (pend[m.id]) pend[m.id](m); };
const send = (method, params) => new Promise(r => { pend[++id] = r; ws.send(JSON.stringify({ id, method, params })); });
await new Promise(r => ws.onopen = r);
const a = process.argv[2];
if (a === "--shot") {
  const r = await send("Page.captureScreenshot", { format: "png" });
  (await import("fs")).writeFileSync(process.argv[3], Buffer.from(r.result.data, "base64"));
} else {
  const r = await send("Runtime.evaluate", { expression: a, awaitPromise: true, returnByValue: true });
  const v = r.result?.result?.value ?? r.result;
  console.log(typeof v === "string" ? v : JSON.stringify(v, null, 1));
}
ws.close();
