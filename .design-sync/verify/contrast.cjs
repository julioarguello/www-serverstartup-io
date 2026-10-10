// The WCAG ratio of every text in the band on its real pixels, frame by frame, at 1440 x 900 and
// 393 x 852: it hides the text, screenshots each text box, and takes the 95th-percentile brightest
// backing luminance. Usage: node contrast.cjs [url]   (or U=<url>)
const p = require('puppeteer');
const { target, open, pinFrame } = require('./frame.cjs');
const U = target();
const lum = (r, g, b) => { const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const cr = (a, b) => { const [x, y] = [a, b].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
(async () => {
	const b = await p.launch({ headless: 'new', args: ['--enable-gpu', '--use-angle=metal'] });
	const g = await b.newPage();
	let low = 0;
	for (const [dv, vp] of [['desk', { width: 1440, height: 900 }], ['phone', { width: 393, height: 852, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }]]) {
		await g.setViewport(vp);
		for (let f = 0; f < 7; f++) {
			if (!/entregas/.test(U)) await open(g, U);
			await pinFrame(g, U, f, f ? 3000 : 5200);
			const targets = await g.evaluate(() => {
				const out = [];
				const add = (name, el) => {
					if (!el) return;
					const cs = getComputedStyle(el);
					if (cs.visibility === 'hidden' || +cs.opacity === 0 || cs.display === 'none') return;
					const r = document.createRange();
					r.selectNodeContents(el);
					for (const x of r.getClientRects()) {
						if (x.width < 4) continue;
						out.push({ name, col: cs.color, x: Math.max(0, x.left), y: Math.max(0, x.top), w: Math.min(x.width, innerWidth - x.left), h: x.height });
					}
				};
				const h = document.querySelector('.s-hero');
				// the head: the h1's own text, without the tail
				const h1 = h.querySelector('h1');
				add('tail', h.querySelector('.ss-title__tail'));
				for (const n of [...h1.childNodes]) if (n.nodeType === 3 && n.textContent.trim()) { const r = document.createRange(); r.selectNodeContents(n); const cs = getComputedStyle(h1); for (const x of r.getClientRects()) if (x.width >= 4) out.push({ name: 'head', col: cs.color, x: x.left, y: x.top, w: x.width, h: x.height }); }
				h.querySelectorAll('.s-hero__kicker p').forEach((e) => add('lead', e));
				h.querySelectorAll('.s-hero__item').forEach((it) => { if (+getComputedStyle(it).opacity > 0.5) { add('card-name', it.querySelector('.s-hero__name')); add('card-text', it.querySelector('.s-hero__pitch-item, .s-hero__fact')); } });
				const idx = h.querySelector('.s-hero__verticals, .ns-index');
				if (idx && +getComputedStyle(idx).opacity > 0.5) idx.querySelectorAll('.s-hero__vname, .ns-l, .ns-s').forEach((e) => add('card-index', e));
				h.querySelectorAll('.s-hero__stop-name').forEach((e) => add('rail', e));
				return out;
			});
			await g.addStyleTag({ content: '.s-hero *{color:transparent!important;-webkit-text-fill-color:transparent!important;text-decoration-color:transparent!important;text-shadow:none!important}' });
			await new Promise((r) => setTimeout(r, 300));
			const res = {};
			for (const t of targets) {
				const buf = await g.screenshot({ clip: { x: t.x, y: t.y, width: Math.max(1, t.w), height: Math.max(1, t.h) }, encoding: 'binary', type: 'png' });
				const px = await g.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return Array.from(x.getImageData(0, 0, c.width, c.height).data); }, Buffer.from(buf).toString('base64'));
				const m = t.col.match(/\d+(\.\d+)?/g).map(Number);
				const lt = lum(m[0], m[1], m[2]);
				const ls = [];
				for (let i = 0; i < px.length; i += 4) ls.push(lum(px[i], px[i + 1], px[i + 2]));
				ls.sort((a, b) => a - b);
				const worst = ls[Math.floor(ls.length * 0.95)]; // brightest 5 % of the background behind the text
				const c = cr(lt, worst);
				if (!(t.name in res) || c < res[t.name]) res[t.name] = c;
			}
			if (Object.values(res).some((v) => v < 4.5)) low++;
			console.log(dv, 'frame', f, Object.entries(res).map(([k, v]) => k + ' ' + v.toFixed(2) + (v < 4.5 ? ' (<4.5)' : '')).join(' | '));
			if (/entregas/.test(U)) continue;
		}
	}
	await b.close();
	process.exit(low ? 1 : 0);
})();
