import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { useParams } from 'react-router-dom';
import { adminFinanceApi } from './adminFinanceApi';
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
  type ExpenseDetail,
  type ExpenseFilters,
  type ExpensePayload,
  type ExpenseStatus,
  type ExpenseSummary,
} from './types';

const STATUS_LABEL: Record<ExpenseStatus, string> = {
  DRAFT: 'Nháp', CONFIRMED: 'Đã xác nhận', PAID: 'Đã thanh toán', VOID: 'Đã vô hiệu',
};

const initialFilters: ExpenseFilters = { page: 0, size: 10, status: '', category: '', keyword: '' };

function emptyForm(): ExpensePayload {
  return {
    vendorName: '', providerCode: '', invoiceNumber: '', description: '', currency: 'VND',
    exchangeRate: 1, incurredAt: new Date().toISOString().slice(0, 10), evidenceReference: '',
    sourceType: 'MANUAL_INVOICE',
    lines: [{ categoryCode: 'OTHER_OPERATIONAL', description: '', originalAmount: '' }],
  };
}

function money(value: number | string, currency = 'VND') {
  try {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: currency === 'VND' ? 0 : 2 }).format(Number(value || 0));
  } catch {
    return `${Number(value || 0).toLocaleString('vi-VN')} ${currency}`;
  }
}

export function SystemExpenseManagementPage() {
  const { id: routeExpenseId } = useParams<{ id: string }>();
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters);
  const [draftFilters, setDraftFilters] = useState<ExpenseFilters>(initialFilters);
  const [items, setItems] = useState<ExpenseSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [detail, setDetail] = useState<ExpenseDetail | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<ExpensePayload>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await adminFinanceApi.searchExpenses(filters);
      setItems(page.content);
      setTotal(page.totalElements);
    } catch {
      setError('Không thể tải danh sách chi phí vận hành.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { void load(); }, [load]);

  const openDetail = async (id: string) => {
    setError(null);
    try { setDetail(await adminFinanceApi.getExpense(id)); }
    catch { setError('Không thể tải chi tiết chứng từ chi phí.'); }
  };

  useEffect(() => {
    if (routeExpenseId) void openDetail(routeExpenseId);
  // The route id is the only trigger; openDetail intentionally reads no component state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeExpenseId]);

  const openCreate = () => {
    setForm(emptyForm());
    setDetail(null);
    setFormOpen(true);
  };

  const openEdit = (expense: ExpenseDetail) => {
    setForm({
      version: expense.version,
      vendorName: expense.vendorName,
      providerCode: expense.providerCode ?? '',
      invoiceNumber: expense.invoiceNumber ?? '',
      description: expense.description ?? '',
      currency: expense.currency,
      exchangeRate: expense.exchangeRate,
      incurredAt: expense.incurredAt,
      billingPeriodFrom: expense.billingPeriodFrom ?? '',
      billingPeriodTo: expense.billingPeriodTo ?? '',
      evidenceReference: expense.evidenceReference ?? '',
      sourceType: expense.sourceType,
      lines: expense.lines.map((line) => ({
        categoryCode: line.categoryCode,
        description: line.description,
        originalAmount: line.originalAmount,
      })),
    });
    setFormOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.vendorName.trim() || !form.incurredAt || form.lines.some((line) => !line.description.trim() || Number(line.originalAmount) <= 0)) {
      setError('Vui lòng nhập nhà cung cấp, ngày phát sinh và đầy đủ các dòng chi phí có số tiền lớn hơn 0.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = detail?.status === 'DRAFT'
        ? await adminFinanceApi.updateExpense(detail.id, form)
        : await adminFinanceApi.createExpense(form);
      setFormOpen(false);
      setDetail(saved);
      setMessage(detail?.status === 'DRAFT' ? 'Đã cập nhật chứng từ nháp.' : 'Đã tạo chứng từ chi phí ở trạng thái nháp.');
      await load();
    } catch {
      setError('Không thể lưu chứng từ. Kiểm tra trùng số hóa đơn, dữ liệu và phiên bản cập nhật.');
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (action: 'confirm' | 'paid' | 'void') => {
    if (!detail) return;
    let reason = '';
    if (action === 'void') {
      reason = window.prompt('Nhập lý do vô hiệu chứng từ (tối thiểu 5 ký tự):')?.trim() ?? '';
      if (reason.length < 5) return;
    }
    setSaving(true);
    setError(null);
    try {
      const next = action === 'confirm'
        ? await adminFinanceApi.confirmExpense(detail.id)
        : action === 'paid'
          ? await adminFinanceApi.markExpensePaid(detail.id)
          : await adminFinanceApi.voidExpense(detail.id, reason);
      setDetail(next);
      setMessage(action === 'confirm' ? 'Đã xác nhận chi phí.' : action === 'paid' ? 'Đã ghi nhận thanh toán.' : 'Đã vô hiệu chứng từ, dữ liệu vẫn được giữ để kiểm toán.');
      await load();
    } catch {
      setError('Không thể chuyển trạng thái chứng từ. Dữ liệu có thể đã được người khác cập nhật.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ justifyContent: 'space-between', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>Quản lý chi phí vận hành</Typography>
          <Typography color="text.secondary">Mỗi hóa đơn là một chứng từ; AWS, SMS, AI, KYC… được tách thành các dòng thành phần.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Thêm chứng từ</Button>
      </Stack>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" onClose={() => setMessage(null)} sx={{ mb: 2 }}>{message}</Alert>}

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 2 }}>
          <TextField label="Tìm nhà cung cấp / hóa đơn" value={draftFilters.keyword} onChange={(event) => setDraftFilters({ ...draftFilters, keyword: event.target.value })} fullWidth />
          <TextField select label="Trạng thái" value={draftFilters.status} onChange={(event) => setDraftFilters({ ...draftFilters, status: event.target.value as ExpenseFilters['status'] })} sx={{ minWidth: 180 }}>
            <MenuItem value="">Tất cả</MenuItem>{Object.entries(STATUS_LABEL).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField select label="Nhóm chi phí" value={draftFilters.category} onChange={(event) => setDraftFilters({ ...draftFilters, category: event.target.value as ExpenseFilters['category'] })} sx={{ minWidth: 240 }}>
            <MenuItem value="">Tất cả</MenuItem>{EXPENSE_CATEGORIES.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
          </TextField>
          <Button variant="outlined" onClick={() => setFilters({ ...draftFilters, page: 0 })}>Lọc</Button>
          <Button onClick={() => { setDraftFilters(initialFilters); setFilters(initialFilters); }}>Xóa lọc</Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead><TableRow>
            <TableCell>Mã / ngày</TableCell><TableCell>Nhà cung cấp</TableCell><TableCell>Hóa đơn</TableCell>
            <TableCell align="right">Tổng nguyên tệ</TableCell><TableCell align="right">Tổng VND</TableCell><TableCell>Trạng thái</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading && items.length === 0 ? <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={32} /></TableCell></TableRow> :
              items.map((item) => <TableRow key={item.id} hover onClick={() => void openDetail(item.id)} sx={{ cursor: 'pointer' }}>
                <TableCell><Typography sx={{ fontWeight: 700 }}>{item.expenseCode}</Typography><Typography variant="caption">{new Date(item.incurredAt).toLocaleDateString('vi-VN')} · {item.lineCount} dòng</Typography></TableCell>
                <TableCell>{item.vendorName}<Typography variant="caption" sx={{ display: 'block' }} color="text.secondary">{item.providerCode}</Typography></TableCell>
                <TableCell>{item.invoiceNumber || '—'}</TableCell>
                <TableCell align="right">{money(item.originalTotal, item.currency)}</TableCell>
                <TableCell align="right">{money(item.totalAmountVnd)}</TableCell>
                <TableCell><Chip size="small" label={STATUS_LABEL[item.status]} color={item.status === 'PAID' ? 'success' : item.status === 'VOID' ? 'default' : item.status === 'CONFIRMED' ? 'primary' : 'warning'} /></TableCell>
              </TableRow>)}
            {!loading && items.length === 0 && <TableRow><TableCell colSpan={6} align="center">Chưa có chứng từ phù hợp.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <TablePagination component="div" count={total} page={filters.page} rowsPerPage={filters.size}
          onPageChange={(_, page) => setFilters({ ...filters, page })}
          onRowsPerPageChange={(event) => setFilters({ ...filters, page: 0, size: Number(event.target.value) })}
          rowsPerPageOptions={[10, 20, 50]} labelRowsPerPage="Số dòng" />
      </TableContainer>

      <ExpenseFormDialog open={formOpen} form={form} setForm={setForm} onClose={() => setFormOpen(false)} onSubmit={submit} saving={saving} editing={detail?.status === 'DRAFT'} />
      <ExpenseDetailDialog detail={detail} saving={saving} onClose={() => setDetail(null)} onEdit={openEdit} onAction={runAction} />
    </Box>
  );
}

function ExpenseFormDialog({ open, form, setForm, onClose, onSubmit, saving, editing }: {
  open: boolean; form: ExpensePayload; setForm: (value: ExpensePayload) => void; onClose: () => void;
  onSubmit: (event: FormEvent) => void; saving: boolean; editing: boolean;
}) {
  const updateLine = (index: number, field: 'categoryCode' | 'description' | 'originalAmount', value: string) => {
    setForm({ ...form, lines: form.lines.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line) });
  };
  const estimatedTotal = form.lines.reduce((sum, line) => sum + Number(line.originalAmount || 0), 0) * Number(form.exchangeRate || 0);

  return <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
    <Box component="form" onSubmit={onSubmit}>
      <DialogTitle>{editing ? 'Sửa chứng từ nháp' : 'Thêm chứng từ chi phí thực tế'}</DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 2 }}>Nhập một lần cho mỗi hóa đơn. Nếu hóa đơn có nhiều dịch vụ, thêm từng dòng thành phần; không tạo nhiều chứng từ cho cùng số hóa đơn.</Alert>
        <Stack sx={{ gap: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
            <TextField required label="Nhà cung cấp" value={form.vendorName} onChange={(event) => setForm({ ...form, vendorName: event.target.value })} fullWidth />
            <TextField label="Mã nhà cung cấp" value={form.providerCode} onChange={(event) => setForm({ ...form, providerCode: event.target.value })} fullWidth />
            <TextField label="Số hóa đơn" value={form.invoiceNumber} onChange={(event) => setForm({ ...form, invoiceNumber: event.target.value })} fullWidth />
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ gap: 2 }}>
            <TextField required label="Ngày phát sinh" type="date" value={form.incurredAt} onChange={(event) => setForm({ ...form, incurredAt: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            <TextField required label="Tiền tệ" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} />
            <TextField required label="Tỷ giá sang VND" type="number" value={form.exchangeRate} onChange={(event) => setForm({ ...form, exchangeRate: event.target.value })} slotProps={{ htmlInput: { min: 0.000001, step: 'any' } }} />
            <TextField label="Tham chiếu chứng từ" value={form.evidenceReference} onChange={(event) => setForm({ ...form, evidenceReference: event.target.value })} fullWidth />
          </Stack>
          <TextField label="Ghi chú chung" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} multiline minRows={2} />
          <Typography variant="subtitle1" sx={{ fontWeight: 750 }}>Các thành phần chi phí</Typography>
          {form.lines.map((line, index) => <Stack direction={{ xs: 'column', md: 'row' }} sx={{ gap: 1 }} key={index}>
            <TextField select label="Loại chi phí" value={line.categoryCode} onChange={(event) => updateLine(index, 'categoryCode', event.target.value as ExpenseCategory)} sx={{ minWidth: 250 }}>
              {EXPENSE_CATEGORIES.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
            </TextField>
            <TextField required label="Mô tả thành phần" value={line.description} onChange={(event) => updateLine(index, 'description', event.target.value)} fullWidth />
            <TextField required label={`Số tiền (${form.currency})`} type="number" value={line.originalAmount} onChange={(event) => updateLine(index, 'originalAmount', event.target.value)} sx={{ minWidth: 190 }} slotProps={{ htmlInput: { min: 0.01, step: 'any' } }} />
            <IconButton aria-label="Xóa dòng" disabled={form.lines.length === 1} onClick={() => setForm({ ...form, lines: form.lines.filter((_, lineIndex) => lineIndex !== index) })}><DeleteOutlineIcon /></IconButton>
          </Stack>)}
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Button startIcon={<AddIcon />} onClick={() => setForm({ ...form, lines: [...form.lines, { categoryCode: 'OTHER_OPERATIONAL', description: '', originalAmount: '' }] })}>Thêm dòng</Button>
            <Typography sx={{ fontWeight: 800 }}>Tổng quy đổi dự kiến: {money(estimatedTotal)}</Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions><Button onClick={onClose}>Hủy</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu nháp'}</Button></DialogActions>
    </Box>
  </Dialog>;
}

function ExpenseDetailDialog({ detail, saving, onClose, onEdit, onAction }: {
  detail: ExpenseDetail | null; saving: boolean; onClose: () => void; onEdit: (detail: ExpenseDetail) => void;
  onAction: (action: 'confirm' | 'paid' | 'void') => void;
}) {
  return <Dialog open={Boolean(detail)} onClose={onClose} fullWidth maxWidth="md">
    {detail && <>
      <DialogTitle><Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}><span>{detail.expenseCode} · {detail.vendorName}</span><Chip label={STATUS_LABEL[detail.status]} /></Stack></DialogTitle>
      <DialogContent dividers>
        <Stack sx={{ gap: 1, mb: 2 }}>
          <Typography>Hóa đơn: <b>{detail.invoiceNumber || '—'}</b> · Ngày phát sinh: <b>{new Date(detail.incurredAt).toLocaleDateString('vi-VN')}</b></Typography>
          <Typography>Nguyên tệ: <b>{money(detail.originalTotal, detail.currency)}</b> · Tỷ giá: <b>{Number(detail.exchangeRate).toLocaleString('vi-VN')}</b></Typography>
          <Typography>Tổng thực tế VND do hệ thống tính: <b>{money(detail.totalAmountVnd)}</b></Typography>
          {detail.evidenceReference && <Typography>Chứng từ: {detail.evidenceReference}</Typography>}
          {detail.voidReason && <Alert severity="warning">Lý do vô hiệu: {detail.voidReason}</Alert>}
        </Stack>
        <Table size="small"><TableHead><TableRow><TableCell>Loại</TableCell><TableCell>Mô tả</TableCell><TableCell align="right">Nguyên tệ</TableCell><TableCell align="right">VND</TableCell></TableRow></TableHead>
          <TableBody>{detail.lines.map((line) => <TableRow key={line.id}><TableCell>{line.categoryCode}</TableCell><TableCell>{line.description}</TableCell><TableCell align="right">{money(line.originalAmount, detail.currency)}</TableCell><TableCell align="right">{money(line.amountVnd)}</TableCell></TableRow>)}</TableBody>
        </Table>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap' }}>
        <Button onClick={onClose}>Đóng</Button>
        {detail.status === 'DRAFT' && <Button startIcon={<EditOutlinedIcon />} onClick={() => onEdit(detail)}>Sửa</Button>}
        {detail.status === 'DRAFT' && <Button variant="contained" onClick={() => onAction('confirm')} disabled={saving}>Xác nhận</Button>}
        {detail.status === 'CONFIRMED' && <Button variant="contained" color="success" onClick={() => onAction('paid')} disabled={saving}>Đánh dấu đã trả</Button>}
        {detail.status !== 'VOID' && <Button color="error" onClick={() => onAction('void')} disabled={saving}>Vô hiệu</Button>}
      </DialogActions>
    </>}
  </Dialog>;
}
