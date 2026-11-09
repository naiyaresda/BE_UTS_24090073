import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trainer } from './trainer.entity';
import { CreateTrainerDto, UpdateTrainerDto } from './trainer.dto';
import { TrainingSession } from '../training-sessions/training-session.entity';

@Injectable()
export class TrainersService {
  constructor(
    @InjectRepository(Trainer) private repo: Repository<Trainer>,
    @InjectRepository(TrainingSession) private sessionRepo: Repository<TrainingSession>,
  ) {}

  create(dto: CreateTrainerDto) { return this.repo.save(this.repo.create(dto)); }
  findAll(status?: string) { return this.repo.find({ where: status ? { status: status as any } : {}, order: { id: 'ASC' } }); }

  async findOne(id: number) {
    const t = await this.repo.findOneBy({ id });
    if (!t) throw new NotFoundException(`Pelatih dengan id ${id} tidak ditemukan`);
    return t;
  }
  async update(id: number, dto: UpdateTrainerDto) { return this.repo.save(Object.assign(await this.findOne(id), dto)); }
  async remove(id: number) { await this.repo.remove(await this.findOne(id)); }

  async sessions(id: number) {
    await this.findOne(id);
    return this.sessionRepo.find({ where: { trainerId: id }, order: { startTime: 'ASC' } });
  }
}
