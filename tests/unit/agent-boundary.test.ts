/**
 * `AGENTS.md` is public. The private rules are not (#325).
 *
 * `AGENTS.md` is the first file a foreign agent opens — that is the point of
 * the convention. For months this repository published a generated index of a
 * repository no clone has: eleven `.agent/…` paths that resolve to nothing,
 * a glob table routing `worker/**`, `Dockerfile` and `application.properties`
 * to rules, in a project with none of those, and a `.claude/skills` symlink
 * pointing outside the tree, tracked, and therefore broken on every clone.
 *
 * Two things make that hard to keep fixed. The generator that wrote it lives
 * in the private repository, so it can overwrite this file at any time from
 * outside anything CI can see; and a dangling reference fails silently — an
 * agent reading it loads nothing and gets no warning, which is exactly the
 * failure mode the project already documents for worktrees.
 *
 * So the boundary is asserted here rather than trusted. This is a unit test
 * and not a sixteenth CI step on purpose: the step count is quoted in the
 * public copy on /deconstruyendo, and `npm test` already runs on every PR.
 *
 * Existence is resolved against `git ls-files`, never against the filesystem.
 * The private directory is present on a maintainer's machine and absent from
 * every clone, so the working tree would answer "fine" for precisely the
 * reader this test protects.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(import.meta.dirname, "..", "..");

const git = (...args: string[]): string =>
	execFileSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

/** What a clone receives — the index, not the disk. */
function trackedPaths(): Set<string> {
	return new Set(git("ls-files", "-z").split("\0").filter(Boolean));
}

/** Tracked symlinks, as `path -> target`. Mode 120000 in the index. */
function trackedSymlinks(): { path: string; target: string }[] {
	return git("ls-files", "-s", "-z")
		.split("\0")
		.filter((l) => l.startsWith("120000"))
		.map((l) => {
			const path = l.slice(l.indexOf("\t") + 1);
			return { path, target: git("cat-file", "blob", l.split(/\s+/)[1]).trim() };
		});
}

/** Relative markdown links in a document, minus anchors and external URLs. */
function localLinks(markdown: string): string[] {
	return [...markdown.matchAll(/\]\(([^)]+)\)/g)]
		.map((m) => m[1].split("#")[0].trim())
		.filter((href) => href && !/^[a-z]+:/i.test(href) && !href.startsWith("/"))
		.map((href) => href.replace(/\/$/, ""));
}

describe("AGENTS.md is a public guide, not a private index", () => {
	const agents = readFileSync(join(ROOT, "AGENTS.md"), "utf8");

	it("references no path inside the private rules repository", () => {
		const leaked = agents
			.split("\n")
			.map((line, i) => ({ line, n: i + 1 }))
			.filter(({ line }) => /(^|[\s"'`(/])\.agent\//.test(line));
		expect(leaked.map((l) => `${l.n}: ${l.line.trim()}`)).toEqual([]);
	});

	it("every relative link it offers is a path a clone actually receives", () => {
		const tracked = trackedPaths();
		const dangling = localLinks(agents).filter(
			(href) => !tracked.has(href) && ![...tracked].some((f) => f.startsWith(`${href}/`)),
		);
		expect(dangling).toEqual([]);
	});

	it("does not route rules at file types this project does not have", () => {
		// The generated table shipped globs for a Java/Docker service. A row
		// naming a path no clone contains is not guidance, it is noise that
		// reads as guidance.
		const absent = ["worker/", "Dockerfile", "docker-compose", "application.properties"];
		expect(absent.filter((needle) => agents.includes(needle))).toEqual([]);
	});
});

describe("no tracked symlink escapes the repository", () => {
	it("because a clone gets the link and not what it points at", () => {
		const tracked = trackedPaths();
		const escaping = trackedSymlinks().filter(({ path, target }) => {
			if (target.startsWith("/")) return true;
			const dir = path.includes("/") ? path.slice(0, path.lastIndexOf("/")) : "";
			const resolved = join(dir, target).replace(/\\/g, "/");
			if (resolved.startsWith("..")) return true;
			return !tracked.has(resolved) && ![...tracked].some((f) => f.startsWith(`${resolved}/`));
		});
		expect(escaping.map((s) => `${s.path} -> ${s.target}`)).toEqual([]);
	});
});
