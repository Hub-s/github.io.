CREATE TABLE `assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`assessmentDate` timestamp NOT NULL DEFAULT (now()),
	`weight` decimal(5,2),
	`height` decimal(5,2),
	`bodyFatPercentage` decimal(5,2),
	`muscleMass` decimal(5,2),
	`chest` decimal(5,2),
	`waist` decimal(5,2),
	`hips` decimal(5,2),
	`rightArm` decimal(5,2),
	`leftArm` decimal(5,2),
	`rightThigh` decimal(5,2),
	`leftThigh` decimal(5,2),
	`rightCalf` decimal(5,2),
	`leftCalf` decimal(5,2),
	`bmi` decimal(5,2),
	`notes` text,
	`assessorName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assessments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `checkIns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`checkInTime` timestamp NOT NULL DEFAULT (now()),
	`checkOutTime` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `checkIns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`cpf` varchar(14),
	`birthDate` date,
	`gender` enum('male','female','other'),
	`address` text,
	`emergencyContact` varchar(255),
	`emergencyPhone` varchar(20),
	`photoUrl` text,
	`status` enum('active','inactive','defaulter') NOT NULL DEFAULT 'active',
	`planType` enum('monthly','quarterly','semiannual','annual') DEFAULT 'monthly',
	`planValue` decimal(10,2),
	`planStartDate` date,
	`planEndDate` date,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`memberId` int NOT NULL,
	`amount` decimal(10,2) NOT NULL,
	`paymentDate` timestamp NOT NULL DEFAULT (now()),
	`dueDate` date,
	`referenceMonth` varchar(7),
	`paymentMethod` enum('cash','credit_card','debit_card','pix','bank_transfer','stripe') DEFAULT 'cash',
	`status` enum('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
	`stripePaymentId` varchar(255),
	`stripeSubscriptionId` varchar(255),
	`description` text,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
