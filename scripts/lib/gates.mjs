/**
 * How many steps of the quality-gates workflow can refuse a branch (#499, #515).
 *
 * One definition, read by `tests/unit/gate-count.test.ts` (which holds the
 * number /deconstruyendo states) and by `scripts/badges.mjs` (which publishes
 * the README's badge), so the page and the badge cannot count differently.
 *
 * Steps are matched by the file's own indentation, six spaces then `- name:`.
 * A step carrying `# not-a-gate:` is not counted; a step without it is, so a
 * new gate is counted unless someone says otherwise. Names are counted once
 * however many runners repeat them: a gate run on three runners refuses the
 * branch once.
 */
const STEP = /^ {6}- name: (.+)$/gm;

/** Every `- name:` in the file, in order, whether or not it is a gate. */
export function stepNames(workflow) {
	return [...workflow.matchAll(STEP)].map((m) => m[1].trim());
}

/** The subset that can refuse a branch: no `# not-a-gate:` marker. */
export function gateNames(workflow) {
	return stepNames(workflow).filter((name) => !name.includes("# not-a-gate:"));
}

/** Gate names counted once, however many runners they happen on. */
export function distinctGates(workflow) {
	return [...new Set(gateNames(workflow))];
}
