import { axiosClient } from "../../../shared/api/axiosClient";
import { ENDPOINTS } from "../../../shared/api/endpoints";

import type {
    SubmitWritingRequest,
    WritingAssignmentResponse,
    WritingResultResponse,
} from "../types";

export const writingService = {

    getAssignment: async (
        lessonBlockId: string
    ): Promise<WritingAssignmentResponse> => {

        const res = await axiosClient.get(
            ENDPOINTS.studentWriting.assignment(lessonBlockId)
        );

        return res.data.data;
    },

    submitWriting: async (
        payload: SubmitWritingRequest
    ): Promise<WritingResultResponse> => {

        const res = await axiosClient.post(
            ENDPOINTS.studentWriting.submit,
            payload
        );

        return res.data.data;
    },
};