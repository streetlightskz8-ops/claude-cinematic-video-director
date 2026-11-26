# Claude Cinematic Video Director — Starter Kit

Paket awal untuk membuat alur: Claude Web → Remote MCP (Cloudflare Worker) → GitHub Actions (render) → Cloudflare R2 (MP4).

**Status:** starter kit yang perlu dipasang ke akun GitHub dan Cloudflare milikmu. Belum ter-deploy dan belum diuji pada akunmu. Paket ini tidak meminta password Google atau Claude.

## Hasil yang dituju
- Video MP4 vertikal 9:16.
- Voice-over dari tautan Google Drive publik.
- Visual motion-design cinematic berbasis scene (judul, teks, gerak, gradien, dan gambar opsional).
- Link hasil MP4 dikembalikan oleh tool MCP ke Claude.

> Catatan kualitas: template awal menghasilkan motion-design cinematic. Ia belum menghasilkan footage/karakter 3D fotorealistik secara otomatis. Untuk footage AI generatif diperlukan layanan/model gambar-video tambahan dan biasanya API key/biaya.

## Arsitektur
1. Claude memanggil tool `render_cinematic_video` pada Worker.
2. Worker memvalidasi URL Google Drive dan mengirim job ke GitHub Actions.
3. Worker menyimpan payload job sementara di R2, lalu GitHub Actions mengambil payload dan MP3, merender komposisi Remotion, kemudian mengunggah MP4 ke R2.
4. Worker menyediakan URL unduhan MP4.

## Yang perlu disiapkan sekali saja
- Akun GitHub.
- Akun Cloudflare.
- Repo GitHub **public** untuk memanfaatkan runner standar GitHub Actions gratis. Jangan masukkan audio, token, atau file pribadi ke repo.
- Bucket R2. R2 punya free tier bulanan terbatas; pemakaian di atas kuota dapat dikenakan biaya. Lihat tautan resmi di bagian bawah.

## A. Siapkan GitHub
1. Buat repository baru bernama `claude-cinematic-video-director` (Public).
2. Upload seluruh isi paket ini ke root repository.
3. Di Settings → Secrets and variables → Actions → New repository secret, tambahkan:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME` (nama bucket)
   - `R2_PUBLIC_BASE_URL` (alamat publik Worker download, mis. `https://NAMA-WORKER.workers.dev`)
4. Pastikan Actions aktif.

## B. Siapkan Cloudflare R2
1. Cloudflare Dashboard → R2 → Create bucket.
2. Buat R2 API token dengan izin Object Read & Write untuk bucket tersebut.
3. Catat Account ID, Access Key ID, Secret Access Key, dan nama bucket.
4. Deploy Worker pada folder `worker` dengan binding bucket bernama `VIDEO_BUCKET`.
5. Tambahkan secret Worker `GITHUB_TOKEN` (token fine-grained yang hanya punya Actions: Read and write, Contents: Read and write untuk repo target).
6. Tambahkan variable Worker: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_REF` (biasanya `main`), `GITHUB_WORKFLOW` (`render.yml`), `DOWNLOAD_BASE_URL` (URL Worker).
7. Tambahkan binding R2 `VIDEO_BUCKET` ke Worker.

## C. Hubungkan Worker ke Claude
1. Setelah Worker ter-deploy, salin URL MCP endpoint `/mcp`.
2. Claude Web → Customize → Connectors → Add custom connector.
3. Beri nama `Cinematic Video Director`.
4. Masukkan URL `https://NAMA-WORKER.workers.dev/mcp`.
5. Selesaikan koneksi. Pengguna Free dibatasi satu custom connector.

## D. Skill instruksi Claude (opsional, untuk pemakaian satu perintah)
1. Gunakan isi file `CLAUDE_SKILL.md` sebagai instruksi Skill di Claude, atau simpan sebagai panduan proyek.
2. Pastikan connector `Cinematic Video Director` aktif di percakapan.

## E. Cara pakai setelah aktif
Di Claude Web, aktifkan connector lalu kirim:
- naskah lengkap;
- link file MP3 Google Drive dengan akses "Siapa saja yang memiliki link";
- gaya visual, misalnya "cinematic premium, warm gold, realistic editorial motion design";
- rasio 9:16.

Contoh instruksi:
> Buat video cinematic 9:16 dari naskah ini. Gunakan audio MP3 dari tautan ini sebagai voice-over utama. Pecah naskah menjadi 6–8 adegan, jaga teks singkat, transisi halus, dan jangan menambahkan klaim yang tidak ada di naskah. Render MP4 dan kembalikan tautan hasilnya.

## Batasan penting
- Custom connector Claude tidak mendukung file transfer; karena itu input audio diberikan sebagai URL publik Google Drive, bukan file attachment Claude.
- Link Drive "anyone with link" dapat diakses siapa pun yang memiliki link. Cabut akses setelah selesai jika tidak ingin link tetap publik.
- Worker Free punya batas CPU yang ketat; proses render berat dijalankan di GitHub Actions, bukan di Worker.
- GitHub Actions runner standar gratis untuk repository public. R2 memiliki kuota gratis, bukan berarti tanpa batas.
- MP4 disimpan di R2. Atur penghapusan file lama secara berkala agar kuota tidak habis.
- Template visual awal adalah motion graphics vertikal 9:16. Pilihan rasio lain dan footage AI generatif/3D realistis belum diaktifkan; itu memerlukan pengembangan/integrasi provider terpisah.
- Jangan pernah menaruh GitHub token, Cloudflare secret, atau kredensial akun di prompt Claude maupun file publik.

## Referensi resmi
- Claude custom remote MCP: https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
- Cloudflare remote MCP: https://developers.cloudflare.com/agents/model-context-protocol/guides/remote-mcp-server/
- GitHub Actions billing: https://docs.github.com/en/actions/concepts/billing-and-usage
- Cloudflare R2 pricing: https://developers.cloudflare.com/r2/pricing/
