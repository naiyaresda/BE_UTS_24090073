import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Membership } from '../memberships/membership.entity';
import { SessionParticipant } from '../training-sessions/session-participant.entity';

export type MemberStatus = 'active' | 'inactive';
export type Gender = 'male' | 'female';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column({ unique: true }) email: string;
  @Column({ type: 'varchar', nullable: true }) phone: string | null;
  @Column({ type: 'varchar', nullable: true }) birthDate: string | null;
  @Column({ type: 'varchar', nullable: true }) gender: Gender | null;
  @Column({ type: 'varchar', default: 'active' }) status: MemberStatus;
  @CreateDateColumn() createdAt: Date;

  @OneToMany(() => Membership, (m) => m.member) memberships: Membership[];
  @OneToMany(() => SessionParticipant, (p) => p.member) participations: SessionParticipant[];
}
