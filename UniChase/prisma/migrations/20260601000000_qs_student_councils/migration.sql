ALTER TABLE "University"
  ADD COLUMN "qsRankingLabel" TEXT,
  ADD COLUMN "qsSourceUrl" TEXT,
  ADD COLUMN "sourceUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "lastVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "fullDescription" TEXT;

ALTER TABLE "University" ALTER COLUMN "imageUrl" DROP NOT NULL;
ALTER TABLE "University" ALTER COLUMN "logoUrl" DROP NOT NULL;
ALTER TABLE "University" ALTER COLUMN "hasScholarships" DROP NOT NULL;
ALTER TABLE "University" ALTER COLUMN "hasDormitory" DROP NOT NULL;

CREATE TABLE "StudentCouncil" (
  "id" SERIAL NOT NULL,
  "universityId" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "officialName" TEXT,
  "description" TEXT NOT NULL,
  "websiteUrl" TEXT,
  "socialUrl" TEXT,
  "contactEmail" TEXT,
  "sourceUrl" TEXT,
  "verificationStatus" TEXT NOT NULL DEFAULT 'needs verification',
  "lastVerifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentCouncil_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentCouncil_universityId_key" ON "StudentCouncil"("universityId");
CREATE INDEX "StudentCouncil_verificationStatus_idx" ON "StudentCouncil"("verificationStatus");

CREATE TABLE "StudentCouncilRole" (
  "id" SERIAL NOT NULL,
  "councilId" INTEGER NOT NULL,
  "universityId" INTEGER NOT NULL,
  "adminUserId" INTEGER,
  "displayName" TEXT,
  "roleTitle" TEXT NOT NULL,
  "department" TEXT,
  "description" TEXT,
  "responsibilities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "contactEmail" TEXT,
  "contactUrl" TEXT,
  "avatarUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "verificationStatus" TEXT NOT NULL DEFAULT 'needs verification',
  "sourceUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentCouncilRole_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StudentCouncilRole_councilId_idx" ON "StudentCouncilRole"("councilId");
CREATE INDEX "StudentCouncilRole_universityId_idx" ON "StudentCouncilRole"("universityId");
CREATE INDEX "StudentCouncilRole_adminUserId_idx" ON "StudentCouncilRole"("adminUserId");
CREATE INDEX "StudentCouncilRole_status_idx" ON "StudentCouncilRole"("status");
CREATE INDEX "StudentCouncilRole_verificationStatus_idx" ON "StudentCouncilRole"("verificationStatus");

CREATE TABLE "ModeratorProfile" (
  "id" SERIAL NOT NULL,
  "adminUserId" INTEGER NOT NULL,
  "displayName" TEXT NOT NULL,
  "description" TEXT,
  "defaultRole" TEXT,
  "avatarUrl" TEXT,
  "contactEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModeratorProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ModeratorProfile_adminUserId_key" ON "ModeratorProfile"("adminUserId");

ALTER TABLE "StudentCouncil" ADD CONSTRAINT "StudentCouncil_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentCouncilRole" ADD CONSTRAINT "StudentCouncilRole_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "StudentCouncil"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentCouncilRole" ADD CONSTRAINT "StudentCouncilRole_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StudentCouncilRole" ADD CONSTRAINT "StudentCouncilRole_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModeratorProfile" ADD CONSTRAINT "ModeratorProfile_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
