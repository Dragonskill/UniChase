ALTER TABLE "AdminUser"
  ADD COLUMN "role" TEXT NOT NULL DEFAULT 'admin';

CREATE TABLE "CommunityPost" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "universityId" INTEGER,
  "relatedProgram" TEXT,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "authorId" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'published',
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "officialAnswer" TEXT,
  "officialCommentId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityComment" (
  "id" SERIAL NOT NULL,
  "postId" INTEGER NOT NULL,
  "authorId" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "parentCommentId" INTEGER,
  "status" TEXT NOT NULL DEFAULT 'published',
  "official" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityComment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CommunityLike" (
  "userId" INTEGER NOT NULL,
  "postId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityLike_pkey" PRIMARY KEY ("userId", "postId")
);

CREATE TABLE "CommunitySavedPost" (
  "userId" INTEGER NOT NULL,
  "postId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunitySavedPost_pkey" PRIMARY KEY ("userId", "postId")
);

CREATE TABLE "CommunityReport" (
  "id" SERIAL NOT NULL,
  "postId" INTEGER,
  "commentId" INTEGER,
  "reporterId" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "details" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Notification" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "relatedEntityType" TEXT,
  "relatedEntityId" INTEGER,
  "linkUrl" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModeratorActivityLog" (
  "id" SERIAL NOT NULL,
  "adminUserId" INTEGER,
  "actionType" TEXT NOT NULL,
  "targetEntity" TEXT NOT NULL,
  "targetEntityId" INTEGER,
  "previousStatus" TEXT,
  "newStatus" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModeratorActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModeratorInternalNote" (
  "id" SERIAL NOT NULL,
  "adminUserId" INTEGER NOT NULL,
  "targetEntity" TEXT NOT NULL,
  "targetEntityId" INTEGER,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ModeratorInternalNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnalyticsEvent" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER,
  "sessionId" TEXT,
  "eventType" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" INTEGER,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserOnboardingPreference" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "desiredMajor" TEXT,
  "degreeLevel" TEXT,
  "preferredCity" TEXT,
  "languagePreference" TEXT,
  "budgetMin" INTEGER,
  "budgetMax" INTEGER,
  "qsRankMin" INTEGER,
  "qsRankMax" INTEGER,
  "dormitoryRequired" BOOLEAN,
  "scholarshipPreference" TEXT,
  "targetIntake" TEXT,
  "educationLevel" TEXT,
  "preparationStage" TEXT,
  "nationality" TEXT,
  "testStatus" TEXT,
  "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserOnboardingPreference_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserApplication" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "universityId" INTEGER NOT NULL,
  "programId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Interested',
  "intake" TEXT,
  "applicationDeadline" TIMESTAMP(3),
  "submittedDate" TIMESTAMP(3),
  "resultDate" TIMESTAMP(3),
  "notes" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'normal',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UserDocument" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "applicationId" INTEGER,
  "checklistItemId" INTEGER,
  "documentType" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'missing',
  "fileUrl" TEXT,
  "fileName" TEXT,
  "fileType" TEXT,
  "fileSize" INTEGER,
  "expirationDate" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CalendarEvent" (
  "id" SERIAL NOT NULL,
  "userId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "eventType" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3),
  "allDay" BOOLEAN NOT NULL DEFAULT true,
  "universityId" INTEGER,
  "programId" TEXT,
  "applicationId" INTEGER,
  "checklistItemId" INTEGER,
  "roadmapStepId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'upcoming',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");
CREATE INDEX "CommunityPost_category_idx" ON "CommunityPost"("category");
CREATE INDEX "CommunityPost_universityId_idx" ON "CommunityPost"("universityId");
CREATE INDEX "CommunityPost_status_idx" ON "CommunityPost"("status");
CREATE INDEX "CommunityPost_pinned_idx" ON "CommunityPost"("pinned");
CREATE INDEX "CommunityPost_createdAt_idx" ON "CommunityPost"("createdAt");
CREATE INDEX "CommunityComment_postId_idx" ON "CommunityComment"("postId");
CREATE INDEX "CommunityComment_authorId_idx" ON "CommunityComment"("authorId");
CREATE INDEX "CommunityComment_parentCommentId_idx" ON "CommunityComment"("parentCommentId");
CREATE INDEX "CommunityComment_status_idx" ON "CommunityComment"("status");
CREATE INDEX "CommunityLike_postId_idx" ON "CommunityLike"("postId");
CREATE INDEX "CommunitySavedPost_postId_idx" ON "CommunitySavedPost"("postId");
CREATE INDEX "CommunityReport_postId_idx" ON "CommunityReport"("postId");
CREATE INDEX "CommunityReport_commentId_idx" ON "CommunityReport"("commentId");
CREATE INDEX "CommunityReport_reporterId_idx" ON "CommunityReport"("reporterId");
CREATE INDEX "CommunityReport_status_idx" ON "CommunityReport"("status");
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE INDEX "ModeratorActivityLog_adminUserId_idx" ON "ModeratorActivityLog"("adminUserId");
CREATE INDEX "ModeratorActivityLog_targetEntity_targetEntityId_idx" ON "ModeratorActivityLog"("targetEntity", "targetEntityId");
CREATE INDEX "ModeratorActivityLog_createdAt_idx" ON "ModeratorActivityLog"("createdAt");
CREATE INDEX "ModeratorInternalNote_adminUserId_idx" ON "ModeratorInternalNote"("adminUserId");
CREATE INDEX "ModeratorInternalNote_targetEntity_targetEntityId_idx" ON "ModeratorInternalNote"("targetEntity", "targetEntityId");
CREATE INDEX "AnalyticsEvent_userId_idx" ON "AnalyticsEvent"("userId");
CREATE INDEX "AnalyticsEvent_sessionId_idx" ON "AnalyticsEvent"("sessionId");
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");
CREATE INDEX "AnalyticsEvent_entityType_entityId_idx" ON "AnalyticsEvent"("entityType", "entityId");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");
CREATE UNIQUE INDEX "UserOnboardingPreference_userId_key" ON "UserOnboardingPreference"("userId");
CREATE INDEX "UserApplication_userId_status_idx" ON "UserApplication"("userId", "status");
CREATE INDEX "UserApplication_universityId_idx" ON "UserApplication"("universityId");
CREATE INDEX "UserApplication_applicationDeadline_idx" ON "UserApplication"("applicationDeadline");
CREATE INDEX "UserDocument_userId_status_idx" ON "UserDocument"("userId", "status");
CREATE INDEX "UserDocument_applicationId_idx" ON "UserDocument"("applicationId");
CREATE INDEX "UserDocument_checklistItemId_idx" ON "UserDocument"("checklistItemId");
CREATE INDEX "UserDocument_expirationDate_idx" ON "UserDocument"("expirationDate");
CREATE INDEX "CalendarEvent_userId_startDate_idx" ON "CalendarEvent"("userId", "startDate");
CREATE INDEX "CalendarEvent_eventType_idx" ON "CalendarEvent"("eventType");
CREATE INDEX "CalendarEvent_status_idx" ON "CalendarEvent"("status");
CREATE INDEX "CalendarEvent_applicationId_idx" ON "CalendarEvent"("applicationId");

ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityComment" ADD CONSTRAINT "CommunityComment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "CommunityComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CommunityLike" ADD CONSTRAINT "CommunityLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityLike" ADD CONSTRAINT "CommunityLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunitySavedPost" ADD CONSTRAINT "CommunitySavedPost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunitySavedPost" ADD CONSTRAINT "CommunitySavedPost_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_postId_fkey" FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "CommunityComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommunityReport" ADD CONSTRAINT "CommunityReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModeratorActivityLog" ADD CONSTRAINT "ModeratorActivityLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModeratorInternalNote" ADD CONSTRAINT "ModeratorInternalNote_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserOnboardingPreference" ADD CONSTRAINT "UserOnboardingPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserApplication" ADD CONSTRAINT "UserApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserApplication" ADD CONSTRAINT "UserApplication_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "UserApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "UserDocument" ADD CONSTRAINT "UserDocument_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "StudentUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "UserApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ChecklistItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
