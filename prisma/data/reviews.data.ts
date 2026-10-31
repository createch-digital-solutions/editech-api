export interface ReviewSeed {
  courseSlug: string;
  rating: number;
  reviewText: string;
}

export const reviewsData: ReviewSeed[] = [
  {
    courseSlug: 'react-for-beginners',
    rating: 5,
    reviewText:
      'Hands down the clearest explanation of React 19 and custom hooks I have ever seen. Built my portfolio project in a weekend!',
  },
  {
    courseSlug: 'react-for-beginners',
    rating: 5,
    reviewText:
      'Kofi explains complex frontend concepts with remarkable clarity. The capstone project was incredibly relevant to real work.',
  },
  {
    courseSlug: 'ai-engineering-with-python',
    rating: 5,
    reviewText:
      'The RAG architecture module alone is worth ten times the price. Everything is grounded in production realities.',
  },
  {
    courseSlug: 'ui-ux-design-systems',
    rating: 5,
    reviewText:
      'I cannot believe this course is free. The design token handoff section completely transformed how our team works.',
  },
  {
    courseSlug: 'full-stack-ai-engineering',
    rating: 5,
    reviewText:
      'Superb full-stack architecture. Connecting Next.js edge with NestJS queues is the exact stack we use at my company.',
  },
  {
    courseSlug: 'nodejs-fundamentals',
    rating: 5,
    reviewText:
      'NestJS dependency injection and Prisma migrations finally clicked. Highly recommend for any backend learner.',
  },
  {
    courseSlug: 'devops-with-docker',
    rating: 5,
    reviewText:
      'Alex makes Kubernetes and containerization feel approachable without skipping production security best practices.',
  },
];
