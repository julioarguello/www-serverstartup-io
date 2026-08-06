# Corporate knowledge base — Server Startup S.L.

> Documentary database about the company: identity, team, clients, services,
> technical specialties and brand voice. Built **2026-08-02** from primary sources
> (Registro Mercantil, Dropbox, Gmail, Google Drive, GitHub) to feed the
> serverstartup.io copy rewrite (issues
> [#141](https://github.com/julioarguello/www-serverstartup-io/issues/141)–#153)
> and any future work needing company context. English since 2026-08-05
> (all working artifacts in English; only website content is ES+EN).

## Public / private split

Tracked files here are **curated for eventual public visibility** (master plan
[#165](https://github.com/julioarguello/www-serverstartup-io/issues/165), phase
0-pre). Everything sensitive — full client map including partner-channel
engagements, personal contact data, pricing mechanics, the source registry —
lives in **`private/`**, which is **gitignored** and never committed. The agent
can read it locally; reviewers and the public repo cannot. Backup:
`scripts/kb-backup.sh` mirrors `private/` to Julio's Dropbox.

## Index

| Document                                                          | Content                                                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| [01-identity.md](01-identity.md)                                   | Legal identity, founding chronology, brand, name, logo, palette              |
| [02-team.md](02-team.md)                                           | Delivery team, hiring philosophy, public-safe network                        |
| [03-clients-track-record.md](03-clients-track-record.md)           | 🚦 Citability policy + publicly citable track record                          |
| [04-services-business-model.md](04-services-business-model.md)     | Business lines, model constants, AI stance                                   |
| [05-tech-specialties.md](05-tech-specialties.md)                   | Technical specialties proven by GitHub commits                               |
| [06-voice-positioning.md](06-voice-positioning.md)                 | Boutique positioning, voice profile, canonical lines                         |
| [07-web-benchmark.md](07-web-benchmark.md)                         | Benchmark of minimal boutique websites (research 2026-08-02)                 |
| [08-sources.md](08-sources.md)                                     | Pointer to the private source registry                                       |
| [09-target-reader.md](09-target-reader.md)                         | The target reader: Ahorra Más-type retail architect (verified estate)        |
| [annex/doc-copywriter-SKILL.md](annex/doc-copywriter-SKILL.md)     | Frozen copy of the `doc-copywriter` skill                                    |
| `private/` (gitignored)                                            | Full originals: complete client map, contacts, pricing, source registry      |

## Conventions

- **Every fact carries a source.** Facts without an explicit source inherit the
  block's. Recovery detail lives in the private source registry.
- **Certainty grades:** unmarked = verified in a primary document;
  `[INFERRED]` = deduced from indirect evidence (explained); `[PENDING]` = known
  gap worth verifying.
- **Absolute dates** always (`2026-08-02`, never "today").
- **Deliberately excluded** even from private files: national ID numbers, IBANs,
  tax amounts, salaries, and any personal data without business relevance.

## Maintenance

1. When a new company fact is learned, add it to the matching document **with its
   source** and date — sensitive detail goes to `private/`, public-safe summary here.
2. When a fact changes (new client, team change), don't delete the old one: mark
   it as historical. The chronology is part of the value.
3. GitHub links are canonical URLs; everything else (Dropbox paths, Drive fileIds)
   belongs in `private/08-sources.md`.
