import { axiosClient } from "../../../shared/api/axiosClient";
import { ENDPOINTS } from "../../../shared/api/endpoints";

import type {
    FlashcardResponse,
    FlashcardSummaryResponse,
    ReviewFlashcardRequest,
} from "./flashcardTypes";

export const flashcardApi = {

    getFlashcards: async (
        lessonBlockId: string,
    ): Promise<FlashcardResponse> => {

        const response = await axiosClient.get(
            ENDPOINTS.FLASHCARD.GET(lessonBlockId),
        );

        return response.data.data;
    },

    reviewFlashcard: async (
        request: ReviewFlashcardRequest,
    ): Promise<void> => {

        await axiosClient.post(
            ENDPOINTS.FLASHCARD.REVIEW,
            request,
        );
    },

    getSummary: async (
        lessonBlockId: string,
    ): Promise<FlashcardSummaryResponse> => {

        const response = await axiosClient.get(
            ENDPOINTS.FLASHCARD.SUMMARY(
                lessonBlockId,
            ),
        );

        return response.data.data;
    },
};