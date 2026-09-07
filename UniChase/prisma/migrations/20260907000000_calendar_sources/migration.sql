ALTER TABLE "CalendarEvent" ADD COLUMN "sourceKey" TEXT;
CREATE UNIQUE INDEX "CalendarEvent_userId_sourceKey_key" ON "CalendarEvent"("userId", "sourceKey");
