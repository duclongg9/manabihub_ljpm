import { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardActions, CardContent, Chip, CircularProgress, Dialog,
  DialogActions, DialogContent, DialogTitle, Divider, Grid, IconButton, MenuItem,
  Stack, TextField, Typography,
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import PublicRoundedIcon from '@mui/icons-material/PublicRounded';
import SportsEsportsOutlinedIcon from '@mui/icons-material/SportsEsportsOutlined';
import {
  weeklyChallengeAdminService, type ChallengePair, type ManagedWeeklyChallenge,
  type WeeklyChallengePayload,
} from './weeklyChallengeAdminService';

function mondayOfCurrentWeek() {
  const date = new Date();
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date.toISOString().slice(0, 10);
}

const emptyPayload = (): WeeklyChallengePayload => ({
  weekStart: mondayOfCurrentWeek(),
  title: 'Manabi Match · Thử thách tuần',
  description: 'Ghép thuật ngữ với cách đọc và ý nghĩa. Chọn sai sẽ bị cộng thời gian.',
  jlptLevel: 'N5', dailyRankedLimit: 3, wrongPenaltySeconds: 2,
  dailyAttendanceReward: 1000, firstPrize: 30000, secondPrize: 20000, thirdPrize: 10000,
  pairs: Array.from({ length: 6 }, () => ({ prompt: '', answer: '' })),
});

function toPayload(item: ManagedWeeklyChallenge): WeeklyChallengePayload {
  return { weekStart: item.weekStart, title: item.title, description: item.description,
    jlptLevel: item.jlptLevel, dailyRankedLimit: item.dailyRankedLimit,
    wrongPenaltySeconds: item.wrongPenaltySeconds, dailyAttendanceReward: item.dailyAttendanceReward,
    firstPrize: item.firstPrize, secondPrize: item.secondPrize, thirdPrize: item.thirdPrize,
    pairs: item.pairs.map(({ prompt, answer }) => ({ prompt, answer })) };
}

export function WeeklyChallengeManagementPage() {
  const [items, setItems] = useState<ManagedWeeklyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<WeeklyChallengePayload>(emptyPayload);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems(await weeklyChallengeAdminService.list()); }
    catch { setError('Không thể tải danh sách thử thách tuần.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditingId(null); setForm(emptyPayload()); setOpen(true); };
  const openEdit = (item: ManagedWeeklyChallenge) => { setEditingId(item.id); setForm(toPayload(item)); setOpen(true); };
  const updatePair = (index: number, field: keyof ChallengePair, value: string) => setForm((current) => ({
    ...current, pairs: current.pairs.map((pair, pairIndex) => pairIndex === index ? { ...pair, [field]: value } : pair),
  }));
  const save = async () => {
    setBusy(true); setError(null);
    try {
      if (editingId) await weeklyChallengeAdminService.update(editingId, form);
      else await weeklyChallengeAdminService.create(form);
      setOpen(false); await load();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Không thể lưu thử thách.');
    } finally { setBusy(false); }
  };
  const act = async (action: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await action(); await load(); }
    catch (err: unknown) { setError((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Thao tác thất bại.'); }
    finally { setBusy(false); }
  };

  return <Box sx={{ p: { xs: 2, md: 3 } }}>
    <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, mb: 3 }}>
      <Box><Typography variant="h5" sx={{ fontWeight: 900 }}>Trò chơi & thưởng học tập</Typography>
        <Typography color="text.secondary">Course Manager thay nội dung theo tuần; hệ thống tự xáo thẻ, giới hạn lượt và chốt thưởng.</Typography></Box>
      <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>Tạo tuần mới</Button>
    </Stack>
    <Alert severity="info" sx={{ mb: 3 }}>Điểm danh được chốt mỗi ngày từ hoạt động học hoàn thành. Xếp hạng trò chơi chỉ chốt sau Chủ Nhật. Tiền thưởng là số dư khuyến mại không thể rút.</Alert>
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    {loading ? <CircularProgress /> : <Grid container spacing={2}>{items.map((item) => <Grid size={{ xs: 12, lg: 6 }} key={item.id}>
      <Card variant="outlined"><CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 1 }}>
          <Box><Typography variant="h6" sx={{ fontWeight: 800 }}>{item.title}</Typography>
            <Typography variant="body2" color="text.secondary">{item.weekStart} → {item.weekEnd} · {item.pairs.length} cặp thẻ</Typography></Box>
          <Chip label={item.status === 'DRAFT' ? 'Bản nháp' : item.status === 'PUBLISHED' ? 'Đang công khai' : 'Đã chốt'} color={item.status === 'PUBLISHED' ? 'success' : 'default'} />
        </Stack><Divider sx={{ my: 2 }} />
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <Chip label={`Điểm danh ${item.dailyAttendanceReward.toLocaleString('vi-VN')} ₫/ngày`} />
          <Chip label={`Hạng 1: ${item.firstPrize.toLocaleString('vi-VN')} ₫`} />
          <Chip label={`Hạng 2: ${item.secondPrize.toLocaleString('vi-VN')} ₫`} />
          <Chip label={`Hạng 3: ${item.thirdPrize.toLocaleString('vi-VN')} ₫`} />
        </Stack>
      </CardContent><CardActions>
        {item.status === 'DRAFT' && <Button startIcon={<EditOutlinedIcon />} onClick={() => openEdit(item)}>Sửa nội dung</Button>}
        {item.status === 'DRAFT' && <Button startIcon={<PublicRoundedIcon />} onClick={() => act(() => weeklyChallengeAdminService.publish(item.id))}>Công khai</Button>}
        {item.status === 'PUBLISHED' && <Button color="warning" onClick={() => act(() => weeklyChallengeAdminService.unpublish(item.id))}>Ẩn</Button>}
        {item.status === 'DRAFT' && <Button color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => act(() => weeklyChallengeAdminService.remove(item.id))}>Xóa</Button>}
      </CardActions></Card>
    </Grid>)}</Grid>}

    <Dialog open={open} onClose={() => !busy && setOpen(false)} fullWidth maxWidth="md">
      <DialogTitle><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><SportsEsportsOutlinedIcon /><span>{editingId ? 'Sửa thử thách tuần' : 'Tạo thử thách tuần'}</span></Stack></DialogTitle>
      <DialogContent dividers><Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth type="date" label="Tuần bắt đầu (Thứ Hai)" slotProps={{ inputLabel: { shrink: true } }} value={form.weekStart} onChange={(e) => setForm({ ...form, weekStart: e.target.value })} /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth select label="Cấp độ" value={form.jlptLevel} onChange={(e) => setForm({ ...form, jlptLevel: e.target.value })}>{['N5','N4','N3','N2','N1'].map((level) => <MenuItem key={level} value={level}>{level}</MenuItem>)}</TextField></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth type="number" label="Lượt xếp hạng/ngày" value={form.dailyRankedLimit} onChange={(e) => setForm({ ...form, dailyRankedLimit: Number(e.target.value) })} /></Grid>
        <Grid size={{ xs: 12 }}><TextField fullWidth label="Tên thử thách" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Grid>
        <Grid size={{ xs: 12 }}><TextField fullWidth multiline minRows={2} label="Mô tả luật chơi" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth type="number" label="Phạt sai (giây)" value={form.wrongPenaltySeconds} onChange={(e) => setForm({ ...form, wrongPenaltySeconds: Number(e.target.value) })} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><TextField fullWidth type="number" label="Thưởng điểm danh/ngày" value={form.dailyAttendanceReward} onChange={(e) => setForm({ ...form, dailyAttendanceReward: Number(e.target.value) })} /></Grid>
        <Grid size={{ xs: 4, sm: 2 }}><TextField fullWidth type="number" label="Hạng 1" value={form.firstPrize} onChange={(e) => setForm({ ...form, firstPrize: Number(e.target.value) })} /></Grid>
        <Grid size={{ xs: 4, sm: 2 }}><TextField fullWidth type="number" label="Hạng 2" value={form.secondPrize} onChange={(e) => setForm({ ...form, secondPrize: Number(e.target.value) })} /></Grid>
        <Grid size={{ xs: 4, sm: 2 }}><TextField fullWidth type="number" label="Hạng 3" value={form.thirdPrize} onChange={(e) => setForm({ ...form, thirdPrize: Number(e.target.value) })} /></Grid>
        <Grid size={{ xs: 12 }}><Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Nội dung ghép cặp</Typography></Grid>
        {form.pairs.map((pair, index) => <Grid size={{ xs: 12 }} key={index}><Stack direction="row" spacing={1}>
          <TextField fullWidth label={`Thuật ngữ ${index + 1}`} value={pair.prompt} onChange={(e) => updatePair(index, 'prompt', e.target.value)} />
          <TextField fullWidth label="Cách đọc / nghĩa" value={pair.answer} onChange={(e) => updatePair(index, 'answer', e.target.value)} />
          <IconButton aria-label="Xóa cặp" disabled={form.pairs.length <= 4} onClick={() => setForm({ ...form, pairs: form.pairs.filter((_, pairIndex) => pairIndex !== index) })}><DeleteOutlineRoundedIcon /></IconButton>
        </Stack></Grid>)}
        <Grid size={{ xs: 12 }}><Button variant="outlined" disabled={form.pairs.length >= 12} onClick={() => setForm({ ...form, pairs: [...form.pairs, { prompt: '', answer: '' }] })}>Thêm cặp thẻ</Button></Grid>
      </Grid></DialogContent>
      <DialogActions><Button onClick={() => setOpen(false)} disabled={busy}>Hủy</Button><Button variant="contained" onClick={save} disabled={busy}>{busy ? 'Đang lưu...' : 'Lưu bản nháp'}</Button></DialogActions>
    </Dialog>
  </Box>;
}
