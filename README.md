# Praktikum 7 – WSE Members API + Security

Repositori ini adalah versi terbaru untuk praktikum/UTS Web Service Engineering (P7). API mengekspose data anggota tim dengan pendekatan RESTful berbasis Express 5, memaksa JSON-only request, memiliki validasi ketat, serta penanganan error yang sudah dirapikan agar mudah diuji lewat Postman maupun otomatis.

## Highlight P7
- **Resource-based URI**: `/api/members` dan `/api/members/:id` dengan dukungan GET/POST/PUT/PATCH/DELETE.
- **JSON-only & body guard**: middleware `express.json()` + `validateMember` memastikan request body ada, berformat JSON, dan mengembalikan 400 jika kosong/invalid.
- **Penanganan error terpusat**: kombinasi `ApiError` & `errorHandler` mengubah error menjadi respons `fail/error` yang konsisten (termasuk SyntaxError body parser).
- **Keamanan baseline**: Helmet, CORS terbatas asal, serta rate limiter bawaan untuk melindungi endpoint.
- **Caching ringan**: `GET /api/members` memakai `ETag` + `If-None-Match` untuk 304 Not Modified.
- **HATEOAS & logging**: response POST membawa tautan `self/collection`, sedangkan Morgan mencatat request untuk debugging.

## Prasyarat & Teknologi
- Node.js 18 LTS (atau lebih baru) + npm.
- Tidak ada DB eksternal; data persisten disimpan di file `src/data/members.json`.
- Dependensi utama: Express 5, Helmet, CORS, express-rate-limit, Morgan, dotenv.

## Konfigurasi Lingkungan
Salin `.env.example` menjadi `.env`, lalu isi variabel sesuai kebutuhan (nilai default saat dev):
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```
Variabel dibaca melalui `src/config/env.js`, sehingga perubahan tidak perlu menyentuh kode.

## Menjalankan Proyek
```bash
# Install dependency
npm install

# Dev server dengan nodemon
npm run dev
```
Server default di `http://localhost:3000` (menyesuaikan `PORT`). Semua endpoint berada di bawah prefix `http://localhost:3000/api`.

## Struktur Direktori
```
src/
├─ app.js                  # Registrasi middleware global & routing
├─ config/env.js
├─ routes/members.routes.js
├─ controllers/members.controller.js
├─ middlewares/{validate,errorHandler}.js
├─ utils/{response,ApiError,logger}.js
└─ data/members.json       # Sumber data dummy
```

## Data Dummy
`src/data/members.json` menyimpan array anggota dengan skema:
```json
{
  "id": "m-001",
  "name": "Akhmad Hafidz",
  "role": "Lead",
  "joinedAt": "2024-09-01"
}
```
Anda bebas memodifikasi file atau menambahkan data melalui endpoint POST.

## Endpoint API
| Method | Path | Deskripsi | Body / Query |
| --- | --- | --- | --- |
| GET | `/api/info` | Info service + daftar prinsip REST yang dipenuhi. | - |
| GET | `/api/members` | Ambil daftar anggota (pagination + ETag). | Query opsional: `page` (>=1), `limit` (>=1) |
| GET | `/api/members/:id` | Detail anggota tertentu. | - |
| POST | `/api/members` | Tambah anggota baru (ID otomatis + links). | Body wajib `{ name, role, joinedAt }` |
| PUT | `/api/members/:id` | Replace penuh data anggota. | Body wajib `{ name, role, joinedAt }` |
| PATCH | `/api/members/:id` | Update sebagian field (minimal satu field valid). | Body opsional |
| DELETE | `/api/members/:id` | Hapus anggota berdasarkan ID. | - |

## Validasi & Penanganan Error
- `validateMember`:
  - Menolak request yang tidak mengirim body JSON (`Content-Type: application/json` wajib).
  - `name` & `role` harus string tidak kosong jika ada.
  - `joinedAt` harus pola `YYYY-MM-DD`.
- `members.controller` mengangkat `ApiError(404, "...")` jika ID tidak ditemukan sehingga handler otomatis merespons `{"status":"fail","message":"Member tidak ditemukan"}`.
- `errorHandler`:
  - Menangkap SyntaxError (JSON rusak) → 400.
  - Menentukan `status: fail` untuk error 4xx dan `status: error` untuk 5xx.
- Template respons (`src/utils/response.js`):
```json
{
  "status": "success|fail|error",
  "message": "Penjelasan singkat",
  "data": { ... } // hanya pada status success
}
```

## Contoh Request
```bash
curl -X POST http://localhost:3000/api/members \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Aurora",
    "role": "Designer",
    "joinedAt": "2024-11-10"
  }'
```
Respons sukses (`201 Created`) memuat data baru dan tautan `self`/`collection`.

## Pengujian Manual P7
1. Jalankan `npm run dev`.
2. Gunakan Postman/Insomnia/cURL dan pastikan header `Content-Type: application/json` serta body valid supaya tidak terkena guard baru.
3. Coba `GET /api/members` dua kali dengan header `If-None-Match` dari respons pertama untuk melihat `304 Not Modified`.
4. Uji kasus error (body kosong, tanggal salah, ID tidak ada) untuk memastikan struktur error handler sesuai requirement tugas.
