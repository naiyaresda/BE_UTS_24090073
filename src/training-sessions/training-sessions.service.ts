import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TrainingSession } from './training-session.entity';
import { SessionParticipant } from './session-participant.entity';
import { Trainer } from '../trainers/trainer.entity';
import { CreateTrainingSessionDto, UpdateTrainingSessionDto } from './training-session.dto';
import { toISO } from '../common/date.util';

const ACTIVE = ['registered', 'attended'];

@Injectable()
export class TrainingSessionsService {
  constructor(
    @InjectRepository(TrainingSession) private repo: Repository<TrainingSession>,
    @InjectRepository(Trainer) private trainerRepo: Repository<Trainer>,
    @InjectRepository(SessionParticipant) private spRepo: Repository<SessionParticipant>,
  ) {}

  private async trainerBusy(trainerId: number, start: string, end: string, excludeId = 0) {
    return this.repo
      .createQueryBuilder('s')
      .where("s.trainerId = :trainerId AND s.status != 'cancelled' AND s.id != :excludeId", { trainerId, excludeId })
      .andWhere('s.startTime < :end AND s.endTime > :start', { start, end })
      .getOne();
  }

  /** Tambahkan participantCount & availableSlots ke setiap sesi. */
  private async decorate(sessions: TrainingSession[]) {
    if (!sessions.length) return [];
    const counts = await this.spRepo
      .createQueryBuilder('sp')
      .select('sp.sessionId', 'sessionId')
      .addSelect('COUNT(*)', 'cnt')
      .where('sp.sessionId IN (:...ids) AND sp.status IN (:...st)', { ids: sessions.map((s) => s.id), st: ACTIVE })
      .groupBy('sp.sessionId')
      .getRawMany();
    const map = new Map(counts.map((c) => [Number(c.sessionId), Number(c.cnt)]));
    return sessions.map((s) => {
      const participantCount = map.get(s.id) ?? 0;
      return {
        ...s,
        trainerName: s.trainer?.name,
        trainer: undefined,
        participantCount,
        availableSlots: Math.max(0, s.capacity - participantCount),
      };
    });
  }

  async create(dto: CreateTrainingSessionDto) {
    const trainer = await this.trainerRepo.findOneBy({ id: dto.trainerId });
    if (!trainer) throw new NotFoundException(`Pelatih dengan id ${dto.trainerId} tidak ditemukan`);
    if (trainer.status !== 'active') throw new ConflictException('Pelatih tidak aktif');
    const start = toISO(dto.startTime)!, end = toISO(dto.endTime)!;
    if (end <= start) throw new BadRequestException('endTime harus setelah startTime');
    const busy = await this.trainerBusy(trainer.id, start, end);
    if (busy) throw new ConflictException(`Pelatih sudah punya sesi #${busy.id} pada waktu tersebut`);
    const saved = await this.repo.save(
      this.repo.create({ trainerId: trainer.id, title: dto.title, description: dto.description ?? null, startTime: start, endTime: end, capacity: dto.capacity }),
    );
    return this.detail(saved.id);
  }

  async findAll(f: { trainerId?: number; status?: string; from?: string; to?: string }) {
    const qb = this.repo.createQueryBuilder('s').leftJoinAndSelect('s.trainer', 't').orderBy('s.startTime', 'ASC');
    if (f.trainerId) qb.andWhere('s.trainerId = :tid', { tid: f.trainerId });
    if (f.status) qb.andWhere('s.status = :st', { st: f.status });
    if (f.from) qb.andWhere('s.startTime >= :from', { from: toISO(f.from) ?? f.from });
    if (f.to) qb.andWhere('s.startTime <= :to', { to: toISO(f.to) ?? f.to });
    return this.decorate(await qb.getMany());
  }

  /** Jadwal latihan mendatang (status scheduled) + sisa slot */
  async upcomingSchedule() {
    const rows = await this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.trainer', 't')
      .where("s.status = 'scheduled' AND s.startTime >= :now", { now: new Date().toISOString() })
      .orderBy('s.startTime', 'ASC')
      .getMany();
    return this.decorate(rows);
  }

  async findOne(id: number) {
    const s = await this.repo.findOne({ where: { id }, relations: { trainer: true } });
    if (!s) throw new NotFoundException(`Sesi dengan id ${id} tidak ditemukan`);
    return s;
  }

  async detail(id: number) {
    return (await this.decorate([await this.findOne(id)]))[0];
  }

  async update(id: number, dto: UpdateTrainingSessionDto) {
    const s = await this.findOne(id);
    const start = dto.startTime ? toISO(dto.startTime)! : s.startTime;
    const end = dto.endTime ? toISO(dto.endTime)! : s.endTime;
    const trainerId = dto.trainerId ?? s.trainerId;
    if (end <= start) throw new BadRequestException('endTime harus setelah startTime');
    if (dto.trainerId && !(await this.trainerRepo.findOneBy({ id: dto.trainerId })))
      throw new NotFoundException(`Pelatih dengan id ${dto.trainerId} tidak ditemukan`);
    if (dto.capacity !== undefined) {
      const cnt = await this.spRepo.count({ where: { sessionId: id, status: In(ACTIVE as any) } });
      if (dto.capacity < cnt) throw new ConflictException(`Kapasitas tidak boleh di bawah jumlah peserta saat ini (${cnt})`);
    }
    if (await this.trainerBusy(trainerId, start, end, id)) throw new ConflictException('Pelatih bentrok dengan sesi lain');
    const { trainer, ...plain } = s as any;
    await this.repo.save({ ...plain, ...dto, startTime: start, endTime: end });
    return this.detail(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id); // FK RESTRICT -> 409 bila masih punya peserta
  }
}
