import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Member } from '../members/member.entity';
import { Trainer } from '../trainers/trainer.entity';
import { MembershipPlan } from '../membership-plans/membership-plan.entity';
import { Membership } from '../memberships/membership.entity';
import { TrainingSession } from '../training-sessions/training-session.entity';
import { SessionParticipant } from '../training-sessions/session-participant.entity';

export const ENTITIES = [Member, Trainer, MembershipPlan, Membership, TrainingSession, SessionParticipant];

/**
 * Konfigurasi database dibaca dari environment (.env).
 * Default: MySQL. DB_TYPE=sqlite hanya dipakai untuk tes otomatis (Jest) agar
 * tidak membutuhkan server MySQL.
 */
export function databaseConfig(config: ConfigService): TypeOrmModuleOptions {
  const synchronize = config.get<string>('DB_SYNCHRONIZE', 'true') === 'true';

  if (config.get<string>('DB_TYPE') === 'sqlite') {
    return { type: 'better-sqlite3', database: ':memory:', entities: ENTITIES, synchronize: true };
  }

  return {
    type: 'mysql',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: parseInt(config.get<string>('DB_PORT', '3306'), 10),
    username: config.get<string>('DB_USERNAME', 'root'),
    password: config.get<string>('DB_PASSWORD', ''),
    database: config.get<string>('DB_NAME', 'gym_db'),
    charset: 'utf8mb4',
    entities: ENTITIES,
    synchronize, // true = tabel dibuat/diperbarui otomatis dari entity
  };
}
