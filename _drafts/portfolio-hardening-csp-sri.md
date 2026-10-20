---
title: "Hardening My Portfolio: From Zero Security Headers to A+ (115/100)"
description: How I took a static Jekyll site on GitHub Pages behind Cloudflare from no security headers to Mozilla Observatory A+ with a strict CSP, SRI, and CI guardrails, and the mistakes I made on the way.
categories: [Cybersecurity, Web Security]
tags: [csp, sri, hsts, cloudflare, jekyll, github-actions, appsec]
image:
  path: https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/avatar/social-preview-comic.jpg
  alt: "Portfolio hardening: from zero security headers to A+"
---

> **Draft.** Move this file to `_posts/YYYY-MM-DD-portfolio-hardening-csp-sri.md` when it is ready.
{: .prompt-info }

A portfolio for someone who works in security should be able to pass its own audit. Mine could not: when I checked, **cyphera.my.id sent no security headers at all**. No HSTS, no Content Security Policy, nothing stopping it from being framed by another site.

This post walks through how I fixed that, what broke along the way, and the CI checks that now keep it from regressing.

## The setup

- **Jekyll** (Chirpy theme), built by GitHub Actions and served by **GitHub Pages**
- **Cloudflare** proxy in front of it
- Images on **jsDelivr**, from a separate assets repository
- Third parties: Google Fonts, Giscus comments, Cloudflare Web Analytics (and, at first, Google Analytics)

GitHub Pages cannot set custom response headers. Cloudflare can: **Rules → Response Header Transform Rules**, free plan included. That is where every header in this post lives.

## Step 1: The easy headers

These are low-risk and can go on immediately:

| Header | Value | Why |
|---|---|---|
| `Strict-Transport-Security` | `max-age=2592000` (1 month to start) | Browsers refuse plain HTTP for the domain |
| `X-Frame-Options` | `DENY` | No clickjacking through iframes |
| `X-Content-Type-Options` | `nosniff` | No MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Full URLs stay on the site |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` | Turn off features the site never uses |

I scoped the rule to `http.host eq "cyphera.my.id"` so that the other subdomains (status page, apps, tools) are not affected, and started HSTS at one month because it is hard to undo once browsers have cached it.

## Step 2: CSP in Report-Only mode first

A Content Security Policy that is too strict breaks the site, so I started with `Content-Security-Policy-Report-Only`. The browser reports what it *would* block without blocking it.

I wrote the first policy from the third-party domains I found by scanning 15 pages and the theme's templates. Then I loaded every page in headless Edge and collected the console reports. **The scan found four sources my list had missed:**

1. **Cloudflare Web Analytics**: Cloudflare injects `static.cloudflareinsights.com/beacon.min.js` itself, so it never appears in the site's source.
2. **The PWA service worker** re-fetches Google Fonts with `fetch()`, which falls under `connect-src`, not `font-src`.
3. **Giscus** loads its own stylesheet and calls its API (`style-src` and `connect-src`).
4. **GA4** now posts to `www.google.com/g/collect`.

After adding them, a second scan reported **zero violations on 17 pages**. Only then did I switch to enforcing mode.

### Mistake #1: a header the browser silently ignores

While renaming the header from Report-Only to enforcing, I ended up with **`Content-Security-Policy-Report`**. That is not a real header, so browsers ignore it without any warning. My scan reported "0 violations", which looked like success and was only true because the policy did not exist.

**Lesson:** after changing a security header, check the header itself (`curl -sI`), not just the absence of errors.

## Step 3: The `'unsafe-inline'` problem

With CSP enforced, Mozilla Observatory gave the site **B- (65/100)**:

- CSP with `'unsafe-inline'`: **−20**
- HSTS shorter than 6 months: **−10**
- No Subresource Integrity: **−5**

`'unsafe-inline'` in `script-src` defeats most of CSP's protection against XSS: any injected `<script>` runs. Removing it means the page cannot contain any inline JavaScript:

- 8 inline `<script>` blocks (Giscus loader, search, analytics, album gallery, and my own widgets)
- `onclick=` / `onerror=` attributes
- a `javascript:` URL the theme used to obfuscate the email link

Hashes or nonces would have worked too, but the header lives in Cloudflare while the HTML changes on every deploy, so hashes would drift. I moved every script into `assets/js/custom/*.js` instead. Scripts that need site data use Jekyll front matter so Liquid still renders into them, and event handlers became `addEventListener` calls driven by `data-` attributes.

### Mistake #2: `//` comments and HTML compression

Earlier, this site had broken in a way that taught me to distrust inline scripts. The theme's `compress_html` layout joins each page onto a single line. A `// comment` inside an inline script then comments out **everything after it**. The intro animation and the experience filter silently stopped working in production, while working perfectly in development.

Moving scripts to external files removed that whole class of bug.

### Guardrail: CI fails on inline JavaScript

`tools/check-inline.py` scans the built `_site/` for `<script>` blocks without `src` (JSON data blocks are allowed), `on*=` attributes, and `javascript:` URLs. If anyone adds one, including a future theme update, the build fails before it can break the site under the CSP.

## Step 4: Subresource Integrity, and a jsDelivr trap

SRI pins a third-party file to a hash: if the CDN copy changes, the browser refuses to run it.

```html
<script defer src="https://cdn.jsdelivr.net/npm/dayjs@1.11.18/dayjs.min.js"
        integrity="sha384-..." crossorigin="anonymous"></script>
```

**The trap:** the theme loaded its libraries through jsDelivr's `/combine/` endpoint, which merges several files into one response. That response is generated on the fly, so it has no stable hash to pin. I switched to loading each version-pinned file separately (HTTP/2 makes the extra requests cheap) and wrote `tools/sri.py`, which:

- reads every pinned library URL from the theme's config,
- computes SHA-384 hashes into `_data/sri.yml`,
- runs as `--check` in CI, failing if a hash no longer matches.

**Another limit:** Google Analytics cannot use SRI because its script changes constantly. Since Cloudflare Web Analytics already covered visitor counts, I removed GA. The site lost about 140 KB of JavaScript, the CSP lost six Google domains, and the SRI test started passing.

## Step 5: HSTS to six months

Once everything was stable, HSTS went from one month to six months.

**Result: Mozilla Observatory A+ (115/100), 12 of 12 tests passed.**

## Bonus: a supply-chain lesson from the CDN

Not a header, but it bit me during the same work: **jsDelivr refuses to serve GitHub repositories larger than 50 MB**. My assets repository had grown past that with uncompressed photos, and new files started returning **HTTP 403** ("Package size exceeded the configured limit"), while old cached files kept working. That made it look intermittent.

Compressing the images (album photos from 19.6 MB to 1.2 MB, PNGs to WebP) brought the repository down to about 24 MB. CI now checks every jsDelivr URL the site references and warns when the assets repository passes 40 MB.

## What CI checks now

| Check | Catches |
|---|---|
| `htmlproofer` (blocks deploy) | Broken internal links and images |
| `check-inline.py` | Inline JavaScript that the CSP would block |
| `sri.py --check` | Stale SRI hashes |
| `check-assets.sh` | jsDelivr URLs that are not 200, assets repo near the 50 MB limit |
| `security.txt` workflow | `security.txt` within 30 days of its `Expires` date |
| GitHub Actions pinned to commit SHAs + Dependabot | Tag hijacking of third-party actions |

## Takeaways

1. **Start CSP in Report-Only and scan every page.** Platform-injected scripts (Cloudflare, service workers) will not show up in your source.
2. **Verify the header itself**, not just the absence of violations.
3. **Externalise scripts rather than hashing them** when headers and HTML live in different systems.
4. **Make the rules executable.** A CI check that fails on inline JS is worth more than a note in the README.
5. **Know your CDN's limits.** jsDelivr's 50 MB cap fails quietly.

The full configuration lives in the [site's repository](https://github.com/firmansyahdzakwanarifien/firmansyahdzakwanarifien.github.io), and the live result is on [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory/analyze?host=cyphera.my.id).
