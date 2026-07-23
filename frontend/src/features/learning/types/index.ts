export type LessonProgressStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export type LessonBlockType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'FLASHCARD' | 'WRITING';

export interface QuizQuestion {
  question: string;
  options: string[];
}

export interface FlashcardItem {
  front: string;
  back: string;
}

export interface LearningLessonBlock {
  id: string;
  moduleId: string;
  type: LessonBlockType;
  title: string;
  content?: string;
  videoUrl?: string;
  durationMinutes?: number;
  quizQuestion?: string;
  quizOptions: string[];
  quizItems: QuizQuestion[];
  flashcards: FlashcardItem[];
  writingPrompt?: string;
  rubric?: string;
  orderIndex: number;
  contentAvailable: boolean;
  progressStatus: LessonProgressStatus;
  lastVideoPositionSeconds?: number;
  completedAt?: string;
  current: boolean;
}

export interface LearningModule {
  id: string;
  title: string;
  orderIndex: number;
  blocks: LearningLessonBlock[];
}

export interface CourseLearning {
  courseId: string;
  courseTitle: string;
  enrollmentId: string;
  modules: LearningModule[];
  currentLessonBlockId: string | null;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  courseCompleted: boolean;
  warnings: string[];
}

export interface LessonProgress {
  lessonBlockId: string;
  enrollmentId: string;
  status: LessonProgressStatus;
  lastVideoPositionSeconds?: number;
  completedAt?: string;
  updatedAt?: string;
}
