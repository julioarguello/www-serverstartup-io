/**
 * The timers of a hero scene's opening, pausable (#547).
 *
 * A scene's opening is CSS animations plus a few timeouts (the end of the opening, the moment its text
 * starts). The pause freezes the animations with `animation-play-state`; this clock freezes the timeouts
 * with them, keeping what each has left, so pause stops the frame where it is and play goes on from there
 * (founder, 2026-10-04: pausing used to jump to the end of the opening).
 */
export class SceneClock {
	private jobs = new Map<string, { fn: () => void; left: number; since: number; id: number | null }>();

	/** run `fn` after `ms`, under `name` (a later `at` with the same name replaces it) */
	at(name: string, ms: number, fn: () => void): void {
		this.cancel(name);
		const job = { fn, left: ms, since: performance.now(), id: null as number | null };
		job.id = window.setTimeout(() => { this.jobs.delete(name); fn(); }, ms);
		this.jobs.set(name, job);
	}

	/** freeze every pending job, keeping what it has left */
	hold(): void {
		for (const job of this.jobs.values()) {
			if (job.id === null) continue;
			clearTimeout(job.id);
			job.id = null;
			job.left -= performance.now() - job.since;
		}
	}

	/** run every frozen job on from where it stopped */
	resume(): void {
		for (const [name, job] of this.jobs) {
			if (job.id !== null) continue;
			job.since = performance.now();
			job.id = window.setTimeout(() => { this.jobs.delete(name); job.fn(); }, Math.max(0, job.left));
		}
	}

	cancel(name: string): void {
		const job = this.jobs.get(name);
		if (job?.id != null) clearTimeout(job.id);
		this.jobs.delete(name);
	}

	clear(): void {
		for (const job of this.jobs.values()) if (job.id !== null) clearTimeout(job.id);
		this.jobs.clear();
	}

	get running(): boolean {
		return this.jobs.size > 0;
	}
}
