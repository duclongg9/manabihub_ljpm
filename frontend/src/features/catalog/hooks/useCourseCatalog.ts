import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { catalogService } from '../services/catalogService';
import type { CourseCatalogParams } from '../types/catalogTypes';

export const useCourseCatalog = (params: CourseCatalogParams) => {
  return useQuery({
    queryKey: ['public-courses', params],
    queryFn: () => catalogService.searchCourses(params),
    placeholderData: keepPreviousData,
  });
};
