# Services and business model

> Curated public version. Pricing mechanics, negotiation levers and per-deal detail
> live in `private/04-services-business-model.md` (gitignored).

## The two real lines of business

### 1. Senior systems engineering for enterprise retail

End-to-end delivery with autonomy and judgement for a large retail client,
covering the website's four verticals:

| Vertical (web) | Real work behind it |
| -------------- | ------------------- |
| Greenfield engineering / critical systems | Ocado OSP middleware, Java/Spring backends, serverless GCF, feed cryptography |
| Systems integration | Apache Camel platform (JAWA), Smart V2 transmissions hub, ESB interfaces, own Camel component |
| Big Data & Cloud Analytics | dbt/BigQuery platform (111 models / 1646 tests), Digital Ticket, Real-Time Sales, LookML |
| E-commerce / SAP | 15+ years hybris/SAP Commerce; Ocado OSP; consultancy for other retailers via partner channels |

Engagement forms observed: fixed-scope project orders with estimation sheets,
incremental extensions, and a standing hours pool for continuous GCP platform
administration.

### 2. Cloudflare partner + expert edge advisory

- Subscription sale/renewal (Enterprise, Business) sized by domains and traffic,
  often with Grupo Seidor as implementer.
- Three-stage service (from the proposal template): **initial setup and go-live
  (PoC + GoLive) → support and monitoring → expert advisory**, with "an alerting
  system aimed at early detection … and a genuinely proactive, open experience for
  transferring knowledge".
- Literal value proposition: "reduce the involvement required from the client's
  technical staff … **without undermining their autonomy**. And the peace of mind
  of knowing you are protected and able to react."
- Day-to-day reality: security/traffic/health-check alerting and daily WAF
  reporting for client domains.

## Model constants (2022 → 2026)

- **Senior-only**: "We don't hire junior profiles" (2025 deck).
- **Deliberately small**: "Limited headcount. The ambition is to keep productivity
  and quality. 'We can't take every project.'"
- **E2E with minimal client management** — the client testimonial says it better
  than any slogan (see [03-clients-track-record.md](03-clients-track-record.md)).
- **Knowledge transfer as part of the service**, not as a threat.
- **Technical honesty in proposals**: real limitations are discussed (e.g. IP
  geolocation accuracy, VPNs/proxies) instead of hidden.
- **2026 goals** (deck): "Become the standard-bearer of performance and process
  optimization" and "become de-facto experts in dbt".

## AI stance

From the [manifesto](../../reference/legacy/docs/ai-manifesto.txt) (the basis of
the "Augmented Architects" positioning):

1. Pivot from production to **governance** ("Guarantor of Digital Integrity").
2. Modern *secure-by-design* foundations.
3. **"Sell certainty and responsibility, not hours."**
4. Roles as "Augmented Architects" with an AI-code audit protocol:
   **"We sign the code."**

> "AI won't replace you. It will replace the consultants who keep selling code by
> the kilo."

Evidence of real practice (not just discourse): supervised AI-agent commits in
[es-ares-ecom-gcf-middleware](https://github.com/auchan-retail-spain/es-ares-ecom-gcf-middleware);
the agent-configuration repo
[awesome-serverstartup-skills](https://github.com/julioarguello/awesome-serverstartup-skills);
the FuSeMe ecosystem (VLM document pipeline on Cloudflare Workers AI).
