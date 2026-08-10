import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AddAlarmOutlinedIcon from '@mui/icons-material/AddAlarmOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';

const STORAGE_KEY = 'manabihub.student.study-plan.v1';
const DEFAULT_FOCUS_MINUTES = 25;
const BREAK_MINUTES = 5;
const WEEKLY_TARGET_MINUTES = 150;

const DAYS = [
  { value: 1, label: 'Thứ 2' },
  { value: 2, label: 'Thứ 3' },
  { value: 3, label: 'Thứ 4' },
  { value: 4, label: 'Thứ 5' },
  { value: 5, label: 'Thứ 6' },
  { value: 6, label: 'Thứ 7' },
  { value: 0, label: 'Chủ nhật' },
];

const SKILLS = ['Kanji và từ vựng', 'Ngữ pháp', 'Đọc hiểu và nghe'];

export interface StudyCourseOption {
  id: string;
  title: string;
}

interface StudySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  skill: string;
  courseId?: string;
  courseTitle?: string;
  enabled: boolean;
}

interface FocusTotal {
  minutes: number;
  sessions: number;
}

interface StudyPlan {
  weekKey: string;
  weeklyTargetMinutes: number;
  slots: StudySlot[];
  focusTotals: Record<string, FocusTotal>;
  attendance: Record<string, string[]>;
}

interface TimerState {
  mode: 'focus' | 'break';
  secondsLeft: number;
  initialSeconds: number;
  running: boolean;
  skill: string;
  courseTitle?: string;
  slotId?: string;
}

interface StudyGoalsWidgetProps {
  jlptGoal?: string | null;
  courses?: StudyCourseOption[];
}

function createInitialPlan(): StudyPlan {
  return { weekKey: getWeekKey(), weeklyTargetMinutes: WEEKLY_TARGET_MINUTES, slots: [], focusTotals: {}, attendance: {} };
}

function getWeekKey(date = new Date()) {
  const monday = new Date(date);
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return todayKey(monday);
}

function readPlan(): StudyPlan {
  if (typeof window === 'undefined') return createInitialPlan();
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? 'null') as Partial<StudyPlan> | null;
    if (!value) return createInitialPlan();
    const currentWeek = getWeekKey();
    return {
      weekKey: currentWeek,
      weeklyTargetMinutes: Number(value.weeklyTargetMinutes) || WEEKLY_TARGET_MINUTES,
      slots: Array.isArray(value.slots) ? value.slots : [],
      focusTotals: value.weekKey === currentWeek ? value.focusTotals ?? {} : {},
      attendance: value.attendance ?? {},
    };
  } catch {
    return createInitialPlan();
  }
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatSeconds(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}

function getUpcomingSlot(slots: StudySlot[], now = new Date()) {
  return slots
    .filter((slot) => slot.enabled)
    .map((slot) => {
      const candidate = new Date(now);
      const offset = (slot.dayOfWeek - now.getDay() + 7) % 7;
      candidate.setDate(now.getDate() + offset);
      const [hour, minute] = slot.startTime.split(':').map(Number);
      candidate.setHours(hour, minute, 0, 0);
      if (candidate <= now) candidate.setDate(candidate.getDate() + 7);
      return { slot, date: candidate };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null;
}

function getTargetKey(skill: string, courseTitle?: string) {
  return courseTitle ? `${skill} · ${courseTitle}` : skill;
}

export function StudyGoalsWidget({ jlptGoal, courses = [] }: StudyGoalsWidgetProps) {
  const [plan, setPlan] = useState<StudyPlan>(readPlan);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [reminderPermission, setReminderPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  );
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [targetDraft, setTargetDraft] = useState(WEEKLY_TARGET_MINUTES);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: '19:00', durationMinutes: 25, skill: SKILLS[0], courseId: '' });
  const notifiedRef = useRef(new Set<string>());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    if (!timer?.running) return undefined;
    const interval = window.setInterval(() => {
      setTimer((current) => current ? { ...current, secondsLeft: current.secondsLeft - 1 } : null);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timer?.running]);

  const recordFocusSession = useCallback((current: TimerState) => {
    const elapsedMinutes = Math.max(1, Math.round((current.initialSeconds - Math.max(0, current.secondsLeft)) / 60));
    const skillKey = getTargetKey(current.skill);
    const courseKey = current.courseTitle ? getTargetKey(current.skill, current.courseTitle) : null;
    const attendanceDate = todayKey();
    setPlan((previous) => {
      const focusTotals = { ...previous.focusTotals };
      for (const key of [skillKey, courseKey].filter(Boolean) as string[]) {
        const old = focusTotals[key] ?? { minutes: 0, sessions: 0 };
        focusTotals[key] = { minutes: old.minutes + elapsedMinutes, sessions: old.sessions + 1 };
      }
      const attendance = { ...previous.attendance };
      const currentAttendance = new Set(attendance[attendanceDate] ?? []);
      if (current.slotId) currentAttendance.add(current.slotId);
      attendance[attendanceDate] = [...currentAttendance];
      return { ...previous, focusTotals, attendance };
    });
  }, []);

  useEffect(() => {
    if (!timer || timer.running || timer.secondsLeft > 0) return;
    if (timer.mode === 'focus') {
      recordFocusSession(timer);
      setTimer({ ...timer, mode: 'break', secondsLeft: BREAK_MINUTES * 60, initialSeconds: BREAK_MINUTES * 60, running: false });
    } else {
      setTimer(null);
    }
  }, [recordFocusSession, timer]);

  const upcoming = useMemo(() => getUpcomingSlot(plan.slots), [plan.slots]);
  const weeklyMinutes = SKILLS.reduce((sum, skill) => sum + (plan.focusTotals[skill]?.minutes ?? 0), 0);
  const progress = Math.min(100, Math.round((weeklyMinutes / plan.weeklyTargetMinutes) * 100));
  const courseTotals = Object.entries(plan.focusTotals)
    .filter(([key]) => key.includes(' · '))
    .sort(([, first], [, second]) => second.minutes - first.minutes);

  useEffect(() => {
    if (reminderPermission !== 'granted') return undefined;
    const check = () => {
      const now = new Date();
      for (const slot of plan.slots) {
        if (!slot.enabled || slot.dayOfWeek !== now.getDay()) continue;
        const [hour, minute] = slot.startTime.split(':').map(Number);
        const scheduled = new Date(now);
        scheduled.setHours(hour, minute, 0, 0);
        const difference = scheduled.getTime() - now.getTime();
        const key = `${todayKey(now)}:${slot.id}`;
        if (difference >= 0 && difference <= 60_000 && !notifiedRef.current.has(key)) {
          notifiedRef.current.add(key);
          new Notification('Đến giờ học trên ManabiHub', {
            body: `${slot.skill} · ${slot.durationMinutes} phút${slot.courseTitle ? ` · ${slot.courseTitle}` : ''}`,
            icon: '/favicon.ico',
          });
        }
      }
    };
    check();
    const interval = window.setInterval(check, 30_000);
    return () => window.clearInterval(interval);
  }, [plan.slots, reminderPermission]);

  const requestReminders = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setReminderPermission(permission);
  };

  const addSlot = () => {
    const selectedCourse = courses.find((course) => course.id === newSlot.courseId);
    const slot: StudySlot = {
      id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      dayOfWeek: newSlot.dayOfWeek,
      startTime: newSlot.startTime,
      durationMinutes: Number(newSlot.durationMinutes),
      skill: newSlot.skill,
      courseId: selectedCourse?.id,
      courseTitle: selectedCourse?.title,
      enabled: true,
    };
    setPlan((previous) => ({ ...previous, weeklyTargetMinutes: Math.max(30, Number(targetDraft) || WEEKLY_TARGET_MINUTES), slots: [...previous.slots, slot] }));
    setScheduleOpen(false);
  };

  const startTimer = (slot?: StudySlot) => {
    const courseTitle = slot?.courseTitle ?? courses.find((course) => course.id === newSlot.courseId)?.title;
    const skill = slot?.skill ?? newSlot.skill;
    const initialSeconds = (slot?.durationMinutes ?? DEFAULT_FOCUS_MINUTES) * 60;
    if (slot) {
      const key = todayKey();
      setPlan((previous) => ({
        ...previous,
        attendance: { ...previous.attendance, [key]: [...new Set([...(previous.attendance[key] ?? []), slot.id])] },
      }));
    }
    setTimer({ mode: 'focus', secondsLeft: initialSeconds, initialSeconds, running: true, skill, courseTitle, slotId: slot?.id });
  };

  const finishTimerEarly = () => {
    if (!timer) return;
    recordFocusSession({ ...timer, running: false, secondsLeft: Math.max(0, timer.secondsLeft) });
    setTimer(null);
  };

  return (
    <Paper data-testid="study-goals-widget" elevation={0} sx={{ p: 2.5, border: '1px solid #E4E7EC', borderRadius: '8px', bgcolor: '#fff' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ color: '#172033', fontWeight: 900 }}>Mục tiêu học tập</Typography>
        <Chip label={jlptGoal ? `JLPT ${jlptGoal}` : 'Chưa thiết lập'} size="small" sx={{ bgcolor: jlptGoal ? '#C41E3A' : '#EEF2F6', color: jlptGoal ? '#fff' : '#475467', fontWeight: 900 }} />
      </Stack>
      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#667085' }}>Lịch học, điểm danh và Pomodoro được lưu trên thiết bị này; điểm tập trung tự làm mới theo tuần.</Typography>

      <Box sx={{ mt: 2 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>Tiến độ tuần</Typography>
          <Typography variant="caption" sx={{ color: '#667085' }}>{weeklyMinutes}/{plan.weeklyTargetMinutes} phút</Typography>
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.75, height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: '#C41E3A' } }} />
      </Box>

      {upcoming ? (
        <Alert icon={<AddAlarmOutlinedIcon />} severity="info" sx={{ mt: 2, py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>Buổi tiếp theo: {DAYS.find((day) => day.value === upcoming.slot.dayOfWeek)?.label} {upcoming.slot.startTime}</Typography>
          <Typography variant="caption">{upcoming.slot.skill} · {upcoming.slot.durationMinutes} phút{upcoming.slot.courseTitle ? ` · ${upcoming.slot.courseTitle}` : ''}</Typography>
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>Bạn chưa có lịch học cố định. Hãy thêm buổi học đầu tiên.</Alert>
      )}

      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button size="small" variant="contained" startIcon={<AddAlarmOutlinedIcon />} onClick={() => { setTargetDraft(plan.weeklyTargetMinutes); setScheduleOpen(true); }} sx={{ bgcolor: '#C41E3A', '&:hover': { bgcolor: '#A71931' } }}>Thêm lịch học</Button>
        <Button size="small" variant="outlined" startIcon={<NotificationsActiveOutlinedIcon />} onClick={() => void requestReminders()} disabled={reminderPermission === 'granted' || reminderPermission === 'unsupported'}>
          {reminderPermission === 'granted' ? 'Đã bật nhắc' : reminderPermission === 'unsupported' ? 'Trình duyệt không hỗ trợ' : 'Bật nhắc giờ học'}
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Điểm tập trung theo kỹ năng</Typography>
        <TimerOutlinedIcon sx={{ color: '#C41E3A' }} />
      </Stack>
      <Stack spacing={1.1} sx={{ mt: 1.25 }}>
        {SKILLS.map((skill) => {
          const total = plan.focusTotals[skill] ?? { minutes: 0, sessions: 0 };
          return (
            <Box key={skill}>
              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                <Typography variant="caption" sx={{ color: '#475467' }}>{skill}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 800 }}>{total.minutes} phút · {total.sessions} phiên</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={Math.min(100, (total.minutes / Math.max(1, plan.weeklyTargetMinutes / 3)) * 100)} sx={{ mt: 0.35, height: 5, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: '#2F855A' } }} />
            </Box>
          );
        })}
      </Stack>

      {courseTotals.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 900, color: '#475467' }}>Điểm theo khóa học</Typography>
          {courseTotals.slice(0, 3).map(([key, total]) => (
            <Stack key={key} direction="row" sx={{ justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#667085', maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key.split(' · ').slice(1).join(' · ')}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>{total.minutes} điểm</Typography>
            </Stack>
          ))}
        </Box>
      )}
      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#667085' }}>Mỗi phút tập trung hoàn thành được tính là một điểm cho kỹ năng và khóa học đã chọn.</Typography>

      <Button fullWidth variant="outlined" startIcon={<PlayCircleOutlineIcon />} onClick={() => startTimer(upcoming?.slot)} sx={{ mt: 2, borderColor: '#C41E3A', color: '#C41E3A', fontWeight: 800 }}>
        {timer?.mode === 'break' ? `Nghỉ giải lao ${formatSeconds(timer.secondsLeft)}` : timer ? `${timer.skill} · ${formatSeconds(timer.secondsLeft)}` : 'Bắt đầu Pomodoro'}
      </Button>
      {timer?.running && <Button fullWidth size="small" onClick={finishTimerEarly} sx={{ mt: 0.5, color: '#667085' }}>Kết thúc và lưu phiên</Button>}
      {timer && !timer.running && timer.mode === 'break' && <Button fullWidth size="small" onClick={() => setTimer(null)} sx={{ mt: 0.5 }}>Đóng bộ đếm nghỉ</Button>}

      {plan.slots.length > 0 && (
        <Stack spacing={0.5} sx={{ mt: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 900, color: '#475467' }}>Lịch cố định</Typography>
          {plan.slots.map((slot) => (
            <Stack key={slot.id} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', bgcolor: '#F8FAFC', borderRadius: 1, px: 1, py: 0.5 }}>
              <Typography variant="caption">{DAYS.find((day) => day.value === slot.dayOfWeek)?.label} {slot.startTime} · {slot.skill}</Typography>
              <IconButton size="small" aria-label={`Xóa lịch ${slot.startTime}`} onClick={() => setPlan((previous) => ({ ...previous, slots: previous.slots.filter((item) => item.id !== slot.id) }))}><DeleteOutlineIcon fontSize="small" /></IconButton>
            </Stack>
          ))}
        </Stack>
      )}

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Thêm lịch học</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField size="small" label="Mục tiêu tập trung mỗi tuần (phút)" type="number" slotProps={{ htmlInput: { min: 30, max: 2000, step: 15 } }} value={targetDraft} onChange={(event) => setTargetDraft(Math.max(30, Number(event.target.value)))} fullWidth />
            <FormControl fullWidth size="small"><InputLabel id="study-day-label">Ngày</InputLabel><Select labelId="study-day-label" label="Ngày" value={newSlot.dayOfWeek} onChange={(event) => setNewSlot((current) => ({ ...current, dayOfWeek: Number(event.target.value) }))}>{DAYS.map((day) => <MenuItem key={day.value} value={day.value}>{day.label}</MenuItem>)}</Select></FormControl>
            <TextField size="small" label="Giờ bắt đầu" type="time" value={newSlot.startTime} onChange={(event) => setNewSlot((current) => ({ ...current, startTime: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} fullWidth />
            <TextField size="small" label="Thời lượng (phút)" type="number" slotProps={{ htmlInput: { min: 5, max: 180, step: 5 } }} value={newSlot.durationMinutes} onChange={(event) => setNewSlot((current) => ({ ...current, durationMinutes: Math.max(5, Number(event.target.value)) }))} fullWidth />
            <FormControl fullWidth size="small"><InputLabel id="study-skill-label">Kỹ năng</InputLabel><Select labelId="study-skill-label" label="Kỹ năng" value={newSlot.skill} onChange={(event) => setNewSlot((current) => ({ ...current, skill: event.target.value }))}>{SKILLS.map((skill) => <MenuItem key={skill} value={skill}>{skill}</MenuItem>)}</Select></FormControl>
            {courses.length > 0 && <FormControl fullWidth size="small"><InputLabel id="study-course-label">Khóa học</InputLabel><Select labelId="study-course-label" label="Khóa học" value={newSlot.courseId} onChange={(event) => setNewSlot((current) => ({ ...current, courseId: event.target.value }))}><MenuItem value="">Không gắn khóa học</MenuItem>{courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>)}</Select></FormControl>}
          </Stack>
        </DialogContent>
        <DialogActions><Button onClick={() => setScheduleOpen(false)}>Hủy</Button><Button variant="contained" onClick={addSlot}>Lưu lịch</Button></DialogActions>
      </Dialog>
    </Paper>
  );
}
