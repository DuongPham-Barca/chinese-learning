-- Keep only the newest pending request for each user before enforcing uniqueness.
WITH ranked_pending AS (
  SELECT
    "id",
    ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "createdAt" DESC, "id" DESC) AS row_number
  FROM "Subscription"
  WHERE "status" = 'PENDING'
)
UPDATE "Subscription" AS subscription
SET
  "status" = 'REJECTED',
  "confirmedAt" = COALESCE(subscription."confirmedAt", CURRENT_TIMESTAMP),
  "confirmedBy" = COALESCE(subscription."confirmedBy", 'migration_duplicate_cleanup')
FROM ranked_pending
WHERE subscription."id" = ranked_pending."id"
  AND ranked_pending.row_number > 1;

CREATE UNIQUE INDEX "Subscription_one_pending_per_user"
ON "Subscription"("userId")
WHERE "status" = 'PENDING';

-- Remove duplicate module completion rows and reverse duplicate EXP before indexing.
CREATE TEMP TABLE duplicate_module_progress ON COMMIT DROP AS
SELECT "id", "user_id", "exp_gained"
FROM (
  SELECT
    "id",
    "user_id",
    "exp_gained",
    ROW_NUMBER() OVER (
      PARTITION BY "user_id", "lesson_id", "status"
      ORDER BY "created_at" ASC, "id" ASC
    ) AS row_number
  FROM "progress"
  WHERE "status" LIKE 'module:%'
) AS ranked_progress
WHERE row_number > 1;

UPDATE "User" AS app_user
SET "exp_points" = GREATEST(0, app_user."exp_points" - duplicates.exp_to_remove)
FROM (
  SELECT "user_id", SUM("exp_gained") AS exp_to_remove
  FROM duplicate_module_progress
  GROUP BY "user_id"
) AS duplicates
WHERE app_user."id" = duplicates."user_id";

DELETE FROM "progress" AS progress
USING duplicate_module_progress AS duplicates
WHERE progress."id" = duplicates."id";

CREATE UNIQUE INDEX "progress_unique_module_completion"
ON "progress"("user_id", "lesson_id", "status")
WHERE "status" LIKE 'module:%';
