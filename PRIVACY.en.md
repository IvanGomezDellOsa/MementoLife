# Privacy Policy — MementoLife

*Last updated: 28 July 2026 · [Versión en español](PRIVACY.md)*

## Summary

**MementoLife collects, transmits and shares no data whatsoever.** There are no servers, no
accounts, no analytics and no network access. The extension runs entirely inside your
browser.

## What data the extension handles

To draw the grid, MementoLife needs you to tell it:

| Data | Purpose | Where it lives |
|---|---|---|
| Date of birth | Work out which weeks you have already lived | Your device only |
| Life expectancy (20–100) | How many weeks the grid holds | Your device only |
| Theme, language, fact on/off | Display preferences | Your device only |

All of it is stored with `chrome.storage.local`, which is **local browser storage**.
`chrome.storage.sync` is deliberately **not** used, because that would send your date of
birth to Google's servers through your account.

Accepted consequence: installing the extension on another computer means entering the date
again. That is the price of the data never leaving your device.

## What the extension does NOT do

- It does not connect to the internet. **Ever.** Not even for fonts: the typeface ships
  inside the package. An automated test fails if any network request appears.
- No analytics, no telemetry, no crash reporting.
- No accounts, no credentials.
- It does not read your history, bookmarks, tabs or the contents of any page.
- No ads, no sponsored content.
- It does not alter your search engine or your search results.

## Permissions

The extension requests **a single permission**:

- **`storage`** — to save your date of birth, life expectancy and your theme, language and
  fact preferences locally. Nothing else.

It requests no `host_permissions`, has no service worker, injects no scripts into any page
and cannot see any site you visit.

## Deleting your data

Uninstalling the extension removes everything it stored. You can also clear the date from
the options page at any time. Since nothing ever left your device, there is nothing else for
us to delete.

## Content

The 366 historical facts ship inside the package. They are not downloaded or updated over
the network and depend on no external service.

## Changes

Should this policy change, the new version will live in this same file, inside the project's
public repository, with its date.

## Contact

Repository: https://github.com/IvanGomezDellOsa/MementoLife
