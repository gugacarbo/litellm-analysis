CREATE TABLE `prompt_eval_run_artifacts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` text NOT NULL,
	`kind` text NOT NULL,
	`path` text NOT NULL,
	`summary_json` text,
	FOREIGN KEY (`run_id`) REFERENCES `prompt_eval_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prompt_eval_run_steps` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`run_id` text NOT NULL,
	`step` text NOT NULL,
	`status` text NOT NULL,
	`started_at` integer NOT NULL,
	`finished_at` integer,
	`message` text,
	`progress_pct` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`run_id`) REFERENCES `prompt_eval_runs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prompt_eval_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`model` text NOT NULL,
	`macro_f1` real,
	`threshold` real NOT NULL,
	`error` text,
	`started_at` integer NOT NULL,
	`finished_at` integer
);
