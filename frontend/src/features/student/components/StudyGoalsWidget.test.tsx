import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { StudyGoalsWidget } from './StudyGoalsWidget';

describe('StudyGoalsWidget', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the goal progress and opens a schedule form', () => {
    render(<StudyGoalsWidget jlptGoal="N3" courses={[{ id: 'course-1', title: 'JLPT N3 thực chiến' }]} />);

    expect(screen.getByTestId('study-goals-widget')).toBeInTheDocument();
    expect(screen.getByText('JLPT N3')).toBeInTheDocument();
    expect(screen.getByText('Bạn chưa có lịch học cố định. Hãy thêm buổi học đầu tiên.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Thêm lịch học' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Thêm lịch học', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByLabelText('Khóa học')).toBeInTheDocument();
  });
});
