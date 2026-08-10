import { render, screen } from '@testing-library/react';
import { useQuery } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStudentCourses } from '../hooks/useStudentCourses';
import { useStudentStats } from '../hooks/useStudentStats';
import { StudentDashboardPage } from './StudentDashboardPage';

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}));

vi.mock('../hooks/useStudentCourses', () => ({
  useStudentCourses: vi.fn(),
}));

vi.mock('../hooks/useStudentStats', () => ({
  useStudentStats: vi.fn(),
}));

describe('StudentDashboardPage', () => {
  beforeEach(() => {
    vi.mocked(useQuery).mockReturnValue({
      data: {
        id: 'student-1',
        email: 'long@example.com',
        fullName: 'Đức Long',
        phoneNumber: null,
        avatarUrl: null,
        displayName: 'Long',
        jlptGoal: 'N3',
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useQuery>);

    vi.mocked(useStudentStats).mockReturnValue({
      data: {
        totalEnrolledCourses: 4,
        activeCourses: 3,
        completedCourses: 1,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useStudentStats>);

    vi.mocked(useStudentCourses).mockReturnValue({
      data: {
        content: [
          {
            enrollmentId: 'enrollment-1',
            courseId: 'course-1',
            courseTitle: 'JLPT N3 thực chiến',
            thumbnailUrl: null,
            teacherName: 'Nguyễn Sensei',
            enrollmentStatus: 'ACTIVE',
            enrolledAt: '2026-07-01T00:00:00Z',
            progressPercentage: 35,
          },
        ],
        page: 0,
        size: 3,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useStudentCourses>);
  });

  it('renders real learning statistics and recent courses', () => {
    render(
      <MemoryRouter>
        <StudentDashboardPage />
      </MemoryRouter>,
    );

    expect(screen.getByText('Chào Long')).toBeInTheDocument();
    expect(screen.getByText('Mục tiêu: JLPT N3 · Trình độ hiện tại: N3')).toBeInTheDocument();
    expect(screen.getByTestId('mini-roadmap')).toBeInTheDocument();
    expect(screen.getByText('JLPT N3 thực chiến')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.queryByText('45 phút')).not.toBeInTheDocument();
    expect(screen.queryByText('25 từ')).not.toBeInTheDocument();
  });
});
