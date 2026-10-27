# Urutan konten chapter dan Challenges

## Perilaku

- Admin membuka **Training → Chapters → Atur konten** pada chapter yang dipilih.
- Materi dan soal dapat dicampur dengan tombol naik/turun, serta dipindahkan
  antara **Bagian utama** dan **Challenges** melalui pilihan bagian.
- Penomoran tampilan otomatis A, B, …, Z, AA, AB, …, dimulai ulang per bagian.
- Challenges dapat langsung dibuka dari daftar chapter. Penyelesaian bagian utama
  tidak menjadi syarat akses. Navigasi dalam Challenges juga tidak terkunci.
- Tombol Next dari item terakhir bagian utama berubah menjadi
  **Lanjut ke Challenges** dan tetap dapat dipakai meskipun soal itu belum selesai.
- Halaman materi dan soal Challenge menampilkan label dan penjelasan opsional.
- Keterkaitan ke Problemset tetap ditampilkan sebagai informasi, bukan dasar
  pengelompokan. Angka progres chapter tetap menghitung semua soalnya.
- Aturan Next antaritem bagian utama tetap mengikuti aturan penyelesaian yang
  sudah ada. Materi baru/soal baru tetap ditambahkan melalui editor lama.

## Penyimpanan dan kompatibilitas

Migrasi `001_chapter_resource_layout.xml` hanya menambah kolom nullable `TEXT`
`resourceLayout` pada `jerahmeel_chapter`. Tidak ada penghapusan, reset, penggantian
identitas konten, ataupun perubahan pada tabel submission.

Kolom ini berisi urutan referensi `{type, resourceJid, section}`. JID menjadi
identitas stabil. Alias asli tetap dipakai untuk URL, worksheet, dan submission;
`displayAlias` hanya untuk penomoran yang dilihat siswa. Bookmark lama tetap valid.

Jika layout belum diatur, semua materi (urut alias) diikuti semua soal (urut alias)
di bagian utama. Tidak ada pemindahan otomatis ke Challenges berdasarkan Problemset.
Referensi lama yang kontennya sudah tidak ada diabaikan saat membaca; konten baru
yang belum tercantum otomatis muncul di akhir bagian utama. Penyimpanan layout
mewajibkan setiap item chapter saat ini muncul tepat satu kali, sehingga editor
yang tertinggal tidak dapat menghilangkan konten baru.

## API

- `GET /api/v2/chapters/{chapterJid}/resources`: urutan gabungan yang sudah
  dinormalisasi, beserta `alias`, `displayAlias`, dan `path`.
- `PUT /api/v2/chapters/{chapterJid}/resources`: admin saja; body berupa seluruh
  daftar referensi. `type` adalah `LESSON` atau `PROBLEM`; `section` adalah `MAIN`
  atau `CHALLENGE`.
- Worksheet soal dan statement materi menambahkan `navigation` berisi `current`,
  `previous`, dan `next`. Field path lama tetap disediakan dan mengikuti urutan baru.
- Format submission, termasuk `sourceFiles`, tidak diubah.

## Pengujian dan review lokal

Backend perubahan ini harus memakai database dan berkas salinan yang terpisah,
sesuai `DEVELOPMENT_AND_DEPLOYMENT.md`. Jangan arahkan backend kandidat ke database
atau antrean produksi. Preview pengujian mematikan mailer, registrasi/reset password,
dan koneksi RabbitMQ produksi. Penilaian otomatis tidak disiapkan pada preview ini.

Sebelum push/deploy, jalankan pengujian frontend, integrasi chapter pada Linux,
build frontend Node 20/Yarn 1.22.22, dan build backend Java 17. Uji migrasi pada
salinan dan bandingkan isi kolom lama seluruh tabel. Periksa editor admin, materi
campuran, Challenge soal/materi, URL lama, navigasi, dan tema terang/gelap.

Test statistik lama diperbarui agar meneruskan set pengecualian kosong pada
`getTopUserStats`; signature di production sebelumnya sudah berubah. Ini diperlukan
agar seluruh source integrasi bisa dikompilasi.

Pemeriksaan repo VPS menemukan commit `290d752ce` (satu baris sinkronisasi `model.type`
di `ProblemSetProblemStore`) yang belum ada di origin. Perubahan
yang sama dipertahankan dalam branch ini agar rilis backend berikutnya tidak
mengembalikan bug lama. Produksi tidak dimodifikasi saat pemeriksaan ini.

Preflight rilis menemukan backend yang benar-benar melayani port 9101 adalah
`judgels-server-backup-typesync`, bukan container bernama `judgels-server` yang
berhenti. Pemilihan layanan dan pemulihan harus memakai hasil inspect status/PID
serta listener aktual, bukan hanya nama container atau daftar ringkas Docker.

## Deployment dan pemulihan

Perubahan mencakup server dan client. Setelah hasil lokal disetujui, siapkan commit
yang sama, backup database/files konsisten dan terverifikasi, serta kandidat server
dan client terpisah sebelum mengganti produksi. Migrasi harus dijalankan sebelum
server baru. Frontend baru memerlukan endpoint resources dari server baru.

Jika perlu kembali ke versi aplikasi sebelumnya, kembalikan client terlebih dahulu
dan server berikutnya, sambil mempertahankan kolom tambahan. Tidak perlu menghapus
kolom atau memulihkan database. Versi lama mengabaikan layout tambahan; data urutan
tetap tersimpan untuk versi baru. Jangan menjalankan rollback migrasi yang menghapus
kolom dan jangan restore database produksi tanpa persetujuan khusus.
