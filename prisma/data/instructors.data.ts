export interface InstructorSeed {
  email: string;
  clerkId: string;
  firstName: string;
  lastName: string;
  bio: string;
  expertise: string[];
  avatarUrl: string;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
}

export const instructorsData: InstructorSeed[] = [
  {
    email: 'kofi.mensah@createch.example.com',
    clerkId: 'user_kofi_mensah_seed',
    firstName: 'Kofi',
    lastName: 'Mensah',
    bio: 'Principal Frontend Architect & Google Developer Expert with 12+ years building enterprise React & TypeScript systems.',
    expertise: ['React', 'Next.js', 'TypeScript', 'Web Architecture'],
    avatarUrl: '/avatars/kofi.jpg',
    totalStudents: 3420,
    totalRevenue: 684000.0,
    averageRating: 4.8,
  },
  {
    email: 'amina.bello@createch.example.com',
    clerkId: 'user_amina_bello_seed',
    firstName: 'Dr. Amina',
    lastName: 'Bello',
    bio: 'AI Research Scientist & Ex-Google Brain Fellow. Specializes in LLM fine-tuning, RAG pipelines, and PyTorch.',
    expertise: ['AI Engineering', 'Python', 'Machine Learning', 'RAG', 'PyTorch'],
    avatarUrl: '/avatars/amina.jpg',
    totalStudents: 2890,
    totalRevenue: 865000.0,
    averageRating: 4.95,
  },
  {
    email: 'bola.james@createch.example.com',
    clerkId: 'user_bola_james_seed',
    firstName: 'Bola',
    lastName: 'James',
    bio: 'Senior Backend Engineer & Open-Source Node.js Contributor. Passionate about scalable distributed microservices.',
    expertise: ['Node.js', 'NestJS', 'PostgreSQL', 'Redis', 'Microservices'],
    avatarUrl: '/avatars/bola.jpg',
    totalStudents: 2150,
    totalRevenue: 430000.0,
    averageRating: 4.75,
  },
  {
    email: 'chidi.eze@createch.example.com',
    clerkId: 'user_chidi_eze_seed',
    firstName: 'Chidi',
    lastName: 'Eze',
    bio: 'Staff Product Designer & Design Systems Lead. Designed design systems for fintech unicorns across the EMEA region.',
    expertise: ['Figma', 'Design Systems', 'UI/UX', 'Interaction Design'],
    avatarUrl: '/avatars/chidi.jpg',
    totalStudents: 4100,
    totalRevenue: 0.0,
    averageRating: 4.88,
  },
  {
    email: 'alex.chen@createch.example.com',
    clerkId: 'user_alex_chen_seed',
    firstName: 'Alex',
    lastName: 'Chen',
    bio: 'Cloud Architect & Kubernetes Specialist. Certified Kubernetes Administrator (CKA) with 10+ years in cloud-native DevOps.',
    expertise: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
    avatarUrl: '/avatars/alex.jpg',
    totalStudents: 1420,
    totalRevenue: 512000.0,
    averageRating: 4.9,
  },
  {
    email: 'ada.lovelace@createch.example.com',
    clerkId: 'user_ada_lovelace_seed',
    firstName: 'Ada',
    lastName: 'Lovelace',
    bio: 'Lead Systems Architect & Full-Stack AI Engineer. Pioneering AI-assisted developer platforms and Next.js 15 apps.',
    expertise: ['Next.js', 'NestJS', 'Prisma', 'Anthropic', 'OpenAI'],
    avatarUrl: '/avatars/ada.jpg',
    totalStudents: 1980,
    totalRevenue: 742000.0,
    averageRating: 4.95,
  },
];
