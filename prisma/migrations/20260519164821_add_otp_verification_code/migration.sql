-- CreateTable
CREATE TABLE "OtpVerificationCode" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OtpVerificationCode_phone_createdAt_idx" ON "OtpVerificationCode"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "OtpVerificationCode_expiresAt_idx" ON "OtpVerificationCode"("expiresAt");
