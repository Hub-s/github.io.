CREATE TABLE `notificationPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`memberCreatedEmail` enum('true','false') NOT NULL DEFAULT 'true',
	`memberCreatedInApp` enum('true','false') NOT NULL DEFAULT 'true',
	`paymentReceivedEmail` enum('true','false') NOT NULL DEFAULT 'true',
	`paymentReceivedInApp` enum('true','false') NOT NULL DEFAULT 'true',
	`paymentOverdueEmail` enum('true','false') NOT NULL DEFAULT 'true',
	`paymentOverdueInApp` enum('true','false') NOT NULL DEFAULT 'true',
	`checkInEmail` enum('true','false') NOT NULL DEFAULT 'false',
	`checkInInApp` enum('true','false') NOT NULL DEFAULT 'true',
	`assessmentEmail` enum('true','false') NOT NULL DEFAULT 'false',
	`assessmentInApp` enum('true','false') NOT NULL DEFAULT 'true',
	`systemAlertEmail` enum('true','false') NOT NULL DEFAULT 'true',
	`systemAlertInApp` enum('true','false') NOT NULL DEFAULT 'true',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notificationPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notificationPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('member_created','member_updated','member_deleted','payment_received','payment_overdue','payment_pending','check_in','assessment_created','assessment_updated','system_alert','custom') NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`isRead` enum('true','false') NOT NULL DEFAULT 'false',
	`actionUrl` text,
	`priority` enum('low','normal','high','critical') NOT NULL DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`readAt` timestamp,
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
