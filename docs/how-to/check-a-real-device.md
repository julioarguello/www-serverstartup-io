# How to check the site on a real phone

<!-- doc-type: layered-how-to -->

Inspect a page on an Android phone, an iPhone or the iOS Simulator, with the desktop browser's developer
tools attached, when the emulated engines are not enough: a report from one device that the gate
`scripts/ci-check-engines.mjs` (WebKit · iPhone 13, WebKit · Desktop Safari, Chromium · Pixel 7) does not
reproduce. Paid device farms are out of scope.

| Section | You are… |
|:--|:--|
| [1. Inspect the site on an Android phone](#1-inspect-the-site-on-an-android-phone) | holding an Android phone and a USB cable |
| [2. Inspect the site on an iPhone](#2-inspect-the-site-on-an-iphone) | holding an iPhone and a Mac |
| [3. Inspect the site in the iOS Simulator](#3-inspect-the-site-in-the-ios-simulator) | on a Mac with Xcode, without the phone |

---

## 1. Inspect the site on an Android phone

### `TL;DR`

1. On the phone: turn on **Settings → System → Developer options → USB debugging**.
2. Connect the phone over USB, accept *Allow USB debugging?* on it, and open `chrome://inspect#devices` in
   desktop Chrome.
   Expect: the phone is listed, with its open tabs.
3. Optional: for a local stack, open **Port forwarding**, map port `8787` to `localhost:8787` and tick
   **Enable port forwarding**.
4. On the phone: open the page in Chrome, then select **inspect** under it on the desktop.
   Expect: DevTools for the phone's tab, with its screen mirrored.
5. In that tab's console: read the opening's state. → [Read the opening's state](#read-the-openings-state)
   ```js
   document.querySelector(".s-hero").className
   ```
   Expect: `is-playing` while it plays, then `is-done`.

### Read the opening's state

The class says whether the opening is moving:

```js
document.querySelector(".s-hero").className
```

**Verification:** `is-done` at once, with no `is-playing` before it, means the phone asks for reduced
motion — **Settings → Accessibility → Remove animations** — which is the intended state, not a defect:
[Troubleshooting: the opening shows its last frame](#troubleshooting-the-opening-shows-its-last-frame-and-never-moves).

**See also:** where the settings live → [Reference: the settings named on this page](#reference-the-settings-named-on-this-page)

---

## 2. Inspect the site on an iPhone

### `TL;DR`

1. On the iPhone: turn on **Settings → Apps → Safari → Advanced → Web Inspector**.
2. On the Mac: turn on **Safari → Settings → Advanced → Show features for web developers**.
3. Connect the iPhone by cable and open the page in Safari on the iPhone.
4. On the Mac: open **Develop → <the iPhone> → <the page>**.
   Expect: Web Inspector for the iPhone's tab.
5. In that tab's console: read the opening's state, as in [Read the opening's state](#read-the-openings-state).
   ```js
   document.querySelector(".s-hero").className
   ```
   Expect: `is-playing` while it plays, then `is-done`.

---

## 3. Inspect the site in the iOS Simulator

### `TL;DR`

1. On the Mac: start a simulated iPhone. → [Start the Simulator](#start-the-simulator)
   ```bash
   open -a Simulator
   ```
   Expect: a simulated iPhone on its home screen.
2. Open the page in the simulated iPhone's Safari.
   ```bash
   xcrun simctl openurl booted http://localhost:8787/
   ```
   Expect: Safari on the simulated iPhone, showing the page.
3. On the Mac: open **Develop → Simulator → <the page>**.
   Expect: Web Inspector for the simulated tab.

### Start the Simulator

The Simulator ships with Xcode, not with the Command Line Tools:

```bash
open -a Simulator
```

**Prerequisites:** Xcode installed, with one iOS runtime (**Xcode → Settings → Components**). The
simulated iPhone shares the Mac's network, so a local stack on `localhost:8787` needs no forwarding.

---

## Appendix

### Explanation: why a real device after an emulated engine

`scripts/ci-check-engines.mjs` runs Safari's engine and Android's Chromium on the stack, but an emulated
profile is a viewport, a user agent and a touch flag on a desktop build: no GPU of the phone's, no battery
saver, no system setting the person never mentions. A device answers what only the device knows; the gate
answers whether the engine renders the page. Start with the gate, and come here when it is green and the
report stands.

Used by: [1. Inspect the site on an Android phone](#1-inspect-the-site-on-an-android-phone),
[2. Inspect the site on an iPhone](#2-inspect-the-site-on-an-iphone).

### Reference: the settings named on this page

| Device | Setting | Where |
|:--|:--|:--|
| Android | Developer options | appear after tapping **Settings → About phone → Build number** seven times |
| Android | USB debugging | **Settings → System → Developer options** (the path varies by manufacturer) |
| Android | Remove animations | **Settings → Accessibility** — some battery savers turn it on |
| iPhone | Web Inspector | **Settings → Apps → Safari → Advanced** |
| iPhone | Reduce Motion | **Settings → Accessibility → Motion** |
| Mac | Develop menu | **Safari → Settings → Advanced → Show features for web developers** |

Used by: [1. Inspect the site on an Android phone](#1-inspect-the-site-on-an-android-phone),
[2. Inspect the site on an iPhone](#2-inspect-the-site-on-an-iphone).

### Troubleshooting: the opening shows its last frame and never moves

This issue occurs when the device asks for reduced motion: Android's **Remove animations** (which some
battery savers turn on), or iOS's **Reduce Motion**. Every opening then starts at its end, the home holds
its first frame, and no pause control is shown — the intended behaviour, asserted on every profile by
`scripts/ci-check-engines.mjs`. To resolve it, turn the setting off and reload; if the opening still
does not play, it is a defect: report the device, the browser and the opening's class.

Used by: [Read the opening's state](#read-the-openings-state), [2. Inspect the site on an iPhone](#2-inspect-the-site-on-an-iphone).
