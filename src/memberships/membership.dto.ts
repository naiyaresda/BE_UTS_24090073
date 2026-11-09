import { IsInt, IsOptional, Matches, Min } from 'class-validator';
import { DATE_REGEX } from '../common/date.util';

export class CreateMembershipDto {
  @IsInt() @Min(1) memberId: number;
  @IsInt() @Min(1) planId: number;
  @IsOptional() @Matches(DATE_REGEX, { message: 'startDate harus YYYY-MM-DD' }) startDate?: string;
}
