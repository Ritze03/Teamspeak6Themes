# TeamSpeak 6 Themes

Theme extensions for the TeamSpeak 6 client, built by reverse-engineering
the client's CSS variable system (from a local dump of the client UI in
`TeamspeakOriginal/` — not committed).

The themes are designed for **"Compact"** under
**Settings → Appearance → Tree Style**, but they also work with the
"Detailed" mode.

## Extensions

### Graphite (`graphite-compact/`, identifier `de.wurst.graphite`)

Compact dark-gray theme family. 26px server-tree rows, layered gray
backgrounds, vanilla TeamSpeak accent colors for icons and indicators.

| Sub-theme | File | Look |
|---|---|---|
| Compact - Vanilla | `Vanilla.css` | Gray backgrounds, stock accents, blue buttons |
| Compact - Monochrome | `Monochrome.css` | Gray UI chrome too; only content/status stays colored |
| Compact - Amoled | `Amoled.css` | Pitch-black surfaces, 1px pane separator lines |
| Compact NoScroll - * | `NoScroll*.css` | Same, without tree/chat scrollbars |

Architecture: `GraphiteBase.css` (shared) ← imported by every sub-theme with a
cache-buster (`GraphiteBase.css?v=N`). **Bump `N` in all sub-theme imports
whenever the base changes** — the client caches the import URL per session.

### Aurora (`aurora/`, identifier `de.wurst.aurora`)

The glassmorphism look promoted to its own extension, at Graphite's compact
sizing (26px tree rows). `FableCore.css` (copy) ← `AuroraBase.css` (glass
surfaces, orbs, sizing; variant knobs `--au-accent/-strong`, `--au-link`,
`--au-self-bg`, `--au-orb-1..4`, `--au-canvas`) ← variants:

| Sub-theme | Look |
|---|---|
| Aurora - Violet | The original violet/cyan/pink aurora |
| Aurora - Blue | Deep blue night, cyan/indigo glows |
| Aurora - Green | Emerald/teal northern lights |
| Aurora - Monochrome | Silver glow, neutral glass, gray UI chrome (voice ring stays vanilla blue) |
| Aurora NoScroll - * | Same, without tree/chat scrollbars |

`aurora/FableCore.css` is the plumbing layer that maps every client variable
onto a `--fb-*` palette contract; `AuroraBase.css` builds the glass look on
top of it.

## Install

Copy the extension folder into `~/.config/TeamSpeak/Default/extensions/`
(**real files — the client refuses symlinked folders**), then pick the theme
under Settings → Appearance. No restart needed for re-scans; the settings
page re-enumerates extensions when opened.

## Client quirks (hard-won)

- The client injects its default `:root` variables **after** the user
  stylesheet → every variable override needs `!important`.
- `package.json` requires `image`, `repository`, and per-theme `image`
  fields, or the extension is silently ignored.
- **Theme names max 30 characters** — one longer name invalidates the whole
  extension.
- Default palette lives in `main.html`'s `<head>`, not `main.css`. A few
  values are re-declared per element (e.g. chat link color on
  `.ts-chat-room-event-detailed`) and must be overridden at that scope.
- Chat attachment boxes size via `--ts-attachment-height` +
  `.ts-chat-message-attachment-inner { max-width }`. Don't fight the system
  with `width/height: auto` — it crops.
- Channel names may contain literal newlines/padding spaces rendered with
  `white-space: pre` — compact rows must collapse them.

## Dev loop

1. Launch: `teamspeak --remote-debugging-port=9222 '--remote-allow-origins=*'`
2. Edit CSS in this repo, `cp` to the extensions dir.
3. Hot reload via CDP:
   `document.getElementById("userStyle").href = "tsui://extension/<id>/<file>.css?v=" + Date.now()`
4. Screenshot via CDP `Page.captureScreenshot` to verify.

`Compact.css` (the original hand-made theme, kept for reference) and the
`TeamspeakOriginal/` client dump live only in the local working copy — both
are gitignored.
