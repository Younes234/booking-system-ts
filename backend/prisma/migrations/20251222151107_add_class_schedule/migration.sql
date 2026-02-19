/*
  Warnings:

  - Added the required column `classDetails` to the `ClassSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ClassSchedule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dayOfWeek" INTEGER NOT NULL,
    "classDetails" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_ClassSchedule" ("capacity", "dayOfWeek", "enabled", "id", "startTime") SELECT "capacity", "dayOfWeek", "enabled", "id", "startTime" FROM "ClassSchedule";
DROP TABLE "ClassSchedule";
ALTER TABLE "new_ClassSchedule" RENAME TO "ClassSchedule";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
