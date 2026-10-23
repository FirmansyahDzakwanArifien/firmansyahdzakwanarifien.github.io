---
title: "Tugas Akhir — Otomatisasi Klasifikasi Insiden Keamanan dengan n8n dan LLM Self-Hosted"
date: 2026-10-20 00:00:00 +0700
description: Penelitian tugas akhir saya. Peringatan Wazuh dan Suricata dinormalisasi dan disaring di n8n, lalu LLM open-source yang berjalan di lab sendiri (Ollama) menyusun klasifikasi insiden dan langkah mitigasi untuk analis, tanpa mengeksekusi tindakan apa pun pada sistem.
categories:
  - Research
  - Security Automation
tags:
  - thesis
  - wazuh
  - suricata
  - n8n
  - ollama
  - llm
  - postgresql
  - proxmox
  - soc
  - incident-response
status: in-progress
tech_stack:
  - Proxmox
  - pfSense / OPNsense
  - Wazuh
  - Suricata
  - n8n
  - PostgreSQL
  - Ollama
  - LibreNMS
image:
  path: https://cyphera.my.id/assets/img/og/labs-homelab.jpg
  alt: Topologi testbed tugas akhir di Proxmox
hide_image: true  # the interactive diagram below replaces it on the page
---

> Penelitian ini **sedang berjalan**. Progres terbaru dan hasil evaluasi per model ditampilkan di [Labs → Homelab](/labs/#homelab), dan diperbarui seiring penelitian berjalan.
{: .prompt-info }

## Latar Belakang

Analis keamanan menerima peringatan dari banyak sumber sekaligus: Wazuh dari sisi host, Suricata dari sisi jaringan. Format tiap sumber berbeda, sebagian besar peringatan berkeparahan rendah, dan menyusun klasifikasi serta langkah mitigasi untuk setiap insiden memakan waktu.

Penelitian ini membangun **pipeline yang mengotomatiskan klasifikasi insiden**: peringatan dinormalisasi dan disaring secara deterministik, lalu hanya peringatan yang signifikan dikirim ke **LLM open-source yang berjalan di lab sendiri**. Hasilnya berupa rekomendasi untuk analis, bukan tindakan otomatis.

## Tujuan

- Menyeragamkan peringatan Wazuh dan Suricata ke satu skema JSON dan menggabungkan alert berulang menjadi satu insiden.
- Mengurangi beban LLM dengan penyaringan berbasis aturan sebelum inferensi.
- Menghasilkan klasifikasi insiden, tingkat keparahan, ringkasan, dan langkah mitigasi dalam JSON terstruktur.
- Membandingkan model kandidat (Llama 3 8B dan Mistral 7B) terhadap label kebenaran dari setiap skenario serangan.

## Lingkungan Pengujian

Seluruh pengujian berjalan di **klaster Proxmox yang terisolasi**: jaringan internal tanpa IP publik, terpisah dari jaringan produksi. Akses hanya lewat VPN yang dinyalakan saat sesi eksperimen dan dimatikan sesudahnya. Simulasi serangan dilakukan dari laptop peneliti melalui VPN, sehingga lalu lintas serangan tetap melewati gateway dan diinspeksi Suricata.

Di dalam klaster, VM dibagi ke **tiga segmen jaringan** menurut tingkat kepercayaannya:

- **Segmen target**: VM yang diserang, jadi dianggap tidak tepercaya.
- **Segmen SOC**: deteksi (Wazuh + Suricata) dan pipeline (n8n, PostgreSQL, Ollama).
- **Manajemen**: LibreNMS.

Gateway menerapkan *default deny* antarsegmen. VM target hanya boleh menghubungi Wazuh Manager, tidak pernah n8n atau Ollama secara langsung.

### Cara membaca dan memakai diagram

Diagram di bawah bisa diatur seperti di draw.io:

- **Geser node** untuk mengatur ulang tata letak. Garis, panah, dan frame segmen ikut menyesuaikan.
- **Geser area kosong** untuk menggeser kanvas, lalu pakai tombol **+ / −** atau <kbd>Ctrl</kbd> + scroll untuk zoom. **Fit** menampilkan seluruh diagram, **Reset layout** mengembalikan posisi awal.
- Dengan keyboard: <kbd>Tab</kbd> ke sebuah node, lalu tombol panah untuk memindahkannya.
- Arahkan kursor atau ketuk node untuk melihat perannya. Garis yang terhubung ke node itu ikut disorot.
- **Panah satu arah** menunjukkan arah aliran data. **Panah dua arah** berarti permintaan dan balasan (prompt dan JSON, rekomendasi dan verdict analis). **Garis putus-putus** adalah koneksi yang hanya aktif sesuai kebutuhan (VPN).

Tata letak hasil geseran hanya tersimpan di browser Anda.

{% include homelab.html parts="topology" %}

### Simulasi skenario

Konsol `labctl` di bawah diagram memutar setiap skenario pengujian melewati pipeline. Paket bergerak di diagram, trace L1–L5 menunjukkan lapisan mana yang meloloskan, mengarsipkan, atau menandai insiden, dan setiap baris log memakai format yang sama dengan keluaran Wazuh, Suricata, dan n8n.

| Perintah | Fungsi |
|---|---|
| `scenarios` | Daftar skenario beserta teknik MITRE dan label kebenarannya |
| `run <id> [--model mistral]` | Menjalankan satu skenario dengan model pilihan |
| `show raw` / `normalized` / `llm` / `record` | Data pada tiap tahap dari skenario terakhir |
| `verdict accept` / `verdict correct <severity>` | Tinjauan analis, yang disimpan sebagai data evaluasi |
| `replay <id>` | Memutar ulang alert terekam yang sama ke setiap model, seperti pada tahap evaluasi |

Setiap skenario menguji satu bagian penelitian:

| Skenario | Teknik | Yang diuji |
|---|---|---|
| `baseline-benign` | — | Aktivitas admin normal; mengukur *false positive*, tidak boleh sampai ke LLM |
| `recon-scan` | T1046 | Deduplikasi (14 alert jadi 1 insiden) dan pengarsipan insiden berkeparahan rendah |
| `ssh-bruteforce` | T1110.001 | Jalur lengkap: normalisasi, triase, LLM, validasi, notifikasi |
| `ssh-login-after-bruteforce` | T1078 | Korelasi: login sukses setelah brute force dinaikkan menjadi *critical* |
| `web-sqli` | T1190 | Deduplikasi lintas sumber (Suricata dan Wazuh untuk satu serangan) |
| `prompt-injection` | ATLAS AML.T0051 | Isi log yang mencoba mengarahkan LLM; *guardrail* dan batas bawah keparahan |
| `fault-llm-schema` | — | Keluaran LLM tidak valid: coba ulang, lalu jatuh ke triase manual |

Data di konsol bersifat ilustratif dan disamarkan. Serangan hanya dideskripsikan, tidak dieksekusi, dan tidak ada keluaran konsol yang merupakan hasil evaluasi.

| Komponen | Segmen | Peran |
|---|---|---|
| Gateway (pfSense / OPNsense) | Antarsegmen | Titik masuk terkendali, endpoint VPN, firewall *default deny* antarsegmen, pencerminan lalu lintas ke Suricata, dan sumber waktu (NTP) |
| VM target | Target | Satu hingga dua VM Linux sebagai objek serangan; di-*snapshot* sebelum setiap skenario dan dikembalikan sesudahnya |
| Wazuh + Suricata | SOC | Deteksi berbasis host dan jaringan dalam satu VM. Wazuh juga membaca `eve.json` Suricata, sehingga kedua sumber dikirim lewat satu integrasi |
| n8n + PostgreSQL (Docker) | SOC | Penerimaan, normalisasi, deduplikasi, penyaringan, validasi keluaran LLM, dan penyimpanan seluruh insiden |
| Ollama | SOC | Inferensi LLM tanpa *tools* dan tanpa akses jaringan selain ke n8n; dipisah dari n8n agar beban inferensi tidak mengganggu orkestrasi |
| LibreNMS | Manajemen | Pemantauan CPU, memori, dan disk VM lab, terpisah dari LibreNMS produksi |

## Arsitektur Pipeline

1. **Sumber data.** Wazuh menghasilkan peringatan berbasis aturan dari log agen dalam format JSON. Suricata menganalisis lalu lintas yang dicerminkan dari gateway, dan `eve.json`-nya dibaca Wazuh di VM yang sama. Semua VM memakai waktu dari gateway (NTP), sehingga peristiwa host dan jaringan bisa diurutkan dengan benar.
2. **Penerimaan dan normalisasi.** Webhook n8n hanya menerima permintaan yang membawa token rahasia. Kedua skema dipetakan ke satu skema JSON dengan kode JavaScript, **tanpa LLM**, memakai timestamp UTC. Alert mentah tetap disimpan di samping hasil normalisasi.
3. **Triase dan deduplikasi.** Alert berulang dengan aturan, host, dan sumber yang sama dalam jendela waktu singkat digabung menjadi satu insiden (*fingerprint*). Logika bergaya Sigma menentukan tingkat keparahan. Insiden berkeparahan rendah langsung diarsipkan ke PostgreSQL; hanya yang melewati ambang batas yang diteruskan.
4. **Inferensi dan validasi LLM.** Ollama menerima prompt terstruktur yang **berversi**, dengan isi alert ditaruh di blok data yang ditandai jelas. Model mengembalikan JSON yang dibatasi skema (kategori, keparahan, ringkasan, langkah mitigasi) dengan temperature 0 dan seed tetap. n8n lalu memeriksa jawabannya: JSON harus valid dan kategori harus berasal dari daftar tetap. Bila gagal, dicoba ulang satu kali; bila masih gagal, insiden diteruskan ke triase manual dengan keparahan dari aturan.
5. **Tinjauan, pencatatan, dan evaluasi.** Rekomendasi dikirim ke analis lewat Slack atau email. Analis menerima atau mengoreksi kategori dan keparahan, lalu *verdict* itu disimpan. Setiap insiden dicatat bersama model, versi prompt, dan latensi. Label kebenaran disimpan di tabel terpisah dan tidak pernah masuk ke prompt.

## Best Practice pada Alur dan Alasannya

Rancangan awal sudah memisahkan normalisasi deterministik dari LLM. Alur di atas menambahkan beberapa praktik yang umum dipakai di SOC dan pada sistem berbasis LLM, supaya hasil penelitian lebih aman, adil, dan dapat diulang:

| Praktik | Di mana | Alasan |
|---|---|---|
| Segmentasi jaringan dan *default deny* | Gateway | VM target memang diserang. Bila satu target berhasil dikuasai, penyerang tidak bisa langsung menjangkau pipeline atau LLM. |
| Tanpa akses internet selama sesi | Gateway, Ollama | Model dan pembaruan diunduh sebelum eksperimen, sehingga tidak ada lalu lintas tak terduga yang mencemari data dan tidak ada data lab yang keluar. |
| Satu sumber waktu (NTP) dan timestamp UTC | Semua VM, normalisasi | Korelasi alert host dan jaringan, deduplikasi berbasis jendela waktu, dan pengukuran latensi hanya benar bila jamnya seragam. |
| Webhook dengan token | Wazuh → n8n | Tanpa autentikasi, siapa pun di jaringan bisa mengirim alert palsu ke pipeline. |
| Simpan alert mentah dan hasil normalisasi | PostgreSQL | Bila aturan normalisasi diperbaiki, data lama bisa diproses ulang, dan setiap keluaran bisa ditelusuri ke sumber aslinya (audit trail). |
| Deduplikasi dan agregasi | Triase | Satu brute force bisa menghasilkan puluhan alert. Menggabungkannya menghemat inferensi dan membuat LLM menilai satu insiden utuh. |
| Data alert diperlakukan sebagai input tak tepercaya | Prompt | Username, URL, dan payload dikendalikan penyerang dan bisa berisi instruksi (*prompt injection*). Isinya dibatasi sebagai data, panjangnya dipotong, dan model tidak punya *tools*, jadi tidak bisa melakukan tindakan apa pun. |
| Keluaran dibatasi skema dan divalidasi | Ollama, n8n | Format JSON dari Ollama membatasi bentuk jawaban. Validasi di n8n menangkap sisanya, dan jalur cadangan memastikan tidak ada insiden yang hilang karena LLM gagal. |
| Versi model dan prompt dicatat | PostgreSQL | Hasil evaluasi hanya bermakna bila diketahui persis model, kuantisasi, dan prompt mana yang menghasilkannya. |
| Label kebenaran terpisah dari prompt | Evaluasi | Mencegah kebocoran label ke model, yang akan membuat akurasi terlihat lebih tinggi dari kenyataan. |
| *Snapshot* VM target per skenario | VM target | Setiap pengulangan skenario dimulai dari kondisi yang sama, sehingga alert yang dihasilkan sebanding. |
| Rekam sekali, putar ulang ke setiap model | Evaluasi | Llama 3 dan Mistral dinilai pada himpunan alert yang identik, sehingga perbedaan hasil berasal dari model, bukan dari variasi serangan. |
| Manusia memutuskan, dan keputusannya dicatat | Analis | Sistem hanya merekomendasikan. *Verdict* analis menjadi data tambahan untuk melihat seberapa sering rekomendasi diterima tanpa koreksi. |

## Keputusan Desain

- **Terisolasi dan tersegmentasi.** Tanpa IP publik, VPN hanya aktif saat eksperimen, dan segmen target, SOC, serta manajemen dipisah dengan aturan *default deny*.
- **Deterministik di tempat yang penting.** Normalisasi, deduplikasi, dan penyaringan berupa kode biasa; LLM hanya menerima insiden yang sudah bersih dan tersaring.
- **LLM hanya bila perlu.** Triase berbasis aturan menjauhkan noise berkeparahan rendah dari model dan menjaga pipeline tetap cepat.
- **Data alert tidak tepercaya.** Isi alert dikirim sebagai data, bukan instruksi, dan model tidak bisa mengeksekusi apa pun.
- **Setiap jawaban divalidasi.** Keluaran yang tidak sesuai skema dicoba ulang satu kali, lalu diserahkan ke manusia.
- **Manusia tetap memutuskan.** Tidak ada tindakan yang dieksekusi otomatis pada sistem target.

## Evaluasi

Setiap insiden dibandingkan dengan label kebenaran yang dicatat saat skenario serangan disusun. Alert dari setiap skenario direkam sekali, lalu diputar ulang ke setiap model kandidat dengan prompt dan parameter yang sama. Metrik yang akan diukur untuk setiap model:

- akurasi kategori dan macro F1,
- kesesuaian tingkat keparahan,
- persentase keluaran JSON yang valid sesuai skema tanpa percobaan ulang,
- median waktu inferensi per insiden,
- persentase alert yang tersaring sebelum mencapai LLM.

Hasilnya akan ditampilkan di tab **Results** pada [Labs → Homelab](/labs/#hl-pane-results) setelah tahap evaluasi selesai.
