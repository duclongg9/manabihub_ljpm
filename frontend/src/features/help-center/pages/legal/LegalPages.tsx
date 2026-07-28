import { ArticleLayout } from '../../components/ArticleLayout';
import { getHelpArticle } from '../../content/articleRegistry';

const draftCopy: Record<string, string> = {
  terms: 'Điều khoản sử dụng đầy đủ cần được chủ dự án rà soát và phê duyệt trước khi công bố.',
  privacy: 'Chính sách cần mô tả đầy đủ dữ liệu thu thập, mục đích, thời hạn lưu trữ và quyền của người dùng.',
  'instructor-terms': 'Điều khoản thương mại cần được đối chiếu với luồng tiền đã được backend thực thi.',
  'refund-policy': 'Chính sách hoàn tiền cần được đối chiếu với điều kiện và trạng thái xử lý thực tế.',
  'ai-notice': 'Thông báo AI cần được đối chiếu với nhà cung cấp, dữ liệu gửi đi và chính sách lưu trữ.',
};

const DraftLegalPage = ({ articleId }: { articleId: string }) => {
  const article = getHelpArticle(articleId);

  return (
    <ArticleLayout article={article}>
      <div className="border-l-4 border-amber-500 bg-amber-50 p-4 text-amber-950">
        <p><strong>Tài liệu này chưa có hiệu lực.</strong></p>
        <p>{draftCopy[articleId]}</p>
      </div>
      <p>
        Trang được dựng để hoàn thiện luồng giao diện và liên kết. Không sử dụng nội
        dung này làm căn cứ giao dịch hoặc sự chấp thuận của người dùng.
      </p>
    </ArticleLayout>
  );
};

export const TermsPage = () => <DraftLegalPage articleId="terms" />;

export const PrivacyPage = () => <DraftLegalPage articleId="privacy" />;

export const InstructorTermsPage = () => <DraftLegalPage articleId="instructor-terms" />;

export const RefundPolicyPage = () => <DraftLegalPage articleId="refund-policy" />;

export const AiNoticePage = () => <DraftLegalPage articleId="ai-notice" />;
