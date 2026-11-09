import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { CreateMembershipDto } from './membership.dto';

@Controller('memberships')
export class MembershipsController {
  constructor(private readonly service: MembershipsService) {}

  @Post() create(@Body() dto: CreateMembershipDto) { return this.service.create(dto); }

  @Get()
  findAll(@Query('memberId') memberId?: string, @Query('planId') planId?: string, @Query('status') status?: string) {
    return this.service.findAll({ memberId: memberId ? +memberId : undefined, planId: planId ? +planId : undefined, status });
  }

  @Get(':id') detail(@Param('id', ParseIntPipe) id: number) { return this.service.detail(id); }
  @Patch(':id/cancel') cancel(@Param('id', ParseIntPipe) id: number) { return this.service.cancel(id); }
}
