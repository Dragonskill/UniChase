ALTER TABLE "University" ADD COLUMN "province" TEXT;
ALTER TABLE "University" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'needs verification';
ALTER TABLE "ScheduledReminder" ADD COLUMN "sourceKey" TEXT;
CREATE UNIQUE INDEX "ScheduledReminder_userId_sourceKey_key" ON "ScheduledReminder"("userId", "sourceKey");
CREATE UNIQUE INDEX "UniversityReview_userId_universityId_key" ON "UniversityReview"("userId", "universityId");

CREATE TABLE "FollowedUniversity" (
  "userId" INTEGER NOT NULL,
  "universityId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FollowedUniversity_pkey" PRIMARY KEY ("userId", "universityId"),
  CONSTRAINT "FollowedUniversity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FollowedUniversity_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "FollowedUniversity_universityId_idx" ON "FollowedUniversity"("universityId");

CREATE TABLE "ManagedContent" (
  "kind" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "updatedById" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ManagedContent_pkey" PRIMARY KEY ("kind"),
  CONSTRAINT "ManagedContent_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ManagedContent_updatedById_idx" ON "ManagedContent"("updatedById");
