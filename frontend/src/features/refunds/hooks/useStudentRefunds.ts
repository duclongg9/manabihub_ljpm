import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelStudentRefund,
  createStudentRefund,
  fetchStudentRefunds,
} from '../api/studentRefundApi';

export const STUDENT_REFUNDS_QUERY_KEY = ['student-refunds'] as const;

export function useStudentRefunds() {
  return useQuery({
    queryKey: STUDENT_REFUNDS_QUERY_KEY,
    queryFn: () => fetchStudentRefunds(),
  });
}

function useInvalidateRefundData() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: STUDENT_REFUNDS_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: ['student-order-history'] }),
    ]);
  };
}

export function useCreateStudentRefund() {
  const invalidate = useInvalidateRefundData();
  return useMutation({
    mutationFn: createStudentRefund,
    onSuccess: invalidate,
  });
}

export function useCancelStudentRefund() {
  const invalidate = useInvalidateRefundData();
  return useMutation({
    mutationFn: cancelStudentRefund,
    onSuccess: invalidate,
  });
}
