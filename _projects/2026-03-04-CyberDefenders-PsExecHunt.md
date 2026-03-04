---
title: "PsExec Hunt — CyberDefenders: SMB Lateral Movement Analysis"
date: 2026-03-04 00:00:00 +0700
description: Analisis PCAP untuk mengungkap aktivitas lateral movement menggunakan PsExec — mencakup identifikasi attacker, autentikasi NTLM, administrative shares, dan upaya pivot ke mesin kedua.
image:
  path: "https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/cover.png"
  alt: "PsExec Hunt CyberDefenders Writeup"
categories:
  - CyberDefenders
  - Network Forensics
tags:
  - network-forensics
  - wireshark
  - smb
  - psexec
  - lateral-movement
  - ntlm
  - dfir
  - blue-team
  - easy
platform: CyberDefenders
difficulty: Easy
challenge_author: CyberDefenders
status: completed
artifacts:
  - psexec.pcap
---

## Introduction

![Skenario](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/skenario.png)

Challenge **PsExec Hunt** menempatkan kita sebagai SOC analyst yang menerima alert dari IDS terkait aktivitas mencurigakan di jaringan internal. Alert tersebut menunjukkan adanya indikasi **lateral movement** menggunakan **PsExec** — sebuah tool administrasi remote yang sah, namun sangat sering disalahgunakan oleh attacker.

Tugas utama: analisis file PCAP menggunakan Wireshark untuk menelusuri:
- Dari mana attacker masuk
- Ke mesin mana attacker berpindah
- Credential apa yang digunakan
- Apa yang dilakukan di mesin target
- Sejauh mana jangkauan serangan

### Kenapa PsExec Berbahaya?

PsExec bekerja dengan cara menyalin file service executable-nya (`PSEXESVC.exe`) ke share administratif target (`ADMIN$`), lalu menjalankannya secara remote. Karena menggunakan protokol SMB yang legitimate dan credential yang valid, aktivitas ini sering lolos dari deteksi awal.

**Tools yang digunakan:**

| Tool | Fungsi |
|------|--------|
| Wireshark | Analisis PCAP dan inspeksi paket |
| Statistics > Protocol Hierarchy | Identifikasi protokol dominan dalam traffic |
| Follow TCP Stream | Telusuri satu sesi komunikasi secara utuh |

---

## Investigation & Findings

### Q1 — IP Address Attacker (Initial Access)

**Pertanyaan:** Dari IP mana attacker pertama kali mendapatkan akses ke jaringan?

**Langkah analisis:**

Buka file PCAP di Wireshark, lalu navigasi ke:

```
Statistics → Protocol Hierarchy
```

![Protocol Hierarchy Wireshark](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q1-protocol-hierarchy.png)
_Protocol Hierarchy menunjukkan dominasi SMB2 over TCP_

Dari sini terlihat jelas adanya traffic **SMB2 (Server Message Block v2)** melalui **NetBIOS Session Service** di atas TCP. Ini adalah protokol file sharing Windows yang menjadi medium utama serangan.

Filter traffic SMB untuk melihat siapa yang memulai komunikasi:

```
smb2
```

![SMB Negotiate Protocol Request](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q1-smb-negotiate.png)
_SMB Negotiate Protocol Request dari 10.0.0.130 ke 10.0.0.133 di port 445_

Ditemukan **SMB Negotiate Protocol Request** yang dikirim dari `10.0.0.130` ke `10.0.0.133` melalui **TCP port 445** — port standar SMB. Paket ini adalah langkah pertama dalam negosiasi sesi SMB, di mana client memulai komunikasi ke server. Karena `10.0.0.130` yang menginisiasi, maka ini adalah mesin attacker.

> **Answer:** `10.0.0.130`
{: .prompt-tip }

![Answer q1](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q1-answer.png)

---

### Q2 — Hostname Mesin Target Pertama

**Pertanyaan:** Apa hostname mesin yang pertama kali dijadikan target pivot oleh attacker?

**Langkah analisis:**

Klik kanan pada paket SMB dari Q1 → **Follow → TCP Stream** untuk melihat keseluruhan sesi komunikasi antara kedua IP.

Di dalam stream tersebut, cari paket **NTLM Authentication** — khususnya bagian **NTLM Challenge** yang dikirim oleh server sebagai respons terhadap upaya autentikasi client.

![NTLM Challenge Response](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q2-ntlm-challenge.png)
_NTLM Challenge mengandung metadata target machine termasuk hostname_

Di dalam NTLM Challenge message, server menyertakan informasi metadata tentang dirinya sendiri, termasuk:

- **NetBIOS Computer Name** → nama host mesin
- **NetBIOS Domain Name** → nama domain
- **DNS Computer Name** → FQDN mesin

Dari metadata tersebut, hostname mesin target pertama terbaca sebagai **SALES-PC**.

> **Answer:** `SALES-PC`
{: .prompt-tip }

![Answer q2](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q2-answer.png)

---

### Q3 — Username yang Digunakan Attacker

**Pertanyaan:** Username apa yang dipakai attacker untuk autentikasi?

**Langkah analisis:**

Masih di TCP stream yang sama, cari paket **SMB2 Session Setup Request** — ini adalah paket di mana client mengirimkan credential ke server untuk memulai sesi.

Filter tambahan untuk mempermudah pencarian:

```
ntlmssp.auth.username
```

![SMB2 Session Setup Request NTLM](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q3-ntlm-auth.png)
_SMB2 Session Setup Request menampilkan username dan hostname asal_

Di dalam paket ini, pada bagian **NTLM Auth**, terdapat field **Account Name** yang menampilkan username yang digunakan. Ditemukan bahwa attacker menggunakan akun **ssales** yang berasal dari host **HR-PC**.

Ini mengindikasikan bahwa attacker berhasil **mencuri atau mengkompromikan credential** akun `ssales` dari mesin HR-PC, kemudian menggunakannya untuk bergerak lateral ke SALES-PC.

> **Answer:** `ssales`
{: .prompt-tip }

![Answer q3](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q3-answer.png)

---

### Q4 — Nama Service Executable yang Dipasang

**Pertanyaan:** Apa nama file executable yang dipasang attacker di mesin target?

**Langkah analisis:**

Lanjutkan analisis TCP stream ke bagian selanjutnya. Setelah sesi berhasil terbentuk, cari paket **SMB2 Create Request** — ini adalah paket yang digunakan untuk membuat file baru di sistem target.

Filter:

```
smb2.cmd == 5
```

*(Command code 5 = Create/Open file di SMB2)*

![SMB2 Create Request PSEXESVC](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q4-create-request.png)
_SMB2 Create Request menunjukkan file PSEXESVC.exe ditulis ke share ADMIN$_

Di dalam paket Create Request, terlihat nama file yang dibuat: **PSEXESVC.exe** — ini adalah service component dari tool PsExec. File ini disalin ke share `ADMIN$` pada mesin target sebagai bagian dari mekanisme remote execution PsExec.

> **Answer:** `PSEXESVC.exe`
{: .prompt-tip }

![Answer q4](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q4-answer.png)

---

### Q5 — Network Share untuk Instalasi Service

**Pertanyaan:** Share jaringan mana yang digunakan PsExec untuk menginstall service?

**Langkah analisis:**

Perhatikan detail paket **SMB2 Create Request** dari Q4. Di dalam paket tersebut, terdapat field **Tree ID** yang menunjukkan share mana yang sedang diakses.

![ADMIN$ Share Tree Connect](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q5-admin-share1.png)

![ADMIN$ Share Tree Connect](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q5-admin-share2.png)
_Tree ID menunjuk ke \\10.0.0.133\ADMIN$ sebagai target share_

Tree ID menunjuk ke path **`\\10.0.0.133\ADMIN$`** — ini adalah **hidden administrative share** yang secara default di-map ke direktori `C:\Windows` pada sistem Windows. Share ini biasanya hanya bisa diakses oleh administrator dan digunakan untuk keperluan administrasi remote.

PsExec memanfaatkan `ADMIN$` karena:
1. Memberikan akses langsung ke direktori sistem Windows
2. Tersedia secara default di semua sistem Windows
3. Bisa diakses menggunakan credential administrator yang valid

> **Answer:** `ADMIN$`
{: .prompt-tip }

![ADMIN$ Share Tree Connect](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q5-answer.png)

---

### Q6 — Network Share untuk Komunikasi

**Pertanyaan:** Share mana yang digunakan PsExec untuk komunikasi antar mesin?

**Langkah analisis:**

Scroll ke bagian awal TCP stream untuk melihat **SMB2 Tree Connect Request** yang terjadi sebelum proses instalasi service. Ini adalah paket di mana client meminta akses ke share tertentu.

Filter untuk melihat semua Tree Connect Request:

```
smb2.cmd == 3
```

*(Command code 3 = Tree Connect di SMB2)*

![IPC$ Share Tree Connect](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q6-ipc-share.png)
_Tree Connect Request menunjukkan koneksi ke \\10.0.0.133\IPC$_

Ditemukan koneksi ke **`\\10.0.0.133\IPC$`** — IPC$ (Inter-Process Communication) adalah share khusus Windows yang digunakan bukan untuk menyimpan file, melainkan untuk:

- **Remote Procedure Calls (RPC)**
- Komunikasi antar proses secara remote
- Manajemen service dan autentikasi

PsExec menggunakan IPC$ sebagai channel komunikasi untuk mengirim perintah dan menerima output dari service yang sudah diinstall di mesin target.

> **Answer:** `IPC$`
{: .prompt-tip }

![IPC$ Share Tree Connect](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q6-answer.png)

---

### Q7 — Hostname Mesin Target Kedua

**Pertanyaan:** Apa hostname mesin kedua yang coba dijadikan target pivot oleh attacker?

**Langkah analisis:**

Cari SMB session baru di luar TCP stream yang sudah dianalisis sebelumnya. Gunakan filter untuk menemukan **SMB Negotiate Request** dari IP attacker ke IP yang berbeda:

```
ip.src == 10.0.0.130 && smb
```

![SMB ke target kedua 10.0.0.131](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q7-second-target.png)
_Attacker mencoba SMB Negotiate ke 10.0.0.131 — target pivot kedua_

Ditemukan upaya koneksi SMB dari `10.0.0.130` ke IP baru: **`10.0.0.131`**. Follow TCP Stream dari koneksi ini, lalu cari NTLM Challenge response dari server untuk mengekstrak hostname target.

![NTLM Challenge target kedua MARKETING-PC](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q7-marketing-pc.png)
_NTLM Challenge mengungkap hostname MARKETING-PC, namun autentikasi gagal_

Dari metadata NTLM Challenge, hostname mesin kedua teridentifikasi sebagai **MARKETING-PC**. Namun perlu dicatat — di dalam sesi ini ditemukan error **STATUS_LOGON_FAILURE**, yang berarti upaya pivot ke MARKETING-PC **gagal** karena credential yang digunakan tidak valid di mesin tersebut.

> **Answer:** `MARKETING-PC`
{: .prompt-tip }

![Answer Q7](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/q7-answer.png)

---

## Results Summary

| No | Pertanyaan | Jawaban |
|----|-----------|---------|
| Q1 | IP attacker (initial access) | `10.0.0.130` |
| Q2 | Hostname target pertama | `SALES-PC` |
| Q3 | Username untuk autentikasi | `ssales` |
| Q4 | Service executable yang dipasang | `PSEXESVC.exe` |
| Q5 | Share untuk instalasi service | `ADMIN$` |
| Q6 | Share untuk komunikasi | `IPC$` |
| Q7 | Hostname target kedua | `MARKETING-PC` |

---

## Kesimpulan

![Achievement](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/cyberdefenders/psexec-hunt/achievement.png)

Challenge **PsExec Hunt** memberikan gambaran nyata bagaimana attacker bergerak di dalam jaringan internal menggunakan tool yang sebenarnya legitimate. Hanya dengan satu file PCAP, seluruh rantai serangan bisa direkonstruksi — dari titik masuk, credential yang digunakan, hingga sejauh mana attacker berhasil bergerak.

**Tiga pelajaran utama dari lab ini:**

**1. Monitoring SMB traffic itu wajib**
SMB adalah protokol yang sangat umum di lingkungan Windows — tapi justru karena itu sering diabaikan. Anomali seperti koneksi ke `ADMIN$` atau pembuatan file `.exe` via SMB harus langsung memicu alert.

**2. Credential compromised = lateral movement risk**
Satu akun yang berhasil dikompromikan (`ssales`) membuka pintu ke seluruh mesin yang bisa diakses dengan credential tersebut. Prinsip **least privilege** dan **MFA** adalah defense pertama yang harus diperkuat.

**3. PsExec meninggalkan fingerprint yang khas**
Pola traffic: `IPC$` → `ADMIN$` → pembuatan `PSEXESVC.exe` adalah signature yang sangat identik dengan penggunaan PsExec. Memahami pola ini memungkinkan deteksi yang jauh lebih cepat.

> *Tool yang legitimate pun bisa menjadi senjata — yang membedakan adalah siapa yang memegangnya dan apa tujuannya.*
{: .prompt-info }

---