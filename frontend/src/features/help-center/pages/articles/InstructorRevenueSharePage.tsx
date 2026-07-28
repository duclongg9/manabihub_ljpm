import { PolicyBoundary } from '../../components/PolicyBoundary';
import { ArticleLayout } from '../../components/ArticleLayout';

export const InstructorRevenueSharePage = () => {
  return (
    <PolicyBoundary>
      {(policy) => (
        <ArticleLayout 
          title="Chia sẻ doanh thu và Hoa hồng" 
          lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}
          breadcrumbs={[{ label: 'Dành cho Giảng viên', to: '/help?category=instructors' }]}
        >
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Cơ cấu chia sẻ doanh thu</h2>
            <p>
              Tại ManabiHub, chúng tôi tin tưởng vào sự minh bạch. Doanh thu từ mỗi khóa học được bán ra (sau khi trừ các khoản giảm giá nếu có) sẽ được chia sẻ theo tỷ lệ sau:
            </p>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li>
                <strong>Hoa hồng nền tảng:</strong> {(policy.commissionRate * 100).toFixed(0)}%
              </li>
              <li>
                <strong>Thu nhập thực nhận của Giảng viên:</strong> {((1 - policy.commissionRate) * 100).toFixed(0)}%
              </li>
            </ul>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mt-6">
              <p className="text-sm text-blue-800 font-medium mb-1">Ví dụ minh họa ({policy.currency}):</p>
              <p className="text-sm text-blue-700">
                Nếu học viên thanh toán 1,000,000 {policy.currency} cho khóa học của bạn, hoa hồng nền tảng sẽ là 200,000 {policy.currency} và bạn sẽ nhận được 800,000 {policy.currency} vào số dư khả dụng sau thời gian tạm giữ.
              </p>
            </div>
          </section>
        </ArticleLayout>
      )}
    </PolicyBoundary>
  );
};
