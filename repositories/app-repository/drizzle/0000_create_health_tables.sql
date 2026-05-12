CREATE TABLE `alert_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`anomaly_type` text NOT NULL,
	`threshold_config` text,
	`enabled` integer DEFAULT 1 NOT NULL,
	`cooldown_seconds` integer DEFAULT 300 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`anomaly_type` text NOT NULL,
	`model` text,
	`severity` text NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`detected_at` integer NOT NULL,
	`acknowledged_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `model_health_checks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model_name` text NOT NULL,
	`status` text NOT NULL,
	`response_time_ms` integer,
	`ttft_ms` integer,
	`output_tokens` integer,
	`tokens_per_second` real,
	`status_code` integer,
	`prompt_sent` text NOT NULL,
	`response_received` text,
	`request_payload` text,
	`response_payload` text,
	`error_message` text,
	`source` text DEFAULT 'scheduled' NOT NULL,
	`checked_at` integer NOT NULL
);
