-- CreateEnum
CREATE TYPE "AssociationContentType" AS ENUM ('EVENT', 'POST', 'INTERVIEW');

-- AlterTable
ALTER TABLE "StudentCouncil" ADD COLUMN     "associationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "foundedYear" INTEGER,
ADD COLUMN     "imageId" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "memberCount" INTEGER,
ADD COLUMN     "telegramUrl" TEXT;

-- AlterTable
ALTER TABLE "StudentCouncilRole" ADD COLUMN     "academicYear" TEXT,
ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "imageId" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "major" TEXT,
ADD COLUMN     "roleShort" TEXT,
ADD COLUMN     "telegramUrl" TEXT;

-- CreateTable
CREATE TABLE "AssociationImage" (
    "id" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "bytes" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssociationImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MajorAdvisor" (
    "id" SERIAL NOT NULL,
    "councilId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "academicYear" TEXT,
    "contactUrl" TEXT,
    "photoUrl" TEXT,
    "imageId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'needs verification',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MajorAdvisor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssociationContent" (
    "id" SERIAL NOT NULL,
    "councilId" INTEGER NOT NULL,
    "type" "AssociationContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "imageId" TEXT,
    "date" DATE NOT NULL,
    "externalUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssociationContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorQuestion" (
    "id" SERIAL NOT NULL,
    "studentId" INTEGER,
    "councilId" INTEGER,
    "advisorId" INTEGER,
    "advisorName" TEXT NOT NULL,
    "advisorMajor" TEXT NOT NULL,
    "associationName" TEXT NOT NULL,
    "universityName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdvisorQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MajorAdvisor_councilId_active_displayOrder_idx" ON "MajorAdvisor"("councilId", "active", "displayOrder");

-- CreateIndex
CREATE INDEX "MajorAdvisor_imageId_idx" ON "MajorAdvisor"("imageId");

-- CreateIndex
CREATE INDEX "AssociationContent_councilId_published_date_idx" ON "AssociationContent"("councilId", "published", "date");

-- CreateIndex
CREATE INDEX "AssociationContent_imageId_idx" ON "AssociationContent"("imageId");

-- CreateIndex
CREATE INDEX "AdvisorQuestion_studentId_idx" ON "AdvisorQuestion"("studentId");

-- CreateIndex
CREATE INDEX "AdvisorQuestion_councilId_idx" ON "AdvisorQuestion"("councilId");

-- CreateIndex
CREATE INDEX "AdvisorQuestion_advisorId_idx" ON "AdvisorQuestion"("advisorId");

-- CreateIndex
CREATE INDEX "AdvisorQuestion_handledAt_createdAt_idx" ON "AdvisorQuestion"("handledAt", "createdAt");

-- CreateIndex
CREATE INDEX "StudentCouncil_imageId_idx" ON "StudentCouncil"("imageId");

-- CreateIndex
CREATE INDEX "StudentCouncilRole_imageId_idx" ON "StudentCouncilRole"("imageId");

-- CreateIndex
CREATE INDEX "StudentCouncilRole_councilId_status_displayOrder_idx" ON "StudentCouncilRole"("councilId", "status", "displayOrder");

-- AddForeignKey
ALTER TABLE "StudentCouncil" ADD CONSTRAINT "StudentCouncil_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "AssociationImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCouncilRole" ADD CONSTRAINT "StudentCouncilRole_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "AssociationImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajorAdvisor" ADD CONSTRAINT "MajorAdvisor_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "StudentCouncil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajorAdvisor" ADD CONSTRAINT "MajorAdvisor_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "AssociationImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationContent" ADD CONSTRAINT "AssociationContent_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "StudentCouncil"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssociationContent" ADD CONSTRAINT "AssociationContent_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "AssociationImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorQuestion" ADD CONSTRAINT "AdvisorQuestion_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorQuestion" ADD CONSTRAINT "AdvisorQuestion_councilId_fkey" FOREIGN KEY ("councilId") REFERENCES "StudentCouncil"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdvisorQuestion" ADD CONSTRAINT "AdvisorQuestion_advisorId_fkey" FOREIGN KEY ("advisorId") REFERENCES "MajorAdvisor"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Initialize the association without replacing moderator-authored council fields.
INSERT INTO "StudentCouncil" ("universityId", "name", "officialName", "description", "associationEnabled", "updatedAt")
SELECT "id", 'KUUSA', 'Korea University Uzbek Students Association',
  'KUUSA is the Korea University Uzbek Students Association. It represents Uzbek students at Korea University.',
  true, CURRENT_TIMESTAMP
FROM "University"
WHERE "slug" = 'korea-university'
ON CONFLICT ("universityId") DO UPDATE SET
  "associationEnabled" = true,
  "name" = CASE WHEN "StudentCouncil"."name" = 'Korea University Student Council' THEN 'KUUSA' ELSE "StudentCouncil"."name" END,
  "officialName" = COALESCE("StudentCouncil"."officialName", EXCLUDED."officialName"),
  "description" = CASE
    WHEN "StudentCouncil"."description" = 'Student council structure placeholder. Real members are not listed until verified from official public sources or added by a moderator.'
    THEN EXCLUDED."description" ELSE "StudentCouncil"."description" END;
