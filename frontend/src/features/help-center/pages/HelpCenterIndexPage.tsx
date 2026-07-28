import { Link } from 'react-router-dom';

export const HelpCenterIndexPage = () => {
  const categories = [
    {
      title: 'Dành cho Giảng viên',
      links: [
        { label: 'Xác thực danh tính (KYC) & Chứng chỉ', to: '/help/instructors/verification' },
        { label: 'Chia sẻ doanh thu và Hoa hồng', to: '/help/instructors/revenue-share' },
        { label: 'Tạm giữ doanh thu và Rút tiền', to: '/help/instructors/escrow-and-payouts' },
        { label: 'Xét duyệt và Gỡ bỏ khóa học', to: '/help/instructors/course-review-and-unpublishing' },
      ],
    },
    {
      title: 'Dành cho Học viên',
      links: [
        { label: 'Thanh toán, Hoàn tiền và Quyền truy cập', to: '/help/learners/payments-refunds-access' },
      ],
    },
    {
      title: 'Chung',
      links: [
        { label: 'Báo cáo vi phạm (Trust & Safety)', to: '/help/trust-safety/reporting-and-actions' },
        { label: 'Trí tuệ nhân tạo (AI) và Dữ liệu', to: '/help/ai-and-data' },
      ],
    },
    {
      title: 'Pháp lý',
      links: [
        { label: 'Điều khoản sử dụng', to: '/legal/terms' },
        { label: 'Chính sách bảo mật', to: '/legal/privacy' },
        { label: 'Điều khoản Giảng viên', to: '/legal/instructor-terms' },
        { label: 'Chính sách Hoàn tiền', to: '/legal/refund-policy' },
        { label: 'Thông báo về AI', to: '/legal/ai-notice' },
      ],
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Xin chào, chúng tôi có thể giúp gì cho bạn?</h1>
      <div className="grid md:grid-cols-2 gap-8">
        {categories.map((category, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">{category.title}</h2>
            <ul className="space-y-3">
              {category.links.map((link, linkIdx) => (
                <li key={linkIdx}>
                  <Link to={link.to} className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
