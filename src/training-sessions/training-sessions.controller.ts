import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { TrainingSessionsService } from './training-sessions.service';
import { SessionParticipantsService } from './session-participants.service';
import { CreateTrainingSessionDto, RegisterParticipantDto, UpdateParticipantStatusDto, UpdateTrainingSessionDto } from './training-session.dto';

@Controller()
export class TrainingSessionsController {
  constructor(
    private readonly service: TrainingSessionsService,
    private readonly participants: SessionParticipantsService,
  ) {}

  // ---- Sesi latihan ----
  @Post('training-sessions') create(@Body() dto: CreateTrainingSessionDto) { return this.service.create(dto); }

  @Get('training-sessions')
  findAll(@Query('trainerId') trainerId?: string, @Query('status') status?: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.service.findAll({ trainerId: trainerId ? +trainerId : undefined, status, from, to });
  }

  @Get('schedule') schedule() { return this.service.upcomingSchedule(); }

  @Get('training-sessions/:id') detail(@Param('id', ParseIntPipe) id: number) { return this.service.detail(id); }
  @Put('training-sessions/:id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTrainingSessionDto) { return this.service.update(id, dto); }
  @Delete('training-sessions/:id') @HttpCode(204) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

  // ---- Peserta sesi ----
  @Post('training-sessions/:id/participants')
  register(@Param('id', ParseIntPipe) id: number, @Body() dto: RegisterParticipantDto) { return this.participants.register(id, dto.memberId); }

  @Get('training-sessions/:id/participants')
  listParticipants(@Param('id', ParseIntPipe) id: number) { return this.participants.list(id); }

  @Patch('training-sessions/:id/participants/:memberId')
  updateParticipant(@Param('id', ParseIntPipe) id: number, @Param('memberId', ParseIntPipe) memberId: number, @Body() dto: UpdateParticipantStatusDto) {
    return this.participants.updateStatus(id, memberId, dto.status);
  }

  @Delete('training-sessions/:id/participants/:memberId')
  cancelParticipant(@Param('id', ParseIntPipe) id: number, @Param('memberId', ParseIntPipe) memberId: number) {
    return this.participants.cancel(id, memberId);
  }
}
