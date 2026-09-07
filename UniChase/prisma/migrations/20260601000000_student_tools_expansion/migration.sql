CREATE TABLE "Program" (
  "id" SERIAL NOT NULL,
  "universityId" INTEGER NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "degreeLevel" TEXT NOT NULL,
  "languageOfInstruction" TEXT NOT NULL,
  "tuitionMin" INTEGER,
  "tuitionMax" INTEGER,
  "tuitionCurrency" TEXT NOT NULL DEFAULT 'KRW',
  "duration" TEXT,
  "requirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "requiredDocuments" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "applicationPeriod" TEXT,
  "careerOutcomes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "officialLink" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ApplicationRoadmap" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "universityId" INTEGER,
  "targetMajor" TEXT NOT NULL,
  "degreeLevel" TEXT NOT NULL,
  "intake" TEXT NOT NULL,
  "preparationStatus" TEXT NOT NULL,
  "deadlinePreference" TEXT,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationRoadmap_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RoadmapStep" (
  "id" SERIAL NOT NULL,
  "roadmapId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "dueDate" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "custom" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RoadmapStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentChecklist" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "universityId" INTEGER,
  "targetMajor" TEXT,
  "degreeLevel" TEXT NOT NULL,
  "nationality" TEXT,
  "languageTrack" TEXT NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentChecklist_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentChecklistItem" (
  "id" SERIAL NOT NULL,
  "checklistId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "optional" BOOLEAN NOT NULL DEFAULT false,
  "custom" BOOLEAN NOT NULL DEFAULT false,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EssayDraft" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "targetUniversity" TEXT,
  "targetMajor" TEXT,
  "prompt" TEXT,
  "content" TEXT NOT NULL,
  "feedback" JSONB,
  "wordCount" INTEGER NOT NULL DEFAULT 0,
  "characterCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EssayDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VisaChecklistItem" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "dueDate" TIMESTAMP(3),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VisaChecklistItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CostEstimate" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "universityId" INTEGER,
  "name" TEXT NOT NULL,
  "inputs" JSONB NOT NULL,
  "breakdown" JSONB NOT NULL,
  "monthlyCost" INTEGER NOT NULL DEFAULT 0,
  "semesterCost" INTEGER NOT NULL DEFAULT 0,
  "yearlyCost" INTEGER NOT NULL DEFAULT 0,
  "firstYearCost" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CostEstimate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EligibilityResult" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "universityId" INTEGER,
  "targetProgram" TEXT NOT NULL,
  "degreeLevel" TEXT NOT NULL,
  "educationLevel" TEXT,
  "gpa" DOUBLE PRECISION,
  "englishScore" TEXT,
  "koreanScore" TEXT,
  "budget" INTEGER,
  "nationality" TEXT,
  "preferredLanguage" TEXT,
  "status" TEXT NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "missingRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "nextSteps" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "rawInput" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EligibilityResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UniversityReview" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "universityId" INTEGER NOT NULL,
  "academics" INTEGER NOT NULL,
  "campusLife" INTEGER NOT NULL,
  "dormitory" INTEGER NOT NULL,
  "internationalSupport" INTEGER NOT NULL,
  "difficulty" INTEGER NOT NULL,
  "costValue" INTEGER NOT NULL,
  "location" INTEGER NOT NULL,
  "overallRating" INTEGER NOT NULL,
  "comment" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "UniversityReview_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReminderPreference" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
  "applicationDeadline" BOOLEAN NOT NULL DEFAULT true,
  "documentChecklist" BOOLEAN NOT NULL DEFAULT true,
  "roadmapStep" BOOLEAN NOT NULL DEFAULT true,
  "visaChecklist" BOOLEAN NOT NULL DEFAULT true,
  "savedUniversityDeadline" BOOLEAN NOT NULL DEFAULT true,
  "reminderDays" INTEGER[] NOT NULL DEFAULT ARRAY[30, 14, 7, 1]::INTEGER[],
  "customEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReminderPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ScheduledReminder" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sendAt" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'scheduled',
  "metadata" JSONB,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ScheduledReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Program_slug_key" ON "Program"("slug");
CREATE INDEX "Program_universityId_idx" ON "Program"("universityId");
CREATE INDEX "Program_degreeLevel_idx" ON "Program"("degreeLevel");
CREATE INDEX "Program_languageOfInstruction_idx" ON "Program"("languageOfInstruction");
CREATE INDEX "Program_name_idx" ON "Program"("name");

CREATE INDEX "ApplicationRoadmap_userId_idx" ON "ApplicationRoadmap"("userId");
CREATE INDEX "ApplicationRoadmap_universityId_idx" ON "ApplicationRoadmap"("universityId");

CREATE INDEX "RoadmapStep_roadmapId_idx" ON "RoadmapStep"("roadmapId");

CREATE INDEX "DocumentChecklist_userId_idx" ON "DocumentChecklist"("userId");
CREATE INDEX "DocumentChecklist_universityId_idx" ON "DocumentChecklist"("universityId");

CREATE INDEX "DocumentChecklistItem_checklistId_idx" ON "DocumentChecklistItem"("checklistId");

CREATE INDEX "EssayDraft_userId_idx" ON "EssayDraft"("userId");

CREATE INDEX "VisaChecklistItem_userId_idx" ON "VisaChecklistItem"("userId");

CREATE INDEX "CostEstimate_userId_idx" ON "CostEstimate"("userId");
CREATE INDEX "CostEstimate_universityId_idx" ON "CostEstimate"("universityId");

CREATE INDEX "EligibilityResult_userId_idx" ON "EligibilityResult"("userId");
CREATE INDEX "EligibilityResult_universityId_idx" ON "EligibilityResult"("universityId");
CREATE INDEX "EligibilityResult_status_idx" ON "EligibilityResult"("status");

CREATE INDEX "UniversityReview_userId_idx" ON "UniversityReview"("userId");
CREATE INDEX "UniversityReview_universityId_idx" ON "UniversityReview"("universityId");
CREATE INDEX "UniversityReview_status_idx" ON "UniversityReview"("status");

CREATE UNIQUE INDEX "ReminderPreference_userId_key" ON "ReminderPreference"("userId");

CREATE INDEX "ScheduledReminder_userId_idx" ON "ScheduledReminder"("userId");
CREATE INDEX "ScheduledReminder_type_idx" ON "ScheduledReminder"("type");
CREATE INDEX "ScheduledReminder_status_idx" ON "ScheduledReminder"("status");
CREATE INDEX "ScheduledReminder_sendAt_idx" ON "ScheduledReminder"("sendAt");

ALTER TABLE "Program" ADD CONSTRAINT "Program_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationRoadmap" ADD CONSTRAINT "ApplicationRoadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ApplicationRoadmap" ADD CONSTRAINT "ApplicationRoadmap_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoadmapStep" ADD CONSTRAINT "RoadmapStep_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "ApplicationRoadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentChecklist" ADD CONSTRAINT "DocumentChecklist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DocumentChecklist" ADD CONSTRAINT "DocumentChecklist_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentChecklistItem" ADD CONSTRAINT "DocumentChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "DocumentChecklist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EssayDraft" ADD CONSTRAINT "EssayDraft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisaChecklistItem" ADD CONSTRAINT "VisaChecklistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CostEstimate" ADD CONSTRAINT "CostEstimate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CostEstimate" ADD CONSTRAINT "CostEstimate_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EligibilityResult" ADD CONSTRAINT "EligibilityResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EligibilityResult" ADD CONSTRAINT "EligibilityResult_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UniversityReview" ADD CONSTRAINT "UniversityReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UniversityReview" ADD CONSTRAINT "UniversityReview_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReminderPreference" ADD CONSTRAINT "ReminderPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScheduledReminder" ADD CONSTRAINT "ScheduledReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
