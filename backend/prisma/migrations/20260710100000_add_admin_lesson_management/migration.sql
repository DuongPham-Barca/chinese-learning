CREATE TABLE "levels" (
    "id" TEXT NOT NULL,
    "type" "LevelType",
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "levels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "levels_type_key" ON "levels"("type");
CREATE UNIQUE INDEX "levels_slug_key" ON "levels"("slug");

INSERT INTO "levels" ("id", "type", "name", "slug", "description", "order", "is_published")
VALUES
  ('level_hsk1', 'HSK1', 'HSK 1', 'hsk-1', 'Tu vung va mau cau co ban HSK 1', 1, true),
  ('level_hsk2', 'HSK2', 'HSK 2', 'hsk-2', 'Tu vung va mau cau co ban HSK 2', 2, true),
  ('level_hsk3', 'HSK3', 'HSK 3', 'hsk-3', 'Noi dung trung cap HSK 3', 3, true),
  ('level_hsk4', 'HSK4', 'HSK 4', 'hsk-4', 'Noi dung trung cap HSK 4', 4, true),
  ('level_hsk5', 'HSK5', 'HSK 5', 'hsk-5', 'Noi dung nang cao HSK 5', 5, true),
  ('level_hsk6', 'HSK6', 'HSK 6', 'hsk-6', 'Noi dung nang cao HSK 6', 6, true),
  ('level_communication', 'COMMUNICATION', 'Giao tiep', 'giao-tiep', 'Tieng Trung giao tiep thuc te', 7, true)
ON CONFLICT ("slug") DO NOTHING;

ALTER TABLE "Lesson" ADD COLUMN "level_id" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "slug" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "description" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "image_url" TEXT;
ALTER TABLE "Lesson" ADD COLUMN "is_published" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Lesson" ADD COLUMN "exp_reward" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "Lesson" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Lesson" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "Lesson"
SET
  "level_id" = CASE "level_type"
    WHEN 'HSK1' THEN 'level_hsk1'
    WHEN 'HSK2' THEN 'level_hsk2'
    WHEN 'HSK3' THEN 'level_hsk3'
    WHEN 'HSK4' THEN 'level_hsk4'
    WHEN 'HSK5' THEN 'level_hsk5'
    WHEN 'HSK6' THEN 'level_hsk6'
    WHEN 'COMMUNICATION' THEN 'level_communication'
  END,
  "slug" = 'bai-' || "lesson_order";

ALTER TABLE "Lesson" ALTER COLUMN "level_id" SET NOT NULL;
ALTER TABLE "Lesson" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Lesson_level_id_slug_key" ON "Lesson"("level_id", "slug");
CREATE INDEX "Lesson_level_id_idx" ON "Lesson"("level_id");

ALTER TABLE "Vocabulary" ADD COLUMN "example" TEXT;
ALTER TABLE "Vocabulary" ADD COLUMN "example_pinyin" TEXT;
ALTER TABLE "Vocabulary" ADD COLUMN "example_meaning" TEXT;
ALTER TABLE "Vocabulary" ADD COLUMN "image_url" TEXT;
ALTER TABLE "Vocabulary" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Vocabulary" ADD COLUMN "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Vocabulary" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

WITH ranked AS (
  SELECT "id", ROW_NUMBER() OVER (PARTITION BY "lesson_id" ORDER BY "id") AS row_order
  FROM "Vocabulary"
)
UPDATE "Vocabulary"
SET "order" = ranked.row_order
FROM ranked
WHERE "Vocabulary"."id" = ranked."id";

CREATE INDEX "Vocabulary_lesson_id_idx" ON "Vocabulary"("lesson_id");

ALTER TABLE "Vocabulary" DROP CONSTRAINT IF EXISTS "Vocabulary_lesson_id_fkey";
ALTER TABLE "Sentence" DROP CONSTRAINT IF EXISTS "Sentence_lesson_id_fkey";
ALTER TABLE "progress" DROP CONSTRAINT IF EXISTS "progress_lesson_id_fkey";
ALTER TABLE "progress" DROP CONSTRAINT IF EXISTS "progress_vocab_id_fkey";

ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Sentence" ADD CONSTRAINT "Sentence_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "progress" ADD CONSTRAINT "progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "progress" ADD CONSTRAINT "progress_vocab_id_fkey" FOREIGN KEY ("vocab_id") REFERENCES "Vocabulary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
