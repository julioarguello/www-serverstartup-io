# Web fonts

The fonts the site renders with, read from here at build time by Astro's local
font provider ([`families.mjs`](families.mjs), wired in `astro.config.mjs`). The
build needs no network for them, and production serves them from the site's own
origin — `/_astro/fonts/…`, under a `font-src 'self'` CSP.

## What is here and where it came from

| Family | Used for | Files | Google Fonts version | Licence |
| :--- | :--- | :--- | :--- | :--- |
| Alexandria | the site's sans (`--font-sans`) | `alexandria-latin.woff2` — variable, 300–700 | v6 | [OFL 1.1](OFL-alexandria.txt) |
| JetBrains Mono | code and consoles (`--font-mono`) | `jetbrains-mono-latin.woff2`, `-latin-italic.woff2` — variable, 400–500 | v24 | [OFL 1.1](OFL-jetbrains-mono.txt) |
| Noto Sans | the EmDash admin (`--font-emdash`) | `noto-sans-<script>[-italic].woff2` — variable, 100–900, one file per script and style | v42 | [OFL 1.1](OFL-noto-sans.txt) |

Each file is byte-identical to the one Google Fonts serves for that family,
script and style — the files Astro's Google provider used to download on every
build until #629. The unicode range of each script is copied verbatim from
Google's CSS into `families.mjs`, so the browser downloads the same subsets as
before. Licences from [google/fonts](https://github.com/google/fonts) `ofl/`.

## Why not Cloudflare Fonts

[Cloudflare Fonts](https://developers.cloudflare.com/speed/optimization/content/fonts/)
rewrites `<link>` tags pointing at Google Fonts so the fonts are served from the
zone. It does not apply to self-hosted or bundled fonts — which these already
were — and it falls back to loading from Google wherever it cannot act: on the
preview, which has no zone, that means a third-party request and a looser CSP.
Weighed and set aside in #629.

## Changing a font

1. Get the woff2 for each script and style from the Google Fonts CSS API
   (`https://fonts.googleapis.com/css2?family=…`, requested with a modern
   browser's user agent so it answers with woff2 and unicode ranges).
2. Replace the files here, and in `families.mjs` the ranges if Google's changed.
3. Update the version column above and the licence file if it is a new family.
4. `tests/unit/fonts-local.test.ts` fails if any family is read from a remote
   provider again, or if a file `families.mjs` names is missing.
