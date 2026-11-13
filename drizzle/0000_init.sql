CREATE TABLE `athlete_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`coach_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`coach_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `athlete_profiles_coach_idx` ON `athlete_profiles` (`coach_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`invite_code` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_invite_code_idx` ON `users` (`invite_code`);--> statement-breakpoint
CREATE TABLE `v3_blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`name` text NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text NOT NULL,
	`review_points` text DEFAULT '[]' NOT NULL,
	`notes` text,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`athlete_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `v3_blocks_athlete_idx` ON `v3_blocks` (`athlete_id`,`start_date`);--> statement-breakpoint
CREATE TABLE `v3_categories` (
	`id` text PRIMARY KEY NOT NULL,
	`block_id` text NOT NULL,
	`position` integer NOT NULL,
	`name` text NOT NULL,
	`detail` text,
	FOREIGN KEY (`block_id`) REFERENCES `v3_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `v3_categories_block_idx` ON `v3_categories` (`block_id`,`position`);--> statement-breakpoint
CREATE TABLE `v3_check_in_trends` (
	`check_in_id` text NOT NULL,
	`category_id` text NOT NULL,
	`trend` text NOT NULL,
	`note` text,
	PRIMARY KEY(`check_in_id`, `category_id`),
	FOREIGN KEY (`check_in_id`) REFERENCES `v3_check_ins`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `v3_categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `v3_check_ins` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`block_id` text NOT NULL,
	`week_number` integer NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`coach_feedback` text,
	`coach_feedback_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`athlete_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`block_id`) REFERENCES `v3_blocks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `v3_check_ins_athlete_idx` ON `v3_check_ins` (`athlete_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `v3_check_ins_block_week_idx` ON `v3_check_ins` (`block_id`,`week_number`);--> statement-breakpoint
CREATE TABLE `v3_goal_steps` (
	`id` text PRIMARY KEY NOT NULL,
	`goal_id` text NOT NULL,
	`position` integer NOT NULL,
	`text` text NOT NULL,
	`done_at` integer,
	FOREIGN KEY (`goal_id`) REFERENCES `v3_goals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `v3_goal_steps_goal_idx` ON `v3_goal_steps` (`goal_id`,`position`);--> statement-breakpoint
CREATE TABLE `v3_goals` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`horizon` text NOT NULL,
	`title` text NOT NULL,
	`detail` text,
	`target_date` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`athlete_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `v3_goals_athlete_horizon_idx` ON `v3_goals` (`athlete_id`,`horizon`);--> statement-breakpoint
CREATE TABLE `v3_milestones` (
	`id` text PRIMARY KEY NOT NULL,
	`athlete_id` text NOT NULL,
	`date` text NOT NULL,
	`title` text NOT NULL,
	`detail` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`athlete_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `v3_milestones_athlete_idx` ON `v3_milestones` (`athlete_id`,`date`);--> statement-breakpoint
CREATE TABLE `v3_profiles` (
	`athlete_id` text PRIMARY KEY NOT NULL,
	`primary_archetype` text,
	`secondary_archetype` text,
	`contexts` text DEFAULT '[]' NOT NULL,
	`context_note` text,
	`updated_at` integer,
	`updated_by` text,
	FOREIGN KEY (`athlete_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
