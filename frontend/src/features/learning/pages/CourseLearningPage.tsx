import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  ListItem
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import { isAxiosError } from 'axios';
import ReactPlayer from 'react-player';
import DOMPurify from 'dompurify';
import { learningService } from '../services/learningService';
import type { CourseLearning, LearningLessonBlock, QuizQuestion } from '../types';
import { ROUTES } from '../../../shared/constants/routes';

const VIDEO_SAVE_INTERVAL_SECONDS = 10;

export function CourseLearningPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [learning, setLearning] = useState<CourseLearning | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    let active = true;

    learningService
      .openCourse(courseId)
      .then((data) => {
        if (!active) return;
        setLearning(data);
        setSelectedBlockId(data.currentLessonBlockId ?? data.modules[0]?.blocks[0]?.id ?? null);
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
  onWritingProgressSaved: (blockId: string) => void;
}

function BlockContent({ block, onVideoProgressSaved, onFlashcardProgressSaved, onWritingProgressSaved }: BlockContentProps) {
  switch (block.type) {
    case 'VIDEO':
      return <VideoBlock key={block.id} block={block} onProgressSaved={onVideoProgressSaved} />;
    case 'TEXT':
      return (
        <Box
          sx={{ whiteSpace: 'pre-wrap', typography: 'body1' }}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.content || '') }}
        />
      );
    case 'QUIZ':
      return <QuizBlock key={block.id} questions={block.quizItems} />;
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

function QuizBlock({ questions }: { questions: QuizQuestion[] }) {
  if (questions.length === 0) {
    return <Alert severity="info">Bài trắc nghiệm chưa có câu hỏi.</Alert>;
  }

  return (
    <Stack spacing={2}>
      {questions.map((question, index) => (
        <Paper key={index} variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
            Câu {index + 1}: {question.question}
          </Typography>
          <Stack>
            {question.options.map((option) => {
              return (
                <Stack
                  key={option}
                  direction="row"
                  sx={{
                    alignItems: 'center',
                    borderRadius: 1,
                    px: 1,
                    bgcolor: 'transparent',
                  }}
                >
                  <Radio disabled size="small" />
                  <Typography variant="body2" color="text.secondary">
                    {option}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
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

  useEffect(() => {
    let active = true;
    setLoading(true);
    learningService
      .getWritingSubmission(block.id)
      .then((data) => {
        if (!active) return;
        setSubmission(data);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Fetch submission error', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [block.id]);

  const handleSubmit = async () => {
    if (!content.trim() || content.length > 10000) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const data = await learningService.submitWriting(block.id, content);
      setSubmission(data);
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

      {!submission ? (
        <Stack spacing={2}>
          <TextField
            multiline
            minRows={5}
            maxRows={15}
            fullWidth
            placeholder="Viết câu trả lời của bạn ở đây..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={submitting}
            error={content.length > 10000}
            helperText={content.length > 10000 ? 'Bài viết quá dài (tối đa 10,000 ký tự).' : `${content.length}/10,000`}
          />
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
                {submission.content}
              </Typography>
            </CardContent>
          </Card>

          {/* AI Assistance Section */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Gợi ý từ AI
            </Typography>

            {submission.status === 'SUGGESTION_PROCESSING' ? (
              <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
                <Typography variant="body2" color="text.secondary">
                  AI đang phân tích bài viết của bạn. Vui lòng đợi trong giây lát...
                </Typography>
                <CircularProgress size={24} />
              </Stack>
            ) : !submission.aiSuggestion ? (
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
            ) : submission.aiSuggestion.status === 'FAILED' ? (
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

                {submission.aiSuggestion.revisionGuidance && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Nhận xét sơ bộ</Typography>
                    <Typography variant="body2">{submission.aiSuggestion.revisionGuidance}</Typography>
                  </Box>
                )}

                {submission.aiSuggestion.grammarSuggestions?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Ngữ pháp</Typography>
                    <List dense>
                      {submission.aiSuggestion.grammarSuggestions.map((item, i) => (
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

                {submission.aiSuggestion.vocabularySuggestions?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Từ vựng</Typography>
                    <List dense>
                      {submission.aiSuggestion.vocabularySuggestions.map((item, i) => (
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

                {submission.aiSuggestion.structureSuggestions?.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Cấu trúc & Mạch văn</Typography>
                    <List dense>
                      {submission.aiSuggestion.structureSuggestions.map((item, i) => (
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
              {submission.teacherFeedback?.official && (
                <Chip label="Chính thức" size="small" color="primary" variant="outlined" />
              )}
            </Stack>

            {!submission.teacherFeedback ? (
              <Typography variant="body2" color="text.secondary">
                Giáo viên chưa gửi đánh giá chính thức cho bài viết này.
              </Typography>
            ) : (
              <Paper variant="outlined" sx={{ p: 2, borderLeft: 4, borderLeftColor: 'primary.main' }}>
                {submission.teacherFeedback.score != null && (
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                    Điểm: {submission.teacherFeedback.score}
                  </Typography>
                )}
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {submission.teacherFeedback.comment || 'Giáo viên chưa để lại nhận xét.'}
                </Typography>
              </Paper>
            )}
          </Box>
        </Stack>
      )}
    </Stack>
  );
}
