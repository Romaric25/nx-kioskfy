CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`accountId` varchar(255) NOT NULL,
	`providerId` varchar(255) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` timestamp,
	`refreshTokenExpiresAt` timestamp,
	`scope` varchar(255),
	`password` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invitations` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`role` varchar(50),
	`teamId` varchar(36),
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`inviterId` varchar(36) NOT NULL,
	CONSTRAINT `invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `members` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`role` varchar(50) NOT NULL DEFAULT 'member',
	`createdAt` timestamp NOT NULL,
	CONSTRAINT `members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_role` (
	`id` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`role` varchar(50) NOT NULL,
	`permission` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `organization_role_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organizations` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`logo` text,
	`logoUploadId` int,
	`metadata` text,
	`email` varchar(255),
	`phone` varchar(20) NOT NULL,
	`pispiAlias` varchar(255),
	`newspaperPrice` decimal(10,2),
	`country` varchar(100) NOT NULL,
	`price` int,
	`suspended` boolean DEFAULT false,
	`suspendedReason` text,
	`suspendedUntil` timestamp,
	`address` text NOT NULL,
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp,
	CONSTRAINT `organizations_id` PRIMARY KEY(`id`),
	CONSTRAINT `organizations_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `organizations_email_unique` UNIQUE(`email`),
	CONSTRAINT `organizations_phone_unique` UNIQUE(`phone`),
	CONSTRAINT `organizations_slug_uidx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`token` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`userId` varchar(36) NOT NULL,
	`activeOrganizationId` varchar(36),
	`activeTeamId` varchar(36),
	`impersonatedBy` varchar(36),
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` varchar(36) NOT NULL,
	`teamId` varchar(36) NOT NULL,
	`userId` varchar(36) NOT NULL,
	`createdAt` timestamp,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL,
	`updatedAt` timestamp,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`emailVerified` boolean NOT NULL DEFAULT false,
	`image` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`role` varchar(50),
	`banned` boolean DEFAULT false,
	`banReason` text,
	`banExpires` timestamp,
	`phone` varchar(20),
	`lastName` varchar(255) NOT NULL,
	`isActive` boolean DEFAULT false,
	`typeUser` varchar(50) DEFAULT 'client',
	`address` text,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`),
	CONSTRAINT `users_phone_unique` UNIQUE(`phone`)
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` varchar(36) NOT NULL,
	`identifier` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`icon` varchar(255) NOT NULL,
	`color` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`flag` varchar(255) NOT NULL,
	`currency` varchar(255) NOT NULL,
	`code` varchar(255) NOT NULL,
	`host` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `countries_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `countries_code_unique` UNIQUE(`code`),
	CONSTRAINT `countries_slug_idx` UNIQUE(`slug`),
	CONSTRAINT `countries_code_idx` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`newspaperId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `favorites_user_newspaper_idx` UNIQUE(`userId`,`newspaperId`)
);
--> statement-breakpoint
CREATE TABLE `newspapers` (
	`id` varchar(36) NOT NULL,
	`coverImage` text NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`autoPublish` boolean NOT NULL DEFAULT false,
	`organizationId` varchar(36),
	`publishDate` timestamp NOT NULL,
	`countryId` int,
	`pdf` text NOT NULL,
	`issueNumber` varchar(255) NOT NULL,
	`coverImageUploadId` int,
	`pdfUploadId` int,
	`status` enum('published','draft','pending','archived') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newspapers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newspapers_categories_categories` (
	`newspapersId` varchar(36) NOT NULL,
	`categoriesId` int NOT NULL,
	CONSTRAINT `newspapers_categories_categories_newspapersId_categoriesId_pk` PRIMARY KEY(`newspapersId`,`categoriesId`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`userId` varchar(255),
	`newspaperId` varchar(255) NOT NULL,
	`price` decimal(10,2) NOT NULL,
	`status` enum('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`paymentId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `organization_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`organizationAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`platformAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalSales` int NOT NULL DEFAULT 0,
	`totalWithdrawals` int NOT NULL DEFAULT 0,
	`withdrawnAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`currency` varchar(10) NOT NULL DEFAULT 'XAF',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `organization_balances_id` PRIMARY KEY(`id`),
	CONSTRAINT `organization_balances_organizationId_unique` UNIQUE(`organizationId`)
);
--> statement-breakpoint
CREATE TABLE `rateLimit` (
	`id` varchar(36) NOT NULL,
	`key` text NOT NULL,
	`count` int NOT NULL,
	`lastRequest` bigint NOT NULL,
	CONSTRAINT `rateLimit_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `revenue_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` varchar(36) NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`totalAmount` decimal(10,2) NOT NULL,
	`platformAmount` decimal(10,2) NOT NULL,
	`organizationAmount` decimal(10,2) NOT NULL,
	`platformPercentage` decimal(5,2) NOT NULL DEFAULT '25.00',
	`organizationPercentage` decimal(5,2) NOT NULL DEFAULT '75.00',
	`currency` varchar(10) NOT NULL DEFAULT 'XAF',
	`revenue_share_status` enum('pending','processed','paid_out','cancelled') NOT NULL DEFAULT 'pending',
	`processedAt` timestamp,
	`paidOutAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revenue_shares_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text,
	`type` varchar(50) NOT NULL DEFAULT 'string',
	`label` varchar(255),
	`description` text,
	`group` varchar(50) NOT NULL DEFAULT 'general',
	`isPublic` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_settings_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE TABLE `uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`thumbnailS3Key` text NOT NULL,
	`thumbnailUrl` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_favorite_countries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` varchar(255) NOT NULL,
	`countryId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_favorite_countries_id` PRIMARY KEY(`id`),
	CONSTRAINT `ufc_user_country_idx` UNIQUE(`userId`,`countryId`)
);
--> statement-breakpoint
CREATE TABLE `withdrawals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`organizationId` varchar(36) NOT NULL,
	`userId` varchar(255),
	`amount` decimal(10,2) NOT NULL,
	`currency` varchar(10) NOT NULL DEFAULT 'XAF',
	`withdrawal_status` enum('pending','processing','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`paymentMethod` varchar(50),
	`paymentDetails` text,
	`externalReference` varchar(255),
	`notes` text,
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdrawals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_inviterId_users_id_fk` FOREIGN KEY (`inviterId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `members` ADD CONSTRAINT `members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_role` ADD CONSTRAINT `organization_role_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_teamId_teams_id_fk` FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team_members` ADD CONSTRAINT `team_members_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `teams` ADD CONSTRAINT `teams_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_newspaperId_newspapers_id_fk` FOREIGN KEY (`newspaperId`) REFERENCES `newspapers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newspapers` ADD CONSTRAINT `newspapers_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newspapers` ADD CONSTRAINT `newspapers_countryId_countries_id_fk` FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newspapers` ADD CONSTRAINT `newspapers_coverImageUploadId_uploads_id_fk` FOREIGN KEY (`coverImageUploadId`) REFERENCES `uploads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newspapers` ADD CONSTRAINT `newspapers_pdfUploadId_uploads_id_fk` FOREIGN KEY (`pdfUploadId`) REFERENCES `uploads`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `newspapers_categories_categories` ADD CONSTRAINT `newspapers_categories_categories_newspapersId_newspapers_id_fk` FOREIGN KEY (`newspapersId`) REFERENCES `newspapers`(`id`) ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE `newspapers_categories_categories` ADD CONSTRAINT `newspapers_categories_categories_categoriesId_categories_id_fk` FOREIGN KEY (`categoriesId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_newspaperId_newspapers_id_fk` FOREIGN KEY (`newspaperId`) REFERENCES `newspapers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `organization_balances` ADD CONSTRAINT `organization_balances_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenue_shares` ADD CONSTRAINT `revenue_shares_orderId_orders_id_fk` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `revenue_shares` ADD CONSTRAINT `revenue_shares_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_favorite_countries` ADD CONSTRAINT `user_favorite_countries_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_favorite_countries` ADD CONSTRAINT `user_favorite_countries_countryId_countries_id_fk` FOREIGN KEY (`countryId`) REFERENCES `countries`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_organizationId_organizations_id_fk` FOREIGN KEY (`organizationId`) REFERENCES `organizations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `withdrawals` ADD CONSTRAINT `withdrawals_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `accounts_userId_idx` ON `accounts` (`userId`);--> statement-breakpoint
CREATE INDEX `invitations_organizationId_idx` ON `invitations` (`organizationId`);--> statement-breakpoint
CREATE INDEX `invitations_email_idx` ON `invitations` (`email`);--> statement-breakpoint
CREATE INDEX `members_organizationId_idx` ON `members` (`organizationId`);--> statement-breakpoint
CREATE INDEX `members_userId_idx` ON `members` (`userId`);--> statement-breakpoint
CREATE INDEX `organizationRole_organizationId_idx` ON `organization_role` (`organizationId`);--> statement-breakpoint
CREATE INDEX `organizationRole_role_idx` ON `organization_role` (`role`);--> statement-breakpoint
CREATE INDEX `organizations_logoUploadId_idx` ON `organizations` (`logoUploadId`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `team_members_teamId_idx` ON `team_members` (`teamId`);--> statement-breakpoint
CREATE INDEX `team_members_userId_idx` ON `team_members` (`userId`);--> statement-breakpoint
CREATE INDEX `teams_organizationId_idx` ON `teams` (`organizationId`);--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE INDEX `favorites_userId_idx` ON `favorites` (`userId`);--> statement-breakpoint
CREATE INDEX `favorites_newspaperId_idx` ON `favorites` (`newspaperId`);--> statement-breakpoint
CREATE INDEX `newspapers_organizationId_idx` ON `newspapers` (`organizationId`);--> statement-breakpoint
CREATE INDEX `newspapers_countryId_idx` ON `newspapers` (`countryId`);--> statement-breakpoint
CREATE INDEX `newspapers_categories_newspapersId_idx` ON `newspapers_categories_categories` (`newspapersId`);--> statement-breakpoint
CREATE INDEX `newspapers_categories_categoriesId_idx` ON `newspapers_categories_categories` (`categoriesId`);--> statement-breakpoint
CREATE INDEX `orders_userId_idx` ON `orders` (`userId`);--> statement-breakpoint
CREATE INDEX `orders_newspaperId_idx` ON `orders` (`newspaperId`);--> statement-breakpoint
CREATE INDEX `organization_balances_organizationId_idx` ON `organization_balances` (`organizationId`);--> statement-breakpoint
CREATE INDEX `revenue_shares_orderId_idx` ON `revenue_shares` (`orderId`);--> statement-breakpoint
CREATE INDEX `revenue_shares_organizationId_idx` ON `revenue_shares` (`organizationId`);--> statement-breakpoint
CREATE INDEX `revenue_shares_status_idx` ON `revenue_shares` (`revenue_share_status`);--> statement-breakpoint
CREATE INDEX `ufc_userId_idx` ON `user_favorite_countries` (`userId`);--> statement-breakpoint
CREATE INDEX `ufc_countryId_idx` ON `user_favorite_countries` (`countryId`);--> statement-breakpoint
CREATE INDEX `withdrawals_organizationId_idx` ON `withdrawals` (`organizationId`);--> statement-breakpoint
CREATE INDEX `withdrawals_status_idx` ON `withdrawals` (`withdrawal_status`);--> statement-breakpoint
CREATE INDEX `withdrawals_requestedAt_idx` ON `withdrawals` (`requestedAt`);