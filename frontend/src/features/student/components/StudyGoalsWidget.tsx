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
  Tooltip,
  Typography,
} from '@mui/material';
import AddAlarmOutlinedIcon from '@mui/icons-material/AddAlarmOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import HeadphonesOutlinedIcon from '@mui/icons-material/HeadphonesOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutlineOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import TranslateOutlinedIcon from '@mui/icons-material/TranslateOutlined';

const STORAGE_KEY = 'manabihub.student.study-plan.v1';
const TOUR_STORAGE_KEY = 'manabihub.student.study-plan.tour.v1';
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

const SKILLS = [
  { label: 'Kanji & Từ vựng', target: 60, color: '#D97706', Icon: MenuBookOutlinedIcon },
  { label: 'Ngữ pháp', target: 60, color: '#2563EB', Icon: TranslateOutlinedIcon },
  { label: 'Đọc hiểu & Nghe', target: 30, color: '#2F855A', Icon: HeadphonesOutlinedIcon },
] as const;

const PRESETS = [
  { id: 'gentle', label: 'Nhẹ nhàng', icon: '🌱', days: [1, 3, 5], time: '20:00', duration: 25, summary: '3 buổi/tuần · T2, T4, T6 · 20:00 · 25 phút' },
  { id: 'standard', label: 'Tiêu chuẩn', icon: '🔥', days: [1, 2, 3, 4, 5], time: '21:00', duration: 25, summary: '5 buổi/tuần · T2–T6 · 21:00 · 25 phút' },
] as const;

type PresetId = (typeof PRESETS)[number]['id'] | 'custom';
type DurationChoice = 25 | 50 | 60 | 'custom';

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

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekKey(date = new Date()) {
  const monday = new Date(date);
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return todayKey(monday);
}

function createInitialPlan(): StudyPlan {
  return { weekKey: getWeekKey(), weeklyTargetMinutes: WEEKLY_TARGET_MINUTES, slots: [], focusTotals: {}, attendance: {} };
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

function newId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function StudyGoalsWidget({ jlptGoal, courses = [] }: StudyGoalsWidgetProps) {
  const [plan, setPlan] = useState<StudyPlan>(readPlan);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<PresetId>('gentle');
  const [reminderPermission, setReminderPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported',
  );
  const [timer, setTimer] = useState<TimerState | null>(null);
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(WEEKLY_TARGET_MINUTES);
  const [durationChoice, setDurationChoice] = useState<DurationChoice>(25);
  const [customDuration, setCustomDuration] = useState(25);
  const [newSlot, setNewSlot] = useState({ dayOfWeek: 1, startTime: '19:00', skill: SKILLS[0].label, courseId: courses[0]?.id ?? '' });
  const [tourStep, setTourStep] = useState<number | null>(null);
  const notifiedRef = useRef(new Set<string>());

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  }, [plan]);

  useEffect(() => {
    if (!newSlot.courseId && courses.length > 0) {
      setNewSlot((current) => ({ ...current, courseId: courses[0].id }));
    }
  }, [courses, newSlot.courseId]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.localStorage.getItem(TOUR_STORAGE_KEY)) setTourStep(0);
  }, []);

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
    } else setTimer(null);
  }, [recordFocusSession, timer]);

  const upcoming = useMemo(() => getUpcomingSlot(plan.slots), [plan.slots]);
  const weeklyMinutes = SKILLS.reduce((sum, skill) => sum + (plan.focusTotals[skill.label]?.minutes ?? 0), 0);
  const progress = Math.min(100, Math.round((weeklyMinutes / Math.max(1, plan.weeklyTargetMinutes)) * 100));
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
    setReminderPermission(await Notification.requestPermission());
  };

  const saveWeeklyTarget = () => {
    setPlan((previous) => ({ ...previous, weeklyTargetMinutes: Math.min(2000, Math.max(30, Number(targetInput) || WEEKLY_TARGET_MINUTES)) }));
    setEditingTarget(false);
  };

  const openSchedule = () => {
    setScheduleMode('preset');
    setSelectedPreset('gentle');
    setDurationChoice(25);
    setScheduleOpen(true);
  };

  const selectedCourse = courses.find((course) => course.id === newSlot.courseId);
  const durationMinutes = durationChoice === 'custom' ? Math.min(180, Math.max(5, Number(customDuration) || 25)) : durationChoice;

  const addSchedule = () => {
    const preset = PRESETS.find((item) => item.id === selectedPreset);
    const days = scheduleMode === 'preset' && preset ? preset.days : [newSlot.dayOfWeek];
    const time = scheduleMode === 'preset' && preset ? preset.time : newSlot.startTime;
    const duration = scheduleMode === 'preset' && preset ? preset.duration : durationMinutes;
    const created = days.map((dayOfWeek) => ({
      id: newId(),
      dayOfWeek,
      startTime: time,
      durationMinutes: duration,
      skill: newSlot.skill,
      courseId: selectedCourse?.id,
      courseTitle: selectedCourse?.title,
      enabled: true,
    }));
    setPlan((previous) => ({ ...previous, slots: [...previous.slots, ...created] }));
    setScheduleOpen(false);
  };

  const applySuggestion = () => {
    setScheduleMode('preset');
    setSelectedPreset('gentle');
  };

  const startTimer = (slot?: StudySlot) => {
    const courseTitle = slot?.courseTitle ?? selectedCourse?.title;
    const skill = slot?.skill ?? newSlot.skill;
    const initialSeconds = (slot?.durationMinutes ?? DEFAULT_FOCUS_MINUTES) * 60;
    if (slot) {
      const key = todayKey();
      setPlan((previous) => ({ ...previous, attendance: { ...previous.attendance, [key]: [...new Set([...(previous.attendance[key] ?? []), slot.id])] } }));
    }
    setTimer({ mode: 'focus', secondsLeft: initialSeconds, initialSeconds, running: true, skill, courseTitle, slotId: slot?.id });
  };

  const finishTimerEarly = () => {
    if (!timer) return;
    recordFocusSession({ ...timer, running: false, secondsLeft: Math.max(0, timer.secondsLeft) });
    setTimer(null);
  };

  const finishTour = () => {
    window.localStorage.setItem(TOUR_STORAGE_KEY, '1');
    setTourStep(null);
  };

  return (
    <Paper data-testid="study-goals-widget" elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, border: '1px solid #E4E7EC', borderRadius: '8px', bgcolor: '#fff', position: 'relative' }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1 }} data-tour="goal-badge">
        <Typography variant="h6" sx={{ color: '#172033', fontWeight: 900 }}>Mục tiêu học tập</Typography>
        <Chip label={jlptGoal ? `JLPT ${jlptGoal}` : 'Chưa thiết lập'} size="small" sx={{ bgcolor: jlptGoal ? '#C41E3A' : '#EEF2F6', color: jlptGoal ? '#fff' : '#475467', fontWeight: 900 }} />
      </Stack>
      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#667085' }}>Lịch học, điểm danh và Pomodoro được lưu trên thiết bị này; điểm tập trung tự làm mới theo tuần.</Typography>

      <Box sx={{ mt: 2 }}>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>Mục tiêu tuần</Typography>
            <Tooltip title="Mục tiêu tuần khuyến nghị là 150 phút (tương đương 6 phiên Pomodoro 25 phút)." arrow>
              <HelpOutlineOutlinedIcon sx={{ fontSize: 16, color: '#98A2B3' }} />
            </Tooltip>
          </Stack>
          {editingTarget ? (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <TextField size="small" type="number" value={targetInput} onChange={(event) => setTargetInput(Number(event.target.value))} slotProps={{ htmlInput: { min: 30, max: 2000, step: 15, 'aria-label': 'Mục tiêu tuần (phút)' } }} sx={{ width: 108 }} />
              <IconButton size="small" aria-label="Lưu mục tiêu tuần" onClick={saveWeeklyTarget}><SaveOutlinedIcon fontSize="small" /></IconButton>
            </Stack>
          ) : (
            <Stack direction="row" spacing={0.25} sx={{ alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#667085', fontWeight: 800 }}>{weeklyMinutes}/{plan.weeklyTargetMinutes} phút/tuần</Typography>
              <IconButton size="small" aria-label="Sửa mục tiêu tuần" onClick={() => { setTargetInput(plan.weeklyTargetMinutes); setEditingTarget(true); }}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
            </Stack>
          )}
        </Stack>
        <LinearProgress variant="determinate" value={progress} sx={{ mt: 0.75, height: 8, borderRadius: 4, bgcolor: '#F1F5F9', '& .MuiLinearProgress-bar': { bgcolor: '#C41E3A' } }} />
      </Box>

      {upcoming ? (
        <Alert icon={<AddAlarmOutlinedIcon />} severity="info" sx={{ mt: 2, py: 0.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 800 }}>Buổi tiếp theo: {DAYS.find((day) => day.value === upcoming.slot.dayOfWeek)?.label} {upcoming.slot.startTime}</Typography>
          <Typography variant="caption">{upcoming.slot.skill} · {upcoming.slot.durationMinutes} phút{upcoming.slot.courseTitle ? ` · ${upcoming.slot.courseTitle}` : ''}</Typography>
        </Alert>
      ) : <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>Bạn chưa có lịch học cố định. Hãy thêm buổi học đầu tiên.</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }} data-tour="schedule">
        <Button size="small" variant="outlined" startIcon={<AddAlarmOutlinedIcon />} onClick={openSchedule} sx={{ borderColor: '#CBD5E1', color: '#475569', '&:hover': { borderColor: '#C41E3A', color: '#C41E3A', bgcolor: '#FFF7F8' } }}>Thêm lịch học</Button>
        <Button size="small" variant="outlined" startIcon={<NotificationsActiveOutlinedIcon />} onClick={() => void requestReminders()} disabled={reminderPermission === 'granted' || reminderPermission === 'unsupported'} sx={{ borderColor: '#CBD5E1', color: '#475569', '&:hover': { borderColor: '#C41E3A', color: '#C41E3A', bgcolor: '#FFF7F8' } }}>
          {reminderPermission === 'granted' ? 'Đã bật nhắc' : reminderPermission === 'unsupported' ? 'Trình duyệt không hỗ trợ' : 'Bật nhắc giờ học'}
        </Button>
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>Điểm tập trung theo kỹ năng</Typography>
          <Tooltip title="Mỗi 1 phút bấm giờ Pomodoro khi học kỹ năng tương ứng sẽ được cộng 1 điểm." arrow><HelpOutlineOutlinedIcon sx={{ fontSize: 16, color: '#98A2B3' }} /></Tooltip>
        </Stack>
        <TimerOutlinedIcon sx={{ color: '#C41E3A' }} />
      </Stack>
      <Stack spacing={1.25} sx={{ mt: 1.25 }}>
        {SKILLS.map(({ label, target, color, Icon }) => {
          const total = plan.focusTotals[label] ?? { minutes: 0, sessions: 0 };
          return (
            <Box key={label}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Icon sx={{ fontSize: 18, color, flexShrink: 0 }} />
                <Typography variant="caption" sx={{ color: '#475467', flex: 1 }}>{label}</Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color }}>{total.minutes}/{target} phút</Typography>
              </Stack>
              <LinearProgress variant="determinate" value={Math.min(100, (total.minutes / target) * 100)} sx={{ mt: 0.45, height: 7, borderRadius: 4, bgcolor: `${color}1A`, '& .MuiLinearProgress-bar': { bgcolor: color } }} />
              <Typography variant="caption" sx={{ color: '#98A2B3', fontSize: '0.68rem' }}>{total.sessions} phiên Pomodoro</Typography>
            </Box>
          );
        })}
      </Stack>

      {courseTotals.length > 0 && <Box sx={{ mt: 1.5 }}><Typography variant="caption" sx={{ fontWeight: 900, color: '#475467' }}>Điểm theo khóa học</Typography>{courseTotals.slice(0, 3).map(([key, total]) => <Stack key={key} direction="row" sx={{ justifyContent: 'space-between', mt: 0.5 }}><Typography variant="caption" sx={{ color: '#667085', maxWidth: '75%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{key.split(' · ').slice(1).join(' · ')}</Typography><Typography variant="caption" sx={{ fontWeight: 800 }}>{total.minutes} điểm</Typography></Stack>)}</Box>}
      <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: '#667085' }}>Mỗi phút tập trung hoàn thành được tính là một điểm cho kỹ năng và khóa học đã chọn.</Typography>

      <Button fullWidth variant="contained" startIcon={<PlayCircleOutlineIcon />} onClick={() => startTimer(upcoming?.slot)} data-tour="pomodoro" sx={{ mt: 2, bgcolor: '#C41E3A', color: '#fff', fontWeight: 800, '&:hover': { bgcolor: '#A71931' } }}>
        {timer?.mode === 'break' ? `Nghỉ giải lao ${formatSeconds(timer.secondsLeft)}` : timer ? `${timer.skill} · ${formatSeconds(timer.secondsLeft)}` : 'Bắt đầu Pomodoro'}
      </Button>
      {timer?.running && <Button fullWidth size="small" onClick={finishTimerEarly} sx={{ mt: 0.5, color: '#667085' }}>Kết thúc và lưu phiên</Button>}
      {timer && !timer.running && timer.mode === 'break' && <Button fullWidth size="small" onClick={() => setTimer(null)} sx={{ mt: 0.5 }}>Đóng bộ đếm nghỉ</Button>}

      {plan.slots.length > 0 && <Stack spacing={0.5} sx={{ mt: 2 }}><Typography variant="caption" sx={{ fontWeight: 900, color: '#475467' }}>Lịch cố định</Typography>{plan.slots.map((slot) => <Stack key={slot.id} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', bgcolor: '#F8FAFC', borderRadius: 1, px: 1, py: 0.5 }}><Typography variant="caption">{DAYS.find((day) => day.value === slot.dayOfWeek)?.label} {slot.startTime} · {slot.skill}</Typography><IconButton size="small" aria-label={`Xóa lịch ${slot.startTime}`} onClick={() => setPlan((previous) => ({ ...previous, slots: previous.slots.filter((item) => item.id !== slot.id) }))}><DeleteOutlineIcon fontSize="small" /></IconButton></Stack>)}</Stack>}

      {tourStep !== null && <Paper data-testid="study-goals-tour" elevation={8} sx={{ position: 'fixed', zIndex: 1400, right: { xs: 16, sm: 32 }, bottom: { xs: 16, sm: 32 }, width: { xs: 'calc(100% - 32px)', sm: 340 }, p: 2, border: '1px solid #F2A4B1' }}><Typography variant="overline" sx={{ color: '#C41E3A', fontWeight: 900 }}>Hướng dẫn {tourStep + 1}/3</Typography><Typography variant="body2" sx={{ mt: 0.5 }}>{['Xác định mục tiêu JLPT bạn muốn chinh phục.', 'Đặt lịch cố định để hệ thống tự động nhắc bạn vào bàn học.', 'Bật đồng hồ tập trung mỗi khi học để tích lũy điểm kỹ năng.'][tourStep]}</Typography><Stack direction="row" spacing={1} sx={{ mt: 1.5, justifyContent: 'flex-end' }}><Button size="small" onClick={finishTour}>Bỏ qua</Button><Button size="small" variant="contained" onClick={() => tourStep === 2 ? finishTour() : setTourStep(tourStep + 1)}>{tourStep === 2 ? 'Đã hiểu' : 'Tiếp theo'}</Button></Stack></Paper>}

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Thêm lịch học</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 1.25, color: '#667085' }}>Chọn lịch mẫu để bắt đầu nhanh hoặc chuyển sang tùy chỉnh.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            {[...PRESETS, { id: 'custom' as const, label: 'Tùy chỉnh', icon: '⚙️', summary: 'Tự chọn khóa học, kỹ năng, ngày và giờ' }].map((preset) => <Button key={preset.id} variant={selectedPreset === preset.id ? 'contained' : 'outlined'} onClick={() => { setSelectedPreset(preset.id); setScheduleMode(preset.id === 'custom' ? 'custom' : 'preset'); }} sx={{ flex: 1, minHeight: 74, textTransform: 'none', justifyContent: 'flex-start', alignItems: 'flex-start', flexDirection: 'column', bgcolor: selectedPreset === preset.id ? '#FFF1F2' : '#fff', color: '#172033', borderColor: selectedPreset === preset.id ? '#C41E3A' : '#CBD5E1' }}><Typography sx={{ fontWeight: 900 }}>{preset.icon} {preset.label}</Typography><Typography variant="caption" sx={{ textAlign: 'left', mt: 0.25 }}>{preset.summary}</Typography></Button>)}
          </Stack>
          {scheduleMode === 'custom' && <Stack spacing={2} sx={{ pt: 2 }}>
            {courses.length > 1 ? <FormControl fullWidth size="small"><InputLabel id="study-course-label">Khóa học</InputLabel><Select labelId="study-course-label" label="Khóa học" value={newSlot.courseId} onChange={(event) => setNewSlot((current) => ({ ...current, courseId: event.target.value }))}>{courses.map((course) => <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>)}</Select></FormControl> : <Alert severity="info" sx={{ py: 0.25 }}>{selectedCourse ? `Khóa học đang học: ${selectedCourse.title}` : 'Bạn chưa có khóa học đang học.'}</Alert>}
            <FormControl fullWidth size="small"><InputLabel id="study-skill-label">Kỹ năng</InputLabel><Select labelId="study-skill-label" label="Kỹ năng" value={newSlot.skill} onChange={(event) => setNewSlot((current) => ({ ...current, skill: event.target.value }))}>{SKILLS.map((skill) => <MenuItem key={skill.label} value={skill.label}>{skill.label}</MenuItem>)}</Select></FormControl>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><FormControl fullWidth size="small"><InputLabel id="study-day-label">Ngày</InputLabel><Select labelId="study-day-label" label="Ngày" value={newSlot.dayOfWeek} onChange={(event) => setNewSlot((current) => ({ ...current, dayOfWeek: Number(event.target.value) }))}>{DAYS.map((day) => <MenuItem key={day.value} value={day.value}>{day.label}</MenuItem>)}</Select></FormControl><TextField size="small" label="Giờ bắt đầu" type="time" value={newSlot.startTime} onChange={(event) => setNewSlot((current) => ({ ...current, startTime: event.target.value }))} slotProps={{ inputLabel: { shrink: true } }} fullWidth /></Stack>
            <Box><Typography variant="caption" sx={{ color: '#667085', fontWeight: 800 }}>Thời lượng</Typography><Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: 'wrap' }}>{([25, 50, 60] as const).map((value) => <Button key={value} size="small" variant={durationChoice === value ? 'contained' : 'outlined'} aria-pressed={durationChoice === value} onClick={() => setDurationChoice(value)}>{value} phút{value === 25 ? ' (1 Pomodoro)' : ''}</Button>)}<Button size="small" variant={durationChoice === 'custom' ? 'contained' : 'outlined'} aria-pressed={durationChoice === 'custom'} onClick={() => setDurationChoice('custom')}>Tùy chỉnh</Button></Stack>{durationChoice === 'custom' && <TextField size="small" type="number" label="Số phút" value={customDuration} onChange={(event) => setCustomDuration(Number(event.target.value))} slotProps={{ htmlInput: { min: 5, max: 180, step: 5 } }} sx={{ mt: 1, width: 140 }} />}</Box>
          </Stack>}
          <Alert severity="info" sx={{ mt: 2 }} icon={<TimerOutlinedIcon />}><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1 }}><Box><Typography variant="body2" sx={{ fontWeight: 800 }}>Gợi ý từ hệ thống</Typography><Typography variant="caption">Để hoàn thành khóa Kanji N5 đúng tiến độ, bạn chỉ cần học 3 buổi/tuần (tổng 75 phút).</Typography></Box><Button size="small" onClick={applySuggestion}>Áp dụng gợi ý này</Button></Stack></Alert>
        </DialogContent>
        <DialogActions><Button onClick={() => setScheduleOpen(false)}>Hủy</Button><Button variant="contained" onClick={addSchedule} sx={{ bgcolor: '#C41E3A', '&:hover': { bgcolor: '#A71931' } }}>Lưu lịch</Button></DialogActions>
      </Dialog>
    </Paper>
  );
}
