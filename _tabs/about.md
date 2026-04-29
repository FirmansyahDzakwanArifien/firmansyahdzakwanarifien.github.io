---
# the default layout is 'page'
icon: fas fa-info-circle
order: 2
---

<style>
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');

:root {
  --accent: #2563eb;
  --accent-soft: rgba(37, 99, 235, 0.07);
  --border: rgba(128, 128, 128, 0.15);
  --border-hover: rgba(37, 99, 235, 0.3);
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

.hero-cta {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
}

.btn-cv {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  background: var(--accent);
  color: #fff !important;
  font-size: 0.84rem;
  font-weight: 500;
  border-radius: var(--radius);
  text-decoration: none !important;
  transition: all 0.2s ease;
  border: none;
}

.btn-cv:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  text-decoration: none !important;
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

/* ── Experience — filter buttons ── */
.exp-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 1.25rem;
}

.exp-filter-btn {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  padding: 5px 14px;
  border: 1px solid var(--border);
  border-radius: 20px;
  background: transparent;
  cursor: pointer;
  color: var(--muted);
  transition: all 0.15s;
  font-weight: 500;
}

.exp-filter-btn.active,
.exp-filter-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-soft);
}

/* ── Experience — timeline ── */
.exp-timeline {
  position: relative;
  padding-left: 24px;
}

.exp-timeline::before {
  content: '';
  position: absolute;
  left: 6px; top: 12px; bottom: 12px;
  width: 1px;
  background: var(--border);
}

.exp-card {
  position: relative;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0.85rem 1rem;
  margin-bottom: 8px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  overflow: hidden;
}

.exp-card::before {
  content: '';
  position: absolute;
  left: -25px; top: 14px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #fff;
  border: 1.5px solid var(--border);
  transition: border-color 0.15s, background 0.15s;
  z-index: 1;
}

.exp-card.open::before {
  border-color: var(--accent);
  background: var(--accent);
}

.exp-card:hover { border-color: rgba(128,128,128,0.35); }
.exp-card.open  { border-color: var(--border-hover); background: var(--accent-soft); }

.exp-card[data-hidden="true"] { display: none; }

.exp-card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.exp-card-left { flex: 1; min-width: 0; }

.exp-role {
  font-size: 0.88rem;
  font-weight: 500;
  margin: 0 0 3px;
}

.exp-company {
  font-size: 0.78rem;
  color: var(--accent);
  font-weight: 500;
  margin: 0;
}

.exp-card-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.exp-period {
  font-size: 0.72rem;
  color: var(--muted);
  white-space: nowrap;
}

.exp-badge {
  font-size: 0.68rem;
  padding: 2px 9px;
  border-radius: 10px;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.exp-badge.security  { background: rgba(37,99,235,0.1);  color: #1d4ed8; }
.exp-badge.sysadmin  { background: rgba(15,110,86,0.1);  color: #0f6e56; }
.exp-badge.devops    { background: rgba(127,119,221,0.12); color: #534ab7; }
.exp-badge.community { background: rgba(186,117,23,0.12); color: #9a6612; }
.exp-badge.research  { background: rgba(128,128,128,0.1); color: #5f5e5a; }

.exp-desc-wrap {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.28s ease, opacity 0.2s;
}

.exp-card.open .exp-desc-wrap {
  max-height: 120px;
  opacity: 1;
}

.exp-desc {
  font-size: 0.82rem;
  line-height: 1.65;
  color: var(--muted);
  margin: 0.5rem 0 0;
  padding-top: 0.55rem;
  border-top: 1px solid var(--border);
}

/* ── Skills ── */
.skills-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 10px;
}

.skills-row-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.skill-card {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.1rem;
}

.skill-card-title {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  margin: 0 0 0.75rem;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.skill-tag {
  font-size: 0.78rem;
  padding: 3px 10px;
  border-radius: 6px;
  background: rgba(128,128,128,0.07);
  border: 1px solid var(--border);
  color: inherit;
  opacity: 0.85;
}

.skill-kv {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.skill-kv-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 0.82rem;
}

.skill-kv-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.45;
  min-width: 72px;
  flex-shrink: 0;
}

.skill-lang-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-lang-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
}

.skill-lang-level {
  font-size: 0.72rem;
  opacity: 0.5;
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

/* ── What's Next ── */
.next-block {
  font-size: 0.95rem;
  line-height: 1.8;
  opacity: 0.8;
}

/* ── Connect ── */
.connect-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 0.6rem;
}

.connect-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.65rem 1rem;
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
  opacity: 0.45;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: block;
}

.connect-link .cl-value {
  display: block;
  line-height: 1.2;
  font-size: 0.84rem;
}

/* ── Responsive ── */
@media (max-width: 640px) {
  .hero-block {
    grid-template-columns: 1fr;
  }
  .hero-avatar img { width: 100px; height: 100px; }
  .hero-name { font-size: 1.9rem; }
  .skills-row  { grid-template-columns: 1fr; }
  .skills-row-2 { grid-template-columns: 1fr; }
  .exp-card-right { display: none; }
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
      <div class="hero-cta">
        <a href="https://drive.google.com/file/d/10pIfd05f4a8LTz6F_B9ICiVjTCcJ2wWb/view?usp=sharing" target="_blank" rel="noopener noreferrer" class="btn-cv">
          <i class="fab fa-drive" style="font-size:13px;"></i>
          View My CV
        </a>
      </div>
    </div>
  </div>

  <!-- Experience -->
  <div class="about-section">
    <p class="section-label">Professional Experience</p>

    <div class="exp-filters">
      <button class="exp-filter-btn active" onclick="filterExp('all', this)">All</button>
      <button class="exp-filter-btn" onclick="filterExp('security', this)">Security</button>
      <button class="exp-filter-btn" onclick="filterExp('sysadmin', this)">Infrastructure</button>
      <button class="exp-filter-btn" onclick="filterExp('devops', this)">DevOps</button>
      <button class="exp-filter-btn" onclick="filterExp('community', this)">Community</button>
      <button class="exp-filter-btn" onclick="filterExp('research', this)">Research</button>
    </div>

    <div class="exp-timeline">

      <div class="exp-card" data-cat="sysadmin" onclick="toggleExp(this)">
        <div class="exp-card-head">
          <div class="exp-card-left">
            <p class="exp-role">Implementation Engineer</p>
            <p class="exp-company">PT Jarvis Integrasi Solusi</p>
          </div>
          <div class="exp-card-right">
            <span class="exp-period">Feb 2026 — Present</span>
            <span class="exp-badge sysadmin">Infrastructure</span>
          </div>
        </div>
        <div class="exp-desc-wrap">
          <p class="exp-desc">Implementing and deploying infrastructure solutions for enterprise clients; collaborating with teams to design secure, scalable systems tailored to business needs.</p>
        </div>
      </div>

      <div class="exp-card" data-cat="community" onclick="toggleExp(this)">
        <div class="exp-card-head">
          <div class="exp-card-left">
            <p class="exp-role">Leader, Student Cybersecurity Community</p>
            <p class="exp-company">NFSCC — STT Terpadu Nurul Fikri</p>
          </div>
          <div class="exp-card-right">
            <span class="exp-period">Apr 2025 — Mar 2026</span>
            <span class="exp-badge community">Community</span>
          </div>
        </div>
        <div class="exp-desc-wrap">
          <p class="exp-desc">Led cybersecurity initiatives including workshops, training programs, and community engagement; organized security awareness campaigns and facilitated CTF competitions.</p>
        </div>
      </div>

      <div class="exp-card" data-cat="community" onclick="toggleExp(this)">
        <div class="exp-card-head">
          <div class="exp-card-left">
            <p class="exp-role">Campus Ambassador</p>
            <p class="exp-company">LINUXENIC Corporation</p>
          </div>
          <div class="exp-card-right">
            <span class="exp-period">Nov 2025 — Jan 2026</span>
            <span class="exp-badge community">Community</span>
          </div>
        </div>
        <div class="exp-desc-wrap">
          <p class="exp-desc">Promoted open-source technologies and organized campus engagement activities around the Linux and FOSS ecosystem.</p>
        </div>
      </div>

      <div class="exp-card" data-cat="community" onclick="toggleExp(this)">
        <div class="exp-card-head">
          <div class="exp-card-left">
            <p class="exp-role">Assistant Lecturer</p>
            <p class="exp-company">STT Terpadu Nurul Fikri</p>
          </div>
          <div class="exp-card-right">
            <span class="exp-period">Sep 2025 — Jan 2026</span>
            <span class="exp-badge community">Teaching</span>
          </div>
        </div>
        <div class="exp-desc-wrap">
          <p class="exp-desc">Taught practical Incident Response topics and mentored students in real-world security scenarios and hands-on labs.</p>
        </div>
      </div>

      <div class="exp-card" data-cat="security" onclick="toggleExp(this)">
        <div class="exp-card-head">
          <div class="exp-card-left">
            <p class="exp-role">SOC Analyst</p>
            <p class="exp-company">Xcode / PT. Teknologi Server Indonesia</p>
          </div>
          <div class="exp-card-right">
            <span class="exp-period">Sep 2025 — Dec 2025</span>
            <span class="exp-badge security">Security</span>
          </div>
        </div>
        <div class="exp-desc-wrap">
          <p class="exp-desc">Monitored network traffic and logs for security threats; analyzed incidents and coordinated response actions in a live SOC environment.</p>
        </div>
      </div>

      <div class="exp-card" data-cat="devops" onclick="toggleExp(this)">
        <div class="exp-card-head">
          <div class="exp-card-left">
            <p class="exp-role">DevOps Engineer Trainee</p>
            <p class="exp-company">PT Nurul Fikri Academy</p>
          </div>
          <div class="exp-card-right">
            <span class="exp-period">Aug 2025 — Oct 2025</span>
            <span class="exp-badge devops">DevOps</span>
          </div>
        </div>
        <div class="exp-desc-wrap">
          <p class="exp-desc">Learned infrastructure automation, CI/CD fundamentals, and cloud basics through a structured training program.</p>
        </div>
      </div>

      <div class="exp-card" data-cat="sysadmin" onclick="toggleExp(this)">
        <div class="exp-card-head">
          <div class="exp-card-left">
            <p class="exp-role">Sysadmin Trainee</p>
            <p class="exp-company">PT. Jarvis Integrasi Solusi</p>
          </div>
          <div class="exp-card-right">
            <span class="exp-period">Jul 2025 — Aug 2025</span>
            <span class="exp-badge sysadmin">Sysadmin</span>
          </div>
        </div>
        <div class="exp-desc-wrap">
          <p class="exp-desc">Gained hands-on experience in Linux administration and server configuration in a professional environment.</p>
        </div>
      </div>

      <div class="exp-card" data-cat="research" onclick="toggleExp(this)">
        <div class="exp-card-head">
          <div class="exp-card-left">
            <p class="exp-role">Research &amp; Development</p>
            <p class="exp-company">BPH Litbang, STT Terpadu Nurul Fikri</p>
          </div>
          <div class="exp-card-right">
            <span class="exp-period">Jun 2024 — Mar 2025</span>
            <span class="exp-badge research">Research</span>
          </div>
        </div>
        <div class="exp-desc-wrap">
          <p class="exp-desc">Contributed to research projects and development initiatives at the university research bureau.</p>
        </div>
      </div>

    </div>
  </div>

  <!-- Skills -->
  <div class="about-section">
    <p class="section-label">Skills &amp; Expertise</p>

    <div class="skills-row">
      <div class="skill-card">
        <p class="skill-card-title">Cybersecurity</p>
        <div class="skill-tags">
          <span class="skill-tag">SOC & Monitoring</span>
          <span class="skill-tag">Vuln Assessment</span>
          <span class="skill-tag">Incident Response</span>
          <span class="skill-tag">Pentest Fundamentals</span>
          <span class="skill-tag">Threat Investigation</span>
        </div>
      </div>
      <div class="skill-card">
        <p class="skill-card-title">System Administration</p>
        <div class="skill-tags">
          <span class="skill-tag">Linux Management</span>
          <span class="skill-tag">Server Admin</span>
          <span class="skill-tag">Infra Automation</span>
          <span class="skill-tag">Bash Scripting</span>
          <span class="skill-tag">Network Fundamentals</span>
        </div>
      </div>
      <div class="skill-card">
        <p class="skill-card-title">Cloud &amp; DevOps</p>
        <div class="skill-tags">
          <span class="skill-tag">Cloud Foundations</span>
          <span class="skill-tag">CI/CD</span>
          <span class="skill-tag">Docker</span>
          <span class="skill-tag">IaC</span>
          <span class="skill-tag">DevOps Practices</span>
        </div>
      </div>
    </div>

    <div class="skills-row-2">
      <div class="skill-card">
        <p class="skill-card-title">Technical Stack</p>
        <div class="skill-kv">
          <div class="skill-kv-row">
            <span class="skill-kv-label">Languages</span>
            <span>Python · Bash · JavaScript</span>
          </div>
          <div class="skill-kv-row">
            <span class="skill-kv-label">Tools</span>
            <span>Git · Docker · CI/CD basics</span>
          </div>
          <div class="skill-kv-row">
            <span class="skill-kv-label">Platforms</span>
            <span>Linux · VS Code</span>
          </div>
        </div>
      </div>
      <div class="skill-card">
        <p class="skill-card-title">Languages</p>
        <div class="skill-lang-row">
          <div class="skill-lang-item">
            <span>Indonesian</span>
            <span class="skill-lang-level">Native</span>
          </div>
          <div class="skill-lang-item">
            <span>English</span>
            <span class="skill-lang-level">Elementary</span>
          </div>
          <div class="skill-lang-item">
            <span>Arabic</span>
            <span class="skill-lang-level">Elementary</span>
          </div>
        </div>
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

<script>
function toggleExp(el) {
  var isOpen = el.classList.contains('open');
  document.querySelectorAll('.exp-card.open').forEach(function(c) { c.classList.remove('open'); });
  if (!isOpen) el.classList.add('open');
}

function filterExp(cat, btn) {
  document.querySelectorAll('.exp-filter-btn').forEach(function(b) { b.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.exp-card').forEach(function(c) {
    if (cat === 'all' || c.dataset.cat === cat) {
      c.removeAttribute('data-hidden');
    } else {
      c.setAttribute('data-hidden', 'true');
      c.classList.remove('open');
    }
  });
}
</script>