---
title: Operation Cymbal Cold Room 2026 - Reconstructing Three Breaches with Google SecOps
author: Cyphera
date: 2026-11-01 23:30:00 +0700
description: Solved all 18 challenges and finished 330th of 1,716 teams in Operation Cymbal Cold Room, a 72-hour incident reconstruction CTF by Google Cloud Security and Hack The Box, investigated end-to-end in Google Security Operations.
categories: [Events, Cybersecurity]
tags: [hackthebox, htb, ctf, google-secops, siem, incident-response, dfir, blue-team]
image:
  path: https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/posts/htb-operation-cymbal-cold-room-2026.webp
  alt: Operation Cymbal Cold Room 2026 CTF Certificate of Participation
  caption: Certificate of Participation - Operation Cymbal Cold Room 2026 CTF by Google Cloud Security and Hack The Box
---

## Introduction

A few hours after [NCSC 2026]({% post_url 2026-10-29-NCSC-2026 %}) wrapped up in Jakarta, a different kind of event started on my laptop: **Operation Cymbal: Cold Room**, a 72-hour CTF built by **Google Cloud Security** and hosted on the **Hack The Box** CTF platform.

No exploits and no boxes to root. This one was pure blue team: take a company that has already been breached, dig through its telemetry, and work out exactly what happened.

I finished with **all 18 challenges solved** and placed **330th out of 1,716 teams**.

## Certificate of Participation

![Operation Cymbal Cold Room 2026 Certificate](https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/posts/htb-operation-cymbal-cold-room-2026.webp){: width="800" }
_Certificate of Participation from Hack The Box, Google Cloud Security, and the Google Cloud Security Community_

| | |
|---|---|
| **Event** | Operation Cymbal: Cold Room 2026 CTF |
| **Organizers** | Google Cloud Security, Hack The Box, Google Cloud Security Community |
| **CTF Date** | October 29 - November 1, 2026 (72 hours) |
| **Team** | cyphera |
| **Solved Challenges** | 18/18 |
| **Total Points** | 2,075 |
| **Team Ranking** | 330th of 1,716 teams |

## About the Event

### The Scenario

**Cymbal Investments** has collapsed after **three seemingly unrelated breaches**. Its entire environment has been frozen and sealed inside a **"Cold Room"**, and participants step in as certified reconstructors.

The job: search for evidence in **Google Security Operations (Google SecOps)**, separate the attacker's movements from normal activity, rebuild each intrusion end-to-end, and file findings that hold up.

### Format

```yaml
Event: Operation Cymbal - Cold Room 2026 CTF
Organizers: Google Cloud Security x Hack The Box x Google Cloud Security Community
Kickoff: Live workshop, Oct 29, 9:00 AM PT (Google SecOps features + HTB platform walkthrough)
Window: Oct 29 16:00 UTC - Nov 1 16:00 UTC (72 hours)
Structure: 3 incidents, 18 flags
Platform: HTB CTF Platform + Google SecOps tenant
Mode: Online
```

The kickoff workshop was more than a formality. It walked through the Google SecOps features we would need, so even people new to the platform could get started on the challenge right away.

## The Challenge: Reconstructing a Kill Chain

The three breaches looked unrelated at first. The real work was in correlating telemetry across sources, identity, endpoint, cloud, and email, until each breach had a clear story:

1. **Initial access**: How did the attacker get in, and which user or system was the first foothold?
2. **Execution and persistence**: What ran after that, and how did the attacker make sure they could come back?
3. **Lateral movement and privilege**: Which accounts and hosts did they touch next?
4. **Objective**: What did they ultimately go after, and what left the environment?

Every flag was one piece of that timeline. Getting a flag wrong usually meant the story in my head was wrong too, so I had to go back and re-check the evidence.

> In an incident reconstruction CTF, the flags are not the goal. The timeline is. The flags just confirm you understood it correctly.
{: .prompt-tip }

## Working in Google SecOps

Most of the 72 hours was spent inside Google SecOps. A few things I took away from working with it:

- **Search first, then pivot**: Start from one indicator (a user, a host, a domain, a hash) and pivot outward to every related event
- **Normalized data helps a lot**: Logs from different sources share one data model (UDM), so one query can cover identity, endpoint, and cloud events at once
- **Time is the key filter**: Narrowing the time window around a suspicious event is often faster than writing a more complex query
- **Write it down as you go**: With three intrusions running in parallel, it is easy to mix up which artifact belongs to which breach. Keeping a running timeline for each incident saved me several times

## Key Takeaways

1. **Breaches rarely look connected at first**: Correlation across data sources is what turns noise into a story
2. **Evidence beats assumptions**: Every conclusion needs a log line to back it up
3. **A SIEM is only as good as the questions you ask it**: Knowing the attacker's likely next step tells you where to search
4. **Consistency over 72 hours**: Solving 18/18 came from steady work across all three days, not one big push

## Why It Matters

My background includes SOC analyst work, and this CTF felt very close to real incident response: a lot of data, limited time, and a need for findings you can defend. It was also a good complement to my [Fortinet NSE 5 Security Operations]({% post_url 2026-08-09-fortinet-nse5-certified-security-operations %}) certification, this time on a cloud-native SIEM instead of FortiAnalyzer.

The event also came with a reward: an exam voucher for the Google Cloud Professional Security Operations Engineer certification. I used it less than two weeks later and passed. Read about it in [Google Cloud Certified — Professional Security Operations Engineer]({% post_url 2026-11-13-gcp-professional-security-operations-engineer %}).

## Final Thoughts

Thank you to **Google Cloud Security**, **Hack The Box**, and the **Google Cloud Security Community** for building a CTF that focuses on defense instead of offense. Blue team CTFs like this are still rare, and this one was very well made.

18 flags, 3 breaches, 1 Cold Room. On to the next one.

## Resources

- Event page: [Community Capture The Flag with Hack The Box - Operation Cymbal: Cold Room](https://security.googlecloudcommunity.com/events/community-capture-the-flag-with-hack-the-box-operation-cymbal-cold-room-141)
- Platform: [Hack The Box CTF](https://ctf.hackthebox.com)
- Community: [Google Cloud Security Community](https://security.googlecloudcommunity.com)

---

*Tags: #HackTheBox #GoogleCloudSecurity #GoogleSecOps #OperationCymbal #ColdRoom #CTF #BlueTeam #IncidentResponse #DFIR*
