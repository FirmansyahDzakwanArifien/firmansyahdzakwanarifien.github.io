---
title: "Capstone Project — IDN Blue Team: Web Attack Investigation dengan Wazuh, Wireshark & Volatility"
date: 2026-03-18 00:00:00 +0700
description: Investigasi serangan web end-to-end menggunakan Wazuh SIEM, Wireshark, dan Volatility3 — mencakup deteksi SQLi, XSS, LFI, RFI, hingga analisis memory dump untuk menemukan proses mencurigakan.
categories:
  - IDN Blue Team
  - DFIR
tags:
  - wazuh
  - wireshark
  - volatility
  - siem
  - sqli
  - xss
  - lfi
  - rfi
  - memory-forensics
  - dfir
  - blue-team
platform: IDN Blue Team
difficulty: Capstone
status: completed
artifacts:
  - suspected.pcap
  - external.pcapng
  - suspected.raw
---

## Introduction

Pada capstone ini, saya melakukan investigasi terhadap serangkaian serangan web yang terjadi pada host Metasploitable — sebuah mesin yang menjalankan web application rentan di atas Apache2. Serangan yang perlu ditelusuri mencakup SQL Injection, Cross-Site Scripting, File Inclusion (Local & Remote), dan reverse shell activity.

Proses investigasi dilakukan dari tiga sisi: analisis log di Wazuh SIEM, inspeksi network capture menggunakan Wireshark, dan analisis memory dump menggunakan Volatility3.

**Tools yang digunakan:**

| Tool | Fungsi |
|---|---|
| Wazuh Dashboard | Analisis SIEM log dan alert |
| Wireshark | Inspeksi network capture (PCAP) |
| Volatility3 | Analisis Windows memory dump |

---

## Investigation & Findings

### Q1 — Nama Agent yang Terhubung ke SIEM

Untuk melihat agent yang terdaftar di Wazuh, saya SSH ke Wazuh server dan menjalankan perintah berikut:

```bash
sudo /var/ossec/bin/agent_control -l
```

Output:

```
ID: 000, Name: wazuh-server (server), IP: 127.0.0.1, Active/Local
ID: 001, Name: metasploitable, IP: any, Active
```

ID 000 adalah Wazuh manager itu sendiri. ID 001 adalah endpoint eksternal yang sedang dimonitor — host inilah yang Apache access log-nya berisi semua jejak serangan yang perlu diinvestigasi.

![Q1](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)

> **Answer:** `metasploitable`
{: .prompt-tip }

---

### Q2 — Nama Web Server yang Terhubung ke SIEM

Saya membuka salah satu event di Wazuh Dashboard, lalu melihat detail JSON-nya dan mencari field `location`:

```json
"location": "/var/log/apache2/access.log"
```

Path tersebut secara langsung menunjukkan bahwa web server yang log-nya dikumpulkan Wazuh adalah **Apache2**. Untuk memastikan, saya juga menggunakan filter berikut di menu Discover:

```
agent.name: "metasploitable" AND data.srcip:*
```

Seluruh request HTTP yang muncul berasal dari Apache access log pada agent metasploitable.

![Q2](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)

> **Answer:** `Apache2`
{: .prompt-tip }

---

### Q3 — Index untuk Menyimpan RAW Logs

Saya membuka menu **Discover** di Wazuh Dashboard dan melihat daftar index pattern yang tersedia. Wazuh memisahkan penyimpanan data ke dalam dua jenis index:

| Index Pattern | Isi |
|---|---|
| `wazuh-alerts-*` | Log yang sudah memicu rule atau alert |
| `wazuh-archives-*` | Semua RAW log tanpa filter apapun |

Saya memilih index pattern `wazuh-archives-*`, kemudian membuka salah satu dokumen. Field `_index` menampilkan:

```
"_index": "wazuh-archives-4.x-2024.02.26"
```

Index ini menyimpan semua log mentah dari agent termasuk field `full_log`, yaitu baris asli Apache access log persis seperti yang tertulis di file log — tanpa perubahan apapun.

![Q3](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)

> **Answer:** `wazuh-archives-4.x-*`
{: .prompt-tip }

---

### Q4 — Jumlah Aktivitas SQL Injection yang Terdeteksi

Saya memfilter event di Wazuh Dashboard menggunakan:

```
agent.name: "metasploitable" AND data.url: *sqli*
```

Dari hasil filter tersebut, saya menemukan empat request HTTP yang berisi payload SQL Injection terhadap endpoint `/prod/vulnerabilities/sqli/`:

| # | URL Payload |
|---|---|
| 1 | `/prod/vulnerabilities/sqli/?id=%27+or+1%3D1%23&Submit=Submit` |
| 2 | `/prod/vulnerabilities/sqli/?id=%27+UNION+SELECT+user%2C+password+FROM+users%23&Submit=Submit` |
| 3 | `/prod/vulnerabilities/sqli/?id=1+or+1%3D1+UNION+SELECT+user%2C+password+FROM+users%23&Submit=Submit` |
| 4 | `/prod/vulnerabilities/sqli/?id=%27+UNION+SELECT+user%2C+password+FROM+users%23&Submit=Submit` |

Teknik yang digunakan mencakup `OR 1=1` untuk bypass autentikasi, dan `UNION SELECT` untuk mengekstrak data dari kolom `user` dan `password` di database.

![Q4](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)

> **Answer:** `4`
{: .prompt-tip }

---

### Q5 — HTTP Status Code pada Aktivitas XSS

Saya memfilter event XSS menggunakan:

```
agent.name: "metasploitable" AND data.url: *xss_r*
```

Kemudian membuka salah satu event dan melihat field `full_log`. Contoh raw log dari reflected XSS request:

```
"GET /prod/vulnerabilities/xss_r/?name=%3Cscript%3Ealert%28document.cookie%29%3B%3C%2Fscript%3E HTTP/1.1" 200 4374
```

Angka **200** setelah `HTTP/1.1` adalah status code yang dikembalikan server. Artinya server memproses request tersebut tanpa menolak payload XSS — script berbahaya diterima dan dirender oleh aplikasi.

![Q5](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)

> **Answer:** `200`
{: .prompt-tip }

---

### Q6 — Nama File pada Aktivitas File Inclusion

Saya memfilter event File Inclusion menggunakan:

```
agent.name: "metasploitable" AND data.url: */fi/*
```

Di antara semua request ke endpoint `/prod/vulnerabilities/fi/`, saya melihat pola penggunaan parameter `page`:

```
/prod/vulnerabilities/fi/?page=include.php
/prod/vulnerabilities/fi/?page=/etc/passwd
```

File **`include.php`** adalah file PHP pada aplikasi yang mengimplementasikan fitur file inclusion tanpa validasi input. File ini menerima nilai dari parameter `page` dan langsung memuatnya — inilah yang dieksploitasi untuk melakukan LFI maupun RFI.

![Q6](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)

> **Answer:** `include.php`
{: .prompt-tip }

---

### Q7 — Port Komunikasi Mencurigakan pada RFI

Saya membuka file `suspected.pcap` di Wireshark, lalu ke menu:

```
Statistics → Conversations → TCP
```

Di sana terlihat daftar semua koneksi TCP yang terekam. Ada satu koneksi yang langsung mencurigakan karena menggunakan port non-standar dan arahnya terbalik — Metasploitable yang memulai koneksi ke arah attacker:

```
192.168.117.190 (Metasploitable) → 192.168.117.242 (Attacker) : dst port 9001
```

Ini adalah pola reverse shell. Setelah file PHP berbahaya berhasil dieksekusi melalui celah RFI, server korban terhubung balik ke attacker melalui port 9001.

![Q7](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)

> **Answer:** `9001`
{: .prompt-tip }

---

### Q8 — Source Port yang Terhubung ke Destination Port 4444

Saya membuka file `external.pcapng` di Wireshark, kemudian menggunakan filter:

```
tcp.dstport == 4444
```

Dari hasil filter tersebut, saya menemukan satu koneksi yang relevan:

```
Source IP        : 192.168.132.238
Source Port      : 49816
Destination IP   : 192.168.132.242
Destination Port : 4444
```

Host internal `192.168.132.238` melakukan koneksi keluar ke `192.168.132.242` pada port 4444. Source port yang digunakan untuk koneksi tersebut adalah **49816**.

![Q8](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)

> **Answer:** `49816`
{: .prompt-tip }

---

### Q9 — PID shell.exe pada Memory Dump

File `suspected.raw` adalah Windows memory image yang saya analisis menggunakan Volatility3. Saya menggunakan plugin `windows.psscan` untuk memindai semua proses yang ada di memori, termasuk yang sudah tidak aktif:

```bash
python3 vol.py -f suspected.raw windows.psscan | grep -i shell
```

Output yang relevan:

```
PID    PPID   ImageFileName
7396   5716   shell.exe
7640   2576   powershell.exe
5228   824    ShellExperienc...
```

`shell.exe` berjalan dengan PID **7396**. Proses ini bukan bagian dari sistem Windows yang normal, sehingga sangat dicurigai sebagai backdoor yang dijalankan setelah sistem berhasil dikompromis.

> **Catatan:** Saya memilih `psscan` dibanding `pslist` karena `psscan` mampu mendeteksi proses yang sudah di-unlink dari process list normal — teknik yang umum digunakan untuk menyembunyikan proses berbahaya.

![Q9](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)

> **Answer:** `7396`
{: .prompt-tip }

---

### Q10 — URL Aktivitas Local File Inclusion (LFI)

Saya kembali ke Wazuh Dashboard dan memfilter semua request ke endpoint file inclusion:

```
agent.name: "metasploitable" AND data.url: */fi/*
```

Di antara semua request yang muncul, saya mengidentifikasi URL yang secara spesifik merupakan Local File Inclusion — request yang mencoba membaca file sensitif di server secara langsung melalui parameter `page`:

| URL | Keterangan |
|---|---|
| `/prod/vulnerabilities/fi/?page=include.php` | Akses file biasa |
| `/prod/vulnerabilities/fi/?page=/etc/passwd` | LFI langsung |
| `/prod/vulnerabilities/fi/?page=file/../../../../../../etc/passwd` | LFI dengan directory traversal |

URL yang paling mewakili aktivitas LFI yang terdeteksi di SIEM adalah:

```
/prod/vulnerabilities/fi/?page=/etc/passwd
```

Request ini menyebabkan aplikasi membaca dan menampilkan isi `/etc/passwd` — file yang berisi daftar akun user di sistem Linux.

![Q10](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/ph4nt0m-1ntrud3r/step1-tshark-raw.png)

> **Answer:** `/prod/vulnerabilities/fi/?page=/etc/passwd`
{: .prompt-tip }

---

## Results Summary

| No | Pertanyaan | Jawaban |
|---|---|---|
| Q1 | Nama agent yang terhubung ke SIEM | `metasploitable` |
| Q2 | Web server yang digunakan | `Apache2` |
| Q3 | Index untuk RAW logs | `wazuh-archives-4.x-*` |
| Q4 | Jumlah aktivitas SQLi | `4` |
| Q5 | HTTP status code pada aktivitas XSS | `200` |
| Q6 | Nama file pada aktivitas File Inclusion | `include.php` |
| Q7 | Port komunikasi mencurigakan (RFI) | `9001` |
| Q8 | Source port ke destination port 4444 | `49816` |
| Q9 | PID shell.exe di memory dump | `7396` |
| Q10 | URL aktivitas LFI | `/prod/vulnerabilities/fi/?page=/etc/passwd` |

---

## Kesimpulan

Dari keseluruhan investigasi ini, saya berhasil merekonstruksi alur serangan menggunakan tiga sumber data yang saling melengkapi.

Wazuh menangkap semua aktivitas berbahaya di level HTTP — SQLi dengan payload `UNION SELECT`, XSS yang lolos dengan status 200, dan File Inclusion yang berhasil membaca `/etc/passwd`. Wireshark mengungkap aktivitas pasca-eksploitasi berupa reverse shell ke port 9001 setelah RFI berhasil, dan koneksi keluar ke port 4444 dari host internal. Volatility3 mengonfirmasi keberadaan `shell.exe` dengan PID 7396 di memori — bukti bahwa akses sudah mencapai level proses pada sistem yang dikompromis.

Ketiga sumber ini membentuk gambaran yang lengkap, dari serangan pertama masuk hingga attacker mendapat kendali penuh atas sistem target.