import { axiosClient } from '../../../shared/api/axiosClient';

export interface QuizSubmitRequest {
  answers: {
    questionId: string;
    selectedOptions: string[];
  }[];
}

export interface QuizFeedback {
  questionId: string;
  isCorrect: boolean;
  explanation: string;
  correctOptions: string[];
}

export interface QuizSubmitResponse {
  score: number;
  passed: boolean;
  feedbacks: QuizFeedback[];
}

export interface FinalTestEligibilityResponse {
  eligible: boolean;
  reason: string | null;
  totalLessons: number;
  completedLessons: number;
  attemptsLeft: number;
  finalTestId: string;
}

export interface FinalTestSubmitRequest {
  finalTestId: string;
  attemptId: string;
  answers: {
    questionId: string;
    selectedChoiceIds: string[];
  }[];
}

export interface FinalTestSubmitResponse {
  score: number;
  passed: boolean;
  feedbacks: {
    questionId: string;
    isCorrect: boolean;
    explanation: string;
    correctChoiceIds: string[];
  }[];
}

export interface PublicQuizItemDto {
  id: string;
  content: string;
  required: boolean;
  options: {
    id: string;
    content: string;
  }[];
}

export interface PublicFinalTestDto {
  id: string;
  timeLimitMinutes: number;
  questions: {
    id: string;
    content: string;
    choices: {
      id: string;
      content: string;
    }[];
  }[];
}

export const learningService = {
  getQuizContent: async (courseId: string, blockId: string) => {
    const response = await axiosClient.get<{ data: PublicQuizItemDto[] }>(
      `/v1/learning/courses/${courseId}/blocks/${blockId}/quiz`
    );
    return response.data.data;
  },

  submitQuiz: async (courseId: string, blockId: string, data: QuizSubmitRequest) => {
    const response = await axiosClient.post<{ data: QuizSubmitResponse }>(
      `/v1/learning/courses/${courseId}/blocks/${blockId}/quiz/submit`,
      data
    );
    return response.data.data;
  },

  checkFinalTestEligibility: async (courseId: string) => {
    const response = await axiosClient.get<{ data: FinalTestEligibilityResponse }>(
      `/v1/learning/courses/${courseId}/final-test/eligibility`
    );
    return response.data.data;
  },

  getFinalTestContent: async (courseId: string) => {
    const response = await axiosClient.get<{ data: PublicFinalTestDto }>(
      `/v1/learning/courses/${courseId}/final-test`
    );
    return response.data.data;
  },

  startFinalTest: async (courseId: string) => {
    const response = await axiosClient.post<{ data: { attemptId: string; message: string } }>(
      `/v1/learning/courses/${courseId}/final-test/start`
    );
    return response.data.data;
  },

  submitFinalTest: async (courseId: string, data: FinalTestSubmitRequest) => {
    const response = await axiosClient.post<{ data: FinalTestSubmitResponse }>(
      `/v1/learning/courses/${courseId}/final-test/submit`,
      data
    );
    return response.data.data;
  },
};
