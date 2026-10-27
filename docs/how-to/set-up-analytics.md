# How to set up the site's analytics in the Cloudflare dashboard

<!-- doc-type: layered-how-to -->

The site measures visits in two ways:

- **Cloudflare Web Analytics** counts every visit. It sets no cookie, so it needs no consent. The site
  has to know each measured hostname's token.
- **Google Analytics 4 (GA4)**, loaded through **Zaraz**, Cloudflare's tag manager. GA4 sets cookies,
  so it runs only after the visitor accepts the site's consent banner (#667).

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
   turn off **Auto-inject script**, and select **Save**. → [Turn off Auto-inject script](#turn-off-auto-inject-script)
2. Open **Zaraz → Tools**, add **Google Analytics 4**, and enter the measurement ID `G-CZDVNRD4NB`.
   Expect: the tool listed as enabled.
3. Open **Zaraz → Consent** and turn on **Enable Consent Management**.
4. Under **Purposes**, add a purpose named `Analítica`, with the English translation `Analytics`.
   Assign Google Analytics 4 to it. → [Explanation: why GA4 must have a purpose](#explanation-why-ga4-must-have-a-purpose)
   Expect: GA4 shows `Analítica` as its purpose.
5. On the same page, turn off the automatic display of Zaraz's consent modal, and select **Save**.
   Expect: visiting the site shows no Zaraz modal. The site's own banner asks instead.

### Turn off Auto-inject script

The site loads Zaraz itself, and only after the visitor accepts the banner: `src/utils/consent.ts`
appends this script then, and on every later page while the answer stands.

```html
<script src="/cdn-cgi/zaraz/i.js" referrerpolicy="origin"></script>
```

With Auto-inject on, Zaraz would load on every page before anyone answered, and set its
`cf_zaraz_client` cookie without consent. A page that had accepted would also get the script twice. And according to
[Cloudflare's post on Zaraz and CSP](https://blog.cloudflare.com/cloudflare-zaraz-supports-csp/),
auto-injection adds a nonce to the response's Content Security Policy (CSP). The site's CSP is pinned by
`tests/unit/csp-outside-hosts.test.ts`, and that rewrite would happen where no test sees it.

---

## 3. Check what a page actually loads

### `TL;DR`

1. List the outside scripts the page asks for:
   ```bash
   curl -s https://www.serverstartup.io/ | grep -o '<script[^>]*cloudflareinsights[^>]*>'
   ```
   Expect: one tag, carrying the token for that hostname.
2. Check that Zaraz answers through the Worker:
   ```bash
   curl -s -o /dev/null -w '%{http_code}\n' https://www.serverstartup.io/cdn-cgi/zaraz/i.js
   ```
   Expect: `200` once Zaraz is on for the zone; `404` while it is off.
3. Open the page in a browser with developer tools. In **Console**, look for CSP errors. In
   **Application → Cookies**, look for the GA4 cookies, `cfz_google-analytics_v4` and
   `cfzs_google-analytics_v4`.
   Expect: no CSP errors, and neither GA4 cookie until the banner is accepted. Zaraz runs GA4 on
   Cloudflare's side, so the browser never receives Google's own `_ga`.
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
| Web Analytics sites and their mode | dashboard | one site per measured hostname, *JS Snippet installation* |
| Web Analytics tokens | repository | `BEACON_TOKENS`, `src/utils/web-analytics.ts` |
| CSP hosts for Web Analytics | repository | `src/middleware.ts`, pinned by `tests/unit/csp-outside-hosts.test.ts` |
| Zaraz Auto-inject script | dashboard | off, on every zone |
| GA4 measurement ID | dashboard | `G-CZDVNRD4NB` |
| Consent purpose and its tools | dashboard | `Analítica` / `Analytics`, with GA4 assigned; its ID on `serverstartup.dev` is `TlZw` (each zone generates its own) |
| Consent cookie | Zaraz | `zaraz-consent`, set when the visitor answers |
| GA4 cookies | Zaraz | `cfz_google-analytics_v4`, `cfzs_google-analytics_v4`, only after consent |
| Zaraz client cookie | Zaraz | `cf_zaraz_client`, set by `/cdn-cgi/zaraz/s.js` on every load, before any answer |
| Zaraz modal automatic display | dashboard | off |
| Banner text and the link to reopen it | CMS | `ui_labels_es` / `ui_labels_en` (#667) |

### Explanation: why the beacon is not injected by the zone

The zone's automatic setup was the first design (#666). It never reached these pages. `serverstartup.dev`
had been in *Automatic setup* for three months with zero page views. After #666 let the CSP admit the
beacon's host, preview still served no beacon. That was measured on 2026-10-26, with curl and with a real
Chromium session, which made zero requests outside the origin. The pages come from a Worker on a Custom
Domain. Hence the tag in `Base.astro` (#668).

The same reasoning is why Zaraz is loaded by hand. Its auto-injection was not measured here, but it is the
same kind of edge rewriting.

### Explanation: why GA4 must have a purpose

An unassigned tool skips consent altogether. Zaraz's own docs: *"When you add a new tool to your
website, Zaraz does not assign any purpose to it. This means that this tool will skip consent by
default."* Then GA4 would set its cookies before anyone accepted, and the privacy page would be false.

**Verification:** in [3. Check what a page actually loads](#3-check-what-a-page-actually-loads), no
GA4 cookie exists before the banner is answered.

### Troubleshooting: Web Analytics shows zero page views

Run step 1 of [3. Check what a page actually loads](#3-check-what-a-page-actually-loads) against that
hostname. No tag means the hostname is missing from `BEACON_TOKENS`, or the change is not deployed yet.
A tag with no counts after a visit means its token belongs to another site: compare it with the one
**Manage site** shows.

### Troubleshooting: the console reports an inline script blocked by the CSP

The error reads *Executing inline script violates the following Content Security Policy directive
'script-src …'*, once per script Zaraz delivers. Zaraz runs those scripts inline, giving each the nonce
of the first `<script nonce>` in the page, and the site's CSP admits no inline script.

What they carry decides whether it matters. On `serverstartup.dev` they were Zaraz's own bookkeeping,
such as `zarazData.executed.push("Pageview")`. GA4 runs on Cloudflare's side, and with the CSP
unchanged it still set its cookies once consent was given. A tool that runs code in the browser would
lose it. Whether the site's CSP gains a per-response nonce is decided in #667.
