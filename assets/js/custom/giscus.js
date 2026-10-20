---
# Giscus loader, rendered by Jekyll from the comments settings in _config.yml.
---
(function () {
  const themeMapper = Theme.getThemeMapper('light', 'dark_dimmed');
  const initTheme = themeMapper[Theme.visualState];

  let lang = {{ site.comments.giscus.lang | default: site.lang | jsonify }};
  /* https://github.com/giscus/giscus/tree/main/locales */
  if (lang.length > 2 && !lang.startsWith('zh')) {
    lang = lang.slice(0, 2);
  }

  let giscusAttributes = {
    src: 'https://giscus.app/client.js',
    'data-repo': {{ site.comments.giscus.repo | jsonify }},
    'data-repo-id': {{ site.comments.giscus.repo_id | jsonify }},
    'data-category': {{ site.comments.giscus.category | jsonify }},
    'data-category-id': {{ site.comments.giscus.category_id | jsonify }},
    'data-mapping': {{ site.comments.giscus.mapping | default: 'pathname' | jsonify }},
    'data-strict' : {{ site.comments.giscus.strict | default: '0' | jsonify }},
    'data-reactions-enabled': {{ site.comments.giscus.reactions_enabled | default: '1' | jsonify }},
    'data-emit-metadata': '0',
    'data-theme': initTheme,
    'data-input-position': {{ site.comments.giscus.input_position | default: 'bottom' | jsonify }},
    'data-lang': lang,
    'data-loading': 'lazy',
    crossorigin: 'anonymous',
    async: ''
  };

  let giscusNode = document.createElement('script');
  Object.entries(giscusAttributes).forEach(([key, value]) =>
    giscusNode.setAttribute(key, value)
  );

  const $footer = document.querySelector('footer');
  $footer.insertAdjacentElement("beforebegin", giscusNode);

  addEventListener('message', (event) => {
    if (event.source === window && event.data && event.data.id === Theme.ID) {
      const newTheme = themeMapper[Theme.visualState];

      const message = {
        setConfig: {
          theme: newTheme
        }
      };

      const giscus =
        document.getElementsByClassName('giscus-frame')[0].contentWindow;
      giscus.postMessage({ giscus: message }, 'https://giscus.app');
    }
  });
})();
