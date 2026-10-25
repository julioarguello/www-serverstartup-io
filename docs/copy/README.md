# Copy review: inventory and scores

This folder holds the evidence for the site-wide copy review (#577): what the site says, and how each of
its first-impression strings scores.

## The inventory

Generate the inventory instead of keeping one:

```bash
scripts/copy-inventory.py              # every string, as TSV
scripts/copy-inventory.py --tier 1     # Tier 1 only
```

It reads `seed/seed.json` and prints one row per string the site renders. Each row carries:

- the tier;
- where the string comes from, and its slot;
- the locale;
- its length;
- the component it renders in;
- a short hash of its text;
- the text itself.

The tiers decide how much review a string gets:

| Tier | What it covers | How it is reviewed |
| :--- | :--- | :--- |
| 1 | The home, every h1, excerpts (they double as meta descriptions) and every call to action | A panel |
| 2 | Page and service bodies | Pair writing with the founder |
| 3 | Labels, menus and settings | One pass plus the gates |

The inventory is not tracked. The seed is the source, and a tracked copy would ask every content PR to
regenerate it.

## The scores

`tier1-scores.tsv` scores every Tier 1 string from 1 to 3 on each criterion of #577's rubric:

- clarity;
- relevance to the target reader;
- differentiation;
- breadth;
- non-exclusion;
- facts;
- voice;
- the English being a re-expression rather than a translation;
- search entities.

Render fit is `n/m`, because it is not measured here. Any score of 1 comes with a note.

Rows are keyed by the text's hash, so editing a string orphans its score. To list the Tier 1 strings
whose current text has no score:

```bash
scripts/copy-inventory.py --unscored docs/copy/tier1-scores.tsv   # exits 1 if any
```

A score is a reviewer's reading, not an approval. Copy reaches the CMS only once the founder has
approved it on a preview URL (#577 §5).
