# Cyphera — cyphera.my.id

Personal portfolio and blog of **Firmansyah Dzakwan Arifien**, Implementation Engineer focused on
cybersecurity, network infrastructure, and Linux system administration.

**Live site:** <https://cyphera.my.id>

## What's inside

| Section | Source | Notes |
|---|---|---|
| Home / About | `index.html` | Profile, featured work, experience, certifications, skills |
| Certifications | `_data/certifications.yml` | Rendered as medals on the home page |
| Blog | `_posts/` | Certifications, training, and learning notes |
| Projects | `_projects/` | Case studies (Memoir, Si Ngacir, IDN Blue Team capstone) |
| Labs | `_data/labs.yml`, `_tabs/labs.html` | DFIR, forensics, and CTF writeups |
| Album | `_album/` | Event and community photos |
| Milestone | `_tabs/milestone.md` | Timeline of posts and events |

## Stack

- [Jekyll](https://jekyllrb.com) with a customized [Chirpy](https://github.com/cotes2020/jekyll-theme-chirpy) theme
- GitHub Actions → GitHub Pages (`.github/workflows/jekyll.yml`)
- Images served from [firmansyahdzakwanarifien-assets](https://github.com/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets) via jsDelivr
- Comments with [Giscus](https://giscus.app) (GitHub Discussions)

## Run locally

Requires Ruby 3.1+, Bundler, and Node.js 20+.

```bash
git clone --recurse-submodules https://github.com/firmansyahdzakwanarifien/firmansyahdzakwanarifien.github.io.git
cd firmansyahdzakwanarifien.github.io

bundle install
npm install
npm run build          # bundles JS and CSS assets

bundle exec jekyll serve   # http://127.0.0.1:4000
```

`bash tools/run.sh -p` serves the site in production mode.

## Adding content

- **Certification medal:** add an entry to `_data/certifications.yml` (name, issuer, year, badge, cat, icon, url).
- **Post:** add `_posts/YYYY-MM-DD-title.md`; the URL becomes `/posts/title/`.
- **Album:** add `_album/YYYY-MM-DD-title.md` with `photos_base` and a `photos` list; upload the images to the assets repo first.

Inline `<script>` blocks are compressed onto a single line in production, so use `/* */` comments only.

## Deployment

Every push to `main` builds and deploys the site through GitHub Actions.

## Automation

| Workflow | When | What it does |
|---|---|---|
| `jekyll.yml` | push to `main` | Builds and deploys to GitHub Pages |
| `site-checks.yml` | push, PR, weekly | html-proofer on internal links/images, every jsDelivr URL must return 200, assets repo must stay under jsDelivr's 50 MB limit (`tools/check-assets.sh`) |
| `labs-sync.yml` | daily | Adds new Hashnode writeups to `_data/labs.yml` and opens a PR for review (`tools/sync-labs.py`) |
| `security-txt.yml` | weekly | Fails (and emails) when `.well-known/security.txt` is within 30 days of its `Expires` date |

Uptime of the site, its pages, and the projects is monitored at [status.cyphera.my.id](https://status.cyphera.my.id) (Upptime).

## License

Site content © Firmansyah Dzakwan Arifien. The theme code is based on Chirpy by Cotes Chung, released under the [MIT License](LICENSE).
