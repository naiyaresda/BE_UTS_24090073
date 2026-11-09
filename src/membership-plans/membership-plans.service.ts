import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipPlan } from './membership-plan.entity';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './membership-plan.dto';

@Injectable()
export class MembershipPlansService {
  constructor(@InjectRepository(MembershipPlan) private repo: Repository<MembershipPlan>) {}

  create(dto: CreateMembershipPlanDto) { return this.repo.save(this.repo.create(dto)); }
  findAll(activeOnly = false) {
    return this.repo.find({ where: activeOnly ? { isActive: true } : {}, order: { price: 'ASC' } });
  }
  async findOne(id: number) {
    const p = await this.repo.findOneBy({ id });
    if (!p) throw new NotFoundException(`Paket dengan id ${id} tidak ditemukan`);
    return p;
  }
  async update(id: number, dto: UpdateMembershipPlanDto) { return this.repo.save(Object.assign(await this.findOne(id), dto)); }
  async remove(id: number) { await this.repo.remove(await this.findOne(id)); }
}
