-- AlterTable: add ON DELETE CASCADE to Review.clientId FK (was RESTRICT by default)
ALTER TABLE "Review" DROP CONSTRAINT "Review_clientId_fkey";
ALTER TABLE "Review" ADD CONSTRAINT "Review_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
