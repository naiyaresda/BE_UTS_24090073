import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { TrainersService } from './trainers.service';
import { CreateTrainerDto, UpdateTrainerDto } from './trainer.dto';

@Controller('trainers')
export class TrainersController {
  constructor(private readonly service: TrainersService) {}

  @Post() create(@Body() dto: CreateTrainerDto) { return this.service.create(dto); }
  @Get() findAll(@Query('status') status?: string) { return this.service.findAll(status); }
  @Get(':id') findOne(@Param('id', ParseIntPipe) id: number) { return this.service.findOne(id); }
  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTrainerDto) { return this.service.update(id, dto); }
  @Delete(':id') @HttpCode(204) remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
  @Get(':id/sessions') sessions(@Param('id', ParseIntPipe) id: number) { return this.service.sessions(id); }
}
