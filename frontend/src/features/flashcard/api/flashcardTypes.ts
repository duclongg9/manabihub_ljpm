export type FlashcardReviewStatus =
    | "REMEMBERED"
    | "NEED_REVIEW"
    | "SKIPPED";

export interface FlashcardItem {
    front: string;
    back: string;
    reading?: string;
    example?: string;
}

export interface FlashcardResponse {
    lessonBlockId: string;
    title: string;
    flashcards: FlashcardItem[];
}

export interface ReviewFlashcardRequest {
    lessonBlockId: string;
    cardIndex: number;
    status: FlashcardReviewStatus;
}

export interface FlashcardSummaryResponse {
    totalCards: number;
    remembered: number;
    needReview: number;
    skipped: number;
}