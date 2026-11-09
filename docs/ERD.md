# ERD — Gym Management System

Database: **MySQL 8**, nama database `gym_db`. Gambar: [`ERD.png`](ERD.png) / [`ERD.svg`](ERD.svg). DDL lengkap: [`schema.sql`](schema.sql).

![ERD](ERD.png)

## Diagram (Mermaid)

```mermaid
erDiagram
  members ||--o{ memberships : "memiliki"
  membership_plans ||--o{ memberships : "dipakai oleh"
  trainers ||--o{ training_sessions : "memimpin"
  training_sessions ||--o{ session_participants : "punya peserta"
  members ||--o{ session_participants : "mengikuti"

  members {
    int id PK
    varchar name
    varchar email UK
    varchar phone
    varchar birthDate
    varchar gender
    varchar status
    datetime createdAt
  }
  membership_plans {
    int id PK
    varchar name UK
    varchar description
    int price
    int durationDays
    tinyint isActive
    datetime createdAt
  }
  memberships {
    int id PK
    int memberId FK
    int planId FK
    varchar startDate
    varchar endDate
    int pricePaid
    tinyint cancelled
    datetime createdAt
  }
  trainers {
    int id PK
    varchar name
    varchar email UK
    varchar phone
    varchar specialization
    varchar status
    datetime createdAt
  }
  training_sessions {
    int id PK
    int trainerId FK
    varchar title
    varchar description
    varchar startTime
    varchar endTime
    int capacity
    varchar status
    datetime createdAt
  }
  session_participants {
    int id PK
    int sessionId FK
    int memberId FK
    varchar status
    datetime registeredAt
  }
```

## Relasi

| Relasi | Kardinalitas | Foreign key | Aksi hapus |
|---|---|---|---|
| `members` → `memberships` | 1 : N | `memberships.memberId` → `members.id` | RESTRICT |
| `membership_plans` → `memberships` | 1 : N | `memberships.planId` → `membership_plans.id` | RESTRICT |
| `trainers` → `training_sessions` | 1 : N | `training_sessions.trainerId` → `trainers.id` | RESTRICT |
| `training_sessions` → `session_participants` | 1 : N | `session_participants.sessionId` → `training_sessions.id` | RESTRICT |
| `members` → `session_participants` | 1 : N | `session_participants.memberId` → `members.id` | RESTRICT |
| `members` ↔ `training_sessions` | N : N | lewat tabel penghubung `session_participants` | — |

Constraint unik: `members.email`, `trainers.email`, `membership_plans.name`, dan pasangan (`session_participants.sessionId`, `session_participants.memberId`) agar anggota tidak terdaftar dua kali di sesi yang sama.

## Catatan desain

- `RESTRICT` pada semua FK: data yang masih dipakai tabel lain tidak bisa dihapus (API membalas 409).
- Tanggal keanggotaan disimpan sebagai teks `YYYY-MM-DD`; waktu sesi sebagai teks ISO 8601 UTC.
- `memberships.pricePaid` menyalin harga paket saat transaksi, sehingga perubahan harga paket tidak mengubah riwayat.
- Status keanggotaan (`upcoming/active/expired/cancelled`) tidak disimpan, tetapi dihitung dari tanggal dan kolom `cancelled`.
