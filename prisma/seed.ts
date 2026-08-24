import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/createch_db?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial foundational data...');

  // TODO: Expand seed data with full demo courses and curricula in Phase 6
  const dummyUser = await prisma.user.upsert({
    where: { email: 'admin@createch.example.com' },
    update: {},
    create: {
      email: 'admin@createch.example.com',
      firstName: 'Createch',
      lastName: 'Admin',
      role: Role.ADMIN,
      clerkId: 'user_dummy_admin_seed',
    },
  });

  console.log(`Seeded dummy user: ${dummyUser.email} (${dummyUser.id})`);
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
