CREATE TABLE "University" (
  "id" SERIAL NOT NULL,
  "name" TEXT NOT NULL,
  "koreanName" TEXT,
  "city" TEXT NOT NULL,
  "country" TEXT NOT NULL DEFAULT 'South Korea',
  "qsRanking" INTEGER,
  "qsRankingYear" INTEGER,
  "rankingSourceNote" TEXT,
  "officialWebsite" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "logoUrl" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "programs" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "tuitionMin" INTEGER,
  "tuitionMax" INTEGER,
  "tuitionCurrency" TEXT NOT NULL DEFAULT 'KRW',
  "admissionRequirements" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "languagesOfInstruction" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "scholarshipInfo" TEXT,
  "hasScholarships" BOOLEAN NOT NULL DEFAULT false,
  "housingInfo" TEXT,
  "internationalStudentInfo" TEXT,
  "applicationDeadlines" JSONB,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "contactAddress" TEXT,
  "mainColor" TEXT NOT NULL DEFAULT '#15397F',
  "acceptanceRate" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminUser" (
  "id" SERIAL NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "University_name_key" ON "University"("name");
CREATE UNIQUE INDEX "University_officialWebsite_key" ON "University"("officialWebsite");
CREATE INDEX "University_city_idx" ON "University"("city");
CREATE INDEX "University_country_idx" ON "University"("country");
CREATE INDEX "University_qsRanking_idx" ON "University"("qsRanking");
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
