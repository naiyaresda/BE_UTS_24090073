import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsInt, IsISO8601, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { PARTICIPANT_STATUSES } from './session-participant.entity';

export class CreateTrainingSessionDto {
  @IsInt() @Min(1) trainerId: number;
  @IsString() @IsNotEmpty() title: string;
  @IsOptional() @IsString() description?: string;
  @IsISO8601({}, { message: 'startTime harus format ISO 8601' }) startTime: string;
  @IsISO8601({}, { message: 'endTime harus format ISO 8601' }) endTime: string;
  @IsInt({ message: 'capacity harus bilangan bulat > 0' }) @Min(1) capacity: number;
}

export class UpdateTrainingSessionDto extends PartialType(CreateTrainingSessionDto) {
  @IsOptional() @IsIn(['scheduled', 'completed', 'cancelled']) status?: 'scheduled' | 'completed' | 'cancelled';
}

export class RegisterParticipantDto {
  @IsInt() @Min(1) memberId: number;
}

export class UpdateParticipantStatusDto {
  @IsIn(PARTICIPANT_STATUSES, { message: `status harus salah satu: ${PARTICIPANT_STATUSES.join(', ')}` })
  status: 'registered' | 'attended' | 'absent' | 'cancelled';
}
