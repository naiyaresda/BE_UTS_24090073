-- Skema database gym_db (MySQL 8) — dihasilkan dari entity TypeORM.
-- Tabel dibuat otomatis saat app dijalankan (DB_SYNCHRONIZE=true); file ini hanya sebagai referensi/alternatif manual.
CREATE DATABASE IF NOT EXISTS gym_db CHARACTER SET utf8mb4;
USE gym_db;

CREATE TABLE `members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `birthDate` varchar(255) DEFAULT NULL,
  `gender` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_2714af51e3f7dd42cf66eeb08d` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `membership_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `price` int NOT NULL,
  `durationDays` int NOT NULL,
  `isActive` tinyint NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_9ffb17ec0acbcfcc0d60ddfcb1` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `memberships` (
  `id` int NOT NULL AUTO_INCREMENT,
  `memberId` int NOT NULL,
  `planId` int NOT NULL,
  `startDate` varchar(255) NOT NULL,
  `endDate` varchar(255) NOT NULL,
  `pricePaid` int NOT NULL,
  `cancelled` tinyint NOT NULL DEFAULT '0',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_7f19cccf4f2340adba6107a62cc` (`memberId`),
  KEY `FK_5088acebaddd7b00e3c1b775de1` (`planId`),
  CONSTRAINT `FK_5088acebaddd7b00e3c1b775de1` FOREIGN KEY (`planId`) REFERENCES `membership_plans` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_7f19cccf4f2340adba6107a62cc` FOREIGN KEY (`memberId`) REFERENCES `members` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `session_participants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sessionId` int NOT NULL,
  `memberId` int NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'registered',
  `registeredAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_36c93a53fda6df81974e5f5082` (`sessionId`,`memberId`),
  KEY `FK_a3fef9a83337c56058eb795c802` (`memberId`),
  CONSTRAINT `FK_405fbf7474a2df8d2131619ad1d` FOREIGN KEY (`sessionId`) REFERENCES `training_sessions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_a3fef9a83337c56058eb795c802` FOREIGN KEY (`memberId`) REFERENCES `members` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `trainers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `specialization` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'active',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_f8ac7db7ae932e9e2bb7de0e46` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE `training_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `trainerId` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `startTime` varchar(255) NOT NULL,
  `endTime` varchar(255) NOT NULL,
  `capacity` int NOT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'scheduled',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `FK_a442fdf16170da743c7ab89de1e` (`trainerId`),
  CONSTRAINT `FK_a442fdf16170da743c7ab89de1e` FOREIGN KEY (`trainerId`) REFERENCES `trainers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
