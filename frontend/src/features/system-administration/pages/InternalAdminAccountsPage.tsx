import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import { getAuthSession } from '../../../shared/auth/authSession';
import { systemAdministrationService } from '../services/systemAdministrationService';
import type {
  InternalAdminAccount,
  InternalAdminRole,
} from '../types/systemAdministrationTypes';

const ROLE_LABELS: Record<InternalAdminRole, string> = {
  SYSTEM_ADMIN: 'Quản trị hệ thống',
  COURSE_MANAGER: 'Quản lý khóa học',
  FINANCE_MANAGER: 'Quản lý tài chính',
};

const ROLES = Object.keys(ROLE_LABELS) as InternalAdminRole[];

interface PendingRoleChange {
  account: InternalAdminAccount;
  role: InternalAdminRole;
}

export function InternalAdminAccountsPage() {
  const currentAdminId = getAuthSession('admin')?.subject;
  const [accounts, setAccounts] = useState<InternalAdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingRoleChange | null>(null);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAccounts(await systemAdministrationService.listInternalAdmins());
    } catch {
      setError('Không thể tải danh sách quản trị viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const submitRoleChange = async () => {
    if (!pending || !reason.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await systemAdministrationService.updateInternalAdminRole(
        pending.account.id,
        { roleCode: pending.role, reason: reason.trim() },
      );
      setAccounts((current) =>
        current.map((account) => account.id === updated.id ? updated : account),
      );
      setSuccess(
        `Đã đổi vai trò của ${updated.fullName}. Tài khoản này phải đăng nhập lại.`,
      );
      setPending(null);
      setReason('');
    } catch {
      setError('Không thể đổi vai trò. Hãy kiểm tra quyền, trạng thái tài khoản và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
        <CircularProgress aria-label="Đang tải quản trị viên" />
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <ManageAccountsOutlinedIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Phân quyền nội bộ</Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Mỗi tài khoản có đúng một vai trò nội bộ; mật khẩu không bao giờ được trả về.
        </Typography>
      </Box>

      <Alert severity="info">
        Đổi vai trò có hiệu lực ngay ở backend. JWT cũ sẽ bị từ chối và người dùng phải
        đăng nhập lại.
      </Alert>
      {error && (
        <Alert severity="error" action={<Button color="inherit" onClick={loadAccounts}>Thử lại</Button>}>
          {error}
        </Alert>
      )}
      {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}

      {accounts.length === 0 ? (
        <Alert severity="warning">Chưa có tài khoản quản trị nội bộ.</Alert>
      ) : (
        <Stack spacing={2}>
          {accounts.map((account) => {
            const isCurrentAccount = account.id === currentAdminId;
            return (
              <Card key={account.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    spacing={2}
                    sx={{ alignItems: { md: 'center' } }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ alignItems: 'center', flexWrap: 'wrap' }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 750 }}>
                          {account.fullName}
                        </Typography>
                        {isCurrentAccount && <Chip label="Tài khoản của bạn" size="small" />}
                        <Chip
                          label={account.status}
                          size="small"
                          color={account.status === 'ACTIVE' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Stack>
                      <Typography color="text.secondary">{account.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Đăng nhập gần nhất:{' '}
                        {account.lastLoginAt
                          ? new Date(account.lastLoginAt).toLocaleString('vi-VN')
                          : 'Chưa có'}
                      </Typography>
                    </Box>

                    <FormControl sx={{ width: { xs: '100%', md: 260 } }}>
                      <InputLabel id={`role-${account.id}`}>Vai trò</InputLabel>
                      <Select
                        labelId={`role-${account.id}`}
                        label="Vai trò"
                        value={account.role}
                        disabled={isCurrentAccount || account.status !== 'ACTIVE'}
                        onChange={(event) => {
                          const role = event.target.value as InternalAdminRole;
                          if (role !== account.role) {
                            setPending({ account, role });
                            setReason('');
                          }
                        }}
                      >
                        {ROLES.map((role) => (
                          <MenuItem key={role} value={role}>{ROLE_LABELS[role]}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <Dialog
        open={Boolean(pending)}
        onClose={() => !saving && setPending(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Xác nhận đổi vai trò</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 0.5 }}>
            {pending?.account.fullName}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {pending ? `${ROLE_LABELS[pending.account.role]} → ${ROLE_LABELS[pending.role]}` : ''}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Lý do thay đổi"
            multiline
            minRows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPending(null)} disabled={saving}>Hủy</Button>
          <Button
            variant="contained"
            onClick={submitRoleChange}
            disabled={!reason.trim() || saving}
          >
            {saving ? 'Đang cập nhật…' : 'Đổi vai trò'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
