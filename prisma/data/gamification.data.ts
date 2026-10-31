export interface XpConfigSeed {
  action: string;
  xpValue: number;
}

export interface BadgeSeed {
  name: string;
  description: string;
  iconUrl: string;
  triggerType: string;
  xpBonus: number;
}

export const xpConfigsData: XpConfigSeed[] = [
  { action: 'LESSON_COMPLETE', xpValue: 50 },
  { action: 'QUIZ_PASS', xpValue: 100 },
  { action: 'DAILY_STREAK', xpValue: 20 },
  { action: 'COURSE_COMPLETE', xpValue: 500 },
  { action: 'DISCUSSION_POST', xpValue: 10 },
  { action: 'FIRST_LOGIN', xpValue: 30 },
];

export const badgesData: BadgeSeed[] = [
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
    description: 'Successfully finished an entire course and earned an industry certificate.',
    iconUrl: '/badges/graduate.svg',
    triggerType: 'COURSE_COMPLETE',
    xpBonus: 500,
  },
  {
    name: 'Consistent Learner',
    description: 'Studied for 14 consecutive days without breaking streak.',
    iconUrl: '/badges/consistent.svg',
    triggerType: 'STREAK_14_DAYS',
    xpBonus: 350,
  },
];
