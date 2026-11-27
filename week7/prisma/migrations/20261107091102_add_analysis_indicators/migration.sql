-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "encryptedNotes" TEXT;

-- CreateTable
CREATE TABLE "AnalysisIndicator" (
    "id" UUID NOT NULL,
    "analysisId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isAlert" BOOLEAN NOT NULL DEFAULT false,
    "detail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalysisIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AnalysisIndicator_analysisId_idx" ON "AnalysisIndicator"("analysisId");

-- AddForeignKey
ALTER TABLE "AnalysisIndicator" ADD CONSTRAINT "AnalysisIndicator_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "Analysis"("id") ON DELETE CASCADE ON UPDATE CASCADE;
