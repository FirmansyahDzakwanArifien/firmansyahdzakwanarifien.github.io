---
layout: page
title: Album
icon: fas fa-images
order: 4
---

## Visual Journey

A photographic documentation of my learning experiences, certifications, training sessions, and tech adventures.

---

<div class="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
  {% assign sorted_album = site.album | sort: 'date' | reverse %}
  {% for photo in sorted_album %}
  <div class="col">
    <div class="card h-100 shadow-sm hover-zoom">
      {% if photo.featured_image %}
      <a href="{{ photo.url }}">
        <img src="{{ photo.featured_image.path }}" 
             class="card-img-top" 
             alt="{{ photo.title }}"
             style="height: 250px; object-fit: cover;">
      </a>
      {% else %}
      <div class="card-img-top bg-gradient" 
           style="height: 250px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);"></div>
      {% endif %}
      
      <div class="card-body">
        <h6 class="card-title">
          <a href="{{ photo.url }}" class="text-decoration-none">
            {{ photo.title }}
          </a>
        </h6>
        
        {% if photo.description %}
        <p class="card-text small text-muted">
          {{ photo.description | truncate: 80 }}
        </p>
        {% endif %}

        <div class="small text-muted">
          <i class="far fa-calendar"></i>
          {{ photo.date | date: "%b %d, %Y" }}
          
          {% if photo.location %}
          <br>
          <i class="fas fa-map-marker-alt"></i>
          {{ photo.location }}
          {% endif %}
        </div>
      </div>

      {% if photo.event %}
      <div class="card-footer bg-transparent">
        <small class="text-muted">
          <i class="fas fa-calendar-check"></i>
          {{ photo.event }}
        </small>
      </div>
      {% endif %}
    </div>
  </div>
  {% endfor %}
</div>


---

> Each photo tells a story of dedication, learning, and growth in the fields of system administration, cybersecurity, and DevOps.
{: .prompt-tip }

<style>
.hover-zoom {
  transition: transform 0.3s ease;
  overflow: hidden;
}
.hover-zoom:hover {
  transform: scale(1.03);
}
.hover-zoom img {
  transition: transform 0.3s ease;
}
.hover-zoom:hover img {
  transform: scale(1.1);
}
</style>