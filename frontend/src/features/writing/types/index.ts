export interface SubmitWritingRequest {
    lessonBlockId: string;
    content: string;
}

export interface WritingAssignmentResponse {
    lessonBlockId: string;
    title: string;
    prompt: string;
    rubric: string;
    recommendedLength?: number | null;
}

export interface WritingSubmissionResponse {
    id: string;
    lessonBlockId: string;
    content: string;
    status: string;
    submittedAt: string;
}

export interface AiWritingSuggestionResponse {
    id: string;
    status: string;
    grammarSuggestions: unknown;
    vocabularySuggestions: unknown;
    structureSuggestions: unknown;
    revisionGuidance: string;
    confidenceLevel: string;
    official: boolean;
    failureReason?: string | null;
    createdAt: string;
}

export interface WritingResultResponse {
    submission: WritingSubmissionResponse;
    suggestion: AiWritingSuggestionResponse | null;
}