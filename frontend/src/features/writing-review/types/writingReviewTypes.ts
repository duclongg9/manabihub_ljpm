export type WritingSubmissionStatus =
  | 'SUBMITTED'
  | 'SUGGESTION_PROCESSING'
  | 'SUGGESTION_READY'
  | 'SUGGESTION_FAILED'
  | 'TEACHER_FEEDBACK_READY';

export interface WritingSubmissionSummary {
  id: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  studentName: string;
  studentEmail: string;
  status: WritingSubmissionStatus;
  submittedAt: string;
  hasAiSuggestion: boolean;
  hasTeacherFeedback: boolean;
}

export interface AiWritingSuggestion {
  id: string;
  status: 'READY' | 'FAILED';
  grammarSuggestions: unknown;
  vocabularySuggestions: unknown;
  structureSuggestions: unknown;
  revisionGuidance: string | null;
  confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  official: false;
  failureReason: string | null;
  createdAt: string;
}

export interface TeacherWritingFeedback {
  id: string;
  score: number | null;
  comment: string;
  rubricResult: unknown;
  official: true;
  createdAt: string;
  updatedAt: string | null;
}

export interface WritingSubmissionDetail {
  id: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  studentName: string;
  studentEmail: string;
  content: string;
  status: WritingSubmissionStatus;
  submittedAt: string;
  aiSuggestion: AiWritingSuggestion | null;
  teacherFeedback: TeacherWritingFeedback | null;
}

export interface TeacherWritingFeedbackPayload {
  score: number | null;
  comment: string;
}
