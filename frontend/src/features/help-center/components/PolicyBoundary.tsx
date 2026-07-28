import type { ReactNode } from 'react';
import { useCommercialPolicy } from '../hooks/useCommercialPolicy';

interface PolicyBoundaryProps {
  children: (policy: NonNullable<ReturnType<typeof useCommercialPolicy>['data']>) => ReactNode;
}

export const PolicyBoundary = ({ children }: PolicyBoundaryProps) => {
  const { data: policy, isLoading, isError, refetch } = useCommercialPolicy();

  if (isLoading) {
    return (
      <div className="p-4 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center min-h-[100px]">
        <div className="animate-pulse flex space-x-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (isError || !policy) {
    return (
      <div className="p-6 rounded-md bg-red-50 border border-red-100 text-center">
        <h3 className="text-red-800 font-medium mb-2">Không thể tải điều khoản hiện hành</h3>
        <p className="text-sm text-red-600 mb-4">Vui lòng thử lại sau.</p>
        <button 
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return <>{children(policy)}</>;
};
