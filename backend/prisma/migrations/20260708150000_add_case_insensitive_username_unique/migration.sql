-- Treat names that differ only by letter case as duplicates at the database level.
CREATE UNIQUE INDEX "users_username_case_insensitive_key"
ON "User" (LOWER("username"));
