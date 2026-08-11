import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import ArrowBackIosNewOutlinedIcon from '@mui/icons-material/ArrowBackIosNewOutlined';
import ArrowForwardIosOutlinedIcon from '@mui/icons-material/ArrowForwardIosOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';
import {
  readPlan,
  STUDY_PLAN_OPEN_SCHEDULE_EVENT,
  STUDY_PLAN_UPDATED_EVENT,
  type StudyCourseOption,
  type StudySlot,
} from './StudyGoalsWidget';

type CalendarView = 'month' | 'week' | 'day';

interface StudyCalendarProps {
  courses?: StudyCourseOption[];
}

interface CalendarEvent {
  key: string;
  slot: StudySlot;
  date: Date;
  dateKey: string;
  color: string;
  startMinutes: number;
  endMinutes: number;
  conflict: boolean;
}

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const COURSE_COLORS = ['#D97706', '#2563EB', '#2F855A', '#9333EA', '#C41E3A', '#0F766E'];
const UNASSIGNED_COURSE_KEY = '__unassigned__';

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat('vi-VN', options).format(date);
}

function slotCourseKey(slot: StudySlot) {
  return slot.courseId || (slot.courseTitle ? `title:${slot.courseTitle}` : UNASSIGNED_COURSE_KEY);
}

function slotMinutes(slot: StudySlot) {
  const [hour, minute] = slot.startTime.split(':').map(Number);
  return (hour || 0) * 60 + (minute || 0);
}

function buildVisibleDates(cursor: Date, view: CalendarView) {
  const day = startOfDay(cursor);
  if (view === 'day') return [day];

  const mondayOffset = (day.getDay() + 6) % 7;
  const weekStart = view === 'week'
    ? addDays(day, -mondayOffset)
    : new Date(day.getFullYear(), day.getMonth(), 1);
  const firstDate = view === 'week'
    ? weekStart
    : addDays(weekStart, -((weekStart.getDay() + 6) % 7));
  const length = view === 'week' ? 7 : 42;
  return Array.from({ length }, (_, index) => addDays(firstDate, index));
}

function buildEvents(slots: StudySlot[], dates: Date[], colors: Record<string, string>) {
  if (dates.length === 0) return [];
  const first = dates[0];
  const last = dates[dates.length - 1];
  const events: CalendarEvent[] = [];
  for (let current = startOfDay(first); current <= last; current = addDays(current, 1)) {
    for (const slot of slots) {
      if (!slot.enabled || slot.dayOfWeek !== current.getDay()) continue;
      const startMinutes = slotMinutes(slot);
      const eventDate = startOfDay(current);
      events.push({
        key: `${slot.id}-${dateKey(eventDate)}`,
        slot,
        date: eventDate,
        dateKey: dateKey(eventDate),
        color: colors[slotCourseKey(slot)] || COURSE_COLORS[0],
        startMinutes,
        endMinutes: startMinutes + slot.durationMinutes,
        conflict: false,
      });
    }
  }
  return events.map((event) => ({
    ...event,
    conflict: events.some((other) => (
      other.key !== event.key
      && other.dateKey === event.dateKey
      && event.startMinutes < other.endMinutes
      && other.startMinutes < event.endMinutes
    )),
  }));
}

function formatTimeRange(event: CalendarEvent) {
  const endHour = Math.floor(event.endMinutes / 60) % 24;
  const endMinute = event.endMinutes % 60;
  return `${event.slot.startTime}–${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
}

export function StudyCalendar({ courses = [] }: StudyCalendarProps) {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(readPlan);
  const [view, setView] = useState<CalendarView>('week');
  const [expanded, setExpanded] = useState(true);
  const [cursor, setCursor] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const refresh = () => setPlan(readPlan());
    window.addEventListener(STUDY_PLAN_UPDATED_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(STUDY_PLAN_UPDATED_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const courseOptions = useMemo(() => {
    const options = new Map<string, string>();
    courses.forEach((course) => {
      options.set(course.id, course.title);
    });
    plan.slots.forEach((slot) => {
      const key = slotCourseKey(slot);
      if (!options.has(key)) options.set(key, slot.courseTitle || 'Khóa học chưa chọn');
    });
    return Array.from(options, ([key, title]) => ({ key, title }));
  }, [courses, plan.slots]);

  useEffect(() => {
    setSelectedCourses((previous) => {
      const next = { ...previous };
      for (const option of courseOptions) if (next[option.key] === undefined) next[option.key] = true;
      return next;
    });
  }, [courseOptions]);

  const colors = useMemo(() => Object.fromEntries(
    courseOptions.map((option, index) => [option.key, COURSE_COLORS[index % COURSE_COLORS.length]]),
  ), [courseOptions]);
  const visibleDates = useMemo(() => buildVisibleDates(cursor, view), [cursor, view]);
  const events = useMemo(() => buildEvents(plan.slots, visibleDates, colors), [plan.slots, visibleDates, colors]);
  const filteredEvents = events.filter((event) => selectedCourses[slotCourseKey(event.slot)] !== false);
  const selectedDayKey = selectedDay ? dateKey(selectedDay) : null;
  const selectedDayEvents = filteredEvents.filter((event) => event.dateKey === selectedDayKey)
    .sort((first, second) => first.startMinutes - second.startMinutes);
  const title = view === 'day'
    ? formatDate(cursor, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : view === 'week'
      ? `${formatDate(visibleDates[0], { day: 'numeric', month: 'short' })} – ${formatDate(visibleDates[6], { day: 'numeric', month: 'short', year: 'numeric' })}`
      : formatDate(cursor, { month: 'long', year: 'numeric' });

  const moveCursor = (amount: number) => {
    const next = new Date(cursor);
    if (view === 'month') next.setMonth(next.getMonth() + amount);
    else next.setDate(next.getDate() + (view === 'week' ? amount * 7 : amount));
    setCursor(startOfDay(next));
  };

  const openSchedule = () => {
    const dayOfWeek = selectedDay?.getDay() ?? new Date().getDay();
    setSelectedDay(null);
    window.dispatchEvent(new CustomEvent(STUDY_PLAN_OPEN_SCHEDULE_EVENT, { detail: { dayOfWeek } }));
  };

  const startLesson = (event: CalendarEvent) => {
    if (!event.slot.courseId) return;
    setSelectedDay(null);
    navigate(ROUTES.STUDENT.COURSE_LEARN(event.slot.courseId));
  };

  const renderEvent = (event: CalendarEvent, compact = false) => (
    <Box
      key={event.key}
      data-testid={`calendar-event-${event.key}`}
      sx={{
        px: compact ? 0.65 : 0.75,
        py: compact ? 0.35 : 0.5,
        borderRadius: compact ? 999 : 1,
        bgcolor: `${event.color}18`,
        border: `1px solid ${event.color}35`,
        borderLeft: compact ? undefined : `3px solid ${event.color}`,
        minWidth: 0,
        display: compact ? 'flex' : 'block',
        alignItems: compact ? 'center' : undefined,
        gap: compact ? 0.5 : undefined,
      }}
    >
      {compact && <Box aria-hidden="true" sx={{ width: 7, height: 7, flexShrink: 0, borderRadius: '50%', bgcolor: event.color }} />}
      <Typography variant="caption" sx={{ display: 'block', color: event.color, fontWeight: 900, lineHeight: 1.2 }}>
        {event.slot.startTime} {event.conflict && '⚠'}
      </Typography>
      {!compact && <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#344054' }}>
        {event.slot.courseTitle || event.slot.skill}
      </Typography>}
    </Box>
  );

  return (
    <Paper data-testid="study-calendar" elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, border: '1px solid #E4E7EC', borderRadius: '8px', bgcolor: '#fff' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { md: 'center' }, gap: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <CalendarMonthOutlinedIcon sx={{ color: '#C41E3A' }} />
          <Box>
            <Typography variant="h6" sx={{ color: '#172033', fontWeight: 900 }}>Lịch học của bạn</Typography>
            <Typography variant="caption" color="text.secondary">Theo dõi lịch đan xen và vào học đúng suất đã đặt.</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          {(['month', 'week', 'day'] as const).map((option) => (
            <Button key={option} size="small" variant={view === option ? 'contained' : 'outlined'} onClick={() => setView(option)} sx={{ minWidth: option === 'month' ? 64 : 56, textTransform: 'none', bgcolor: view === option ? '#C41E3A' : undefined }}>
              {option === 'month' ? 'Tháng' : option === 'week' ? 'Tuần' : 'Hôm nay'}
            </Button>
          ))}
          <IconButton
            size="small"
            aria-label={expanded ? 'Thu gọn lịch học' : 'Mở rộng lịch học'}
            onClick={() => setExpanded((current) => !current)}
            sx={{ ml: 0.5, color: '#667085' }}
          >
            {expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          </IconButton>
        </Stack>
      </Stack>

      {expanded && <>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 1, mt: 2 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <IconButton size="small" aria-label="Lịch trước" onClick={() => moveCursor(-1)}><ArrowBackIosNewOutlinedIcon sx={{ fontSize: 15 }} /></IconButton>
          <Typography variant="subtitle1" sx={{ minWidth: 190, textAlign: 'center', fontWeight: 900, textTransform: 'capitalize' }}>{title}</Typography>
          <IconButton size="small" aria-label="Lịch sau" onClick={() => moveCursor(1)}><ArrowForwardIosOutlinedIcon sx={{ fontSize: 15 }} /></IconButton>
          <Button size="small" onClick={() => { setCursor(startOfDay(new Date())); setView('day'); }} sx={{ textTransform: 'none', ml: 0.5 }}>Hôm nay</Button>
        </Stack>
        <Button size="small" variant="outlined" startIcon={<AddOutlinedIcon />} onClick={openSchedule} sx={{ textTransform: 'none', borderColor: '#CBD5E1', color: '#475569' }}>Thêm suất học</Button>
      </Stack>

      {courseOptions.length > 0 && (
        <Stack direction="row" spacing={0.25} sx={{ mt: 1.25, flexWrap: 'wrap', rowGap: 0.25 }}>
          {courseOptions.map((option) => (
            <FormControlLabel
              key={option.key}
              control={<Checkbox size="small" slotProps={{ input: { 'aria-label': option.title } }} checked={selectedCourses[option.key] !== false} onChange={(event) => setSelectedCourses((previous) => ({ ...previous, [option.key]: event.target.checked }))} sx={{ color: colors[option.key], '&.Mui-checked': { color: colors[option.key] } }} />}
              label={<Typography variant="caption" sx={{ color: '#475467' }}>{option.title}</Typography>}
              sx={{ mr: 1, my: 0 }}
            />
          ))}
        </Stack>
      )}

      {view === 'day' ? (
        <Stack spacing={1} sx={{ mt: 2 }}>
          {filteredEvents.filter((event) => event.dateKey === dateKey(cursor)).sort((first, second) => first.startMinutes - second.startMinutes).map((event) => (
            <Box key={event.key} sx={{ p: 1.25, border: '1px solid #E4E7EC', borderLeft: `4px solid ${event.color}`, borderRadius: 1 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}>
                <Box><Typography variant="body2" sx={{ fontWeight: 900 }}>{formatTimeRange(event)} · {event.slot.skill}</Typography><Typography variant="caption" color="text.secondary">{event.slot.courseTitle || 'Khóa học chưa chọn'}</Typography></Box>
                <Button size="small" variant="contained" startIcon={<PlayArrowOutlinedIcon />} disabled={!event.slot.courseId} onClick={() => startLesson(event)} sx={{ alignSelf: { sm: 'center' }, bgcolor: '#C41E3A', textTransform: 'none' }}>Vào học ngay</Button>
              </Stack>
              {event.conflict && <Chip size="small" color="warning" icon={<WarningAmberOutlinedIcon />} label="Trùng lịch" sx={{ mt: 0.75 }} />}
            </Box>
          ))}
          {filteredEvents.filter((event) => event.dateKey === dateKey(cursor)).length === 0 && <Alert severity="info" sx={{ mt: 1 }}>Ngày này chưa có suất học. Bạn có thể thêm lịch ngay.</Alert>}
        </Stack>
      ) : (
        <Box sx={{ mt: 2, overflowX: 'auto' }}>
          <Box sx={{ minWidth: view === 'month' ? 650 : 760 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', borderTop: '1px solid #E4E7EC', borderLeft: '1px solid #E4E7EC' }}>
              {WEEKDAY_LABELS.map((label) => <Typography key={label} variant="caption" sx={{ p: 0.75, textAlign: 'center', color: '#667085', fontWeight: 900, borderRight: '1px solid #E4E7EC', borderBottom: '1px solid #E4E7EC' }}>{label}</Typography>)}
              {visibleDates.map((date) => {
                const dayEvents = filteredEvents.filter((event) => event.dateKey === dateKey(date));
                const isCurrentMonth = date.getMonth() === cursor.getMonth();
                const isToday = dateKey(date) === dateKey(new Date());
                return (
                  <Box
                    component="button"
                    type="button"
                    key={dateKey(date)}
                    data-testid={`calendar-day-${dateKey(date)}`}
                    onClick={() => setSelectedDay(date)}
                    sx={{ minHeight: view === 'month' ? 86 : 150, p: 0.75, textAlign: 'left', verticalAlign: 'top', border: 0, borderRight: '1px solid #E4E7EC', borderBottom: '1px solid #E4E7EC', bgcolor: isToday ? '#FFF7F8' : '#fff', opacity: view === 'month' && !isCurrentMonth ? 0.5 : 1, cursor: 'pointer', '&:hover': { bgcolor: '#FFF7F8' } }}
                  >
                    <Typography variant="caption" sx={{ display: 'inline-flex', width: 24, height: 24, alignItems: 'center', justifyContent: 'center', borderRadius: '50%', bgcolor: isToday ? '#C41E3A' : 'transparent', color: isToday ? '#fff' : '#344054', fontWeight: 900 }}>{date.getDate()}</Typography>
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                      {dayEvents.slice(0, view === 'month' ? 3 : 8).map((event) => renderEvent(event, view === 'month'))}
                      {dayEvents.length > (view === 'month' ? 3 : 8) && <Typography variant="caption" color="text.secondary">+{dayEvents.length - (view === 'month' ? 3 : 8)} suất khác</Typography>}
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      )}

      {filteredEvents.some((event) => event.conflict) && <Alert severity="warning" icon={<WarningAmberOutlinedIcon />} sx={{ mt: 1.5, py: 0.25 }}>Có suất học bị trùng giờ. Hãy bấm vào ngày đó để xem và chỉnh lại lịch.</Alert>}
      </>}

      <Dialog open={Boolean(selectedDay)} onClose={() => setSelectedDay(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
          Lịch học ngày {selectedDay ? formatDate(selectedDay, { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''}
          <IconButton aria-label="Đóng" size="small" onClick={() => setSelectedDay(null)}><CloseRoundedIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedDayEvents.length === 0 ? <Alert severity="info">Ngày này chưa có suất học.</Alert> : <Stack spacing={1.25}>{selectedDayEvents.map((event) => <Box key={event.key} sx={{ p: 1.25, border: '1px solid #E4E7EC', borderLeft: `4px solid ${event.color}`, borderRadius: 1 }}><Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 1 }}><Box><Typography variant="body2" sx={{ fontWeight: 900 }}>{formatTimeRange(event)} · {event.slot.skill}</Typography><Typography variant="caption" color="text.secondary">{event.slot.courseTitle || 'Khóa học chưa chọn'}</Typography><Typography variant="caption" sx={{ display: 'block', mt: 0.35, color: '#475467', fontWeight: 700 }}>Dự kiến: {event.slot.lessonTitle || 'tiếp tục bài học gần nhất'}</Typography></Box><Button size="small" variant="contained" startIcon={<PlayArrowOutlinedIcon />} disabled={!event.slot.courseId} onClick={() => startLesson(event)} sx={{ alignSelf: { sm: 'center' }, bgcolor: '#C41E3A', textTransform: 'none' }}>Bắt đầu học ngay</Button></Stack>{event.conflict && <Chip size="small" color="warning" icon={<WarningAmberOutlinedIcon />} label="Trùng lịch" sx={{ mt: 0.75 }} />}</Box>)}</Stack>}
        </DialogContent>
        <DialogActions><Button variant="outlined" startIcon={<AddOutlinedIcon />} onClick={openSchedule} sx={{ textTransform: 'none', borderColor: '#CBD5E1', color: '#475569' }}>Thêm/sửa suất học ngày này</Button></DialogActions>
      </Dialog>
    </Paper>
  );
}
