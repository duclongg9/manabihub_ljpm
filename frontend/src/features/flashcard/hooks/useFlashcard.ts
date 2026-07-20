import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { flashcardApi } from "../api/flashcardApi";

import type {
    FlashcardSummaryResponse,
    ReviewFlashcardRequest,
} from "../api/flashcardTypes";

const FLASHCARD_QUERY_KEY = "flashcard";
const FLASHCARD_SUMMARY_KEY = "flashcard-summary";

export function useFlashcards(lessonBlockId: string) {
    return useQuery({
        queryKey: [FLASHCARD_QUERY_KEY, lessonBlockId],
        queryFn: () => flashcardApi.getFlashcards(lessonBlockId),
        enabled: !!lessonBlockId,
    });
}

export function useFlashcardSummary(lessonBlockId: string) {
    return useQuery<FlashcardSummaryResponse>({
        queryKey: [FLASHCARD_SUMMARY_KEY, lessonBlockId],
        queryFn: () => flashcardApi.getSummary(lessonBlockId),
        enabled: false,
    });
}

export function useReviewFlashcard() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: ReviewFlashcardRequest) =>
            flashcardApi.reviewFlashcard(request),

        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: [
                    FLASHCARD_SUMMARY_KEY,
                    variables.lessonBlockId,
                ],
            });
        },
    });
}