import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { MembersModule } from './members/members.module';
import { TrainersModule } from './trainers/trainers.module';
import { MembershipPlansModule } from './membership-plans/membership-plans.module';
import { MembershipsModule } from './memberships/memberships.module';
import { TrainingSessionsModule } from './training-sessions/training-sessions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // membaca file .env
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => databaseConfig(config),
    }),
    MembersModule,
    TrainersModule,
    MembershipPlansModule,
    MembershipsModule,
    TrainingSessionsModule,
  ],
})
export class AppModule {}
