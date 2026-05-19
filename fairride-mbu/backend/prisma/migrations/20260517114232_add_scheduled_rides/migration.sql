-- CreateTable
CREATE TABLE "ScheduledRide" (
    "id" SERIAL NOT NULL,
    "riderId" INTEGER NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'MBU Campus',
    "destination" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledRide_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduledRide" ADD CONSTRAINT "ScheduledRide_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
