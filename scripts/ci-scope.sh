#!/usr/bin/env bash
# ci-scope.sh — does this change reach the RENDERED SITE? (#497)
#
# `quality-gates` runs 24 steps. Measured on #495, a one-line markdown edit:
# 614 s, of which 443 s were axe and Lighthouse measuring a rendered page the
# diff cannot have touched. This decides which half of the battery to run.
#
# It is NOT "skip CI for docs". Three steps run on EVERY change and are not
# gated by this script, because they read FILE CONTENT and a document is a file:
#
#   * gitleaks        — a document can carry a secret
#   * citability      — a document can carry a client name; this is the gate
#                       most likely to have something to say about a doc edit
#   * CSS source budget — it READS docs/design-system.md (#475). A plain
#                       `paths-ignore: docs/**` would switch that gate off
#                       exactly when someone edits the document it checks,
#                       which is the only moment it can catch anything.
#
# FAIL OPEN. Every path that cannot prove the change is inert prints
# `site=true`. A scope calculation that breaks must run more, never less: the
# #347 lesson — an absent input and a clean answer must not look the same.
#
# Usage:
#   ci-scope.sh                      # decide from the environment (CI)
#   ci-scope.sh --decide <path>...   # decide from a file list, no git needed
#   ci-scope.sh --self-test          # prove the table, then exit
#
# Exit 0 always when it reaches a decision; the ANSWER is on stdout as
# `site=true` / `site=false`, and appended to $GITHUB_OUTPUT when set.
set -uo pipefail

# Paths that cannot change a rendered page. Everything else reaches the site.
# Anchored at the start of the path; `docs/` covers `docs/design-system.md`
# precisely because the gate that reads it is not gated by this script.
INERT_PREFIXES=("docs/" "reference/")
INERT_EXACT=("README.md" "CONTRIBUTING.md" "SECURITY.md" "AGENTS.md" "CLAUDE.md")

is_inert() { # $1 = path — true only when this file cannot reach the site
	local p="$1"
	for pre in "${INERT_PREFIXES[@]}"; do [[ "$p" == "$pre"* ]] && return 0; done
	for ex in "${INERT_EXACT[@]}"; do [[ "$p" == "$ex" ]] && return 0; done
	return 1
}

decide() { # paths on stdin, one per line -> site=true|false
	local any=0 reached=0 p
	while IFS= read -r p; do
		[ -z "$p" ] && continue
		any=1
		if ! is_inert "$p"; then reached=1; echo "  reaches the site: $p" >&2; fi
	done
	# An empty file list is not proof of an inert change: it is proof that the
	# list could not be built. Run everything.
	if [ "$any" -eq 0 ]; then
		echo "  no changed files could be listed — running everything" >&2
		echo "site=true"; return
	fi
	[ "$reached" -eq 1 ] && echo "site=true" || echo "site=false"
}

self_test() {
	local fails=0
	check() { # $1 = expected, $2 = label, rest = paths
		local want="$1" label="$2"; shift 2
		local got
		got=$(printf '%s\n' "$@" | decide 2>/dev/null)
		if [ "$got" != "site=$want" ]; then
			echo "  SELF-TEST FAIL [$label]: wanted site=$want, got $got" >&2
			fails=$((fails + 1))
		fi
	}
	check false "docs only"            "docs/production-cutover.md"
	check false "the budget doc"       "docs/design-system.md"
	check false "root markdown"        "README.md" "CONTRIBUTING.md"
	check false "legacy archive"       "reference/legacy/README.md"
	check true  "a template"           "src/pages/index.astro"
	check true  "the seed"             "seed/seed.json"
	check true  "a gate script"        "scripts/ci-check-layout.mjs"
	check true  "the workflow itself"  ".github/workflows/ci.yml"
	check true  "docs AND a template"  "docs/x.md" "src/worker.ts"
	check true  "empty list"           ""
	# A path that merely CONTAINS an inert prefix must not read as inert.
	check true  "not-really-docs"      "src/components/docs/Panel.astro"
	if [ "$fails" -gt 0 ]; then
		echo "ci-scope: SELF-TEST FAILED ($fails) — refusing to narrow the battery." >&2
		return 1
	fi
	echo "ci-scope: self-test ok (11 cases, including fail-open on an empty list)"
}

case "${1:-}" in
	--self-test) self_test; exit $? ;;
	--decide) shift; self_test >/dev/null || exit 1; printf '%s\n' "$@" | decide; exit 0 ;;
esac

# ── CI path ────────────────────────────────────────────────────────────────
self_test || { echo "site=true" | tee -a "${GITHUB_OUTPUT:-/dev/null}"; exit 0; }

emit() { echo "$1"; [ -n "${GITHUB_OUTPUT:-}" ] && echo "$1" >> "$GITHUB_OUTPUT"; return 0; }

# main runs everything, always. It is what production promotes from, so the
# saving is a pull-request optimisation and never a weaker guarantee on main.
if [ "${GITHUB_EVENT_NAME:-}" != "pull_request" ]; then
	echo "ci-scope: event '${GITHUB_EVENT_NAME:-unknown}' is not a pull request — running everything" >&2
	emit "site=true"; exit 0
fi

BASE="${PR_BASE_SHA:-}"
HEAD="${PR_HEAD_SHA:-}"
if [ -z "$BASE" ] || [ -z "$HEAD" ]; then
	echo "ci-scope: base/head sha not provided — running everything" >&2
	emit "site=true"; exit 0
fi

FILES=$(git diff --name-only "$BASE...$HEAD" 2>/dev/null)
if [ $? -ne 0 ]; then
	echo "ci-scope: could not diff $BASE...$HEAD — running everything" >&2
	emit "site=true"; exit 0
fi

echo "ci-scope: $(printf '%s\n' "$FILES" | grep -c . ) changed file(s) in $BASE...$HEAD" >&2
emit "$(printf '%s\n' "$FILES" | decide)"
