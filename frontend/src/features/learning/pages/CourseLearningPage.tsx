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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DoneAllIcon from '@mui/icons-material/DoneAll';
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
                  <BlockContent block={selectedBlock} onVideoProgressSaved={handleVideoProgressSaved} />
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
}

function BlockContent({ block, onVideoProgressSaved }: BlockContentProps) {
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
      return <FlashcardBlock key={block.id} cards={block.flashcards} />;
    case 'WRITING':
      return <WritingBlock key={block.id} prompt={block.writingPrompt} rubric={block.rubric} />;
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

function FlashcardBlock({ cards }: { cards: { front: string; back: string }[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) {
    return <Alert severity="info">Bộ flashcard chưa có thẻ nào.</Alert>;
  }

  const card = cards[index];

  return (
    <Stack spacing={2} sx={{ alignItems: 'center' }}>
      <Paper
        variant="outlined"
        onClick={() => setFlipped((prev) => !prev)}
        sx={{
          width: '100%',
          maxWidth: 480,
          minHeight: 220,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          p: 3,
          bgcolor: flipped ? 'primary.50' : 'background.paper',
        }}
      >
        <Typography variant="h5" sx={{ textAlign: 'center', whiteSpace: 'pre-wrap' }}>
          {flipped ? card.back : card.front}
        </Typography>
      </Paper>
      <Typography variant="caption" color="text.secondary">
        Nhấn vào thẻ để lật · Thẻ {index + 1}/{cards.length}
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button
          startIcon={<ArrowBackIcon />}
          disabled={index === 0}
          onClick={() => {
            setIndex((prev) => prev - 1);
            setFlipped(false);
          }}
        >
          Thẻ trước
        </Button>
        <Button
          endIcon={<ArrowForwardIcon />}
          disabled={index === cards.length - 1}
          onClick={() => {
            setIndex((prev) => prev + 1);
            setFlipped(false);
          }}
        >
          Thẻ sau
        </Button>
      </Stack>
    </Stack>
  );
}

function WritingBlock({ prompt, rubric }: { prompt?: string; rubric?: string }) {
  return (
    <Stack spacing={2}>
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
        {prompt}
      </Typography>
      {rubric && (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
          Tiêu chí chấm: {rubric}
        </Typography>
      )}
    </Stack>
  );
}
