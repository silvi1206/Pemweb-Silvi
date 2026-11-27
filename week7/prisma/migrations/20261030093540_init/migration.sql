-- CreateTable
CREATE TABLE "Analysis" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "isSafe" BOOLEAN NOT NULL,
    "recommendation" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "hmac" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);
