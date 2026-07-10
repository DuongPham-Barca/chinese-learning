-- CreateEnum
CREATE TYPE "LevelType" AS ENUM ('HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6');

-- CreateTable
CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "level_type" "LevelType" NOT NULL,
    "lesson_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "is_free" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vocabulary" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "hanzi" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "meaning_vi" TEXT NOT NULL,
    "audio_url" TEXT,

    CONSTRAINT "Vocabulary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sentence" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "sentence_vi" TEXT NOT NULL,
    "sentence_zh" TEXT NOT NULL,
    "audio_url" TEXT,

    CONSTRAINT "Sentence_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Vocabulary" ADD CONSTRAINT "Vocabulary_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sentence" ADD CONSTRAINT "Sentence_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_vocab_id_fkey" FOREIGN KEY ("vocab_id") REFERENCES "Vocabulary"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress" ADD CONSTRAINT "progress_sentence_id_fkey" FOREIGN KEY ("sentence_id") REFERENCES "Sentence"("id") ON DELETE SET NULL ON UPDATE CASCADE;
