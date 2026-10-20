# Panduan Pengelolaan cyphera.my.id

Panduan ini untuk mengelola isi dan fitur situs. Folder `docs/` tidak ikut di-build, jadi file ini hanya ada di repo.

Setiap push ke `main` otomatis di-build dan di-deploy (sekitar 2 menit). Kalau ada link atau gambar internal yang rusak, deploy berhenti dan Anda mendapat email dari GitHub.

---

## Daftar isi

1. [Struktur singkat](#1-struktur-singkat)
2. [Menambah post](#2-menambah-post)
3. [Sertifikat, experience, dan profil](#3-sertifikat-experience-dan-profil)
4. [Proyek dan album](#4-proyek-dan-album)
5. [Labs](#5-labs)
6. [CTF](#6-ctf)
7. [Homelab](#7-homelab)
8. [Widget data harian](#8-widget-data-harian)
9. [Command palette, pintasan, terminal, dan tema](#9-command-palette-pintasan-terminal-dan-tema)
10. [Aturan JavaScript, CSP, dan SRI](#10-aturan-javascript-csp-dan-sri)
11. [Gambar dan repo assets](#11-gambar-dan-repo-assets)
12. [Menjalankan di lokal dan troubleshooting](#12-menjalankan-di-lokal-dan-troubleshooting)
13. [Kontak dan traktir kopi](#13-kontak-dan-traktir-kopi)
14. [Kartu preview sosial media](#14-kartu-preview-sosial-media)
15. [Performa dan aksesibilitas](#15-performa-dan-aksesibilitas)

---

## 1. Struktur singkat

| Yang ingin diubah | File |
|---|---|
| Bio, ringkasan hero, skill, pendidikan, bahasa, kontak | `_data/profile.yml` |
| Pengalaman kerja | `_data/experience.yml` |
| Medali sertifikasi | `_data/certifications.yml` |
| Writeup di Labs | `_data/labs.yml` |
| Soal CTF | `_data/ctf.yml` |
| Topologi homelab | `_data/homelab.yml` |
| Tools di sidebar | `_data/tools.yml` |
| Post | `_posts/` |
| Proyek (case study) | `_projects/` |
| Album foto | `_album/` |
| Layout halaman utama | `index.html` |

Halaman utama, `/cv/`, terminal, command palette, dan schema SEO semuanya membaca file `_data/` yang sama, jadi cukup diubah di satu tempat.

---

## 2. Menambah post

**Cara cepat:**

```bash
bash tools/new-post.sh "Judul Post"            # post biasa
bash tools/new-post.sh "Fortinet NSE 6" --cert # post sertifikasi
```

Skrip ini membuat `_posts/YYYY-MM-DD-judul-post.md` dengan front matter siap edit. URL-nya nanti `/posts/judul-post/`.

**Isi front matter yang penting:**

```yaml
---
title: "Judul Post"
date: 2026-10-20 10:00:00 +0700
description: Satu-dua kalimat untuk preview dan hasil pencarian.
categories: [Learning, Cybersecurity]   # maksimal 2 tingkat
tags: [linux, wazuh]                    # huruf kecil
image:
  path: https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/posts/nama-gambar.webp
  alt: "Deskripsi gambar"
# opsional:
pin: true          # tampil di atas daftar Achievements
math: true         # aktifkan MathJax
mermaid: true      # aktifkan diagram Mermaid
published: false   # simpan sebagai draft
---
```

**Yang terjadi otomatis setelah push:**
- Post muncul di Achievements, Milestone, pencarian, RSS, dan sitemap.
- Post muncul di **command palette** (`Ctrl+K`), grup "Posts".
- **Kartu preview** (gambar saat link dibagikan) dibuat otomatis oleh workflow `og-images.yml` beberapa menit setelah push (bagian 14).
- Heading `##` dan `###` mendapat anchor `#`. Klik anchor itu untuk menyalin link ke bagian tersebut.
- Progress bar baca muncul otomatis.

**Catatan:** jangan menulis `<script>` atau atribut `onclick=` di dalam post. CSP memblokirnya dan CI akan gagal (lihat bagian 10).

---

## 3. Sertifikat, experience, dan profil

**Sertifikat baru (medali di halaman utama):**
1. Buat post-nya: `bash tools/new-post.sh "Nama Sertifikat" --cert`.
2. Tambahkan entri di `_data/certifications.yml`:

```yaml
- name: NSE 6 — FortiWeb
  issuer: Fortinet
  year: 2026
  badge: NSE 6          # teks di medali, pendek
  cat: security         # security | infrastructure | devops (menentukan warna)
  icon: fas fa-shield-halved
  url: /posts/nama-file-post-tanpa-tanggal/
```

Medali, CV, terminal (`certs`), command palette, dan schema SEO langsung ikut terisi.

**Experience:** tambahkan entri di **paling atas** `_data/experience.yml` (urutan = tampilan):

```yaml
- role: Nama Peran
  company: Nama Perusahaan
  period: Jan 2027 — Present
  cat: security           # security | infrastructure | devops | community | research
  badge: Security         # label di kartu
  desc: Satu kalimat tentang tanggung jawab dan hasil.
```

**Profil:** semua teks hero, bio CV, skill, pendidikan, dan kontak ada di `_data/profile.yml`. Field `summary` dipakai di hero (pendek), sedangkan `bio` dipakai di CV dan terminal (lengkap).

---

## 4. Proyek dan album

**Proyek:** buat `_projects/YYYY-MM-DD-nama.md`. Front matter mengikuti contoh di `_projects/2026-10-09-memoir.md`. URL-nya `/projects/nama/`. Kalau perlu tampil di "Featured Work" halaman utama, kartunya ditulis manual di `index.html` (bagian `<!-- Featured work -->`).

**Album:** buat `_album/YYYY-MM-DD-nama-acara.md`:

```yaml
---
title: Nama Acara
date: 2026-11-01 19:00:00 +0700
description: Satu kalimat.
featured_image:
  path: "https://cdn.jsdelivr.net/gh/.../blog/img/album/posts/nama-folder/foto1.jpg"
  alt: Deskripsi
photos_base: "https://cdn.jsdelivr.net/gh/.../blog/img/album/posts/nama-folder/"
photos:
  - path: foto1.jpg
    alt: Deskripsi untuk pembaca layar
    caption: Keterangan di bawah foto
event: Nama acara
location: Kota / tempat
tags: [community]
---
```

Unggah fotonya dulu ke repo assets (lihat bagian 11), maksimal 1600 px.

---

## 5. Labs

**Otomatis dari Hashnode:** setiap hari pukul 08.00 WIB, workflow `labs-sync.yml` membaca RSS `blog.cyphera.my.id`. Kalau ada writeup baru (judul memuat HTB, picoCTF, CyberDefenders, TryHackMe, CVE, write-up, forensics, dan sejenisnya), workflow membuka **pull request** berisi entri baru di `_data/labs.yml`.
1. Buka PR "Add new writeups to Labs" di GitHub.
2. Rapikan `summary` (dari RSS biasanya terpotong), isi `tools`, dan cek `kind` serta `difficulty`.
3. Merge. Situs ter-deploy otomatis.

Untuk menjalankannya sekarang tanpa menunggu: GitHub → Actions → **Labs sync** → Run workflow.

**Manual:** tambahkan entri di `_data/labs.yml`. Format dan nilai `kind` dijelaskan di komentar bagian atas file.

---

## 6. CTF

Halaman `/ctf/` memeriksa flag dengan membandingkan **hash SHA-256**. Flag aslinya tidak pernah disimpan di halaman CTF.

**Lokasi flag saat ini:**

| # | Lokasi | File |
|---|---|---|
| 1 | Source halaman utama (`<template id="ctf-note">`) | `index.html` |
| 2 | Komentar di `robots.txt` | `assets/robots.txt` |
| 3 | Komentar di `security.txt` | `.well-known/security.txt` |
| 4 | Terminal: `ls -a` lalu `cat .flag` (disimpan base64) | `assets/js/custom/terminal.js` |
| 5 | EXIF `ImageDescription` avatar komik | repo assets: `blog/img/avatar/avatar-popout-comic.webp` |

**Mengganti atau menambah flag:**
1. Taruh flag baru (format `cyphera{...}`) di tempat persembunyiannya.
2. Hitung hash-nya:
   ```bash
   python3 tools/ctf-hash.py 'cyphera{flag_baru}'
   ```
3. Tambahkan atau ubah entri di `_data/ctf.yml` (`id`, `title`, `category`, `points`, `hint`, `hash`).

Kalau flag lama diganti, pengunjung yang sudah menyelesaikannya tetap tercatat selesai di browser mereka, karena progres disimpan per `id`.

Untuk flag 5: menulis ulang metadata EXIF bisa dengan `exiftool -ImageDescription="..." file.webp`. Setelah push ke repo assets, bersihkan cache jsDelivr (bagian 11).

---

## 7. Homelab

Halaman `/homelab/` (`_tabs/homelab.html`) sudah siap tapi masih `published: false`.

1. Isi `_data/homelab.yml`. Contoh lengkap ada di komentar file itu:
   - `nodes`: `id`, `label`, `icon`, `zone`, posisi `x`/`y` di kanvas 800 × 460, `role`, dan `details`.
   - `links`: `from`, `to`, dan `label` (opsional).
2. Ubah `published: false` menjadi `published: true` di `_tabs/homelab.html`.
3. Push. Halaman muncul di sidebar setelah Labs dan otomatis masuk command palette.

Pilihan `icon`: `server`, `shield-halved`, `network-wired`, `cloud`, `desktop`, `database`, `eye`, `router`, `laptop`, `hard-drive`, `wifi`, `lock`, `chart-line`, `box`. Untuk menambah ikon lain, masukkan kode glyph Font Awesome-nya di `GLYPHS` dalam `assets/js/custom/homelab.js`.

---

## 8. Widget data harian

Workflow `data-refresh.yml` berjalan setiap hari pukul 07.30 WIB, menjalankan `tools/refresh-data.py`, meng-commit data yang berubah, lalu memicu deploy.

| Widget | Data | Tampil di |
|---|---|---|
| Threat Watch (CVE dari CISA KEV) | `_data/kev.json` | Labs |
| Open Source Activity (heatmap dan repo GitHub publik) | `_data/github.json` | Halaman utama |
| This Site's Security (nilai Mozilla Observatory dan header) | `_data/scorecard.json` | Halaman utama |

- **Refresh manual:** GitHub → Actions → **Data refresh** → Run workflow, atau jalankan `python3 tools/refresh-data.py` di lokal lalu commit.
- Kalau satu sumber gagal (misalnya API sedang down), data sebelumnya tetap dipakai dan sumber lain tetap diperbarui.
- Widget dipasang lewat include, jadi bisa dipindah ke halaman mana saja:
  ```liquid
  {% include widgets/threat-watch.html limit=5 %}
  {% include widgets/github-activity.html %}
  {% include widgets/scorecard.html %}
  ```

---

## 9. Command palette, pintasan, terminal, dan tema

**Command palette** (`Ctrl+K` / `⌘K`, atau tombol di topbar). Datanya dari `assets/js/data/palette.json`, yang dibuat saat build dari halaman, proyek, Labs, sertifikat, dan post. Konten baru ikut masuk otomatis.
- Menambah **aksi** baru: array `ACTIONS` di `assets/js/custom/command.js`.

**Pintasan keyboard** (`?` untuk melihat daftarnya):
- `g` lalu `h` / `l` / `p` / `c` / `a` / `m` / `f` / `k`: pindah ke Home, Labs, Projects, CV, Album, Milestone, CTF, Contact.
- `d`: light/dark, `x`: tema hacker, `` ` ``: terminal.
- Menambah rute: objek `ROUTES` di `command.js`.

**Terminal** (`` ` ``): perintahnya ada di objek `COMMANDS` dalam `assets/js/custom/terminal.js`. Tambahkan `hidden: true` agar perintah tidak tampil di `help`.

**Tema hacker:** gayanya di `_sass/pages/_hacker.scss`, togglenya di `assets/js/custom/theme-variant.js`. Bisa diaktifkan dengan `x`, palette, atau `theme hacker` di terminal. Pilihan tersimpan di browser pengunjung.

---

## 10. Aturan JavaScript, CSP, dan SRI

Situs dikirim dengan **Content Security Policy** dari Cloudflare (Rules → **Security headers**) **tanpa** `'unsafe-inline'` untuk skrip. Artinya:

- **Dilarang:** blok `<script>` inline, atribut `onclick=`/`onerror=`/dll., dan URL `javascript:`.
- **Boleh:** `<script type="application/json">` atau `application/ld+json` untuk data.
- **Caranya:** taruh skrip di `assets/js/custom/nama.js` (tambahkan front matter `---\n---` kalau perlu Liquid), lalu muat dengan:
  ```html
  <script defer src="{{ '/assets/js/custom/nama.js' | relative_url }}?v={{ site.time | date: '%s' }}"></script>
  ```
  Event dipasang dengan `addEventListener`. Untuk kebutuhan umum sudah ada atribut `data-print` (cetak halaman) dan `data-hide-on-error` (sembunyikan gambar yang gagal dimuat).
- CI (`tools/check-inline.py`) **gagal** kalau menemukan JavaScript inline.

**Domain eksternal baru** (misalnya embed atau analytics baru) harus ditambahkan ke CSP di Cloudflare pada directive yang sesuai (`script-src`, `connect-src`, `img-src`, `frame-src`). Kalau tidak, browser memblokirnya.

**SRI:** library jsDelivr di `_data/origin/cors.yml` dimuat dengan hash integritas dari `_data/sri.yml`. Setelah mengubah versi library di `cors.yml`:
```bash
python3 tools/sri.py
```
CI (`python3 tools/sri.py --check`) gagal kalau hash tidak cocok lagi.

---

## 11. Gambar dan repo assets

Gambar disajikan dari repo `firmansyahdzakwanarifien-assets` lewat jsDelivr:
`https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/...`

- **Kompres dulu:** foto maksimal 1600 px (JPG kualitas sekitar 80), screenshot dan sertifikat ke **WebP**.
- **Buat varian 640 px (wajib untuk gambar post dan album):** template memakai `nama-640.ext` lewat `srcset` agar HP mengunduh versi kecil. Setelah menambah gambar di `blog/img/posts/` atau `blog/img/album/`, jalankan dari repo situs lalu commit repo assets:
  ```bash
  python3 tools/make-variants.py ../firmansyahdzakwanarifien-assets
  ```
  Kalau lupa, `site-checks` gagal karena URL `-640` mengembalikan 404.
- **Batas 50 MB:** jsDelivr menolak (403) repo yang lebih besar dari 50 MB. CI memberi peringatan di atas 40 MB.
- **Mengganti file dengan nama yang sama:** jsDelivr menyimpan cache file lama. Bersihkan dengan:
  ```bash
  curl https://purge.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/path/file.webp
  ```
  atau pakai nama file baru.
- **Urutan push:** push repo assets **dulu**, baru repo situs yang merujuk gambarnya.

---

## 12. Menjalankan di lokal dan troubleshooting

```bash
bundle install && npm install && npm run build
bundle exec jekyll serve        # http://127.0.0.1:4000
```

Cek yang sama seperti di CI:

```bash
bundle exec jekyll build
bundle exec htmlproofer _site --disable-external
python3 tools/check-inline.py _site
python3 tools/sri.py --check
bash tools/check-assets.sh _site
```

| Gejala | Penyebab umum |
|---|---|
| Fitur JS tidak jalan di situs live | Skrip inline atau domain baru diblokir CSP. Buka DevTools → Console, cari pesan "Content Security Policy" |
| Gambar baru 403 | Repo assets melewati 50 MB |
| Gambar lama masih tampil | Cache jsDelivr; purge (bagian 11) |
| Deploy tidak jalan setelah commit bot | Commit `GITHUB_TOKEN` tidak memicu workflow; `data-refresh` sudah memicu deploy sendiri |
| `security.txt expiry` gagal | `Expires` di `.well-known/security.txt` kurang dari 30 hari lagi; perpanjang (maksimal 1 tahun) |

---

## 13. Kontak dan traktir kopi

**Halaman `/contact/`** (`_tabs/contact.html`): daftar saluran dari `links` di `_data/profile.yml`, tombol salin email, dan form "Write a message". Form ini **tidak mengirim apa pun dari situs**: ia membuka aplikasi email pengunjung dengan subjek `[Topik] Nama (Organisasi)` dan isi pesan yang sudah terisi (`assets/js/custom/contact.js`). Topik "Security report" menampilkan petunjuk ke `security.txt`. Pilihan topik bisa diubah langsung di `<select name="topic">`.

**Traktir kopi:** isi username di `_data/profile.yml`:

```yaml
support:
  trakteer: usernameanda   # https://trakteer.id/usernameanda (QRIS, GoPay, OVO, DANA, ShopeePay, bank)
  kofi: usernameanda       # https://ko-fi.com/usernameanda (PayPal, kartu, internasional)
```

Setelah diisi, tombolnya otomatis muncul di halaman utama (bagian Connect), halaman Contact, command palette, dan perintah `coffee` di terminal. Kosongkan untuk menyembunyikan. Tidak ada skrip pihak ketiga yang dimuat, jadi CSP tidak perlu diubah.

---

## 14. Kartu preview sosial media

Setiap post dan proyek mendapat kartu 1200×630 (judul, kategori, tanggal, avatar komik) di `assets/img/og/<collection>-<slug>.jpg`. `_includes/head.html` memakainya sebagai `og:image` dan `twitter:image` menggantikan gambar post.

- **Otomatis:** workflow `og-images.yml` berjalan saat `_posts/` atau `_projects/` berubah, membuat kartu yang baru atau yang judulnya berubah, commit, lalu deploy.
- **Manual / lokal:** `python3 tools/og-image.py` (butuh `pillow` dan `pyyaml`); `--force` untuk membuat ulang semua.
- **Mengubah desain:** edit `card()` di `tools/og-image.py` lalu naikkan `VERSION` supaya semua kartu dibuat ulang. Font ada di `tools/fonts/` (lisensi OFL).
- **Menguji tampilan saat dibagikan:** LinkedIn Post Inspector (linkedin.com/post-inspector) juga memaksa LinkedIn membaca ulang kartu.

---

## 15. Performa dan aksesibilitas

- **Warna teks:** pakai token `var(--muted)` / `var(--accent)` (halaman utama) atau `var(--text-muted-color)` (tema). Token ini sudah memenuhi kontras WCAG AA (≥ 4,5:1) di mode terang dan gelap. Jangan meredupkan teks dengan `opacity`, karena kontrasnya turun diam-diam.
- **Heading:** satu `<h1>` per halaman (dari layout), bagian memakai `<h2>`, isi kartu `<h3>`. Widget menerima parameter `heading=2` bila diletakkan langsung di bawah `<h1>`.
- **Gambar besar di atas lipatan:** jangan di-lazy-load. Header post sudah otomatis `fetchpriority="high"`. Gambar lain di konten otomatis lazy.
- **Font:** dimuat dengan `display=optional` (tidak ada lompatan layout saat font datang terlambat).
- **Analytics:** hanya Cloudflare Web Analytics. Google Analytics dimatikan di `_config.yml` (`analytics.google.id` kosong); kalau diaktifkan lagi, domain Google harus kembali ditambahkan ke CSP.
- **Ukur ulang:** `npx lighthouse https://cyphera.my.id/ --view` atau PageSpeed Insights.
