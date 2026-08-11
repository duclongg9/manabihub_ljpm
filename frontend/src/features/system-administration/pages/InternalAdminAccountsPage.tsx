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
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import { getAuthSession } from '../../../shared/auth/authSession';
import { systemAdministrationService } from '../services/systemAdministrationService';
import type {
  InternalAdminAccount,
  InternalAdminInvitationStatus,
  InternalAdminRole,
} from '../types/systemAdministrationTypes';

const ROLE_LABELS: Record<InternalAdminRole, string> = {
  SYSTEM_ADMIN: 'Quản trị hệ thống',
  COURSE_MANAGER: 'Quản lý khóa học',
  FINANCE_MANAGER: 'Quản lý tài chính',
};

const INVITATION_LABELS: Record<
  InternalAdminInvitationStatus,
  { label: string; color: 'default' | 'success' | 'warning' | 'error' }
> = {
  NONE: { label: 'Không có lời mời', color: 'default' },
  PENDING: { label: 'Chờ thiết lập mật khẩu', color: 'warning' },
  EXPIRED: { label: 'Lời mời đã hết hạn', color: 'error' },
  ACCEPTED: { label: 'Đã chấp nhận lời mời', color: 'success' },
  REVOKED: { label: 'Lời mời đã thu hồi', color: 'default' },
};

const ROLES = Object.keys(ROLE_LABELS) as InternalAdminRole[];

interface PendingRoleChange {
  account: InternalAdminAccount;
  role: InternalAdminRole;
}

interface InviteForm {
  email: string;
  fullName: string;
  roleCode: InternalAdminRole;
  reason: string;
}

const EMPTY_INVITE_FORM: InviteForm = {
  email: '',
  fullName: '',
  roleCode: 'COURSE_MANAGER',
  reason: '',
};

export function InternalAdminAccountsPage() {
  const currentAdminId = getAuthSession('admin')?.subject;
  const [accounts, setAccounts] = useState<InternalAdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingRole, setPendingRole] = useState<PendingRoleChange | null>(null);
  const [roleReason, setRoleReason] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>(EMPTY_INVITE_FORM);
  const [resendAccount, setResendAccount] = useState<InternalAdminAccount | null>(null);
  const [resendReason, setResendReason] = useState('');
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

  const replaceAccount = (updated: InternalAdminAccount) => {
    setAccounts((current) => {
      const found = current.some((account) => account.id === updated.id);
      const next = found
        ? current.map((account) => account.id === updated.id ? updated : account)
        : [...current, updated];
      return next.sort((left, right) => left.fullName.localeCompare(right.fullName, 'vi'));
    });
  };

  const submitRoleChange = async () => {
    if (!pendingRole || !roleReason.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await systemAdministrationService.updateInternalAdminRole(
        pendingRole.account.id,
        { roleCode: pendingRole.role, reason: roleReason.trim() },
      );
      replaceAccount(updated);
      setSuccess(
        `Đã đổi vai trò của ${updated.fullName}. Tài khoản này phải đăng nhập lại.`,
      );
      setPendingRole(null);
      setRoleReason('');
    } catch {
      setError('Không thể đổi vai trò. Hãy kiểm tra quyền, trạng thái tài khoản và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const submitInvitation = async () => {
    const normalizedEmail = inviteForm.email.trim().toLowerCase();
    if (
      !normalizedEmail
      || !inviteForm.fullName.trim()
      || inviteForm.reason.trim().length < 5
    ) return;

    setSaving(true);
    setError(null);
    try {
      const invited = await systemAdministrationService.inviteInternalAdmin({
        email: normalizedEmail,
        fullName: inviteForm.fullName.trim(),
        roleCode: inviteForm.roleCode,
        reason: inviteForm.reason.trim(),
      });
      replaceAccount(invited);
      setSuccess(
        `Đã tạo tài khoản cho ${invited.email} và xếp gửi liên kết thiết lập mật khẩu. `
          + 'Mật khẩu không được gửi qua email.',
      );
      setInviteOpen(false);
      setInviteForm(EMPTY_INVITE_FORM);
    } catch {
      setError(
        'Không thể tạo lời mời. Email có thể đã thuộc một tài khoản đang hoạt động '
          + 'hoặc dữ liệu chưa hợp lệ.',
      );
    } finally {
      setSaving(false);
    }
  };

  const submitResend = async () => {
    if (!resendAccount || resendReason.trim().length < 5) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await systemAdministrationService.resendInternalAdminInvitation(
        resendAccount.id,
        { reason: resendReason.trim() },
      );
      replaceAccount(updated);
      setSuccess(
        `Đã thu hồi liên kết cũ và xếp gửi lời mời mới đến ${updated.email}.`,
      );
      setResendAccount(null);
      setResendReason('');
    } catch {
      setError('Không thể gửi lại lời mời cho tài khoản này. Vui lòng tải lại và thử lại.');
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
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <ManageAccountsOutlinedIcon color="primary" />
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Tài khoản nội bộ</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Tạo lời mời, theo dõi kích hoạt và phân một vai trò cho mỗi tài khoản.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddAltOutlinedIcon />}
          onClick={() => setInviteOpen(true)}
        >
          Mời tài khoản
        </Button>
      </Stack>

      <Alert severity="info">
        Người nhận tự đặt mật khẩu qua liên kết một lần. Tài khoản chưa kích hoạt không thể
        đăng nhập; gửi lại lời mời sẽ làm liên kết cũ mất hiệu lực.
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
            const invitationStatus = account.invitationStatus ?? 'NONE';
            const invitation = INVITATION_LABELS[invitationStatus];
            const canResend = account.status === 'DISABLED'
              && !account.email.endsWith('@manabihub.local');

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
                        sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}
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
                        {invitationStatus !== 'NONE' && (
                          <Chip
                            label={invitation.label}
                            size="small"
                            color={invitation.color}
                            variant="outlined"
                          />
                        )}
                      </Stack>
                      <Typography color="text.secondary">{account.email}</Typography>
                      <Typography variant="caption" color="text.secondary" component="div">
                        Đăng nhập gần nhất:{' '}
                        {account.lastLoginAt
                          ? new Date(account.lastLoginAt).toLocaleString('vi-VN')
                          : 'Chưa có'}
                      </Typography>
                      {account.invitationExpiresAt && invitationStatus === 'PENDING' && (
                        <Typography variant="caption" color="text.secondary">
                          Lời mời hết hạn:{' '}
                          {new Date(account.invitationExpiresAt).toLocaleString('vi-VN')}
                        </Typography>
                      )}
                    </Box>

                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.25}
                      sx={{ width: { xs: '100%', md: 'auto' } }}
                    >
                      {canResend && (
                        <Button
                          variant="outlined"
                          startIcon={<SendOutlinedIcon />}
                          onClick={() => {
                            setResendAccount(account);
                            setResendReason('');
                          }}
                        >
                          Gửi lại
                        </Button>
                      )}
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
                              setPendingRole({ account, role });
                              setRoleReason('');
                            }
                          }}
                        >
                          {ROLES.map((role) => (
                            <MenuItem key={role} value={role}>{ROLE_LABELS[role]}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      <Dialog
        open={inviteOpen}
        onClose={() => !saving && setInviteOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Mời tài khoản nội bộ</DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ mt: 0.5 }}>
            <TextField
              autoFocus
              fullWidth
              label="Họ và tên"
              value={inviteForm.fullName}
              onChange={(event) => setInviteForm((current) => ({
                ...current,
                fullName: event.target.value,
              }))}
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <TextField
              fullWidth
              type="email"
              label="Email công việc"
              value={inviteForm.email}
              onChange={(event) => setInviteForm((current) => ({
                ...current,
                email: event.target.value,
              }))}
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <FormControl fullWidth>
              <InputLabel id="invite-role-label">Vai trò</InputLabel>
              <Select
                labelId="invite-role-label"
                label="Vai trò"
                value={inviteForm.roleCode}
                onChange={(event) => setInviteForm((current) => ({
                  ...current,
                  roleCode: event.target.value as InternalAdminRole,
                }))}
              >
                {ROLES.map((role) => (
                  <MenuItem key={role} value={role}>{ROLE_LABELS[role]}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Lý do cấp quyền"
              multiline
              minRows={3}
              value={inviteForm.reason}
              onChange={(event) => setInviteForm((current) => ({
                ...current,
                reason: event.target.value,
              }))}
              helperText="Tối thiểu 5 ký tự; nội dung được lưu trong audit log."
              slotProps={{ htmlInput: { maxLength: 500 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)} disabled={saving}>Hủy</Button>
          <Button
            variant="contained"
            onClick={submitInvitation}
            disabled={
              !inviteForm.email.trim()
              || !inviteForm.fullName.trim()
              || inviteForm.reason.trim().length < 5
              || saving
            }
          >
            {saving ? 'Đang tạo…' : 'Tạo và gửi lời mời'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(resendAccount)}
        onClose={() => !saving && setResendAccount(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Gửi lại lời mời</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 0.5 }}>{resendAccount?.fullName}</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {resendAccount?.email}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Lý do gửi lại"
            multiline
            minRows={3}
            value={resendReason}
            onChange={(event) => setResendReason(event.target.value)}
            helperText="Liên kết đang còn hiệu lực (nếu có) sẽ bị thu hồi."
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResendAccount(null)} disabled={saving}>Hủy</Button>
          <Button
            variant="contained"
            onClick={submitResend}
            disabled={resendReason.trim().length < 5 || saving}
          >
            {saving ? 'Đang gửi…' : 'Thu hồi link cũ và gửi lại'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pendingRole)}
        onClose={() => !saving && setPendingRole(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Xác nhận đổi vai trò</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 0.5 }}>{pendingRole?.account.fullName}</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {pendingRole
              ? `${ROLE_LABELS[pendingRole.account.role]} → ${ROLE_LABELS[pendingRole.role]}`
              : ''}
          </Typography>
          <TextField
            autoFocus
            fullWidth
            label="Lý do thay đổi"
            multiline
            minRows={3}
            value={roleReason}
            onChange={(event) => setRoleReason(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 500 } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingRole(null)} disabled={saving}>Hủy</Button>
          <Button
            variant="contained"
            onClick={submitRoleChange}
            disabled={!roleReason.trim() || saving}
          >
            {saving ? 'Đang cập nhật…' : 'Đổi vai trò'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
