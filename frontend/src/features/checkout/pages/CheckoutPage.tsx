import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import { getOrder, simulatePayment } from '../services/checkoutService';
import type { OrderResponse } from '../types';
import { ROUTES } from '../../../shared/constants/routes';

interface CheckoutLocationState {
  paymentUrl?: string;
}

export const CheckoutPage = () => {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const paymentUrl = (location.state as CheckoutLocationState | null)?.paymentUrl;
  const devSimulatorEnabled = import.meta.env.VITE_PAYMENT_DEV_SIMULATOR_ENABLED === 'true';

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getOrder(orderId)
      .then((data) => {
        if (!active) return;
        setOrder(data);
        if (data.status === 'PAID') {
          navigate(`/checkout/return?orderId=${orderId}`, { replace: true });
        }
      })
      .catch(() => active && setError('Không tải được thông tin đơn hàng.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [orderId, navigate]);

  const handlePayWithVnPay = () => {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  };

  const handleSimulate = async (success: boolean) => {
    if (!order) return;
    setProcessing(true);
    setError(null);
    try {
      await simulatePayment(order.orderCode, success);
      navigate(`/checkout/return?orderId=${orderId}`);
    } catch {
      setError('Không thể giả lập thanh toán. Vui lòng thử lại.');
      setProcessing(false);
    }
  };

  if (loading) {
    return <CenteredMessage text="Đang tải đơn hàng…" />;
  }

  if (error && !order) {
    return <CenteredMessage text={error} />;
  }

  if (!order) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Thanh toán đơn hàng</h1>
      <p className="text-sm text-slate-500 mb-6">Mã đơn hàng: <span className="font-mono">{order.orderCode}</span></p>

      <div className="bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          {order.items.map((item) => (
            <div key={item.courseId} className="flex items-center gap-4">
              {item.courseThumbnailUrl ? (
                <img src={item.courseThumbnailUrl} alt={item.courseTitle} className="w-20 h-14 object-cover rounded-lg" />
              ) : (
                <div className="w-20 h-14 rounded-lg bg-slate-100" />
              )}
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{item.courseTitle}</p>
              </div>
              <p className="font-bold text-slate-900">
                {item.price.toLocaleString('vi-VN')} {order.currency}
              </p>
            </div>
          ))}
        </div>

        <div className="p-6 flex items-center justify-between">
          <span className="text-slate-600 font-medium">Tổng cộng</span>
          <span className="text-2xl font-extrabold text-slate-900">
            {order.totalAmount.toLocaleString('vi-VN')} {order.currency}
          </span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

      <div className="mt-6 space-y-3">
        <button
          onClick={handlePayWithVnPay}
          disabled={!paymentUrl || processing}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-indigo-500/30"
        >
          Thanh toán qua VNPay
        </button>
        {!paymentUrl && (
          <p className="text-center text-xs text-amber-600">
            Liên kết VNPay đã hết hiệu lực ở phiên này. Hãy dùng nút giả lập bên dưới hoặc tạo lại đơn từ trang khóa học.
          </p>
        )}

        {devSimulatorEnabled && (
          <>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">Chế độ Sandbox / Dev</span></div>
            </div>

            <button
              onClick={() => handleSimulate(true)}
              disabled={processing}
              className="w-full bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-700 font-bold py-3 px-4 rounded-xl transition-all border border-emerald-200"
            >
              {processing ? 'Đang xử lý…' : 'Giả lập thanh toán thành công (IPN)'}
            </button>
            <button
              onClick={() => handleSimulate(false)}
              disabled={processing}
              className="w-full bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 font-medium py-2.5 px-4 rounded-xl transition-all border border-slate-200 text-sm"
            >
              Giả lập thanh toán thất bại
            </button>
          </>
        )}
      </div>

      <p className="text-center text-xs text-slate-400 mt-6">
        Trước khi thanh toán, vui lòng tham khảo{' '}
        <RouterLink to={ROUTES.PUBLIC.TERMS} target="_blank" className="text-indigo-600 hover:underline">
          Điều khoản sử dụng
        </RouterLink>{' '}
        và{' '}
        <RouterLink to={ROUTES.PUBLIC.REFUND_POLICY} target="_blank" className="text-indigo-600 hover:underline">
          Chính sách hoàn tiền
        </RouterLink>.
        <br />
        Thanh toán chỉ được xác nhận qua webhook (IPN) từ phía máy chủ, không qua trình duyệt.
      </p>
    </div>
  );
};

const CenteredMessage = ({ text }: { text: string }) => (
  <div className="max-w-2xl mx-auto px-4 py-20 text-center text-slate-500">{text}</div>
);

export default CheckoutPage;
