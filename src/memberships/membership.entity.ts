import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Member } from '../members/member.entity';
import { MembershipPlan } from '../membership-plans/membership-plan.entity';

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn() id: number;
  @Column() memberId: number;
  @Column() planId: number;
  @Column({ type: 'varchar' }) startDate: string; // YYYY-MM-DD
  @Column({ type: 'varchar' }) endDate: string; // YYYY-MM-DD
  @Column({ type: 'integer' }) pricePaid: number;
  @Column({ default: false }) cancelled: boolean;
  @CreateDateColumn() createdAt: Date;

  @ManyToOne(() => Member, (m) => m.memberships, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @ManyToOne(() => MembershipPlan, (p) => p.memberships, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'planId' })
  plan: MembershipPlan;
}
