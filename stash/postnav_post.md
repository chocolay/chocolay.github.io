
  <div class="container">
  <div class="post__navigation">
    {% if page.previous.url %}
    <div class="prev">
      <a class="post__nav__image" href="{{ site.baseurl }}{{page.previous.url}}" style="background-image: url({{site.baseurl}}/images/{{page.previous.image}})"></a>
      <h2 class="post__nav__title">
        <i class="ion ion-md-arrow-back"></i>
        <a href="{{ site.baseurl }}{{page.previous.url}}">{{page.previous.title}}</a>
      </h2>
      <p class="prev__excerpt">
        {% if page.previous.description %}
          {{ page.previous.description }}
        {% else %}
          {{ page.previous.content | strip_html | truncate: 110 }}
        {% endif %}
      </p>
    </div>
    {% endif %}

    {% if page.next.url %}
    <div class="next">
      <a class="post__nav__image" href="{{ site.baseurl }}{{page.next.url}}" style="background-image: url({{site.baseurl}}/images/{{page.next.image}})">
      </a>
      <h2 class="post__nav__title">
        <a href="{{ site.baseurl }}{{page.next.url}}">{{page.next.title}}</a>
        <i class="ion ion-md-arrow-forward"></i>
      </h2>
      <p class="next__excerpt">
        {% if page.next.description %}
          {{ page.next.description }}
        {% else %}
          {{ page.next.content | strip_html | truncate: 110 }}
        {% endif %}
      </p>
    </div>
    {% endif %}
  </div>

  {% if site.data.settings.disqus-identifier %} {% include disqus-comments.html %} {% endif %}
  </div>
