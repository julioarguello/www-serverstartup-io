/**
 * Every source in the CSP that src/middleware.ts sends that names a host, per
 * directive. Shared by the tests that pin the policy (#309).
 */
export function outsideSources(src: string): string[] {
	const block = src.match(/"Content-Security-Policy":\s*\[([\s\S]*?)\]\.join/)?.[1];
	if (!block) throw new Error("Content-Security-Policy array not found in src/middleware.ts");
	const directives = [...block.matchAll(/^\s*"([a-z-]+) ([^"]*)",?\s*$/gm)];
	if (directives.length < 5) throw new Error(`only ${directives.length} directives parsed`);
	return directives.flatMap(([, name, values]) =>
		values
			.split(/\s+/)
			// keywords are quoted; schemes such as data: name no host
			.filter((v) => v && !v.startsWith("'") && !/^[a-z]+:$/.test(v))
			.map((v) => `${name} ${v}`),
	);
}
