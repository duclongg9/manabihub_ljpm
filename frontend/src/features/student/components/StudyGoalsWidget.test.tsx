import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { StudyGoalsWidget } from './StudyGoalsWidget';

describe('StudyGoalsWidget', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the goal progress and opens a schedule form', () => {
    render(<StudyGoalsWidget jlptGoal="N3" courses={[{ id: 'course-1', title: 'JLPT N3 thực chiến' }]} />);

    expect(screen.getByTestId('study-goals-widget')).toBeInTheDocument();
    expect(screen.getByText('JLPT N3')).toBeInTheDocument();
    expect(screen.getByText('Bạn chưa có lịch học cố định. Hãy thêm buổi học đầu tiên.')).toBeInTheDocument();
    expect(screen.getByText('Kanji & Từ vựng')).toBeInTheDocument();
    expect(screen.getAllByText('0/60 phút')).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: 'Thêm lịch học' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Thêm lịch học', { selector: 'h2' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Tùy chỉnh/ }));
    expect(screen.getByText('Khóa học đang học: JLPT N3 thực chiến')).toBeInTheDocument();
  });

  it('supports inline weekly target editing and preset schedules', () => {
    render(<StudyGoalsWidget jlptGoal="N3" courses={[]} />);

    fireEvent.click(screen.getByRole('button', { name: 'Sửa mục tiêu tuần' }));
    const input = screen.getByDisplayValue('150');
    fireEvent.change(input, { target: { value: '180' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu mục tiêu tuần' }));
    expect(screen.getByText('0/180 phút/tuần')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Thêm lịch học' }));
    fireEvent.click(screen.getByRole('button', { name: /Tiêu chuẩn/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Lưu lịch' }));
    expect(screen.getByText('Lịch cố định')).toBeInTheDocument();
  });

  it('keeps the focus timer inside the learning page', () => {
    render(<StudyGoalsWidget jlptGoal="N3" courses={[]} />);

    expect(screen.queryByRole('button', { name: /Bắt đầu Pomodoro/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('pomodoro-timer')).not.toBeInTheDocument();
  });
});
