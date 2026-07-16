import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { learningService, type QuizSubmitRequest, type FinalTestSubmitRequest } from '../services/learningService';

export const useLearningQuiz = () => {
  return useMutation({
    mutationFn: ({ courseId, blockId, data }: { courseId: string; blockId: string; data: QuizSubmitRequest }) =>
      learningService.submitQuiz(courseId, blockId, data),
    onSuccess: () => {
      alert('Đã nộp bài Quiz thành công!');
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Lỗi khi nộp bài Quiz');
    },
  });
};

export const useQuizContent = (courseId: string, blockId: string) => {
  return useQuery({
    queryKey: ['quizContent', courseId, blockId],
    queryFn: () => learningService.getQuizContent(courseId, blockId),
    enabled: !!courseId && !!blockId,
  });
};

export const useFinalTestEligibility = (courseId: string) => {
  return useQuery({
    queryKey: ['finalTestEligibility', courseId],
    queryFn: () => learningService.checkFinalTestEligibility(courseId),
    enabled: !!courseId,
  });
};

export const useFinalTestContent = (courseId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['finalTestContent', courseId],
    queryFn: () => learningService.getFinalTestContent(courseId),
    enabled: !!courseId && enabled,
  });
};

export const useStartFinalTest = () => {
  return useMutation({
    mutationFn: (courseId: string) => learningService.startFinalTest(courseId),
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Lỗi khi bắt đầu bài thi. Vui lòng thử lại.');
    },
  });
};

export const useFinalTestSubmit = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: FinalTestSubmitRequest }) =>
      learningService.submitFinalTest(courseId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['finalTestEligibility', variables.courseId] });
      queryClient.invalidateQueries({ queryKey: ['finalTestContent', variables.courseId] });
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'Lỗi khi nộp bài Final Test');
    },
  });
};
