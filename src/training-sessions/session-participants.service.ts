import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { SessionParticipant, ParticipantStatus } from './session-participant.entity';
import { TrainingSession } from './training-session.entity';
import { Member } from '../members/member.entity';
import { Membership } from '../memberships/membership.entity';

const ACTIVE: ParticipantStatus[] = ['registered', 'attended'];

@Injectable()
export class SessionParticipantsService {
  constructor(
    @InjectRepository(SessionParticipant) private repo: Repository<SessionParticipant>,
    @InjectRepository(TrainingSession) private sessionRepo: Repository<TrainingSession>,
    @InjectRepository(Member) private memberRepo: Repository<Member>,
    @InjectRepository(Membership) private msRepo: Repository<Membership>,
  ) {}

  private async getSession(id: number) {
    const s = await this.sessionRepo.findOneBy({ id });
    if (!s) throw new NotFoundException(`Sesi dengan id ${id} tidak ditemukan`);
    return s;
  }

  private countActive(sessionId: number) {
    return this.repo.count({ where: { sessionId, status: In(ACTIVE) } });
  }

  async register(sessionId: number, memberId: number) {
    const session = await this.getSession(sessionId);
    const member = await this.memberRepo.findOneBy({ id: memberId });
    if (!member) throw new NotFoundException(`Anggota dengan id ${memberId} tidak ditemukan`);
    if (member.status !== 'active') throw new ConflictException('Anggota tidak aktif');
    if (session.status !== 'scheduled') throw new ConflictException(`Sesi berstatus '${session.status}', tidak bisa didaftar`);
    if (session.startTime < new Date().toISOString()) throw new ConflictException('Sesi sudah dimulai/lewat');

    // Aturan: harus punya keanggotaan aktif pada tanggal sesi
    const sessionDate = session.startTime.slice(0, 10);
    const ms = await this.msRepo
      .createQueryBuilder('ms')
      .where('ms.memberId = :mid AND ms.cancelled = 0', { mid: member.id })
      .andWhere('ms.startDate <= :d AND ms.endDate >= :d', { d: sessionDate })
      .getOne();
    if (!ms) throw new ConflictException('Anggota tidak punya keanggotaan aktif pada tanggal sesi');

    // Aturan: tidak boleh bentrok dengan sesi lain milik anggota
    const clash = await this.repo
      .createQueryBuilder('sp')
      .innerJoin('sp.session', 's')
      .select('s.id', 'id')
      .where('sp.memberId = :mid AND sp.status IN (:...st)', { mid: member.id, st: ACTIVE })
      .andWhere("s.status != 'cancelled' AND s.id != :sid", { sid: session.id })
      .andWhere('s.startTime < :end AND s.endTime > :start', { start: session.startTime, end: session.endTime })
      .getRawOne();
    if (clash) throw new ConflictException(`Anggota bentrok dengan sesi #${clash.id}`);

    const existing = await this.repo.findOneBy({ sessionId, memberId });
    if (existing && existing.status !== 'cancelled') throw new ConflictException('Anggota sudah terdaftar di sesi ini');

    // Aturan: kapasitas
    if ((await this.countActive(sessionId)) >= session.capacity) throw new ConflictException('Kapasitas sesi sudah penuh');

    if (existing) { // daftar ulang setelah batal
      existing.status = 'registered';
      existing.registeredAt = new Date();
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create({ sessionId, memberId }));
  }

  async list(sessionId: number) {
    const session = await this.getSession(sessionId);
    const rows = await this.repo.find({ where: { sessionId }, relations: { member: true }, order: { id: 'ASC' } });
    const participants = rows.map((p) => ({
      id: p.id, memberId: p.memberId, name: p.member.name, email: p.member.email, status: p.status, registeredAt: p.registeredAt,
    }));
    return {
      sessionId: session.id,
      title: session.title,
      capacity: session.capacity,
      activeParticipants: participants.filter((p) => ACTIVE.includes(p.status)).length,
      participants,
    };
  }

  private async findParticipant(sessionId: number, memberId: number) {
    const sp = await this.repo.findOneBy({ sessionId, memberId });
    if (!sp) throw new NotFoundException('Peserta tidak ditemukan pada sesi ini');
    return sp;
  }

  async updateStatus(sessionId: number, memberId: number, status: ParticipantStatus) {
    const sp = await this.findParticipant(sessionId, memberId);
    if (sp.status === 'cancelled' && status !== 'cancelled')
      throw new ConflictException('Pendaftaran yang dibatalkan harus didaftarkan ulang lewat POST');
    sp.status = status;
    return this.repo.save(sp);
  }

  async cancel(sessionId: number, memberId: number) {
    const sp = await this.findParticipant(sessionId, memberId);
    sp.status = 'cancelled';
    return { message: 'Pendaftaran dibatalkan', ...(await this.repo.save(sp)) };
  }
}
