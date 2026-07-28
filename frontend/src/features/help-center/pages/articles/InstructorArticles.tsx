import { PolicyBoundary } from '../../components/PolicyBoundary';
import { ArticleLayout } from '../../components/ArticleLayout';

export const InstructorVerificationPage = () => (
  <PolicyBoundary>
    {(policy) => (
      <ArticleLayout 
        title="Xác thực danh tính (KYC) và Chứng chỉ" 
        lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}
        breadcrumbs={[{ label: 'Dành cho Giảng viên', to: '/help?category=instructors' }]}
      >
        <p>Quá trình xác thực danh tính (CCCD) được thực hiện tự động.</p>
        <p>Đối với chứng chỉ ngoại ngữ (như JLPT), đội ngũ của chúng tôi sẽ xét duyệt thủ công. Thời gian dự kiến hoàn thành là từ {policy.kycTargetDaysMin} đến {policy.kycTargetDaysMax} ngày làm việc (không bao gồm ngày lễ và cuối tuần). Xin lưu ý đây là mục tiêu dịch vụ, không phải cam kết tuyệt đối.</p>
      </ArticleLayout>
    )}
  </PolicyBoundary>
);

export const InstructorCourseReviewPage = () => (
  <PolicyBoundary>
    {(policy) => (
      <ArticleLayout 
        title="Xét duyệt và Gỡ bỏ khóa học" 
        lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}
        breadcrumbs={[{ label: 'Dành cho Giảng viên', to: '/help?category=instructors' }]}
      >
        <p>Tất cả khóa học phải tuân thủ tiêu chuẩn chất lượng. Nếu khóa học bị gỡ bỏ (unpublished), học viên đã ghi danh vẫn giữ quyền truy cập, trừ khi có quyết định cụ thể liên quan đến vi phạm niềm tin và an toàn (Trust & Safety).</p>
      </ArticleLayout>
    )}
  </PolicyBoundary>
);
