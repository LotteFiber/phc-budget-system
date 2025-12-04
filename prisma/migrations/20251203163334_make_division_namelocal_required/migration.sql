/*
  Warnings:

  - Made the column `nameLocal` on table `Division` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Division" ALTER COLUMN "nameLocal" SET NOT NULL;
