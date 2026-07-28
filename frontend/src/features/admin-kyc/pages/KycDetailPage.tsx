import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminKycService, KYC_STATUS_LABELS } from '../services/adminKycService';
import type {
  KycRequestResponse,
  KycReviewRequest,
} from '../services/adminKycService';

const JLPT_AUTHENTICITY_GUIDE = 'https://www.jlpt.jp/e/faq/';

interface SafeVnptDetails {
  provider?: string | null;
  providerStatus?: string | null;
  identityOcr?: {
    fullName?: string | null;
    dateOfBirth?: string | null;
    idNumber?: string | null;
  };
  failureReasons?: unknown;
}

export function KycDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<KycRequestResponse | null>(null);
  const [certificateImageUrl, setCertificateImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('Thiếu mã hồ sơ KYC.');
      setLoading(false);
      return;
    }
    adminKycService
      .getKycDetail(id)
      .then(setDetail)
      .catch(() => setError('Không thể tải hồ sơ KYC. Vui lòng kiểm tra phiên đăng nhập và backend.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!detail?.certificateUrl) {
      return undefined;
    }
    let disposed = false;
    let objectUrl: string | null = null;
    setDocumentLoading(true);
    adminKycService
      .getDocumentObjectUrl(detail.certificateUrl)
      .then((url) => {
        objectUrl = url;
        if (!disposed) {
          setCertificateImageUrl(url);
        }
      })
      .catch(() => {
        if (!disposed) {
          setError('Không thể tải ảnh chứng chỉ được bảo vệ.');
        }
      })
      .finally(() => {
        if (!disposed) {
          setDocumentLoading(false);
        }
      });
    return () => {
      disposed = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [detail?.certificateUrl]);

  const vnptDetails = useMemo(
    () => parseSafeVnptDetails(detail?.vnptResponseDetails),
    [detail?.vnptResponseDetails],
  );
  const reviewReady =
    detail?.status === 'PENDING'
    && detail.vnptVerificationStatus === 'SDK_VERIFIED'
    && detail.exceptionStage === 'CERTIFICATE'
    && detail.exceptionType === 'JLPT_AUTHENTICITY_CHECK'
    && Boolean(detail.certificateCode)
    && Boolean(detail.certificateHolderName)
    && Boolean(detail.certificateDateOfBirth)
    && Boolean(detail.certificateLevel)
    && Boolean(detail.certificateOcrText)
    && Boolean(certificateImageUrl);

  async function handleReview(status: KycReviewRequest['status']) {
    if (!id || !detail) {
      return;
    }
    setError(null);
    setNoteError(null);
    if (status !== 'APPROVED' && !decisionNote.trim()) {
      setNoteError('Vui lòng nhập lý do cụ thể.');
      return;
    }
    setSubmitting(true);
    try {
      await adminKycService.reviewKyc(id, {
        status,
        decisionNote: decisionNote.trim() || undefined,
      });
      navigate('/admin/kyc');
    } catch {
      setError('Không thể lưu quyết định. Hồ sơ có thể đã được người khác xử lý hoặc chưa đủ điều kiện.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center gap-3 text-gray-600">
        <LoaderCircle className="h-6 w-6 animate-spin" />
        Đang tải hồ sơ JLPT...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-semibold">{error ?? 'Không tìm thấy hồ sơ.'}</p>
        <Link className="mt-2 inline-block text-sm underline" to="/admin/kyc">
          Quay lại hàng đợi
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-700"
          to="/admin/kyc"
        >
          <ArrowLeft className="h-4 w-4" />
          Hàng đợi JLPT
        </Link>
        <span className="font-mono text-xs text-gray-400">{detail.id}</span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Ứng viên giảng viên</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {detail.displayName || detail.teacherFullName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">{detail.teacherEmail}</p>
          </div>
          <div className="text-right">
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              {KYC_STATUS_LABELS[detail.status] ?? detail.status}
            </span>
            <p className="mt-2 text-xs text-gray-400">
              Nộp lúc {new Date(detail.createdAt).toLocaleString('vi-VN')}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Gate label="CCCD qua VNPT" passed={detail.vnptVerificationStatus === 'SDK_VERIFIED'} />
        <Gate label="OCR đọc thành công" passed={Boolean(detail.certificateOcrText)} />
        <Gate
          label="Tên và ngày sinh khớp"
          passed={detail.exceptionType === 'JLPT_AUTHENTICITY_CHECK'}
        />
        <Gate label="Không trùng chứng chỉ" passed={detail.exceptionStage === 'CERTIFICATE'} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <div className="space-y-5">
          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-700" />
              <h2 className="font-bold text-gray-900">Danh tính đã xác minh qua VNPT</h2>
            </div>
            <dl className="grid gap-4 text-sm sm:grid-cols-3">
              <Evidence label="Họ tên CCCD" value={vnptDetails?.identityOcr?.fullName} />
              <Evidence label="Ngày sinh CCCD" value={vnptDetails?.identityOcr?.dateOfBirth} />
              <Evidence label="Số CCCD" value={vnptDetails?.identityOcr?.idNumber} />
            </dl>
            <p className="mt-4 text-xs text-gray-500">
              Số CCCD được che trong giao diện quản trị. Dữ liệu thô của VNPT không được trả về trình duyệt.
            </p>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-5 w-5 text-red-700" />
                <h2 className="font-bold text-gray-900">Ảnh chứng chỉ JLPT</h2>
              </div>
              <a
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
                href={JLPT_AUTHENTICITY_GUIDE}
                rel="noreferrer"
                target="_blank"
              >
                Hướng dẫn xác minh chính thức
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="flex min-h-72 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              {documentLoading ? (
                <LoaderCircle className="h-7 w-7 animate-spin text-gray-400" />
              ) : certificateImageUrl ? (
                <img
                  alt="Chứng chỉ JLPT do ứng viên cung cấp"
                  className="max-h-[680px] w-full object-contain"
                  src={certificateImageUrl}
                />
              ) : (
                <p className="text-sm text-red-700">Không có ảnh chứng chỉ để đối chiếu.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900">Dữ liệu OCR để đối chiếu</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <Evidence label="Họ tên chứng chỉ" value={detail.certificateHolderName} />
              <Evidence label="Ngày sinh chứng chỉ" value={detail.certificateDateOfBirth} />
              <Evidence label="Cấp độ" value={detail.certificateLevel} />
              <Evidence label="Mã chứng chỉ" value={detail.certificateCode} />
            </dl>
            <pre className="mt-4 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-gray-950 p-4 text-xs text-gray-100">
              {detail.certificateOcrText ?? 'Không có dữ liệu OCR'}
            </pre>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
          <h2 className="font-bold text-gray-900">Quyết định xác minh JLPT</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Hệ thống đã hoàn tất kiểm tra kỹ thuật. Hãy xác minh chứng chỉ không bị giả hoặc sửa đổi
            theo hướng dẫn của Japan Foundation trước khi phê duyệt.
          </p>

          {detail.status !== 'PENDING' ? (
            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              Hồ sơ đã được xử lý bởi {detail.processedByEmail ?? 'quản trị viên'}.
              {detail.decisionNote && <p className="mt-2">Ghi chú: {detail.decisionNote}</p>}
              {detail.status === 'APPROVED' && (
                <p className="mt-2 text-xs text-gray-500">
                  Thu hồi sau duyệt chỉ được thực hiện từ trust case đã xác minh, không nằm trong màn hình KYC.
                </p>
              )}
            </div>
          ) : (
            <>
              {!reviewReady && (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  Thiếu bằng chứng bắt buộc. Không phê duyệt cho tới khi VNPT, OCR, đối chiếu danh tính,
                  kiểm tra trùng và ảnh chứng chỉ đều sẵn sàng.
                </div>
              )}
              <label className="mt-5 block text-sm font-semibold text-gray-700" htmlFor="decisionNote">
                Ghi chú quyết định
              </label>
              <textarea
                className={`mt-2 w-full rounded-lg border p-3 text-sm outline-none focus:ring-2 ${
                  noteError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-red-100'
                }`}
                id="decisionNote"
                onChange={(event) => {
                  setDecisionNote(event.target.value);
                  setNoteError(null);
                }}
                placeholder="Nguồn kiểm tra, kết quả đối chiếu hoặc lý do yêu cầu bổ sung..."
                rows={5}
                value={decisionNote}
              />
              {noteError && <p className="mt-1 text-xs text-red-700">{noteError}</p>}

              <div className="mt-4 grid gap-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!reviewReady || submitting}
                  onClick={() => void handleReview('APPROVED')}
                  type="button"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Xác nhận chứng chỉ thật
                </button>
                <button
                  className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                  disabled={submitting}
                  onClick={() => void handleReview('CORRECTION_REQUIRED')}
                  type="button"
                >
                  Yêu cầu nộp lại
                </button>
                <button
                  className="rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                  disabled={submitting}
                  onClick={() => void handleReview('REJECTED')}
                  type="button"
                >
                  Từ chối hồ sơ
                </button>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Gate({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border p-3 text-sm font-semibold ${
        passed
          ? 'border-green-200 bg-green-50 text-green-800'
          : 'border-red-200 bg-red-50 text-red-800'
      }`}
    >
      <CheckCircle2 className="h-4 w-4" />
      {label}
    </div>
  );
}

function Evidence({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
      <dd className="mt-1 break-words font-medium text-gray-900">{value || 'Không có dữ liệu'}</dd>
    </div>
  );
}

function parseSafeVnptDetails(value?: string | null): SafeVnptDetails | null {
  if (!value) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === 'object') {
      return parsed as SafeVnptDetails;
    }
  } catch {
    return null;
  }
  return null;
}
