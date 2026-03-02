---
# the default layout is 'page'
icon: fas fa-info-circle
order: 2
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

:root {
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.08);
  --border: rgba(128, 128, 128, 0.15);
  --muted: rgba(128, 128, 128, 0.6);
  --radius: 12px;
}

.about-wrap {
  font-family: 'DM Sans', sans-serif;
  max-width: 780px;
  margin: 0 auto;
}

/* ── Hero ── */
.hero-block {
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 2rem;
  align-items: start;
  padding: 2.5rem 0 2rem;
  border-bottom: 1px solid var(--border);
  margin-bottom: 3rem;
}

.hero-avatar img {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  filter: grayscale(10%);
  border: 3px solid var(--border);
}

.hero-name {
  font-family: 'Instrument Serif', serif;
  font-size: 2.4rem;
  font-weight: 400;
  line-height: 1.15;
  margin: 0 0 0.4rem;
  letter-spacing: -0.02em;
}

.hero-name em {
  font-style: italic;
  color: var(--accent);
}

.hero-role {
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 1rem;
}

.hero-bio {
  font-size: 0.97rem;
  line-height: 1.75;
  opacity: 0.85;
  margin: 0;
}

/* ── Section title ── */
.section-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.section-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

.about-section {
  margin-bottom: 3rem;
}

/* ── Experience timeline ── */
.exp-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.exp-item {
  display: grid;
  grid-template-columns: 1fr;
  padding: 1.1rem 0;
  border-bottom: 1px solid var(--border);
  position: relative;
}

.exp-item:last-child {
  border-bottom: none;
}

.exp-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 0.3rem;
}

.exp-title {
  font-size: 0.95rem;
  font-weight: 500;
  margin: 0;
}

.exp-period {
  font-size: 0.78rem;
  color: var(--muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.exp-company {
  font-size: 0.82rem;
  color: var(--accent);
  font-weight: 500;
  margin: 0 0 0.4rem;
}

.exp-desc {
  font-size: 0.87rem;
  line-height: 1.65;
  opacity: 0.75;
  margin: 0;
}

/* ── Skills grid ── */
.skills-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}

.skills-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.skill-card {
  background: var(--accent-soft);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.25rem 1.25rem 1.1rem;
}

.skill-card-title {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin: 0 0 0.85rem;
  opacity: 0.9;
}

.skill-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.skill-card ul li {
  font-size: 0.84rem;
  line-height: 1.5;
  opacity: 0.8;
  padding-left: 0.9rem;
  position: relative;
}

.skill-card ul li::before {
  content: '—';
  position: absolute;
  left: 0;
  color: var(--accent);
  font-size: 0.75rem;
  top: 0.05em;
}

.skill-card p {
  font-size: 0.84rem;
  line-height: 1.6;
  opacity: 0.8;
  margin: 0 0 0.4rem;
}

.skill-card p:last-child {
  margin-bottom: 0;
}

/* ── Education ── */
.edu-block {
  border-left: 2px solid var(--accent);
  padding: 0.75rem 0 0.75rem 1.25rem;
}

.edu-degree {
  font-family: 'Instrument Serif', serif;
  font-size: 1.15rem;
  font-weight: 400;
  margin: 0 0 0.25rem;
}

.edu-meta {
  font-size: 0.83rem;
  opacity: 0.6;
  margin: 0;
}

/* ── Next section ── */
.next-block {
  font-size: 0.95rem;
  line-height: 1.8;
  opacity: 0.8;
}

/* ── Connect links ── */
.connect-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.6rem;
}

.connect-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  text-decoration: none !important;
  font-size: 0.85rem;
  font-weight: 500;
  transition: border-color 0.2s, background 0.2s;
  color: inherit !important;
}

.connect-link:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.connect-link .cl-label {
  opacity: 0.5;
  font-size: 0.72rem;
  font-weight: 400;
  display: block;
}

.connect-link .cl-value {
  display: block;
  line-height: 1.2;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .hero-block {
    grid-template-columns: 1fr;
    text-align: left;
  }
  .hero-avatar img {
    width: 100px;
    height: 100px;
  }
  .hero-name {
    font-size: 1.9rem;
  }
  .skills-grid {
    grid-template-columns: 1fr;
  }
  .skills-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>

<div class="about-wrap">

  <!-- Hero -->
  <div class="hero-block">
    <div class="hero-avatar">
      <img src="https://cdn.jsdelivr.net/gh/firmansyahdzakwanarifien/firmansyahdzakwanarifien-assets@main/blog/img/avatar/me.png" alt="Firmansyah Dzakwan Arifien" />
    </div>
    <div class="hero-text">
      <h1 class="hero-name">Firmansyah <em>Dzakwan</em> Arifien</h1>
      <p class="hero-role">Security &amp; Infrastructure · Implementation Engineer</p>
      <p class="hero-bio">Informatics Engineering student at STT Terpadu Nurul Fikri with a deep focus on cybersecurity and infrastructure security. I learn best through hands-on experience — whether in a SOC environment, managing Linux systems, or building secure infrastructure. Currently working as an Implementation Engineer at PT Jarvis Integrasi Solusi, while leading the Nurul Fikri Student Cybersecurity Community and teaching practical Incident Response.</p>
    </div>
  </div>

  <!-- Experience -->
  <div class="about-section">
    <p class="section-label">Professional Experience</p>
    <div class="exp-list">

      <div class="exp-item">
        <div class="exp-top">
          <p class="exp-title">Implementation Engineer</p>
          <span class="exp-period">Feb 2026 — Present</span>
        </div>
        <p class="exp-company">PT Jarvis Integrasi Solusi</p>
        <p class="exp-desc">Implementing and deploying infrastructure solutions for enterprise clients; collaborating with teams to design secure, scalable systems tailored to business needs.</p>
      </div>

      <div class="exp-item">
        <div class="exp-top">
          <p class="exp-title">Leader, Student Cybersecurity Community</p>
          <span class="exp-period">Apr 2025 — Mar 2026</span>
        </div>
        <p class="exp-company">NFSCC — STT Terpadu Nurul Fikri</p>
        <p class="exp-desc">Led cybersecurity initiatives including workshops, training programs, and community engagement activities; organized security awareness campaigns and facilitated CTF competitions.</p>
      </div>

      <div class="exp-item">
        <div class="exp-top">
          <p class="exp-title">Campus Ambassador</p>
          <span class="exp-period">Nov 2025 — Jan 2026</span>
        </div>
        <p class="exp-company">LINUXENIC Corporation</p>
        <p class="exp-desc">Promoted open-source technologies and organized campus engagement activities.</p>
      </div>

      <div class="exp-item">
        <div class="exp-top">
          <p class="exp-title">Assistant Lecturer</p>
          <span class="exp-period">Sep 2025 — Jan 2026</span>
        </div>
        <p class="exp-company">STT Terpadu Nurul Fikri</p>
        <p class="exp-desc">Taught practical Incident Response topics and mentored students in real-world security scenarios.</p>
      </div>

      <div class="exp-item">
        <div class="exp-top">
          <p class="exp-title">SOC Analyst</p>
          <span class="exp-period">Sep 2025 — Dec 2025</span>
        </div>
        <p class="exp-company">Xcode / PT. Teknologi Server Indonesia</p>
        <p class="exp-desc">Monitored network traffic and logs for security threats; analyzed incidents and coordinated responses.</p>
      </div>

      <div class="exp-item">
        <div class="exp-top">
          <p class="exp-title">DevOps Engineer Trainee</p>
          <span class="exp-period">Aug 2025 — Oct 2025</span>
        </div>
        <p class="exp-company">PT Nurul Fikri Academy</p>
        <p class="exp-desc">Learned infrastructure automation, CI/CD fundamentals, and cloud basics.</p>
      </div>

      <div class="exp-item">
        <div class="exp-top">
          <p class="exp-title">Sysadmin Trainee</p>
          <span class="exp-period">Jul 2025 — Aug 2025</span>
        </div>
        <p class="exp-company">PT. Jarvis Integrasi Solusi</p>
        <p class="exp-desc">Gained hands-on experience in Linux administration and server configuration.</p>
      </div>

      <div class="exp-item">
        <div class="exp-top">
          <p class="exp-title">Research &amp; Development</p>
          <span class="exp-period">Jun 2024 — Mar 2025</span>
        </div>
        <p class="exp-company">BPH Litbang, STT Terpadu Nurul Fikri</p>
        <p class="exp-desc">Contributed to research projects and development initiatives at the research bureau.</p>
      </div>

    </div>
  </div>

  <!-- Skills -->
  <div class="about-section">
    <p class="section-label">Skills &amp; Expertise</p>

    <div class="skills-grid">
      <div class="skill-card">
        <p class="skill-card-title">Cybersecurity</p>
        <ul>
          <li>Security operations (SOC) &amp; threat monitoring</li>
          <li>Vulnerability assessment &amp; analysis</li>
          <li>Incident response &amp; threat investigation</li>
          <li>Penetration testing fundamentals</li>
        </ul>
      </div>
      <div class="skill-card">
        <p class="skill-card-title">System Administration</p>
        <ul>
          <li>Linux system management &amp; configuration</li>
          <li>Server administration &amp; maintenance</li>
          <li>Infrastructure automation &amp; scripting</li>
          <li>Network fundamentals &amp; troubleshooting</li>
        </ul>
      </div>
      <div class="skill-card">
        <p class="skill-card-title">Cloud &amp; DevOps</p>
        <ul>
          <li>Cloud foundations (CP1)</li>
          <li>DevOps methodologies &amp; CI/CD</li>
          <li>Infrastructure as Code (IaC)</li>
          <li>Containerization with Docker</li>
        </ul>
      </div>
    </div>

    <div class="skills-grid-2">
      <div class="skill-card">
        <p class="skill-card-title">Technical Stack</p>
        <p><strong>Languages:</strong> Python, Bash, JavaScript</p>
        <p><strong>Tools:</strong> Git, Docker, CI/CD basics</p>
        <p><strong>Platforms:</strong> Linux, VS Code</p>
      </div>
      <div class="skill-card">
        <p class="skill-card-title">Languages</p>
        <p>Indonesian — Native</p>
        <p>English — Elementary</p>
        <p>Arabic — Elementary</p>
      </div>
    </div>
  </div>

  <!-- Education -->
  <div class="about-section">
    <p class="section-label">Education</p>
    <div class="edu-block">
      <p class="edu-degree">Teknik Informatika — Informatics Engineering</p>
      <p class="edu-meta">STT Terpadu Nurul Fikri &nbsp;·&nbsp; Sep 2023 – 2026</p>
    </div>
  </div>

  <!-- What's Next -->
  <div class="about-section">
    <p class="section-label">What's Next</p>
    <p class="next-block">Currently focused on growing as a well-rounded security professional. Particularly interested in deepening penetration testing skills and exploring how DevSecOps can improve security throughout the development lifecycle. Staying actively involved in the community — through mentoring, contributing to cybersecurity initiatives, and participating in CTF competitions to keep technical skills sharp. The goal: become a security professional who bridges the gap between infrastructure, operations, and security strategy.</p>
  </div>

  <!-- Connect -->
  <div class="about-section">
    <p class="section-label">Let's Connect</p>
    <div class="connect-grid">
      <a href="https://www.linkedin.com/in/firmansyah-dzakwan-arifien-90b1b8293" class="connect-link" target="_blank">
        <span><span class="cl-label">LinkedIn</span><span class="cl-value">firmansyah-dzakwan</span></span>
      </a>
      <a href="https://github.com/FirmansyahDzakwanArifien" class="connect-link" target="_blank">
        <span><span class="cl-label">GitHub</span><span class="cl-value">FirmansyahDzakwanArifien</span></span>
      </a>
      <a href="mailto:contact@codebijak.my.id" class="connect-link">
        <span><span class="cl-label">Email</span><span class="cl-value">contact@codebijak.my.id</span></span>
      </a>
      <a href="https://cyphera.my.id" class="connect-link" target="_blank">
        <span><span class="cl-label">Website</span><span class="cl-value">cyphera.my.id</span></span>
      </a>
      <a href="https://medium.com/@fdzak01" class="connect-link" target="_blank">
        <span><span class="cl-label">Medium</span><span class="cl-value">@fdzak01</span></span>
      </a>
    </div>
  </div>

</div>