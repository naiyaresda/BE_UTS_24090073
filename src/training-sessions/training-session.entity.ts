import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Trainer } from '../trainers/trainer.entity';
import { SessionParticipant } from './session-participant.entity';

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled';

@Entity('training_sessions')
export class TrainingSession {
  @PrimaryGeneratedColumn() id: number;
  @Column() trainerId: number;
  @Column() title: string;
  @Column({ type: 'varchar', nullable: true }) description: string | null;
  @Column({ type: 'varchar' }) startTime: string; // ISO 8601 (UTC)
  @Column({ type: 'varchar' }) endTime: string; // ISO 8601 (UTC)
  @Column({ type: 'integer' }) capacity: number;
  @Column({ type: 'varchar', default: 'scheduled' }) status: SessionStatus;
  @CreateDateColumn() createdAt: Date;

  @ManyToOne(() => Trainer, (t) => t.sessions, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'trainerId' })
  trainer: Trainer;

  @OneToMany(() => SessionParticipant, (p) => p.session) participants: SessionParticipant[];
}
