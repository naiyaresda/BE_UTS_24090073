import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trainer } from './trainer.entity';
import { TrainingSession } from '../training-sessions/training-session.entity';
import { TrainersController } from './trainers.controller';
import { TrainersService } from './trainers.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trainer, TrainingSession])],
  controllers: [TrainersController],
  providers: [TrainersService],
})
export class TrainersModule {}
