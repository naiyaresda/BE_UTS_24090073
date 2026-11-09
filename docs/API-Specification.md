# API Specification — Gym Management System

Backend: NestJS 10 + TypeORM + MySQL. Seluruh contoh request/response di dokumen ini direkam dari aplikasi yang berjalan di MySQL 8 (bukan karangan), sehingga bentuk datanya sama dengan yang dikembalikan API.

## 1. Informasi umum

| Item | Nilai |
|---|---|
| Base URL | `http://localhost:3000` (ubah dengan `PORT` di `.env`) |
| Format data | JSON (`Content-Type: application/json`), nama field camelCase |
| Autentikasi | Tidak ada (di luar cakupan studi kasus) |
| Format tanggal | `YYYY-MM-DD` untuk tanggal (`birthDate`, `startDate`, `endDate`); ISO 8601 UTC untuk waktu sesi (`startTime`, `endTime`) |
| Validasi | DTO + `class-validator` + `ValidationPipe` global (`whitelist: true`, `transform: true`); field di luar DTO diabaikan |

### Format error

Error validasi (400) — `message` berupa array:
```json
{
  "message": [
    "Format email tidak valid"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
Error bisnis / tidak ditemukan (404, 409) — `message` berupa string:
```json
{
  "message": "Anggota dengan id 99 tidak ditemukan",
  "error": "Not Found",
  "statusCode": 404
}
```
Error constraint database (409) — diterjemahkan oleh `DbExceptionFilter`:
```json
{
  "statusCode": 409,
  "message": "Data duplikat (email/nama sudah dipakai)",
  "error": "Database Constraint"
}
```
### HTTP status code yang dipakai

| Kode | Arti | Kapan muncul |
|---|---|---|
| 200 OK | Berhasil | GET, PUT, PATCH, dan DELETE peserta sesi |
| 201 Created | Data berhasil dibuat | Semua POST |
| 204 No Content | Berhasil, tanpa body | DELETE member / trainer / paket / sesi |
| 400 Bad Request | Input tidak valid | Gagal validasi DTO, ID bukan angka, `endTime` ≤ `startTime` |
| 404 Not Found | Data tidak ada | ID tidak ditemukan (termasuk ID relasi di body) |
| 409 Conflict | Melanggar aturan bisnis / constraint | Email duplikat, periode bentrok, kapasitas penuh, data masih dipakai, dll. |

### Nilai enum

| Field | Nilai |
|---|---|
| `members.gender` | `male`, `female` |
| `members.status`, `trainers.status` | `active`, `inactive` |
| `status` keanggotaan (dihitung, tidak disimpan) | `upcoming`, `active`, `expired`, `cancelled` |
| `training_sessions.status` | `scheduled`, `completed`, `cancelled` |
| `session_participants.status` | `registered`, `attended`, `absent`, `cancelled` |

## 2. Ringkasan endpoint

| Method | Path | Fungsi | Sukses |
|---|---|---|---|
| POST | /members | Tambah anggota | 201 |
| GET | /members | Daftar anggota (`?status=&q=`) | 200 |
| GET | /members/:id | Detail anggota | 200 |
| PUT | /members/:id | Ubah anggota | 200 |
| DELETE | /members/:id | Hapus anggota | 204 |
| GET | /members/:id/membership-status | Status & riwayat keanggotaan | 200 |
| GET | /members/:id/schedule | Jadwal latihan anggota (`?upcoming=true`) | 200 |
| POST | /trainers | Tambah pelatih | 201 |
| GET | /trainers | Daftar pelatih (`?status=`) | 200 |
| GET | /trainers/:id | Detail pelatih | 200 |
| PUT | /trainers/:id | Ubah pelatih | 200 |
| DELETE | /trainers/:id | Hapus pelatih | 204 |
| GET | /trainers/:id/sessions | Sesi yang ditangani pelatih | 200 |
| POST | /membership-plans | Tambah paket keanggotaan | 201 |
| GET | /membership-plans | Daftar paket (`?active=true`) | 200 |
| GET | /membership-plans/:id | Detail paket | 200 |
| PUT | /membership-plans/:id | Ubah paket | 200 |
| DELETE | /membership-plans/:id | Hapus paket | 204 |
| POST | /memberships | Daftarkan anggota ke paket | 201 |
| GET | /memberships | Daftar keanggotaan (`?memberId=&planId=&status=`) | 200 |
| GET | /memberships/:id | Detail keanggotaan | 200 |
| PATCH | /memberships/:id/cancel | Batalkan keanggotaan | 200 |
| POST | /training-sessions | Buat sesi latihan | 201 |
| GET | /training-sessions | Daftar sesi (`?trainerId=&status=&from=&to=`) | 200 |
| GET | /schedule | Sesi mendatang + sisa slot | 200 |
| GET | /training-sessions/:id | Detail sesi | 200 |
| PUT | /training-sessions/:id | Ubah sesi | 200 |
| DELETE | /training-sessions/:id | Hapus sesi | 204 |
| POST | /training-sessions/:id/participants | Daftarkan anggota ke sesi | 201 |
| GET | /training-sessions/:id/participants | Daftar peserta sesi | 200 |
| PATCH | /training-sessions/:id/participants/:memberId | Ubah status peserta | 200 |
| DELETE | /training-sessions/:id/participants/:memberId | Batalkan pendaftaran | 200 |

## 3. Members (anggota)

### POST `/members` — Tambah anggota

Membuat anggota baru dengan status awal `active`.

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `name` | string | ya | tidak boleh kosong |
| `email` | string | ya | format email valid, unik |
| `phone` | string | tidak | — |
| `birthDate` | string | tidak | format `YYYY-MM-DD` |
| `gender` | string | tidak | `male` / `female` |

**Berhasil** — `201`

Request body:
```json
{
  "name": "Budi Santoso",
  "email": "budi@mail.com",
  "phone": "08123456789",
  "birthDate": "1999-05-20",
  "gender": "male"
}
```
Response:
```json
{
  "name": "Budi Santoso",
  "email": "budi@mail.com",
  "phone": "08123456789",
  "birthDate": "1999-05-20",
  "gender": "male",
  "id": 1,
  "status": "active",
  "createdAt": "2026-11-07T13:19:26.262Z"
}
```
**Email tidak valid** — `400`

Request body:
```json
{
  "name": "Budi",
  "email": "salah"
}
```
Response:
```json
{
  "message": [
    "Format email tidak valid"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
**Email sudah dipakai** — `409`

Request body:
```json
{
  "name": "Budi Lain",
  "email": "budi@mail.com"
}
```
Response:
```json
{
  "statusCode": 409,
  "message": "Data duplikat (email/nama sudah dipakai)",
  "error": "Database Constraint"
}
```
---

### GET `/members` — Daftar anggota

Mengembalikan semua anggota, urut `id`. Filter opsional.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `status` | query | tidak | `active` / `inactive` |
| `q` | query | tidak | cari pada `name` atau `email` (mengandung teks) |

**Pencarian `?q=budi&status=active`** — `200`

Contoh request: `GET /members?q=budi&status=active`

Response:
```json
[
  {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@mail.com",
    "phone": "08123456789",
    "birthDate": "1999-05-20",
    "gender": "male",
    "status": "active",
    "createdAt": "2026-11-07T13:19:26.262Z"
  }
]
```
---

### GET `/members/:id` — Detail anggota

Mengembalikan satu anggota.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID anggota (bilangan bulat) |

**Berhasil** — `200`

Response:
```json
{
  "id": 1,
  "name": "Budi Santoso",
  "email": "budi@mail.com",
  "phone": "08123456789",
  "birthDate": "1999-05-20",
  "gender": "male",
  "status": "active",
  "createdAt": "2026-11-07T13:19:26.262Z"
}
```
**ID tidak ada** — `404`

Response:
```json
{
  "message": "Anggota dengan id 99 tidak ditemukan",
  "error": "Not Found",
  "statusCode": 404
}
```
**ID bukan angka** — `400`

Response:
```json
{
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request",
  "statusCode": 400
}
```
---

### PUT `/members/:id` — Ubah anggota

Mengubah sebagian/seluruh field (semua field opsional). Bisa mengubah `status`.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID anggota (bilangan bulat) |

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `name`, `email`, `phone`, `birthDate`, `gender` | — | tidak | aturan sama dengan POST |
| `status` | string | tidak | `active` / `inactive` |

**Berhasil** — `200`

Request body:
```json
{
  "phone": "08999999999"
}
```
Response:
```json
{
  "id": 1,
  "name": "Budi Santoso",
  "email": "budi@mail.com",
  "phone": "08999999999",
  "birthDate": "1999-05-20",
  "gender": "male",
  "status": "active",
  "createdAt": "2026-11-07T13:19:26.262Z"
}
```
---

### DELETE `/members/:id` — Hapus anggota

Menghapus anggota. Ditolak (409) bila masih punya keanggotaan atau pendaftaran sesi (FK `RESTRICT`).

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID anggota (bilangan bulat) |

**Berhasil** — `204`

Response: _tanpa body_

**Masih punya data terkait** — `409`

Response:
```json
{
  "statusCode": 409,
  "message": "Data masih dipakai oleh data lain, tidak bisa dihapus",
  "error": "Database Constraint"
}
```
---

### GET `/members/:id/membership-status` — Status & riwayat keanggotaan

Menampilkan keanggotaan aktif, sisa hari, dan seluruh riwayat (terbaru dulu).

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID anggota (bilangan bulat) |

**Berhasil** — `200`

Response:
```json
{
  "member": {
    "id": 1,
    "name": "Budi Santoso",
    "email": "budi@mail.com",
    "phone": "08999999999",
    "birthDate": "1999-05-20",
    "gender": "male",
    "status": "active",
    "createdAt": "2026-11-07T13:19:26.262Z"
  },
  "hasActiveMembership": true,
  "currentMembership": {
    "id": 1,
    "memberId": 1,
    "planId": 1,
    "startDate": "2026-11-07",
    "endDate": "2026-12-07",
    "pricePaid": 250000,
    "createdAt": "2026-11-07T13:19:26.378Z",
    "status": "active",
    "planName": "Bulanan"
  },
  "daysRemaining": 30,
  "history": [
    {
      "id": 1,
      "memberId": 1,
      "planId": 1,
      "startDate": "2026-11-07",
      "endDate": "2026-12-07",
      "pricePaid": 250000,
      "createdAt": "2026-11-07T13:19:26.378Z",
      "status": "active",
      "planName": "Bulanan"
    },
    {
      "id": 2,
      "memberId": 1,
      "planId": 1,
      "startDate": "2026-01-01",
      "endDate": "2026-01-31",
      "pricePaid": 250000,
      "createdAt": "2026-11-07T13:19:26.397Z",
      "status": "expired",
      "planName": "Bulanan"
    }
  ]
}
```
---

### GET `/members/:id/schedule` — Jadwal latihan anggota

Sesi yang diikuti anggota (pendaftaran `cancelled` tidak ditampilkan), urut waktu mulai.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID anggota (bilangan bulat) |
| `upcoming` | query | tidak | `true` = hanya sesi yang belum mulai |

**Berhasil (`?upcoming=true`)** — `200`

Contoh request: `GET /members/1/schedule?upcoming=true`

Response:
```json
[
  {
    "sessionId": 1,
    "title": "Strength Basics (Pagi)",
    "startTime": "2026-12-01T08:00:00.000Z",
    "endTime": "2026-12-01T09:00:00.000Z",
    "sessionStatus": "scheduled",
    "trainerName": "Coach Andi",
    "registrationStatus": "attended"
  }
]
```
---

## 4. Trainers (pelatih)

### POST `/trainers` — Tambah pelatih

Membuat pelatih baru dengan status awal `active`.

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `name` | string | ya | tidak boleh kosong |
| `email` | string | ya | format email valid, unik |
| `phone` | string | tidak | — |
| `specialization` | string | tidak | — |

**Berhasil** — `201`

Request body:
```json
{
  "name": "Coach Andi",
  "email": "andi@gym.com",
  "phone": "08111111111",
  "specialization": "Strength"
}
```
Response:
```json
{
  "name": "Coach Andi",
  "email": "andi@gym.com",
  "phone": "08111111111",
  "specialization": "Strength",
  "id": 1,
  "status": "active",
  "createdAt": "2026-11-07T13:19:26.325Z"
}
```
**Validasi gagal** — `400`

Request body:
```json
{
  "name": "",
  "email": "andi@gym.com"
}
```
Response:
```json
{
  "message": [
    "name should not be empty"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
---

### GET `/trainers` — Daftar pelatih

Semua pelatih, urut `id`.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `status` | query | tidak | `active` / `inactive` |

**Berhasil** — `200`

Response:
```json
[
  {
    "id": 1,
    "name": "Coach Andi",
    "email": "andi@gym.com",
    "phone": "08111111111",
    "specialization": "Strength",
    "status": "active",
    "createdAt": "2026-11-07T13:19:26.325Z"
  }
]
```
---

### GET `/trainers/:id` — Detail pelatih

Satu pelatih.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID pelatih (bilangan bulat) |

**Berhasil** — `200`

Response:
```json
{
  "id": 1,
  "name": "Coach Andi",
  "email": "andi@gym.com",
  "phone": "08111111111",
  "specialization": "Strength",
  "status": "active",
  "createdAt": "2026-11-07T13:19:26.325Z"
}
```
---

### PUT `/trainers/:id` — Ubah pelatih

Semua field opsional; `status` boleh diubah.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID pelatih (bilangan bulat) |

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `name`, `email`, `phone`, `specialization` | — | tidak | aturan sama dengan POST |
| `status` | string | tidak | `active` / `inactive` |

**Berhasil** — `200`

Request body:
```json
{
  "specialization": "Strength & Conditioning"
}
```
Response:
```json
{
  "id": 1,
  "name": "Coach Andi",
  "email": "andi@gym.com",
  "phone": "08111111111",
  "specialization": "Strength & Conditioning",
  "status": "active",
  "createdAt": "2026-11-07T13:19:26.325Z"
}
```
---

### DELETE `/trainers/:id` — Hapus pelatih

Ditolak (409) bila pelatih masih punya sesi latihan.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID pelatih (bilangan bulat) |

**Masih punya sesi** — `409`

Response:
```json
{
  "statusCode": 409,
  "message": "Data masih dipakai oleh data lain, tidak bisa dihapus",
  "error": "Database Constraint"
}
```
---

### GET `/trainers/:id/sessions` — Sesi milik pelatih

Daftar sesi yang ditangani pelatih, urut waktu mulai.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID pelatih (bilangan bulat) |

**Berhasil** — `200`

Response:
```json
[
  {
    "id": 1,
    "trainerId": 1,
    "title": "Strength Basics (Pagi)",
    "description": "Latihan beban dasar",
    "startTime": "2026-12-01T08:00:00.000Z",
    "endTime": "2026-12-01T09:00:00.000Z",
    "capacity": 3,
    "status": "scheduled",
    "createdAt": "2026-11-07T13:19:26.452Z"
  }
]
```
---

## 5. Membership Plans (paket keanggotaan)

### POST `/membership-plans` — Tambah paket

Membuat paket baru (aktif secara default).

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `name` | string | ya | tidak boleh kosong, unik |
| `description` | string | tidak | — |
| `price` | integer | ya | bilangan bulat ≥ 0 |
| `durationDays` | integer | ya | bilangan bulat ≥ 1 |

**Berhasil** — `201`

Request body:
```json
{
  "name": "Bulanan",
  "description": "Akses 30 hari",
  "price": 250000,
  "durationDays": 30
}
```
Response:
```json
{
  "name": "Bulanan",
  "description": "Akses 30 hari",
  "price": 250000,
  "durationDays": 30,
  "id": 1,
  "isActive": true,
  "createdAt": "2026-11-07T13:19:26.348Z"
}
```
**Harga negatif** — `400`

Request body:
```json
{
  "name": "Bad",
  "price": -1,
  "durationDays": 30
}
```
Response:
```json
{
  "message": [
    "price must not be less than 0"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
---

### GET `/membership-plans` — Daftar paket

Semua paket, urut harga naik.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `active` | query | tidak | `true` = hanya paket aktif |

**Berhasil (`?active=true`)** — `200`

Contoh request: `GET /membership-plans?active=true`

Response:
```json
[
  {
    "id": 1,
    "name": "Bulanan",
    "description": "Akses 30 hari",
    "price": 250000,
    "durationDays": 30,
    "isActive": true,
    "createdAt": "2026-11-07T13:19:26.348Z"
  }
]
```
---

### GET `/membership-plans/:id` — Detail paket

Satu paket.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID paket (bilangan bulat) |

**Berhasil** — `200`

Response:
```json
{
  "id": 1,
  "name": "Bulanan",
  "description": "Akses 30 hari",
  "price": 250000,
  "durationDays": 30,
  "isActive": true,
  "createdAt": "2026-11-07T13:19:26.348Z"
}
```
---

### PUT `/membership-plans/:id` — Ubah paket

Semua field opsional; `isActive` boleh diubah.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID paket (bilangan bulat) |

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `name`, `description`, `price`, `durationDays` | — | tidak | aturan sama dengan POST |
| `isActive` | boolean | tidak | `true` / `false` |

**Berhasil** — `200`

Request body:
```json
{
  "description": "Akses gym 30 hari penuh"
}
```
Response:
```json
{
  "id": 1,
  "name": "Bulanan",
  "description": "Akses gym 30 hari penuh",
  "price": 250000,
  "durationDays": 30,
  "isActive": true,
  "createdAt": "2026-11-07T13:19:26.348Z"
}
```
---

### DELETE `/membership-plans/:id` — Hapus paket

Ditolak (409) bila paket sudah dipakai keanggotaan.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID paket (bilangan bulat) |

**Paket dipakai** — `409`

Response:
```json
{
  "statusCode": 409,
  "message": "Data masih dipakai oleh data lain, tidak bisa dihapus",
  "error": "Database Constraint"
}
```
---

## 6. Memberships (keanggotaan)

### POST `/memberships` — Daftarkan anggota ke paket

`endDate = startDate + durationDays`, `pricePaid` menyalin harga paket saat ini. `status` dihitung otomatis dari tanggal. Syarat: anggota & paket aktif, periode tidak overlap dengan keanggotaan (belum dibatalkan) lain milik anggota yang sama.

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `memberId` | integer | ya | ≥ 1, anggota harus ada & aktif |
| `planId` | integer | ya | ≥ 1, paket harus ada & aktif |
| `startDate` | string | tidak | `YYYY-MM-DD`; default hari ini |

**Berhasil** — `201`

Request body:
```json
{
  "memberId": 1,
  "planId": 1
}
```
Response:
```json
{
  "memberId": 1,
  "planId": 1,
  "startDate": "2026-11-07",
  "endDate": "2026-12-07",
  "pricePaid": 250000,
  "id": 1,
  "createdAt": "2026-11-07T13:19:26.378Z",
  "status": "active"
}
```
**Riwayat lama (status `expired`)** — `201`

Request body:
```json
{
  "memberId": 1,
  "planId": 1,
  "startDate": "2026-01-01"
}
```
Response:
```json
{
  "memberId": 1,
  "planId": 1,
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "pricePaid": 250000,
  "id": 2,
  "createdAt": "2026-11-07T13:19:26.397Z",
  "status": "expired"
}
```
**Periode bentrok** — `409`

Request body:
```json
{
  "memberId": 1,
  "planId": 1,
  "startDate": "2026-11-20"
}
```
Response:
```json
{
  "message": "Periode bentrok dengan keanggotaan #1",
  "error": "Conflict",
  "statusCode": 409
}
```
**Anggota tidak ada** — `404`

Request body:
```json
{
  "memberId": 99,
  "planId": 1
}
```
Response:
```json
{
  "message": "Anggota dengan id 99 tidak ditemukan",
  "error": "Not Found",
  "statusCode": 404
}
```
---

### GET `/memberships` — Daftar keanggotaan

Disertai `memberName` dan `planName`.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `memberId` | query | tidak | filter anggota |
| `planId` | query | tidak | filter paket |
| `status` | query | tidak | `upcoming` / `active` / `expired` / `cancelled` |

**Filter `?memberId=1&status=active`** — `200`

Contoh request: `GET /memberships?memberId=1&status=active`

Response:
```json
[
  {
    "id": 1,
    "memberId": 1,
    "planId": 1,
    "startDate": "2026-11-07",
    "endDate": "2026-12-07",
    "pricePaid": 250000,
    "createdAt": "2026-11-07T13:19:26.378Z",
    "status": "active",
    "memberName": "Budi Santoso",
    "planName": "Bulanan"
  }
]
```
---

### GET `/memberships/:id` — Detail keanggotaan

Satu keanggotaan beserta `status`.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID keanggotaan (bilangan bulat) |

**Berhasil** — `200`

Response:
```json
{
  "id": 1,
  "memberId": 1,
  "planId": 1,
  "startDate": "2026-11-07",
  "endDate": "2026-12-07",
  "pricePaid": 250000,
  "createdAt": "2026-11-07T13:19:26.378Z",
  "status": "active"
}
```
---

### PATCH `/memberships/:id/cancel` — Batalkan keanggotaan

Menandai keanggotaan sebagai `cancelled`. Tidak bisa dibatalkan dua kali.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID keanggotaan (bilangan bulat) |

**Berhasil** — `200`

Response:
```json
{
  "id": 2,
  "memberId": 1,
  "planId": 1,
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "pricePaid": 250000,
  "createdAt": "2026-11-07T13:19:26.397Z",
  "status": "cancelled"
}
```
**Sudah dibatalkan** — `409`

Response:
```json
{
  "message": "Keanggotaan sudah dibatalkan",
  "error": "Conflict",
  "statusCode": 409
}
```
---

## 7. Training Sessions (sesi latihan)

### POST `/training-sessions` — Buat sesi

Pelatih harus aktif dan tidak boleh punya sesi lain (selain `cancelled`) yang waktunya beririsan.

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `trainerId` | integer | ya | ≥ 1, pelatih harus ada & aktif |
| `title` | string | ya | tidak boleh kosong |
| `description` | string | tidak | — |
| `startTime` | string | ya | ISO 8601 |
| `endTime` | string | ya | ISO 8601, harus setelah `startTime` |
| `capacity` | integer | ya | ≥ 1 |

**Berhasil** — `201`

Request body:
```json
{
  "trainerId": 1,
  "title": "Strength Basics",
  "description": "Latihan beban dasar",
  "startTime": "2026-12-01T08:00:00.000Z",
  "endTime": "2026-12-01T09:00:00.000Z",
  "capacity": 2
}
```
Response:
```json
{
  "id": 1,
  "trainerId": 1,
  "title": "Strength Basics",
  "description": "Latihan beban dasar",
  "startTime": "2026-12-01T08:00:00.000Z",
  "endTime": "2026-12-01T09:00:00.000Z",
  "capacity": 2,
  "status": "scheduled",
  "createdAt": "2026-11-07T13:19:26.452Z",
  "trainerName": "Coach Andi",
  "participantCount": 0,
  "availableSlots": 2
}
```
**Jadwal pelatih bentrok** — `409`

Request body:
```json
{
  "trainerId": 1,
  "title": "Bentrok",
  "startTime": "2026-12-01T08:30:00.000Z",
  "endTime": "2026-12-01T09:30:00.000Z",
  "capacity": 5
}
```
Response:
```json
{
  "message": "Pelatih sudah punya sesi #1 pada waktu tersebut",
  "error": "Conflict",
  "statusCode": 409
}
```
**`endTime` sebelum `startTime`** — `400`

Request body:
```json
{
  "trainerId": 1,
  "title": "Salah",
  "startTime": "2026-12-01T09:00:00.000Z",
  "endTime": "2026-12-01T08:00:00.000Z",
  "capacity": 5
}
```
Response:
```json
{
  "message": "endTime harus setelah startTime",
  "error": "Bad Request",
  "statusCode": 400
}
```
**Validasi gagal** — `400`

Request body:
```json
{
  "trainerId": 1,
  "title": "X",
  "startTime": "besok",
  "endTime": "2026-12-01T09:00:00.000Z",
  "capacity": 0
}
```
Response:
```json
{
  "message": [
    "startTime harus format ISO 8601",
    "capacity must not be less than 1"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
---

### GET `/training-sessions` — Daftar sesi

Disertai `trainerName`, `participantCount`, `availableSlots`.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `trainerId` | query | tidak | filter pelatih |
| `status` | query | tidak | `scheduled` / `completed` / `cancelled` |
| `from` | query | tidak | `startTime` ≥ nilai ini |
| `to` | query | tidak | `startTime` ≤ nilai ini |

**Filter** — `200`

Contoh request: `GET /training-sessions?trainerId=1&status=scheduled&from=2026-12-01&to=2026-12-31`

Response:
```json
[
  {
    "id": 1,
    "trainerId": 1,
    "title": "Strength Basics",
    "description": "Latihan beban dasar",
    "startTime": "2026-12-01T08:00:00.000Z",
    "endTime": "2026-12-01T09:00:00.000Z",
    "capacity": 2,
    "status": "scheduled",
    "createdAt": "2026-11-07T13:19:26.452Z",
    "trainerName": "Coach Andi",
    "participantCount": 0,
    "availableSlots": 2
  }
]
```
---

### GET `/schedule` — Jadwal mendatang

Sesi berstatus `scheduled` yang belum mulai, beserta sisa slot.

**Berhasil** — `200`

Response:
```json
[
  {
    "id": 1,
    "trainerId": 1,
    "title": "Strength Basics",
    "description": "Latihan beban dasar",
    "startTime": "2026-12-01T08:00:00.000Z",
    "endTime": "2026-12-01T09:00:00.000Z",
    "capacity": 2,
    "status": "scheduled",
    "createdAt": "2026-11-07T13:19:26.452Z",
    "trainerName": "Coach Andi",
    "participantCount": 0,
    "availableSlots": 2
  }
]
```
---

### GET `/training-sessions/:id` — Detail sesi

Satu sesi.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID sesi (bilangan bulat) |

**Berhasil** — `200`

Response:
```json
{
  "id": 1,
  "trainerId": 1,
  "title": "Strength Basics",
  "description": "Latihan beban dasar",
  "startTime": "2026-12-01T08:00:00.000Z",
  "endTime": "2026-12-01T09:00:00.000Z",
  "capacity": 2,
  "status": "scheduled",
  "createdAt": "2026-11-07T13:19:26.452Z",
  "trainerName": "Coach Andi",
  "participantCount": 0,
  "availableSlots": 2
}
```
---

### PUT `/training-sessions/:id` — Ubah sesi

Semua field opsional; `status` boleh diubah. Kapasitas tidak boleh lebih kecil dari jumlah peserta aktif; aturan bentrok pelatih tetap dicek.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID sesi (bilangan bulat) |

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `trainerId`, `title`, `description`, `startTime`, `endTime`, `capacity` | — | tidak | aturan sama dengan POST |
| `status` | string | tidak | `scheduled` / `completed` / `cancelled` |

**Berhasil** — `200`

Request body:
```json
{
  "title": "Strength Basics (Pagi)",
  "capacity": 3
}
```
Response:
```json
{
  "id": 1,
  "trainerId": 1,
  "title": "Strength Basics (Pagi)",
  "description": "Latihan beban dasar",
  "startTime": "2026-12-01T08:00:00.000Z",
  "endTime": "2026-12-01T09:00:00.000Z",
  "capacity": 3,
  "status": "scheduled",
  "createdAt": "2026-11-07T13:19:26.452Z",
  "trainerName": "Coach Andi",
  "participantCount": 0,
  "availableSlots": 3
}
```
---

### DELETE `/training-sessions/:id` — Hapus sesi

Ditolak (409) bila sesi masih punya data peserta.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID sesi (bilangan bulat) |

**Masih punya peserta** — `409`

Response:
```json
{
  "statusCode": 409,
  "message": "Data masih dipakai oleh data lain, tidak bisa dihapus",
  "error": "Database Constraint"
}
```
---

## 8. Session Participants (peserta sesi)

### POST `/training-sessions/:id/participants` — Daftarkan anggota ke sesi

Aturan: anggota aktif & punya keanggotaan aktif pada tanggal sesi; sesi `scheduled` dan belum mulai; kapasitas belum penuh; belum terdaftar; tidak bentrok dengan sesi lain miliknya. Anggota yang sebelumnya `cancelled` bisa mendaftar ulang.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID sesi (bilangan bulat) |

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `memberId` | integer | ya | ≥ 1 |

**Berhasil** — `201`

Request body:
```json
{
  "memberId": 1
}
```
Response:
```json
{
  "sessionId": 1,
  "memberId": 1,
  "id": 1,
  "status": "registered",
  "registeredAt": "2026-11-07T13:19:26.522Z"
}
```
**Sudah terdaftar** — `409`

Request body:
```json
{
  "memberId": 1
}
```
Response:
```json
{
  "message": "Anggota sudah terdaftar di sesi ini",
  "error": "Conflict",
  "statusCode": 409
}
```
**Tanpa keanggotaan aktif** — `409`

Request body:
```json
{
  "memberId": 3
}
```
Response:
```json
{
  "message": "Anggota tidak punya keanggotaan aktif pada tanggal sesi",
  "error": "Conflict",
  "statusCode": 409
}
```
---

### GET `/training-sessions/:id/participants` — Daftar peserta

Seluruh pendaftaran sesi (termasuk `cancelled`) dan jumlah peserta aktif.

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID sesi (bilangan bulat) |

**Berhasil** — `200`

Response:
```json
{
  "sessionId": 1,
  "title": "Strength Basics (Pagi)",
  "capacity": 3,
  "activeParticipants": 2,
  "participants": [
    {
      "id": 1,
      "memberId": 1,
      "name": "Budi Santoso",
      "email": "budi@mail.com",
      "status": "registered",
      "registeredAt": "2026-11-07T13:19:26.522Z"
    },
    {
      "id": 2,
      "memberId": 2,
      "name": "Siti Aminah",
      "email": "siti@mail.com",
      "status": "registered",
      "registeredAt": "2026-11-07T13:19:26.537Z"
    }
  ]
}
```
---

### PATCH `/training-sessions/:id/participants/:memberId` — Ubah status peserta

Mengubah status kehadiran. Pendaftaran `cancelled` tidak bisa diubah lewat endpoint ini (daftar ulang via POST).

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID sesi (bilangan bulat) |
| `memberId` | path | ya | ID anggota |

**Body (JSON)**

| Field | Tipe | Wajib | Aturan validasi |
|---|---|---|---|
| `status` | string | ya | `registered` / `attended` / `absent` / `cancelled` |

**Berhasil** — `200`

Request body:
```json
{
  "status": "attended"
}
```
Response:
```json
{
  "id": 1,
  "sessionId": 1,
  "memberId": 1,
  "status": "attended",
  "registeredAt": "2026-11-07T13:19:26.522Z"
}
```
**Status tidak valid** — `400`

Request body:
```json
{
  "status": "hadir"
}
```
Response:
```json
{
  "message": [
    "status harus salah satu: registered, attended, absent, cancelled"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```
---

### DELETE `/training-sessions/:id/participants/:memberId` — Batalkan pendaftaran

Mengubah status peserta menjadi `cancelled` (data tidak dihapus, slot kembali tersedia).

**Parameter**

| Nama | Lokasi | Wajib | Keterangan |
|---|---|---|---|
| `id` | path | ya | ID sesi (bilangan bulat) |
| `memberId` | path | ya | ID anggota |

**Berhasil** — `200`

Response:
```json
{
  "message": "Pendaftaran dibatalkan",
  "id": 2,
  "sessionId": 1,
  "memberId": 2,
  "status": "cancelled",
  "registeredAt": "2026-11-07T13:19:26.537Z"
}
```
---

## 9. Daftar aturan bisnis (sumber error 409)

| Area | Aturan |
|---|---|
| Anggota / Pelatih | `email` unik; tidak bisa dihapus bila masih dipakai tabel lain |
| Paket | `name` unik; tidak bisa dihapus bila sudah dipakai keanggotaan |
| Keanggotaan | Anggota & paket harus aktif; periode tidak boleh overlap; tidak bisa dibatalkan dua kali |
| Sesi | Pelatih aktif & tidak bentrok; `endTime > startTime`; kapasitas ≥ jumlah peserta aktif |
| Peserta | Perlu keanggotaan aktif pada tanggal sesi; sesi `scheduled` & belum mulai; kapasitas; tidak ganda; tidak bentrok dengan sesi lain |
