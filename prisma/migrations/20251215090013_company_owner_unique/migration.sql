/*
  Warnings:

  - A unique constraint covering the columns `[ownerId]` on the table `Company` will be added. If there are existing duplicate values, this will fail.
  - Made the column `title` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `Profile` required. This step will fail if there are existing NULL values in that column.
  - Made the column `bio` on table `Profile` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "title" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL,
ALTER COLUMN "bio" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Company_ownerId_key" ON "Company"("ownerId");
