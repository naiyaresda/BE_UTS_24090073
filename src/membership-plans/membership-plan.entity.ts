import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Membership } from '../memberships/membership.entity';

@Entity('membership_plans')
export class MembershipPlan {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) name: string;
  @Column({ type: 'varchar', nullable: true }) description: string | null;
  @Column({ type: 'integer' }) price: number;
  @Column({ type: 'integer' }) durationDays: number;
  @Column({ default: true }) isActive: boolean;
  @CreateDateColumn() createdAt: Date;

  @OneToMany(() => Membership, (m) => m.plan) memberships: Membership[];
}
