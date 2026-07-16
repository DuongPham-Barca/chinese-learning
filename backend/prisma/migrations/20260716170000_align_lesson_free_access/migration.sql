-- Preserve the original freemium policy now that Lesson.isFree is honored by public APIs.
UPDATE "Lesson"
SET "is_free" = ("lesson_order" <= 3);
