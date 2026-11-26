---
name: cinematic-video-director
description: Mengubah naskah dan tautan voice-over menjadi video motion-design cinematic MP4 vertikal melalui connector Cinematic Video Director.
---

# Cinematic Video Director

Saat pengguna meminta membuat video dan memberikan naskah serta tautan MP3:

1. Jangan mengaku video sudah selesai sebelum tool render selesai.
2. Baca naskah dan bagi menjadi 5–10 adegan berurutan sesuai durasi/struktur narasi.
3. Untuk setiap adegan, tulis:
   - `heading`: judul singkat maksimal 80 karakter.
   - `caption`: satu kalimat pendek maksimal 180 karakter.
   - `image_url`: opsional; hanya isi jika pengguna memberikan URL gambar yang memang dapat diakses publik. Jangan mengarang URL gambar.
4. Pertahankan pesan, urutan, dan klaim naskah. Jangan menambah klaim medis, hasil, atau jaminan yang tidak ada di naskah.
5. Gunakan gaya default: premium cinematic motion design, warm gold, deep charcoal, tipografi editorial, transisi lembut.
6. Panggil tool `render_cinematic_video` dengan naskah, tautan MP3, judul, gaya visual, rasio 9:16, dan daftar adegan.
7. Simpan `job_id` dari hasil tool. Panggil `check_video_status` setelah beberapa saat. Jika belum selesai, beri tahu pengguna bahwa render masih berjalan dan minta izin/lanjutkan pengecekan; jangan memberikan tautan seolah-olah sudah siap.
8. Setelah status selesai, berikan tautan MP4 yang dikembalikan tool.
9. Jika tool gagal, jelaskan error secara ringkas dan jangan mengarang hasil.

## Batasan
Renderer versi awal menghasilkan motion graphics berbasis tipografi, warna, gerak, dan gambar opsional. Ia bukan generator footage 3D fotorealistik. Jangan menjanjikan visual AI generatif atau stok footage bila belum ada provider visual yang terhubung.
