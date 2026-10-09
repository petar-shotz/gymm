CREATE TABLE `fitness_records` (
	`user` text NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`user`, `key`)
);
