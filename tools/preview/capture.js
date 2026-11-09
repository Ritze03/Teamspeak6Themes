// Runs inside the TeamSpeak page via CDP. Returns {html, mainCss}.
// Clones the live DOM, redacts personal server data, strips scripts.
(() => {
  // --- fake data --------------------------------------------------------
  const FAKE_CHANNELS = ["Lounge", "Game Night", "Coffee Corner", "Late Shift", "Workshop", "Quiet Room",
    "Raid Prep", "Movie Club", "Study Hall", "Strategy Room", "Garage", "Rooftop", "Chill Zone",
    "Arcade", "Library", "Back Office", "Studio", "Campfire", "Observatory", "Greenhouse", "Basement",
    "Harbor", "Workbench", "Penthouse", "Jam Session", "Archive", "Map Room", "Dojo", "Kitchen"];
  const FAKE_SPACERS = ["═╣ COMMUNITY ╠═", "═╣ GAMING ╠═", "═╣ MUSIC ╠═", "═╣ AFK ╠═", "═╣ EVENTS ╠═", "═╣ MISC ╠═"];
  const FAKE_USERS = ["Nova", "Pixel", "Juniper", "Echo", "Mango", "Orbit", "Kestrel", "Biscuit", "Quill",
    "Sable", "Comet", "Fennel", "Ripley", "Tango", "Maple", "Zephyr", "Indigo", "Pepper"];
  const FAKE_BOTS = ["Radio Bot", "Lofi Radio", "Jukebox", "DJ Bot", "Synthwave FM", "Info Bot"];
  const SERVER = "Aurora Lounge";

  const map = new Map();
  const pools = { ch: [...FAKE_CHANNELS], sp: [...FAKE_SPACERS], us: [...FAKE_USERS], bot: [...FAKE_BOTS] };
  const take = (pool, i) => pools[pool].shift() || pool + i;
  const PREFIX = /^([\s╔╠╚╦╩═╣║┏┣┗[\]]*)/;
  let n = 0;
  // reuse names from an earlier capture so both snapshots match
  for (const [r, f] of (typeof DEMO_SEED !== "undefined" ? DEMO_SEED : [])) {
    map.set(r, f);
    for (const k in pools) pools[k] = pools[k].filter(x => !f.endsWith(x));
  }
  const fakeChannel = real => {
    const t = real.trim();
    if (map.has(t)) return map.get(t);
    let f;
    if (/^\[\s*LOBBY\s*\]$/i.test(t) || /^\[\*?c?spacer/i.test(t)) f = t;              // generic
    else if (/═╣|╠═/.test(t)) f = take("sp", n++);
    else f = (t.match(PREFIX)[1] || "") + take("ch", n++);
    map.set(t, f);
    return f;
  };
  const fakeUser = (real, bot) => {
    const t = real.trim();
    if (!map.has(t)) map.set(t, take(bot ? "bot" : "us", n++));
    return map.get(t);
  };

  // --- remember scroll positions on the live page ------------------------
  const scrolled = [...document.querySelectorAll("*")].filter(e => e.scrollTop > 0);
  scrolled.forEach(e => e.setAttribute("data-demo-scroll", e.scrollTop));
  const root = document.documentElement.cloneNode(true);
  scrolled.forEach(e => e.removeAttribute("data-demo-scroll"));
  const $$ = s => [...root.querySelectorAll(s)];

  // --- strip scripts / user theme / overlays -----------------------------
  $$("#userStyle").forEach(l => l.removeAttribute("href"));
  $$("script, #ts-app-loading-overlay, link[rel=preload], link[rel=modulepreload], noscript").forEach(e => e.remove());

  // --- collect names ------------------------------------------------------
  $$(".ts-server-tree-channel-info > span").forEach(s => s.textContent = fakeChannel(s.textContent));
  $$(".ts-server-tree-item-leaf.client, .ts-server-tree-item-leaf").forEach(row => {
    const name = row.querySelector(".ts-server-tree-item-text-wrapper .tsv-tree-preserve-spaces");
    if (!name) return;
    const isBot = !!row.querySelector(".ts-server-tree-item-groups");
    name.textContent = fakeUser(name.textContent, isBot);
  });
  $$(".ts-server-tree-item-groups .after").forEach(s => s.textContent = "Bot");
  $$(".ts-chat-message-sender-name").forEach(s => s.textContent = fakeUser(s.textContent, /bot|info/i.test(s.textContent)));
  // system events: <strong> are channel or user names
  $$(".ts-chat-message-system-body strong").forEach(s => {
    const t = s.textContent.trim();
    s.textContent = map.get(t) || (/^[╔╠╚[]/.test(t) ? fakeChannel(t) : fakeUser(t));
  });

  // --- chat: drop everything above the visible area, rewrite contents -----
  $$(".ts-chat-message-content").forEach((c, i) => {
    if (c.querySelector("h3")) {
      c.innerHTML = '<h3>🎮 Game Night</h3><p><strong>Patch notes:</strong> <a class="ts-parsed-link">Season 4 update</a></p>' +
        '<p>Server is back up, join via <code>play.example.com</code> tonight at 20:00.</p>';
    } else {
      c.innerHTML = "<p>" + ["anyone up for a round later?", "sure, give me 10 minutes", "the new theme looks great"][i % 3] + "</p>";
    }
  });
  $$(".ts-chat-message-any-file-message h5").forEach(h => h.textContent = "season4-patchnotes.html");
  $$(".ts-chat-message-attachment-ts3-server-info a, .ts-chat-message-attachment-link").forEach(a => a.textContent = "lounge");
  $$(".tsv-filename-truncate").forEach(s => s.textContent = "screenshot");
  $$(".tsv-filename-second").forEach(s => s.textContent = "-01.");

  // --- server name everywhere ---------------------------------------------
  const realServer = document.querySelector(".tsv-view-content .tsv-text-truncate")?.textContent.trim();
  if (realServer) map.set(realServer, SERVER);

  // --- generic text pass: any remaining exact or embedded match -----------
  const keys = [...map.keys()].filter(k => k.length > 2).sort((a, b) => b.length - a.length);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let t;
  while ((t = w.nextNode())) {
    if (t.parentElement?.tagName === "STYLE") continue;
    let s = t.textContent;
    for (const k of keys) if (s.includes(k)) s = s.split(k).join(map.get(k));
    t.textContent = s;
  }

  // --- images: private icons/banners/avatars -------------------------------
  let preset = 0;
  const PRESETS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
  const HUES = [265, 200, 150, 320, 30, 180, 0, 230];
  let hue = 0;
  const banner = () => {
    const h = HUES[hue++ % HUES.length];
    return "data:image/svg+xml," + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="40"><defs><linearGradient id="g"><stop offset="0" stop-color="hsl(${h},60%,35%)" stop-opacity="0"/><stop offset=".55" stop-color="hsl(${h},60%,38%)" stop-opacity=".8"/><stop offset="1" stop-color="hsl(${h + 40},70%,48%)"/></linearGradient></defs><rect width="400" height="40" fill="url(#g)"/></svg>`);
  };
  $$(".ts-server-tree-inactive-status__item").forEach(i => { if (i.innerHTML.includes("tsic://")) i.remove(); });
  $$(".tsv-view-background img").forEach(i => i.remove());
  const AV = ["#a78bfa", "#38bdf8", "#34d399", "#f472b6", "#fbbf24"];
  let av = 0;
  const avatar = () => "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${AV[av++ % AV.length]}"/><circle cx="20" cy="16" r="7" fill="#fff" fill-opacity=".85"/><path d="M6 40c2-9 8-13 14-13s12 4 14 13z" fill="#fff" fill-opacity=".85"/></svg>`);
  $$(".tsv-avatar.is-top img").forEach(i => i.setAttribute("src", avatar()));
  $$("img").forEach(img => {
    const src = img.getAttribute("src") || "";
    if (src.startsWith("tsui://default/") || src.startsWith("data:")) return;
    if (img.classList.contains("ts-server-tree-item-background-image__img")) { img.setAttribute("src", banner()); return; }
    if (src.startsWith("tsic://badges") || src.includes("flamingtext")) { img.remove(); return; }
    if (img.closest(".ts-chat-message, .ts-chat-room-event")) { img.remove(); return; }   // chat avatars / images
    if (img.closest(".ts-server-tree-item-leaf, .tsv-server-tree-icon")) {
      img.setAttribute("src", `tsui://default/images/icons/presets/${PRESETS[preset++ % PRESETS.length]}.png`);
      return;
    }
    img.setAttribute("src", "DEMO_LOGO");          // server logos -> project icon
  });
  // inline style urls pointing at private resources
  $$("[style*='url(']").forEach(e => {
    const st = e.getAttribute("style");
    if (/url\(["']?(https?|tsic):/.test(st)) e.setAttribute("style", st.replace(/url\(["']?(https?|tsic):[^)]*\)/g, "none"));
  });

  // --- attributes that may leak names / ids -------------------------------
  $$("*").forEach(e => {
    for (const a of [...e.attributes]) {
      if (a.name === "title" || a.name === "aria-label" || a.name === "alt" || a.name.startsWith("data-tooltip") ||
          (/[a-z0-9]+:\/\/|serverUID|=$/i.test(a.value) && a.name !== "style" && a.name !== "src" && e.tagName !== "LINK")) e.removeAttribute(a.name);
    }
  });
  // hidden poppers/tooltips may contain stale text
  $$(".v-popper__popper, .v-popper--theme-tooltip").forEach(e => e.remove());

  // --- styles: serialise CSSOM (CSS-in-JS rules are not in textContent) ----
  const sheets = [...document.styleSheets];
  const liveStyles = [...document.querySelectorAll("style")];
  $$("style").forEach((s, i) => {
    const sheet = liveStyles[i]?.sheet;
    if (sheet) s.textContent = [...sheet.cssRules].map(r => r.cssText).join("\n");
  });
  const main = sheets.find(s => s.href && s.href.includes("/main.css"));
  const mainCss = [...main.cssRules].map(r => r.cssText).join("\n");
  $$("link[rel=stylesheet]").forEach(l => { if (l.getAttribute("href")?.includes("main.css")) l.setAttribute("href", "ts/main.css"); else if (l.id !== "userStyle") l.remove(); });


  return JSON.stringify({ html: "<!DOCTYPE html>\n" + root.outerHTML, mainCss, map: [...map] });
})()
