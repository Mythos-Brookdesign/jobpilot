CREATE TABLE `reminders` (
	`key` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`kind` text NOT NULL,
	`due_at` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`done_at` text,
	`snoozed_until` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reminders_application_id_idx` ON `reminders` (`application_id`);--> statement-breakpoint
CREATE INDEX `reminders_due_at_idx` ON `reminders` (`due_at`);