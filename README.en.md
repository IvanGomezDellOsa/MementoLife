[Español](README.md) | [English](README.en.md)

<p align="center">
  <img src="extension/brand/hourglass.png" alt="" width="120">
</p>

<h1 align="center">MementoLife</h1>

<p align="center">
  Every new tab, your whole life drawn as a grid of weeks.<br>
  No accounts, no network, nothing leaves your device.
</p>

---

Every dot is one week. The ones you have lived are filled in; the ones ahead are barely
there. An empty ring marks the week you are in right now.

No motivational quotes, no reminders, nothing to do. Just the shape of your life, every time
you open a tab.

## What it does

- Set up once: your date of birth.
- Life expectancy adjustable between 20 and 100 years.
- Light and dark themes, or follow the system.
- Fully bilingual English/Spanish across the whole interface, not just the content.
- One historical fact a day, which you can turn off.

## Privacy

**The extension never connects to the internet.** Not even for fonts: the typeface ships
inside the package. An automated test fails if any network request appears, and the build
rejects the package if it finds a remote URL.

Your date of birth is stored with `chrome.storage.local` (local storage) and deliberately
**not** with `chrome.storage.sync`, which would send it to Google servers through your
account.

It requests **a single permission**: `storage`. No `host_permissions`, no service worker, no
content scripts. It cannot see any page you visit.

Full detail in [PRIVACY.en.md](PRIVACY.en.md).

## Install

Not published on the Chrome Web Store yet. In the meantime:

```bash
cd extension && npm ci && npm run build
```

Then, in `chrome://extensions`: enable **Developer mode**, choose **Load unpacked** and pick
`extension/build`.

> In incognito windows, Chrome **does not allow** any extension to override the new tab page.
> That is a platform restriction; it is documented, not worked around.

## How it is built

TypeScript, no framework, no bundler in the shipped artifact. The published code **is** the
code in this repo: no minification, no obfuscation, which is also what the store policy
explicitly asks for.

```
extension/src/core/     pure logic: no DOM, no chrome.*, never reads the clock
extension/src/          the pages: newtab, options, preferences
render-core/            design-tokens.json, the single source of design truth
content/efemerides/     the 366 historical facts, in Spanish and English
```

The core is pure on purpose: the date always comes in as a parameter. That is what makes the
tests deterministic and lets the visual regression gate be text rather than pixels.

One performance detail worth mentioning: the grid is 4160 dots, but the DOM holds **7 nodes**.
Three `<path>` elements are accumulated (past, future and ring) instead of emitting one element
per cell. Measured: 1.30 ms against 10.00 ms, and 594 times fewer nodes.

## Development

```bash
npm run typecheck   # strict tsc, no any
npm test            # 263 unit tests + snapshots
npm run e2e         # Playwright against the built package
npm run build       # installable package in build/
npm run shots       # screenshots at real viewport sizes
```

## Project history

MementoLife started as an Android app that put the grid on the lock screen. It was finished
and working, but hit an unfixable platform limitation: **MIUI and One UI silently ignore**
attempts to update only the lock screen. `WallpaperManager.setBitmap(..., FLAG_LOCK)` does not
fail, it simply does nothing.

Rather than break one of the design decisions of the project, the platform changed. The
Android code is frozen at the `android-v1-final` tag.

## License

MIT.
