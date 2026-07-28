import type { ReactNode } from 'react';
import { useCommercialPolicy } from '../hooks/useCommercialPolicy';

interface PolicyBoundaryProps {
  children: (policy: NonNullable<ReturnType<typeof useCommercialPolicy>['data']>) => ReactNode;
}

export const PolicyBoundary = ({ children }: PolicyBoundaryProps) => {
  const { data: policy, isLoading, isError, refetch } = useCommercialPolicy();

  if (isLoading) {
    return (
      <div
        aria-live="polite"
        aria-label="Đang tải điều khoản hiện hành"
        className="flex min-h-28 items-center justify-center border-y border-gray-200 bg-gray-50 p-4"
        role="status"
      >
        <div className="flex animate-pulse space-x-2" aria-hidden="true">
          <div className="h-2 w-2 rounded-full bg-gray-400" />
          <div className="h-2 w-2 rounded-full bg-gray-400" />
          <div className="h-2 w-2 rounded-full bg-gray-400" />
        </div>
      </div>
    );
  }

  if (isError || !policy) {
    return (
      <div
        aria-live="assertive"
        className="border-y border-red-200 bg-red-50 p-6 text-center"
        role="alert"
      >
        <h2 className="mb-2 font-semibold text-red-900">Không thể tải điều khoản hiện hành</h2>
        <p className="mb-4 text-sm text-red-700">
          ManabiHub không hiển thị số liệu tạm khi nguồn chính thức chưa sẵn sàng.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 transition-colors hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return <>{children(policy)}</>;
};
