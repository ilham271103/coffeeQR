(function () {
  'use strict';
  var allowed = ['mocha', 'mint', 'sage', 'burgundy', 'lavender', 'ocean'];
  var aliases = { coffee: 'mocha', coral: 'burgundy', rose: 'burgundy', midnight: 'ocean', charcoal: 'ocean' };
  var requested = new URLSearchParams(window.location.search).get('theme') || 'mocha';
  requested = requested.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(aliases, requested)) requested = aliases[requested];
  var theme = allowed.indexOf(requested) >= 0 ? requested : 'mocha';
  document.documentElement.setAttribute('data-theme', theme);
}());
