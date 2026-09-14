/* QR decoding stays on the device. Never navigate to a URL supplied by a QR. */
(function () {
  'use strict';
  var start = document.getElementById('start');
  var stop = document.getElementById('stop');
  var file = document.getElementById('file');
  var message = document.getElementById('message');
  var result = document.getElementById('result');
  var next = document.getElementById('continue');
  var back = document.getElementById('back');
  var scanner, credentials, loginUrl;
  var busy = false;
  var accepted = false;
  var leaving = false;
  var cameraSession = 0;
  back.addEventListener('click', function (event) {
    if (!loginUrl) {
      event.preventDefault();
      if (window.history.length > 1) window.history.back();
      else message.textContent = 'Buka kembali halaman login dari pengaturan Wi-Fi kamu.';
    }
  });
  try {
    loginUrl = new URL(window.ScannerConfig.loginUrl);
    if (!/^https?:$/.test(loginUrl.protocol) || loginUrl.username || loginUrl.password) throw new Error();
    back.href = loginUrl.href;
    back.hidden = false;
  } catch (_) {
    loginUrl = null;
    next.disabled = true;
  }
  if (typeof Html5Qrcode === 'undefined') {
    message.textContent = 'Scanner gagal dimuat. Muat ulang halaman dan periksa koneksi.';
    start.disabled = file.disabled = true;
    return;
  }
  scanner = new Html5Qrcode('reader', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
  function cameraRunning() {
    var state = scanner.getState();
    return state === Html5QrcodeScannerState.SCANNING || state === Html5QrcodeScannerState.PAUSED;
  }
  function controls() {
    document.body.classList.toggle('is-scanning', !!cameraRunning());
    document.body.classList.toggle('scan-complete', accepted);
    start.hidden = !!cameraRunning();
    stop.hidden = !cameraRunning();
    start.disabled = busy || cameraRunning();
    stop.disabled = busy || !cameraRunning();
    file.disabled = busy;
  }
  async function halt() {
    if (cameraRunning()) await scanner.stop();
  }
  function releasePreviewTracks() {
    // Release this page's camera even if start failed before isScanning became true.
    document.querySelectorAll('#reader video').forEach(function (video) {
      var stream = video.srcObject;
      if (stream && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach(function (track) { track.stop(); });
      }
    });
  }
  function parse(text) {
    text = text.trim();
    if (!text || text.length > 2048) throw new Error('QR tidak berisi voucher yang valid.');
    if (/^https?:\/\//i.test(text)) {
      var url = new URL(text);
      var user = url.searchParams.get('username');
      if (!user) throw new Error('QR tautan harus berisi parameter username voucher.');
      return { username: user, password: url.searchParams.get('password') ?? user };
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(text) || /[\s\x00-\x1f]/.test(text)) {
      throw new Error('Gunakan QR kode voucher atau tautan login hotspot.');
    }
    return { username: text, password: text };
  }
  async function decoded(text) {
    if (accepted) return;
    try { credentials = parse(text); }
    catch (error) { message.textContent = error.message; return; }
    accepted = true;
    busy = true;
    controls();
    try { await halt(); } catch (_) { /* Still show the decoded voucher. */ }
    document.getElementById('voucher').textContent = credentials.username;
    result.hidden = false;
    message.textContent = loginUrl ? 'QR berhasil dibaca. Menghubungkan ke hotspot...' : 'QR berhasil dibaca. Admin perlu mengisi loginUrl di config.js agar bisa kembali ke hotspot.';
    busy = false;
    controls();
    if (loginUrl) connect();
  }
  async function openCamera() {
    if (busy || cameraRunning() || leaving || document.hidden) return;
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      message.textContent = 'Kamera membutuhkan HTTPS. Buka alamat GitHub Pages atau pilih gambar QR.';
      return;
    }
    busy = true;
    var session = ++cameraSession;
    accepted = false;
    result.hidden = true;
    controls();
    message.textContent = 'Meminta akses kamera…';
    try {
      // start() requests camera permission itself; a separate probe prompts twice.
      await scanner.start({ facingMode: 'environment' }, { fps: 10, aspectRatio: 1 }, function (text) {
        if (session === cameraSession && !leaving) decoded(text);
      }, function () {});
      if (leaving || session !== cameraSession) { await halt(); return; }
      if (!accepted) message.textContent = 'Mencari QR Code...';
    } catch (error) {
      releasePreviewTracks();
      // A rejected start may leave preview/state behind. Retry with a clean reader.
      try { await halt(); scanner.clear(); } catch (_) { /* Tracks already released. */ }
      scanner = new Html5Qrcode('reader', { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
      if (leaving || session !== cameraSession) return;
      var reason = String(error && error.name || '') + ' ' + String(error);
      var hint;
      if (/NotAllowed|Permission|denied|Security/i.test(reason)) {
        hint = 'Akses kamera diblokir. Izinkan kamera di pengaturan situs atau tekan Buka di browser jika berada di jendela Wi-Fi.';
      } else if (/NotFound|DevicesNotFound|Overconstrained/i.test(reason)) {
        hint = 'Kamera yang sesuai tidak ditemukan. Gunakan kamera perangkat lain atau ambil foto dari galeri.';
      } else if (/AbortError/i.test(reason)) {
        hint = 'Browser membatalkan pembukaan kamera. Tekan Buka kamera untuk mencoba lagi. Jika berulang di jendela Wi-Fi, gunakan Buka di browser atau pilih foto QR dari galeri.';
      } else if (/NotReadable|TrackStart/i.test(reason)) {
        hint = 'Browser gagal memulai kamera. Tutup tab scanner lain atau aplikasi kamera, lalu tekan Buka kamera.';
      } else {
        hint = 'Kamera gagal dimulai. Coba Buka di browser atau ambil foto dari galeri.';
      }
      message.textContent = hint + ' Detail: ' + String(error && error.message || error).slice(0, 240);
      console.warn('Scanner camera start failed:', error);
    } finally { busy = false; controls(); }
  }
  start.addEventListener('click', openCamera);
  stop.addEventListener('click', async function () {
    busy = true; controls();
    try { await halt(); message.textContent = 'Kamera dihentikan.'; }
    catch (_) { message.textContent = 'Kamera gagal dihentikan. Muat ulang halaman.'; }
    finally { busy = false; controls(); }
  });
  file.addEventListener('change', async function () {
    var selected = file.files[0];
    if (!selected || busy) return;
    busy = true; accepted = false; result.hidden = true; controls();
    try {
      await halt();
      await decoded(await scanner.scanFile(selected, true));
    } catch (_) { message.textContent = 'QR tidak terbaca. Pilih gambar yang lebih jelas.'; }
    finally { busy = false; file.value = ''; controls(); }
  });
  function connect() {
    if (!loginUrl || !credentials) return;
    var target = new URL(loginUrl.href);
    target.hash = new URLSearchParams({ scan_username: credentials.username, scan_password: credentials.password }).toString();
    window.location.replace(target.href);
  }
  next.addEventListener('click', connect);
  window.addEventListener('pagehide', function () {
    leaving = true;
    cameraSession++;
    halt().catch(function () {});
    releasePreviewTracks();
  });
  window.addEventListener('pageshow', function () { leaving = false; controls(); });
  message.textContent = 'Menyiapkan kamera...';
  controls();
  // Match SpaceQR: request camera access once the page has finished loading.
  if (document.readyState === 'complete') openCamera();
  else window.addEventListener('load', openCamera, { once: true });
}());
