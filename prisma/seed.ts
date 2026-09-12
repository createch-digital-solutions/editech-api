import { PrismaClient, Role } from '@prisma/client';
import { PrismaClient, Role, UserStatus, SkillLevel, InstructorStatus, CourseStatus, CourseLevel, OutcomeTag, LessonType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/createch_db?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial foundational data...');
  console.log('🌱 Seeding initial Phase 13 database design data...');

  // TODO: Expand seed data with full demo courses and curricula in Phase 6
  const dummyUser = await prisma.user.upsert({
  // 1. Seed XP Configuration
  const xpConfigs = [
    { action: 'LESSON_COMPLETE', xpValue: 50 },
    { action: 'QUIZ_PASS', xpValue: 100 },
    { action: 'DAILY_STREAK', xpValue: 20 },
    { action: 'COURSE_COMPLETE', xpValue: 500 },
    { action: 'DISCUSSION_POST', xpValue: 10 },
  ];

  for (const cfg of xpConfigs) {
    await prisma.xpConfig.upsert({
      where: { action: cfg.action },
      update: { xpValue: cfg.xpValue },
      create: cfg,
    });
  }
  console.log(`✓ Seeded ${xpConfigs.length} XP configuration rules.`);

  // 2. Seed Badges
  const badges = [
    {
      name: 'Quick Starter',
      description: 'Completed your first lesson on Createch.',
      iconUrl: '/badges/quick-starter.svg',
      triggerType: 'FIRST_LESSON',
      xpBonus: 50,
    },
    {
      name: 'Streak Champion',
      description: 'Maintained a 7-day continuous learning streak.',
      iconUrl: '/badges/streak-champion.svg',
      triggerType: 'STREAK_7_DAYS',
      xpBonus: 200,
    },
    {
      name: 'Quiz Master',
      description: 'Achieved a perfect score on any lesson quiz.',
      iconUrl: '/badges/quiz-master.svg',
      triggerType: 'PERFECT_QUIZ',
      xpBonus: 150,
    },
    {
      name: 'Certified Graduate',
      description: 'Successfully finished an entire course and earned a certificate.',
      iconUrl: '/badges/graduate.svg',
      triggerType: 'COURSE_COMPLETE',
      xpBonus: 500,
    },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: { description: b.description, xpBonus: b.xpBonus },
      create: b,
    });
  }
  console.log(`✓ Seeded ${badges.length} achievement badges.`);

  // 3. Seed Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@createch.example.com' },
    update: {},
    create: {
      email: 'admin@createch.example.com',
      clerkId: 'user_admin_demo_seed',
      firstName: 'Createch',
      lastName: 'Admin',
      role: Role.ADMIN,
      clerkId: 'user_dummy_admin_seed',
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`✓ Seeded admin user: ${admin.email}`);

  console.log(`Seeded dummy user: ${dummyUser.email} (${dummyUser.id})`);
  // 4. Seed Instructor User & Profile
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@createch.example.com' },
    update: {},
    create: {
      email: 'instructor@createch.example.com',
      clerkId: 'user_instructor_demo_seed',
      firstName: 'Ada',
      lastName: 'Lovelace',
      role: Role.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      instructorProfile: {
        create: {
          bio: 'Senior Software Architect & AI Researcher with 10+ years experience building production LLM apps.',
          expertise: ['TypeScript', 'Next.js', 'NestJS', 'PostgreSQL', 'AI Engineering'],
          status: InstructorStatus.APPROVED,
          paystackRecipientCode: 'RCP_dummy_instructor_seed',
          totalStudents: 142,
          totalRevenue: 284000.0,
          averageRating: 4.9,
        },
      },
    },
    include: { instructorProfile: true },
  });
  console.log(`✓ Seeded instructor user & profile: ${instructor.email}`);

  // 5. Seed Learner User & Profile
  const learner = await prisma.user.upsert({
    where: { email: 'learner@createch.example.com' },
    update: {},
    create: {
      email: 'learner@createch.example.com',
      clerkId: 'user_learner_demo_seed',
      firstName: 'Chidi',
      lastName: 'Okonkwo',
      role: Role.LEARNER,
      status: UserStatus.ACTIVE,
      learnerProfile: {
        create: {
          careerGoal: 'Full-Stack AI Engineer',
          skillLevel: SkillLevel.INTERMEDIATE,
          interests: ['Full-Stack', 'AI', 'Cloud Architecture'],
          totalXp: 450,
          currentLevel: 3,
          streakDays: 5,
        },
      },
      streakRecord: {
        create: {
          currentStreak: 5,
          longestStreak: 12,
        },
      },
    },
    include: { learnerProfile: true, streakRecord: true },
  });
  console.log(`✓ Seeded learner user, profile & streak: ${learner.email}`);

  // 6. Seed Sample Course
  if (instructor.instructorProfile) {
    const course = await prisma.course.upsert({
      where: { slug: 'full-stack-ai-engineering' },
      update: {},
      create: {
        instructorId: instructor.instructorProfile.id,
        title: 'Full-Stack AI Engineering with Next.js & NestJS',
        slug: 'full-stack-ai-engineering',
        description:
          'Master modern AI web development: build scalable LLM-driven applications from architecture to deployment.',
        thumbnailUrl: '/courses/ai-engineering-thumb.jpg',
        level: CourseLevel.INTERMEDIATE,
        category: 'Software Engineering',
        outcomeTag: OutcomeTag.GET_A_JOB,
        tags: ['Next.js', 'NestJS', 'Prisma', 'OpenAI', 'TypeScript'],
        price: 25000.0,
        isFree: false,
        status: CourseStatus.PUBLISHED,
        totalLessons: 4,
        totalDuration: 180,
        enrolmentCount: 24,
        averageRating: 4.95,
        reviewCount: 18,
        isFeatured: true,
        publishedAt: new Date(),
        sections: {
          create: [
            {
              title: 'Module 1: System Architecture & Identity',
              position: 1,
              lessons: {
                create: [
                  {
                    title: '1.1 Decoupling Identity with Clerk and NestJS',
                    position: 1,
                    type: LessonType.VIDEO,
                    videoUrl: 'https://cdn.createch.example.com/videos/lesson1.mp4',
                    videoDuration: 45,
                    isPreview: true,
                    isPublished: true,
                    content: 'Learn how to architect modern authentication using Clerk JWT session tokens and NestJS resource server guards.',
                  },
                  {
                    title: '1.2 Database Design & High-Performance UUIDv7',
                    position: 2,
                    type: LessonType.VIDEO,
                    videoUrl: 'https://cdn.createch.example.com/videos/lesson2.mp4',
                    videoDuration: 55,
                    isPreview: false,
                    isPublished: true,
                    content: 'Deep dive into UUIDv7 time-ordered indexing and PostgreSQL relational modeling.',
                  },
                ],
              },
            },
          ],
        },
      },
    });
    console.log(`✓ Seeded sample course: "${course.title}" (${course.slug})`);
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
