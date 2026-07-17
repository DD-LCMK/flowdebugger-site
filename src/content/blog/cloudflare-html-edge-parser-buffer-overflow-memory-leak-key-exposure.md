---
title: "Cloudbleed: Cloudflare HTML Parser Out-of-Bounds Read Memory Leak"
meta_title: "Cloudbleed: Cloudflare Out-of-Bounds Read Leak"
description: "A single-character bug in Cloudflare's HTML parser caused edge servers to leak passwords, cookies, and API keys from millions of websites for five months before discovery."
pubDate: 2026-07-17
tags: ["cloudflare", "buffer-over-read", "memory-leak", "data-exposure", "edge-computing"]
slug: "cloudbleed-cloudflare-html-parser-out-of-bounds-read-memory-leak"
---

# Cloudbleed: Cloudflare HTML Parser Out-of-Bounds Read Memory Leak [Status: RESOLVED]

| Field | Value |
| :--- | :--- |
| **Company** | Cloudflare |
| **Date** | February 17, 2017 (discovered); September 22, 2016 (introduced) |
| **Status** | Resolved |
| **Category** | Edge Server Out-of-Bounds Read / Data Exposure Vulnerability |
| **Root Cause** | Buffer over-read in HTML parser caused by equality operator (==) instead of greater-than-or-equal-to (>=) in boundary check, activated by a parser migration that changed the memory buffering model |
| **Operational Impact** | HTTP cookies, authentication tokens, passwords, API keys, and POST bodies from millions of proxied websites leaked through edge server responses for approximately five months; leaked data cached by search engines |
| **Official RCA** | [Cloudflare Incident Report](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/) |

---

### The Incident

On February 17, 2017, a Cloudflare HTML edge parser out-of-bounds read memory leak, colloquially known as Cloudbleed, was discovered by Tavis Ormandy of Google's Project Zero[cite: 7]. Ormandy was performing routine fuzzing tests when he noticed that certain HTTP requests passing through Cloudflare's reverse proxy were returning corrupted web pages containing memory from adjacent requests[cite: 7]. That memory contained sensitive data from other websites' HTTP sessions—passwords, authentication tokens, cookies, API keys, and private messages—all being served to unrelated users in plain text[cite: 7].

The vulnerability had been silently active since September 22, 2016, when Cloudflare deployed its Automatic HTTPS Rewrites feature[cite: 7]. For approximately five months, HTTP responses processed through one of the affected HTML parser features had a chance of leaking memory contents from adjacent sessions[cite: 7]. The flaw was a single-character coding error in the HTML parser's buffer boundary check: an equality operator (`==`) where a greater-than-or-equal-to operator (`>=`) should have been used[cite: 7]. This allowed the parser's read pointer to read past the allocated buffer and return whatever data resided in the adjacent process memory—data that could belong to any other customer whose traffic was being processed by the same physical server[cite: 7].

The leaked data was not confined to the original HTTP responses[cite: 7]. Search engines including Google, Bing, and Yahoo crawled and cached pages containing leaked memory fragments, creating a persistent, indexed record of sensitive data that required coordinated purge operations across multiple search engine operators[cite: 7].

Cloudflare [disabled the three affected features within 47 minutes](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/) of receiving Ormandy's report and [deployed a full global patch in under seven hours](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/)[cite: 7]. The company publicly disclosed the incident on February 23, 2017[cite: 7].

**Timeline of Events:**

- **September 22, 2016** — Cloudflare deploys the Automatic HTTPS Rewrites feature, introducing the vulnerable code path into production. The out-of-bounds read condition becomes exploitable[cite: 7].
- **February 17, 2017** — Tavis Ormandy (Google Project Zero) discovers corrupted pages containing sensitive data during fuzzing tests. He contacts Cloudflare immediately[cite: 7].
- **February 18, 2017, ~00:00 UTC** — Cloudflare begins internal investigation[cite: 7].
- **February 18, 2017, ~00:47 UTC** — Cloudflare disables Email Obfuscation, Server-side Excludes, and Automatic HTTPS Rewrites globally. Memory leak stops within 47 minutes of notification[cite: 7].
- **February 18, 2017, ~07:00 UTC** — Underlying parser bug fully patched and deployed across all edge servers globally[cite: 7].
- **February 18–23, 2017** — Cloudflare coordinates with Google, Bing, and Yahoo to locate and purge cached copies of leaked data from search engine indexes[cite: 7].
- **February 23, 2017** — Cloudflare publishes a [detailed public incident report and post-mortem](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/)[cite: 7].

---

### Systems Affected & Operational Impact

The vulnerability resided in **Cloudflare's edge server HTML parsing pipeline**, specifically in the interaction between a legacy Ragel-based parser and a newer parser called cf-html[cite: 7].

**Affected Features:**
Three Cloudflare features required HTML content to be parsed and modified at the edge before being served to end users[cite: 7]:
- **Email Obfuscation:** Rewrites email addresses in page source to prevent scraping by bots[cite: 7].
- **Server-side Excludes:** Hides specific HTML content from visitors with suspicious IP addresses[cite: 7].
- **Automatic HTTPS Rewrites:** Converts HTTP links to HTTPS within page content to prevent mixed-content warnings[cite: 7].

All three features invoked the HTML parser at the edge. Any website proxied through Cloudflare with at least one of these features enabled was potentially affected[cite: 7].

**Data Exposed:**
When the parser read out of bounds, the edge server returned memory from adjacent requests within its own address space[cite: 7]. Because Cloudflare edge servers process HTTP requests for thousands of different websites simultaneously, this memory could contain data from any customer's active session, including[cite: 7]:
- HTTP cookies and session tokens[cite: 7]
- Authentication credentials and passwords[cite: 7]
- HTTP POST bodies (including form submissions)[cite: 7]
- API keys and OAuth tokens[cite: 7]
- Private messages and user-submitted content[cite: 7]

**What Was Not Leaked:**
Cloudflare confirmed that [customer SSL/TLS private keys were not exposed](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/)[cite: 7]. SSL termination was handled by an isolated NGINX instance whose memory space was separate from the HTML parser's process[cite: 7].

**Search Engine Amplification:**
The leaked memory appeared in HTTP responses that were subsequently crawled and indexed by search engines[cite: 7]. This meant that sensitive data—passwords, tokens, private messages—could be discovered through targeted search queries[cite: 7]. Cloudflare worked with search engine operators to [leave no public index footprint by purging cached pages](https://blog.cloudflare.com/quantifying-the-impact-of-cloudbleed/) containing leaked data before the public disclosure[cite: 7].

**Scope:**
While millions of websites use Cloudflare's reverse proxy, the memory leak was only triggered when the HTML parser was invoked by one of the three affected features[cite: 7]. Cloudflare stated that the greatest period of impact was between February 13 and February 18, 2017, when approximately [one in every 3.3 million HTTP requests](https://blog.cloudflare.com/quantifying-the-impact-of-cloudbleed/) through Cloudflare could have resulted in memory leakage[cite: 7].

---

### The Technical Failure

The vulnerability was a **buffer over-read** (or out-of-bounds read) caused by the interaction between two generations of HTML parsers operating on Cloudflare's edge servers[cite: 7].

**The Parser Architecture:**
Cloudflare used a state machine generated by [Ragel](https://en.wikipedia.org/wiki/Ragel) to parse and transform HTML content at the edge[cite: 7]. Ragel generates C code from a high-level state machine definition, producing efficient but complex parsers[cite: 7]. In parallel, Cloudflare was developing a new internal parser called **cf-html** as a replacement[cite: 7].

**The Latent Bug:**
The Ragel-generated parser contained a boundary check that used an equality operator (`==`) instead of a greater-than-or-equal-to operator (`>=`) when testing whether the read pointer had reached the end of the input buffer[cite: 7]. Under normal conditions—when the buffer pointer advanced by exactly one byte at a time—the `==` check worked correctly[cite: 7]. But when the pointer advanced by more than one byte in a single step (as happens with certain multi-byte HTML constructs), the pointer could skip past the exact boundary value[cite: 7]. The `==` check would evaluate to false, and the parser would continue reading memory beyond the allocated buffer[cite: 7].

**The Activation Trigger:**
This bug had existed in the Ragel parser for years without causing data leakage[cite: 7]. The reason: under the old architecture, the HTML parser operated within NGINX-managed memory buffers[cite: 7]. NGINX's buffer management allocated extra padding after the working buffer, meaning that even when the pointer overshot, it would read harmless padding bytes rather than sensitive data from other requests[cite: 7].

When Cloudflare introduced the **cf-html** parser, the memory buffering model changed[cite: 7]. The new architecture allocated buffers without the same padding guarantees[cite: 7]. Now, when the Ragel parser's pointer read past the boundary[cite: 7]:

1. **It read past the allocated buffer** into adjacent memory on the heap[cite: 7].
2. **That adjacent memory contained live data** from other HTTP requests being processed concurrently on the same edge server[cite: 7].
3. **The parser returned this data** as part of its output, which was then served to the requesting user as part of the HTTP response body[cite: 7].

**The Single-Character Fix:**
The remediation was straightforward: replacing `==` with `>=` in the boundary check[cite: 7]. This ensured that the parser would stop reading regardless of whether the pointer landed exactly on the boundary or overshot it[cite: 7]. The fix was a single-character change in the source code[cite: 7].

**Why It Persisted:**
The vulnerability was active for approximately five months (September 22, 2016, to February 18, 2017) because[cite: 7]:
- The bug produced no crashes, errors, or log entries on the server side[cite: 7].
- The leaked data appeared as random binary noise appended to otherwise normal HTML responses[cite: 7].
- The volume of leaking requests was low relative to total traffic, making statistical detection unlikely[cite: 7].
- The bug only activated when specific sequences of malformed HTML triggered the multi-byte pointer advance in the Ragel parser[cite: 7].

---

### Vendor Response & Evolution

**Immediate Mitigation (47 Minutes):**
Upon receiving Tavis Ormandy's report, Cloudflare's security team began investigating[cite: 7]. Within [47 minutes](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/), they disabled all three features that invoked the vulnerable parser—Email Obfuscation, Server-side Excludes, and Automatic HTTPS Rewrites—globally across all edge servers[cite: 7]. This stopped the memory leak immediately[cite: 7].

**Full Patch (Under 7 Hours):**
Cloudflare engineering deployed a [global fix to the underlying parser bug in under seven hours](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/)[cite: 7]. The three disabled features were subsequently re-enabled with the patched parser[cite: 7].

**Search Engine Coordination:**
Between February 18 and February 23, Cloudflare worked with Google, Bing, Yahoo, and other search engine operators to identify and remove cached copies of HTTP responses that contained leaked memory data[cite: 7]. Cloudflare reported that they identified and purged cached data from search engine indexes before the public disclosure[cite: 7].

**Public Disclosure (February 23, 2017):**
Cloudflare published a [detailed post-mortem](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/) explaining the technical root cause, the scope of the vulnerability, and the remediation steps taken[cite: 7]. The company stated that they found [no evidence of malicious exploitation](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/) prior to the fix[cite: 7].

**Customer Guidance:**
Cloudflare recommended that affected customers reset passwords and enable two-factor authentication as precautionary measures, even though no exploitation evidence was found[cite: 7].

**Structural Improvements:**
In the aftermath, Cloudflare accelerated its migration away from the legacy Ragel parser[cite: 7]. The incident highlighted the risks of operating two parser architectures in parallel with different memory management assumptions, and reinforced the need for memory-safe parsing in edge computing environments[cite: 7].

---

### Engineering Analysis & Historical Comparisons

**Why This Incident Matters:**

The Cloudflare Cloudbleed incident remains one of the most technically significant data exposure events in the history of internet infrastructure[cite: 7]. For security engineers, cloud architects, and operations teams, it surfaces three fundamental lessons[cite: 7]:

1. **Single-Character Bugs Can Have Global Impact:** The root cause was a one-character coding error—`==` instead of `>=`[cite: 7]. This microscopic flaw, hidden in auto-generated C code from a Ragel state machine, was sufficient to leak sensitive data from millions of websites for five months[cite: 7]. The incident demonstrates that critical vulnerabilities can exist below the threshold of code review visibility, especially in generated or transpiled code where the relationship between the source definition and the compiled output is non-obvious[cite: 7].

2. **Parser Migrations Create Invisible Failure Surfaces:** The bug existed in the Ragel parser for years without causing harm[cite: 7]. It only became exploitable when the cf-html parser migration changed the underlying memory management model[cite: 7]. This pattern—where a latent defect becomes active due to an unrelated architectural change—is one of the most dangerous failure modes in software engineering[cite: 7]. Neither the old parser nor the new parser was individually defective; the vulnerability existed only in their interaction[cite: 7].

3. **Shared Infrastructure Amplifies Exposure:** Cloudflare's value proposition depends on serving millions of websites through shared edge servers[cite: 7]. The same architectural decision that makes Cloudflare efficient—processing requests for thousands of websites on the same physical server—also meant that a memory leak in one customer's parsing path could expose another customer's authentication tokens[cite: 7]. This is a fundamental tension in multi-tenant edge computing: the efficiency of sharing creates the blast radius of leaking[cite: 7].

**Historical Parallels:**

- **[Heartbleed (CVE-2014-0160, April 2014)](./heartbleed-openssl-buffer-overread.md):** The Cloudbleed incident is directly compared to Heartbleed, the OpenSSL buffer over-read vulnerability that allowed attackers to read up to 64KB of server memory per request[cite: 7]. Both vulnerabilities involved reading memory beyond an allocated buffer due to missing bounds checks[cite: 7]. While multi-tenant leaks expose active session memory across distinct domains, their systemic layout risks share operational attributes with major edge platform structural errors, such as the [Facebook BGP Outage](./facebook-dns-bgp-prefix-route-withdrawal-physical-server-lockout.md).

- **Facebook Access Token Exposure (September 2018):** A vulnerability in Facebook's "View As" feature exposed access tokens for approximately 50 million user accounts. Like Cloudbleed, the exposure was caused by a logic error that leaked authentication state—but Facebook's incident was confined to a single platform, whereas Cloudbleed affected the authentication state of every website proxied through Cloudflare's affected edge servers.

- **[Fastly CDN Global Outage (June 2021)](./fastly-global-cdn-configuration-outage.md):** While not a data leak, Fastly's global outage demonstrated how a single configuration error in a CDN's edge infrastructure can cascade globally[cite: 7]. Both the Fastly breakdown and Cloudbleed highlight the systemic risks of CDN monocultures: when infrastructure is sufficiently centralized, any flaw—whether availability or confidentiality—affects a disproportionate share of the internet[cite: 7].

The common thread across these incidents is the **asymmetry between defect severity and defect visibility**[cite: 7]. The most dangerous infrastructure vulnerabilities are not the ones that cause crashes—they are the ones that silently corrupt data integrity or leak sensitive information without generating any operational signal[cite: 7]. Cloudbleed ran for five months precisely because the bug produced no errors, no crashes, and no log entries[cite: 7]. It was only discovered because a single researcher happened to notice binary noise in an HTTP response[cite: 7].

---

### References

*   [Cloudflare Official Incident Report — Post-Mortem and Root Cause](https://blog.cloudflare.com/incident-report-on-memory-leak-caused-by-cloudflare-parser-bug/)
*   [Google Project Zero — Issue 1139 Tracking Page](https://bugs.chromium.org/p/project-zero/issues/detail?id=1139)
*   [Cloudflare Official — Quantifying the Impact of Cloudbleed](https://blog.cloudflare.com/quantifying-the-impact-of-cloudbleed/)
*   [Ragel Parser State Machine Language Documentation](https://en.wikipedia.org/wiki/Ragel)
*   [Wikipedia — Cloudbleed Data Exposure Incident Overview](https://en.wikipedia.org/wiki/Cloudbleed)
*   [Wikipedia — Heartbleed Vulnerability Details (CVE-2014-0160)](https://en.wikipedia.org/wiki/Heartbleed)

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "headline": "Cloudbleed: Cloudflare HTML Parser Out-of-Bounds Read Memory Leak",
  "description": "A single-character bug in Cloudflare's HTML parser caused edge servers to leak passwords, cookies, and API keys from millions of websites for five months before discovery.",
  "datePublished": "2026-07-17",
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