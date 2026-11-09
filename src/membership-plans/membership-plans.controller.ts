import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { MembershipPlansService } from './membership-plans.service';
import { CreateMembershipPlanDto, UpdateMembershipPlanDto } from './membership-plan.dto';

@Controller('membership-plans')
export class MembershipPlansController {
  constructor(private readonly service: MembershipPlansService) {}

  @Post() create(@Body() dto: CreateMembershipPlanDto) { return this.service.create(dto); }
  @Get() findAll(@Query('active') active?: string) { return this.service.findAll(active === 'true'); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMembershipPlanDto) { return this.service.update(id, dto); }
  @Delete(':id') @HttpCode(204) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
