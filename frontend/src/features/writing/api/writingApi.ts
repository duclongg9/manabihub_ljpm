import { axiosClient } from "../../../shared/api/axiosClient";
import { ENDPOINTS } from "../../../shared/api/endpoints";

import type {
    ApiEnvelope,
    SubmitWritingRequest,
    WritingAssignmentResponse,
    WritingResultResponse,
} from "./writingTypes";

/**
 * Lấy thông tin bài tập viết
 */
export async function getWritingAssignment(
    lessonBlockId: string,
): Promise<WritingAssignmentResponse> {

    const response =
        await axiosClient.get<ApiEnvelope<WritingAssignmentResponse>>(
            ENDPOINTS.writing.assignment(lessonBlockId),
        );

    return response.data.data;

}

/**
 * Nộp bài viết
 */
export async function submitWriting(
    request: SubmitWritingRequest,
): Promise<WritingResultResponse> {

    const response =
        await axiosClient.post<ApiEnvelope<WritingResultResponse>>(
            ENDPOINTS.writing.submit,
            request,
        );

    return response.data.data;

}