CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`kind` text NOT NULL,
	`starts_at` text NOT NULL,
	`location` text,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `appointments_application_id_idx` ON `appointments` (`application_id`);--> statement-breakpoint
CREATE INDEX `appointments_starts_at_idx` ON `appointments` (`starts_at`);--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`name` text NOT NULL,
	`role` text,
	`email` text,
	`phone` text,
	`linkedin_url` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `contacts_application_id_idx` ON `contacts` (`application_id`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notes_application_id_idx` ON `notes` (`application_id`);--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `applications` ADD `work_mode` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `priority` text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `applications` ADD `source` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `job_url` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `salary_min` integer;--> statement-breakpoint
ALTER TABLE `applications` ADD `salary_max` integer;--> statement-breakpoint
-- Datenmigration (von Hand ergänzt): Status „sent“ heißt seit der erweiterten Pipeline „applied“
UPDATE `applications` SET `status` = 'applied' WHERE `status` = 'sent';--> statement-breakpoint
UPDATE `status_events` SET `from_status` = 'applied' WHERE `from_status` = 'sent';--> statement-breakpoint
UPDATE `status_events` SET `to_status` = 'applied' WHERE `to_status` = 'sent';
