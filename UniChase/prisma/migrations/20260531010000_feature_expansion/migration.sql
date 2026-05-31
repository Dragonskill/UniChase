ALTER TABLE "University"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "universityType" TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN "hasDormitory" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "studentLife" TEXT,
  ADD COLUMN "requiredDocuments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "applicationSteps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "studyLevels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "applicationOpenDate" TIMESTAMP(3),
  ADD COLUMN "applicationDeadline" TIMESTAMP(3),
  ADD COLUMN "scholarshipDeadline" TIMESTAMP(3),
  ADD COLUMN "documentDeadline" TIMESTAMP(3);

CREATE UNIQUE INDEX "University_slug_key" ON "University"("slug");
CREATE INDEX "University_universityType_idx" ON "University"("universityType");
CREATE INDEX "University_applicationDeadline_idx" ON "University"("applicationDeadline");

CREATE TABLE "StudentUser" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "preferredMajor" TEXT,
  "preferredCity" TEXT,
  "preferredLevel" TEXT,
  "budgetMin" INTEGER,
  "budgetMax" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentUser_email_key" ON "StudentUser"("email");

CREATE TABLE "SavedUniversity" (
  "userId" INTEGER NOT NULL,
  "universityId" INTEGER NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedUniversity_pkey" PRIMARY KEY ("userId", "universityId")
);

CREATE INDEX "SavedUniversity_universityId_idx" ON "SavedUniversity"("universityId");

CREATE TABLE "ComparisonSet" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComparisonSet_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ComparisonUniversity" (
  "id" SERIAL NOT NULL,
  "comparisonSetId" INTEGER NOT NULL,
  "universityId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ComparisonUniversity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ComparisonUniversity_comparisonSetId_universityId_key" ON "ComparisonUniversity"("comparisonSetId", "universityId");
CREATE INDEX "ComparisonUniversity_universityId_idx" ON "ComparisonUniversity"("universityId");

CREATE TABLE "UserDeadline" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "universityId" INTEGER NOT NULL,
  "deadlineType" TEXT NOT NULL,
  "important" BOOLEAN NOT NULL DEFAULT false,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserDeadline_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserDeadline_userId_universityId_deadlineType_key" ON "UserDeadline"("userId", "universityId", "deadlineType");
CREATE INDEX "UserDeadline_universityId_idx" ON "UserDeadline"("universityId");

CREATE TABLE "ChecklistItem" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "dueDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecommendationPreference" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER,
  "preferredMajor" TEXT,
  "preferredCity" TEXT,
  "language" TEXT,
  "dormitoryRequired" BOOLEAN,
  "scholarshipPreferred" BOOLEAN,
  "level" TEXT,
  "rankingMin" INTEGER,
  "rankingMax" INTEGER,
  "tuitionMin" INTEGER,
  "tuitionMax" INTEGER,
  "results" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RecommendationPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContactMessage" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "universityOfInterest" TEXT,
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'new',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SavedUniversity" ADD CONSTRAINT "SavedUniversity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedUniversity" ADD CONSTRAINT "SavedUniversity_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComparisonSet" ADD CONSTRAINT "ComparisonSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComparisonUniversity" ADD CONSTRAINT "ComparisonUniversity_comparisonSetId_fkey" FOREIGN KEY ("comparisonSetId") REFERENCES "ComparisonSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ComparisonUniversity" ADD CONSTRAINT "ComparisonUniversity_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDeadline" ADD CONSTRAINT "UserDeadline_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDeadline" ADD CONSTRAINT "UserDeadline_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecommendationPreference" ADD CONSTRAINT "RecommendationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
