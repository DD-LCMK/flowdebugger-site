---
title: "Cloudflare June 21 2022 Outage Explained: How a BGP Policy Reordering Cascaded to Drop 50% of Traffic"
meta_title: "Cloudflare 2022 Outage: BGP Route Withdrawal"
description: "An automated BGP policy route deployment on June 21, 2022, triggered a route withdrawal prefix rejection cascade that dropped 50% of Cloudflare traffic."
pubDate: "2026-07-15"
tags: ["cloudflare", "bgp", "networking", "service-outage", "incident-analysis"]
slug: "cloudflare-bgp-routing-outage-2022"
---

# Cloudflare June 21 2022 Outage Explained: How a BGP Policy Reordering Cascaded to Drop 50% of Traffic [Status: RESOLVED]

### The Incident
| Field | Value |
| :--- | :--- |
| **Company** | Cloudflare |
| **Date** | June 21, 2022 |
| **Status** | RESOLVED |
| **Category** | BGP Policy Route Withdrawal Prefix Rejection Cascade |
| **Root Cause** | Automated BGP policy reordering withdrawing prefix advertisements |
| **Operational Impact** | Drop of roughly 50% of global traffic during peak window |
| **Official RCA** | [Cloudflare RCA Post-Mortem](https://blog.cloudflare.com/post-mortem-on-june-21-2022-outage/) |

On June 21, 2022, Cloudflare experienced a significant global outage that halted access to websites and services routing traffic through its network. The disruption was caused by an automated Border Gateway Protocol (BGP) routing update that inadvertently withdrew IP prefixes from advertisement, preventing upstream Internet Service Providers (ISPs) from locating Cloudflare routes. The incident dropped approximately [50%](https://blog.cloudflare.com/post-mortem-on-june-21-2022-outage/) of Cloudflare's global traffic at its peak.

*   **2022-06-21 06:27 UTC**: Automated BGP policy configurations are pushed to Multi-Colo PoP (MCP) routers.
*   **2022-06-21 06:32 UTC**: System monitors detect global route advertisements withdrawing, dropping network paths.
*   **2022-06-21 07:42 UTC**: Engineers complete a manual rollback of the BGP policy update, restoring traffic flows.

### Systems Affected & Operational Impact
The outage directly impacted Cloudflare's Multi-Colo PoP (MCP) router distribution networks. These systems are designed to handle traffic workloads across localized data centers. When BGP advertisements were withdrawn, upstream Tier-1 ISPs rejected the routes to Cloudflare. Consequently, DNS resolution failed, API gateways timed out, and [50 percent](https://blog.cloudflare.com/post-mortem-on-june-21-2022-outage/) of global requests dropped.

### The Technical Failure
The incident originated from a scheduled update to Cloudflare's internal configuration engine that manages BGP routing tables. Border Gateway Protocol utilizes policy maps to advertise IP subnets (prefixes) to the public internet. During the automated deployment, a structural change reordered BGP policy rules on the MCP routers. The reordering incorrectly positioned a generic prefix filtration rule before the specific network advertisements. As the routers parsed the updated table sequentially, the filter rejected the subnets and triggered a massive route withdrawal. Lacking reachable paths, upstream peers closed routing sockets to Cloudflare data centers, dropping network availability.

### Vendor Response & Evolution
Cloudflare's operations center detected the failures and executed a manual config rollback to revert the BGP policy tables to a verified state. To prevent recurrent routing drops, Cloudflare modernized its deployment engine to implement staged, staggered BGP updates across routing sectors rather than global updates. The company also revised its automated validation parser to run simulations of policy table evaluations before pushing configuration payloads to MCP fleets.

### Engineering Analysis & Historical Comparisons
The Cloudflare BGP withdrawal illustrates the fragility of central configuration orchestration in globally distributed Anycast networks. In Anycast networks, because multiple physical nodes share the same IP space, route withdrawals propagate instantly to border gateways. This incident shares failure mechanisms with the October 2021 Facebook BGP collapse, where configuration errors similarly isolated data centers from Tier-1 peering exchanges. To isolate these errors, network architects must execute configuration changes in sandboxed routing zones.

### References
*   [Cloudflare Post-Mortem Report](https://blog.cloudflare.com/post-mortem-on-june-21-2022-outage/)
*   [APNIC Routing Incident Analysis](https://blog.apnic.net/2022/06/24/cloudflare-bgp-incident-analysis/)

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Cloudflare June 21 2022 Outage Explained: How a BGP Policy Reordering Cascaded to Drop 50% of Traffic",
  "description": "An automated BGP policy route deployment on June 21, 2022, triggered a route withdrawal prefix rejection cascade that dropped 50% of Cloudflare traffic.",
  "datePublished": "2026-07-15",
  "author": {
    "@type": "Organization",
    "name": "ErrorLedger"
  },
  "about": {
    "@type": "Thing",
    "name": "cloudflare"
  }
}
</script>
