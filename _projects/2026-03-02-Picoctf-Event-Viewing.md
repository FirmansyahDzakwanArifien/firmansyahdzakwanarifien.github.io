---
title: "Event-Viewing — picoCTF 2025: Windows Event Log Forensics"
date: 2026-03-04 00:00:00 +0700
description: Analisis Windows Event Log untuk mengungkap infeksi malware — mencakup investigasi instalasi software, modifikasi registry, dan mekanisme shutdown otomatis yang tersembunyi.
categories:
  - picoCTF
  - Forensics
tags:
  - forensics
  - windows
  - event-log
  - malware-analysis
  - dfir
  - registry
  - base64
  - ctf
platform: picoCTF 2025
difficulty: Medium
challenge_author: Venax
status: completed
artifacts:
  - Windows_Log.evtx
---

##  Introduction

Challenge **Event-Viewing** membawa kita ke dalam skenario investigasi malware di lingkungan Windows. Seorang karyawan melaporkan kejadian aneh pada komputernya:

1. Mereka menginstall software dari internet
2. Software dijalankan tapi seperti tidak melakukan apa-apa
3. Setiap kali komputer dinyalakan dan login, muncul layar hitam command prompt sekilas lalu komputer langsung mati

Tugas kita: **analisis Windows Event Log** untuk menemukan jejak dari ketiga kejadian tersebut, dan kumpulkan 3 potongan flag yang tersembunyi di dalamnya.

### Apa itu Windows Event Log?

Windows Event Log adalah sistem pencatatan bawaan Windows yang merekam semua aktivitas penting di sistem — mulai dari instalasi software, perubahan registry, hingga proses shutdown. File log ini berekstensi `.evtx` dan bisa dibuka dengan **Event Viewer** atau diparse menggunakan script Python.

**Tools yang dibutuhkan:**

| Tool | Fungsi |
|------|--------|
| Python + `python-evtx` | Parse file `.evtx` ke format XML |
| Event Viewer (Windows) | Baca log secara visual |
| `grep` / text editor | Cari Event ID tertentu |
| CyberChef / terminal | Decode Base64 |

> Install library python-evtx dengan: `pip install python-evtx`
{: .prompt-info }

---

##  Step-by-Step Solution

### Step 1 — Parse File EVTX ke Format XML

File `.evtx` adalah format binary — tidak bisa dibaca langsung seperti teks biasa. Langkah pertama kita ubah dulu ke format XML yang mudah dibaca dan dicari.

Buat file `parse_evtx.py` dengan isi berikut:

```python
from Evtx.Evtx import Evtx

def parse_evtx_file(file_path):
    xml_records = []
    try:
        with Evtx(file_path) as log:
            for record in log.records():
                xml_records.append(record.xml())
    except FileNotFoundError:
        print("Error: File tidak ditemukan. Cek kembali path-nya.")
    except Exception as e:
        print(f"Terjadi error: {e}")
    return xml_records

if __name__ == "__main__":
    file_path = input("Masukkan path ke file EVTX: ").strip()
    records = parse_evtx_file(file_path)
    for rec in records:
        print(rec)
```

Jalankan script tersebut:

```bash
python3 parse_evtx.py > output.xml
# Masukkan path file saat diminta, contoh: /home/kali/Downloads/Windows_Log.evtx
```

![Output parse EVTX ke XML](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/event-viewing/step1-parse-evtx.png)
_File EVTX berhasil dikonversi ke XML — siap untuk dianalisis_

Sekarang kita punya file `output.xml` yang berisi seluruh log dalam format teks. Selanjutnya kita cari event-event spesifik berdasarkan **Event ID**.

---

### Step 2 — Fase 1: Instalasi Software (Event ID 1033)

**Konteks:** Karyawan menginstall software dari internet menggunakan installer.

Di Windows, setiap kali sebuah software berhasil diinstall via Windows Installer, sistem mencatat Event ID **1033** di log Windows Installer.

Cari Event ID ini di hasil parse kita:

```bash
grep -A 30 "EventID>1033" output.xml
```

Atau jika menggunakan Windows Event Viewer:
- Buka **Event Viewer**
- Navigasi ke `Applications and Services Logs > Microsoft > Windows > MsiInstaller`
- Filter by Event ID: `1033`

![Event ID 1033 di log](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/event-viewing/step2-event-1033.png)
_Event ID 1033 mencatat instalasi software beserta string Base64 tersembunyi_

Di dalam event ini, ditemukan sebuah string yang terlihat seperti Base64:

```
cGljb0NURntFdjNudF92aTN3djNyXw==
```

Decode menggunakan terminal:

```bash
echo "cGljb0NURntFdjNudF92aTN3djNyXw==" | base64 -d
```

Hasil decode:

```
picoCTF{Ev3nt_vi3wv3r_
```

>  **Flag Part 1:** `picoCTF{Ev3nt_vi3wv3r_`
{: .prompt-tip }

---

### Step 3 — Fase 2: Eksekusi Software & Modifikasi Registry (Event ID 4657)

**Konteks:** Software dijalankan tapi "seperti tidak melakukan apa-apa" — padahal diam-diam memodifikasi registry.

Ini adalah teknik klasik malware: **memasukkan dirinya ke registry Run key** agar otomatis berjalan setiap kali sistem startup.

Registry key yang biasa dipakai malware untuk persistence:

```
SOFTWARE\Microsoft\Windows\CurrentVersion\Run
```

Perubahan pada registry value dicatat oleh Windows dengan Event ID **4657** di Security Log.

Cari Event ID ini:

```bash
grep -A 40 "EventID>4657" output.xml
```

![Event ID 4657 di log](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/event-viewing/step3-event-4657.png)
_Event ID 4657 menunjukkan modifikasi registry Run key dengan nilai Base64_

Di dalam event ini, pada field `ObjectValueName`, ditemukan string Base64:

```
MXNfYV9wcjN0dHlfdXMzZnVsXw==
```

Decode:

```bash
echo "MXNfYV9wcjN0dHlfdXMzZnVsXw==" | base64 -d
```

Hasil decode:

```
1s_a_pr3tty_us3ful_
```

>  **Flag Part 2:** `1s_a_pr3tty_us3ful_`
{: .prompt-tip }

**Apa yang terjadi di balik layar?**

Malware menambahkan entry baru di registry Run key yang mengarah ke file berbahaya — dalam hal ini `custom_shutdown.exe`. Setiap kali Windows startup dan user login, file ini otomatis dieksekusi, dan itulah yang menyebabkan komputer langsung mati.

---

### Step 4 — Fase 3: Shutdown Otomatis (Event ID 1074)

**Konteks:** Setiap login, muncul command prompt sekilas lalu komputer mati.

Setiap kali sistem di-shutdown atau restart, Windows mencatat Event ID **1074** di System Log — berisi informasi proses mana yang memicu shutdown dan alasannya.

Cari Event ID ini:

```bash
grep -A 40 "EventID>1074" output.xml
```

![Event ID 1074 di log](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/event-viewing/step4-event-1074.png)
_Event ID 1074 menunjukkan dua entri shutdown — satu legitimate, satu dari malware_

> **Perhatikan:** Ada **dua entri** Event ID 1074 di sini:
>
> 1. **`RuntimeBroker.exe`** → proses Windows yang legitimate, ini adalah "smokescreen" / pengalih perhatian
> 2. **`custom_shutdown.exe`** (ditulis juga sebagai `custum_shutdown.exe`) → ini adalah binary malware yang sebenarnya memicu shutdown
{: .prompt-warning }

Di dalam event dari `custom_shutdown.exe`, ditemukan string Base64:

```
dDAwbF84MWJhM2ZlOX0=
```

Decode:

```bash
echo "dDAwbF84MWJhM2ZlOX0=" | base64 -d
```

Hasil decode:

```
t00l_81ba3fe9}
```

>  **Flag Part 3:** `t00l_81ba3fe9}`
{: .prompt-tip }

---

### Step 5 — Gabungkan Semua Potongan Flag

Kita kumpulkan ketiga potongan sesuai urutan kejadian:

| Fase | Event ID | Decoded |
|------|----------|---------|
| Instalasi software | `1033` | `picoCTF{Ev3nt_vi3wv3r_` |
| Modifikasi registry | `4657` | `1s_a_pr3tty_us3ful_` |
| Shutdown otomatis | `1074` | `t00l_81ba3fe9}` |

Gabungkan:

```
picoCTF{Ev3nt_vi3wv3r_  +  1s_a_pr3tty_us3ful_  +  t00l_81ba3fe9}
```

> **Flag:** `picoCTF{Ev3nt_vi3wv3r_1s_a_pr3tty_us3ful_t00l_81ba3fe9}`
{: .prompt-tip }

---

## 📊 Summary

| Fase | Event ID | Log Source | Teknik Malware | Flag Part |
|------|----------|------------|----------------|-----------|
| Instalasi | `1033` | MsiInstaller | Software installer berbahaya | `picoCTF{Ev3nt_vi3wv3r_` |
| Eksekusi | `4657` | Security Log | Registry persistence (Run key) | `1s_a_pr3tty_us3ful_` |
| Shutdown | `1074` | System Log | Auto-shutdown via custom binary | `t00l_81ba3fe9}` |

---

## 🗺️ Attack Flow

```
[Karyawan download installer]
         │
         ▼
[Install software → Event ID 1033]
  └─ Flag Part 1 tersembunyi di sini

         │
         ▼
[Software dijalankan → terlihat tidak ada yang terjadi]
  └─ Diam-diam: tulis entry ke registry Run key
  └─ Event ID 4657 mencatat perubahan ini
  └─ Flag Part 2 tersembunyi di sini

         │
         ▼
[Setiap startup → registry Run key dieksekusi]
  └─ custom_shutdown.exe berjalan otomatis
  └─ Komputer langsung shutdown
  └─ Event ID 1074 mencatat kejadian ini
  └─ Flag Part 3 tersembunyi di sini
```

![Attack flow visualization](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/projects/task/picoctf/event-viewing/attack-flow.png)
_Alur serangan malware dari instalasi hingga shutdown otomatis_

---

##  Penutup & Kesimpulan

Challenge **Event-Viewing** mengajarkan kita tentang pentingnya **Windows Event Log** sebagai sumber utama investigasi forensik di lingkungan Windows. Dengan memahami Event ID yang tepat, kita bisa merekonstruksi seluruh aktivitas malware hanya dari log:

**Tiga pelajaran utama dari challenge ini:**

**1. Event ID adalah kunci navigasi log**
Windows mencatat ratusan jenis event — mengetahui Event ID mana yang relevan membuat investigasi jauh lebih efisien. Tiga Event ID krusial di sini: `1033` (instalasi), `4657` (registry), `1074` (shutdown).

**2. Registry Run key adalah tempat favorit malware**
Teknik persistence via `SOFTWARE\Microsoft\Windows\CurrentVersion\Run` adalah salah satu yang paling umum digunakan malware sampai saat ini. Selalu periksa registry key ini saat menginvestigasi insiden Windows.

**3. Jangan tertipu proses legitimate**
Malware sengaja menggunakan `RuntimeBroker.exe` sebagai "smokescreen" sebelum menjalankan `custom_shutdown.exe`. Investigator yang tidak teliti bisa saja berhenti di situ dan melewatkan binary berbahaya yang sebenarnya.

Skenario dalam challenge ini sangat mencerminkan serangan nyata di dunia profesional — dan itulah mengapa pemahaman mendalam tentang Windows Event Log menjadi skill wajib bagi seorang Blue Team analyst.

> *Malware bisa bersembunyi, tapi Windows selalu mencatat. Event Log tidak pernah berbohong — jika kamu tahu harus mencari apa.*
{: .prompt-info }

