[Español](README.md) | [English](README.en.md)

<p align="center">
  <img src="extension/brand/logo-master.png" alt="MementoLife" width="320">
</p>

# MementoLife — Chrome Extension

[![Available in Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Available-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/mementolife/eackmngdibobdeciapcedkmjoecaiblp)

Replaces the new tab page with a grid of weeks, computed from your date of birth: the weeks
you have lived are drawn filled in, the ones ahead barely there, and a ring marks the week
you are in now. With light and dark themes, a full interface in 6 languages, and a different
historical fact for every day of the year.

---

## 📸 Screenshots

| | |
|---|---|
| ![Dark theme](extension/brand/store/1-dark.png) | ![Light theme](extension/brand/store/2-light.png) |
| ![Options page](extension/brand/store/3-opciones.png) | ![Fact of the day](extension/brand/store/4-efemeride.png) |

---

## 🎯 Features

- Grid of weeks lived and left, with life expectancy adjustable between 20 and 100 years
- Light, dark, or system theme
- 6 languages across the whole interface, not just the content: Spanish, English, French,
  Portuguese, Italian and German
- Daily historical fact (366 dates, in all 6 languages), can be turned off
- Zero network connections, a single permission (`storage`), and the date of birth stored in
  `chrome.storage.local`, never `sync`: it never travels through your Google account

Full detail in [PRIVACY.en.md](PRIVACY.en.md).

---

## 🛠️ Tech Stack

| Layer | Technology |
|------|------------|
| **Language** | Strict TypeScript, no `any` |
| **Runtime** | No framework, no bundler — native ESM, `tsc` as the only build step |
| **Render** | SVG from a pure core: no DOM, no `chrome.*`, the date comes in as a parameter |
| **Testing** | Vitest (unit + snapshots) + Playwright (e2e against the real package) |
| **Packaging** | Manifest V3, a single permission, no service worker |
| **CI** | GitHub Actions on every push |

The grid is 4160 dots, but the DOM holds **7 nodes**: three `<path>` elements —past, future
and ring— are accumulated instead of emitting one element per cell. Measured against the
naive alternative: 1.30 ms against 10.00 ms.

---

## Install

[![Available in Chrome Web Store](https://img.shields.io/badge/Chrome_Web_Store-Available-blue?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/mementolife/eackmngdibobdeciapcedkmjoecaiblp)

Install **MementoLife** directly from the **[Chrome Web Store](https://chromewebstore.google.com/detail/mementolife/eackmngdibobdeciapcedkmjoecaiblp)**.

> In incognito windows, Chrome does not allow any extension to override the new tab page.
> That is a platform restriction.

## Development

```bash
npm run typecheck   # strict tsc, no any
npm test            # unit tests + snapshots
npm run e2e         # Playwright against the built package
npm run build       # installable package in build/
```

---

## Project history

MementoLife started as an Android app that put the grid on the lock screen. It worked, but
MIUI and One UI silently ignore attempts to update only the lock screen
(`setBitmap(..., FLAG_LOCK)` does not fail: it does nothing). Rather than break one of the
project's design decisions, the platform changed.

---

## 👤 Author

**Iván Gómez Dell'Osa**

- Email: [ivangomezdellosa@gmail.com](mailto:ivangomezdellosa@gmail.com)
- LinkedIn: [linkedin.com/in/ivangomezdellosa](https://www.linkedin.com/in/ivangomezdellosa/)
- GitHub: [IvanGomezDellOsa](https://github.com/IvanGomezDellOsa)
