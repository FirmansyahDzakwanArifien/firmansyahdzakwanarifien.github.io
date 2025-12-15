---
layout: page
title: Projects
icon: fas fa-code
order: 3
---

## My Technical Projects

A collection of my infrastructure, automation, and development projects showcasing practical applications of DevOps, system administration, and cybersecurity skills.

---

<div class="row row-cols-1 row-cols-md-2 g-4">
  {% assign sorted_projects = site.projects | sort: 'date' | reverse %}
  {% for project in sorted_projects %}
  <div class="col">
    <div class="card h-100 shadow-sm hover-lift">
      {% if project.image %}
      <img src="{{ project.image.path }}" class="card-img-top" alt="{{ project.title }}">
      {% else %}
      <div class="card-img-top bg-gradient" style="height: 200px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
      {% endif %}
      
      <div class="card-body">
        <h5 class="card-title">
          <a href="{{ project.url }}" class="text-decoration-none">
            {{ project.title }}
          </a>
        </h5>
        
        {% if project.description %}
        <p class="card-text text-muted">{{ project.description | truncate: 120 }}</p>
        {% endif %}

        <!-- Tech Stack Badges -->
        {% if project.tech_stack %}
        <div class="mb-3">
          {% for tech in project.tech_stack limit:4 %}
          <span class="badge bg-primary me-1">{{ tech }}</span>
          {% endfor %}
        </div>
        {% endif %}

        <!-- Metadata -->
        <div class="small text-muted mb-3">
          <i class="far fa-calendar"></i>
          {{ project.date | date: "%b %Y" }}
          
          {% if project.status %}
          <span class="ms-2">
            <i class="fas fa-circle" style="font-size: 8px;"></i>
            <span class="badge 
              {% if project.status == 'completed' %}bg-success
              {% elsif project.status == 'in-progress' %}bg-warning
              {% else %}bg-secondary{% endif %}">
              {{ project.status | capitalize }}
            </span>
          </span>
          {% endif %}
        </div>

        <!-- Action Links -->
        <div class="d-flex gap-2">
          <a href="{{ project.url }}" class="btn btn-sm btn-outline-primary">
            <i class="fas fa-info-circle"></i> Details
          </a>
          
          {% if project.github_repo %}
          <a href="{{ project.github_repo }}" target="_blank" class="btn btn-sm btn-outline-dark">
            <i class="fab fa-github"></i> Code
          </a>
          {% endif %}
          
          {% if project.live_demo %}
          <a href="{{ project.live_demo }}" target="_blank" class="btn btn-sm btn-outline-success">
            <i class="fas fa-external-link-alt"></i> Demo
          </a>
          {% endif %}
        </div>
      </div>

      {% if project.tags %}
      <div class="card-footer bg-transparent border-top-0">
        <div class="small">
          {% for tag in project.tags limit:3 %}
          <a href="{{ site.baseurl }}/tags/{{ tag | slugify }}/" class="text-muted text-decoration-none">
            #{{ tag }}
          </a>
          {% endfor %}
        </div>
      </div>
      {% endif %}
    </div>
  </div>
  {% endfor %}
</div>

---

## 🎯 Project Categories

- **Infrastructure & Automation**: Server management, CI/CD pipelines, IaC
- **Open Source Contributions**: BlankOn Linux, community projects
- **Security Projects**: Pentesting tools, security automation
- **DevOps Tools**: Monitoring, orchestration, configuration management

> These projects represent hands-on application of skills learned from various bootcamps, certifications, and real-world experience.
{: .prompt-info }

---

<style>
.hover-lift {
  transition: transform 0.2s, box-shadow 0.2s;
}
.hover-lift:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
}
</style>