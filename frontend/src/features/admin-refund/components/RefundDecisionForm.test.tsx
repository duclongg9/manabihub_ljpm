import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RefundDecisionForm } from './RefundDecisionForm';

afterEach(cleanup);

describe('RefundDecisionForm', () => {
  it('requires an approval reason and a non-blank audit note', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <RefundDecisionForm
        action="approve"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );

    const submitButton = screen.getByRole('button', { name: 'Chấp thuận' });
    expect(submitButton).toBeDisabled();
    expect(
      screen.getByRole('option', { name: 'Đủ điều kiện theo chính sách hoàn tiền' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Đã quá thời hạn hoàn tiền' }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Mã lý do/), {
      target: { value: 'STANDARD_ELIGIBLE' },
    });
    fireEvent.change(screen.getByLabelText(/Căn cứ quyết định/), {
      target: { value: '   ' },
    });
    expect(submitButton).toBeDisabled();

    const note = screen.getByLabelText(/Căn cứ quyết định/);
    expect(note).toHaveAttribute('maxLength', '2000');
    fireEvent.change(note, {
      target: { value: '  Đã đối chiếu payment và eligibility snapshot.  ' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith({
        reasonCode: 'STANDARD_ELIGIBLE',
        note: 'Đã đối chiếu payment và eligibility snapshot.',
      });
    });
  });

  it('only offers rejection reason codes for a rejection', () => {
    render(
      <RefundDecisionForm
        action="reject"
        onConfirm={vi.fn().mockResolvedValue(undefined)}
        onCancel={vi.fn()}
        errorMessage="Yêu cầu đã được người khác xử lý."
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Yêu cầu đã được người khác xử lý.',
    );
    expect(
      screen.getByRole('option', { name: 'Đã quá thời hạn hoàn tiền' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Đủ điều kiện theo chính sách hoàn tiền' }),
    ).not.toBeInTheDocument();
  });
});
