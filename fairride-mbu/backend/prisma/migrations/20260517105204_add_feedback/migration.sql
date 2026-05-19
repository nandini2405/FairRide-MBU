-- CreateTable
CREATE TABLE "Feedback" (
    "id" SERIAL NOT NULL,
    "rideId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "tags" TEXT[],
    "comment" TEXT,
    "tip" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_rideId_key" ON "Feedback"("rideId");

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_rideId_fkey" FOREIGN KEY ("rideId") REFERENCES "Ride"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
