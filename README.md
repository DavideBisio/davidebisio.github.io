# davidebisio.github.io

[About Me](./about.html) | [Blog](./blog.html)

This is readme.md

### Recent Posts
<ul>
  {% for post in site.posts %}
    <li>
      <a href="{{ post.url }}">{{ post.title }}</a> ({{ post.date | date_to_string }})
    </li>
  {% endfor %}
</ul>
