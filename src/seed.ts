import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { Member } from './members/member.entity';
import { Trainer } from './trainers/trainer.entity';
import { MembershipPlan } from './membership-plans/membership-plan.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const ds = app.get(DataSource);
  await ds.getRepository(MembershipPlan).save([
    { name: 'Harian', description: 'Akses 1 hari', price: 30000, durationDays: 1 },
    { name: 'Bulanan', description: 'Akses 30 hari', price: 250000, durationDays: 30 },
    { name: 'Tahunan', description: 'Akses 365 hari', price: 2400000, durationDays: 365 },
  ]);
  await ds.getRepository(Member).save([
    { name: 'Budi Santoso', email: 'budi@mail.com', phone: '08123456789', gender: 'male' },
    { name: 'Siti Aminah', email: 'siti@mail.com', phone: '08129876543', gender: 'female' },
  ]);
  await ds.getRepository(Trainer).save([
    { name: 'Coach Andi', email: 'andi@gym.com', specialization: 'Strength' },
    { name: 'Coach Rina', email: 'rina@gym.com', specialization: 'Yoga' },
  ]);
  console.log('Seed selesai');
  await app.close();
}
seed();
