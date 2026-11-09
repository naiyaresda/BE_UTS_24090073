import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from './membership.entity';
import { Member } from '../members/member.entity';
import { MembershipPlan } from '../membership-plans/membership-plan.entity';
import { MembershipsController } from './memberships.controller';
import { MembershipsService } from './memberships.service';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, Member, MembershipPlan])],
  controllers: [MembershipsController],
  providers: [MembershipsService],
})
export class MembershipsModule {}
