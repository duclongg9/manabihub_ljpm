import { PolicyBoundary } from '../../components/PolicyBoundary';
import { ArticleLayout } from '../../components/ArticleLayout';

export const LearnerPaymentsRefundsPage = () => (
  <PolicyBoundary>
    {(policy) => (
      <ArticleLayout 
        title="Thanh toán, Hoàn tiền và Quyền truy cập" 
        lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}
        breadcrumbs={[{ label: 'Dành cho Học viên', to: '/help?category=learners' }]}
      >
        <p>Học viên có quyền yêu cầu hoàn tiền trong vòng <strong>{policy.refundWindowDays} ngày</strong> kể từ ngày mua, với điều kiện tiến độ học tập chưa vượt quá {policy.refundProgressLimitPercent}%.</p>
        <p>Sau khi hoàn tiền thành công, quyền truy cập vào khóa học sẽ bị thu hồi.</p>
      </ArticleLayout>
    )}
  </PolicyBoundary>
);

export const TrustSafetyPage = () => (
  <PolicyBoundary>
    {(policy) => (
      <ArticleLayout 
        title="Báo cáo vi phạm và Biện pháp xử lý" 
        lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}
        breadcrumbs={[{ label: 'Niềm tin & An toàn', to: '/help?category=trust-safety' }]}
      >
        <p>ManabiHub cam kết xây dựng một môi trường học tập an toàn. Nếu bạn phát hiện vi phạm, vui lòng sử dụng tính năng báo cáo hoặc liên hệ hỗ trợ.</p>
      </ArticleLayout>
    )}
  </PolicyBoundary>
);

export const AiAndDataPage = () => (
  <PolicyBoundary>
    {(policy) => (
      <ArticleLayout 
        title="Trí tuệ nhân tạo (AI) và Dữ liệu" 
        lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}
        breadcrumbs={[{ label: 'Trí tuệ nhân tạo', to: '/help?category=ai-and-data' }]}
      >
        <p>Tính năng AI trên nền tảng được kích hoạt theo yêu cầu của người dùng. Một số dữ liệu ngữ cảnh của khóa học có thể được gửi tới nhà cung cấp AI để cải thiện độ chính xác.</p>
        <p>Tuy nhiên, xin lưu ý rằng kết quả từ AI có thể không hoàn toàn chính xác. Vui lòng luôn kiểm chứng thông tin.</p>
      </ArticleLayout>
    )}
  </PolicyBoundary>
);
