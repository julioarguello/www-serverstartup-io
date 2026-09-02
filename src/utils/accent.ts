/**
 * Accent-on-fill contrast (#304).
 *
 * A button on a section page fills with that section's colour on hover
 * (founder, 2026-08-19: "el color al ponerse encima me gustaría que fuera el
 * de la sección; negro si no tiene sección"). The label then has to stay
 * readable on six very different colours, and it does not by default —
 * measured against the CMS palette, white on the CDN orange is 2.65:1 and ink
 * on the e-commerce blue is 4.66:1. Picking one label colour for all six is
 * wrong whichever one you pick.
 *
 * So the pair is computed from the colour itself: take the label that
 * contrasts more, and if neither clears AA (4.5:1), darken or lighten the
 * fill by the smallest amount that gets there. Only one of the six needs it —
 * the Big Data red, where raw ink is 4.25 and raw white 3.92.
 *
 * Doing this in the template rather than in CSS is deliberate: CSS cannot
 * branch on luminance, and a new colour added in the CMS tomorrow must not
 * silently ship an unreadable button.
 */

const INK = "#1E1E1E";
const PAPER = "#FFFFFF";
const AA = 4.5;

type RGB = [number, number, number];

function parse(hex: string): RGB {
	const h = hex.trim().replace("#", "");
	const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
	return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as RGB;
}

function toHex([r, g, b]: RGB): string {
	return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

function relativeLuminance([r, g, b]: RGB): number {
	const f = (v: number) => {
		const c = v / 255;
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	};
	return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG 2.x contrast ratio between two colours. */
export function contrast(a: string, b: string): number {
	const [la, lb] = [relativeLuminance(parse(a)), relativeLuminance(parse(b))];
	const [hi, lo] = la > lb ? [la, lb] : [lb, la];
	return (hi + 0.05) / (lo + 0.05);
}

function mix(from: RGB, towards: RGB, amount: number): RGB {
	return from.map((v, i) => v * (1 - amount) + towards[i] * amount) as RGB;
}

export interface AccentPair {
	/** background of the filled (hover/active) state */
	fill: string;
	/** label colour that clears AA on that fill */
	label: string;
	/** the ratio actually achieved — surfaced so a caller can assert on it */
	ratio: number;
}

/**
 * The filled state for a section colour: the colour itself when it can carry
 * a readable label, otherwise the nearest shade of it that can.
 */
export function accentFill(accent: string | undefined | null): AccentPair {
	const base = accent && /^#?[0-9a-fA-F]{3,6}$/.test(accent.trim()) ? accent : INK;

	const onInk = contrast(base, INK);
	const onPaper = contrast(base, PAPER);
	if (Math.max(onInk, onPaper) >= AA) {
		return onInk >= onPaper
			? { fill: base, label: INK, ratio: onInk }
			: { fill: base, label: PAPER, ratio: onPaper };
	}

	// Neither works on the raw colour: walk towards ink and towards paper in
	// 2% steps and take whichever reaches AA first — the smaller shift is the
	// one that still reads as the section's colour.
	const rgb = parse(base);
	for (let step = 0.02; step <= 0.6; step += 0.02) {
		const darker = toHex(mix(rgb, parse(INK), step));
		if (contrast(darker, PAPER) >= AA) return { fill: darker, label: PAPER, ratio: contrast(darker, PAPER) };
		const lighter = toHex(mix(rgb, parse(PAPER), step));
		if (contrast(lighter, INK) >= AA) return { fill: lighter, label: INK, ratio: contrast(lighter, INK) };
	}
	return { fill: INK, label: PAPER, ratio: contrast(INK, PAPER) };
}

/**
 * The accent as INK on paper (#460).
 *
 * `accentFill` above answers "what fills a button and what label can sit on
 * it". This answers the other half: the section colour used as TEXT, on the
 * white panel. Two of the six do not clear AA raw — the e-commerce blue is
 * 3.57:1 at 16px bold and the CDN orange is 2.65:1 — so the colour that made
 * the instrument's total and its headline figure readable had to be derived,
 * not declared.
 *
 * One threshold for all of them, AA 4.5, even where the type is large enough
 * to be allowed 3: "the accent, as text" should be one colour per section, not
 * one per size. The shift is the smallest that reaches it, so it still reads
 * as that section's colour — the blue moves about a fifth of the way to ink.
 */
export function accentInk(accent: string | undefined | null): { color: string; ratio: number } {
	const base = accent && /^#?[0-9a-fA-F]{3,6}$/.test(accent.trim()) ? accent : INK;
	if (contrast(base, PAPER) >= AA) return { color: base, ratio: contrast(base, PAPER) };

	const rgb = parse(base);
	for (let step = 0.02; step <= 1; step += 0.02) {
		const darker = toHex(mix(rgb, parse(INK), step));
		if (contrast(darker, PAPER) >= AA) return { color: darker, ratio: contrast(darker, PAPER) };
	}
	return { color: INK, ratio: contrast(INK, PAPER) };
}
