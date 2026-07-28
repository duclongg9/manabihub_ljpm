import { PolicyBoundary } from '../../components/PolicyBoundary';
import { ArticleLayout } from '../../components/ArticleLayout';

export const TermsPage = () => (
  <PolicyBoundary>
    {(policy) => (
      <ArticleLayout title="Điều khoản sử dụng" lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}>
        <p>Nội dung chi tiết Điều khoản sử dụng của ManabiHub.</p>
      </ArticleLayout>
    )}
  </PolicyBoundary>
);

export const PrivacyPage = () => (
  <PolicyBoundary>
    {(policy) => (
      <ArticleLayout title="Chính sách bảo mật" lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}>
        <p>Chính sách bảo mật thông tin người dùng.</p>
      </ArticleLayout>
    )}
  </PolicyBoundary>
);

export const InstructorTermsPage = () => (
  <PolicyBoundary>
    {(policy) => (
      <ArticleLayout title="Điều khoản dành cho Giảng viên" lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}>
        <p>Điều khoản thương mại dành cho giảng viên, bao gồm mức phí hoa hồng là {(policy.commissionRate * 100).toFixed(0)}% và thời gian tạm giữ {policy.escrowHoldingDays} ngày.</p>
      </ArticleLayout>
    )}
  </PolicyBoundary>
);

export const RefundPolicyPage = () => (
  <PolicyBoundary>
    {(policy) => (
      <ArticleLayout title="Chính sách hoàn tiền" lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}>
        <p>Chính sách hoàn tiền trong vòng {policy.refundWindowDays} ngày.</p>
      </ArticleLayout>
    )}
  </PolicyBoundary>
);

export const AiNoticePage = () => (
  <PolicyBoundary>
    {(policy) => (
      <ArticleLayout title="Thông báo về Trí tuệ nhân tạo (AI)" lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}>
        <p>Thông tin về việc sử dụng AI trên nền tảng ManabiHub.</p>
      </ArticleLayout>
    )}
  </PolicyBoundary>
);
