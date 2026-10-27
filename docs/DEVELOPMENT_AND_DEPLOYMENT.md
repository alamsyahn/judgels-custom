# Alur pengembangan dan deployment Judgels Custom

Kesepakatan pemilik: 27 Oktober 2026 (Asia/Jakarta).

Dokumen ini menjadi rujukan bersama pemilik dan AI untuk setiap perubahan.
Baca bersama `AGENTS.md` di root repo, yang berisi detail instalasi dan build.
Perubahan aturan harus ditinjau pemilik dan disimpan dalam riwayat Git.

## 1. Alur kerja sehari-hari

1. Pemilik menjelaskan perubahan yang diinginkan.
2. AI memeriksa remote, branch, dan perubahan lokal yang belum tersimpan.
   Ambil perubahan terbaru dari `origin/custom-course-ui`, tanpa menimpa pekerjaan
   lokal. Buat branch pekerjaan dari versi terbaru itu.
3. Kerjakan perubahan di komputer lokal. Periksa perubahan, jalankan
   `git diff --check` sebelum build, dan lakukan pengujian yang relevan.
4. Jalankan preview lokal, berikan alamat dan langkah pengujian kepada pemilik.
   Jelaskan lingkungan API yang dipakai dan tindakan tes yang menulis data asli.
5. Pemilik mencoba hasilnya. Revisi sampai hasil siap disetujui.
6. Setelah persetujuan, commit dan push hasil yang ditinjau. Masukkan perubahan
   ke branch produksi `custom-course-ui` sesuai aturan repo. Jika ada konflik atau
   perubahan perilaku setelah review, uji ulang dan mintakan review hasil baru.
7. Melalui SSH, AI memeriksa keadaan VPS dan menyiapkan versi dari commit tepat
   yang disetujui. Jangan sekadar mengambil branch terbaru jika isinya berbeda.
8. Uji versi kandidat sebelum mengganti layanan produksi, lalu deploy layanan
   yang memang terdampak. Simpan versi sebelumnya untuk pemulihan.
9. Periksa layanan dan fitur terkait setelah deploy, kemudian laporkan hasil.

Persetujuan seperti "sudah cocok, push dan deploy" mencakup push dan deploy
hasil yang sudah ditinjau, tanpa konfirmasi ulang setiap langkah rutin.
Persetujuan alur kerja ini sendiri bukan persetujuan deploy perubahan mendatang.
Persetujuan push saja tidak mencakup deploy.

## 2. Preview frontend dengan data produksi

- Preview frontend lokal boleh memakai API produksi agar course, soal, akun,
  dan data asli terlihat. Gunakan konfigurasi proxy tes yang sesuai untuk CORS;
  jangan salin konfigurasi tes ke konfigurasi produksi.
- Submit jawaban ke produksi dari preview diizinkan dan menjadi submission asli.
- Izin ini tidak mencakup penghapusan data atau tindakan admin lain yang mengubah
  course, soal, pengguna, maupun konfigurasi produksi.
- Disarankan menggunakan akun peserta khusus tes dengan hak minimum.
- Untuk perubahan frontend saja, ganti hanya `judgels-client`; jangan ikut
  memperbarui server, grader, database, RabbitMQ, atau penyimpanan soal.

## 3. Jika backend berubah

- Frontend lokal harus diarahkan ke backend lokal yang menjalankan kode baru.
- Backend baru diuji memakai salinan database produksi dan berkas terkait yang
  diperlukan. Jangan hubungkan backend percobaan ke database produksi langsung.
- Pisahkan juga penyimpanan, antrean RabbitMQ, dan worker/grader tes jika dipakai.
  Nonaktifkan atau isolasi email, webhook, dan efek eksternal lain. Backend tes
  tidak boleh mengonsumsi antrean produksi atau menulis ke penyimpanan produksi.
- Salinan data tetap bersifat sensitif: simpan di luar Git, batasi akses,
  dan jangan sertakan data, token, atau kredensial dalam log atau screenshot.
- Uji migrasi, kompatibilitas API, dan perilaku yang berubah pada salinan tersebut.
- Sebelum deploy backend, identifikasi seluruh data yang terdampak dan buat
  backup konsisten dari database serta berkas terkait. Verifikasi backup dapat
  dibaca dan dipulihkan di lingkungan terpisah. Catat lokasi dan hasil verifikasi.
  Jika backup belum dapat diverifikasi, selesaikan itu sebelum deploy backend.

## 4. Migrasi dan perlindungan data

- Jelaskan migrasi beserta dampak dan rencana pemulihannya sebelum persetujuan
  deploy. Utamakan perubahan tambahan yang kompatibel dengan versi sebelumnya.
- Penghapusan tabel/kolom, reset, truncation, penimpaan data, dan operasi lain
  yang menghapus data memerlukan persetujuan khusus dengan cakupan yang jelas.
- Jangan menjalankan penghapusan volume Docker, pembersihan volume, atau
  penghapusan direktori database/soal sebagai langkah deploy rutin.
- Jangan menjalankan seed/reset yang dapat menimpa data produksi.
- Backup, dump database, berkas soal privat, `.env`, password, token, dan private
  key SSH tidak boleh dimasukkan ke GitHub. Simpan rahasia melalui mekanisme
  lokal/server yang sesuai; dokumentasi cukup menyebut nama dan lokasi konfigurasinya.

## 5. Deploy dan pemulihan

- Tujuan SSH dibaca dari `DEPLOY_SSH_HOST` dalam `.env.deploy.local` di root
  repo. File ini diabaikan Git dan hanya tersedia di komputer yang disiapkan.
  Baca sebagai data konfigurasi, bukan kode shell yang dieksekusi.
- Template `.env.deploy.example` boleh masuk GitHub karena hanya berisi contoh.
  Di komputer baru, salin template menjadi `.env.deploy.local`, isi alias SSH
  lokal, dan pastikan alias itu sudah dikonfigurasi di SSH komputer tersebut.
  Gunakan tujuan yang sama untuk tunnel preview bila diperlukan.
- Jangan masukkan nilai tujuan SSH pribadi ke file yang dilacak Git. Private
  key tetap dikelola SSH; file konfigurasi ini cukup menyimpan nama alias.
- Jika alias atau akses SSH tidak tersedia di lingkungan AI, laporkan konfigurasi
  yang kurang. Jangan menebak host/user, memasukkan private key ke repo, atau
  menonaktifkan pemeriksaan identitas host untuk memaksakan koneksi.
- Periksa kondisi VPS aktual; catatan arsitektur di repo bukan bukti keadaan live.
- Identifikasi container, mount, konfigurasi, dan revisi yang sedang berjalan.
- Gunakan image dan nama backup yang unik per rilis. Contoh nama backup tetap di
  panduan lama adalah contoh historis: jangan menimpa atau menghapus backup lama
  hanya agar nama itu bisa dipakai ulang.
- Pertahankan konfigurasi dan mount produksi yang diperlukan.
- Untuk frontend, uji container terpisah sebelum pergantian produksi sebagaimana
  dijelaskan dalam `AGENTS.md`.
- Untuk backend, sediakan pemeriksaan layanan dan rencana urutan deploy/migrasi
  sesuai komponen yang berubah; jangan menganggap cara deploy frontend berlaku
  begitu saja pada backend.
- Jika pemeriksaan gagal, kembalikan versi aplikasi sebelumnya bila kompatibel
  dengan kondisi database saat itu. Rollback aplikasi tidak membatalkan migrasi.
- Jangan otomatis memulihkan backup database atau menjalankan migrasi balik yang
  menghapus data. Restore bisa menimpa submission baru; jelaskan dampaknya dan
  dapatkan persetujuan khusus sebelum tindakan tersebut.
- Jangan hapus versi cadangan sebelum versi baru terverifikasi stabil.

## 6. Bukti untuk setiap rilis

Catat dalam laporan rilis tanpa rahasia:

- waktu beserta zona waktu, ringkasan perubahan, dan persetujuan pemilik;
- commit Git yang disetujui dan commit/image yang benar-benar dipasang;
- hasil pengujian lokal, kandidat VPS, dan pemeriksaan setelah deploy;
- layanan yang diganti serta migrasi, bila ada;
- referensi backup, hasil verifikasi, versi sebelumnya, dan langkah pemulihan;
- kendala atau pekerjaan tersisa. Jangan melaporkan berhasil tanpa bukti.

## 7. Batas dokumentasi dan pengamanan teknis

Aturan tertulis dapat ditinjau dan memiliki riwayat setelah di-commit ke GitHub.
Aturan ini tidak dengan sendirinya mencegah perintah berbahaya dijalankan.
Pengamanan teknis yang perlu disiapkan terpisah meliputi backup terjadwal yang
diuji pemulihannya, pembatasan akun deployment dan akses database, perlindungan
branch, serta prosedur deploy yang memeriksa prasyarat dan berhenti jika gagal.

Dokumen ini tidak menyatakan bahwa preview lokal, salinan database, akses SSH,
backup, atau otomatisasi deploy sudah terpasang. Verifikasi dan konfigurasi
masing-masing sebelum mengandalkannya.
