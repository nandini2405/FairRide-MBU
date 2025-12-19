import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database data (DriverProfile, User)...');
  // Order matters: remove dependent rows first
  await prisma.driverProfile.deleteMany();
  await prisma.user.deleteMany();
  console.log('Done.');
}

main()
  .catch((e) => { console.error('Failed to clear DB:', e?.message || e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });

