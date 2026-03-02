---
title: "Ph4nt0m 1ntrud3r — picoCTF 2025: Network Forensics"
date: 2026-03-02 00:00:00 +0700
description: Analisis PCAP file untuk menemukan flag yang disembunyikan dalam TCP segment data — mencakup filtering paket, decoding hex, dan rekonstruksi Base64.
image:
  path: "https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/cover.png"
  alt: "Ph4nt0m 1ntrud3r picoCTF Writeup"
categories:
  - picoCTF
  - Forensics
tags:
  - forensics
  - pcap
  - network-analysis
  - tshark
  - wireshark
  - base64
  - ctf
platform: picoCTF 2025
difficulty: Medium
challenge_author: Prince Niyonshuti N.
status: completed
artifacts:
  - myNetworkTraffic.pcap
---

## 🔍 Introduction

Challenge **Ph4nt0m 1ntrud3r** mengajak kita untuk menganalisis file PCAP — sebuah rekaman lalu lintas jaringan — untuk menemukan flag yang disembunyikan oleh attacker.

Yang menarik dari challenge ini: flag-nya tidak langsung tersimpan dalam satu paket. Attacker sengaja **memecah dan menyembunyikan flag ke dalam beberapa paket TCP** secara tidak berurutan. Kita harus:

1. Menemukan paket-paket yang relevan
2. Mengekstrak data dari dalamnya
3. Mendekode dari format hex → Base64 → teks asli
4. Menyusun ulang potongan-potongan tersebut menjadi flag yang utuh

**Tools yang dibutuhkan:**

| Tool | Fungsi |
|------|--------|
| `tshark` | Analisis PCAP via command line |
| `xxd` | Konversi hex ke binary/ASCII |
| `base64` | Decode Base64 string |
| `sort` | Mengurutkan berdasarkan timestamp |
| `awk` | Mengambil field tertentu dari output |

> Belum punya `tshark`? Install dengan: `sudo apt install tshark`
{: .prompt-info }

---

## 🧩 Step-by-Step Solution

### Step 1 — Download & Buka File PCAP

Download file `myNetworkTraffic.pcap` dari link yang diberikan di challenge, lalu pindahkan ke direktori kerja kamu. Dalam contoh ini kita simpan di `~/Downloads`.

```bash
cd ~/Downloads
ls -lh myNetworkTraffic.pcap
```

Sebelum langsung filter, ada baiknya kita lihat dulu gambaran umum isi file ini — paket apa saja yang ada di dalamnya.

```bash
tshark -r myNetworkTraffic.pcap -T fields -e tcp.segment_data
```

**Penjelasan command:**

- `-r myNetworkTraffic.pcap` → baca file PCAP ini
- `-T fields` → tampilkan hanya field tertentu, bukan output lengkap
- `-e tcp.segment_data` → tampilkan isi data/payload dari tiap paket TCP

![Output awal tshark](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)
_Hasil output mentah — deretan hex string dari tiap paket TCP_

Hasilnya adalah deretan **hex string** yang merupakan isi dari masing-masing paket. Terlihat banyak paket, tapi kita belum tahu mana yang relevan.

---

### Step 2 — Filter Paket yang Relevan

Setelah melihat outputnya, kita perlu menyaring hanya paket yang mengandung data flag. Caranya dengan memfilter berdasarkan **panjang TCP payload**.

Dalam challenge ini, paket yang relevan adalah yang memiliki panjang **12 byte** atau **4 byte**.

```bash
tshark -r myNetworkTraffic.pcap -Y "tcp.len==12 || tcp.len==4" -T fields -e tcp.segment_data
```

**Penjelasan tambahan:**

- `-Y "tcp.len==12 || tcp.len==4"` → filter display: hanya tampilkan paket TCP dengan payload sepanjang 12 atau 4 byte

![Output setelah filter panjang paket](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step2-filtered.png)
_Jumlah paket berkurang signifikan setelah difilter_

Hasilnya sudah jauh lebih sedikit. Tapi outputnya masih berupa **hex** — belum bisa dibaca.

---

### Step 3 — Konversi Hex ke ASCII

Kita sambungkan output tadi ke `xxd -r -p` untuk mengubah hex menjadi teks yang bisa dibaca.

```bash
tshark -r myNetworkTraffic.pcap -Y "tcp.len==12 || tcp.len==4" -T fields -e tcp.segment_data | xxd -r -p
```

**Penjelasan `xxd -r -p`:**

- `-r` → mode reverse: ubah hex dump **kembali** ke binary/ASCII
- `-p` → plain hex input (tanpa offset atau kolom samping)

![Output setelah konversi hex ke ASCII](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step3-hex-to-ascii.png)
_Teks sudah terbaca, tapi masih dalam format Base64_

Hasilnya sekarang terlihat seperti **string Base64** — ditandai dengan karakter `=` atau `==` di akhir tiap potongan. Tapi urutannya masih acak!

---

### Step 4 — Urutkan Berdasarkan Timestamp

Masalahnya: paket-paket ini **tidak terurut berdasarkan waktu** saat dibaca. Jika kita langsung decode, flag yang kita dapat tidak akan berurutan.

Solusinya: tambahkan field `frame.time` ke output, lalu **sort berdasarkan timestamp** sebelum decode.

```bash
tshark -r myNetworkTraffic.pcap \
  -Y "tcp.len==12 || tcp.len==4" \
  -T fields \
  -e frame.time \
  -e tcp.segment_data \
  | sort -k4 \
  | awk '{print $6}' \
  | xxd -p -r \
  | base64 -d
```

**Penjelasan tiap bagian:**

| Bagian | Fungsi |
|--------|--------|
| `-e frame.time` | Ambil timestamp tiap paket |
| `sort -k4` | Urutkan berdasarkan kolom ke-4 (bagian waktu dari timestamp) |
| `awk '{print $6}'` | Ambil kolom ke-6 saja, yaitu hex data payload |
| `xxd -p -r` | Konversi hex → binary |
| `base64 -d` | Decode Base64 → teks asli |

![Output setelah sort dan decode](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step4-sorted-decoded.png)
_Flag muncul setelah paket diurutkan dan di-decode_

---

### Step 5 — Rekonstruksi Flag

Hasil decode menghasilkan potongan-potongan seperti ini:

| Base64 | Decoded |
|--------|---------|
| `cGljb0NURg==` | `picoCTF` |
| `ezF0X3c0cw==` | `{1t_w4s` |
| `bnRfdGg0dA==` | `nt_th4t` |
| `XzM0c3lfdA==` | `_34sy_t` |
| `YmhfNHJfOQ==` | `bh_4r_9` |
| `NjZkMGJmYg==` | `66d0bfb` |
| `fQ==` | `}` |

Susun potongan-potongan tersebut secara logis berdasarkan konteks kalimat:

```
picoCTF + {1t_w4s + nt_th4t + _34sy_t + bh_4r_9 + 66d0bfb + }
```

> **Flag:** `picoCTF{1t_w4snt_th4t_34sy_tbh_4r_966d0bfb}`
{: .prompt-tip }

Terjemahan tersembunyi dari flagnya: **"It wasn't that easy, to be honest."** — pesan dari si pembuat soal.

---

## Penutup & Kesimpulan

![Chall Solved](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/chall-solved.png)

Challenge **Ph4nt0m 1ntrud3r** mengajarkan kita bahwa data tidak selalu tersimpan dalam satu tempat yang mudah ditemukan. Attacker bisa menyembunyikan informasi dengan cara:

1. **Memecah data** menjadi potongan-potongan kecil
2. **Mengenkode** tiap potongan dalam format Base64
3. **Mengirimnya secara tidak berurutan** melalui jaringan

Untuk mengungkapnya, kita butuh pendekatan yang sistematis:

- **Filter** dulu paket yang benar-benar relevan — jangan langsung olah semua paket
- **Perhatikan timestamp** — urutan pengiriman paket sangat penting untuk rekonstruksi data
- **Kenali encoding** — Base64, hex, dan format lainnya adalah teknik umum dalam CTF maupun serangan nyata

Satu hal yang menarik dari challenge ini: `tshark` saja sudah cukup untuk menyelesaikan semuanya. Kita tidak butuh tool berat — cukup pahami alur data dari paket ke flag, lakukan satu pipeline command yang tepat, dan flag pun terbuka.
