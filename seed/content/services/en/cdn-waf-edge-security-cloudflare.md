---
cta_label: "Let's review your Cloudflare"
excerpt: "Server Startup has been an official [`Cloudflare`](https://www.cloudflare.com/) partner since 2019. We audit, migrate and run `CDN`, `WAF` and edge security, mostly for [e-commerce](/en/e-commerce)."
---

> «Imagine an organization’s network as a castle and the network perimeter as a moat. Once the drawbridge is lowered and someone crosses it, they have free rein inside the castle grounds.» [Cloudflare](https://www.cloudflare.com/learning/access-management/castle-and-moat-network-security/)

We've worked with the [`Cloudflare`](https://www.cloudflare.com/) platform since 2017, two years before Server Startup became an official partner. We audit, migrate and tune [Enterprise](https://www.cloudflare.com/plans/enterprise/) and [Business](https://www.cloudflare.com/plans/business/) accounts, mostly for retail and e-commerce.

Your `Cloudflare` is configured. Are you sure it's configured right? In many organizations nobody dares touch the `WAF` rules. They block something. Nobody remembers what.

We know why each rule is there, because we wrote them, we version them with [`Terraform`](https://developer.hashicorp.com/terraform), and we keep them running in production.

## WAF ≠ security

A firewall is one part of security. The other is knowing why each rule is there, who changed it and what it stopped today. We configure `Cloudflare` as architecture, and every switch on this panel is there for a reason.

- **`WAF` rules, each with a reason.** `Cloudflare`'s managed rules as the base, tuned to your actual attack surface, with your business rules on top. OWASP Top 10, DDoS, bots.
- **Cache and `CDN`.** The cache takes the traffic before it reaches your origin, and response times become predictable. Black Friday included.
- **Zero-downtime migrations.** From Akamai or whatever you run today, without stopping the store.
- **Everything in `Terraform`.** The whole configuration as code, versioned and reviewed. Nothing depends on anyone's memory.
- **Logic next to the user.** `Workers`: we put the first ones into production in 2018, and this whole site runs on them.
- **Daily WAF report.** Every day you get what the `WAF` stopped, which rule fired and what we changed. And traffic, security and origin-health alerts.

## Whoever configures it, maintains it

Once we set up `Cloudflare`, we keep running it: we watch the traffic, adjust rules as attack patterns change, and answer when something degrades.

We've deployed `Cloudflare` for:

> b64:QWxjYW1wbywgRG9vZXJzIFNuZWFrZXJzLCBGb3J1bSBTcG9ydCwgSm9iJlRhbGVudCwgUHVudCBSb21hLCBUb3lz4oCcUuKAnVVzLA==

The platform doesn't end at `CDN` and `WAF`. `Zero Trust`, `Access` or `Stream` can come later; we help you decide which pieces fit, and which don't.

This very site runs on `Workers`, `D1` and `R2`. We take it apart, piece by piece, in [Deconstructing this website](/en/deconstructing).
