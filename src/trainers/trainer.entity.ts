import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TrainingSession } from '../training-sessions/training-session.entity';

@Entity('trainers')
export class Trainer {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column({ unique: true }) email: string;
  @Column({ type: 'varchar', nullable: true }) phone: string | null;
  @Column({ type: 'varchar', nullable: true }) specialization: string | null;
  @Column({ type: 'varchar', default: 'active' }) status: 'active' | 'inactive';
  @CreateDateColumn() createdAt: Date;

  @OneToMany(() => TrainingSession, (s) => s.trainer) sessions: TrainingSession[];
}
