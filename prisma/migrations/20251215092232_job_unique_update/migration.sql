/*
  Warnings:

  - A unique constraint covering the columns `[companyId]` on the table `Job` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Job_companyId_key" ON "Job"("companyId");
