#!/usr/bin/env node
/**
 * content-patch.mjs — production text changes as dated content patches (#662).
 *
 * Once live, EmDash does not let seed/seed.json change a database: "Later edits
 * to the seed file are not re-applied … Existing data is never overwritten"
 * (vendor/emdash-skills/building-emdash-site/references/schema-and-seed.md).
 * A text change therefore reaches production as a patch file in seed/patches/,
 * applied through EmDash's own client (`emdash/client`, the one its CLI uses),
 * so every write is an ordinary revision the admin can revert.
 *
 * A patch names, per change, the value it expects (`before`) and the value it
 * writes (`after`). The content itself says what was applied, so no ledger:
 *   current == after   → already applied, skipped
 *   current == before  → written, with the entry's _rev (optimistic concurrency)
 *   anything else      → edited outside the repository: refuse, write nothing
 *
 * Usage:
 *   node scripts/content-patch.mjs check
 *       validate every patch, and that seed.json already holds each `after`
 *   node scripts/content-patch.mjs seed <patch.json>
 *       write a patch's `after` values into seed/seed.json (value spans only)
 *   node scripts/content-patch.mjs apply --url <base> [--dry-run] [--dev-bypass]
 *       apply pending patches to a running site; token from EMDASH_TOKEN
 *
 * Exit: 0 done · 1 a conflict or an invalid patch · 3 blind (no patches read,
 * site unreachable, auth refused, entry missing).
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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

/* ── patch files ──────────────────────────────────────────────────────── */

/** Every patch file, oldest first. The date in the name is the order. */
export function listPatches(dir = PATCH_DIR) {
	return readdirSync(dir)
		.filter((f) => f.endsWith(".json"))
		.sort()
		.map((file) => ({ file, patch: JSON.parse(readFileSync(join(dir, file), "utf8")) }));
}

/** Problems with one patch's shape, as messages; empty when valid. */
export function validatePatch(file, patch) {
	const out = [];
	if (!NAME.test(file)) out.push(`${file}: name must be YYYY-MM-DD-<slug>.json`);
	if (patch.date !== file.slice(0, 10)) out.push(`${file}: "date" must equal the name's date`);
	if (!Number.isInteger(patch.issue)) out.push(`${file}: "issue" must be the issue number`);
	if (typeof patch.summary !== "string" || !patch.summary.trim()) out.push(`${file}: "summary" is required`);
	if (!Array.isArray(patch.changes) || patch.changes.length === 0) out.push(`${file}: "changes" must be a non-empty list`);
	for (const [i, c] of (patch.changes ?? []).entries()) {
		const at = `${file} change ${i}`;
		if (typeof c.collection !== "string" || typeof c.slug !== "string" || typeof c.locale !== "string")
			out.push(`${at}: "collection", "slug" and "locale" are required`);
		if (!Array.isArray(c.path) || c.path.length === 0) out.push(`${at}: "path" must be a non-empty list`);
		for (const seg of c.path ?? [])
			if (!(typeof seg === "string" || Number.isInteger(seg) || (seg && typeof seg === "object" && Object.keys(seg).length === 1)))
				out.push(`${at}: path segment ${JSON.stringify(seg)} is not a key, an index or a one-key selector`);
		if (!("before" in c) || !("after" in c)) out.push(`${at}: "before" and "after" are required`);
		else if (isDeepStrictEqual(c.before, c.after)) out.push(`${at}: "before" and "after" are equal`);
	}
	return out;
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

/** Parse JSON keeping each value's [start, end) offsets in the source text. */
export function parseWithSpans(src) {
	let i = 0;
	const ws = () => {
		while (/\s/.test(src[i])) i++;
	};
	const value = () => {
		ws();
		const start = i;
		const ch = src[i];
		let v;
		if (ch === "{") {
			i++;
			const entries = [];
			ws();
			if (src[i] === "}") i++;
			else
				for (;;) {
					ws();
					const k = value().value;
					ws();
					i++; // :
					entries.push([k, value()]);
					ws();
					if (src[i++] === "}") break;
				}
			v = { kind: "object", entries };
		} else if (ch === "[") {
			i++;
			const items = [];
			ws();
			if (src[i] === "]") i++;
			else
				for (;;) {
					items.push(value());
					ws();
					if (src[i++] === "]") break;
				}
			v = { kind: "array", items };
		} else {
			const m = /^("(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)/.exec(src.slice(i, i + 100000));
			if (!m) throw new Error(`unexpected input at ${i}`);
			i += m[0].length;
			v = { kind: "scalar", value: JSON.parse(m[0]) };
		}
		return { ...v, start, end: i, value: v.kind === "scalar" ? v.value : undefined };
	};
	const root = value();
	return root;
}

/** Plain value of a span node. */
function plain(node) {
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

/** Where a change lives in seed.json: content.<collection>[slug+locale].data.<path>. */
function seedPath(c) {
	return ["content", c.collection, { slug: c.slug, locale: c.locale }, "data", ...c.path];
}

function seedEntryStep(node, seg) {
	// the entry selector matches two keys at once (slug AND locale)
	if (seg && typeof seg === "object" && "slug" in seg && "locale" in seg && node.kind === "array") {
		const hits = node.items.filter((it) => {
			const p = it.kind === "object" ? plain(it) : {};
			return p.slug === seg.slug && p.locale === seg.locale;
		});
		return hits.length === 1 ? hits[0] : undefined;
	}
	return spanStep(node, seg);
}

export function seedSpan(root, c) {
	return seedPath(c).reduce((node, seg) => (node === undefined ? undefined : seedEntryStep(node, seg)), root);
}

/** Write every change's `after` into the seed text, touching only those values. */
export function seedApply(src, patch) {
	let out = src;
	// later spans first, so earlier offsets stay valid
	const spans = patch.changes
		.map((c) => ({ c, node: seedSpan(parseWithSpans(src), c) }))
		.sort((a, b) => (b.node?.start ?? 0) - (a.node?.start ?? 0));
	for (const { c, node } of spans) {
		if (!node) throw new Error(`${c.collection}/${c.slug} [${c.locale}] ${JSON.stringify(c.path)}: not in seed.json`);
		const cur = plain(node);
		if (isDeepStrictEqual(cur, c.after)) continue;
		if (!isDeepStrictEqual(cur, c.before))
			throw new Error(`${c.collection}/${c.slug} [${c.locale}] ${JSON.stringify(c.path)}: seed holds neither "before" nor "after"`);
		out = out.slice(0, node.start) + JSON.stringify(c.after) + out.slice(node.end);
	}
	return out;
}

/* ── commands ─────────────────────────────────────────────────────────── */

function check() {
	const patches = listPatches();
	if (patches.length === 0) fail(3, "content-patch: no patch in seed/patches/ — nothing was checked");
	const seedSrc = readFileSync(SEED, "utf8");
	const seedRoot = parseWithSpans(seedSrc);
	const problems = [];
	for (const { file, patch } of patches) {
		problems.push(...validatePatch(file, patch));
		for (const c of patch.changes ?? []) {
			const node = seedSpan(seedRoot, c);
			if (!node) problems.push(`${file}: ${c.collection}/${c.slug} [${c.locale}] ${JSON.stringify(c.path)} is not in seed.json`);
			else if (!isDeepStrictEqual(plain(node), c.after))
				problems.push(`${file}: seed.json does not hold the "after" of ${c.collection}/${c.slug} [${c.locale}] ${JSON.stringify(c.path)} — run: node scripts/content-patch.mjs seed seed/patches/${file}`);
		}
	}
	if (problems.length) fail(1, `content-patch: ${problems.length} problem(s)\n  ${problems.join("\n  ")}`);
	const n = patches.reduce((s, p) => s + p.patch.changes.length, 0);
	console.log(`content-patch: ${patches.length} patch(es), ${n} change(s) valid, and seed.json holds every "after"`);
}

function seed(file) {
	if (!file) fail(1, "usage: content-patch.mjs seed seed/patches/<file>.json");
	const name = file.split("/").pop();
	const patch = JSON.parse(readFileSync(resolve(file), "utf8"));
	const problems = validatePatch(name, patch);
	if (problems.length) fail(1, problems.join("\n"));
	const src = readFileSync(SEED, "utf8");
	const out = seedApply(src, patch);
	// nothing but the patched values may differ
	const expected = patch.changes.reduce((doc, c) => setAt(doc, ["content", c.collection, entryIndex(doc, c), "data", ...c.path], c.after), JSON.parse(src));
	if (!isDeepStrictEqual(JSON.parse(out), expected)) fail(3, "content-patch: the spliced seed differs from the expected document — refusing to write");
	writeFileSync(SEED, out);
	console.log(`content-patch: ${patch.changes.length} value(s) written into seed/seed.json`);
}

function entryIndex(doc, c) {
	const list = doc.content?.[c.collection] ?? [];
	const hits = list.map((e, i) => [e, i]).filter(([e]) => e.slug === c.slug && e.locale === c.locale);
	if (hits.length !== 1) throw new Error(`${c.collection}/${c.slug} [${c.locale}]: ${hits.length} entries in seed.json`);
	return hits[0][1];
}

async function apply(args) {
	const urlAt = args.indexOf("--url");
	const baseUrl = urlAt > -1 ? args[urlAt + 1] : undefined;
	const dryRun = args.includes("--dry-run");
	const devBypass = args.includes("--dev-bypass");
	if (!baseUrl) fail(1, "usage: content-patch.mjs apply --url <base> [--dry-run] [--dev-bypass]");
	const token = process.env.EMDASH_TOKEN;
	if (!token && !devBypass) fail(3, "content-patch: EMDASH_TOKEN is not set — a scoped API token (content:read, content:write) is required");

	const { EmDashClient } = await import("emdash/client");
	const client = new EmDashClient({ baseUrl, ...(token ? { token } : {}), ...(devBypass ? { devBypass: true } : {}) });
	const patches = listPatches();
	if (patches.length === 0) fail(3, "content-patch: no patch in seed/patches/ — nothing was checked");
	for (const { file, patch } of patches) {
		const problems = validatePatch(file, patch);
		if (problems.length) fail(1, problems.join("\n"));
	}

	// Pre-flight every change before writing any: a conflict anywhere writes nothing.
	const plan = new Map(); // "collection/slug/locale" → { c0, item, data, fields:Set, files:Set }
	let skipped = 0;
	const conflicts = [];
	for (const { file, patch } of patches) {
		for (const c of patch.changes) {
			const k = `${c.collection}/${c.slug}/${c.locale}`;
			if (!plan.has(k)) {
				let item;
				try {
					item = await client.get(c.collection, c.slug, { raw: true, locale: c.locale });
				} catch (e) {
					fail(3, `content-patch: cannot read ${k} from ${baseUrl} — ${e.message}`);
				}
				if (item.locale && item.locale !== c.locale) fail(3, `content-patch: ${k} resolved to locale ${item.locale}`);
				plan.set(k, { c0: c, item, data: item.data, fields: new Set(), files: new Set() });
			}
			const e = plan.get(k);
			const cur = getAt(e.data, c.path);
			if (isDeepStrictEqual(cur, c.after)) {
				skipped++;
				continue;
			}
			if (!isDeepStrictEqual(cur, c.before)) {
				conflicts.push(`${file}: ${k} ${JSON.stringify(c.path)} holds ${JSON.stringify(cur)?.slice(0, 120)}, neither "before" nor "after"`);
				continue;
			}
			e.data = setAt(e.data, c.path, c.after);
			e.fields.add(c.path[0]);
			e.files.add(file);
		}
	}
	const pending = [...plan.values()].filter((e) => e.fields.size > 0);
	for (const e of pending)
		if (e.item.draftRevisionId)
			conflicts.push(`${e.c0.collection}/${e.c0.slug}/${e.c0.locale} has an unpublished draft — publishing would ship it too`);
	if (conflicts.length) fail(1, `content-patch: refusing to write anything — ${conflicts.length} conflict(s)\n  ${conflicts.join("\n  ")}`);

	const changes = pending.reduce((s, e) => s + e.fields.size, 0);
	console.log(`content-patch: ${baseUrl} — ${skipped} change(s) already applied, ${pending.length} entr(ies) to write (${changes} field(s))${dryRun ? " [dry run]" : ""}`);
	if (dryRun) {
		for (const e of pending) console.log(`  would write ${e.c0.collection}/${e.c0.slug} [${e.c0.locale}]: ${[...e.fields].join(", ")} (${[...e.files].join(", ")})`);
		return;
	}
	for (const e of pending) {
		const { collection, slug, locale } = e.c0;
		const data = Object.fromEntries([...e.fields].map((f) => [f, e.data[f]]));
		const updated = await client.update(collection, e.item.id, { data, _rev: e.item._rev, locale });
		// the CLI's own rule: publish only when the update staged a draft revision
		if (updated.draftRevisionId) await client.publish(collection, updated.id);
		// read back what readers now get
		const after = await client.get(collection, e.item.id, { raw: true, locale });
		for (const f of e.fields)
			if (!isDeepStrictEqual(after.data[f], e.data[f])) fail(3, `content-patch: ${collection}/${slug} [${locale}] ${f} did not read back as written`);
		const untouched = Object.keys(e.item.data).filter((f) => !e.fields.has(f));
		for (const f of untouched)
			if (!isDeepStrictEqual(after.data[f], e.item.data[f])) fail(3, `content-patch: ${collection}/${slug} [${locale}] field ${f} changed although the patch did not touch it`);
		console.log(`  wrote ${collection}/${slug} [${locale}]: ${[...e.fields].join(", ")} — ${untouched.length} other field(s) unchanged`);
	}
}

const [cmd, ...rest] = process.argv.slice(2);
if (import.meta.url === `file://${process.argv[1]}`) {
	if (cmd === "check") check();
	else if (cmd === "seed") seed(rest[0]);
	else if (cmd === "apply") await apply(rest);
	else fail(1, "usage: content-patch.mjs check | seed <patch.json> | apply --url <base> [--dry-run] [--dev-bypass]");
}
