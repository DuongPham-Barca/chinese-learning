/*
  Warnings:

  - Changed the type of `planId` on the `Subscription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('2months', '6months', '12months');

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "planId",
ADD COLUMN     "planId" "SubscriptionPlan" NOT NULL;

-- CreateIndex
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");
