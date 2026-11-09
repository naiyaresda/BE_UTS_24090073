# Gym Management System — Backend (NestJS + TypeORM + MySQL)

Backend REST API untuk studi kasus **Gym Management System** (anggota, pelatih, paket & keanggotaan, jadwal sesi latihan, peserta sesi).

**Stack:** NestJS 10 (TypeScript) · TypeORM · **MySQL 8** · class-validator / class-transformer · Jest + Supertest · Postman.

## Isi pengumpulan

| Berkas | Lokasi |
|---|---|
| Source code | `src/` |
| API Specification | [`docs/API-Specification.md`](docs/API-Specification.md) |
| ERD | [`docs/ERD.md`](docs/ERD.md) · [`docs/ERD.png`](docs/ERD.png) · [`docs/ERD.svg`](docs/ERD.svg) |
| Skema SQL (referensi) | [`docs/schema.sql`](docs/schema.sql) |
| Postman Collection | [`postman/Gym-Management.postman_collection.json`](postman/Gym-Management.postman_collection.json) |
| Konfigurasi environment | [`.env.example`](.env.example) |
| Instalasi & cara menjalankan | dokumen ini |

## 1. Prasyarat

- **Node.js** 18 atau lebih baru (disarankan 20 LTS) dan npm
- **MySQL** 8 (atau MariaDB 10.5+) yang sedang berjalan
- **Postman** untuk pengujian manual

## 2. Instalasi

```bash
# 1. masuk ke folder project dan pasang dependency
cd gym-nest
npm install

# 2. buat database kosong (contoh lewat terminal MySQL)
mysql -u root -p -e "CREATE DATABASE gym_db CHARACTER SET utf8mb4;"

# 3. salin konfigurasi environment, lalu isi sesuai MySQL kamu
cp .env.example .env        # Windows (cmd): copy .env.example .env
```

## 3. Konfigurasi environment (`.env`)

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port aplikasi |
| `DB_HOST` | `localhost` | Host MySQL |
| `DB_PORT` | `3306` | Port MySQL |
| `DB_USERNAME` | `root` | User MySQL |
| `DB_PASSWORD` | _(kosong)_ | Password MySQL |
| `DB_NAME` | `gym_db` | Nama database (harus sudah dibuat) |
| `DB_SYNCHRONIZE` | `true` | `true` = tabel dibuat otomatis dari entity saat start |

File `.env` tidak ikut di-commit (ada di `.gitignore`).

## 4. Menjalankan aplikasi

```bash
npm run seed        # opsional, sekali saja: isi data contoh (paket, anggota, pelatih)
npm run start:dev   # mode development (auto-reload) → http://localhost:3000
# atau mode produksi:
npm run build && npm run start:prod
```

Saat pertama dijalankan, enam tabel dibuat otomatis. Jika ingin membuat tabel manual, jalankan [`docs/schema.sql`](docs/schema.sql) dan set `DB_SYNCHRONIZE=false`.

> `npm run seed` hanya boleh dijalankan sekali karena email/nama bersifat unik; untuk mengulang, kosongkan database terlebih dahulu.

## 5. Pengujian

### Postman
1. Import `postman/Gym-Management.postman_collection.json`.
2. Pastikan variable koleksi `baseUrl` = `http://localhost:3000`.
3. Jalankan folder berurutan 1 → 7 (atau **Run collection**). ID hasil request *Create* tersimpan otomatis ke variable koleksi, jadi request berikutnya tidak perlu diubah manual.
4. Koleksi memuat skenario sukses dan skenario error (400, 404, 409).

> Catatan MySQL: nilai `id` auto-increment bisa melompat setelah request yang gagal (misalnya email duplikat). Ini perilaku normal InnoDB; ID selalu diambil dari variable Postman.

### Tes otomatis (Jest, 8 skenario e2e)
```bash
npm test                    # memakai SQLite in-memory, tidak butuh MySQL
DB_TYPE=mysql DB_USERNAME=root DB_PASSWORD=xxx npm test   # menguji langsung ke MySQL (gunakan database kosong)
```
Di Windows PowerShell: `$env:DB_TYPE="mysql"; npm test`.

## 6. Struktur project

```
src/
  config/               konfigurasi database (dibaca dari .env)
  members/ trainers/ membership-plans/ memberships/ training-sessions/
    *.entity.ts  *.dto.ts  *.service.ts  *.controller.ts  *.module.ts
  common/               filter error database, util tanggal
  app.module.ts  main.ts  setup-app.ts  seed.ts
docs/                   ERD, API Specification, schema.sql
postman/                Postman Collection
test/                   tes e2e
```

Setiap fitur dipisah menjadi `Module` → `Controller` → `Service`; akses data lewat TypeORM (`Repository`); input divalidasi DTO + `ValidationPipe` global.

## 7. Entitas & relasi (ringkas)

- `Member` 1—N `Membership` N—1 `MembershipPlan`
- `Trainer` 1—N `TrainingSession`
- `Member` N—N `TrainingSession` lewat `SessionParticipant` (unik per sesi + anggota)

Detail lengkap ada di [`docs/ERD.md`](docs/ERD.md).

## 8. Aturan bisnis utama

- **Keanggotaan:** `endDate = startDate + durationDays`; harga disimpan di `pricePaid`; status dihitung otomatis (`upcoming | active | expired | cancelled`); periode tidak boleh overlap; anggota & paket harus aktif.
- **Sesi latihan:** `endTime > startTime`, `capacity > 0`; pelatih aktif dan tidak boleh bentrok; kapasitas tidak boleh di bawah jumlah peserta.
- **Peserta:** wajib punya keanggotaan aktif pada tanggal sesi; sesi `scheduled` dan belum mulai; kapasitas tidak boleh terlampaui; tidak boleh daftar ganda atau bentrok jadwal.
- Data yang masih dipakai tabel lain tidak bisa dihapus (409).

## 9. Daftar endpoint

Ada 32 endpoint; ringkasan dan contoh request/response lengkap ada di [`docs/API-Specification.md`](docs/API-Specification.md).

## 10. Troubleshooting

| Masalah | Solusi |
|---|---|
| `ECONNREFUSED 127.0.0.1:3306` | MySQL belum berjalan — jalankan service MySQL |
| `Access denied for user` | Periksa `DB_USERNAME` / `DB_PASSWORD` di `.env` |
| `Unknown database 'gym_db'` | Buat database dulu (langkah 2) |
| `EADDRINUSE :::3000` | Port dipakai — ubah `PORT` di `.env` |
| `Duplicate entry` saat seed | Seed sudah pernah dijalankan; kosongkan database lalu ulangi |
