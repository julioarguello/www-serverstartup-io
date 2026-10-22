/**
 * The site's web fonts, read from this directory at build time (#629).
 *
 * Until then `fontProviders.google()` downloaded them on every build, so a build
 * could fail on a network timeout to fonts.gstatic.com before testing anything —
 * which is how it was found. Production never depended on Google: Astro serves
 * the files from the site's own origin either way. These are the same bytes the
 * Google provider fetched, one `@font-face` per variant as it emitted them, so
 * the rendered CSS keeps its weights, styles and unicode ranges. Provenance and
 * licences: README.md beside this file.
 */
import { fontProviders } from "astro/config";

const DIR = "./src/assets/fonts/";

/**
 * Unicode ranges as Google Fonts splits each family, verbatim from its CSS, and
 * in its order: Astro derives a family's fallback metrics from its first file.
 */
const RANGE = {
	"cyrillic-ext": "U+0460-052F,U+1C80-1C8A,U+20B4,U+2DE0-2DFF,U+A640-A69F,U+FE2E-FE2F",
	"cyrillic": "U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116",
	"devanagari": "U+0900-097F,U+1CD0-1CF4,U+1CF7-1CF9,U+200C-200D,U+20A8,U+20B9,U+20F0,U+25CC,U+A830-A839,U+A8E0-A8FF,U+11B00-11B0A",
	"greek-ext": "U+1F00-1FFF",
	"greek": "U+0370-0377,U+037A-037F,U+0384-038A,U+038C,U+038E-03A1,U+03A3-03FF",
	"vietnamese": "U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB",
	"latin-ext": "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF",
	"latin": "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD",
};

const face = (file, weight, style, subset) => ({
	src: [DIR + file],
	weight,
	style,
	unicodeRange: RANGE[subset].split(",").map((r) => r.trim()),
});

/** One face per weight, all on the same variable file — as the Google provider emitted them. */
const perWeight = (file, weights, style, subset) => weights.map((w) => face(file, w, style, subset));

/** @type {import("astro").AstroUserConfig["fonts"]} */
export const fonts = [
	{
		provider: fontProviders.local(),
		name: "Alexandria",
		cssVariable: "--font-sans",
		fallbacks: ["sans-serif"],
		options: { variants: perWeight("alexandria-latin.woff2", [300, 400, 500, 600, 700], "normal", "latin") },
	},
	{
		provider: fontProviders.local(),
		name: "JetBrains Mono",
		cssVariable: "--font-mono",
		fallbacks: ["monospace"],
		options: {
			variants: [
				...perWeight("jetbrains-mono-latin-italic.woff2", [400, 500], "italic", "latin"),
				...perWeight("jetbrains-mono-latin.woff2", [400, 500], "normal", "latin"),
			],
		},
	},
	{
		// EmDash's admin always renders <Font cssVariable="--font-emdash">. With
		// `fonts: false` in its config it stops downloading Noto Sans, and this
		// family answers that variable instead — every script it shipped.
		provider: fontProviders.local(),
		name: "Noto Sans",
		cssVariable: "--font-emdash",
		fallbacks: ["sans-serif"],
		options: {
			variants: ["italic", "normal"].flatMap((style) =>
				Object.keys(RANGE).map((subset) => ({
					...face(`noto-sans-${subset}${style === "italic" ? "-italic" : ""}.woff2`, "100 900", style, subset),
					stretch: "100%", // what EmDash's Google provider declared for Noto
				})),
			),
		},
	},
];
