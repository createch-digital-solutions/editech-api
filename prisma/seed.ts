import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  PrismaClient,
  Role,
  UserStatus,
  SkillLevel,
  InstructorStatus,
  CourseStatus,
  LessonType,
  EnrolmentStatus,
} from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';

// Modular seed data imports
import { xpConfigsData, badgesData } from './data/gamification.data.js';
import { instructorsData } from './data/instructors.data.js';
import { coursesData } from './data/courses.data.js';
import { reviewsData } from './data/reviews.data.js';

// Ensure .env is resolved regardless of the caller's working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/createch_db?schema=public';

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting modular database seed for Createch Learning Marketplace...');
  console.log(`📡 Database target: ${connectionString.split('@')[1]?.split('?')[0] || 'localhost'}`);

  // 1. Seed XP Configurations
  console.log('⚡ Seeding XP configuration rules...');
  for (const cfg of xpConfigsData) {
    await prisma.xpConfig.upsert({
      where: { action: cfg.action },
      update: { xpValue: cfg.xpValue },
      create: cfg,
    });
  }
  console.log(`✓ Seeded ${xpConfigsData.length} XP configuration rules.`);

  // 2. Seed Achievement Badges
  console.log('🏅 Seeding achievement badges...');
  const seededBadges: Record<string, string> = {};
  for (const b of badgesData) {
    const badge = await prisma.badge.upsert({
      where: { name: b.name },
      update: { description: b.description, xpBonus: b.xpBonus },
      create: b,
    });
    seededBadges[b.name] = badge.id;
  }
  console.log(`✓ Seeded ${badgesData.length} achievement badges.`);

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
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`✓ Seeded admin user: ${admin.email}`);

  // 4. Seed Instructors
  console.log('👨‍🏫 Seeding expert instructors...');
  const instructorProfiles: Record<string, string> = {};

  for (const inst of instructorsData) {
    const user = await prisma.user.upsert({
      where: { email: inst.email },
      update: {
        firstName: inst.firstName,
        lastName: inst.lastName,
        avatarUrl: inst.avatarUrl,
      },
      create: {
        email: inst.email,
        clerkId: inst.clerkId,
        firstName: inst.firstName,
        lastName: inst.lastName,
        avatarUrl: inst.avatarUrl,
        role: Role.INSTRUCTOR,
        status: UserStatus.ACTIVE,
      },
    });

    const profile = await prisma.instructorProfile.upsert({
      where: { userId: user.id },
      update: {
        bio: inst.bio,
        expertise: inst.expertise,
        totalStudents: inst.totalStudents,
        totalRevenue: inst.totalRevenue,
        averageRating: inst.averageRating,
      },
      create: {
        userId: user.id,
        bio: inst.bio,
        expertise: inst.expertise,
        status: InstructorStatus.APPROVED,
        paystackRecipientCode: `RCP_${inst.firstName.toLowerCase()}_demo`,
        totalStudents: inst.totalStudents,
        totalRevenue: inst.totalRevenue,
        averageRating: inst.averageRating,
      },
    });

    instructorProfiles[inst.email] = profile.id;
  }
  console.log(`✓ Seeded ${instructorsData.length} instructors with full profiles.`);

  // 5. Seed Demo Learner
  const demoLearner = await prisma.user.upsert({
    where: { email: 'learner@createch.example.com' },
    update: {
      firstName: 'Chidi',
      lastName: 'Okonkwo',
    },
    create: {
      email: 'learner@createch.example.com',
      clerkId: 'user_learner_demo_seed',
      firstName: 'Chidi',
      lastName: 'Okonkwo',
      role: Role.LEARNER,
      status: UserStatus.ACTIVE,
    },
  });

  await prisma.learnerProfile.upsert({
    where: { userId: demoLearner.id },
    update: {
      totalXp: 850,
      currentLevel: 4,
      streakDays: 7,
    },
    create: {
      userId: demoLearner.id,
      careerGoal: 'Senior Full-Stack AI Engineer',
      skillLevel: SkillLevel.INTERMEDIATE,
      interests: ['Web Development', 'AI & Machine Learning', 'UI/UX Design'],
      totalXp: 850,
      currentLevel: 4,
      streakDays: 7,
      lastActive: new Date(),
    },
  });

  await prisma.streakRecord.upsert({
    where: { learnerId: demoLearner.id },
    update: { currentStreak: 7, longestStreak: 14, lastActive: new Date() },
    create: {
      learnerId: demoLearner.id,
      currentStreak: 7,
      longestStreak: 14,
      lastActive: new Date(),
    },
  });

  if (seededBadges['Quick Starter']) {
    await prisma.learnerBadge.upsert({
      where: {
        learnerId_badgeId: {
          learnerId: demoLearner.id,
          badgeId: seededBadges['Quick Starter'],
        },
      },
      update: {},
      create: {
        learnerId: demoLearner.id,
        badgeId: seededBadges['Quick Starter'],
      },
    });
  }

  // 6. Seed Courses, Sections & Lessons with Playable Videos
  console.log('📚 Seeding course catalogue & curricula with playable video streams...');
  const createdCourses: Record<string, string> = {};

  for (const c of coursesData) {
    const instructorProfileId = instructorProfiles[c.instructorEmail];
    if (!instructorProfileId) {
      console.warn(`⚠️ Instructor profile missing for ${c.instructorEmail}, skipping course ${c.slug}`);
      continue;
    }

    let totalLessonsCount = 0;
    let totalDurationSeconds = 0;
    for (const sec of c.sections) {
      totalLessonsCount += sec.lessons.length;
      for (const l of sec.lessons) {
        totalDurationSeconds += l.videoDuration;
      }
    }

    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        description: c.description,
        thumbnailUrl: c.thumbnailUrl,
        level: c.level,
        category: c.category,
        outcomeTag: c.outcomeTag,
        tags: c.tags,
        price: c.price,
        isFree: c.isFree,
        status: CourseStatus.PUBLISHED,
        totalLessons: totalLessonsCount,
        totalDuration: Math.round(totalDurationSeconds / 60),
        enrolmentCount: c.enrolmentCount,
        averageRating: c.averageRating,
        reviewCount: c.reviewCount,
        isFeatured: c.isFeatured,
        publishedAt: new Date(),
      },
      create: {
        instructorId: instructorProfileId,
        title: c.title,
        slug: c.slug,
        description: c.description,
        thumbnailUrl: c.thumbnailUrl,
        level: c.level,
        category: c.category,
        outcomeTag: c.outcomeTag,
        tags: c.tags,
        price: c.price,
        isFree: c.isFree,
        status: CourseStatus.PUBLISHED,
        totalLessons: totalLessonsCount,
        totalDuration: Math.round(totalDurationSeconds / 60),
        enrolmentCount: c.enrolmentCount,
        averageRating: c.averageRating,
        reviewCount: c.reviewCount,
        isFeatured: c.isFeatured,
        publishedAt: new Date(),
      },
    });

    createdCourses[c.slug] = course.id;

    for (const sec of c.sections) {
      const section = await prisma.courseSection.upsert({
        where: {
          courseId_position: {
            courseId: course.id,
            position: sec.position,
          },
        },
        update: { title: sec.title },
        create: {
          courseId: course.id,
          title: sec.title,
          position: sec.position,
        },
      });

      for (const l of sec.lessons) {
        const existingLesson = await prisma.lesson.findFirst({
          where: {
            sectionId: section.id,
            position: l.position,
          },
        });

        if (existingLesson) {
          await prisma.lesson.update({
            where: { id: existingLesson.id },
            data: {
              title: l.title,
              type: l.type || LessonType.VIDEO,
              videoUrl: l.videoUrl,
              videoDuration: l.videoDuration,
              content: l.content,
              isPreview: l.isPreview || false,
              isPublished: true,
            },
          });
        } else {
          await prisma.lesson.create({
            data: {
              courseId: course.id,
              sectionId: section.id,
              title: l.title,
              position: l.position,
              type: l.type || LessonType.VIDEO,
              videoUrl: l.videoUrl,
              videoDuration: l.videoDuration,
              content: l.content,
              isPreview: l.isPreview || false,
              isPublished: true,
            },
          });
        }
      }
    }

    console.log(`✓ Seeded course "${c.title}" (${c.slug}) with ${c.sections.length} sections and ${totalLessonsCount} lessons.`);
  }

  // 7. Seed Reviews
  console.log('⭐ Seeding course reviews...');
  for (const rev of reviewsData) {
    const courseId = createdCourses[rev.courseSlug];
    if (courseId) {
      await prisma.courseReview.upsert({
        where: {
          courseId_learnerId: {
            courseId,
            learnerId: demoLearner.id,
          },
        },
        update: {
          rating: rev.rating,
          reviewText: rev.reviewText,
        },
        create: {
          courseId,
          learnerId: demoLearner.id,
          rating: rev.rating,
          reviewText: rev.reviewText,
        },
      });
    }
  }
  console.log(`✓ Seeded ${reviewsData.length} reviews.`);

  // 8. Enrollments & Certificates
  console.log('🎓 Seeding active enrollments & progress for learners...');
  const existingLearners = await prisma.user.findMany({
    where: { role: Role.LEARNER },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  const learnersToSeed = [demoLearner, ...existingLearners.filter((u) => u.id !== demoLearner.id)];

  for (const learner of learnersToSeed) {
    await prisma.learnerProfile.upsert({
      where: { userId: learner.id },
      update: {
        totalXp: 950,
        currentLevel: 4,
        streakDays: 6,
      },
      create: {
        userId: learner.id,
        careerGoal: 'Full-Stack Developer',
        skillLevel: SkillLevel.INTERMEDIATE,
        interests: ['Web Development', 'AI & Machine Learning'],
        totalXp: 950,
        currentLevel: 4,
        streakDays: 6,
        lastActive: new Date(),
      },
    });

    await prisma.streakRecord.upsert({
      where: { learnerId: learner.id },
      update: { currentStreak: 6, longestStreak: 12, lastActive: new Date() },
      create: {
        learnerId: learner.id,
        currentStreak: 6,
        longestStreak: 12,
        lastActive: new Date(),
      },
    });

    const reactCourseId = createdCourses['react-for-beginners'];
    if (reactCourseId) {
      await prisma.enrolment.upsert({
        where: {
          learnerId_courseId: {
            learnerId: learner.id,
            courseId: reactCourseId,
          },
        },
        update: {
          status: EnrolmentStatus.ACTIVE,
          progress: 60.0,
        },
        create: {
          learnerId: learner.id,
          courseId: reactCourseId,
          status: EnrolmentStatus.ACTIVE,
          progress: 60.0,
        },
      });
    }

    const uiuxCourseId = createdCourses['ui-ux-design-systems'];
    if (uiuxCourseId) {
      const enrolment = await prisma.enrolment.upsert({
        where: {
          learnerId_courseId: {
            learnerId: learner.id,
            courseId: uiuxCourseId,
          },
        },
        update: {
          status: EnrolmentStatus.COMPLETED,
          progress: 100.0,
          completedAt: new Date(),
        },
        create: {
          learnerId: learner.id,
          courseId: uiuxCourseId,
          status: EnrolmentStatus.COMPLETED,
          progress: 100.0,
          completedAt: new Date(),
        },
      });

      const certUid = `CRT-UIUX-${learner.id.slice(0, 8).toUpperCase()}`;
      await prisma.certificate.upsert({
        where: { certificateUid: certUid },
        update: {},
        create: {
          learnerId: learner.id,
          courseId: uiuxCourseId,
          enrolmentId: enrolment.id,
          certificateUid: certUid,
          learnerName: `${learner.firstName || 'Learner'} ${learner.lastName || ''}`.trim(),
          courseTitle: 'UI/UX Design Systems: From Wireframe to Design Tokens',
          instructorName: 'Chidi Eze',
          pdfUrl: `https://pub-r2.editech.internal/certificates/${enrolment.id}.pdf`,
        },
      });
    }

    const aiCourseId = createdCourses['ai-engineering-with-python'];
    if (aiCourseId) {
      await prisma.enrolment.upsert({
        where: {
          learnerId_courseId: {
            learnerId: learner.id,
            courseId: aiCourseId,
          },
        },
        update: {
          status: EnrolmentStatus.ACTIVE,
          progress: 20.0,
        },
        create: {
          learnerId: learner.id,
          courseId: aiCourseId,
          status: EnrolmentStatus.ACTIVE,
          progress: 20.0,
        },
      });
    }
  }
  console.log(`✓ Seeded enrollments, certificates, and dashboard stats across ${learnersToSeed.length} learners.`);

  console.log('🎉 Database seeding completed with 100% success!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
