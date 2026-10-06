/**
 * The dusk a photograph opening paints over its photograph (#556, #567).
 *
 * Two ways night falls, on one canvas under the veil the size of the photograph, with what keeps or gains its
 * light (the Teide's domes, the Cabo Peñas lantern) cut out of it:
 * - a FRONT moving left to right with a wide soft edge (Big Data: each telescope's layer is born as it reaches
 *   its dome), `paintNight`;
 * - EVENLY over the whole frame at once, slow at first like real twilight (the lighthouse: the founder saw no
 *   sense in a direction there, 2026-10-06), `duskLevel` + `paintNightEven` — and the level is what the scene
 *   lights its own lights by.
 */

/**
 * The photograph's frame places itself in CSS (`.scene__frame` and each scene's sheet), so it paints at first
 * render — it is the opening's largest paint, and hiding it until a script ran cost ~1.3 s of LCP render delay
 * on a throttled phone (#568). The script then only refines it to the exact geometry it computed, as a
 * transform, which is never a layout shift. Returns the scale applied (1 where CSS already matched), which the
 * frame's local lengths (its fades) are divided by.
 */
export function alignFrame(el: HTMLElement, g: { L: number; T: number; W: number }, stage: DOMRect): number {
	el.style.transform = "";
	const r = el.getBoundingClientRect();
	const dx = g.L - (r.left - stage.left), dy = g.T - (r.top - stage.top), k = r.width ? g.W / r.width : 1;
	if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(k - 1) < 0.001) return 1;
	el.style.transform = `translate(${dx}px, ${dy}px) scale(${k})`;
	return k;
}

/** A front: where its leading edge is at each time (ms → stage px, piecewise linear), and its soft edge (px). */
export type DuskFront = { knots: [number, number][]; soft: number };

const clamp = (x: number) => Math.min(1, Math.max(0, x));

/** The front's leading edge at `ms`, in stage px. */
export function frontX(f: DuskFront, ms: number): number {
	const k = f.knots;
	if (!k.length) return 0;
	let i = 0;
	while (i < k.length - 2 && ms > k[i + 1][0]) i++;
	const [[t0, x0], [t1, x1]] = [k[i], k[i + 1] ?? k[i]];
	return x0 + (x1 - x0) * clamp((ms - t0) / (t1 - t0 || 1));
}

/** When the front's middle reaches stage column `x`, in ms. */
export function reached(f: DuskFront, x: number): number {
	const k = f.knots;
	if (!k.length) return 0;
	const at = x + f.soft / 3;
	let i = 0;
	while (i < k.length - 2 && at > k[i + 1][1]) i++;
	const [[t0, x0], [t1, x1]] = [k[i], k[i + 1] ?? k[i]];
	return t0 + (t1 - t0) * clamp((at - x0) / (x1 - x0 || 1));
}

export type NightFrame = {
	/** the frame's left edge, its size on the stage (px) and the canvas's pixel ratio */
	left: number;
	width: number;
	height: number;
	dpr: number;
	/** the night's colour (the band's dark, translucent), resolved from the stylesheet */
	color: string;
	/** stage px per unit of the coordinates the cut-outs are measured in */
	scale: number;
	/** what keeps its light: outlines as flat [x0, y0, x1, y1, …] lists, in the photograph's own units */
	cutouts: number[][];
};

/**
 * Paint the night at `ms` on the frame's canvas: the band's dark up to the front, fading over its soft edge,
 * with every cut-out left in its own light. Nothing before `from`; the front stops where it is at `end`.
 */
export function paintNight(ctx: CanvasRenderingContext2D, f: DuskFront, n: NightFrame, ms: number, from: number, end: number): void {
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	if (!f.knots.length || from > ms) return;
	ctx.setTransform(n.dpr, 0, 0, n.dpr, 0, 0);
	const fx = frontX(f, Math.min(ms, end)) - n.left;
	const g = ctx.createLinearGradient(fx - f.soft, 0, fx, 0);
	g.addColorStop(0, n.color);
	g.addColorStop(1, "rgba(0, 0, 0, 0)");
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, Math.max(0, fx), n.height);
	cutOut(ctx, n);
}

/** How far the even dusk has fallen at `ms`, 0 to 1: nothing before `from`, complete at `to`, slow at first. */
export function duskLevel(ms: number, from: number, to: number): number {
	const x = clamp((ms - from) / (to - from));
	return x * x * (3 - 2 * x) * (0.4 + 0.6 * x);
}

/** Paint the even dusk at `level` (0 to 1) on the frame's canvas, every cut-out left in its own light. */
export function paintNightEven(ctx: CanvasRenderingContext2D, n: NightFrame, level: number): void {
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	if (level <= 0) return;
	ctx.setTransform(n.dpr, 0, 0, n.dpr, 0, 0);
	ctx.globalAlpha = level;
	ctx.fillStyle = n.color;
	ctx.fillRect(0, 0, n.width, n.height);
	ctx.globalAlpha = 1;
	cutOut(ctx, n);
}

/** What keeps its light: erased from the night, softly. */
function cutOut(ctx: CanvasRenderingContext2D, n: NightFrame): void {
	ctx.globalCompositeOperation = "destination-out";
	ctx.filter = "blur(3px)";
	ctx.fillStyle = "#000";
	for (const p of n.cutouts) {
		ctx.beginPath();
		for (let i = 0; i < p.length; i += 2) {
			if (i) ctx.lineTo(p[i] * n.scale, p[i + 1] * n.scale);
			else ctx.moveTo(p[i] * n.scale, p[i + 1] * n.scale);
		}
		ctx.closePath();
		ctx.fill();
	}
	ctx.filter = "none";
	ctx.globalCompositeOperation = "source-over";
}
