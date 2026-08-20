import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { STORAGE_KEY, STUDY_PLAN_OPEN_SCHEDULE_EVENT, StudyGoalsWidget, todayKey } from './StudyGoalsWidget';

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
    expect(JSON.parse(window.localStorage.getItem('manabihub.student.study-plan.v1') ?? '{}').slots).toHaveLength(5);
  });

  it('keeps the focus timer inside the learning page', () => {
    render(<StudyGoalsWidget jlptGoal="N3" courses={[]} />);

    expect(screen.queryByRole('button', { name: /Bắt đầu Pomodoro/i })).not.toBeInTheDocument();
    expect(screen.queryByTestId('pomodoro-timer')).not.toBeInTheDocument();
  });

  it('edits and deletes an existing conflicting schedule slot', () => {
    const today = new Date();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      weekKey: todayKey(today), weeklyTargetMinutes: 150,
      slots: [{ id: 'slot-existing', dayOfWeek: today.getDay(), startTime: '20:00', durationMinutes: 25, skill: 'Kanji & Từ vựng', courseId: 'course-1', courseTitle: 'JLPT N3 thực chiến', enabled: true }],
      focusTotals: {}, attendance: {},
    }));
    render(<StudyGoalsWidget jlptGoal="N3" courses={[{ id: 'course-1', title: 'JLPT N3 thực chiến' }]} />);

    fireEvent(window, new CustomEvent(STUDY_PLAN_OPEN_SCHEDULE_EVENT, { detail: { slotId: 'slot-existing' } }));
    expect(screen.getByText('Sửa suất học', { selector: 'h2' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Giờ bắt đầu'), { target: { value: '21:15' } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').slots[0].startTime).toBe('21:15');

    fireEvent(window, new CustomEvent(STUDY_PLAN_OPEN_SCHEDULE_EVENT, { detail: { slotId: 'slot-existing' } }));
    fireEvent.click(screen.getByRole('button', { name: 'Xóa suất' }));
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '{}').slots).toHaveLength(0);
  });
});
