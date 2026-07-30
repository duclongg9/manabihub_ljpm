import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import type { AuditLogFilterParams } from '../api/adminAuditApi';
import { adminAuditApi } from '../api/adminAuditApi';
import { AdminAuditLogDetailPage } from './AdminAuditLogDetailPage';
import { getAuthSession, hasAnyRole } from '../../../shared/auth/authSession';
import { ROLES } from '../../../shared/constants/roles';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../../shared/constants/routes';

export const AdminAuditLogPage: React.FC = () => {
  const session = getAuthSession('admin');
  const isSystemAdmin = session ? hasAnyRole(session, [ROLES.SYSTEM_ADMIN]) : false;

  const [filterParams, setFilterParams] = useState<AuditLogFilterParams>({
    page: 0,
    size: 10,
  });

  const [filterDraft, setFilterDraft] = useState<AuditLogFilterParams>({
    page: 0,
    size: 10,
  });

  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', filterParams],
    queryFn: () => adminAuditApi.getAuditLogs(filterParams),
    enabled: isSystemAdmin,
  });

  if (!isSystemAdmin) {
    return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />;
  }

  const handleApplyFilter = () => {
    setFilterParams({ ...filterDraft, page: 0 });
  };

  const handleClearFilter = () => {
    const emptyFilters = { page: 0, size: filterDraft.size };
    setFilterDraft(emptyFilters);
    setFilterParams(emptyFilters);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Nhật ký hệ thống (Audit Logs)
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                label="Người thực hiện (Tên/Email/ID)"
                value={filterDraft.actor || ''}
                onChange={(e) => setFilterDraft({ ...filterDraft, actor: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Vai trò (Role)"
                value={filterDraft.role || ''}
                onChange={(e) => setFilterDraft({ ...filterDraft, role: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Loại đối tượng"
                value={filterDraft.targetType || ''}
                onChange={(e) => setFilterDraft({ ...filterDraft, targetType: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Hành động"
                value={filterDraft.action || ''}
                onChange={(e) => setFilterDraft({ ...filterDraft, action: e.target.value })}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleApplyFilter} fullWidth>
                Lọc
              </Button>
              <Button variant="outlined" onClick={handleClearFilter} fullWidth>
                Xóa lọc
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>Không thể tải nhật ký. {(error as any)?.message}</Alert>}

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Thời gian</TableCell>
                <TableCell>Người thực hiện</TableCell>
                <TableCell>Vai trò</TableCell>
                <TableCell>Hành động</TableCell>
                <TableCell>Đối tượng</TableCell>
                <TableCell align="right">Chi tiết</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={30} />
                  </TableCell>
                </TableRow>
              ) : data?.content.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    Không tìm thấy kết quả phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                data?.content.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{new Date(log.createdAt).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>
                      {log.actorDisplayName ? (
                        <>
                          <Typography variant="body2">{log.actorDisplayName}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {log.actorEmail}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="textSecondary">
                          {log.actorUserId || log.actorAdminId || 'Hệ thống'}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.actorRoleCode && <Chip size="small" label={log.actorRoleCode} />}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" color="primary" label={log.action} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.targetType}</Typography>
                      {log.targetId && (
                        <Typography variant="caption" color="textSecondary">
                          {log.targetId.substring(0, 8)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => setSelectedAuditId(log.id)}>
                        Xem
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data?.totalElements || 0}
          page={filterParams.page || 0}
          onPageChange={(_, newPage) => setFilterParams({ ...filterParams, page: newPage })}
          rowsPerPage={filterParams.size || 10}
          onRowsPerPageChange={(e) =>
            setFilterParams({ ...filterParams, size: parseInt(e.target.value, 10), page: 0 })
          }
          rowsPerPageOptions={[10, 20, 50]}
        />
      </Card>

      <Dialog
        open={!!selectedAuditId}
        onClose={() => setSelectedAuditId(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết nhật ký</DialogTitle>
        <DialogContent dividers>
          {selectedAuditId && <AdminAuditLogDetailPage id={selectedAuditId} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedAuditId(null)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
