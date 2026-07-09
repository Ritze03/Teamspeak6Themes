# TeamSpeak 6 Themes

🌐 **[Read this page as a website — English / Deutsch](https://ritze03.github.io/Teamspeak6Themes/)**

Two custom themes for the new TeamSpeak client, each with several variants
to pick from.

## Graphite — compact & dark

A clean dark-gray look with a compact server tree, so more channels and
users fit on your screen. Colored icons and talking indicators stay just
like you know them.

| Variant | Look |
|---|---|
| Compact - Vanilla | Gray backgrounds, normal TeamSpeak colors, blue buttons |
| Compact - Monochrome | Buttons and highlights turn gray too — only icons stay colored |
| Compact - Amoled | Pitch black, perfect for OLED screens |
| Compact NoScroll - … | The same three, but without scrollbars in the channel tree and chat |

## Aurora — glassy & glowing

Frosted, semi-transparent panels floating over soft glowing lights, with
the same compact server tree as Graphite.

| Variant | Look |
|---|---|
| Aurora - Violet | Violet, cyan and pink glow |
| Aurora - Blue | Deep blue night |
| Aurora - Green | Emerald northern lights |
| Aurora - Monochrome | Silver glow, gray accents |
| Aurora NoScroll - … | The same four, without scrollbars in the channel tree and chat |

## How to install

1. **[⬇ Download the themes (ZIP)](https://github.com/Ritze03/Teamspeak6Themes/archive/refs/heads/master.zip)**
   and unpack the file somewhere.
2. Open TeamSpeak and go to **Settings → Appearance**.
3. Turn on the **User Theme** toggle.
4. Click the small **folder icon** next to the theme cards. TeamSpeak opens
   its **extensions** folder for you.
   - Linux: usually `~/.config/TeamSpeak/Default/extensions`
   - Windows: usually `%APPDATA%\TeamSpeak\Default\extensions`
5. Move (or copy) the folders **`de.wurst.graphite`** and
   **`de.wurst.aurora`** from the unpacked download into that extensions
   folder. You can also install just one of them.
6. Back in TeamSpeak, click the small **refresh icon** (circular arrow) next
   to the folder icon — the new themes appear as cards.
7. Click the theme you like.
8. **Restart TeamSpeak** — the channel tree only applies its sizing
   properly after a restart. Done!

## Good to know

- The themes are designed for the **"Compact"** setting under
  **Settings → Appearance → Tree Style**, but they also work with
  "Detailed".
- **Restart TeamSpeak after activating or switching a theme** — the channel
  tree view only updates its sizing properly after a restart. Until then
  the channel list may look squished or oddly spaced.
- Updating: replace the two folders with new versions, then press the
  refresh icon (or restart TeamSpeak).
- Uninstalling: delete the folders from the extensions folder.
