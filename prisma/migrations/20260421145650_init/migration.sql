-- CreateTable
CREATE TABLE "CsvFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "transactions" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "CsvFile_userId_idx" ON "CsvFile"("userId");
