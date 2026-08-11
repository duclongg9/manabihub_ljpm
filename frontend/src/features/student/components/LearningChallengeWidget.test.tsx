import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { LearningChallengeWidget } from './LearningChallengeWidget';

describe('LearningChallengeWidget', () => {
  beforeEach(() => window.localStorage.clear());

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('opens a 12-card learning game and records a ranked attempt locally', () => {
    render(<LearningChallengeWidget accountKey="student-1" />);

    expect(screen.getByText('Thử thách Kanji tuần')).toBeInTheDocument();
    expect(screen.getByText('3/3 hôm nay')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Vào chơi ngay' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Manabi Match · Kanji N5')).toBeInTheDocument();
    expect(within(dialog).getAllByRole('button', { name: 'Thẻ đang úp' })).toHaveLength(12);
    expect(screen.getByText('2/3 hôm nay')).toBeInTheDocument();
  });
});
