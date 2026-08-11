import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { StudyCalendar } from './StudyCalendar';
import { STORAGE_KEY, todayKey } from './StudyGoalsWidget';

function renderCalendar() {
  return render(
    <MemoryRouter initialEntries={['/student/dashboard']}>
      <StudyCalendar courses={[{ id: 'course-kanji', title: 'Kanji N5 nền tảng' }, { id: 'course-kaiwa', title: 'Giao tiếp tiếng Nhật' }]} />
    </MemoryRouter>,
  );
}

describe('StudyCalendar', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('renders month/week/day controls and opens a day agenda', () => {
    const today = new Date();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      weekKey: todayKey(today),
      weeklyTargetMinutes: 150,
      slots: [{
        id: 'slot-kanji', dayOfWeek: today.getDay(), startTime: '20:00', durationMinutes: 25,
        skill: 'Kanji & Từ vựng', courseId: 'course-kanji', courseTitle: 'Kanji N5 nền tảng',
        lessonTitle: 'Bài 3: Bộ thủ cơ bản', enabled: true,
      }],
      focusTotals: {}, attendance: {},
    }));

    renderCalendar();

    expect(screen.getByTestId('study-calendar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tháng' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tuần' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Hôm nay' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('checkbox', { name: 'Kanji N5 nền tảng' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Giao tiếp tiếng Nhật' })).toBeChecked();
    expect(screen.getByTestId(`calendar-event-slot-kanji-${todayKey(today)}`)).toHaveTextContent('20:00');

    fireEvent.click(screen.getByTestId(`calendar-day-${todayKey(today)}`));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByText('Kanji N5 nền tảng')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByText('Dự kiến: Bài 3: Bộ thủ cơ bản')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Bắt đầu học ngay' })).toBeInTheDocument();
  });

  it('marks overlapping slots as conflicts and supports course filters', async () => {
    const today = new Date();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      weekKey: todayKey(today),
      weeklyTargetMinutes: 150,
      slots: [
        { id: 'slot-kanji', dayOfWeek: today.getDay(), startTime: '20:00', durationMinutes: 50, skill: 'Kanji & Từ vựng', courseId: 'course-kanji', courseTitle: 'Kanji N5 nền tảng', enabled: true },
        { id: 'slot-kaiwa', dayOfWeek: today.getDay(), startTime: '20:25', durationMinutes: 25, skill: 'Ngữ pháp', courseId: 'course-kaiwa', courseTitle: 'Giao tiếp tiếng Nhật', enabled: true },
      ],
      focusTotals: {}, attendance: {},
    }));

    renderCalendar();
    fireEvent.click(screen.getByTestId(`calendar-day-${todayKey(today)}`));
    expect(screen.getAllByText('Trùng lịch').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByTestId(`calendar-day-${todayKey(today)}`));
    expect(within(screen.getByRole('dialog')).getByText('Giao tiếp tiếng Nhật')).toBeInTheDocument();
    expect(within(screen.getByRole('dialog')).queryByText('Kanji N5 nền tảng')).not.toBeInTheDocument();
  });
});
