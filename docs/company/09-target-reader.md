# The target reader (persona)

> Defined by Julio (2026-08-03): *"My target is an experienced software architect —
> the kind of person who built everything Ahorra Más has now."*
> Field research: 2026-08-04. Normative for all copy: `doc-copywriter` skill §7
> (frozen copy in [annex/doc-copywriter-SKILL.md](annex/doc-copywriter-SKILL.md)).

## The archetype

A software architect with 15–25 years of production scars, at a mid-size Spanish
retailer. They personally stood up the estate a chain like Ahorra Más operates
today, town by town. Not a desk-bound CIO: they review PRs, log into the
Cloudflare console, and remember why every WAF rule is there (or it pains them
not to).

## The reference estate: Ahorra Más (verified)

| Fact | Value | Source |
| ---- | ----- | ------ |
| Company | Proximity chain, 40+ years, ~275 stores in Madrid and Castilla-La Mancha, ~12,000 employees | [ecommerce-news.es](https://ecommerce-news.es/ahorramas-amplia-su-ecommerce-a-cuatro-localidades-madrilenas/), [Alimarket](https://www.alimarket.es/alimentacion/noticia/322654/ahorramas-acelera-la-digitalizacion-de-sus-supermercados) |
| Storefront | **Salesforce Commerce Cloud (Demandware)**: 318 `demandware` references in the HTML, `dwanonymous_*` cookie, `x-dw-request-base-id` header | Own `curl` fingerprint (2026-08-04) |
| Edge | **Cloudflare** (`server: cloudflare`, `cf-cache-status`) | Same |
| Retail media | Citrus Ads (`citrusConversionValue`) | Same |
| E-commerce | Gradual town-by-town rollout: Alcalá, Getafe, Las Rozas, Alcobendas, S.S. de los Reyes, Torrejón | ecommerce-news.es |
| Rest of the estate (sector-inferred) | ERP, store POS, promotions engine, logistics/warehouse, data platform under construction | Sector press |

Key reading: **the reader's estate is literally Server Startup's home turf**
(e-commerce platform + Cloudflare in front + store/warehouse integrations + data).
No need to explain their job to them; show in two sentences that we've lived it.

## Their week (the pains)

The promotion that reached the web but not the POS. Stock that never quite matches
between store, warehouse and online. The capacity question before the campaign
peak. The meeting where a vendor said "assessment phase". The junior rotated onto
their account without asking.

## Their real alternatives (Dunford)

Not our competitors: **"we do it in-house"** or **"we do nothing"**. Every page
must quietly answer *why not in-house*: senior depth on demand, without headcount,
from people who have operated the same estate and answer personally.

## Triggers

**Trust**: named tools with versions, un-round numbers, admitted limits, prose
that front-loads information in the first two words (Nielsen's F-pattern),
verifiable claims.

**Close-tab**: "soluciones integrales", trademarked methodologies, benefit-speak
explaining their own job to them, any sentence a colleague would never say aloud.

## Things this reader says over coffee

- "El dato de stock no cuadra y nadie sabe dónde se pierde."
- "Otro partner que me manda un junior a aprender con mi presupuesto."
- "El WAF lo configuró alguien que ya no está en la empresa."
- "Me sobran licencias y me faltan manos."

## Writing implications (operational summary)

1. Meeting test: every sentence, said verbatim to this person, without blushing.
2. One falsifiable fact per section; one lived retail detail per page.
3. Answer "why wouldn't I do this with my own team", never "why not Accenture".
4. Zero em-dashes in ES, max one "X: Y" per page, varied rhythm (skill §8).
5. Client anonymization ([03-clients-track-record.md](03-clients-track-record.md))
   works in our favor: "a ~275-store chain" sounds like their own house.
