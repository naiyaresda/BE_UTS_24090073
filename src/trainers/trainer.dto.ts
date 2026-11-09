import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTrainerDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail({}, { message: 'Format email tidak valid' }) email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() specialization?: string;
}

export class UpdateTrainerDto extends PartialType(CreateTrainerDto) {
  @IsOptional() @IsIn(['active', 'inactive']) status?: 'active' | 'inactive';
}
