import { PartialType } from '@nestjs/mapped-types';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { DATE_REGEX } from '../common/date.util';

export class CreateMemberDto {
  @IsString() @IsNotEmpty() name: string;
  @IsEmail({}, { message: 'Format email tidak valid' }) email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @Matches(DATE_REGEX, { message: 'birthDate harus YYYY-MM-DD' }) birthDate?: string;
  @IsOptional() @IsIn(['male', 'female']) gender?: 'male' | 'female';
}

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @IsOptional() @IsIn(['active', 'inactive']) status?: 'active' | 'inactive';
}
