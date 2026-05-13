CREATE TABLE `absences` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`moniteur_id` text,
	`date_abs` text NOT NULL,
	`duree_h` real DEFAULT 4,
	`motif` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`moniteur_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text,
	`user_nom` text,
	`user_role` text,
	`action` text NOT NULL,
	`table_name` text,
	`record_id` text,
	`details` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`eleve_id` text,
	`moniteur_id` text,
	`h` text NOT NULL,
	`d` integer NOT NULL,
	`t` text,
	`dur` real DEFAULT 1,
	`lieu` text,
	`comment` text,
	`is_deleted` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`eleve_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`moniteur_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `lieux` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`moniteur_id` text,
	`nom` text NOT NULL,
	`adresse` text,
	`actif` integer DEFAULT true,
	FOREIGN KEY (`moniteur_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notations` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`eleve_id` text,
	`moniteur_id` text,
	`stars` integer NOT NULL,
	`commentaire` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`eleve_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`moniteur_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notes_priv` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`moniteur_id` text,
	`eleve_id` text,
	`contenu` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`moniteur_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`eleve_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`user_id` text,
	`type` text DEFAULT 'info',
	`title` text NOT NULL,
	`body` text,
	`read` integer DEFAULT false,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`auth_id` text,
	`role` text NOT NULL,
	`nom` text NOT NULL,
	`email` text,
	`tel` text,
	`plaque` text,
	`max_heures` integer DEFAULT 35,
	`neph` text,
	`dob` text,
	`forfait_h` integer DEFAULT 20,
	`statut` text DEFAULT 'Actif',
	`code_statut` text DEFAULT 'En cours',
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_auth_id_unique` ON `profiles` (`auth_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_email_unique` ON `profiles` (`email`);--> statement-breakpoint
CREATE TABLE `remc_entries` (
	`id` text PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))) NOT NULL,
	`eleve_id` text,
	`moniteur_id` text,
	`comp_id` text NOT NULL,
	`checked` integer DEFAULT false,
	`lv` text,
	`note` text,
	`validated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`eleve_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`moniteur_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
