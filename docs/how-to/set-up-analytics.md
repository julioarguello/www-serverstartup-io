# How to set up the site's analytics in the Cloudflare dashboard

<!-- doc-type: layered-how-to -->

The site measures visits in two ways:

- **Cloudflare Web Analytics** counts every visit. It sets no cookie, so it needs no consent. The site
  has to know each measured hostname's token.
- **Google Analytics 4 (GA4)**, loaded through **Zaraz**, Cloudflare's tag manager. GA4 sets cookies,
  so it runs only after the visitor accepts it in Zaraz's own consent window (#667).

Part of the setup is code in this repository. The rest lives in the Cloudflare dashboard, where no
review or CI reaches it. This page is that rest: what to set, where, and how to check it took effect.
Why the setup is shaped this way is in [`docs/architecture.md` §6](../architecture.md#6-analytics).

| Section | You are… |
|:--|:--|
| [1. Measure a hostname with Web Analytics](#1-measure-a-hostname-with-web-analytics) | adding a hostname to Web Analytics, or checking one |
| [2. Prepare Zaraz for Google Analytics on a zone](#2-prepare-zaraz-for-google-analytics-on-a-zone) | turning on GA4 for `serverstartup.dev` or `serverstartup.io` |
| [3. Check what a page actually loads](#3-check-what-a-page-actually-loads) | after any change in either of the above |

---

## 1. Measure a hostname with Web Analytics

### `TL;DR`

1. If the hostname's zone already has a site with an orange cloud, skip to step 3: one site counts
   every host of its zone. Otherwise open **Web Analytics**, select **Add a site**, and pick the zone
   from the drop-down, for example `serverstartup.io`, instead of typing a hostname.
   Expect: the site shows an orange cloud. A typed hostname gets a grey one, because the dashboard
   treats it as a host outside Cloudflare.
2. On that site, select **Manage site** and set the mode to **Enable with JS Snippet installation**.
   Expect: the site's row reads *JS Snippet installation*, not *Automatic setup*.
3. Copy the `token` from the snippet the dashboard shows. → [Register the token](#register-the-token)
4. Check every Web Analytics site of the account.
   Expect: no site left in *Automatic setup*, and no grey-cloud site for a host of a zone we own.
5. Once the change is deployed, check the page. → [3. Check what a page actually loads](#3-check-what-a-page-actually-loads)

### Register the token

The token goes into `BEACON_TOKENS` in `src/utils/web-analytics.ts`, keyed by the exact hostname. Every
hostname of one zone carries that zone's token, and the dashboard's **Host** filter tells them apart:

```ts
"www.serverstartup.io": "<token>",
```

`Base.astro` emits the beacon only for a hostname listed there, so a hostname left out is simply not
measured. `tests/unit/web-analytics.test.ts` lists the expected hostnames and checks one token per zone,
so adding a hostname means changing the test in the same pull request. The token is not a secret: Cloudflare prints it into the page source.

**Never** choose *Enable, excluding visitor data in the EU*. For a Spanish site it drops most visitors.

---

## 2. Prepare Zaraz for Google Analytics on a zone

Do it on `serverstartup.dev` first, where preview runs, and on `serverstartup.io` only once preview
checks out.

### `TL;DR`

1. Open **Zaraz → Settings** (the dashboard may file it under **Tag management**), choose the zone,
   and check that **Auto-inject script** is on, as it is by default.
2. Open **Zaraz → Tools**, add **Google Analytics 4**, and enter the zone's own measurement ID:
   `G-CZDVNRD4NB` on `serverstartup.io`, `G-JTC176MCZD` on `serverstartup.dev`. Each is a separate GA4
   property, so test visits on preview never count as production.
   Expect: the tool listed as enabled.
3. Open **Zaraz → Consent** and turn on **Enable Consent Management**.
4. Under **Purposes**, add a purpose named `Analítica`, with the English translation `Analytics`.
   Assign Google Analytics 4 to it. → [Explanation: why GA4 must have a purpose](#explanation-why-ga4-must-have-a-purpose)
   Expect: GA4 shows `Analítica` as its purpose.
5. On the same page, turn on the automatic display of the consent modal.
6. Set the default language to Spanish.
7. Enter the **Consent modal text** for `es` and for `en`, exactly as the repository keeps it, and leave
   **Custom CSS** empty. → [Reference: the consent window's text](#reference-the-consent-windows-text)
8. Select **Save**.
   Expect: a first visit to the site, in a private window, shows Zaraz's window.

---

## 3. Check what a page actually loads

### `TL;DR`

1. List the outside scripts the page asks for:
   ```bash
   curl -s https://www.serverstartup.io/ | grep -o '<script[^>]*cloudflareinsights[^>]*>'
   ```
   Expect: one tag, carrying the token for that hostname.
2. Check that Zaraz is injected, and that the CSP carries its nonce:
   ```bash
   curl -s -H 'Accept: text/html' -D - -o /tmp/page.html https://www.serverstartup.io/ | grep -io "'nonce-[^']*'"
   grep -c 'zaraz._v' /tmp/page.html
   ```
   Expect: one nonce, and `1`. Neither while Zaraz is off for the zone. The edge injects Zaraz only
   when the request asks for HTML, so without the `Accept` header both read as off.
3. Open the page in a private window with developer tools. In **Console**, look for CSP errors. In
   **Application → Cookies**, look at the cookies before and after you answer the window.
   Expect: no CSP errors. Before an answer, only `cf_zaraz_client`. After **Accept**, also
   `zaraz-consent`, `cfz_google-analytics_v4` and `cfzs_google-analytics_v4`; after **Reject**, only
   `zaraz-consent` besides the first. Zaraz runs GA4 on Cloudflare's side, so the browser never
   receives Google's own `_ga`.
   → [Troubleshooting: the console reports an inline script blocked by the CSP](#troubleshooting-the-console-reports-an-inline-script-blocked-by-the-csp)
4. In the same **Console**, list the consent purposes:
   ```js
   zaraz.consent.purposes
   ```
   Expect: one purpose, named `Analítica` / `Analytics`. A purpose shows up only when a tool is
   assigned to it, so an empty object means GA4 has no purpose and skips consent.
5. In **Web Analytics**, open the hostname's site.
   Expect: page views counting within a few minutes of a visit.

---

## 4. Appendix

### Reference: what the dashboard holds and what the repository holds

| Setting | Lives in | Value |
|:--|:--|:--|
| Web Analytics sites and their mode | dashboard | one site per zone, *JS Snippet installation* |
| Web Analytics tokens | repository | `BEACON_TOKENS`, `src/utils/web-analytics.ts` |
| CSP hosts for Web Analytics | repository | `src/middleware.ts`, pinned by `tests/unit/csp-outside-hosts.test.ts` |
| Zaraz Auto-inject script | dashboard | on, on every zone (the default) |
| GA4 measurement ID, one property per zone | dashboard | `serverstartup.io`: `G-CZDVNRD4NB` · `serverstartup.dev` (preview): `G-JTC176MCZD` |
| Consent purpose and its tools | dashboard | `Analítica` / `Analytics`, with GA4 assigned; its ID on `serverstartup.dev` is `TlZw` (each zone generates its own) |
| Consent cookie | Zaraz | `zaraz-consent`, set when the visitor answers, one year |
| GA4 cookies | Zaraz | `cfz_google-analytics_v4` (one year) and `cfzs_google-analytics_v4` (session), only after consent; a withdrawal leaves them to expire |
| Zaraz client cookie | Zaraz | `cf_zaraz_client`, empty, one year, set by `/cdn-cgi/zaraz/s.js` on every load, before any answer |
| Zaraz modal automatic display | dashboard | on |
| Consent window's text, `es` and `en` | dashboard | as in [The consent window's text](#the-consent-windows-text); default language Spanish |
| Footer link that reopens the window | CMS | `consent` widget, `reopen`, in `ui_labels_es` / `ui_labels_en` (#667) |

### Reference: the consent window's text

The one piece of the site's text that lives outside the CMS, kept here so the repository has it.
Used by step 7 of [2. Prepare Zaraz](#2-prepare-zaraz-for-google-analytics-on-a-zone).

`es`:

```html
<p>Con tu permiso medimos las visitas con Google Analytics, a través de Zaraz, de Cloudflare: tu navegador no se conecta con Google. Puedes cambiar tu elección cuando quieras desde «Preferencias de cookies», al pie de cada página. Más detalle en la <a href="/politica-de-privacidad">política de privacidad</a>.</p>
```

`en`:

```html
<p>With your permission we measure visits with Google Analytics, through Cloudflare's Zaraz: your browser never connects to Google. You can change your choice at any time from “Cookie preferences” at the foot of every page. More in the <a href="/en/privacy-policy">privacy policy</a>.</p>
```

Zaraz picks the language from the browser's `Accept-Language` header, not from the page: an English
browser reading a Spanish page gets the English window. A browser asking for neither language gets
the default, Spanish.

### Explanation: why Zaraz is injected by the zone and the beacon is not

The zone's automatic setup was the first design (#666). It never reached these pages. `serverstartup.dev`
had been in *Automatic setup* for three months with zero page views. After #666 let the CSP admit the
beacon's host, preview still served no beacon. That was measured on 2026-10-26, with curl and with a real
Chromium session, which made zero requests outside the origin. The pages come from a Worker on a Custom
Domain. Hence the tag in `Base.astro` (#668).

Zaraz's auto-injection, by contrast, does reach them: measured on preview on 2026-10-27, it puts its
script in every page requested as HTML and its nonce in the CSP. So Zaraz runs in its standard setup,
and the site adds nothing to it but the footer link that reopens the consent window. That rewrite of
the CSP happens at the edge, after the Worker: `tests/unit/csp-outside-hosts.test.ts` pins the policy
the Worker sends, not the one the browser receives.

### Explanation: why GA4 must have a purpose

An unassigned tool skips consent altogether. Zaraz's own docs: *"When you add a new tool to your
website, Zaraz does not assign any purpose to it. This means that this tool will skip consent by
default."* Then GA4 would set its cookies before anyone accepted, and the privacy page would be false.

**Verification:** in [3. Check what a page actually loads](#3-check-what-a-page-actually-loads), no
GA4 cookie exists before the window is answered.

### Troubleshooting: Web Analytics shows zero page views

Run step 1 of [3. Check what a page actually loads](#3-check-what-a-page-actually-loads) against that
hostname. No tag means the hostname is missing from `BEACON_TOKENS`, or the change is not deployed yet.
A tag with no counts after a visit means its token belongs to another site: compare it with the one
**Manage site** shows.

### Troubleshooting: the console reports an inline script blocked by the CSP

The error reads *Executing inline script violates the following Content Security Policy directive
'script-src …'*. With Auto-inject on, Zaraz adds the nonce of its inline script to the CSP itself, so
this means a Zaraz script reached the page without that nonce: Auto-inject is off and the script was
added by hand. Check step 1 of [2. Prepare Zaraz](#2-prepare-zaraz-for-google-analytics-on-a-zone) and step 2
of [3. Check what a page actually loads](#3-check-what-a-page-actually-loads).

### Troubleshooting: GA4 counts every page twice

Some code is granting consent again on every page, as the site's own banner did in #674. Zaraz sends
each page's Pageview once, and the queued one once more only on the page where the visitor accepts.
Search the site for a call to `zaraz.consent`; [Zaraz's consent API](https://developers.cloudflare.com/zaraz/consent-management/api/)
calls `setAll` and `sendQueuedEvents` only while no consent cookie exists.
