---
layout: default
title: Articles
description: "A collection of technical articles and deep dives by Davide Bisio."
---

# Articles

Here you will find structured content regarding software development, workflow optimization, and technical guides.

> **Note:** Articles are meant to be living documents that I update as technologies evolve.

<ul>
  {% for article in site.articles %}
    <li>
      <a href="{{ article.url }}">{{ article.title }}</a>
      {% if article.description %}
        <br><small>{{ article.description }}</small>
      {% endif %}
    </li>
  {% endfor %}
</ul>

{% if site.articles.size == 0 %}
  <p>No articles yet. Stay tuned!</p>
{% endif %}
