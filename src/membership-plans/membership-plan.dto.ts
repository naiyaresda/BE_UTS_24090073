import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateMembershipPlanDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsInt({ message: 'price harus bilangan bulat >= 0' }) @Min(0) price: number;
  @IsInt({ message: 'durationDays harus bilangan bulat > 0' }) @Min(1) durationDays: number;
}

export class UpdateMembershipPlanDto extends PartialType(CreateMembershipPlanDto) {
  @IsOptional() @IsBoolean() isActive?: boolean;
}
