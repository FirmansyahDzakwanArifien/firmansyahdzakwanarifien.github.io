---
# Google Analytics config, kept out of the HTML so the CSP needs no 'unsafe-inline'.
---
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag('js', new Date());
gtag('config', {{ site.analytics.google.id | jsonify }});
