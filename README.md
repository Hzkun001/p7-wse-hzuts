# UTS-WSE Members API

API sederhana untuk memenuhi kebutuhan tugas/UTS Web Service Engineering. Layanan ini mengekspose data anggota tim melalui RESTful endpoint berbasis Express 5 dengan format respons JSON yang konsisten, validasi sisi server, dan dukungan caching memakai ETag.

## Fitur Utama
- **Resource-based URI**: `/api/members` dan `/api/members/:id` mengikuti prinsip REST.
- **JSON-only**: service hanya menerima & mengirim `application/json` sehingga mudah diintegrasikan.
- **Validasi & error handler**: middleware `validateMember` dan `errorHandler` memastikan input rapi serta pesan error seragam.
- **Conditional GET**: daftar anggota menerapkan header `ETag` + dukungan `If-None-Match` untuk status `304 Not Modified`.
- **HATEOAS ringan**: response `POST /api/members` menyertakan tautan `self` dan `collection`.
- **Logging & monitoring**: Morgan (`dev` format) menampilkan setiap request di console.

## Teknologi & Prasyarat
- Node.js 18 LTS (atau lebih baru)
- npm (sudah termasuk dalam Node). Tidak ada database eksternal; data disimpan di file `src/data/members.json`.

## Menjalankan Proyek
```bash
# 1. Install dependensi
npm install

# 2. Jalankan server (dengan nodemon)
npm run dev
```
Server akan berjalan pada `http://localhost:3000` (atau nilai `PORT` yang Anda set). Basis path API adalah `http://localhost:3000/api`.

## Struktur Direktori Singkat
```
src/
├─ app.js                  # Registrasi middleware global & route
├─ routes/members.routes.js
├─ controllers/members.controller.js
├─ middlewares/{validate,errorHandler}.js
├─ utils/response.js       # Helper format response seragam
└─ data/members.json       # Sumber data sederhana (persist di file)
```

## Data Dummy
`src/data/members.json` menyimpan array anggota dengan struktur:
```json
{
  "id": "m-001",
  "name": "Akhmad Hafidz",
  "role": "Lead",
  "joinedAt": "2024-09-01"
}
```
Anda bisa menambah/mengurangi data lewat endpoint atau mengedit file secara manual.

## Endpoint API
| Method | Path | Deskripsi | Body / Query |
| --- | --- | --- | --- |
| GET | `/api/info` | Informasi service, versi, dan daftar prinsip REST yang dipenuhi. | - |
| GET | `/api/members` | Ambil daftar anggota lengkap dengan pagination dan ETag. | Query opsional: `page` (>=1), `limit` (>=1) |
| GET | `/api/members/:id` | Ambil detail anggota tertentu. | - |
| POST | `/api/members` | Tambah anggota baru. Menghasilkan ID otomatis & tautan HATEOAS. | Body wajib: `{ name, role, joinedAt }`
| PUT | `/api/members/:id` | Replace penuh data anggota. Semua field wajib ada. | Body wajib `{ name, role, joinedAt }`
| PATCH | `/api/members/:id` | Update sebagian field anggota. | Body opsional (minimal 1 field valid) |
| DELETE | `/api/members/:id` | Hapus anggota berdasarkan ID. | - |

### Validasi Input
Middleware `validateMember` memastikan:
- `name` & `role` berupa string tidak kosong (jika dikirim).
- `joinedAt` mengikuti format tanggal `YYYY-MM-DD`.
Bila gagal, server merespons `400` dengan struktur `{"status":"fail","message":"Validasi gagal","errors":[...]}`.

### Format Respons
Seluruh handler menggunakan helper pada `src/utils/response.js` sehingga struktur konsisten:
```json
{
  "status": "success|fail|error",
  "message": "Penjelasan singkat",
  "data": { ... } // hanya ada pada status success
}
```
Error tak terduga akan ditangani `errorHandler` dan menghasilkan `500` dengan `status: "error"`.

### Contoh Request
```bash
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aurora",
    "role": "Designer",
    "joinedAt": "2024-11-10"
  }'
```
Respons sukses:
```json
{
  "status": "success",
  "message": "Created",
  "data": {
    "id": "m-003",
    "name": "Aurora",
    "role": "Designer",
    "joinedAt": "2024-11-10",
    "links": {
      "self": "/api/members/m-003",
      "collection": "/api/members"
    }
  }
}
```

## Pengujian Manual Cepat
1. Pastikan server berjalan (`npm run dev`).
2. Gunakan REST client (Insomnia/Postman) atau `curl` untuk menguji tiap endpoint.
3. Perhatikan header `ETag` pada `GET /api/members` dan coba ulangi request dengan header `If-None-Match` yang sama untuk memastikan balasan `304`.

Silakan kembangkan lebih jauh (mis. tambah autentikasi, migrasi ke database relasional, atau menulis suite pengujian otomatis) sesuai kebutuhan tugas Anda.
