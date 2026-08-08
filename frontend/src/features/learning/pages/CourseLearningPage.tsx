import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  LinearProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Radio,
  Stack,
  Typography,
  TextField,
  ListItem,
  IconButton,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import { isAxiosError } from 'axios';
import ReactPlayer from 'react-player';
import { sanitizeRichText } from '../../../shared/security/sanitizeRichText';
import { learningService } from '../services/learningService';
import type {
  CourseLearning,
  CourseProgressSummary,
  FinalTestAttempt,
  FinalTestEligibility,
  FinalTestSubmissionResult,
  LearningLessonBlock,
  LearningCertificate,
  QuizQuestion,
  QuizSubmissionResult,
} from '../types';
import { ROUTES } from '../../../shared/constants/routes';
import { getAuthSession, hasAnyRole } from '../../../shared/auth/authSession';
import { ROLES } from '../../../shared/constants/roles';
import { ReportViolationModal } from '../../violation/components/ReportViolationModal';
import {
  isClipboardShortcut,
  isSingleCharacterMutation,
  readLocalStorageValue,
  removeLocalStorageValue,
  writeLocalStorageValue,
} from '../utils/learningInputGuard';

const VIDEO_SAVE_INTERVAL_SECONDS = 10;
const COURSE_SELECTION_STORAGE_PREFIX = 'manabihub:course-selection:';
const WRITING_DRAFT_STORAGE_PREFIX = 'manabihub:writing-draft:';
const QUIZ_ANSWERS_STORAGE_PREFIX = 'manabihub:quiz-answers:';
const FINAL_TEST_STORAGE_PREFIX = 'manabihub:final-test:';

interface LocalWritingDraft {
  content: string;
  savedAt: number;
}

function publicStorageScope() {
  return getAuthSession('public')?.subject ?? 'anonymous';
}

function courseSelectionStorageKey(courseId: string) {
  return `${COURSE_SELECTION_STORAGE_PREFIX}${publicStorageScope()}:${courseId}`;
}

function writingDraftStorageKey(blockId: string) {
  return `${WRITING_DRAFT_STORAGE_PREFIX}${publicStorageScope()}:${blockId}`;
}

function quizAnswersStorageKey(blockId: string) {
  return `${QUIZ_ANSWERS_STORAGE_PREFIX}${publicStorageScope()}:${blockId}`;
}

function finalTestStorageKey(courseId: string) {
  return `${FINAL_TEST_STORAGE_PREFIX}${publicStorageScope()}:${courseId}`;
}

interface LocalFinalTestState {
  attempt: FinalTestAttempt;
  answers: Record<string, string[]>;
}

export function CourseLearningPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [learning, setLearning] = useState<CourseLearning | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const session = getAuthSession('public');
  const canReport = session ? hasAnyRole(session, [ROLES.STUDENT, ROLES.TEACHER]) : false;

  useEffect(() => {
    if (!courseId) return;
    let active = true;

    learningService
      .openCourse(courseId)
      .then((data) => {
        if (!active) return;
        setLearning(data);
        const availableBlockIds = new Set(data.modules.flatMap((module) => module.blocks.map((block) => block.id)));
        const savedBlockId = readLocalStorageValue<string>(courseSelectionStorageKey(data.courseId));
        setSelectedBlockId(
          savedBlockId && availableBlockIds.has(savedBlockId)
            ? savedBlockId
            : data.currentLessonBlockId ?? data.modules[0]?.blocks[0]?.id ?? null,
        );
      })
      .catch((err) => {
        if (!active) return;
        if (isAxiosError(err) && err.response?.status === 403) {
          // SRS 3a: no active enrollment -> redirect to course detail
          navigate(`/courses/${courseId}`, { replace: true });
          return;
        }
        setError('Không thể tải nội dung khoá học. Vui lòng thử lại.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [courseId, navigate]);

  useEffect(() => {
    if (!courseId || !selectedBlockId) return;
    writeLocalStorageValue(courseSelectionStorageKey(courseId), selectedBlockId);
  }, [courseId, selectedBlockId]);

  const allBlocks = useMemo(
    () => (learning ? learning.modules.flatMap((module) => module.blocks) : []),
    [learning],
  );

  const selectedBlock = useMemo(
    () => allBlocks.find((block) => block.id === selectedBlockId) ?? null,
    [allBlocks, selectedBlockId],
  );

  const selectedIndex = selectedBlock ? allBlocks.findIndex((block) => block.id === selectedBlock.id) : -1;

  const updateBlock = useCallback((blockId: string, patch: Partial<LearningLessonBlock>) => {
    setLearning((prev) => {
      if (!prev) return prev;
      const modules = prev.modules.map((module) => ({
        ...module,
        blocks: module.blocks.map((block) => (block.id === blockId ? { ...block, ...patch } : block)),
      }));
      const blocks = modules.flatMap((module) => module.blocks);
      const completedLessons = blocks.filter((block) => block.progressStatus === 'COMPLETED').length;
      const totalLessons = blocks.length;
      return {
        ...prev,
        modules,
        completedLessons,
        progressPercent: totalLessons === 0 ? 0 : Math.round((completedLessons * 10000) / totalLessons) / 100,
        courseCompleted: totalLessons > 0 && completedLessons === totalLessons,
      };
    });
  }, []);

  const handleMarkComplete = async () => {
    if (!selectedBlock || completing) return;
    setCompleting(true);
    try {
      const progress = await learningService.markLessonComplete(selectedBlock.id);
      updateBlock(selectedBlock.id, {
        progressStatus: progress.status,
        completedAt: progress.completedAt,
      });
      const next = allBlocks[selectedIndex + 1];
      if (next) {
        setSelectedBlockId(next.id);
      }
    } catch {
      setError('Không thể lưu trạng thái hoàn thành. Vui lòng thử lại.');
    } finally {
      setCompleting(false);
    }
  };

  const handleVideoProgressSaved = useCallback(
    (blockId: string, positionSeconds: number, status: LearningLessonBlock['progressStatus']) => {
      updateBlock(blockId, { lastVideoPositionSeconds: positionSeconds, progressStatus: status });
    },
    [updateBlock],
  );

  const handleFlashcardProgressSaved = useCallback(
    (blockId: string, cardIndex: number, status: 'REMEMBERED' | 'NEEDS_REVIEW', progressStatus: LearningLessonBlock['progressStatus']) => {
      setLearning((prev) => {
        if (!prev) return prev;
        const modules = prev.modules.map((module) => ({
          ...module,
          blocks: module.blocks.map((block) => {
            if (block.id !== blockId) return block;
            const newStatuses = [...(block.flashcardStatuses || [])];
            newStatuses[cardIndex] = status;
            return { ...block, flashcardStatuses: newStatuses, progressStatus };
          }),
        }));

        const blocks = modules.flatMap((module) => module.blocks);
        const completedLessons = blocks.filter((block) => block.progressStatus === 'COMPLETED').length;
        const totalLessons = blocks.length;
        return {
          ...prev,
          modules,
          completedLessons,
          progressPercent: totalLessons === 0 ? 0 : Math.round((completedLessons * 10000) / totalLessons) / 100,
          courseCompleted: totalLessons > 0 && completedLessons === totalLessons,
        };
      });
    },
    [],
  );

  const handleWritingProgressSaved = useCallback((blockId: string) => {
    setLearning((prev) => {
      if (!prev) return prev;
      const newModules = prev.modules.map((m) => ({
        ...m,
        blocks: m.blocks.map((b) => {
          if (b.id !== blockId) return b;
          return {
            ...b,
            progressStatus: 'COMPLETED' as const,
          };
        }),
      }));
      const newCompleted = newModules
        .flatMap((m) => m.blocks)
        .filter((b) => b.progressStatus === 'COMPLETED').length;
      const newTotal = newModules.flatMap((m) => m.blocks).length;
      return {
        ...prev,
        modules: newModules,
        completedLessons: newCompleted,
        progressPercent: newTotal > 0 ? Math.round((newCompleted * 10000) / newTotal) / 100 : 0,
        courseCompleted: newTotal > 0 && newCompleted === newTotal,
      };
    });
  }, []);

  const handleQuizProgressSaved = useCallback(
    (blockId: string, status: LearningLessonBlock['progressStatus']) => {
      updateBlock(blockId, { progressStatus: status });
    },
    [updateBlock],
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !learning) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!learning) return null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(ROUTES.STUDENT.MY_COURSES)}>
          My Learning
        </Button>
        <Typography variant="h5" noWrap sx={{ fontWeight: 700, flexGrow: 1 }}>
          {learning.courseTitle}
        </Typography>
        {learning.courseCompleted && <Chip icon={<DoneAllIcon />} label="Đã hoàn thành khoá học" color="success" />}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <LinearProgress
          variant="determinate"
          value={learning.progressPercent}
          color={learning.courseCompleted ? 'success' : 'primary'}
          sx={{ flexGrow: 1, height: 10, borderRadius: 5 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 110 }}>
          {learning.completedLessons}/{learning.totalLessons} bài · {learning.progressPercent.toFixed(0)}%
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {learning.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {learning.warnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        </Alert>
      )}

      <FinalTestPanel
        courseId={learning.courseId}
        completedLessons={learning.completedLessons}
      />

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <Paper variant="outlined" sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0, alignSelf: 'flex-start' }}>
          {learning.modules.map((module) => (
            <Box key={module.id}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, px: 2, pt: 2, pb: 1, color: 'text.secondary' }}>
                {module.orderIndex}. {module.title}
              </Typography>
              <List dense disablePadding>
                {module.blocks.map((block) => (
                  <ListItemButton
                    key={block.id}
                    selected={block.id === selectedBlockId}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 34 }}>
                      {block.progressStatus === 'COMPLETED' ? (
                        <CheckCircleIcon color="success" fontSize="small" />
                      ) : block.progressStatus === 'IN_PROGRESS' ? (
                        <PlayCircleOutlineIcon color="primary" fontSize="small" />
                      ) : (
                        <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      disableTypography
                      primary={
                        <Typography variant="body2" noWrap>
                          {block.title}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" component="div">
                          {blockTypeLabel(block)}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                ))}
              </List>
              <Divider />
            </Box>
          ))}
        </Paper>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {selectedBlock ? (
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                  <Chip size="small" label={selectedBlock.type} variant="outlined" />
                  <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }} noWrap>
                    {selectedBlock.title}
                  </Typography>
                  {canReport && (
                    <Tooltip title="Báo cáo nội dung này">
                      <IconButton
                        size="small"
                        color="warning"
                        onClick={() => setReportModalOpen(true)}
                      >
                        <ReportProblemOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {selectedBlock.progressStatus === 'COMPLETED' && (
                    <Chip size="small" icon={<CheckCircleIcon />} label="Đã hoàn thành" color="success" />
                  )}
                </Stack>

                {!selectedBlock.contentAvailable ? (
                  <Alert severity="warning">Nội dung bài học hiện chưa sẵn sàng. Vui lòng quay lại sau.</Alert>
                ) : (
                  <BlockContent
                    block={selectedBlock}
                    onVideoProgressSaved={handleVideoProgressSaved}
                    onQuizProgressSaved={handleQuizProgressSaved}
                    onFlashcardProgressSaved={handleFlashcardProgressSaved}
                    onWritingProgressSaved={handleWritingProgressSaved}
                  />
                )}

                <Divider sx={{ my: 2 }} />
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'space-between' }}>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    disabled={selectedIndex <= 0}
                    onClick={() => setSelectedBlockId(allBlocks[selectedIndex - 1].id)}
                  >
                    Bài trước
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleIcon />}
                    disabled={
                      completing ||
                      selectedBlock.progressStatus === 'COMPLETED' ||
                      ['QUIZ', 'FLASHCARD', 'WRITING'].includes(selectedBlock.type)
                    }
                    onClick={handleMarkComplete}
                  >
                    {selectedBlock.progressStatus === 'COMPLETED' ? 'Đã hoàn thành' : 'Hoàn thành bài học'}
                  </Button>
                  <Button
                    endIcon={<ArrowForwardIcon />}
                    disabled={selectedIndex < 0 || selectedIndex >= allBlocks.length - 1}
                    onClick={() => setSelectedBlockId(allBlocks[selectedIndex + 1].id)}
                  >
                    Bài sau
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ) : learning.modules.length === 0 ? (
            <Alert severity="info">Khoá học chưa có nội dung bài học.</Alert>
          ) : null}
        </Box>
      </Box>

      {selectedBlock && (
        <ReportViolationModal
          open={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="LESSON_BLOCK"
          targetId={selectedBlock.id}
        />
      )}
    </Box>
  );
}

function blockTypeLabel(block: LearningLessonBlock): string {
  switch (block.type) {
    case 'VIDEO':
      return block.durationMinutes ? `Video · ${block.durationMinutes} phút` : 'Video';
    case 'TEXT':
      return 'Bài đọc';
    case 'QUIZ':
      return 'Trắc nghiệm';
    case 'FLASHCARD':
      return 'Flashcard';
    case 'WRITING':
      return 'Bài viết';
    default:
      return block.type;
  }
}

interface BlockContentProps {
  block: LearningLessonBlock;
  onVideoProgressSaved: (
    blockId: string,
    positionSeconds: number,
    status: LearningLessonBlock['progressStatus'],
  ) => void;
  onFlashcardProgressSaved: (
    blockId: string,
    cardIndex: number,
    status: 'REMEMBERED' | 'NEEDS_REVIEW',
    progressStatus: LearningLessonBlock['progressStatus'],
  ) => void;
  onQuizProgressSaved: (
    blockId: string,
    progressStatus: LearningLessonBlock['progressStatus'],
  ) => void;
  onWritingProgressSaved: (blockId: string) => void;
}

function BlockContent({
  block,
  onVideoProgressSaved,
  onQuizProgressSaved,
  onFlashcardProgressSaved,
  onWritingProgressSaved,
}: BlockContentProps) {
  switch (block.type) {
    case 'VIDEO':
      return <VideoBlock key={block.id} block={block} onProgressSaved={onVideoProgressSaved} />;
    case 'TEXT':
      return (
        <Box
          sx={{ whiteSpace: 'pre-wrap', typography: 'body1' }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.content) }}
        />
      );
    case 'QUIZ':
      return (
        <QuizBlock
          key={block.id}
          blockId={block.id}
          questions={block.quizItems}
          onProgressSaved={onQuizProgressSaved}
        />
      );
    case 'FLASHCARD':
      return <FlashcardBlock key={block.id} block={block} onProgressSaved={onFlashcardProgressSaved} />;
    case 'WRITING':
      return <WritingBlock key={block.id} block={block} onProgressSaved={() => onWritingProgressSaved(block.id)} />;
    default:
      return null;
  }
}

function VideoBlock({
  block,
  onProgressSaved,
}: {
  block: LearningLessonBlock;
  onProgressSaved: BlockContentProps['onVideoProgressSaved'];
}) {
  const playerRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(block.lastVideoPositionSeconds ?? 0);
  const isReadyRef = useRef(false);

  const pendingPositionRef = useRef<number | null>(null);
  const isSavingRef = useRef(false);

  const savePosition = useCallback(
    (positionSeconds: number) => {
      pendingPositionRef.current = positionSeconds;

      const flush = () => {
        if (isSavingRef.current || pendingPositionRef.current === null) return;

        const positionToSave = pendingPositionRef.current;
        if (positionToSave === lastSavedRef.current) {
          pendingPositionRef.current = null;
          return;
        }

        isSavingRef.current = true;
        pendingPositionRef.current = null;
        let success = false;

        learningService
          .saveVideoProgress(block.id, positionToSave)
          .then((progress) => {
            lastSavedRef.current = positionToSave;
            onProgressSaved(block.id, positionToSave, progress.status);
            success = true;
          })
          .catch(() => {
            // Non-fatal: keep playing; next tick will retry.
            if (pendingPositionRef.current === null) {
              pendingPositionRef.current = positionToSave;
            }
          })
          .finally(() => {
            isSavingRef.current = false;
            if (success && pendingPositionRef.current !== null && pendingPositionRef.current !== lastSavedRef.current) {
              flush();
            }
          });
      };

      flush();
    },
    [block.id, onProgressSaved],
  );

  const handleReady = () => {
    const video = playerRef.current;
    if (video && !isReadyRef.current && block.lastVideoPositionSeconds && block.lastVideoPositionSeconds > 0) {
      isReadyRef.current = true;
      video.currentTime = Math.min(block.lastVideoPositionSeconds, video.duration || block.lastVideoPositionSeconds);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.paused) return;
    const position = Math.floor(video.currentTime);
    if (position - lastSavedRef.current >= VIDEO_SAVE_INTERVAL_SECONDS) {
      savePosition(position);
    }
  };

  const handlePause = () => {
    const player = playerRef.current;
    if (!player || player.ended) return;
    const position = Math.floor(player.currentTime);
    if (position !== lastSavedRef.current) {
      savePosition(position);
    }
  };

  return (
    <Box>
      <Box sx={{ position: 'relative', paddingTop: '56.25%', background: '#000', borderRadius: 2, overflow: 'hidden' }}>
        <ReactPlayer
          ref={playerRef}
          src={block.videoUrl}
          controls
          width="100%"
          height="100%"
          style={{ position: 'absolute', top: 0, left: 0 }}
          onLoadedMetadata={handleReady}
          onTimeUpdate={handleTimeUpdate}
          onPause={handlePause}
        />
      </Box>
      {block.content && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
          {block.content}
        </Typography>
      )}
    </Box>
  );
}

function QuizBlock({
  blockId,
  questions,
  onProgressSaved,
}: {
  blockId: string;
  questions: QuizQuestion[];
  onProgressSaved: BlockContentProps['onQuizProgressSaved'];
}) {
  const [answers, setAnswers] = useState<string[]>(() => {
    const savedAnswers = readLocalStorageValue<unknown>(quizAnswersStorageKey(blockId));
    if (Array.isArray(savedAnswers) && savedAnswers.length === questions.length) {
      return savedAnswers.map((answer) => typeof answer === 'string' ? answer : '');
    }
    return questions.map(() => '');
  });
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (result) return;
    writeLocalStorageValue(quizAnswersStorageKey(blockId), answers);
  }, [answers, blockId, result]);

  if (questions.length === 0) {
    return <Alert severity="info">Bài trắc nghiệm chưa có câu hỏi.</Alert>;
  }

  const handleSubmit = async () => {
    if (answers.some((answer) => !answer) || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const nextResult = await learningService.submitQuiz(blockId, answers);
      setResult(nextResult);
      removeLocalStorageValue(quizAnswersStorageKey(blockId));
      onProgressSaved(blockId, nextResult.progressStatus);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMsg(error.response?.data?.message || 'Không thể nộp bài trắc nghiệm.');
      } else {
        setErrorMsg('Không thể nộp bài trắc nghiệm.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={2}>
      {result && (
        <Alert severity={result.passed ? 'success' : 'warning'}>
          Kết quả: {result.score.toFixed(0)}% ({result.correctCount}/{result.totalQuestions} câu đúng).
          {result.passed ? ' Bài học đã hoàn thành.' : ' Cần đạt tối thiểu 80% để hoàn thành bài học.'}
        </Alert>
      )}
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      {questions.map((question, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Câu {index + 1}: {question.question}
          </Typography>
          <Stack>
            {question.options.map((option) => {
              const feedback = result?.feedback.find((item) => item.questionIndex === index);
              return (
                <Stack
                  key={option}
                  direction="row"
                  onClick={() => {
                    if (!submitting) {
                      setAnswers((current) => current.map((value, answerIndex) => (
                        answerIndex === index ? option : value
                      )));
                      setResult(null);
                    }
                  }}
                  sx={{
                    alignItems: 'center',
                    borderRadius: 1,
                    px: 1,
                    cursor: submitting ? 'default' : 'pointer',
                    bgcolor: feedback && option === feedback.correctAnswer ? 'success.50' : 'transparent',
                  }}
                >
                  <Radio
                    checked={answers[index] === option}
                    disabled={submitting}
                    size="small"
                    slotProps={{ input: { 'aria-label': option } }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {option}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
          {result?.feedback[index] && (
            <Typography
              variant="caption"
              color={result.feedback[index].correct ? 'success.main' : 'warning.main'}
            >
              {result.feedback[index].correct
                ? 'Trả lời đúng.'
                : `Đáp án đúng: ${result.feedback[index].correctAnswer}`}
            </Typography>
          )}
        </Paper>
      ))}
      <Box>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || answers.some((answer) => !answer)}
        >
          {submitting ? 'Đang chấm...' : 'Nộp bài trắc nghiệm'}
        </Button>
      </Box>
    </Stack>
  );
}

function FinalTestPanel({
  courseId,
  completedLessons,
}: {
  courseId: string;
  completedLessons: number;
}) {
  const [eligibility, setEligibility] = useState<FinalTestEligibility | null>(null);
  const [progressSummary, setProgressSummary] = useState<CourseProgressSummary | null>(null);
  const [certificate, setCertificate] = useState<LearningCertificate | null>(null);
  const [attempt, setAttempt] = useState<FinalTestAttempt | null>(() => {
    const saved = readLocalStorageValue<LocalFinalTestState>(finalTestStorageKey(courseId));
    return saved?.attempt ?? null;
  });
  const [answers, setAnswers] = useState<Record<string, string[]>>(() => {
    const saved = readLocalStorageValue<LocalFinalTestState>(finalTestStorageKey(courseId));
    return saved?.answers ?? {};
  });
  const [result, setResult] = useState<FinalTestSubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const loadEligibility = useCallback(async () => {
    try {
      const [finalTestValue, progressValue, certificateValue] = await Promise.all([
        learningService.getFinalTestEligibility(courseId),
        learningService.getCourseProgress(courseId),
        learningService.getCertificate(courseId),
      ]);
      setEligibility(finalTestValue);
      setProgressSummary(progressValue);
      setCertificate(certificateValue);
      if (!finalTestValue.eligible || finalTestValue.passed) {
        setAttempt(null);
        setAnswers({});
        removeLocalStorageValue(finalTestStorageKey(courseId));
      }
    } catch {
      setErrorMsg('Không thể kiểm tra điều kiện làm Final Test.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    setLoading(true);
    void loadEligibility();
  }, [completedLessons, loadEligibility]);

  useEffect(() => {
    if (!attempt || result) return;
    const updateTimer = () => {
      setSecondsLeft(Math.max(0, Math.ceil((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000)));
    };
    updateTimer();
    const timer = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, result]);

  useEffect(() => {
    if (!attempt || result || secondsLeft !== 0) return;
    if (new Date(attempt.expiresAt).getTime() > Date.now()) return;

    setErrorMsg('Lượt thi đã hết thời gian. Hãy bắt đầu lượt tiếp theo nếu vẫn còn lượt.');
    setAttempt(null);
    setAnswers({});
    removeLocalStorageValue(finalTestStorageKey(courseId));
    void loadEligibility();
  }, [attempt, courseId, loadEligibility, result, secondsLeft]);

  useEffect(() => {
    if (!attempt || result) {
      removeLocalStorageValue(finalTestStorageKey(courseId));
      return;
    }
    if (new Date(attempt.expiresAt).getTime() <= Date.now()) return;
    writeLocalStorageValue(finalTestStorageKey(courseId), { attempt, answers } satisfies LocalFinalTestState);
  }, [answers, attempt, courseId, result]);

  const handleStart = async () => {
    setWorking(true);
    setErrorMsg(null);
    try {
      const value = await learningService.startFinalTest(courseId);
      setSecondsLeft(Math.max(0, Math.ceil((new Date(value.expiresAt).getTime() - Date.now()) / 1000)));
      setAttempt(value);
      setAnswers({});
      setResult(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMsg(error.response?.data?.message || 'Không thể bắt đầu Final Test.');
      } else {
        setErrorMsg('Không thể bắt đầu Final Test.');
      }
      await loadEligibility();
    } finally {
      setWorking(false);
    }
  };

  const toggleChoice = (questionId: string, choiceId: string) => {
    setAnswers((current) => {
      const selected = current[questionId] || [];
      return {
        ...current,
        [questionId]: selected.includes(choiceId)
          ? selected.filter((value) => value !== choiceId)
          : [...selected, choiceId],
      };
    });
  };

  const handleSubmit = async () => {
    if (!attempt || working || secondsLeft <= 0) return;
    setWorking(true);
    setErrorMsg(null);
    try {
      const value = await learningService.submitFinalTest(
        courseId,
        attempt.attemptId,
        attempt.questions.map((question) => ({
          questionId: question.id,
          selectedChoiceIds: answers[question.id] || [],
        })),
      );
      setResult(value);
      removeLocalStorageValue(finalTestStorageKey(courseId));
      await loadEligibility();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMsg(error.response?.data?.message || 'Không thể nộp Final Test.');
      } else {
        setErrorMsg('Không thể nộp Final Test.');
      }
    } finally {
      setWorking(false);
    }
  };

  const handleGenerateCertificate = async () => {
    if (working) return;
    setWorking(true);
    setErrorMsg(null);
    try {
      const value = await learningService.generateCertificate(courseId);
      setCertificate(value);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setErrorMsg(error.response?.data?.message || 'Không thể phát hành chứng chỉ.');
      } else {
        setErrorMsg('Không thể phát hành chứng chỉ.');
      }
      await loadEligibility();
    } finally {
      setWorking(false);
    }
  };

  const allAnswered = attempt?.questions.every((question) => (answers[question.id]?.length || 0) > 0) ?? false;
  const reasonText: Record<string, string> = {
    FINAL_TEST_NOT_CONFIGURED: 'Khoá học chưa cấu hình Final Test.',
    FINAL_TEST_ALREADY_PASSED: 'Bạn đã vượt qua Final Test.',
    LESSONS_INCOMPLETE: 'Hoàn thành tất cả bài học để mở Final Test.',
    ATTEMPTS_EXHAUSTED: 'Bạn đã sử dụng hết số lần thi.',
  };
  const certificateReasonText: Record<string, string> = {
    PROGRESS_INCOMPLETE: 'Hoàn thành toàn bộ nội dung khoá học.',
    ASSIGNMENTS_INCOMPLETE: 'Nộp đầy đủ các bài Writing bắt buộc.',
    EXERCISE_AVERAGE_BELOW_85: 'Điểm Quiz trung bình cần đạt tối thiểu 85%.',
    FINAL_TEST_NOT_PASSED: 'Vượt qua Final Test.',
  };

  if (loading) {
    return <LinearProgress sx={{ mb: 2 }} />;
  }

  return (
    <Box sx={{ borderBlock: '1px solid', borderColor: 'divider', py: 2, mb: 3 }}>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}
        >
          <AssignmentTurnedInOutlinedIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Final Test
          </Typography>
          {eligibility?.configured && (
            <Chip
              size="small"
              label={`${eligibility.attemptsUsed}/${eligibility.attemptsAllowed} lượt đã dùng`}
              variant="outlined"
            />
          )}
          {progressSummary && (
            <Chip
              size="small"
              color={progressSummary.certificateEligibility.eligible ? 'success' : 'default'}
              label={progressSummary.certificateEligibility.eligible
                ? 'Đủ điều kiện chứng chỉ'
                : 'Chứng chỉ đang khoá'}
              variant={progressSummary.certificateEligibility.eligible ? 'filled' : 'outlined'}
            />
          )}
        </Stack>

        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        {progressSummary && !progressSummary.certificateEligibility.eligible && (
          <Alert severity="info">
            Điều kiện chứng chỉ còn thiếu:{' '}
            {progressSummary.certificateEligibility.reasons
              .map((reason) => certificateReasonText[reason] || reason)
              .join(' ')}
          </Alert>
        )}

        {progressSummary?.certificateEligibility.eligible && !certificate && (
          <Box>
            <Button
              variant="contained"
              color="success"
              startIcon={<WorkspacePremiumOutlinedIcon />}
              onClick={handleGenerateCertificate}
              disabled={working}
            >
              {working ? 'Đang phát hành...' : 'Phát hành chứng chỉ'}
            </Button>
          </Box>
        )}

        {certificate && (
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 2, sm: 3 },
              textAlign: 'center',
              borderColor: 'success.main',
              bgcolor: 'background.paper',
            }}
          >
            <WorkspacePremiumOutlinedIcon color="success" sx={{ fontSize: 48 }} />
            <Typography variant="overline" color="text.secondary">
              ManabiHub Certificate of Completion
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, my: 1 }}>
              {certificate.studentName}
            </Typography>
            <Typography variant="body1">
              Đã hoàn thành khoá học <strong>{certificate.courseTitle}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Cấp ngày {new Date(certificate.issuedAt).toLocaleDateString('vi-VN')} · {certificate.certificateNumber}
            </Typography>
            <Button
              sx={{ mt: 2 }}
              variant="outlined"
              startIcon={<DownloadOutlinedIcon />}
              onClick={() => downloadCertificateView(certificate)}
            >
              Tải bản chứng chỉ
            </Button>
          </Paper>
        )}

        {!attempt && eligibility && (
          <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
            <Alert severity={eligibility.passed ? 'success' : eligibility.eligible ? 'info' : 'warning'} sx={{ width: '100%' }}>
              {eligibility.eligible
                ? 'Bạn đã hoàn thành nội dung bắt buộc và có thể bắt đầu Final Test.'
                : reasonText[eligibility.reason || ''] || 'Bạn chưa đủ điều kiện làm Final Test.'}
            </Alert>
            {eligibility.eligible && (
              <Button variant="contained" onClick={handleStart} disabled={working}>
                {working ? 'Đang bắt đầu...' : 'Bắt đầu Final Test'}
              </Button>
            )}
          </Stack>
        )}

        {attempt && !result && (
          <Stack spacing={2}>
            <Alert severity={secondsLeft > 0 ? 'info' : 'error'}>
              Điểm đạt: {attempt.passingScore}% · Thời gian còn lại: {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(2, '0')}
            </Alert>
            {attempt.questions.map((question, questionIndex) => (
              <Paper key={question.id} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Câu {questionIndex + 1}: {question.content}
                </Typography>
                <Stack>
                  {question.choices.map((choice) => (
                    <Stack
                      key={choice.id}
                      direction="row"
                      onClick={() => !working && toggleChoice(question.id, choice.id)}
                      sx={{ alignItems: 'center', cursor: working ? 'default' : 'pointer' }}
                    >
                      <Checkbox
                        checked={(answers[question.id] || []).includes(choice.id)}
                        disabled={working}
                        slotProps={{ input: { 'aria-label': choice.content } }}
                      />
                      <Typography variant="body2">{choice.content}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            ))}
            <Box>
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmit}
                disabled={working || !allAnswered || secondsLeft <= 0}
              >
                {working ? 'Đang chấm...' : 'Nộp Final Test'}
              </Button>
            </Box>
          </Stack>
        )}

        {result && (
          <Stack spacing={2}>
            <Alert severity={result.passed ? 'success' : 'error'}>
              Kết quả: {result.score.toFixed(0)}% ({result.correctCount}/{result.totalQuestions} câu đúng).
              {result.passed
                ? ' Bạn đã vượt qua Final Test.'
                : ' Chưa đạt. Chứng chỉ vẫn bị khoá.'}
            </Alert>
            {result.feedback.map((item, index) => (
              <Box key={item.questionId}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Câu {index + 1}: {item.correct ? 'Đúng' : 'Chưa đúng'}
                </Typography>
                {item.explanation && (
                  <Typography variant="body2" color="text.secondary">
                    {item.explanation}
                  </Typography>
                )}
              </Box>
            ))}
            {!result.passed && eligibility?.eligible && (
              <Box>
                <Button variant="outlined" onClick={handleStart} disabled={working}>
                  Thi lại
                </Button>
              </Box>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

function downloadCertificateView(certificate: LearningCertificate) {
  const studentName = escapeHtml(certificate.studentName);
  const courseTitle = escapeHtml(certificate.courseTitle);
  const number = escapeHtml(certificate.certificateNumber);
  const issuedDate = new Date(certificate.issuedAt).toLocaleDateString('vi-VN');
  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${number}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 48px; color: #17212b; }
    main { max-width: 900px; margin: 0 auto; padding: 72px 48px; text-align: center; border: 8px double #2e7d32; }
    h1 { font-size: 42px; margin: 12px 0; }
    h2 { font-size: 30px; margin: 30px 0 12px; }
    p { font-size: 18px; line-height: 1.6; }
    small { color: #52606d; }
  </style>
</head>
<body>
  <main>
    <p>MANABIHUB</p>
    <h1>Certificate of Completion</h1>
    <p>Chứng nhận</p>
    <h2>${studentName}</h2>
    <p>đã hoàn thành khoá học <strong>${courseTitle}</strong></p>
    <small>Cấp ngày ${issuedDate} · ${number}</small>
  </main>
</body>
</html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${certificate.certificateNumber}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function FlashcardBlock({
  block,
  onProgressSaved,
}: {
  block: LearningLessonBlock;
  onProgressSaved: (
    blockId: string,
    cardIndex: number,
    status: 'REMEMBERED' | 'NEEDS_REVIEW',
    progressStatus: LearningLessonBlock['progressStatus'],
  ) => void;
}) {
  const cards = block.flashcards || [];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (cards.length === 0) {
    return <Alert severity="info">Bộ flashcard chưa có thẻ nào.</Alert>;
  }

  const reviewedCount = (block.flashcardStatuses || []).filter((s) => s !== null && s !== undefined).length;

  const card = cards[index];
  const currentStatus = block.flashcardStatuses?.[index];

  const handleReview = async (status: 'REMEMBERED' | 'NEEDS_REVIEW') => {
    if (saving) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const progress = await learningService.reviewFlashcard(block.id, index, status);
      onProgressSaved(block.id, index, status, progress.status);
      if (index < cards.length - 1) {
        setIndex((prev) => prev + 1);
        setFlipped(false);
      }
    } catch (error) {
      console.error('Failed to save flashcard review', error);
      setErrorMsg('Lỗi khi lưu kết quả. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setFlipped((prev) => !prev);
    }
  };

  return (
    <Stack spacing={2} sx={{ alignItems: 'center' }}>
      <Paper
        variant="outlined"
        onClick={() => setFlipped((prev) => !prev)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        sx={{
          width: '100%',
          maxWidth: 480,
          minHeight: 240,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          p: 3,
          bgcolor: flipped ? 'primary.50' : 'background.paper',
          position: 'relative',
          '&:focus': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 }
        }}
      >
        {currentStatus && (
          <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: currentStatus === 'REMEMBERED' ? 'success.main' : 'warning.main',
              }}
            >
              {currentStatus === 'REMEMBERED' ? 'Đã thuộc' : 'Cần ôn lại'}
            </Typography>
          </Box>
        )}
        <Typography variant="h5" sx={{ textAlign: 'center', whiteSpace: 'pre-wrap', mb: 2 }}>
          {flipped ? card.back : card.front}
        </Typography>
      </Paper>

      <Typography variant="caption" color="text.secondary">
        Nhấn vào thẻ, Space, hoặc Enter để lật · Thẻ {index + 1}/{cards.length} (Đã ôn: {reviewedCount}/{cards.length})
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          disabled={index === 0 || saving}
          onClick={() => {
            setIndex((prev) => prev - 1);
            setFlipped(false);
          }}
        >
          Thẻ trước
        </Button>
        <Button
          endIcon={<ArrowForwardIcon />}
          disabled={index === cards.length - 1 || saving}
          onClick={() => {
            setIndex((prev) => prev + 1);
            setFlipped(false);
          }}
        >
          Thẻ sau
        </Button>
      </Stack>

      {flipped && (
        <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="warning"
            disabled={saving}
            onClick={() => handleReview('NEEDS_REVIEW')}
            startIcon={saving && <CircularProgress size={16} color="inherit" />}
          >
            Cần ôn lại
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={saving}
            onClick={() => handleReview('REMEMBERED')}
            startIcon={saving && <CircularProgress size={16} color="inherit" />}
          >
            Đã thuộc
          </Button>
        </Stack>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ width: '100%', maxWidth: 480 }}>
          {errorMsg}
        </Alert>
      )}
    </Stack>
  );
}

function WritingBlock({ block, onProgressSaved }: { block: LearningLessonBlock; onProgressSaved: () => void }) {
  const [submission, setSubmission] = useState<import('../types').WritingSubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiRequesting, setAiRequesting] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftSaveState, setDraftSaveState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const acceptedContentRef = useRef('');
  const latestContentRef = useRef('');
  const draftSaveQueueRef = useRef(Promise.resolve());
  const composingRef = useRef(false);

  const draftKey = writingDraftStorageKey(block.id);
  const submissionStatus = submission?.status;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setDraftReady(false);
    setSubmission(null);
    setContent('');
    acceptedContentRef.current = '';
    latestContentRef.current = '';
    setDraftSaveState('idle');
    learningService
      .getWritingSubmission(block.id)
      .then((data) => {
        if (!active) return;
        const localDraft = readLocalStorageValue<LocalWritingDraft>(draftKey);

        if (data && data.status !== 'DRAFT') {
          removeLocalStorageValue(draftKey);
          setSubmission(data);
          return;
        }

        const restoredContent = localDraft?.content ?? data?.content ?? '';
        setSubmission(data);
        setContent(restoredContent);
        acceptedContentRef.current = restoredContent;
        latestContentRef.current = restoredContent;
      })
      .catch((err) => {
        if (!active) return;
        console.error('Fetch submission error', err);
        const localDraft = readLocalStorageValue<LocalWritingDraft>(draftKey);
        const restoredContent = localDraft?.content ?? '';
        setContent(restoredContent);
        acceptedContentRef.current = restoredContent;
        latestContentRef.current = restoredContent;
      })
      .finally(() => {
        if (active) {
          setDraftReady(true);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [block.id, draftKey]);

  useEffect(() => {
    latestContentRef.current = content;
    if (!draftReady || submission?.status !== 'DRAFT' && submission?.status !== undefined) return;

    if (content.trim()) {
      writeLocalStorageValue(draftKey, { content, savedAt: Date.now() } satisfies LocalWritingDraft);
    } else {
      removeLocalStorageValue(draftKey);
    }
  }, [content, draftKey, draftReady, submission?.status]);

  useEffect(() => {
    if (!draftReady || !content.trim() || (submissionStatus && submissionStatus !== 'DRAFT')) return;

    setDraftSaveState('saving');
    const contentToSave = content;
    const timer = window.setTimeout(() => {
      draftSaveQueueRef.current = draftSaveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          if (latestContentRef.current !== contentToSave) return;
          try {
            const savedDraft = await learningService.saveWritingDraft(block.id, contentToSave);
            if (latestContentRef.current === contentToSave) {
              setSubmission(savedDraft);
              setDraftSaveState('saved');
            }
          } catch {
            if (latestContentRef.current === contentToSave) setDraftSaveState('failed');
          }
        });
    }, 700);

    return () => window.clearTimeout(timer);
  }, [block.id, content, draftReady, submissionStatus]);

  const handleContentChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const nextContent = event.target.value;
    if (composingRef.current || isSingleCharacterMutation(acceptedContentRef.current, nextContent)) {
      acceptedContentRef.current = nextContent;
      setContent(nextContent);
    }
  };

  const blockClipboardAction = (event: React.ClipboardEvent | React.DragEvent | React.MouseEvent) => {
    event.preventDefault();
  };

  const handleWritingKeyDown = (event: React.KeyboardEvent) => {
    if (isClipboardShortcut(event)) event.preventDefault();
  };

  const handleSubmit = async () => {
    if (!content.trim() || content.length > 10000) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const data = await learningService.submitWriting(block.id, content);
      setSubmission(data);
      removeLocalStorageValue(draftKey);
      setDraftSaveState('saved');
      onProgressSaved(); // mark COMPLETED
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi nộp bài.');
      } else {
        setErrorMsg('Có lỗi xảy ra khi nộp bài.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submittedSubmission = submission && submission.status !== 'DRAFT' ? submission : null;

  const handleRequestAi = async () => {
    if (!submission) return;
    setAiRequesting(true);
    setErrorMsg(null);
    try {
      const data = await learningService.requestAiWritingAssistance(block.id, submission.id);
      setSubmission(data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi yêu cầu AI.');
      } else {
        setErrorMsg('Có lỗi xảy ra khi yêu cầu AI.');
      }
      try {
        const data = await learningService.getWritingSubmission(block.id);
        setSubmission(data);
      } catch {
        // Ignore refetch errors
      }
    } finally {
      setAiRequesting(false);
    }
  };

  if (loading) {
    return <CircularProgress size={24} />;
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 1, fontWeight: 500 }}>
          {block.writingPrompt}
        </Typography>
        {block.rubric && (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
            Tiêu chí chấm: {block.rubric}
          </Typography>
        )}
      </Box>

      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

      {!submittedSubmission ? (
        <Stack spacing={2}>
          <TextField
            multiline
            minRows={5}
            maxRows={15}
            fullWidth
            placeholder="Viết câu trả lời của bạn ở đây..."
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleWritingKeyDown}
            onCopy={blockClipboardAction}
            onCut={blockClipboardAction}
            onPaste={blockClipboardAction}
            onDrop={blockClipboardAction}
            onDragStart={blockClipboardAction}
            onContextMenu={blockClipboardAction}
            onCompositionStart={() => { composingRef.current = true; }}
            onCompositionEnd={(event) => {
              composingRef.current = false;
              const composedContent = (event.target as HTMLTextAreaElement).value;
              acceptedContentRef.current = composedContent;
              setContent(composedContent);
            }}
            disabled={submitting}
            error={content.length > 10000}
            helperText={content.length > 10000 ? 'Bài viết quá dài (tối đa 10,000 ký tự).' : `${content.length}/10,000`}
          />
          <Typography variant="caption" color={draftSaveState === 'failed' ? 'error.main' : 'text.secondary'}>
            {draftSaveState === 'saving' && 'Đang tự động lưu nháp...'}
            {draftSaveState === 'saved' && 'Đã lưu nháp an toàn.'}
            {draftSaveState === 'failed' && 'Chưa đồng bộ được lên máy chủ; bản lưu trên thiết bị vẫn còn.'}
          </Typography>
          <Box>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting || !content.trim() || content.length > 10000}
            >
              {submitting ? 'Đang nộp...' : 'Nộp bài'}
            </Button>
          </Box>
        </Stack>
      ) : (
        <Stack spacing={3}>
          <Card variant="outlined" sx={{ bgcolor: 'action.hover' }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Bài làm của bạn (đã nộp)
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {submittedSubmission.content}
              </Typography>
            </CardContent>
          </Card>

          {/* AI Assistance Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Gợi ý từ AI
            </Typography>

            {submittedSubmission.status === 'SUGGESTION_PROCESSING' ? (
              <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Typography variant="body2" color="text.secondary">
                  AI đang phân tích bài viết của bạn. Vui lòng đợi trong giây lát...
                </Typography>
                <CircularProgress size={24} />
              </Stack>
            ) : !submittedSubmission.aiSuggestion ? (
              <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Typography variant="body2" color="text.secondary">
                  Bạn có thể yêu cầu AI hỗ trợ nhận xét sơ bộ và đưa ra gợi ý cải thiện cho bài viết của mình.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={handleRequestAi}
                  disabled={aiRequesting}
                >
                  {aiRequesting ? 'Đang phân tích...' : 'Yêu cầu AI hỗ trợ'}
                </Button>
              </Stack>
            ) : submittedSubmission.aiSuggestion.status === 'FAILED' ? (
              <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Alert severity="error">Phân tích bằng AI thất bại. Bạn có muốn thử lại?</Alert>
                <Button variant="outlined" onClick={handleRequestAi} disabled={aiRequesting}>
                  {aiRequesting ? 'Đang thử lại...' : 'Thử lại'}
                </Button>
              </Stack>
            ) : (
              <Stack spacing={3}>
                <Alert severity="info" icon={false}>
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    *Gợi ý sơ bộ từ AI, không phải đánh giá chính thức.
                  </Typography>
                </Alert>

                {submittedSubmission.aiSuggestion.revisionGuidance && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Nhận xét sơ bộ</Typography>
                    <Typography variant="body2">{submittedSubmission.aiSuggestion.revisionGuidance}</Typography>
                  </Box>
                )}

                {submittedSubmission.aiSuggestion.grammarSuggestions?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Ngữ pháp</Typography>
                    <List dense>
                      {submittedSubmission.aiSuggestion.grammarSuggestions.map((item, i) => (
                        <ListItem key={i} disableGutters>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                <span style={{ textDecoration: 'line-through', color: 'red' }}>{item.error}</span>{' '}
                                &rarr; <span style={{ color: 'green' }}>{item.correction}</span>
                              </Typography>
                            }
                            secondary={item.explanation}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {submittedSubmission.aiSuggestion.vocabularySuggestions?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Từ vựng</Typography>
                    <List dense>
                      {submittedSubmission.aiSuggestion.vocabularySuggestions.map((item, i) => (
                        <ListItem key={i} disableGutters>
                          <ListItemText
                            primary={
                              <Typography variant="body2">
                                Thay thế <strong>{item.word}</strong> bằng <strong>{item.suggestion}</strong>
                              </Typography>
                            }
                            secondary={item.explanation}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {submittedSubmission.aiSuggestion.structureSuggestions?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Cấu trúc & Mạch văn</Typography>
                    <List dense>
                      {submittedSubmission.aiSuggestion.structureSuggestions.map((item, i) => (
                        <ListItem key={i} disableGutters>
                          <ListItemText
                            primary={<Typography variant="body2">Vấn đề: {item.issue}</Typography>}
                            secondary={`Gợi ý: ${item.suggestion}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}
              </Stack>
            )}
          </Box>

          <Divider />

          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
              <SchoolOutlinedIcon color="primary" />
              <Typography variant="h6">Đánh giá chính thức từ giáo viên</Typography>
              {submittedSubmission.teacherFeedback?.official && (
                <Chip label="Chính thức" size="small" color="primary" variant="outlined" />
              )}
            </Stack>

            {!submittedSubmission.teacherFeedback ? (
              <Typography variant="body2" color="text.secondary">
                Giáo viên chưa gửi đánh giá chính thức cho bài viết này.
              </Typography>
            ) : (
              <Paper variant="outlined" sx={{ p: 2, borderLeft: 4, borderLeftColor: 'primary.main' }}>
                {submittedSubmission.teacherFeedback.score != null && (
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Điểm: {submittedSubmission.teacherFeedback.score}
                  </Typography>
                )}
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {submittedSubmission.teacherFeedback.comment || 'Giáo viên chưa để lại nhận xét.'}
                </Typography>
              </Paper>
            )}
          </Box>
        </Stack>
      )}
    </Stack>
  );
}
