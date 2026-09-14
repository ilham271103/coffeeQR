(function () {
  'use strict';
  var link = document.getElementById('open-browser');
  var field = document.getElementById('browser-url');
  var message = document.getElementById('browser-message');
  var url = new URL(window.location.href);
  url.hash = '';
  field.value = url.href;
  link.href = url.href;
  // Launch only on an explicit tap. Captive portals may reject external intents.
  if (/Android/i.test(navigator.userAgent) && /^https?:$/.test(url.protocol)) {
    link.href = 'intent://' + url.host + url.pathname + url.search +
      '#Intent;scheme=' + url.protocol.slice(0, -1) +
      ';package=com.android.chrome' +
      ';action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;' +
      'S.browser_fallback_url=' + encodeURIComponent(url.href) + ';end';
    link.removeAttribute('target');
  }
  link.addEventListener('click', function () {
    document.querySelector('.browser-help').open = true;
    message.textContent = 'Jika tetap di jendela Wi-Fi, salin tautan lalu buka di Chrome atau Safari.';
  });
  document.getElementById('copy-url').addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText(url.href);
      message.textContent = 'Tautan disalin. Tempel di Chrome atau Safari.';
    } catch (_) {
      field.focus();
      field.select();
      field.setSelectionRange(0, field.value.length);
      message.textContent = 'Tekan lama atau gunakan Ctrl+C untuk menyalin tautan yang dipilih.';
    }
  });
}());
