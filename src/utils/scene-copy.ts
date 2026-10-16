/**
 * The copy an opening's art must keep off (heroes rule §3: "keep things off the copy at runtime, never by
 * shrinking the frame"): every line of the h1, the body and the epigraph, and the CTA's box, as the browser
 * lays them out now. Each scene pads them its own way — the bridge places its connectors around them (#558),
 * the elevation withholds the axis bubbles that would sit behind a line (#547).
 */
export type CopyRect = { rect: DOMRect; quote: boolean; button: boolean };

export function copyRects(hero: HTMLElement): CopyRect[] {
	const out: CopyRect[] = [];
	for (const el of hero.querySelectorAll<HTMLElement>(".s-hero__copy h1, .s-hero__body p, .s-hero__epigraph p, .s-hero__epigraph figcaption")) {
		const r = document.createRange();
		r.selectNodeContents(el);
		const quote = !!el.closest(".s-hero__epigraph");
		for (const q of r.getClientRects()) if (q.width > 2) out.push({ rect: q, quote, button: false });
	}
	const b = hero.querySelector<HTMLElement>(".s-hero__copy .btn")?.getBoundingClientRect();
	if (b) out.push({ rect: b, quote: false, button: true });
	return out;
}

/** Whether two boxes come within `pad` px of each other. */
export function touches(a: DOMRect, b: DOMRect, pad = 0): boolean {
	return a.left < b.right + pad && b.left - pad < a.right && a.top < b.bottom + pad && b.top - pad < a.bottom;
}
