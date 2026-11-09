process.env.DB_TYPE = process.env.DB_TYPE || 'sqlite'; // default: SQLite in-memory; jalankan dengan DB_TYPE=mysql untuk uji ke MySQL
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

describe('Gym API (e2e)', () => {
  let app: INestApplication;
  let http: any;
  const future = (h: number, days = 5) => new Date(Date.now() + days * 86400000 + h * 3600000).toISOString();

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = setupApp(mod.createNestApplication());
    await app.init();
    http = app.getHttpServer();
  });
  afterAll(() => app.close());

  let memberId: number, planId: number, trainerId: number, sessionId: number;

  it('CRUD member + validasi email + duplikat', async () => {
    await request(http).post('/members').send({ name: 'Budi', email: 'salah' }).expect(400);
    const r = await request(http).post('/members').send({ name: 'Budi', email: 'budi@mail.com' }).expect(201);
    memberId = r.body.id;
    await request(http).post('/members').send({ name: 'X', email: 'budi@mail.com' }).expect(409);
    await request(http).get(`/members/${memberId}`).expect(200);
    await request(http).get('/members/999').expect(404);
  });

  it('plan & trainer', async () => {
    await request(http).post('/membership-plans').send({ name: 'Bad', price: -1, durationDays: 30 }).expect(400);
    planId = (await request(http).post('/membership-plans').send({ name: 'Bulanan', price: 250000, durationDays: 30 }).expect(201)).body.id;
    trainerId = (await request(http).post('/trainers').send({ name: 'Andi', email: 'andi@gym.com' }).expect(201)).body.id;
  });

  it('sesi tidak bisa didaftar tanpa keanggotaan aktif', async () => {
    const s = await request(http).post('/training-sessions')
      .send({ trainerId, title: 'Strength', startTime: future(0), endTime: future(1), capacity: 1 }).expect(201);
    sessionId = s.body.id;
    await request(http).post(`/training-sessions/${sessionId}/participants`).send({ memberId }).expect(409);
  });

  it('keanggotaan: end = start + durasi, status dihitung, overlap ditolak', async () => {
    const r = await request(http).post('/memberships').send({ memberId, planId, startDate: '2026-01-01' }).expect(201);
    expect(r.body.endDate).toBe('2026-01-31');
    expect(r.body.status).toBe('expired');
    await request(http).post('/memberships').send({ memberId, planId, startDate: '2026-01-15' }).expect(409);
    const now = await request(http).post('/memberships').send({ memberId, planId }).expect(201);
    expect(now.body.status).toBe('active');
    const st = await request(http).get(`/members/${memberId}/membership-status`).expect(200);
    expect(st.body.hasActiveMembership).toBe(true);
    expect(st.body.history).toHaveLength(2);
  });

  it('pelatih tidak boleh bentrok jadwal', async () => {
    await request(http).post('/training-sessions')
      .send({ trainerId, title: 'Bentrok', startTime: future(0.5), endTime: future(1.5), capacity: 5 }).expect(409);
    await request(http).post('/training-sessions')
      .send({ trainerId, title: 'Salah', startTime: future(3), endTime: future(2), capacity: 5 }).expect(400);
  });

  it('daftar peserta, kapasitas, daftar ganda, batal & daftar ulang', async () => {
    await request(http).post(`/training-sessions/${sessionId}/participants`).send({ memberId }).expect(201);
    await request(http).post(`/training-sessions/${sessionId}/participants`).send({ memberId }).expect(409);

    const m2 = (await request(http).post('/members').send({ name: 'Siti', email: 'siti@mail.com' })).body.id;
    await request(http).post('/memberships').send({ memberId: m2, planId }).expect(201);
    const full = await request(http).post(`/training-sessions/${sessionId}/participants`).send({ memberId: m2 }).expect(409);
    expect(full.body.message).toMatch(/penuh/);

    const list = await request(http).get(`/training-sessions/${sessionId}/participants`).expect(200);
    expect(list.body.activeParticipants).toBe(1);
    expect(list.body.participants[0].name).toBe('Budi');

    await request(http).delete(`/training-sessions/${sessionId}/participants/${memberId}`).expect(200);
    await request(http).post(`/training-sessions/${sessionId}/participants`).send({ memberId: m2 }).expect(201);
    await request(http).patch(`/training-sessions/${sessionId}/participants/${memberId}`).send({ status: 'attended' }).expect(409);
  });

  it('jadwal & sesi anggota', async () => {
    const sch = await request(http).get('/schedule').expect(200);
    expect(sch.body[0]).toMatchObject({ participantCount: 1, availableSlots: 0, trainerName: 'Andi' });
    const t = await request(http).get(`/trainers/${trainerId}/sessions`).expect(200);
    expect(t.body).toHaveLength(1);
  });

  it('data yang dipakai tidak bisa dihapus (409)', async () => {
    await request(http).delete(`/membership-plans/${planId}`).expect(409);
    await request(http).delete(`/trainers/${trainerId}`).expect(409);
    await request(http).delete(`/members/${memberId}`).expect(409);
  });
});
