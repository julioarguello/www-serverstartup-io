#!/usr/bin/env node
/**
 * content-patch.mjs — live text changes as dated content patches (#662).
 *
 * Once live, EmDash does not let seed/seed.json change a database: "Later edits
 * to the seed file are not re-applied … Existing data is never overwritten"
 * (vendor/emdash-skills/building-emdash-site/references/schema-and-seed.md).
 * A text change therefore reaches production as a patch file in seed/patches/,
 * applied through EmDash's own client (`emdash/client`, the one its CLI uses),
 * so every write is an ordinary revision the admin can revert.
 *
 * Each change names the value it expects (`before`) and the value it writes
 * (`after`). Patches touching the same value form a chain in date order —
 * A→B, then B→C — and the chain's last `after` is the value's target. The
 * content itself says what was applied, so no ledger is kept:
 *   current == target              → already applied, skipped
 *   current == an earlier state    → written to the target, with the entry's _rev
 *   anything else                  → edited outside the repository: refuse
 * Pre-flight reads every entry before any write; any conflict, or an entry with
 * an unpublished draft, means nothing is written.
 *
 * A change can also name a widget instead of an entry (#667): UI labels live in
 * the ui_labels_<locale> widget areas, which are not a collection. Its value is
 * always the widget's whole `content`, and a `before` of null means the widget
 * does not exist yet, so applying the change creates it.
 *
 * Usage:
 *   content-patch.mjs check [--seed <file>] [--patches <dir>]
 *       validate every patch and chain; seed.json must hold each value's target
 *   content-patch.mjs seed <patch.json>
 *       write one patch's `after` values into seed/seed.json (value spans only)
 *   content-patch.mjs apply --url <base> [--dry-run] [--dev-bypass]
 *       apply pending changes to a running site; token from EMDASH_TOKEN
 *
 * Exit: 0 done · 1 a conflict or an invalid patch · 3 blind or broken (no patch
 * read, site unreachable or refusing, a write that failed part-way).
 */
import { readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PATCH_DIR = join(ROOT, "seed", "patches");
const SEED = join(ROOT, "seed", "seed.json");
const NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.json$/;

const fail = (code, msg) => {
	console.error(msg);
	process.exit(code);
};
/** A change to a widget's content rather than to an entry's data. */
const isWidget = (c) => c !== null && typeof c === "object" && "widgetArea" in c;
/** The thing a change writes to: one entry, or one widget. */
const entryKey = (c) => (isWidget(c) ? `widget:${c.widgetArea}/${c.widget}` : `${c.collection}/${c.slug}/${c.locale}`);
const where = (c) =>
	isWidget(c) ? `widget ${c.widgetArea}/${c.widget} ${JSON.stringify(c.path)}` : `${c.collection}/${c.slug} [${c.locale}] ${JSON.stringify(c.path)}`;

/* ── patch files ──────────────────────────────────────────────────────── */

/** Every patch file, oldest first. The date in the name is the order. */
export function listPatches(dir = PATCH_DIR) {
	return readdirSync(dir)
		.filter((f) => f.endsWith(".json"))
		.sort()
		.map((file) => ({ file, patch: JSON.parse(readFileSync(join(dir, file), "utf8")) }));
}

const isSegment = (seg) =>
	typeof seg === "string" || Number.isInteger(seg) || (seg !== null && typeof seg === "object" && !Array.isArray(seg) && Object.keys(seg).length === 1);

/** True when `a` is a strict prefix of `b`. */
const isPrefix = (a, b) => a.length < b.length && a.every((seg, i) => isDeepStrictEqual(seg, b[i]));

/** Problems with one patch's shape, as messages; empty when valid. */
export function validatePatch(file, patch) {
	const out = [];
	if (!NAME.test(file)) out.push(`${file}: name must be YYYY-MM-DD-<slug>.json`);
	if (patch?.date !== file.slice(0, 10)) out.push(`${file}: "date" must equal the name's date`);
	if (!Number.isInteger(patch?.issue)) out.push(`${file}: "issue" must be the issue number`);
	if (typeof patch?.summary !== "string" || !patch.summary.trim()) out.push(`${file}: "summary" is required`);
	if (!Array.isArray(patch?.changes) || patch.changes.length === 0) {
		out.push(`${file}: "changes" must be a non-empty list`);
		return out;
	}
	const seen = [];
	for (const [i, c] of patch.changes.entries()) {
		const at = `${file} change ${i}`;
		if (isWidget(c)) {
			if (typeof c.widgetArea !== "string" || typeof c.widget !== "string") out.push(`${at}: "widgetArea" and "widget" must be names`);
			if ("collection" in c || "slug" in c || "locale" in c) out.push(`${at}: a change names a widget or an entry, not both`);
			if (!isDeepStrictEqual(c.path, ["content"])) out.push(`${at}: a widget change replaces the widget's whole content — "path" must be ["content"]`);
			if ("after" in c && !Array.isArray(c.after)) out.push(`${at}: a widget's "after" must be its list of blocks`);
			if ("before" in c && c.before !== null && !Array.isArray(c.before))
				out.push(`${at}: a widget's "before" must be its list of blocks, or null when the widget does not exist yet`);
		} else if (typeof c?.collection !== "string" || typeof c?.slug !== "string" || typeof c?.locale !== "string")
			out.push(`${at}: "collection", "slug" and "locale" are required — or "widgetArea" and "widget" for a widget`);
		if (!Array.isArray(c?.path) || c.path.length === 0) {
			out.push(`${at}: "path" must be a non-empty list`);
			continue;
		}
		const bad = c.path.filter((seg) => !isSegment(seg));
		if (bad.length) out.push(`${at}: path segment ${JSON.stringify(bad[0])} is not a key, an index or a one-key selector`);
		if (!("before" in c) || !("after" in c)) out.push(`${at}: "before" and "after" are required`);
		else if (isDeepStrictEqual(c.before, c.after)) out.push(`${at}: "before" and "after" are equal`);
		const entry = entryKey(c);
		for (const s of seen)
			if (s.entry === entry && (isDeepStrictEqual(s.path, c.path) || isPrefix(s.path, c.path) || isPrefix(c.path, s.path)))
				out.push(`${at}: its path overlaps change ${s.i} on the same entry — one change per value`);
		seen.push({ entry, path: c.path, i });
	}
	return out;
}

/**
 * Every change across the patches, grouped per value in date order, as chains
 * of states [before₁, after₁, after₂, …]. A link that does not continue the
 * chain (patch 2's before ≠ patch 1's after) is a problem.
 */
export function chains(patches) {
	const byValue = new Map();
	const problems = [];
	const keys = [];
	for (const { file, patch } of patches)
		for (const c of patch.changes) {
			const entry = entryKey(c);
			const k = `${entry}::${JSON.stringify(c.path)}`;
			for (const other of keys)
				if (other.entry === entry && (isPrefix(other.path, c.path) || isPrefix(c.path, other.path)))
					problems.push(`${file}: ${where(c)} overlaps ${JSON.stringify(other.path)} changed by ${other.file} — patch one value, never a value and its parent`);
			keys.push({ entry, path: c.path, file });
			if (!byValue.has(k)) byValue.set(k, { c, states: [c.before], files: [] });
			const ch = byValue.get(k);
			const last = ch.states[ch.states.length - 1];
			if (ch.files.length && !isDeepStrictEqual(last, c.before))
				problems.push(`${file}: ${where(c)} expects ${JSON.stringify(c.before).slice(0, 80)}, but ${ch.files.at(-1)} left ${JSON.stringify(last).slice(0, 80)}`);
			ch.states.push(c.after);
			ch.files.push(file);
		}
	return { chains: [...byValue.values()], problems };
}

/* ── paths ────────────────────────────────────────────────────────────── */

/** One step down: a key, an index, or {field: value} picking a list item. */
function step(node, seg) {
	if (typeof seg === "string") return node && typeof node === "object" && !Array.isArray(node) && seg in node ? node[seg] : undefined;
	if (Number.isInteger(seg)) return Array.isArray(node) ? node[seg] : undefined;
	if (!Array.isArray(node)) return undefined;
	const [[k, v]] = Object.entries(seg);
	const hits = node.filter((it) => it && typeof it === "object" && isDeepStrictEqual(it[k], v));
	return hits.length === 1 ? hits[0] : undefined;
}

export function getAt(root, path) {
	return path.reduce((node, seg) => (node === undefined ? undefined : step(node, seg)), root);
}

/** A copy of `root` with the value at `path` replaced; the path must exist. */
export function setAt(root, path, value) {
	if (path.length === 0) return value;
	const [seg, ...rest] = path;
	const child = step(root, seg);
	if (child === undefined) throw new Error(`path segment ${JSON.stringify(seg)} not found`);
	if (Array.isArray(root)) {
		const i = Number.isInteger(seg) ? seg : root.indexOf(child);
		return root.map((it, j) => (j === i ? setAt(it, rest, value) : it));
	}
	return { ...root, [seg]: setAt(child, rest, value) };
}

/* ── the seed: values located by span, so hand formatting survives ─────── */

const SCALAR = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null/y;

/** Parse JSON keeping each value's [start, end) offsets in the source text. */
export function parseWithSpans(src) {
	let i = 0;
	const ws = () => {
		while (i < src.length && /\s/.test(src[i])) i++;
	};
	const value = () => {
		ws();
		const start = i;
		const ch = src[i];
		if (ch === "{") {
			i++;
			const entries = [];
			ws();
			if (src[i] === "}") i++;
			else
				for (;;) {
					const k = value().value;
					ws();
					if (src[i++] !== ":") throw new Error(`expected ':' at ${i - 1}`);
					entries.push([k, value()]);
					ws();
					const sep = src[i++];
					if (sep === "}") break;
					if (sep !== ",") throw new Error(`expected ',' or '}' at ${i - 1}`);
				}
			return { kind: "object", entries, start, end: i };
		}
		if (ch === "[") {
			i++;
			const items = [];
			ws();
			if (src[i] === "]") i++;
			else
				for (;;) {
					items.push(value());
					ws();
					const sep = src[i++];
					if (sep === "]") break;
					if (sep !== ",") throw new Error(`expected ',' or ']' at ${i - 1}`);
				}
			return { kind: "array", items, start, end: i };
		}
		SCALAR.lastIndex = i;
		const m = SCALAR.exec(src);
		if (!m) throw new Error(`unexpected input at ${i}`);
		i = SCALAR.lastIndex;
		return { kind: "scalar", value: JSON.parse(m[0]), start, end: i };
	};
	return value();
}

/** Plain value of a span node. */
function plain(node) {
	if (node.kind === "absent") return null;
	if (node.kind === "scalar") return node.value;
	if (node.kind === "array") return node.items.map(plain);
	return Object.fromEntries(node.entries.map(([k, v]) => [k, plain(v)]));
}

function spanStep(node, seg) {
	if (typeof seg === "string") return node.kind === "object" ? node.entries.find(([k]) => k === seg)?.[1] : undefined;
	if (Number.isInteger(seg)) return node.kind === "array" ? node.items[seg] : undefined;
	if (node.kind !== "array") return undefined;
	const [[k, v]] = Object.entries(seg);
	const hits = node.items.filter((it) => it.kind === "object" && isDeepStrictEqual(plain(it)[k], v));
	return hits.length === 1 ? hits[0] : undefined;
}

/**
 * A widget's content in seed.json: widgetAreas[name].widgets[title].content.
 * A widget the area does not hold yet comes back as { kind: "absent", list },
 * whose plain value is null and which `seedApply` fills by appending to `list`.
 */
function seedWidgetSpan(root, c) {
	const areas = spanStep(root, "widgetAreas");
	if (!areas || areas.kind !== "array") return undefined;
	const area = areas.items.filter((it) => it.kind === "object" && plain(it).name === c.widgetArea);
	if (area.length !== 1) return undefined;
	const list = spanStep(area[0], "widgets");
	if (!list || list.kind !== "array") return undefined;
	const hits = list.items.filter((it) => it.kind === "object" && plain(it).title === c.widget);
	if (hits.length > 1) return undefined;
	if (hits.length === 0) return { kind: "absent", list, start: list.end, end: list.end };
	return spanStep(hits[0], "content");
}

/** The span of a change's value in seed.json: content.<collection>[slug+locale].data.<path>. */
export function seedSpan(root, c) {
	if (isWidget(c)) return seedWidgetSpan(root, c);
	const list = spanStep(root, "content") && spanStep(spanStep(root, "content"), c.collection);
	if (!list || list.kind !== "array") return undefined;
	const hits = list.items.filter((it) => {
		const p = it.kind === "object" ? plain(it) : {};
		return p.slug === c.slug && p.locale === c.locale;
	});
	if (hits.length !== 1) return undefined;
	return ["data", ...c.path].reduce((node, seg) => (node === undefined ? undefined : spanStep(node, seg)), hits[0]);
}

/** Write a patch's `after` values into the seed text, touching only those values. */
export function seedApply(src, patch) {
	const root = parseWithSpans(src);
	const spans = patch.changes
		.map((c) => ({ c, node: seedSpan(root, c) }))
		// later spans first, so earlier offsets stay valid
		.sort((a, b) => (b.node?.start ?? 0) - (a.node?.start ?? 0));
	let out = src;
	for (const { c, node } of spans) {
		if (!node) throw new Error(`${where(c)}: not in seed.json`);
		const cur = plain(node);
		if (isDeepStrictEqual(cur, c.after)) continue;
		if (!isDeepStrictEqual(cur, c.before)) throw new Error(`${where(c)}: seed holds neither "before" nor "after"`);
		if (node.kind === "absent") out = appendWidget(out, node.list, { type: "content", title: c.widget, content: c.after });
		else out = out.slice(0, node.start) + JSON.stringify(c.after) + out.slice(node.end);
	}
	return out;
}

/** Append a widget to an area's widget list, indented like the widget before it. */
function appendWidget(src, list, widget) {
	const last = list.items.at(-1);
	const at = last ? last.end : list.start + 1;
	const lineStart = src.lastIndexOf("\n", (last ?? list).start) + 1;
	const indent = (src.slice(lineStart).match(/^[\t ]*/)?.[0] ?? "") + (last ? "" : "\t");
	const text = JSON.stringify(widget, null, "\t").replaceAll("\n", `\n${indent}`);
	return `${src.slice(0, at)}${last ? "," : ""}\n${indent}${text}${src.slice(at)}`;
}

/** A copy of the plain seed document with one change's value set (widgets appended when absent). */
function docSet(doc, c, value) {
	if (!isWidget(c)) return setAt(doc, ["content", c.collection, entryIndex(doc, c), "data", ...c.path], value);
	const out = structuredClone(doc);
	const area = out.widgetAreas.find((a) => a.name === c.widgetArea);
	const widget = area.widgets.find((w) => w.title === c.widget);
	if (widget) widget.content = value;
	else area.widgets.push({ type: "content", title: c.widget, content: value });
	return out;
}

/* ── commands ─────────────────────────────────────────────────────────── */

const opt = (args, name, dflt) => (args.includes(name) ? resolve(args[args.indexOf(name) + 1]) : dflt);

function check(args) {
	const patches = listPatches(opt(args, "--patches", PATCH_DIR));
	if (patches.length === 0) fail(3, "content-patch: no patch found — nothing was checked");
	const seedFile = opt(args, "--seed", SEED);
	const seedRoot = parseWithSpans(readFileSync(seedFile, "utf8"));
	const problems = patches.flatMap(({ file, patch }) => validatePatch(file, patch));
	if (problems.length) fail(1, `content-patch: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
	const { chains: all, problems: links } = chains(patches);
	problems.push(...links);
	for (const { c, states, files } of all) {
		const node = seedSpan(seedRoot, c);
		const target = states[states.length - 1];
		if (!node) problems.push(`${files.at(-1)}: ${where(c)} is not in ${seedFile}`);
		else if (!isDeepStrictEqual(plain(node), target))
			problems.push(`${files.at(-1)}: the seed does not hold the target of ${where(c)} — run: node scripts/content-patch.mjs seed seed/patches/${files.at(-1)}`);
	}
	if (problems.length) fail(1, `content-patch: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
	const n = patches.reduce((s, p) => s + p.patch.changes.length, 0);
	console.log(`content-patch: ${patches.length} patch(es), ${n} change(s) over ${all.length} value(s) valid, and the seed holds every target`);
}

function entryIndex(doc, c) {
	const list = doc.content?.[c.collection] ?? [];
	const hits = list.map((e, i) => [e, i]).filter(([e]) => e.slug === c.slug && e.locale === c.locale);
	if (hits.length !== 1) throw new Error(`${c.collection}/${c.slug} [${c.locale}]: ${hits.length} entries in seed.json`);
	return hits[0][1];
}

function seed(file) {
	if (!file) fail(1, "usage: content-patch.mjs seed seed/patches/<file>.json");
	const name = file.split("/").pop();
	const patch = JSON.parse(readFileSync(resolve(file), "utf8"));
	const problems = validatePatch(name, patch);
	if (problems.length) fail(1, problems.join("\n"));
	const src = readFileSync(SEED, "utf8");
	let out;
	try {
		out = seedApply(src, patch);
	} catch (e) {
		fail(1, `content-patch: ${e.message}`);
	}
	// nothing but the patched values may differ
	const doc = JSON.parse(src);
	const expected = patch.changes.reduce((d, c) => docSet(d, c, c.after), doc);
	let written;
	try {
		written = JSON.parse(out);
	} catch {
		fail(3, "content-patch: the spliced seed is not valid JSON — refusing to write");
	}
	if (!isDeepStrictEqual(written, expected)) fail(3, "content-patch: the spliced seed differs from the expected document — refusing to write");
	writeFileSync(SEED, out);
	console.log(`content-patch: ${patch.changes.length} value(s) written into seed/seed.json`);
}

async function apply(args) {
	const urlAt = args.indexOf("--url");
	const baseUrl = urlAt > -1 ? args[urlAt + 1] : undefined;
	const dryRun = args.includes("--dry-run");
	const devBypass = args.includes("--dev-bypass");
	if (!baseUrl) fail(1, "usage: content-patch.mjs apply --url <base> [--dry-run] [--dev-bypass]");
	const token = process.env.EMDASH_TOKEN;
	if (!token && !devBypass) fail(3, "content-patch: EMDASH_TOKEN is not set — a scoped API token (content:read, content:write) is required");

	const patches = listPatches();
	if (patches.length === 0) fail(3, "content-patch: no patch in seed/patches/ — nothing was checked");
	const shape = patches.flatMap(({ file, patch }) => validatePatch(file, patch));
	if (shape.length) fail(1, shape.join("\n"));
	const { chains: all, problems: links } = chains(patches);
	if (links.length) fail(1, links.join("\n"));

	const { EmDashClient } = await import("emdash/client");
	const client = new EmDashClient({ baseUrl, ...(token ? { token } : {}), ...(devBypass ? { devBypass: true } : {}) });

	// Pre-flight: read every entry once, decide every value, write nothing yet.
	const entries = new Map(); // "collection/slug/locale" → { c0, item, data, fields:Set, files:Set }
	const areas = new Map(); // widget area name → its widgets, as the API returns them
	const widgetWrites = []; // { c, widget (or undefined: create), target, files }
	let skipped = 0;
	const conflicts = [];
	for (const { c, states, files } of all) {
		if (isWidget(c)) {
			if (!areas.has(c.widgetArea)) {
				let area;
				try {
					area = await client.request("GET", `/widget-areas/${encodeURIComponent(c.widgetArea)}`);
				} catch (e) {
					fail(3, `content-patch: cannot read widget area ${c.widgetArea} from ${baseUrl} — ${e.message}`);
				}
				areas.set(c.widgetArea, area.widgets ?? []);
			}
			const hits = areas.get(c.widgetArea).filter((w) => w.title === c.widget);
			if (hits.length > 1) {
				conflicts.push(`${where(c)}: ${hits.length} widgets carry that title`);
				continue;
			}
			const widget = hits[0];
			const cur = widget ? (widget.content ?? null) : null;
			const target = states[states.length - 1];
			if (isDeepStrictEqual(cur, target)) {
				skipped++;
				continue;
			}
			const at = states.findIndex((s) => isDeepStrictEqual(s, cur));
			if (at === -1) {
				conflicts.push(`${where(c)} holds ${JSON.stringify(cur)?.slice(0, 120)}, no state of its patches (${files.join(", ")})`);
				continue;
			}
			widgetWrites.push({ c, widget, target, files: files.slice(at) });
			continue;
		}
		const k = entryKey(c);
		if (!entries.has(k)) {
			let item;
			try {
				item = await client.get(c.collection, c.slug, { raw: true, locale: c.locale });
			} catch (e) {
				fail(3, `content-patch: cannot read ${k} from ${baseUrl} — ${e.message}`);
			}
			if (item.locale && item.locale !== c.locale) fail(3, `content-patch: ${k} resolved to locale ${item.locale}`);
			// a pending draft overlays the data we read, and publishing would ship it
			if (item.draftRevisionId) conflicts.push(`${k} has an unpublished draft — publish or discard it in the admin first`);
			entries.set(k, { c0: c, item, data: item.data, fields: new Set(), files: new Set() });
		}
		const e = entries.get(k);
		const cur = getAt(e.data, c.path);
		const target = states[states.length - 1];
		if (isDeepStrictEqual(cur, target)) {
			skipped++;
			continue;
		}
		const at = states.findIndex((s) => isDeepStrictEqual(s, cur));
		if (at === -1) {
			conflicts.push(`${where(c)} holds ${JSON.stringify(cur)?.slice(0, 120)}, no state of its patches (${files.join(", ")})`);
			continue;
		}
		e.data = setAt(e.data, c.path, target);
		e.fields.add(c.path[0]);
		files.slice(at).forEach((f) => e.files.add(f));
	}
	if (conflicts.length) fail(1, `content-patch: refusing to write anything — ${conflicts.length} conflict(s)\n  ${conflicts.join("\n  ")}`);

	const pending = [...entries.values()].filter((e) => e.fields.size > 0);
	const fieldCount = pending.reduce((s, e) => s + e.fields.size, 0);
	const widgetLabel = (w) => `widget ${w.c.widgetArea}/${w.c.widget}`;
	console.log(
		`content-patch: ${baseUrl} — ${skipped} value(s) already at target, ${pending.length} entr(ies) to write (${fieldCount} field(s)), ` +
			`${widgetWrites.length} widget(s) to write${dryRun ? " [dry run]" : ""}`,
	);
	if (dryRun) {
		for (const e of pending) console.log(`  would write ${e.c0.collection}/${e.c0.slug} [${e.c0.locale}]: ${[...e.fields].join(", ")} (${[...e.files].join(", ")})`);
		for (const w of widgetWrites) console.log(`  would ${w.widget ? "update" : "create"} ${widgetLabel(w)} (${w.files.join(", ")})`);
		return;
	}
	const written = [];
	const notWritten = (from) =>
		[...pending.slice(from).map((p) => `${p.c0.collection}/${p.c0.slug} [${p.c0.locale}]`), ...widgetWrites.slice(Math.max(0, from - pending.length)).map(widgetLabel)].join(", ") ||
		"none";
	for (const e of pending) {
		const { collection, slug, locale } = e.c0;
		const label = `${collection}/${slug} [${locale}]`;
		try {
			const data = Object.fromEntries([...e.fields].map((f) => [f, e.data[f]]));
			const updated = await client.update(collection, e.item.id, { data, _rev: e.item._rev, locale });
			// the CLI's own rule: publish when the update staged a draft revision
			if (updated.draftRevisionId) await client.publish(collection, updated.id);
			const back = await client.get(collection, e.item.id, { raw: true, locale });
			if (back.draftRevisionId) throw new Error("still has an unpublished draft after publishing");
			for (const f of e.fields) if (!isDeepStrictEqual(back.data[f], e.data[f])) throw new Error(`${f} did not read back as written`);
			const untouched = Object.keys(e.item.data).filter((f) => !e.fields.has(f));
			for (const f of untouched) if (!isDeepStrictEqual(back.data[f], e.item.data[f])) throw new Error(`field ${f} changed although no patch touched it`);
			written.push(label);
			console.log(`  wrote ${label}: ${[...e.fields].join(", ")} — ${untouched.length} other field(s) unchanged`);
		} catch (err) {
			fail(
				3,
				`content-patch: writing ${label} failed — ${err.message}\n` +
					`  already written and published: ${written.length ? written.join(", ") : "none"}\n` +
					`  not written: ${notWritten(written.length + 1)}\n` +
					"  A re-run skips what was written and retries the rest.",
			);
		}
	}
	// Widgets carry no revision and no _rev: the pre-flight read is the only
	// guard, so the window between it and the write is the one this cannot close.
	for (const w of widgetWrites) {
		const label = widgetLabel(w);
		const areaPath = `/widget-areas/${encodeURIComponent(w.c.widgetArea)}`;
		try {
			if (w.widget) await client.request("PUT", `${areaPath}/widgets/${encodeURIComponent(w.widget.id)}`, { content: w.target });
			else await client.request("POST", `${areaPath}/widgets`, { type: "content", title: w.c.widget, content: w.target });
			const back = ((await client.request("GET", areaPath)).widgets ?? []).filter((x) => x.title === w.c.widget);
			if (back.length !== 1) throw new Error(`${back.length} widgets carry that title after the write`);
			if (!isDeepStrictEqual(back[0].content, w.target)) throw new Error("its content did not read back as written");
			if (w.widget && back[0].type !== w.widget.type) throw new Error("its type changed although no patch touched it");
			written.push(label);
			console.log(`  ${w.widget ? "updated" : "created"} ${label}`);
		} catch (err) {
			fail(
				3,
				`content-patch: writing ${label} failed — ${err.message}\n` +
					`  already written and published: ${written.length ? written.join(", ") : "none"}\n` +
					`  not written: ${notWritten(written.length + 1)}\n` +
					"  A re-run skips what was written and retries the rest.",
			);
		}
	}
}

const isMain = (() => {
	try {
		return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
	} catch {
		return false;
	}
})();
if (isMain) {
	const [cmd, ...rest] = process.argv.slice(2);
	if (cmd === "check") check(rest);
	else if (cmd === "seed") seed(rest[0]);
	else if (cmd === "apply") await apply(rest);
	else fail(1, "usage: content-patch.mjs check | seed <patch.json> | apply --url <base> [--dry-run] [--dev-bypass]");
}
