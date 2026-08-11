import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { adminRefundApi } from '../api/adminRefundApi';
import type { RefundDetailResponse } from '../types';
import { AdminRefundDetail } from './AdminRefundDetail';

vi.mock('../api/adminRefundApi', () => ({
  adminRefundApi: {
    getRefundDetail: vi.fn(),
    approveRefund: vi.fn(),
    rejectRefund: vi.fn(),
  },
}));

const getRefundDetailMock = vi.mocked(adminRefundApi.getRefundDetail);
const approveRefundMock = vi.mocked(adminRefundApi.approveRefund);

const pendingRefund: RefundDetailResponse = {
  id: 'refund-1',
  orderId: 'order-1',
  orderCode: 'ORD-001',
  orderItemId: 'item-1',
  courseId: 'course-1',
  courseTitle: 'Spring Boot thực chiến',
  studentId: 'student-1',
  studentName: 'Nguyễn An',
  studentEmail: 'an@example.com',
  status: 'PENDING',
  reason: 'Không thể truy cập khóa học',
  currency: 'VND',
  grossAmount: 1_000_000,
  commissionAmount: 200_000,
  teacherNetAmount: 800_000,
  paymentStatus: 'SUCCESS',
  paymentProvider: 'VNPAY',
  paymentProviderTransactionId: 'VNP-123',
  paymentAmount: 1_000_000,
  escrowStatus: 'HELD',
  escrowAmount: 800_000,
  escrowReleaseAt: '2026-08-01T00:00:00Z',
  providerStatus: 'NOT_STARTED',
  providerName: 'VNPAY',
  providerReference: null,
  providerResultCode: null,
  providerAttemptCount: 0,
  reconciliationReasonCode: null,
  decisionReasonCode: null,
  eligibilitySnapshot: {
    eligible: true,
    progressPercent: 12,
    manualReviewReason: 'PLATFORM_ACCESS_FAILURE',
  },
  createdAt: '2026-07-29T08:00:00Z',
  updatedAt: '2026-07-29T08:00:00Z',
};

function renderDetail() {
  return render(
    <MemoryRouter initialEntries={['/admin/refunds/refund-1']}>
      <Routes>
        <Route path="/admin/refunds/:id" element={<AdminRefundDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(cleanup);

describe('AdminRefundDetail', () => {
  beforeEach(() => {
    getRefundDetailMock.mockReset();
    approveRefundMock.mockReset();
    getRefundDetailMock.mockResolvedValue(pendingRefund);
    approveRefundMock.mockResolvedValue(undefined);
  });

  it('renders payment, allocation, escrow and eligibility evidence before a decision', async () => {
    getRefundDetailMock.mockResolvedValue({
      ...pendingRefund,
      status: 'RECONCILIATION_REQUIRED',
      providerStatus: 'UNKNOWN',
      providerReference: 'RF-VNP-456',
      providerResultCode: 'TIMEOUT',
      providerAttemptCount: 1,
      reconciliationReasonCode: 'PROVIDER_RESULT_UNKNOWN',
      decisionReasonCode: 'PLATFORM_ACCESS_FAILURE',
      decisionNote: 'Provider chưa xác nhận kết quả cuối.',
      decidedAt: '2026-07-29T09:00:00Z',
    });

    renderDetail();

    expect(await screen.findByText('Spring Boot thực chiến')).toBeInTheDocument();
    expect(screen.getByText('VNP-123')).toBeInTheDocument();
    expect(screen.getByText('RF-VNP-456')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('PROVIDER_RESULT_UNKNOWN');
    expect(screen.getByText('Tiến độ học')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getAllByText(/1\.000\.000/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Có thể thử lại bằng nút trên sau khi kiểm tra provider/),
    ).toBeInTheDocument();
  });

  it('submits the machine-readable reason and shows provider-confirmed success', async () => {
    getRefundDetailMock
      .mockResolvedValueOnce(pendingRefund)
      .mockResolvedValueOnce({
        ...pendingRefund,
        status: 'APPROVED',
        providerStatus: 'SUCCESS',
        providerReference: 'VNP-RF-001',
        providerAttemptCount: 1,
      });

    renderDetail();

    fireEvent.click(await screen.findByRole('button', { name: 'Chấp thuận' }));
    fireEvent.change(screen.getByLabelText(/Mã lý do/), {
      target: { value: 'PLATFORM_ACCESS_FAILURE' },
    });
    fireEvent.change(screen.getByLabelText(/Căn cứ quyết định/), {
      target: { value: 'Đã xác minh lỗi truy cập từ nền tảng.' },
    });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Chấp thuận' }));

    await waitFor(() => {
      expect(approveRefundMock).toHaveBeenCalledWith('refund-1', {
        reasonCode: 'PLATFORM_ACCESS_FAILURE',
        note: 'Đã xác minh lỗi truy cập từ nền tảng.',
      });
    });
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Đã ghi có khoản hoàn tiền vào ví học viên và khóa quyền truy cập khóa học.',
    );
    expect(await screen.findByText('Đã hoàn tiền')).toBeInTheDocument();
  });

  it('closes the dialog and refreshes persisted reconciliation state', async () => {
    getRefundDetailMock
      .mockResolvedValueOnce(pendingRefund)
      .mockResolvedValueOnce({
        ...pendingRefund,
        status: 'RECONCILIATION_REQUIRED',
        providerStatus: 'UNAVAILABLE',
        providerAttemptCount: 1,
        reconciliationReasonCode: 'PROVIDER_UNAVAILABLE',
      });
    approveRefundMock.mockRejectedValue({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          messageCode: 'REFUND_RECONCILIATION_REQUIRED',
          message: 'Provider unavailable',
        },
      },
    });

    renderDetail();

    fireEvent.click(await screen.findByRole('button', { name: 'Chấp thuận' }));
    fireEvent.change(screen.getByLabelText(/Mã lý do/), {
      target: { value: 'STANDARD_ELIGIBLE' },
    });
    fireEvent.change(screen.getByLabelText(/Căn cứ quyết định/), {
      target: { value: 'Đủ điều kiện theo snapshot.' },
    });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Chấp thuận' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText(/Chưa thể hoàn tất tự động/)).toBeInTheDocument();
    });
    expect(await screen.findByText('Cần đối soát')).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === 'P' &&
          Boolean(element.textContent?.includes('PROVIDER_UNAVAILABLE')),
      ),
    ).toBeInTheDocument();
  });
});
