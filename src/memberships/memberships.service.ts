import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Membership } from './membership.entity';
import { Member } from '../members/member.entity';
import { MembershipPlan } from '../membership-plans/membership-plan.entity';
import { CreateMembershipDto } from './membership.dto';
import { addDays, today } from '../common/date.util';

export type MembershipStatus = 'upcoming' | 'active' | 'expired' | 'cancelled';

/** Status keanggotaan dihitung dinamis dari tanggal & flag cancelled. */
export const withStatus = <T extends Membership>(m: T) => {
  const t = today();
  let status: MembershipStatus = 'active';
  if (m.cancelled) status = 'cancelled';
  else if (t > m.endDate) status = 'expired';
  else if (t < m.startDate) status = 'upcoming';
  const { cancelled, ...rest } = m as any;
  return { ...rest, status } as Omit<T, 'cancelled'> & { status: MembershipStatus };
};

@Injectable()
export class MembershipsService {
  constructor(
    @InjectRepository(Membership) private repo: Repository<Membership>,
    @InjectRepository(Member) private memberRepo: Repository<Member>,
    @InjectRepository(MembershipPlan) private planRepo: Repository<MembershipPlan>,
  ) {}

  async create(dto: CreateMembershipDto) {
    const member = await this.memberRepo.findOneBy({ id: dto.memberId });
    if (!member) throw new NotFoundException(`Anggota dengan id ${dto.memberId} tidak ditemukan`);
    const plan = await this.planRepo.findOneBy({ id: dto.planId });
    if (!plan) throw new NotFoundException(`Paket dengan id ${dto.planId} tidak ditemukan`);
    if (member.status !== 'active') throw new ConflictException('Anggota tidak aktif');
    if (!plan.isActive) throw new ConflictException('Paket keanggotaan tidak aktif');

    const start = dto.startDate ?? today();
    if (isNaN(new Date(start).getTime())) throw new BadRequestException('startDate tidak valid');
    const end = addDays(start, plan.durationDays);

    // Aturan: periode tidak boleh overlap dengan keanggotaan lain (yang belum dibatalkan)
    const overlap = await this.repo
      .createQueryBuilder('ms')
      .where('ms.memberId = :mid AND ms.cancelled = 0', { mid: member.id })
      .andWhere('ms.startDate <= :end AND ms.endDate >= :start', { start, end })
      .getOne();
    if (overlap) throw new ConflictException(`Periode bentrok dengan keanggotaan #${overlap.id}`);

    const saved = await this.repo.save(
      this.repo.create({ memberId: member.id, planId: plan.id, startDate: start, endDate: end, pricePaid: plan.price }),
    );
    return withStatus(saved);
  }

  async findAll(f: { memberId?: number; planId?: number; status?: string }) {
    const where: any = {};
    if (f.memberId) where.memberId = f.memberId;
    if (f.planId) where.planId = f.planId;
    let rows = (
      await this.repo.find({ where, relations: { member: true, plan: true }, order: { id: 'ASC' } })
    ).map((r) => ({ ...withStatus(r), memberName: r.member.name, planName: r.plan.name, member: undefined, plan: undefined }));
    if (f.status) rows = rows.filter((r) => r.status === f.status);
    return rows;
  }

  async findOne(id: number) {
    const m = await this.repo.findOneBy({ id });
    if (!m) throw new NotFoundException(`Keanggotaan dengan id ${id} tidak ditemukan`);
    return m;
  }

  async detail(id: number) {
    return withStatus(await this.findOne(id));
  }

  async cancel(id: number) {
    const m = await this.findOne(id);
    if (m.cancelled) throw new ConflictException('Keanggotaan sudah dibatalkan');
    m.cancelled = true;
    return withStatus(await this.repo.save(m));
  }
}
