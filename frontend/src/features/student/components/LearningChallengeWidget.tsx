import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import ReplayRoundedIcon from '@mui/icons-material/ReplayRounded';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';

interface LearningChallengeWidgetProps {
  accountKey?: string | null;
}

interface ChallengeRecord {
  dayKey: string;
  rankedAttempts: number;
  bestMilliseconds: number | null;
}

interface MatchCard {
  id: string;
  pairId: string;
  value: string;
  kind: 'kanji' | 'meaning';
}

const DAILY_RANKED_LIMIT = 3;
const STORAGE_PREFIX = 'manabihub.student.match-challenge.v1';
const PAIRS = [
  { id: 'cat', kanji: '猫', meaning: 'ねこ · Con mèo' },
  { id: 'dog', kanji: '犬', meaning: 'いぬ · Con chó' },
  { id: 'sun', kanji: '日', meaning: 'ひ · Mặt trời' },
  { id: 'eye', kanji: '目', meaning: 'め · Con mắt' },
  { id: 'tree', kanji: '木', meaning: 'き · Cây' },
  { id: 'book', kanji: '本', meaning: 'ほん · Quyển sách' },
] as const;

function currentDayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function recordKey(accountKey?: string | null) {
  return `${STORAGE_PREFIX}.${encodeURIComponent(accountKey?.trim() || 'anonymous')}`;
}

function readRecord(key: string): ChallengeRecord {
  const empty = { dayKey: currentDayKey(), rankedAttempts: 0, bestMilliseconds: null };
  if (typeof window === 'undefined') return empty;
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? 'null') as ChallengeRecord | null;
    if (!stored) return empty;
    return {
      dayKey: currentDayKey(),
      rankedAttempts: stored.dayKey === currentDayKey() ? Math.max(0, stored.rankedAttempts || 0) : 0,
      bestMilliseconds: typeof stored.bestMilliseconds === 'number' ? stored.bestMilliseconds : null,
    };
  } catch {
    return empty;
  }
}

function writeRecord(key: string, record: ChallengeRecord) {
  try {
    window.localStorage.setItem(key, JSON.stringify(record));
  } catch {
    // The game remains usable when storage is blocked; only persistence is unavailable.
  }
}

function createDeck(): MatchCard[] {
  return PAIRS
    .flatMap((pair) => [
      { id: `${pair.id}-kanji`, pairId: pair.id, value: pair.kanji, kind: 'kanji' as const },
      { id: `${pair.id}-meaning`, pairId: pair.id, value: pair.meaning, kind: 'meaning' as const },
    ])
    .sort(() => Math.random() - 0.5);
}

function formatMilliseconds(milliseconds: number | null) {
  if (milliseconds === null) return '--:--.--';
  const totalSeconds = Math.max(0, milliseconds) / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const centiseconds = Math.floor((milliseconds % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

export function LearningChallengeWidget({ accountKey }: LearningChallengeWidgetProps) {
  const key = useMemo(() => recordKey(accountKey), [accountKey]);
  const [record, setRecord] = useState(() => readRecord(key));
  const [open, setOpen] = useState(false);
  const [deck, setDeck] = useState<MatchCard[]>(createDeck);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [penalty, setPenalty] = useState(0);
  const [finishedTime, setFinishedTime] = useState<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const rankedRunRef = useRef(false);

  useEffect(() => setRecord(readRecord(key)), [key]);

  useEffect(() => {
    if (!open || finishedTime !== null || startedAtRef.current === null) return undefined;
    const timer = window.setInterval(() => {
      setElapsed(Date.now() - (startedAtRef.current ?? Date.now()));
    }, 50);
    return () => window.clearInterval(timer);
  }, [finishedTime, open]);

  useEffect(() => {
    if (!open || matchedPairs.length !== PAIRS.length || startedAtRef.current === null || finishedTime !== null) return;
    const total = Date.now() - startedAtRef.current + penalty;
    setElapsed(Date.now() - startedAtRef.current);
    setFinishedTime(total);
    setRecord((current) => {
      const next = {
        ...current,
        bestMilliseconds: current.bestMilliseconds === null ? total : Math.min(current.bestMilliseconds, total),
      };
      writeRecord(key, next);
      return next;
    });
  }, [finishedTime, key, matchedPairs.length, open, penalty]);

  const startGame = () => {
    const todayRecord = readRecord(key);
    const ranked = todayRecord.rankedAttempts < DAILY_RANKED_LIMIT;
    const nextRecord = ranked
      ? { ...todayRecord, rankedAttempts: todayRecord.rankedAttempts + 1 }
      : todayRecord;
    writeRecord(key, nextRecord);
    setRecord(nextRecord);
    rankedRunRef.current = ranked;
    setDeck(createDeck());
    setFlipped([]);
    setMatchedPairs([]);
    setElapsed(0);
    setPenalty(0);
    setFinishedTime(null);
    startedAtRef.current = Date.now();
    setOpen(true);
  };

  const selectCard = (card: MatchCard) => {
    if (finishedTime !== null || flipped.includes(card.id) || matchedPairs.includes(card.pairId) || flipped.length >= 2) return;
    const nextFlipped = [...flipped, card.id];
    setFlipped(nextFlipped);
    if (nextFlipped.length < 2) return;

    const first = deck.find((item) => item.id === nextFlipped[0]);
    if (first?.pairId === card.pairId && first.kind !== card.kind) {
      window.setTimeout(() => {
        setMatchedPairs((current) => [...current, card.pairId]);
        setFlipped([]);
      }, 220);
      return;
    }

    setPenalty((current) => current + 2000);
    window.setTimeout(() => setFlipped([]), 800);
  };

  const remainingAttempts = Math.max(0, DAILY_RANKED_LIMIT - record.rankedAttempts);
  const displayedTime = finishedTime ?? elapsed + penalty;

  return (
    <Paper elevation={0} sx={{ p: 2.25, border: '1px solid #E4E7EC', borderRadius: '8px', bgcolor: '#fff' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <SportsEsportsOutlinedIcon sx={{ color: '#C41E3A' }} />
          <Typography variant="subtitle1" sx={{ color: '#172033', fontWeight: 900 }}>Thử thách Kanji tuần</Typography>
        </Stack>
        <Chip size="small" label="N5" sx={{ bgcolor: '#FFF1F3', color: '#C41E3A', fontWeight: 900 }} />
      </Stack>

      <Typography variant="body2" sx={{ mt: 1.25, color: '#667085' }}>
        Ghép Kanji với cách đọc và nghĩa. Chọn sai bị cộng 2 giây.
      </Typography>

      <Stack direction="row" spacing={1.25} sx={{ mt: 1.5 }}>
        <Box sx={{ flex: 1, p: 1.25, borderRadius: 1.5, bgcolor: '#FFF8E7' }}>
          <Typography variant="caption" color="text.secondary">Kỷ lục cá nhân</Typography>
          <Typography sx={{ mt: 0.25, color: '#A16207', fontWeight: 900 }}>{formatMilliseconds(record.bestMilliseconds)}</Typography>
        </Box>
        <Box sx={{ flex: 1, p: 1.25, borderRadius: 1.5, bgcolor: '#EEF4FF' }}>
          <Typography variant="caption" color="text.secondary">Lượt tính kỷ lục</Typography>
          <Typography sx={{ mt: 0.25, color: '#1D4ED8', fontWeight: 900 }}>{remainingAttempts}/{DAILY_RANKED_LIMIT} hôm nay</Typography>
        </Box>
      </Stack>

      <Button
        fullWidth
        variant="contained"
        startIcon={<SportsEsportsOutlinedIcon />}
        onClick={startGame}
        sx={{ mt: 1.5, bgcolor: '#C41E3A', fontWeight: 900, '&:hover': { bgcolor: '#A71931' } }}
      >
        {remainingAttempts > 0 ? 'Vào chơi ngay' : 'Luyện tập tự do'}
      </Button>
      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#98A2B3' }}>
        Thành tích hiện lưu theo tài khoản trên thiết bị; không tự động cộng tiền vào ví.
      </Typography>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          <Box>
            <Typography component="div" sx={{ fontWeight: 900 }}>Manabi Match · Kanji N5</Typography>
            <Typography variant="caption" color="text.secondary">{rankedRunRef.current ? 'Lượt tính kỷ lục hôm nay' : 'Chế độ luyện tập tự do'}</Typography>
          </Box>
          <IconButton aria-label="Đóng trò chơi" onClick={() => setOpen(false)}><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ bgcolor: '#FAF9F6' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1, mb: 2 }}>
            <Chip icon={<TimerOutlinedIcon />} label={`Thời gian ${formatMilliseconds(displayedTime)}`} />
            <Chip color={penalty > 0 ? 'warning' : 'default'} label={`Phạt +${penalty / 1000} giây`} />
          </Stack>
          <LinearProgress variant="determinate" value={(matchedPairs.length / PAIRS.length) * 100} sx={{ mb: 2, height: 7, borderRadius: 999 }} />
          <Grid container spacing={1.25}>
            {deck.map((card) => {
              const visible = flipped.includes(card.id) || matchedPairs.includes(card.pairId);
              const matched = matchedPairs.includes(card.pairId);
              return (
                <Grid size={{ xs: 4, sm: 3 }} key={card.id}>
                  <Button
                    fullWidth
                    aria-label={visible ? card.value : 'Thẻ đang úp'}
                    onClick={() => selectCard(card)}
                    disabled={matched}
                    sx={{
                      minHeight: { xs: 82, sm: 108 },
                      p: 1,
                      border: '1px solid',
                      borderColor: matched ? '#86EFAC' : visible ? '#F2A4B1' : '#CBD5E1',
                      bgcolor: matched ? '#F0FDF4' : visible ? '#FFF1F3' : '#1B2A4A',
                      color: visible ? '#172033' : '#fff',
                      fontSize: card.kind === 'kanji' ? { xs: '1.7rem', sm: '2.4rem' } : { xs: '0.72rem', sm: '0.85rem' },
                      fontWeight: 900,
                      textTransform: 'none',
                      '&:hover': { bgcolor: visible ? '#FFE4E8' : '#26395F' },
                      '&.Mui-disabled': { color: '#15803D', bgcolor: '#F0FDF4' },
                    }}
                  >
                    {visible ? card.value : '学'}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
          {finishedTime !== null && (
            <Alert severity="success" icon={<EmojiEventsOutlinedIcon />} sx={{ mt: 2 }}>
              Hoàn thành trong <strong>{formatMilliseconds(finishedTime)}</strong>. {record.bestMilliseconds === finishedTime ? 'Đây là kỷ lục mới của bạn!' : 'Tiếp tục luyện để phá kỷ lục nhé.'}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={startGame}>Chơi lại</Button>
          <Button onClick={() => setOpen(false)} color="inherit">Đóng</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
