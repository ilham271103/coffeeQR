# Scanner Kopi Senja

Folder ini adalah website statis mandiri. Push **isi folder scanner** ke root repository GitHub khusus scanner. Tidak perlu Node.js, build, atau file dari folder login.

## Konfigurasi dan publikasi

1. Isi `loginUrl` di `config.js` dengan URL halaman login MikroTik yang sebenarnya, misalnya `http://wifi.kopisenja.local/login`. Pengguna harus tetap terhubung ke Wi-Fi hotspot agar URL tersebut bisa diakses. Jangan isi dengan alamat GitHub Pages.
2. Push semua isi folder ini, termasuk `vendor` dan `.nojekyll`, ke repository GitHub.
3. Aktifkan GitHub Pages untuk branch yang dipakai dan folder root melalui pengaturan repository. Setelah deployment selesai, catat URL HTTPS yang diberikan GitHub.
4. Pada `login.html` hotspot, ganti `href="#"` **hanya pada tautan `class="scan"`** dengan URL Pages tersebut. Contoh: `<a class="scan" href="https://USERNAME.github.io/REPO/">`. Gunakan URL deployment sebenarnya, bukan contoh ini.
5. Upload `login.html` yang diperbarui serta `assets/js/scan-result.js` ke hotspot MikroTik. File penerima sudah disertakan pada proyek login; scanner tidak mengirim login langsung, sehingga alur CHAP yang ada tetap dipakai.
6. Atur walled garden hotspot agar hostname Pages tersebut bisa diakses sebelum login. Uji menggunakan perangkat yang belum login. Semua script scanner disimpan lokal dalam folder `vendor`, sehingga tidak perlu mengizinkan CDN untuk memuat library.

Tombol Scan di proyek login belum diarahkan ke GitHub karena URL deployment belum tersedia. Folder `scanner` tidak perlu di-upload ke MikroTik.

## Alur dan format QR

Tekan Scan di login → halaman HTTPS scanner → Buka kamera atau pilih gambar → Gunakan voucher → halaman login terisi → tekan Login.

- QR teks kode voucher, misalnya `SENJA123`: username dan password sama.
- QR URL HTTP/HTTPS dengan parameter `username` dan opsional `password`: kredensial diambil dari parameter tersebut. Password yang tidak ada memakai username; password kosong tetap kosong.
- Format lain (misalnya QR Wi-Fi atau JSON) belum didukung.
- URL dalam QR tidak dibuka. Tujuan kembali selalu berasal dari `config.js` yang dikelola admin.
- Kredensial dikirim kembali lewat fragmen URL, lalu dihapus dari URL oleh script penerima. Hasil diisikan ke formulir lalu dikirim otomatis melalui alur submit normal, termasuk CHAP jika aktif. Kamera dan pembacaan gambar diproses pada perangkat.

## Pengujian

Untuk preview lokal, jalankan `python -m http.server 8080` dari folder ini, lalu buka `http://localhost:8080`. Akses dari IP LAN melalui HTTP umumnya tidak bisa membuka kamera; gunakan deployment HTTPS untuk tes HP.

Uji di HP: izinkan/tolak akses kamera, scan voucher teks, scan URL voucher dengan password berbeda, pilih foto QR, hentikan kamera, scan ulang, dan pastikan hasil kembali ke hotspot lalu login berhasil. Browser mini captive portal kadang membatasi kamera; gunakan Chrome/Safari atau unggah gambar.

## Library

Memakai html5-qrcode 2.3.8, disimpan di `vendor/html5-qrcode.min.js`; lisensinya di `vendor/LICENSE-html5-qrcode`.

- Dokumentasi API: https://scanapp.org/html5-qrcode-docs/docs/apis/classes/Html5Qrcode
- Sumber: https://github.com/mebjas/html5-qrcode

Halaman ini belum dipublikasikan otomatis. Login hotspot, izin kamera perangkat, dan akses sebelum login perlu diuji setelah deployment.

Kamera dicoba otomatis saat halaman dibuka. Jika browser menolak akses otomatis, pengguna dapat menekan Buka kamera untuk mencoba lagi atau memilih foto dari galeri.

Kontrol kamera berada di luar pratinjau. Tombol Buka di browser mencoba intent Android, atau tab baru pada perangkat lain. Perpindahan keluar captive portal bergantung perangkat; tersedia Salin tautan dalam Browser tidak terbuka? sebagai alternatif. Upload juga browser.js. Referensi intent: https://developer.chrome.com/docs/android/intents
