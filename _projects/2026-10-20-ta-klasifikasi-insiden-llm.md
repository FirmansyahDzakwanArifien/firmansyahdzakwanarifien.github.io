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
  path: /assets/img/og/labs-homelab.jpg
  alt: Topologi testbed tugas akhir di Proxmox
hide_image: true  # the interactive diagram below replaces it on the page
---

> Penelitian ini **sedang berjalan**. Progres terbaru dan hasil evaluasi per model ditampilkan di [Labs → Homelab](/labs/#homelab), dan diperbarui seiring penelitian berjalan.
{: .prompt-info }

## Latar Belakang

Analis keamanan menerima peringatan dari banyak sumber sekaligus: Wazuh dari sisi host, Suricata dari sisi jaringan. Format tiap sumber berbeda, sebagian besar peringatan berkeparahan rendah, dan menyusun klasifikasi serta langkah mitigasi untuk setiap insiden memakan waktu.

Penelitian ini membangun **pipeline yang mengotomatiskan klasifikasi insiden**: peringatan dinormalisasi dan disaring secara deterministik, lalu hanya peringatan yang signifikan dikirim ke **LLM open-source yang berjalan di lab sendiri**. Hasilnya berupa rekomendasi untuk analis, bukan tindakan otomatis.

## Tujuan

- Menyeragamkan peringatan Wazuh dan Suricata ke satu skema JSON.
- Mengurangi beban LLM dengan penyaringan berbasis aturan sebelum inferensi.
- Menghasilkan klasifikasi insiden, tingkat keparahan, ringkasan, dan langkah mitigasi dalam JSON terstruktur.
- Membandingkan model kandidat (Llama 3 8B dan Mistral 7B) terhadap label kebenaran dari setiap skenario serangan.

## Lingkungan Pengujian

Seluruh pengujian berjalan di **klaster Proxmox yang terisolasi**: jaringan internal tanpa IP publik, terpisah dari jaringan produksi. Akses hanya lewat VPN yang dinyalakan saat sesi eksperimen dan dimatikan sesudahnya. Simulasi serangan dilakukan dari laptop peneliti melalui VPN, sehingga lalu lintas serangan tetap melewati gateway dan diinspeksi Suricata.

Arahkan kursor atau ketuk setiap node untuk melihat perannya:

{% include homelab.html parts="topology" %}

| Komponen | Peran |
|---|---|
| Gateway (pfSense / OPNsense) | Titik masuk terkendali, endpoint VPN, dan pencerminan lalu lintas ke Suricata |
| Wazuh + Suricata | Deteksi berbasis host (agen di VM target) dan berbasis jaringan dalam satu VM; bisa dipisah bila sumber daya menjadi hambatan |
| VM target | Satu hingga dua VM Linux sebagai objek simulasi serangan |
| LibreNMS | Pemantauan infrastruktur lab, terpisah dari LibreNMS produksi |
| n8n + PostgreSQL (Docker) | Orkestrasi pipeline dan penyimpanan seluruh insiden beserta labelnya |
| Ollama | Inferensi LLM, dipisah dari n8n agar beban inferensi tidak mengganggu orkestrasi |

## Arsitektur Pipeline

1. **Sumber data.** Wazuh menghasilkan peringatan berbasis aturan dari log agen dalam format JSON; Suricata menganalisis lalu lintas yang dicerminkan dari gateway.
2. **Penerimaan dan normalisasi.** n8n menerima peringatan lewat webhook dan memetakan kedua skema ke satu skema JSON dengan kode JavaScript, **tanpa LLM**, agar konsisten dan dapat direplikasi.
3. **Penyaringan berbasis aturan.** Logika bergaya Sigma menentukan tingkat keparahan. Peringatan rendah langsung diarsipkan ke PostgreSQL; hanya yang melewati ambang batas yang diteruskan.
4. **Inferensi LLM.** Ollama menerima prompt terstruktur dan mengembalikan JSON berisi kategori, keparahan, ringkasan naratif, dan langkah mitigasi. Temperature rendah dan seed tetap dipakai untuk meminimalkan variasi antar sesi.
5. **Keluaran dan pencatatan.** Rekomendasi dikirim ke analis lewat Slack atau email. Seluruh insiden, termasuk yang diarsipkan, disimpan bersama label kebenaran dari skenario untuk evaluasi offline.

## Keputusan Desain

- **Terisolasi sejak awal.** Tanpa IP publik dan VPN hanya aktif saat eksperimen, sehingga aktivitas pengujian tidak bocor ke produksi.
- **Deterministik di tempat yang penting.** Normalisasi dan penyaringan berupa kode biasa; LLM hanya menerima peringatan yang sudah bersih dan tersaring.
- **LLM hanya bila perlu.** Penyaringan menjauhkan noise berkeparahan rendah dari model dan menjaga pipeline tetap cepat.
- **Manusia tetap memutuskan.** Sistem hanya merekomendasikan; tidak ada tindakan yang dieksekusi pada sistem target.

## Evaluasi

Setiap insiden dibandingkan dengan label kebenaran yang dicatat saat skenario serangan disusun. Metrik yang akan diukur untuk setiap model kandidat:

- akurasi kategori dan macro F1,
- kesesuaian tingkat keparahan,
- persentase keluaran JSON yang valid sesuai skema,
- median waktu inferensi per peringatan,
- persentase peringatan yang tersaring sebelum mencapai LLM.

Hasilnya akan ditampilkan di tab **Results** pada [Labs → Homelab](/labs/#hl-pane-results) setelah tahap evaluasi selesai.
