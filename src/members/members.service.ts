import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Member } from './member.entity';
import { CreateMemberDto, UpdateMemberDto } from './member.dto';
import { Membership } from '../memberships/membership.entity';
import { SessionParticipant } from '../training-sessions/session-participant.entity';
import { withStatus } from '../memberships/memberships.service';
import { today } from '../common/date.util';

@Injectable()
export class MembersService {
  constructor(
    @InjectRepository(Member) private repo: Repository<Member>,
    @InjectRepository(Membership) private msRepo: Repository<Membership>,
    @InjectRepository(SessionParticipant) private spRepo: Repository<SessionParticipant>,
  ) {}

  create(dto: CreateMemberDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll(status?: string, q?: string) {
    const where: any[] = [];
    const base: any = status ? { status } : {};
    if (q) {
      where.push({ ...base, name: Like(`%${q}%`) }, { ...base, email: Like(`%${q}%`) });
    } else where.push(base);
    return this.repo.find({ where, order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const m = await this.repo.findOneBy({ id });
    if (!m) throw new NotFoundException(`Anggota dengan id ${id} tidak ditemukan`);
    return m;
  }

  async update(id: number, dto: UpdateMemberDto) {
    const m = await this.findOne(id);
    return this.repo.save(Object.assign(m, dto));
  }

  async remove(id: number) {
    const m = await this.findOne(id);
    await this.repo.remove(m);
  }

  /** Status keanggotaan + riwayat */
  async membershipStatus(id: number) {
    const member = await this.findOne(id);
    const rows = (
      await this.msRepo.find({ where: { memberId: id }, relations: { plan: true }, order: { startDate: 'DESC' } })
    ).map((r) => ({ ...withStatus(r), planName: r.plan.name, plan: undefined }));
    const current = rows.find((r) => r.status === 'active') ?? null;
    return {
      member,
      hasActiveMembership: !!current,
      currentMembership: current,
      daysRemaining: current
        ? Math.ceil((new Date(current.endDate).getTime() - new Date(today()).getTime()) / 86400000)
        : 0,
      history: rows,
    };
  }

  /** Jadwal latihan milik anggota */
  async schedule(id: number, upcomingOnly = false) {
    await this.findOne(id);
    const qb = this.spRepo
      .createQueryBuilder('sp')
      .innerJoinAndSelect('sp.session', 's')
      .innerJoinAndSelect('s.trainer', 't')
      .where('sp.memberId = :id', { id })
      .andWhere("sp.status != 'cancelled'")
      .orderBy('s.startTime', 'ASC');
    if (upcomingOnly) qb.andWhere('s.startTime >= :now', { now: new Date().toISOString() });
    const rows = await qb.getMany();
    return rows.map((sp) => ({
      sessionId: sp.session.id,
      title: sp.session.title,
      startTime: sp.session.startTime,
      endTime: sp.session.endTime,
      sessionStatus: sp.session.status,
      trainerName: sp.session.trainer.name,
      registrationStatus: sp.status,
    }));
  }
}
