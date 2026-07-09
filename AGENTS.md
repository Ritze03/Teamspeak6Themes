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
- **Theme names max 30 characters** — one longer name invalidates the
  entire extension.
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
