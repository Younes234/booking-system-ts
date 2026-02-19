/*
  Warnings:

  - A unique constraint covering the columns `[dayOfWeek]` on the table `ClassSchedule` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ClassSchedule_dayOfWeek_key" ON "ClassSchedule"("dayOfWeek");
