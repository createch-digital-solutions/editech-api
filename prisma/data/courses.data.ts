import { CourseLevel, OutcomeTag, LessonType } from '@prisma/client';

export interface SeedLesson {
  title: string;
  position: number;
  type?: LessonType;
  videoUrl?: string;
  videoDuration: number; // in seconds
  isPreview?: boolean;
  content: string;
}

export interface SeedSection {
  title: string;
  position: number;
  lessons: SeedLesson[];
}

export interface SeedCourse {
  instructorEmail: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string;
  level: CourseLevel;
  category: string;
  outcomeTag: OutcomeTag;
  tags: string[];
  price: number;
  isFree: boolean;
  averageRating: number;
  reviewCount: number;
  enrolmentCount: number;
  isFeatured: boolean;
  sections: SeedSection[];
}

// User-provided UI/UX Google Drive video streams
const driveVideos = {
  v1: 'https://drive.google.com/file/d/15wx-mLjhW8G2VjJNR2tG-x0ZCI2ENNM_/preview',
  v2: 'https://drive.google.com/file/d/1NGps4qF6MDWsFjleI0ue3LGf-PeIpohe/preview',
  v3: 'https://drive.google.com/file/d/1vByExxcWZEoEk4dPirbAzn4jUEvf-oGo/preview',
  v4: 'https://drive.google.com/file/d/1A_thSPJuOCYmiAg69SbdaZXvcCMT5Ajq/preview',
  v5: 'https://drive.google.com/file/d/1XCs7zVguQHwJVvPu_xkJxePMrppp5sWV/preview',
  v6: 'https://drive.google.com/file/d/1GRwajJreKt-AmcRyHXw5kNrIc1s6NaFS/preview',
  v7: 'https://drive.google.com/file/d/1GIHmWvR0Iq5nnU8wPzPTq4KHOF00cnmh/preview',
  v8: 'https://drive.google.com/file/d/1jH1IA_OgLrDiioNiURGS-b8NYZ48Zjqh/preview',
  v9: 'https://drive.google.com/file/d/1qJhk0rTHpbyk5g6CF9zGD6yPX86mT07h/preview',
};

// Global direct MP4 streams for full HTML5 playback
const directVideos = {
  bunny: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  elephants: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  blazes: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  escapes: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  fun: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  joy: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyblazes.mp4',
  meltdowns: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  sintel: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  tears: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  subaru: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
};

export const coursesData: SeedCourse[] = [
  // 1. UI/UX DESIGN SYSTEMS (WIRED DIRECTLY TO THE USER'S PROVIDED DRIVE VIDEOS)
  {
    instructorEmail: 'chidi.eze@createch.example.com',
    title: 'UI/UX Design Systems: From Wireframe to Design Tokens',
    slug: 'ui-ux-design-systems',
    description:
      'Free comprehensive workshop on architecting enterprise Figma design systems. Master typography scales, color tokenization, component variants, auto-layout, and seamless designer-developer handoff.',
    thumbnailUrl: '/learner/course-uiux.jpg',
    level: CourseLevel.BEGINNER,
    category: 'UI/UX Design',
    outcomeTag: OutcomeTag.START_FREELANCING,
    tags: ['Figma', 'UI/UX', 'Design Systems', 'Design Tokens', 'Frontend Design'],
    price: 0.0,
    isFree: true,
    averageRating: 4.88,
    reviewCount: 46,
    enrolmentCount: 3200,
    isFeatured: true,
    sections: [
      {
        title: 'Module 1: Atomic Foundations & Visual Design Tokens',
        position: 1,
        lessons: [
          {
            title: '1.1 Design System Principles & Semantic Color Tokens',
            position: 1,
            videoUrl: driveVideos.v1,
            videoDuration: 640,
            isPreview: true,
            content:
              'The core philosophy of design tokens: organizing colors, typography scales, spacing units, and elevations into reusable design foundations in Figma.',
          },
          {
            title: '1.2 Advanced Auto-Layout & Responsive Constraints',
            position: 2,
            videoUrl: driveVideos.v2,
            videoDuration: 820,
            isPreview: true,
            content:
              'Build resilient layouts that scale effortlessly across mobile, tablet, and widescreen desktop viewports using Figma Auto-Layout 5.',
          },
          {
            title: '1.3 Typography Hierarchies & Fluid Type Scales',
            position: 3,
            videoUrl: driveVideos.v3,
            videoDuration: 750,
            isPreview: true,
            content:
              'Architecting mathematical font scales (Major Third, Perfect Fourth) with responsive line-height and letter-spacing pairings.',
          },
        ],
      },
      {
        title: 'Module 2: Interactive Components & Component Sets',
        position: 2,
        lessons: [
          {
            title: '2.1 Component Variants, Boolean Props & Slot Patterns',
            position: 1,
            videoUrl: driveVideos.v4,
            videoDuration: 890,
            isPreview: false,
            content:
              'Constructing robust button and input component sets with hover, active, focused, disabled, and loading states.',
          },
          {
            title: '2.2 Complex Form Controls & Interactive Prototyping',
            position: 2,
            videoUrl: driveVideos.v5,
            videoDuration: 910,
            isPreview: false,
            content:
              'Building accessible dropdowns, switches, checkbox grids, and multi-step stepper components with micro-interactions.',
          },
          {
            title: '2.3 Dark Mode Theming & Multi-Brand Token Systems',
            position: 3,
            videoUrl: driveVideos.v6,
            videoDuration: 860,
            isPreview: false,
            content:
              'Implementing multi-theme modes in Figma with variable collections, aliasing semantic tokens across light and dark palettes.',
          },
        ],
      },
      {
        title: 'Module 3: Designer-Developer Handoff & Code Integration',
        position: 3,
        lessons: [
          {
            title: '3.1 Exporting Tokens to Tailwind CSS & CSS Variables',
            position: 1,
            videoUrl: driveVideos.v7,
            videoDuration: 930,
            isPreview: false,
            content:
              'Bridge the gap between design and code: automatically generate CSS variables and Tailwind theme configurations from Figma tokens.',
          },
          {
            title: '3.2 Component Documentation & Storybook Sync',
            position: 2,
            videoUrl: driveVideos.v8,
            videoDuration: 800,
            isPreview: false,
            content:
              'Setting up zeroheight style guides and syncing component specifications directly with frontend engineer Storybooks.',
          },
          {
            title: '3.3 Final Capstone: Enterprise Fintech Design System',
            position: 3,
            videoUrl: driveVideos.v9,
            videoDuration: 1250,
            isPreview: false,
            content:
              'Complete walkthrough review of an end-to-end banking design system ready for production engineering deployment.',
          },
        ],
      },
    ],
  },

  // 2. REACT FOR BEGINNERS
  {
    instructorEmail: 'kofi.mensah@createch.example.com',
    title: 'React for Beginners: Modern Frontend Architecture',
    slug: 'react-for-beginners',
    description:
      'Master the fundamentals of React 19 from scratch: dive deep into JSX, reusable component patterns, state management with Hooks, client-side routing, and real-world API integration.',
    thumbnailUrl: '/learner/course-react.jpg',
    level: CourseLevel.BEGINNER,
    category: 'Web Development',
    outcomeTag: OutcomeTag.GET_A_JOB,
    tags: ['React', 'JavaScript', 'TypeScript', 'Web Development', 'Frontend'],
    price: 15000.0,
    isFree: false,
    averageRating: 4.8,
    reviewCount: 38,
    enrolmentCount: 2340,
    isFeatured: true,
    sections: [
      {
        title: 'Module 1: React Fundamentals & The Modern Toolchain',
        position: 1,
        lessons: [
          {
            title: '1.1 Welcome to Modern React & Setting Up Vite',
            position: 1,
            videoUrl: directVideos.bunny,
            videoDuration: 620,
            isPreview: true,
            content:
              'Introduction to the course roadmap, prerequisites, and setting up a lightning-fast development environment using Vite, TypeScript, and ESLint.',
          },
          {
            title: '1.2 Components, Props, and JSX Deep Dive',
            position: 2,
            videoUrl: directVideos.elephants,
            videoDuration: 850,
            isPreview: true,
            content:
              'Understand how JSX compiles to JavaScript, how component trees render, and how to pass type-safe props between parent and child components.',
          },
          {
            title: '1.3 Managing State with useState and useReducer',
            position: 3,
            videoUrl: directVideos.blazes,
            videoDuration: 940,
            isPreview: false,
            content:
              'Learn immutability best practices, complex form handling with state, and transitioning from useState to useReducer for predictable state transitions.',
          },
        ],
      },
      {
        title: 'Module 2: Side Effects, Networking & Custom Hooks',
        position: 2,
        lessons: [
          {
            title: '2.1 Mastering useEffect & AbortController',
            position: 1,
            videoUrl: directVideos.escapes,
            videoDuration: 780,
            isPreview: false,
            content:
              'Avoid infinite re-renders and memory leaks by mastering the useEffect dependency array and cleaning up asynchronous network requests with AbortController.',
          },
          {
            title: '2.2 Building Production Custom Hooks',
            position: 2,
            videoUrl: directVideos.fun,
            videoDuration: 910,
            isPreview: false,
            content:
              'Extract reusable logic into clean, testable custom hooks: building useFetch, useLocalStorage, and useDebounce.',
          },
        ],
      },
    ],
  },

  // 3. AI ENGINEERING WITH PYTHON
  {
    instructorEmail: 'amina.bello@createch.example.com',
    title: 'AI Engineering with Python & Large Language Models',
    slug: 'ai-engineering-with-python',
    description:
      'A comprehensive, hands-on journey from Python fundamentals to building production-grade Generative AI applications: Prompt Engineering, RAG pipelines, Vector Embeddings, and Agentic Workflows.',
    thumbnailUrl: '/learner/course-ai.png',
    level: CourseLevel.INTERMEDIATE,
    category: 'AI & Machine Learning',
    outcomeTag: OutcomeTag.START_FREELANCING,
    tags: ['Python', 'AI', 'LLM', 'OpenAI', 'LangChain', 'Vector Search'],
    price: 25000.0,
    isFree: false,
    averageRating: 4.95,
    reviewCount: 52,
    enrolmentCount: 1850,
    isFeatured: true,
    sections: [
      {
        title: 'Module 1: The Modern AI Engineering Stack',
        position: 1,
        lessons: [
          {
            title: '1.1 Introduction to LLMs & The AI Engineer Role',
            position: 1,
            videoUrl: directVideos.joy,
            videoDuration: 750,
            isPreview: true,
            content:
              'Understand transformer architectures, tokenization mechanics, latency economics, and the shift from traditional ML to software engineering with foundation models.',
          },
          {
            title: '1.2 Advanced Prompt Engineering & Structured Outputs',
            position: 2,
            videoUrl: directVideos.meltdowns,
            videoDuration: 880,
            isPreview: true,
            content:
              'Techniques for few-shot prompting, chain-of-thought reasoning, and enforcing strict JSON schemas for deterministic backend responses.',
          },
        ],
      },
      {
        title: 'Module 2: Retrieval-Augmented Generation (RAG) Architecture',
        position: 2,
        lessons: [
          {
            title: '2.1 Vector Embeddings & Similarity Search',
            position: 1,
            videoUrl: directVideos.sintel,
            videoDuration: 920,
            isPreview: false,
            content:
              'Explore cosine similarity, high-dimensional vector spaces, chunking strategies, and storing document embeddings in PostgreSQL with pgvector.',
          },
          {
            title: '2.2 Building an End-to-End RAG Knowledge Assistant',
            position: 2,
            videoUrl: directVideos.tears,
            videoDuration: 1140,
            isPreview: false,
            content:
              'Construct a full production retrieval pipeline with contextual re-ranking, source attribution, and real-time streaming output.',
          },
        ],
      },
    ],
  },

  // 4. NODE.JS & NESTJS FUNDAMENTALS
  {
    instructorEmail: 'bola.james@createch.example.com',
    title: 'Node.js & NestJS Fundamentals: Scalable Enterprise APIs',
    slug: 'nodejs-fundamentals',
    description:
      'Build high-performance, modular backend services with Node.js, NestJS, and PostgreSQL. Covers dependency injection, validation pipes, interceptors, authentication guards, and OpenAPI generation.',
    thumbnailUrl: '/learner/course-node.jpg',
    level: CourseLevel.BEGINNER,
    category: 'Web Development',
    outcomeTag: OutcomeTag.GET_A_JOB,
    tags: ['Node.js', 'NestJS', 'TypeScript', 'REST API', 'Backend'],
    price: 18000.0,
    isFree: false,
    averageRating: 4.75,
    reviewCount: 26,
    enrolmentCount: 1420,
    isFeatured: false,
    sections: [
      {
        title: 'Module 1: NestJS Architecture & Modular Design',
        position: 1,
        lessons: [
          {
            title: '1.1 The NestJS Way: Modules, Controllers & Services',
            position: 1,
            videoUrl: directVideos.subaru,
            videoDuration: 710,
            isPreview: true,
            content:
              'Deconstruct the NestJS architecture: inversion of control (IoC), dependency injection containers, and creating clean domain boundaries.',
          },
          {
            title: '1.2 Request Validation, DTOs & Global Exception Filters',
            position: 2,
            videoUrl: directVideos.bunny,
            videoDuration: 860,
            isPreview: false,
            content:
              'Writing bulletproof input validation using class-validator and class-transformer with unified RFC-7807 error envelopes.',
          },
        ],
      },
    ],
  },

  // 5. DATA SCIENCE 101
  {
    instructorEmail: 'amina.bello@createch.example.com',
    title: 'Data Science 101: From Raw Data to Actionable Insights',
    slug: 'data-science-101',
    description:
      'Learn practical data science and exploratory data analysis using Python, Pandas, NumPy, and Seaborn. Clean messy datasets, uncover correlations, and build interactive analytical charts.',
    thumbnailUrl: '/learner/course-data-science.jpg',
    level: CourseLevel.BEGINNER,
    category: 'Data Science',
    outcomeTag: OutcomeTag.GET_A_JOB,
    tags: ['Data Science', 'Python', 'Pandas', 'Analytics', 'Visualization'],
    price: 20000.0,
    isFree: false,
    averageRating: 4.65,
    reviewCount: 22,
    enrolmentCount: 980,
    isFeatured: false,
    sections: [
      {
        title: 'Module 1: Python for Data Analysis',
        position: 1,
        lessons: [
          {
            title: '1.1 NumPy Arrays & Vectorized Calculations',
            position: 1,
            videoUrl: directVideos.elephants,
            videoDuration: 660,
            isPreview: true,
            content:
              'Master multidimensional arrays, indexing, slicing, and accelerated mathematical operations over large datasets.',
          },
          {
            title: '1.2 Wrangling & Transforming Data with Pandas',
            position: 2,
            videoUrl: directVideos.blazes,
            videoDuration: 890,
            isPreview: true,
            content:
              'Handling missing values, grouping, pivot tables, and joining disparate dataframes efficiently.',
          },
        ],
      },
    ],
  },

  // 6. DEVOPS WITH DOCKER & KUBERNETES
  {
    instructorEmail: 'alex.chen@createch.example.com',
    title: 'DevOps with Docker & Kubernetes: Cloud-Native Infrastructure',
    slug: 'devops-with-docker',
    description:
      'Take your applications from local code to multi-cluster production environments: containerization, Docker multi-stage builds, Kubernetes pods, deployments, ingress controllers, and GitHub Actions CI/CD.',
    thumbnailUrl: '/learner/course-react.jpg',
    level: CourseLevel.ADVANCED,
    category: 'DevOps & Cloud',
    outcomeTag: OutcomeTag.GET_PROMOTED,
    tags: ['Docker', 'Kubernetes', 'DevOps', 'CI/CD', 'Cloud'],
    price: 22000.0,
    isFree: false,
    averageRating: 4.9,
    reviewCount: 31,
    enrolmentCount: 890,
    isFeatured: false,
    sections: [
      {
        title: 'Module 1: Production Containerization',
        position: 1,
        lessons: [
          {
            title: '1.1 Docker Multi-Stage Builds & Image Minimization',
            position: 1,
            videoUrl: directVideos.escapes,
            videoDuration: 840,
            isPreview: true,
            content:
              'Techniques for slashing container image size by 80%, managing non-root security contexts, and container caching.',
          },
          {
            title: '1.2 Docker Compose for Multi-Service Local Stacks',
            position: 2,
            videoUrl: directVideos.fun,
            videoDuration: 750,
            isPreview: false,
            content:
              'Orchestrating PostgreSQL, Redis, and Web API containers with persistent volumes and healthchecks.',
          },
        ],
      },
    ],
  },

  // 7. FULL-STACK AI ENGINEERING
  {
    instructorEmail: 'ada.lovelace@createch.example.com',
    title: 'Full-Stack AI Engineering with Next.js 15 & NestJS',
    slug: 'full-stack-ai-engineering',
    description:
      'The definitive blueprint for building end-to-end AI applications: Next.js 15 App Router, React Server Components, streaming UI with AI SDK, BullMQ queues, Cloudflare R2, and Clerk authentication.',
    thumbnailUrl: '/courses/ai-engineering-thumb.jpg',
    level: CourseLevel.INTERMEDIATE,
    category: 'Web Development',
    outcomeTag: OutcomeTag.START_FREELANCING,
    tags: ['Next.js', 'NestJS', 'TypeScript', 'AI', 'Full-Stack'],
    price: 25000.0,
    isFree: false,
    averageRating: 4.95,
    reviewCount: 51,
    enrolmentCount: 1640,
    isFeatured: true,
    sections: [
      {
        title: 'Module 1: System Architecture & Modern Monoliths',
        position: 1,
        lessons: [
          {
            title: '1.1 System Architecture: Edge SSR to Modular NestJS API',
            position: 1,
            videoUrl: directVideos.joy,
            videoDuration: 920,
            isPreview: true,
            content:
              'Deep architectural breakdown of decoupling Next.js 15 frontend from NestJS backend services with high-throughput BullMQ queues.',
          },
          {
            title: '1.2 Identity Decoupling with Clerk JWTs & NestJS Guards',
            position: 2,
            videoUrl: directVideos.meltdowns,
            videoDuration: 810,
            isPreview: true,
            content:
              'Securing your distributed API with cryptographic session verification, RBAC guards, and Just-In-Time user synchronization.',
          },
        ],
      },
    ],
  },

  // 8. PRODUCT MANAGEMENT FUNDAMENTALS
  {
    instructorEmail: 'kofi.mensah@createch.example.com',
    title: 'Product Management Fundamentals & Tech Roadmapping',
    slug: 'product-management-fundamentals',
    description:
      'Bridge the gap between technology and business strategy: learn user research methodologies, PRD writing, prioritization frameworks (RICE), metrics tracking, and product launch execution.',
    thumbnailUrl: '/learner/course-node.jpg',
    level: CourseLevel.BEGINNER,
    category: 'Business & Finance',
    outcomeTag: OutcomeTag.GET_A_JOB,
    tags: ['Product Management', 'Agile', 'Strategy', 'Roadmapping'],
    price: 12000.0,
    isFree: false,
    averageRating: 4.75,
    reviewCount: 18,
    enrolmentCount: 760,
    isFeatured: false,
    sections: [
      {
        title: 'Module 1: Discovery & Strategy',
        position: 1,
        lessons: [
          {
            title: '1.1 Defining Problems & Customer Discovery Interviews',
            position: 1,
            videoUrl: directVideos.sintel,
            videoDuration: 730,
            isPreview: true,
            content:
              'Techniques for conducting unbiased user interviews, distilling customer pain points, and building validated opportunity solution trees.',
          },
          {
            title: '1.2 Writing Impactful PRDs & Setting North Star Metrics',
            position: 2,
            videoUrl: directVideos.tears,
            videoDuration: 890,
            isPreview: false,
            content:
              'Crafting crisp product requirements documents, defining measurable OKRs, and aligning cross-functional engineering teams.',
          },
        ],
      },
    ],
  },
];
