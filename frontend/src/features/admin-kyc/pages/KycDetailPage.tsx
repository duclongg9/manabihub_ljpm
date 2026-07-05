import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminKycService, KYC_STATUS_LABELS } from '../services/adminKycService';
import type { KycRequestResponse } from '../services/adminKycService';

export function KycDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<KycRequestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    adminKycService.getKycDetail(id)
      .then((data) => {
        setDetail(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Không thể tải thông tin chi tiết hồ sơ KYC. Vui lòng kiểm tra kết nối.');
        setLoading(false);
      });
  }, [id]);

  const handleReview = async (status: 'APPROVED' | 'REJECTED' | 'CORRECTION_REQUIRED') => {
    if (!id || !detail) return;
    setNoteError(null);

    // Validate that decision note is required for Reject and Request Correction
    if (status === 'REJECTED' || status === 'CORRECTION_REQUIRED') {
      if (!decisionNote.trim()) {
        setNoteError('Vui lòng nhập lý do (thông tin bắt buộc).');
        return;
      }
    }

    setSubmitting(true);
    try {
      await adminKycService.reviewKyc(id, {
        status,
        decisionNote: decisionNote.trim(),
      });
      // Navigate back to queue page on success
      navigate('/admin/kyc');
    } catch {
      setError('Lỗi khi thực hiện quyết định. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Đang tải chi tiết hồ sơ...</span>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="max-w-3xl mx-auto mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        <p className="font-semibold">{error || 'Không tìm thấy hồ sơ.'}</p>
        <Link to="/admin/kyc" className="mt-2 inline-block text-sm text-red-600 underline hover:text-red-800">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  // Parse VNPT response metadata
  let vnptDetails: any = null;
  try {
    if (detail.vnptResponseDetails) {
      vnptDetails = JSON.parse(detail.vnptResponseDetails);
    }
  } catch (e) {
    // Keep null if JSON parse fails
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Breadcrumbs / Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/kyc"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-red-600 transition"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại hàng đợi duyệt
        </Link>
        <span className="text-xs text-gray-400">ID yêu cầu: {detail.id}</span>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-bold text-2xl shadow-inner">
            {detail.displayName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{detail.displayName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{detail.teacherEmail}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-gray-200">
                Email gốc: {detail.teacherEmail}
              </span>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                detail.status === 'PENDING'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : detail.status === 'APPROVED'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                {KYC_STATUS_LABELS[detail.status] || detail.status}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <p>Ngày gửi: {new Date(detail.createdAt).toLocaleString('vi-VN')}</p>
          <p className="mt-1">Cập nhật cuối: {new Date(detail.updatedAt).toLocaleString('vi-VN')}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Documents Review) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity Evidence (ID Cards) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Giấy tờ định danh (CCCD / Hộ chiếu)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Front side */}
              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-500 mb-2">Ảnh mặt trước</p>
                <div
                  className="relative aspect-[3/2] bg-gray-200 rounded overflow-hidden cursor-zoom-in border border-gray-300 hover:opacity-90 transition"
                  onClick={() => setPreviewImage(detail.idCardFrontUrl)}
                >
                  <img
                    src={detail.idCardFrontUrl}
                    alt="CCCD Mặt trước"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition flex items-center justify-center opacity-0 hover:opacity-100 text-white font-medium text-xs">
                    Xem ảnh phóng to
                  </div>
                </div>
              </div>
              {/* Back side */}
              <div className="border border-gray-100 rounded-lg p-3 bg-gray-50/50">
                <p className="text-xs font-semibold text-gray-500 mb-2">Ảnh mặt sau</p>
                <div
                  className="relative aspect-[3/2] bg-gray-200 rounded overflow-hidden cursor-zoom-in border border-gray-300 hover:opacity-90 transition"
                  onClick={() => setPreviewImage(detail.idCardBackUrl)}
                >
                  <img
                    src={detail.idCardBackUrl}
                    alt="CCCD Mặt sau"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/10 hover:bg-black/0 transition flex items-center justify-center opacity-0 hover:opacity-100 text-white font-medium text-xs">
                    Xem ảnh phóng to
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Certificates & Agreement */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Chứng chỉ chuyên môn</h3>
              <div className="mt-4 border border-gray-100 rounded-lg p-4 bg-gray-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Tài liệu Chứng chỉ chuyên môn</p>
                    <a
                      href={detail.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-600 font-medium hover:underline mt-0.5 block"
                    >
                      JLPT_N2_Certificate_2025.pdf (Nhấp để mở tệp)
                    </a>
                  </div>
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-1 rounded border border-green-200">
                  Khớp thông tin
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Bản quyền & Giảng dạy</h3>
              <div className="mt-3 flex items-start gap-2 bg-green-50/50 border border-green-100 rounded-lg p-4">
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="mt-1 h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Đã ký thoả thuận bản quyền điện tử</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Đã đọc, hiểu và đồng ý hoàn toàn với các cam kết về sở hữu trí tuệ, phân chia doanh thu và trách nhiệm nội dung trên nền tảng ManabiHub.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Verification Metrics & Decision Panel) */}
        <div className="space-y-6">
          {/* VNPT eKYC Results */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Kết quả đối soát VNPT</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Trạng thái eKYC:</span>
                <span className={`font-semibold ${
                  detail.vnptVerificationStatus === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {detail.vnptVerificationStatus === 'SUCCESS' ? 'Xác thực khớp' : 'Xác thực lỗi'}
                </span>
              </div>

              {vnptDetails && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-2 border border-gray-100 text-gray-600">
                  <div className="flex justify-between">
                    <span>Trùng khớp chân dung:</span>
                    <span className="font-bold text-gray-800">{vnptDetails.selfie_match ? '100% Khớp' : 'Không khớp'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Xác thực ảnh thẻ ID:</span>
                    <span className="font-bold text-gray-800">{vnptDetails.id_card_match ? 'Hợp lệ' : 'Không hợp lệ'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kiểm tra thực thể sống:</span>
                    <span className="font-bold text-gray-800">{vnptDetails.liveness || 'N/A'}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                <span className="text-gray-500 font-medium">Mức độ rủi ro:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded text-xs border ${
                  detail.riskLevel === 'LOW'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : detail.riskLevel === 'MEDIUM'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {detail.riskLevel === 'LOW' ? 'THẤP' : detail.riskLevel === 'MEDIUM' ? 'TRUNG BÌNH' : 'CAO'}
                </span>
              </div>
            </div>
          </div>

          {/* Decision Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Bảng phê duyệt</h3>

            {detail.status !== 'PENDING' ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-sm text-gray-500">
                <p className="font-medium text-gray-700">Yêu cầu đã được xử lý</p>
                <p className="text-xs text-gray-400 mt-1">
                  Đã duyệt bởi: {detail.processedByEmail || 'Hệ thống'}
                </p>
                {detail.decisionNote && (
                  <div className="mt-3 text-left p-2.5 bg-white rounded border border-gray-100 text-xs">
                    <span className="font-bold text-gray-600">Ghi chú:</span> {detail.decisionNote}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="decisionNote" className="block text-sm font-semibold text-gray-700">
                    Ý kiến phản hồi / Lý do duyệt
                  </label>
                  <p className="text-[11px] text-gray-400">Bắt buộc khi "Từ chối" hoặc "Yêu cầu sửa đổi".</p>
                  <textarea
                    id="decisionNote"
                    rows={4}
                    value={decisionNote}
                    onChange={(e) => {
                      setDecisionNote(e.target.value);
                      if (e.target.value.trim()) setNoteError(null);
                    }}
                    placeholder="Nhập lý do chi tiết..."
                    className={`w-full p-2.5 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-1 focus:ring-red-500 outline-none transition ${
                      noteError ? 'border-red-500 focus:ring-red-500' : 'border-gray-200'
                    }`}
                  />
                  {noteError && (
                    <p className="text-xs text-red-600 font-medium flex items-center gap-1 mt-1">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {noteError}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => handleReview('APPROVED')}
                    disabled={submitting}
                    className="w-full py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-sm shadow-sm transition hover:shadow-md disabled:opacity-50"
                  >
                    {submitting ? 'Đang thực hiện...' : 'Phê duyệt Hồ sơ (Approve)'}
                  </button>

                  <button
                    onClick={() => handleReview('CORRECTION_REQUIRED')}
                    disabled={submitting}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg text-sm shadow-sm transition hover:shadow-md disabled:opacity-50"
                  >
                    Yêu cầu sửa đổi (Request Correction)
                  </button>

                  <button
                    onClick={() => handleReview('REJECTED')}
                    disabled={submitting}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm shadow-sm transition hover:shadow-md disabled:opacity-50"
                  >
                    Từ chối hồ sơ (Reject)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              className="absolute -top-10 right-0 text-white font-bold hover:text-gray-300 text-lg"
              onClick={() => setPreviewImage(null)}
            >
              Đóng (ESC)
            </button>
            <img
              src={previewImage}
              alt="Phóng to"
              className="max-w-full max-h-[80vh] object-contain rounded-lg border border-white/20 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
