import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrainingSession } from './training-session.entity';
import { SessionParticipant } from './session-participant.entity';
import { Trainer } from '../trainers/trainer.entity';
import { Member } from '../members/member.entity';
import { Membership } from '../memberships/membership.entity';
import { TrainingSessionsController } from './training-sessions.controller';
import { TrainingSessionsService } from './training-sessions.service';
import { SessionParticipantsService } from './session-participants.service';

@Module({
  imports: [TypeOrmModule.forFeature([TrainingSession, SessionParticipant, Trainer, Member, Membership])],
  controllers: [TrainingSessionsController],
  providers: [TrainingSessionsService, SessionParticipantsService],
})
export class TrainingSessionsModule {}
