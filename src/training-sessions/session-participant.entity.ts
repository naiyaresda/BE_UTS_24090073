import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, Unique } from 'typeorm';
import { Member } from '../members/member.entity';
import { TrainingSession } from './training-session.entity';

export type ParticipantStatus = 'registered' | 'attended' | 'absent' | 'cancelled';
export const PARTICIPANT_STATUSES: ParticipantStatus[] = ['registered', 'attended', 'absent', 'cancelled'];

@Entity('session_participants')
@Unique(['sessionId', 'memberId'])
export class SessionParticipant {
  @PrimaryGeneratedColumn() id: number;
  @Column() sessionId: number;
  @Column() memberId: number;
  @Column({ type: 'varchar', default: 'registered' }) status: ParticipantStatus;
  @CreateDateColumn() registeredAt: Date;

  @ManyToOne(() => TrainingSession, (s) => s.participants, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sessionId' })
  session: TrainingSession;

  @ManyToOne(() => Member, (m) => m.participations, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'memberId' })
  member: Member;
}
