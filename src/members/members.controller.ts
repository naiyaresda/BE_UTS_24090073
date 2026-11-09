import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto } from './member.dto';

@Controller('members')
export class MembersController {
  constructor(private readonly service: MembersService) {}

  @Post() create(@Body() dto: CreateMemberDto) { return this.service.create(dto); }
  @Get() findAll(@Query('status') status?: string, @Query('q') q?: string) { return this.service.findAll(status, q); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMemberDto) { return this.service.update(id, dto); }
  @Delete(':id') @HttpCode(204) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

  @Get(':id/membership-status')
  membershipStatus(@Param('id', ParseIntPipe) id: number) { return this.service.membershipStatus(id); }

  @Get(':id/schedule')
  schedule(@Param('id', ParseIntPipe) id: number, @Query('upcoming') upcoming?: string) {
    return this.service.schedule(id, upcoming === 'true');
  }
}
