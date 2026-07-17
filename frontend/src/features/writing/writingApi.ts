import { axiosClient } from "../../shared/api/axiosClient";
import { ENDPOINTS } from "../../shared/api/endpoints";

import type {
    ApiEnvelope,
    SubmitWritingRequest,
    WritingResultResponse,
} from "./writingTypes";

/* ==========================
   Submit Writing
========================== */

export async function submitWriting(
    payload: SubmitWritingRequest
) {

    const response =
        await axiosClient.post<ApiEnvelope<WritingResultResponse>>(
            ENDPOINTS.writing.submit,
            payload
        );

    return response.data.data;

}

export async function getWritingAssignment(
    lessonBlockId: string
) {
    const response =
        await axiosClient.get<ApiEnvelope<WritingAssignmentResponse>>(
            ENDPOINTS.writing.assignment(lessonBlockId)
        );

    return response.data.data;
}