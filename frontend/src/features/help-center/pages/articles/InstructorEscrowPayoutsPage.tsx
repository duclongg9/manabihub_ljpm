import { PolicyBoundary } from '../../components/PolicyBoundary';
import { ArticleLayout } from '../../components/ArticleLayout';

export const InstructorEscrowPayoutsPage = () => {
  return (
    <PolicyBoundary>
      {(policy) => (
        <ArticleLayout 
          title="Tạm giữ doanh thu và Rút tiền" 
          lastUpdated={new Date(policy.effectiveAt).toLocaleDateString('vi-VN')}
          breadcrumbs={[{ label: 'Dành cho Giảng viên', to: '/help?category=instructors' }]}
        >
          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Thời gian tạm giữ (Escrow)</h2>
            <p>
              Để đảm bảo quyền lợi cho học viên và xử lý các yêu cầu hoàn tiền nếu có, doanh thu từ mỗi đơn hàng sẽ được tạm giữ trong <strong>{policy.escrowHoldingDays} ngày</strong>.
            </p>
            <p className="mt-4">
              Sau {policy.escrowHoldingDays} ngày kể từ thời điểm giao dịch thành công (và không có yêu cầu hoàn tiền hợp lệ nào), số tiền này sẽ được chuyển vào Số dư khả dụng của bạn.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 mt-8 mb-4">Điều kiện và Phí rút tiền</h2>
            <ul className="list-disc pl-5 mt-4 space-y-2">
              <li>
                <strong>Hạn mức tối thiểu:</strong> Bạn có thể yêu cầu rút tiền khi số dư khả dụng đạt tối thiểu {policy.payoutThreshold.toLocaleString('vi-VN')} {policy.currency}.
              </li>
              <li>
                <strong>Phí xử lý rút tiền:</strong> {policy.withdrawalFee === 0 ? 'Miễn phí' : `${policy.withdrawalFee.toLocaleString('vi-VN')} ${policy.currency} cho mỗi lần rút`}.
              </li>
            </ul>
          </section>
        </ArticleLayout>
      )}
    </PolicyBoundary>
  );
};
