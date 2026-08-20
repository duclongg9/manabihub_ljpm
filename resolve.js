const fs = require('fs');

function processConflicts(filePath, resolver) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = '';
  let index = 0;

  while (true) {
    let start = content.indexOf('<<<<<<< HEAD', index);
    if (start === -1) {
      newContent += content.substring(index);
      break;
    }
    
    // Instead of looking for EXACT '\n', find the next occurrence of '=======' and '>>>>>>> origin/develop'
    let mid = content.indexOf('=======', start);
    let end = content.indexOf('>>>>>>> origin/develop', mid);
    
    if (mid === -1 || end === -1) {
      console.error('Malformed conflict marker in ' + filePath);
      break;
    }
    
    newContent += content.substring(index, start);
    
    // Find the actual lines
    let endOfStart = content.indexOf('\n', start) + 1;
    let endOfMid = content.indexOf('\n', mid) + 1;
    let endOfEnd = content.indexOf('\n', end);
    if (endOfEnd === -1) endOfEnd = content.length;
    else endOfEnd += 1; // include newline
    
    let headBlock = content.substring(endOfStart, mid);
    let developBlock = content.substring(endOfMid, end);
    
    let resolved = resolver(headBlock, developBlock);
    newContent += resolved;
    
    index = endOfEnd;
  }

  fs.writeFileSync(filePath, newContent);
}

processConflicts('frontend/src/features/student/components/StudyCalendar.tsx', (head, develop) => {
  if (head.includes('MenuItem,')) {
    return `  FormControlLabel,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
`;
  }
  if (develop.includes('ToggleButtonGroup')) {
    return develop;
  }
  if (develop.includes('EditCalendarOutlinedIcon')) {
    return `import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import EditCalendarOutlinedIcon from '@mui/icons-material/EditCalendarOutlined';
`;
  }
  if (head.includes('WarningAmberOutlinedIcon')) {
    return head;
  }
  if (head.includes('LEVEL_STYLES')) {
    return `const LEVEL_COLORS: Record<string, string> = {
  N5: '#D97706',
  N4: '#2563EB',
  N3: '#2F855A',
  N2: '#9333EA',
  N1: '#C41E3A',
};
const UNASSIGNED_COURSE_KEY = '__unassigned__';
const MAX_DAY_EVENTS = 2;
`;
  }
  if (head.includes('function levelStyle')) {
    return develop;
  }
  if (head.includes('levelStyle(slot.courseTitle).color')) {
    return develop;
  }
  if (head.includes('filterAnchor') && develop.includes('courseFilterAnchorEl')) {
    return `  const [courseFilterAnchorEl, setCourseFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [courseSearch, setCourseSearch] = useState('');
  const [pinnedCourseIds, setPinnedCourseIds] = useState(readPinnedCourseIds);
`;
  }
  if (head.includes('selectedCourses') && develop.includes('filteredCourseOptions')) {
    return `  const colors = useMemo(() => Object.fromEntries(
    courseOptions.map((option) => [option.id, courseColor(option.title)]),
  ), [courseOptions]);
  const filteredCourseOptions = courseOptions.filter((option) => option.title.toLocaleLowerCase('vi-VN').includes(courseSearch.trim().toLocaleLowerCase('vi-VN')));
  const levelLegend = ['N5', 'N4', 'N3', 'N2', 'N1'].filter((level) => courseOptions.some((option) => new RegExp(\`\\\\b\${level}\\\\b\`, 'i').test(option.title)));
  const selectedCourseCount = courseOptions.filter((option) => selectedCourses[option.id] !== false).length;
`;
  }
  if (head.includes('function handleCourseToggle') && develop.includes('function handleCourseToggle')) {
    return `
  function handleCourseToggle(courseId: string) {
    setSelectedCourses((prev) => ({ ...prev, [courseId]: prev[courseId] === false }));
  }
  
  function handleTogglePin(courseId: string, event: React.MouseEvent) {
    event.stopPropagation();
    const newPins = new Set(pinnedCourseIds);
    if (newPins.has(courseId)) newPins.delete(courseId);
    else newPins.add(courseId);
    setPinnedCourseIds(newPins);
    window.localStorage.setItem('manabihub.student.calendar-pins.v1', JSON.stringify(Array.from(newPins)));
    window.dispatchEvent(new Event('manabihub:calendar-pins-updated'));
  }
`;
  }
  if (head.includes('thisWeekCourseIds') && develop.includes('const events = useMemo')) {
    return `  const thisWeekCourseIds = useMemo(() => {
    const ids = new Set<string>();
    for (const slot of plan.slots) {
      if (!slot.enabled) continue;
      for (const occurrence of Object.values(eventDates[slot.id] ?? {})) {
        if (isSlotAvailableOnDate(slot, occurrence, courseOptions)) {
          ids.add(slot.courseId || UNASSIGNED_COURSE_KEY);
        }
      }
    }
    return ids;
  }, [plan.slots, eventDates, courseOptions]);

  useEffect(() => {
    if (courseOptions.length === 0) return;
    const initialSelection: Record<string, boolean> = {};
    for (const course of courseOptions) {
      const isAvailable = isCourseAvailableOnDate(course, new Date());
      initialSelection[course.id] = pinnedCourseIds.has(course.id) || (thisWeekCourseIds.has(course.id) && isAvailable);
    }
    setSelectedCourses(initialSelection);
  }, [courseOptions, thisWeekCourseIds, pinnedCourseIds]);

  const events = useMemo(() => buildEvents(plan.slots, visibleDates, courseOptions), [plan.slots, visibleDates, courseOptions]);
`;
  }
  if (head.includes('setFilterSearch') && develop.includes('setCourseSearch')) {
    return `        onClose={() => setCourseFilterAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 320, mt: 1, maxHeight: 400, display: 'flex', flexDirection: 'column' } } }}
      >
        <Box sx={{ p: 2, pb: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between' }}>
            Khóa học hiển thị
            <Typography component="span" variant="caption" color="text.secondary">
              ({selectedCourseCount}/{courseOptions.length})
            </Typography>
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Tìm khóa học..."
            value={courseSearch}
            onChange={(e) => setCourseSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
            }}
          />
        </Box>
        <Box sx={{ overflowY: 'auto', p: 1 }}>
          {filteredCourseOptions.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>Không tìm thấy khóa học</Typography>
          ) : (
            filteredCourseOptions
              .sort((a, b) => {
                if (pinnedCourseIds.has(a.id) && !pinnedCourseIds.has(b.id)) return -1;
                if (!pinnedCourseIds.has(a.id) && pinnedCourseIds.has(b.id)) return 1;
                return 0;
              })
              .map((course) => {
                const isPinned = pinnedCourseIds.has(course.id);
                return (
                  <MenuItem 
                    key={course.id} 
                    onClick={() => handleCourseToggle(course.id)}
                    sx={{ borderRadius: 1, mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}
                  >
                    <Checkbox
                      checked={selectedCourses[course.id] !== false}
                      size="small"
                      sx={{ p: 0.5 }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap>{course.title}</Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleTogglePin(course.id, e)}
                      sx={{ 
                        color: isPinned ? 'warning.main' : 'action.disabled',
                        opacity: isPinned ? 1 : 0.4,
                        '&:hover': { opacity: 1, color: 'warning.main' }
                      }}
                    >
                      {isPinned ? <PushPinIcon fontSize="small" /> : <PushPinOutlinedIcon fontSize="small" />}
                    </IconButton>
                  </MenuItem>
                );
              })
          )}
        </Box>
      </Popover>
`;
  }
  
  if (develop.includes('renderEvent(event)')) {
    return develop;
  }
  
  if (head.includes('onClick={() => setFilterAnchor(e.currentTarget)}')) {
    return `            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<FilterListIcon />}
              onClick={(e) => setCourseFilterAnchorEl(e.currentTarget)}
              data-testid="calendar-course-filter"
            >
              Lọc ({selectedCourseCount})
            </Button>
`;
  }
  
  return develop; 
});

processConflicts('frontend/src/features/student/components/StudyGoalsWidget.tsx', (head, develop) => {
  if (head.includes('STUDY_PLAN_OPEN_SCHEDULE_EVENT')) {
    return `export const STUDY_PLAN_OPEN_SCHEDULE_EVENT = 'manabihub:study-plan-open-schedule';
export const STUDY_PLAN_OPEN_BULK_SCHEDULE_EVENT = 'manabihub:study-plan-open-bulk-schedule';
export const STORAGE_KEY = 'manabihub.student.study-plan.v1';
export const todayKey = (date: Date = new Date()) => \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}-\${String(date.getDate()).padStart(2, '0')}\`;

export interface StudySlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  durationMinutes: number;
  skill: string;
  courseId?: string;
  courseTitle?: string;
  enabled: boolean;
}
`;
  }
  if (head.includes('BulkAction')) {
    return `type BulkAction = 'offset' | 'set_time' | 'delete' | null;
`;
  }
  if (head.includes('editingSlot')) {
    return `  const [editingSlot, setEditingSlot] = useState<StudySlot | null>(null);
  const [editingDay, setEditingDay] = useState<{ dayOfWeek: number; dateKey: string } | null>(null);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [bulkTime, setBulkTime] = useState('');
  const [bulkOffset, setBulkOffset] = useState(15);
`;
  }
  if (head.includes('handleOpenSchedule')) {
    return `  useEffect(() => {
    const handleOpenSchedule = (e: Event) => {
      const customEvent = e as CustomEvent<{ dayOfWeek?: number; dateKey?: string; slotId?: string }>;
      if (customEvent.detail.slotId) {
        const slot = plan.slots.find((s) => s.id === customEvent.detail.slotId);
        if (slot) {
          setEditingSlot({ ...slot });
          setEditingDay(null);
        }
      } else if (customEvent.detail.dayOfWeek !== undefined && customEvent.detail.dateKey) {
        setEditingDay({ dayOfWeek: customEvent.detail.dayOfWeek, dateKey: customEvent.detail.dateKey });
        setEditingSlot(null);
      }
    };
    const handleOpenBulk = () => setBulkActionOpen(true);
    
    window.addEventListener(STUDY_PLAN_OPEN_SCHEDULE_EVENT, handleOpenSchedule);
    window.addEventListener(STUDY_PLAN_OPEN_BULK_SCHEDULE_EVENT, handleOpenBulk);
    return () => {
      window.removeEventListener(STUDY_PLAN_OPEN_SCHEDULE_EVENT, handleOpenSchedule);
      window.removeEventListener(STUDY_PLAN_OPEN_BULK_SCHEDULE_EVENT, handleOpenBulk);
    };
  }, [plan.slots]);
`;
  }
  if (head.includes('handleSaveSlot')) {
    return `  function handleSaveSlot(savedSlot: StudySlot) {
    updatePlan((prev) => {
      const isExisting = prev.slots.some((s) => s.id === savedSlot.id);
      return {
        ...prev,
        slots: isExisting
          ? prev.slots.map((s) => (s.id === savedSlot.id ? savedSlot : s))
          : [...prev.slots, savedSlot],
      };
    });
    setEditingSlot(null);
    setEditingDay(null);
  }

  function handleDeleteSlot(id: string) {
    updatePlan((prev) => ({ ...prev, slots: prev.slots.filter((s) => s.id !== id) }));
    setEditingSlot(null);
    setEditingDay(null);
  }
`;
  }
  if (head.includes('handleApplyBulkAction')) {
    return `  function handleApplyBulkAction() {
    if (!bulkAction) return;
    
    updatePlan((prev) => {
      let newSlots = [...prev.slots];
      if (bulkAction === 'delete') {
        newSlots = [];
      } else if (bulkAction === 'set_time' && bulkTime) {
        newSlots = newSlots.map(s => ({ ...s, startTime: bulkTime }));
      } else if (bulkAction === 'offset') {
        newSlots = newSlots.map(s => {
          const [h, m] = s.startTime.split(':').map(Number);
          const totalMins = h * 60 + m + bulkOffset;
          const newH = Math.floor(Math.max(0, Math.min(23 * 60 + 59, totalMins)) / 60);
          const newM = Math.max(0, Math.min(23 * 60 + 59, totalMins)) % 60;
          return { ...s, startTime: \`\${String(newH).padStart(2, '0')}:\${String(newM).padStart(2, '0')}\` };
        });
      }
      return { ...prev, slots: newSlots };
    });
    
    setBulkActionOpen(false);
    setBulkAction(null);
  }
`;
  }
  if (develop.includes('<DayAgendaEditor')) {
    return develop;
  }
  if (head.includes('editingSlot && (')) {
    return `      {editingSlot && (
        <Dialog open onClose={() => setEditingSlot(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Sửa suất học</DialogTitle>
          <DialogContent dividers>
            <ScheduleSlotForm
              courses={courses}
              initialData={editingSlot}
              existingSlots={plan.slots.filter(s => s.id !== editingSlot.id)}
              onSave={handleSaveSlot}
              onCancel={() => setEditingSlot(null)}
            />
          </DialogContent>
          <DialogActions>
            <Button color="error" onClick={() => handleDeleteSlot(editingSlot.id)}>Xóa suất</Button>
          </DialogActions>
        </Dialog>
      )}

      {editingDay && (
        <DayAgendaEditor
          open
          courses={courses}
          dayOfWeek={editingDay.dayOfWeek}
          dateKey={editingDay.dateKey}
          existingSlots={plan.slots}
          onSave={handleSaveSlot}
          onDelete={handleDeleteSlot}
          onClose={() => setEditingDay(null)}
        />
      )}

      <Dialog open={bulkActionOpen} onClose={() => setBulkActionOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tùy chỉnh lịch hàng loạt</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Thao tác giờ</InputLabel>
              <Select value={bulkAction || ''} label="Thao tác giờ" onChange={(e) => setBulkAction(e.target.value as BulkAction)}>
                <MenuItem value="offset">Dịch chuyển toàn bộ giờ (+/- phút)</MenuItem>
                <MenuItem value="set_time">Đặt cùng một giờ</MenuItem>
                <MenuItem value="delete">Xóa toàn bộ</MenuItem>
              </Select>
            </FormControl>

            {bulkAction === 'set_time' && (
              <TextField
                label="Giờ mới" type="time" fullWidth value={bulkTime}
                onChange={(e) => setBulkTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}
            
            {bulkAction === 'offset' && (
              <Box>
                <Typography gutterBottom>Dịch chuyển: {bulkOffset > 0 ? \`+\${bulkOffset}\` : bulkOffset} phút</Typography>
                <Slider
                  value={bulkOffset}
                  onChange={(_, val) => setBulkOffset(val as number)}
                  step={5} min={-120} max={120} marks
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
            {bulkAction === 'delete' && (
              <Alert severity="warning">Thao tác này sẽ xóa toàn bộ {plan.slots.length} ca học. Không thể hoàn tác.</Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionOpen(false)}>Hủy</Button>
          <Button 
            variant="contained" 
            color={bulkAction === 'delete' ? 'error' : 'primary'}
            disabled={!bulkAction || (bulkAction === 'set_time' && !bulkTime)}
            onClick={handleApplyBulkAction}
          >
            {bulkAction === 'delete' ? 'Xóa ca học' : \`Áp dụng cho \${plan.slots.length} ca\`}
          </Button>
        </DialogActions>
      </Dialog>
`;
  }
  
  return develop;
});

console.log('Conflicts resolved.');
