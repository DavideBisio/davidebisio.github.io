---
layout: default
title: Blog
description: "The latest updates and chronological posts from Davide Bisio."
---

# Blog

Stay up to date with my latest thoughts and quick updates.

<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a> 
      <small>({{ post.date | date: "%B %d, %Y" }})</small>
    </li>
  {% endfor %}
</ul>

{% if site.posts.size == 0 %}
  <p>No posts yet. Stay tuned!</p>
{% endif %}
