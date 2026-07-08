import { axiosClient } from '../../../shared/api/axiosClient';

export interface FinalTestChoice {
  id?: string;
  content: string;
  isCorrect: boolean;
}

export interface FinalTestQuestion {
  id?: string;
  content: string;
  explanation: string;
  choices: FinalTestChoice[];
}

export interface FinalTestConfig {
  id?: string;
  courseId: string;
  timeLimitMinutes: number;
  passingScore: number;
  maxRetakes: number;
  jlptLevel: string;
  skillFocus: string;
  questions: FinalTestQuestion[];
}

export type UpdateFinalTestRequest = Omit<FinalTestConfig, 'id' | 'courseId'>;

export const finalTestService = {
  getFinalTest: async (courseId: string): Promise<FinalTestConfig | null> => {
    try {
      const { data } = await axiosClient.get<{ data: FinalTestConfig }>(`/v1/teacher/courses/${courseId}/final-test`);
      return data.data;
    } catch (error: any) {
      // Return null if not configured yet (404/Empty)
      return null;
    }
  },

  updateFinalTest: async (courseId: string, request: UpdateFinalTestRequest): Promise<FinalTestConfig> => {
    const { data } = await axiosClient.put<{ data: FinalTestConfig }>(`/v1/teacher/courses/${courseId}/final-test`, request);
    return data.data;
  },
};
