CREATE TABLE "saved_vocabulary" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "vocabulary_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "saved_vocabulary_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "saved_vocabulary_user_id_vocabulary_id_key"
ON "saved_vocabulary"("user_id", "vocabulary_id");

CREATE INDEX "saved_vocabulary_user_id_created_at_idx"
ON "saved_vocabulary"("user_id", "created_at");

ALTER TABLE "saved_vocabulary"
ADD CONSTRAINT "saved_vocabulary_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_vocabulary"
ADD CONSTRAINT "saved_vocabulary_vocabulary_id_fkey"
FOREIGN KEY ("vocabulary_id") REFERENCES "Vocabulary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
