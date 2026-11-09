// usage: node save.mjs <original|themed>  -> writes docs/preview/<name>.html + docs/preview/ts/*  (client on CDP :9222)
import fs from "fs"; import path from "path";
const name = process.argv[2];
const OUT = new URL("../../docs/preview", import.meta.url).pathname, SRC = "/opt/teamspeak/html/client_ui";
// real→fake name map, reused across captures; contains real names, so it is gitignored
const SEEDF = new URL("namemap.json", import.meta.url);
const pages = await (await fetch("http://localhost:9222/json")).json();
const ws = new WebSocket(pages.find(p => p.type === "page").webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
const res = await new Promise(r => { ws.onmessage = e => r(JSON.parse(e.data)); ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: "var DEMO_SEED = " + (fs.existsSync(SEEDF) ? fs.readFileSync(SEEDF, "utf8") : "[]") + ";\n" + fs.readFileSync(new URL("capture.js", import.meta.url), "utf8"), returnByValue: true } })); });
ws.close();
if (res.result.exceptionDetails) { console.error(JSON.stringify(res.result.exceptionDetails, null, 1)); process.exit(1); }
const { html, mainCss, map } = JSON.parse(res.result.result.value);
// ponytail: keep only the font families the captured view renders with; others are dead weight (~6 MB)
const KEEP = r => /font-family: "Noto Sans"/.test(r) && !/font-style/.test(r);
const css = mainCss.replace(/@font-face \{[^}]*\}/g, r => KEEP(r) ? r : "");
const used = new Set();
const fix = (s, pre) => s
  .replace(/tsui:\/\/default\/([^"')\s&]+)/g, (_, f) => (used.add(f.split(/[?#]/)[0]), pre + f))
  .replace(/url\((["']?)\/([^"')]+)\1\)/g, (_, q, f) => (used.add(f.split(/[?#]/)[0]), `url(${q}${pre}${f}${q})`));
fs.mkdirSync(path.join(OUT, "ts"), { recursive: true });
fs.writeFileSync(path.join(OUT, name + ".html"), fix(html, "ts/").replaceAll("DEMO_LOGO", "../icon.svg")
  .replace("</head>", '<style id="demo-fixes">/* the client shows the chat scrollbar via JS; a static snapshot needs it forced on */ .ts-chunk-scroll-track { opacity: 1 !important; }</style></head>')
  .replace("</body>", '<script>document.querySelectorAll("[data-demo-scroll]").forEach(e => e.scrollTop = +e.dataset.demoScroll)</script></body>'));
fs.writeFileSync(path.join(OUT, "ts/main.css"), fix(css, ""));
let missing = [];
for (const f of used) { const s = path.join(SRC, f); if (fs.existsSync(s)) { fs.mkdirSync(path.dirname(path.join(OUT, "ts", f)), { recursive: true }); fs.copyFileSync(s, path.join(OUT, "ts", f));
  // artifact hosting rejects SVGs with DTDs
  if (f.endsWith(".svg")) fs.writeFileSync(path.join(OUT, "ts", f), fs.readFileSync(s, "utf8").replace(/<!DOCTYPE[^\[>]*(\[[\s\S]*?\])?\s*>/, "")); } else missing.push(f); }
console.log("assets", used.size, "missing", missing);
fs.writeFileSync(SEEDF, JSON.stringify(map));
console.log(map.map(([a, b]) => a + " -> " + b).join("\n"));
