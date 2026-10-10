// Dumps the rendered card lines, the index, the «Cómo trabajamos» items and the mantra, for a
// verbatim comparison with pkg/brief.md. Usage: node copy.cjs [url]   (or U=<url>)
const p = require('puppeteer');
const { target, open, pinFrame } = require('./frame.cjs');
const U = target();
(async () => {
	const b = await p.launch({ headless: 'new' });
	const g = await b.newPage();
	await g.setViewport({ width: 1440, height: 900 });
	if (!/entregas/.test(U)) await open(g, U);
	await pinFrame(g, U, 0, 3000);
	const clean = (s) => s.replace(/\s+/g, ' ').trim();
	const o = await g.evaluate(() => {
		const clean = (s) => s.replace(/\s+/g, ' ').trim();
		const md = (el) => {
			// back to the brief's markdown-lite: `code` and *italics*
			const c = el.cloneNode(true);
			c.querySelectorAll('code').forEach((x) => x.replaceWith('`' + x.textContent + '`'));
			c.querySelectorAll('em').forEach((x) => x.replaceWith('*' + x.textContent + '*'));
			c.querySelectorAll('[aria-hidden="true"]').forEach((x) => x.remove());
			return clean(c.textContent);
		};
		return {
			title: md(document.querySelector('.s-hero h1')),
			index: [...document.querySelectorAll('.s-hero__verticals a, .ns-index a')].map((a) => md(a.querySelector('[class*="long"], .ns-l') ?? a)),
			items: [...document.querySelectorAll('.s-hero__item')].map((i) => md(i.querySelector('.s-hero__name')) + ' | ' + md(i.querySelector('.s-hero__pitch-item, .s-hero__fact'))),
			rail: [...document.querySelectorAll('.s-hero__stop-name')].map(md),
			sections: [...document.querySelectorAll('main > *, body > section, body > div.container')].map((s) => s.className || s.tagName).filter(Boolean),
			how: [...document.querySelectorAll('.s-how li, .ns-how li')].map((li) => [...li.children].map(md).join(' ')),
			mantra: clean(document.querySelector('.mantra')?.innerText ?? ''),
		};
	});
	console.log(JSON.stringify(o, null, 1));
	await b.close();
})();
