# Agent / developer notes

Technical documentation for working on these themes. Users: see README.md.

## Repo layout

- `de.wurst.graphite/` — Graphite extension (compact dark-gray family)
- `de.wurst.aurora/` — Aurora extension (glassmorphism family)
- Folder names equal the extension identifiers so they can be copied
  verbatim into the client's `extensions` directory.
- Local-only, gitignored: `Compact.css` (the original hand-made theme this
  project replaced) and `TeamspeakOriginal/` (a dump of the client's
  `main.html` / `main.css` / `main.js`, the reference for every selector and
  variable mentioned below).

## Architecture

Both extensions are variable-driven with a shared base per extension:

- Graphite: `GraphiteBase.css` (gray `--gc-*` palette + all overrides)
  ← imported by every sub-theme (`Vanilla.css`, `Monochrome.css`,
  `Amoled.css`) ← `NoScroll<X>.css` wrappers add `NoScroll.css`.
  The gray accents live in the module `MonochromeAccents.css` (no base
  import), shared by `Monochrome.css` (base + accents) and
  `AmoledMonochrome.css` (`Amoled.css` + accents). Never `@import` the base
  twice in one chain: the second copy re-applies after the variant and
  undoes its overrides.
- Aurora: `FableCore.css` (maps every themable client variable onto a
  generic `--fb-*` palette contract, incl. voice-indicator ring AND fill)
  ← `AuroraBase.css` (glass surfaces, ambient orb backdrop, sizing; variant
  knobs `--au-accent/-strong`, `--au-link`, `--au-self-bg`, `--au-orb-1..4`,
  `--au-canvas`, `--au-glass-strong`) ← color variants ← NoScroll wrappers.
- Color variants must re-tint ALL surfaces (canvas, glass rgba set, text,
  menu/modal glass), not only accents/orbs.
- **Cache-buster convention**: every `@import` carries `?v=N`
  (`FableCore.css?v=N` ← `AuroraBase.css?v=N` ← `<Variant>.css?v=N`, same
  for `GraphiteBase.css?v=N`). Bump `N` in all importers whenever the
  imported file changes — the client caches import URLs per session.

## Client quirks (hard-won)

- The client injects its default `:root` variables AFTER the user
  stylesheet → every variable override needs `!important`.
- The default palette lives in `main.html`'s `<head>`, not `main.css`.
  Some values are re-declared per element (e.g. chat link color on
  `.ts-chat-room-event-detailed`) and must be overridden at that scope.
- `package.json` requires `image`, `repository`, and per-theme `image`
  fields, or the native scanner silently ignores the whole extension.
  The image FILES must exist too: one missing PNG drops the extension.
- **Theme names max 30 characters** (30 itself is fine) — one longer
  name invalidates the entire extension. Naming scheme: just the color
  (`Blue`, `Amoled Monochrome`), NoScroll variants as `<Color> - NoScroll`;
  the extension card already says Graphite/Aurora.
- **Adding or renaming themes can change the user's selection.** Seen
  both: after a rename + restart User Theme came back off, and after adding
  or renaming variants the active theme jumped to a neighboring one (cards
  are sorted alphabetically). Mechanism not confirmed. Keep the `themes`
  array order stable, append new variants at the end, and expect users to
  reselect after a rename.
- The client refuses **symlinked** extension folders — copy real files.
- Tree row-height/spacing changes need a full client **restart**; the
  virtual list measures row heights at mount. Everything else hot-reloads.
- Tree rows grow on hover/click by design: stock shrinks all four pill
  insets by 3px (animated) for `:hover` / `.tsv-active` (= the channel whose
  view is open) / `.tsv-selected`, and slides the banner image 3px. Both
  bases pin insets + `margin-left` with `!important` so states only toggle
  the outline.
- Channel names may contain literal newlines/padding spaces rendered with
  `white-space: pre` — compact rows must collapse them to `nowrap`.
- Tree icon/avatar size derives from `--tsv-icon-size`; both bases scope it
  on `.ts-server-tree-wrapper` / `.ts-server-tree-scroller`.
- Chat attachment boxes size via `--ts-attachment-height` +
  `.ts-chat-message-attachment-inner { max-width }`. Don't fight the system
  with `width/height: auto` — it crops.

## Current sizing (user-approved)

28px tree rows, 22px tree icons, 1px pill insets → 26px pill, 2px gap
between adjacent channel pills, 13px tree font, 20px spacers.

## Dev loop

1. Launch: `teamspeak --remote-debugging-port=9222 '--remote-allow-origins=*'`
2. Edit CSS in this repo, `cp` to
   `~/.config/TeamSpeak/Default/extensions/<identifier>/`.
3. Hot reload via CDP (`http://localhost:9222/json` → page websocket):
   `document.getElementById("userStyle").href = "tsui://extension/<id>/<file>.css?v=" + Date.now()`
4. Screenshot via CDP `Page.captureScreenshot`; query
   `tsclient_internal.getInstalledThemes(cb)` in the page to check extension
   registration (re-scans on every call).

## Preview & thumbnails (`docs/preview`, `tools/preview`)

The website's live preview is a frozen, redacted copy of the real client DOM.
The per-theme PNGs and both `Thumbnail.png` covers are rendered from it.

- **Capture** (`tools/preview/save.mjs` + `capture.js`): restart the client
  (rows are measured at mount), open a channel chat, then
  `node tools/preview/save.mjs themed` with one of our themes active, and
  `node tools/preview/save.mjs original` after a restart with User Theme
  off. Both snapshots share one real→fake name map
  (`tools/preview/namemap.json`, gitignored because it holds real names).
  `capture.js` swaps names, chat, icons, banners and avatars, and strips
  URLs, titles and the server UID. Afterwards grep `docs/preview` for real
  server, channel and user names before committing.
- `themed.html` keeps an empty `<link id="userStyle">` at the client's
  position; the site swaps in theme CSS (jsDelivr on github.io, `themes/`
  elsewhere). `#demo-fixes` forces the chat scrollbar visible, which the
  client normally does via JS.
- **Render**: serve a dir with `index.html`, `preview/` and
  `themes/de.wurst.*` (symlinks to the repo) on :8766, start
  `chromium --headless=new --remote-debugging-port=9333`, then
  `node tools/preview/render.mjs OUT 66 656 360 360 de.wurst.graphite/Vanilla ...`
  (the crop is the bottom of the tree including Create Channel). Covers =
  2×2 of the four main variants, 174px tiles on `#14161b`, plus the repo
  logo (`docs/icon.svg` via `rsvg-convert -w 150`) with a soft shadow in
  the center.
- **Hero slideshow** (`docs/shots/<family>-<variant>.webp`, Monochrome
  variants left out on purpose since they barely differ): same render
  setup, crop `0 0 900 900` (sidebar, tree and the start of the chat), then
  `magick X.png -resize 720x720 -quality 82 docs/shots/<family>-<variant>.webp`.
