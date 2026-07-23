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
  flashcardStatuses?: ('REMEMBERED' | 'NEEDS_REVIEW' | null)[];
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

export interface GrammarSuggestion {
  error: string;
  correction: string;
  explanation: string;
}

export interface VocabularySuggestion {
  word: string;
  suggestion: string;
  explanation: string;
}

export interface StructureSuggestion {
  issue: string;
  suggestion: string;
}

export interface AiWritingSuggestionResponse {
  id: string;
  status: 'READY' | 'FAILED';
  grammarSuggestions: GrammarSuggestion[];
  vocabularySuggestions: VocabularySuggestion[];
  structureSuggestions: StructureSuggestion[];
  revisionGuidance?: string;
  official: false;
  failureReason?: string;
  createdAt: string;
}

export interface TeacherWritingFeedback {
  id: string;
  score?: number;
  comment?: string;
  rubricResult?: Record<string, unknown>;
  official: true;
  createdAt: string;
  updatedAt?: string;
}

export interface WritingSubmissionDetail {
  id: string;
  lessonBlockId: string;
  content: string;
  status: 'DRAFT' | 'SUBMITTED' | 'SUGGESTION_PROCESSING' | 'SUGGESTION_READY' | 'SUGGESTION_FAILED' | 'TEACHER_FEEDBACK_READY';
  submittedAt: string;
  aiSuggestion?: AiWritingSuggestionResponse;
  teacherFeedback?: TeacherWritingFeedback;
}
