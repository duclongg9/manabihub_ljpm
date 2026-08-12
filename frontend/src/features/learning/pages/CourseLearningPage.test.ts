import { describe, expect, it } from 'vitest';
import { applySequentialLocks } from './CourseLearningPage';
import { normalizeWatchedSecondsAtVideoEnd } from '../utils/videoProgress';
import type { LearningLessonBlock, LearningModule } from '../types';

function lesson(id: string, status: LearningLessonBlock['progressStatus']): LearningLessonBlock {
  return {
    id,
    moduleId: 'module-1',
    type: 'TEXT',
    title: id,
    quizOptions: [],
    quizItems: [],
    flashcards: [],
    orderIndex: Number(id),
    contentAvailable: true,
    progressStatus: status,
    current: false,
    locked: false,
  };
}

describe('CourseLearningPage access guards', () => {
  it('derives sequential locks even when the API response omits them', () => {
    const modules: LearningModule[] = [{
      id: 'module-1',
      title: 'Module 1',
      orderIndex: 1,
      blocks: [
        lesson('1', 'NOT_STARTED'),
        lesson('2', 'NOT_STARTED'),
        lesson('3', 'COMPLETED'),
      ],
    }];

    const normalized = applySequentialLocks(modules);

    expect(normalized[0].blocks.map((block) => block.locked)).toEqual([false, true, false]);
    expect(modules[0].blocks.map((block) => block.locked)).toEqual([false, false, false]);
  });

  it('opens the next lesson only after all previous lessons are completed', () => {
    const modules: LearningModule[] = [{
      id: 'module-1',
      title: 'Module 1',
      orderIndex: 1,
      blocks: [lesson('1', 'COMPLETED'), lesson('2', 'COMPLETED'), lesson('3', 'NOT_STARTED')],
    }];

    expect(applySequentialLocks(modules)[0].blocks.map((block) => block.locked)).toEqual([false, false, false]);
  });
});

describe('CourseLearningPage video completion guards', () => {
  it('normalizes minor browser timing gaps when playback reaches the real end', () => {
    expect(normalizeWatchedSecondsAtVideoEnd(286, 300)).toBe(300);
  });

  it('does not complete a video that was mostly skipped', () => {
    expect(normalizeWatchedSecondsAtVideoEnd(120, 300)).toBe(120);
  });

  it('keeps the watched value when media duration is unavailable', () => {
    expect(normalizeWatchedSecondsAtVideoEnd(120, Number.NaN)).toBe(120);
  });
});
