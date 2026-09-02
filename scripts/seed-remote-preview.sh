#!/usr/bin/env bash
# seed-remote-preview.sh — reproduce seed/seed.json onto a REMOTE D1, idempotently.
#
# Route (each step earned in rehearsal, 2026-08-07/08):
#   1. Seed a LOCAL sqlite the canonical way (emdash seed applies the 69
#      migrations itself; server must be down — FTS corruption rule).
#   2. DATA-ONLY refresh: per real table, DELETE FROM + INSERT rows. Replaying
#      CREATEs breaks on a previously-seeded remote (UNIQUE on
#      _emdash_migrations was the first casualty), and a whole-db .dump writes
#      sqlite_schema for the FTS5 virtual tables, which D1 rejects. Schema is
#      migrations' job, not ours — we only move content.
#      (_emdash_migrations, _cf_METADATA, sqlite_% and FTS shadows excluded.)
#   3. Append FTS 'rebuild' inserts (regenerated from sqlite_master, never
#      speculative — a rebuild for a missing table rolls back the whole file).
#   4. Rehearse the SQL on a COPY of the local sqlite BEFORE touching remote.
#   5. Rehearse it again on a copy carrying the REMOTE's own collection schema,
#      repaired additively first — the two local rehearsals cannot see a remote
#      that is a column behind, because both copies come from local (#484).
#   6. Apply to the remote database and verify a count.
#
# Usage: scripts/seed-remote-preview.sh [d1-name] [--rehearsal-only]
#        (default d1-name: www-serverstartup-io-preview)
set -euo pipefail

D1_NAME="${1:-www-serverstartup-io-preview}"
REHEARSAL_ONLY=0
[ "${2:-}" = "--rehearsal-only" ] && REHEARSAL_ONLY=1
WORK="${RUNNER_TEMP:-/tmp}/preview-seed"
mkdir -p "$WORK"

D1_DB=$(find .wrangler -name "*.sqlite" -path "*/d1/*" -not -name "metadata.sqlite" | head -1)
[ -n "$D1_DB" ] || { echo "ERROR: no local seeded D1 sqlite (run scripts/ci-local-stack.sh first)" >&2; exit 1; }

SQL="$WORK/seed.sql"
: > "$SQL"

# FK-safe bulk replace. The 0.34 schema carries FOREIGN KEYs between system
# tables, and this file's DELETE order comes from sqlite_master, not from the
# FK topology — the 2026-08-23 07:21 deploy died on exactly that
# ("FOREIGN KEY constraint failed"). defer_foreign_keys postpones the checks
# to commit, by which point DELETE+INSERT has restored consistency. D1
# supports the pragma; the rehearsal below runs with foreign_keys=ON so it
# exercises the same semantics instead of the sqlite3 CLI's silent default OFF.
echo "PRAGMA defer_foreign_keys = true;" >> "$SQL"

# 0. COLLECTION SCHEMA (#326). Collection tables (ec_*) are not created by the
#    numbered migrations — EmDash creates them from the collections declared in
#    seed.json. So a collection added after the remote was first seeded exists
#    only locally, and step 2's DELETE dies with "no such table". That is what
#    took the preview environment down: ec_references arrived with #271/#296
#    and the remote never learned about it.
#    Emitting the CREATEs as IF NOT EXISTS is idempotent and stays inside the
#    header's contract — it does not replay migrations, does not touch
#    _emdash_migrations, and does not write sqlite_schema for FTS shadows.
sqlite3 "$D1_DB" "
  SELECT replace(sql, 'CREATE TABLE ', 'CREATE TABLE IF NOT EXISTS ') || ';'
    FROM sqlite_master WHERE type='table' AND name LIKE 'ec\_%' ESCAPE '\' AND sql IS NOT NULL
  UNION ALL
  SELECT replace(replace(sql, 'CREATE INDEX ', 'CREATE INDEX IF NOT EXISTS '),
                 'CREATE UNIQUE INDEX ', 'CREATE UNIQUE INDEX IF NOT EXISTS ') || ';'
    FROM sqlite_master WHERE type='index' AND tbl_name LIKE 'ec\_%' ESCAPE '\' AND sql IS NOT NULL;
" >> "$SQL"

# 0b. REMOTE COLUMN DRIFT (#484). `CREATE TABLE IF NOT EXISTS` above is what
#     closed the *new table* case in #326 — and it is exactly what makes the
#     *new column* case invisible: it never alters a table that already exists.
#     A field added to a collection in seed.json therefore lands locally and
#     nowhere else, and the INSERT dies with "table X has N columns but N+1
#     values were supplied". That is what froze preview on 2026-09-02, three
#     deploys running, while the worker kept deploying new code over old
#     content.
#
#     Neither rehearsal below can see it. Both copies descend from the local
#     database, so both have the canonical column set by construction. The only
#     way to stand where the remote stands is to read the remote's schema.
cat > "$WORK/schema-diff.py" <<'PYEOF'
"""Compare a canonical sqlite against a target's ec_* schema.

Prints the ALTER TABLE statements that make the target additively match.
Exit 0: target matches, or can be repaired by appending columns.
Exit 3: drift this file must not paper over — a column the canonical schema does
        not have, a type change, or a NOT NULL column with no default (which
        ALTER TABLE ADD COLUMN cannot add at all). Those need a human.
"""
import sqlite3, sys

canon, target = sqlite3.connect(sys.argv[1]), sqlite3.connect(sys.argv[2])

def tables(db):
    return {r[0] for r in db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
        " AND name LIKE 'ec\\_%' ESCAPE '\\'")}

def cols(db, t):
    # cid -> (name, type, notnull, default)
    return {r[1]: (r[2], r[3], r[4]) for r in db.execute(f'PRAGMA table_info("{t}")')}

alters, blocking = [], []
for t in sorted(tables(canon) & tables(target)):
    c, g = cols(canon, t), cols(target, t)
    for name in g:
        if name not in c:
            blocking.append(f'{t}.{name}: on the remote, absent from seed.json')
    for name, (typ, notnull, dflt) in c.items():
        if name in g:
            if g[name][0].upper() != typ.upper():
                blocking.append(f'{t}.{name}: {g[name][0]} remote vs {typ} canonical')
            continue
        if notnull and dflt is None:
            blocking.append(f'{t}.{name}: NOT NULL with no default cannot be added in place')
            continue
        d = f' DEFAULT {dflt}' if dflt is not None else ''
        alters.append(f'ALTER TABLE "{t}" ADD COLUMN "{name}" {typ}{d};')

if blocking:
    print('schema drift the seed cannot repair:', file=sys.stderr)
    for b in blocking:
        print(f'  {b}', file=sys.stderr)
    sys.exit(3)
print('\n'.join(alters))
PYEOF

# Positive control, offline, before the comparator is trusted with anything.
# Two shapes, two plants — one id per assertion shape is this repo's rule, and
# a plant must not need the thing it is checking, so both build their own
# throwaway schema instead of asking the remote for one.
plant() {  # $1 = "drop" | "add"
	local pdb="$WORK/plant-$1.sqlite"
	rm -f "$pdb"
	python3 - "$D1_DB" "$pdb" "$1" <<'PYEOF'
import sqlite3, sys
src, dst, mode = sys.argv[1], sys.argv[2], sys.argv[3]
a, b = sqlite3.connect(src), sqlite3.connect(dst)
for (t,) in a.execute("SELECT name FROM sqlite_master WHERE type='table'"
                      " AND name LIKE 'ec\\_%' ESCAPE '\\'"):
    cols = [(r[1], r[2]) for r in a.execute(f'PRAGMA table_info("{t}")')]
    if t == 'ec_partners':
        if mode == 'drop':
            cols = [c for c in cols if c[0] != 'url']       # a column the remote lacks
        else:
            cols.append(('plant_extra', 'TEXT'))            # a column seed.json lacks
    ddl = ', '.join(f'"{n}" {ty}' for n, ty in cols)
    b.execute(f'CREATE TABLE "{t}" ({ddl})')
b.commit()
PYEOF
}

plant drop
PLANT_DROP=$(python3 "$WORK/schema-diff.py" "$D1_DB" "$WORK/plant-drop.sqlite" 2>/dev/null) || {
	echo "ERROR: the schema comparator refused a repairable plant (a missing column)." >&2; exit 3; }
case "$PLANT_DROP" in
	*'ALTER TABLE "ec_partners" ADD COLUMN "url"'*) : ;;
	*) echo "ERROR: comparator blind — a column missing on the target went unreported." >&2
	   echo "  it said: ${PLANT_DROP:-<nothing>}" >&2; exit 3 ;;
esac

plant add
if PLANT_ADD=$(python3 "$WORK/schema-diff.py" "$D1_DB" "$WORK/plant-add.sqlite" 2>&1); then
	echo "ERROR: comparator blind — a column the seed does not declare was waved through." >&2
	exit 3
fi
case "$PLANT_ADD" in
	*'ec_partners.plant_extra'*) : ;;
	*) echo "ERROR: comparator stopped, but did not name the offending column." >&2
	   echo "  it said: $PLANT_ADD" >&2; exit 3 ;;
esac
echo "schema comparator: both plants judged correctly (a missing column, an unexpected one)"

# Read the remote's own schema and stand a rehearsal on it. Read-only, and
# skipped under --rehearsal-only, which is documented as not reaching the remote.
REMOTE_SHAPED=""
if [ "$REHEARSAL_ONLY" = "0" ]; then
	if ! npx wrangler d1 execute "$D1_NAME" --remote --json -y --command \
		"SELECT name, sql FROM sqlite_master WHERE type='table' AND name LIKE 'ec\_%' ESCAPE '\' AND sql IS NOT NULL;" \
		> "$WORK/remote-schema.json" 2> "$WORK/remote-schema.err"; then
		echo "ERROR: could not read the remote schema of '$D1_NAME'." >&2
		echo "  Refusing to apply blind: this is the one check that sees the state" >&2
		echo "  the two local rehearsals cannot (#484)." >&2
		tail -10 "$WORK/remote-schema.err" >&2
		exit 3
	fi
	python3 - "$WORK/remote-schema.json" > "$WORK/remote-schema.sql" <<'PYEOF'
import json, sys
doc = json.load(open(sys.argv[1]))
rows = doc[0]["results"] if isinstance(doc, list) else doc["result"][0]["results"]
for r in rows:
    print(r["sql"].rstrip().rstrip(";") + ";")
PYEOF
	# A copy of local with its collection tables replaced by the remote's own.
	# System tables stay local: they are migrations' job, not this file's.
	sqlite3 "$D1_DB" ".backup '$WORK/rehearsal-remote.sqlite'"
	sqlite3 "$WORK/rehearsal-remote.sqlite" \
	  "SELECT 'DROP TABLE \"' || name || '\";' FROM sqlite_master
	     WHERE type='table' AND name LIKE 'ec\_%' ESCAPE '\';" > "$WORK/drop-remote.sql"
	sqlite3 -bail -cmd "PRAGMA trusted_schema=ON;" "$WORK/rehearsal-remote.sqlite" < "$WORK/drop-remote.sql"
	sqlite3 -bail -cmd "PRAGMA trusted_schema=ON;" "$WORK/rehearsal-remote.sqlite" < "$WORK/remote-schema.sql"

	DRIFT=$(python3 "$WORK/schema-diff.py" "$D1_DB" "$WORK/rehearsal-remote.sqlite") || exit 3
	if [ -n "$DRIFT" ]; then
		echo "remote schema drift, repairing additively:"
		echo "$DRIFT" | sed 's/^/  /'
		printf '%s\n' "$DRIFT" >> "$SQL"
		printf '%s\n' "$DRIFT" > "$WORK/repair.sql"
	else
		echo "remote schema matches seed.json — no repair needed"
	fi
	REMOTE_SHAPED="$WORK/rehearsal-remote.sqlite"
else
	echo "rehearsal-only: skipping the remote schema read (it would reach the remote)"
fi

# FK-topological order, computed from the schema itself (the 0.34 migrations
# added FKs — e.g. every ec_* table references revisions — and sqlite_master
# order is arbitrary: the 2026-08-23 07:21 deploy died on it). DELETE runs
# children-first, INSERT parents-first (the same list reversed). Self-refs
# (taxonomies, comments) are ignored as edges: a full-table DELETE clears
# parent and child rows in one statement.
python3 - "$D1_DB" > "$WORK/tables.topo" <<'PYEOF'
import sqlite3, sys
db = sqlite3.connect(sys.argv[1])
tables = [r[0] for r in db.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"
    " AND name NOT LIKE '\\_emdash\\_fts\\_%' ESCAPE '\\'"
    " AND name NOT LIKE 'sqlite_%'"
    " AND name NOT IN ('_cf_METADATA','_emdash_migrations')")]
parents = {t: set() for t in tables}
for t in tables:
    for row in db.execute(f'PRAGMA foreign_key_list("{t}")'):
        p = row[2]
        if p in parents and p != t:
            parents[t].add(p)
children = {t: {c for c in tables if t in parents[c]} for t in tables}
emitted, order = set(), []
while len(order) < len(tables):
    ready = sorted(t for t in tables if t not in emitted and children[t] <= emitted)
    if not ready:
        sys.exit("ERROR: FK cycle among: " + ", ".join(sorted(set(tables) - emitted)))
    order.extend(ready); emitted.update(ready)
print("\n".join(order))
PYEOF

# children-first DELETEs…
while read -r t; do
	echo "DELETE FROM \"$t\";" >> "$SQL"
done < "$WORK/tables.topo"
# …then parents-first INSERTs (same order reversed)
tail -r "$WORK/tables.topo" 2>/dev/null > "$WORK/tables.rev" || tac "$WORK/tables.topo" > "$WORK/tables.rev"
while read -r t; do
	# Column lists, not `.mode insert`. That mode emits positional VALUES, which
	# makes the whole file depend on the remote's column ORDER matching the
	# local one — and ALTER TABLE can only append, so a remote repaired for a
	# missing middle column would take every value after it one place to the
	# left, silently, on a green deploy. Naming the columns removes the
	# dependency outright (#484). quote() is SQLite's own literal escaper, so
	# NULLs, blobs and embedded quotes come out exactly as `.mode insert` wrote
	# them — and unlike that mode's output, this does not vary with the CLI
	# version (3.28 prints the table name bare, later ones may not).
	COLS=$(sqlite3 "$D1_DB" "SELECT group_concat('\"' || name || '\"', ',') FROM pragma_table_info('$t');")
	EXPR=$(sqlite3 "$D1_DB" "SELECT group_concat('quote(\"' || name || '\")', ' || '','' || ') FROM pragma_table_info('$t');")
	sqlite3 -noheader "$D1_DB" \
	  "SELECT 'INSERT INTO \"$t\"($COLS) VALUES(' || $EXPR || ');' FROM \"$t\";" >> "$SQL"
done < "$WORK/tables.rev"
sqlite3 "$D1_DB" "SELECT 'INSERT INTO ' || name || '(' || name || ') VALUES(''rebuild'');' FROM sqlite_master WHERE sql LIKE 'CREATE VIRTUAL TABLE%';" >> "$SQL"

# Rehearse on a copy of the local database (schema present, data replaced).
# trusted_schema=ON: the pages FTS triggers write into the virtual table on
# every ec_pages insert, which modern sqlite3 CLIs reject as "unsafe" under
# their default untrusted-schema policy — it is our own schema, and remote
# D1 executes the same statements through its own engine without complaint.
# .backup, not cp: the freshly-seeded database's newest schema (the FTS
# virtual tables) may still live in the -wal file — a bare file copy loses
# it and the rehearsal dies with "no such table: _emdash_fts_*" (bit CI,
# where the server is killed and copied within the same second).
sqlite3 "$D1_DB" ".backup '$WORK/rehearsal.sqlite'"

# The rehearsal used to run against a straight copy of the local database,
# which BY CONSTRUCTION already has every collection table — so it could never
# see a remote that is behind, and it waved through the exact SQL that killed
# the deploy (#326). Dropping the collection tables first makes the rehearsal
# stand where the remote stands: if the generated file cannot rebuild them, it
# fails here, on a throwaway copy, instead of against the real database.
sqlite3 "$WORK/rehearsal.sqlite" \
  "SELECT 'DROP TABLE \"' || name || '\";' FROM sqlite_master
     WHERE type='table' AND name LIKE 'ec\_%' ESCAPE '\';" > "$WORK/drop.sql"
sqlite3 -bail -cmd "PRAGMA trusted_schema=ON;" "$WORK/rehearsal.sqlite" < "$WORK/drop.sql"

# foreign_keys=ON: D1 enforces FKs, the sqlite3 CLI defaults them OFF — a
# rehearsal without them waves through DELETE orders the remote will reject.
sqlite3 -bail -cmd "PRAGMA trusted_schema=ON;" -cmd "PRAGMA foreign_keys=ON;" "$WORK/rehearsal.sqlite" < "$SQL"

# Second rehearsal, different blind spot: the drop-based copy recreates the
# collection tables EMPTY, so an FK-hostile DELETE order can never violate
# there (child rows are what violate, and it has none). This copy keeps every
# row, stands where a POPULATED remote stands, and is what actually fails
# when the order regresses (the 2026-08-23 07:21 class).
sqlite3 "$D1_DB" ".backup '$WORK/rehearsal-populated.sqlite'"
sqlite3 -bail -cmd "PRAGMA trusted_schema=ON;" -cmd "PRAGMA foreign_keys=ON;" "$WORK/rehearsal-populated.sqlite" < "$SQL"
PAGES_POP=$(sqlite3 "$WORK/rehearsal-populated.sqlite" "SELECT count(*) FROM ec_pages;")
[ "$PAGES_POP" -gt 0 ] || { echo "ERROR: populated rehearsal produced 0 pages" >&2; exit 1; }
PAGES_LOCAL=$(sqlite3 "$WORK/rehearsal.sqlite" "SELECT count(*) FROM ec_pages;")
[ "$PAGES_LOCAL" -gt 0 ] || { echo "ERROR: rehearsal produced 0 pages" >&2; exit 1; }

# Every collection the seed declares must exist after the rehearsal, or the
# remote will hit "no such table" on a table nobody noticed was missing.
MISSING=$(sqlite3 "$WORK/rehearsal.sqlite" "
  SELECT group_concat(name, ' ') FROM (
    SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'ec\_%' ESCAPE '\')" )
echo "rehearsal rebuilt collections: ${MISSING:-NONE}"

# Third rehearsal, and the only one that stands where the remote stands (#484).
# The two above both descend from the local database, so both carry the
# canonical column set by construction and neither can fail on a schema the
# remote actually has. This copy keeps the local system tables — schema is
# migrations' job — and swaps in the remote's own collection tables, so the
# generated file meets the shape it will really meet, repair included.
if [ -n "$REMOTE_SHAPED" ]; then
	if ! sqlite3 -bail -cmd "PRAGMA trusted_schema=ON;" -cmd "PRAGMA foreign_keys=ON;" \
		"$REMOTE_SHAPED" < "$SQL" > "$WORK/rehearsal-remote.log" 2>&1; then
		echo "ERROR: the file fails against the REMOTE's own schema." >&2
		echo "  It passed both local rehearsals, which is expected: they cannot see this." >&2
		echo "  Generated SQL: $SQL" >&2
		[ -f "$WORK/repair.sql" ] && { echo "  Repair attempted:" >&2; sed 's/^/    /' "$WORK/repair.sql" >&2; }
		tail -10 "$WORK/rehearsal-remote.log" >&2
		exit 1
	fi
	PAGES_REM_SHAPE=$(sqlite3 "$REMOTE_SHAPED" "SELECT count(*) FROM ec_pages;")
	[ "$PAGES_REM_SHAPE" -gt 0 ] || { echo "ERROR: remote-shaped rehearsal produced 0 pages" >&2; exit 1; }
	echo "remote-shaped rehearsal: ok ($PAGES_REM_SHAPE pages)"
fi

# --rehearsal-only: prove generation + rehearsal without touching the remote.
# Local wrangler sessions can carry OAuth credentials, so "no token" is NOT a
# safety net — a local test run reached the real preview D1 on 2026-08-23.
if [ "$REHEARSAL_ONLY" = "1" ]; then
	echo "rehearsal-only: stopping before the remote apply (as requested)"
	exit 0
fi

# The remote apply is the one step that can still fail on state we cannot see
# from here. Say what was attempted and where to look — the failure that took
# the preview down surfaced as a bare SQLITE_ERROR under 300 lines of Vite
# noise, and was misread as a build error for a day (#326).
if ! npx wrangler d1 execute "$D1_NAME" --remote --file "$SQL" -y > "$WORK/apply.log" 2>&1; then
	echo "ERROR: applying the refresh to remote D1 '$D1_NAME' failed." >&2
	echo "  The SQL rehearsed clean against three copies — dropped, populated, and" >&2
	echo "  one carrying the remote's own collection schema — so the remote is in a" >&2
	echo "  state none of them account for. Read the schema diff above first." >&2
	echo "  Generated SQL: $SQL" >&2
	echo "  --- wrangler said ---" >&2
	tail -20 "$WORK/apply.log" >&2
	exit 1
fi
PAGES_REMOTE=$(npx wrangler d1 execute "$D1_NAME" --remote --command "SELECT count(*) AS c FROM ec_pages;" -y 2>/dev/null | grep -oE '"c": [0-9]+' | grep -oE '[0-9]+')
echo "remote $D1_NAME refreshed: $PAGES_REMOTE pages (rehearsal had $PAGES_LOCAL)"
[ "$PAGES_REMOTE" = "$PAGES_LOCAL" ]
