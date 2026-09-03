/**
 * The markdown under `seed/content/` must still say what the site says (#500).
 *
 * Copy is authored in `seed/content/<collection>/<locale>/<slug>.md`, pushed
 * through the live CMS (which converts markdown to Portable Text server-side,
 * link markDefs included) and written back into `seed/seed.json`. Only the last
 * of those three is rendered. Nothing in `src/`, `scripts/`, `package.json` or
 * `.github/` reads the markdown at all.
 *
 * So an edit that stops at the markdown changes nothing on the site and passes
 * every gate — and the reverse is worse: a `seed.json` edit that never goes
 * back to the markdown leaves a file that reads like the source and is a stale
 * snapshot. Both had already happened when this test was written. The client
 * list on the two `cdn-waf` files was two names short of the published one, and
 * both `greenfield` files still promised "three senior engineers" after the
 * number came off the site. Whoever next ran the documented loader — the
 * instruction in CONTRIBUTING at the time — would have pushed those two
 * regressions live, and no gate would have said a word.
 *
 * This compares the markdown body against the rendered blocks as plain text:
 * words, in order, one block per non-empty line. It deliberately does NOT
 * compare markup. The converter is inconsistent about it — inline code inside
 * a link or a bold span survives as literal backticks in the text field, while
 * the same span on its own becomes a `code` mark — and pinning that would pin
 * a CMS quirk instead of the copy. Words are the thing that must not drift.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");
const CONTENT = join(ROOT, "seed", "content");

interface Span {
	text?: string;
}
interface Block {
	children?: Span[];
}
interface SeedEntry {
	slug: string;
	locale?: string;
	data: { content?: Block[] };
}

const seed = JSON.parse(readFileSync(join(ROOT, "seed", "seed.json"), "utf8"));

/**
 * A line of copy reduced to its words.
 *
 * Link syntax keeps its text and drops its target; every emphasis and code
 * marker is deleted, whether the converter turned it into a mark or left it in
 * the text. Leading block syntax — heading hashes, a blockquote caret, a list
 * bullet — goes too, because the block style is not what this is checking.
 */
export function plain(line: string): string {
	return line
		.replace(/^\s*(?:#{1,6}|>|[-*+])\s+/, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[*`]/g, "")
		.replace(/\s+/g, " ")
		.trim();
}

/** The body of a markdown file as one plain-text line per non-empty line. */
export function markdownLines(source: string): string[] {
	const parts = source.split("---");
	// Frontmatter is the first `---`-delimited block; a file without one is all
	// body. Splicing on the first two markers keeps a `---` inside the copy from
	// eating the rest of the file.
	const body = source.startsWith("---") && parts.length > 2 ? parts.slice(2).join("---") : source;
	return body
		.split("\n")
		.map(plain)
		.filter((l) => l.length > 0);
}

/** The rendered blocks of a seed entry, as the same kind of plain-text lines. */
export function entryLines(entry: SeedEntry): string[] {
	return (entry.data.content ?? []).map((b) =>
		plain((b.children ?? []).map((c) => c.text ?? "").join("")),
	);
}

/** Every `<collection>/<locale>/<slug>.md` that exists on disk. */
function mirroredFiles(): { collection: string; locale: string; slug: string; path: string }[] {
	const out: { collection: string; locale: string; slug: string; path: string }[] = [];
	// Directories only: this directory also carries the README that explains it.
	const dirs = (at: string) => readdirSync(at, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
	for (const collection of dirs(CONTENT)) {
		const collDir = join(CONTENT, collection);
		for (const locale of dirs(collDir)) {
			const locDir = join(collDir, locale);
			for (const file of readdirSync(locDir)) {
				if (!file.endsWith(".md")) continue;
				out.push({ collection, locale, slug: file.slice(0, -3), path: join(locDir, file) });
			}
		}
	}
	return out;
}

/**
 * The mirrored files whose words no longer match the seed entry they mirror.
 * Returns a reason per file, so a failure names the drift instead of a count.
 */
export function driftedFiles(
	files: { collection: string; locale: string; slug: string; path: string }[],
	content: Record<string, SeedEntry[]>,
): string[] {
	const drift: string[] = [];
	for (const f of files) {
		const entries = content[f.collection] ?? [];
		const entry = entries.find((e) => e.slug === f.slug && (e.locale ?? "es") === f.locale);
		if (!entry) {
			drift.push(`${f.collection}/${f.locale}/${f.slug}: no entry in seed.json`);
			continue;
		}
		const md = markdownLines(readFileSync(f.path, "utf8"));
		const rendered = entryLines(entry);
		if (md.length !== rendered.length) {
			drift.push(
				`${f.collection}/${f.locale}/${f.slug}: ${md.length} blocks in markdown, ${rendered.length} rendered`,
			);
			continue;
		}
		const i = md.findIndex((line, n) => line !== rendered[n]);
		if (i >= 0) {
			drift.push(
				`${f.collection}/${f.locale}/${f.slug} block ${i}:\n    markdown: ${md[i]}\n    rendered: ${rendered[i]}`,
			);
		}
	}
	return drift;
}

const FILES = mirroredFiles();

describe("the seed/content markdown mirror", () => {
	it("has files to check at all", () => {
		// A rename or a move that empties the directory would make every other
		// assertion here pass by vacuum.
		expect(FILES.length).toBeGreaterThan(0);
		expect([...new Set(FILES.map((f) => f.collection))].sort()).toEqual(["pages", "services"]);
	});

	it("says exactly what the site says, file by file", () => {
		expect(driftedFiles(FILES, seed.content)).toEqual([]);
	});
});

describe("controls — the check can fail", () => {
	const one = FILES.find((f) => f.slug === "desarrollo-greenfield");

	it("reports a word removed from the published copy but left in the markdown", () => {
		// The real regression, replayed: the site dropped the team size and the
		// markdown kept asserting it. Planted in the SEED, because that is the
		// half a copy edit touches.
		const planted = structuredClone(seed.content) as Record<string, SeedEntry[]>;
		const entry = planted.services.find((e) => e.slug === "desarrollo-greenfield" && e.locale === "es");
		const block = entry!.data.content!.find((b) =>
			(b.children ?? []).some((c) => (c.text ?? "").includes("Los mismos ingenieros")),
		);
		block!.children![0].text = block!.children![0].text!.replace(
			"Los mismos ingenieros",
			"Los mismos cuatro ingenieros",
		);
		const drift = driftedFiles([one!], planted);
		expect(drift).toHaveLength(1);
		expect(drift[0]).toContain("cuatro ingenieros");
	});

	it("reports a markdown file with no entry behind it", () => {
		const orphan = { collection: "services", locale: "es", slug: "servicio-inventado", path: one!.path };
		expect(driftedFiles([orphan], seed.content)).toEqual([
			"services/es/servicio-inventado: no entry in seed.json",
		]);
	});

	it("reports a block added on one side only", () => {
		const planted = structuredClone(seed.content) as Record<string, SeedEntry[]>;
		const entry = planted.services.find((e) => e.slug === "desarrollo-greenfield" && e.locale === "es");
		entry!.data.content!.push({ children: [{ text: "Un párrafo que el markdown no tiene." }] });
		expect(driftedFiles([one!], planted)[0]).toMatch(/blocks in markdown, \d+ rendered/);
	});

	it("ignores markup the converter is inconsistent about", () => {
		// `edge` became a code mark; `Cloudflare Workers` inside a link kept its
		// backticks. Neither is a copy change, and neither may fail this.
		expect(plain("en el `edge`, sobre [`Cloudflare Workers`](https://x/)")).toBe(
			"en el edge, sobre Cloudflare Workers",
		);
		expect(plain("***Cross-docking y fulfillment*.**")).toBe("Cross-docking y fulfillment.");
	});
});
