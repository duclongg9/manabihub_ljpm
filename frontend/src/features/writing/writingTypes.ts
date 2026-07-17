export interface ApiEnvelope<T> {
    success: boolean;
    messageCode: string;
    message: string;
    data: T;
    timestamp: string;
}

/* ==========================
   Request
========================== */

export interface SubmitWritingRequest {

    lessonBlockId: string;

    content: string;

}

/* ==========================
   Enum
========================== */

export type WritingSubmissionStatus =
    | "DRAFT"
    | "SUBMITTED"
    | "SUGGESTION_PROCESSING"
    | "SUGGESTION_READY"
    | "SUGGESTION_FAILED"
    | "TEACHER_FEEDBACK_READY";

/* ==========================
   Submission
========================== */

export interface WritingSubmissionResponse {

    id: string;

    lessonBlockId: string;

    content: string;

    status: WritingSubmissionStatus;

    submittedAt: string | null;

    createdAt: string;

    updatedAt: string;

}

/* ==========================
   AI Suggestion
========================== */

export interface GrammarSuggestion {

    original: string;

    suggestion: string;

    explanation: string;

}

export interface VocabularySuggestion {

    original: string;

    suggestion: string;

    explanation: string;

}

export interface StructureSuggestion {

    issue: string;

    suggestion: string;

}

export interface AiWritingSuggestionResponse {

    id: string;

    grammarSuggestions: GrammarSuggestion[];

    vocabularySuggestions: VocabularySuggestion[];

    structureSuggestions: StructureSuggestion[];

    overallComment: string;

}

/* ==========================
   Response
========================== */

export interface WritingResultResponse {

    submission: WritingSubmissionResponse;

    suggestion: AiWritingSuggestionResponse | null;

}