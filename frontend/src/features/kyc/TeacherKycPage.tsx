import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  FormControlLabel,
  IconButton,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import BadgeIcon from '@mui/icons-material/Badge';
import CloseIcon from '@mui/icons-material/Close';
import GppGoodIcon from '@mui/icons-material/GppGood';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SchoolIcon from '@mui/icons-material/School';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import React, { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  getTeacherKycStatus,
  restartTeacherVerification,
  submitTeacherCertificate,
  verifyTeacherIdentity,
  type ApiEnvelope,
  type KycCertificateSubmissionResponse,
  type KycIdentityVerificationResponse,
  type KycModuleStatusResponse,
  type KycRestartVerificationResponse,
  type KycStatusResponse,
} from './teacherKycApi';
import { launchVnptIdentitySdk } from './vnptIdentitySdk';

const KYC_COLORS = {
  primaryTint: '#EEF2FF',
  primaryBorder: '#C7D2FE',
  surfaceMuted: '#F8FAFC',
  sdkShell: '#0F172A',
};

type CertificateErrors = Partial<Record<'certificate' | 'certificateCode' | 'agreement', string>>;
type IdentitySummary = {
  fullName?: string;
  idNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  hasData: boolean;
};
type IdentityDiagnostics = {
  providerStatus?: string;
  failureReasons: string[];
  validationHints: string[];
  hasData: boolean;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const CERTIFICATE_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

class TeacherKycErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          Đã xảy ra lỗi giao diện khi tải màn hình này. Vui lòng thử tải lại trang hoặc liên hệ hỗ trợ.
          <br />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            {this.state.error?.message}
          </Typography>
        </Alert>
      );
    }
    return this.props.children;
  }
}

export function TeacherKycPage() {
  return (
    <TeacherKycErrorBoundary>
      <TeacherKycPageContent />
    </TeacherKycErrorBoundary>
  );
}

function TeacherKycPageContent() {
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateCode, setCertificateCode] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [errors, setErrors] = useState<CertificateErrors>({});
  const [status, setStatus] = useState<KycStatusResponse | null>(null);
  const [identityEnvelope, setIdentityEnvelope] = useState<ApiEnvelope<KycIdentityVerificationResponse> | null>(null);
  const [certificateEnvelope, setCertificateEnvelope] = useState<ApiEnvelope<KycCertificateSubmissionResponse> | null>(null);
  const [restartEnvelope, setRestartEnvelope] = useState<ApiEnvelope<KycRestartVerificationResponse> | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [identityLaunching, setIdentityLaunching] = useState(false);
  const [certificateSubmitting, setCertificateSubmitting] = useState(false);
  const [restartSubmitting, setRestartSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    refreshStatus().finally(() => setLoadingStatus(false));
  }, []);

  const identityStatus = status?.identityVerification ?? fallbackIdentityStatus();
  const certificateStatus = status?.certificateVerification ?? fallbackCertificateStatus();
  const latestRequest = restartEnvelope?.data.request ?? certificateEnvelope?.data.request ?? identityEnvelope?.data.request ?? status?.latestRequest ?? null;
  const identityVerified = identityStatus.status === 'VERIFIED';
  const identitySummary = useMemo(() => extractIdentitySummary(latestRequest?.verificationPayload), [latestRequest?.verificationPayload]);
  const identityDiagnostics = useMemo(() => extractIdentityDiagnostics(latestRequest?.verificationPayload), [latestRequest?.verificationPayload]);
  
  const showRestartVerification = Boolean(status && ['REJECTED', 'CORRECTION_REQUIRED'].includes(status.teacherKycStatus));
  const canRestartVerification = showRestartVerification && !restartSubmitting && !identityLaunching && !certificateSubmitting;
  
  const hasNetworkError = Boolean(pageError);
  const canStartIdentity =
    !identityLaunching
    && !hasNetworkError
    && status?.teacherKycStatus !== 'APPROVED'
    && certificateStatus.status !== 'PENDING_REVIEW'
    && (identityStatus.canInteract || ['NOT_STARTED', 'FAILED'].includes(identityStatus.status));
  const canSubmitCertificate = identityVerified && certificateStatus.canInteract && !certificateSubmitting;

  async function refreshStatus() {
    try {
      setPageError(null);
      const response = await getTeacherKycStatus();
      setStatus(response);
    } catch (error) {
      setPageError(readErrorMessage(error));
    }
  }

  function clearVnptSdkContainer() {
    document.getElementById('ekyc_sdk_intergrated')?.replaceChildren();
  }

  function handleCloseIdentityDialog() {
    setIdentityLaunching(false);
    clearVnptSdkContainer();
    void refreshStatus();
  }

  async function handleStartIdentity() {
    setPageError(null);
    setIdentityEnvelope(null);
    clearVnptSdkContainer();
    setIdentityLaunching(true);

    // Wait for the Dialog to mount its DOM elements before launching SDK
    setTimeout(async () => {
      try {
        clearVnptSdkContainer();
        await launchVnptIdentitySdk(async (result) => {
          try {
            const response = await verifyTeacherIdentity(result);
            setIdentityEnvelope(response);
            await refreshStatus();
          } catch (error) {
            setPageError(readErrorMessage(error));
          }
        });
      } catch (error) {
        setPageError(readErrorMessage(error));
        setIdentityLaunching(false);
      }
    }, 100);
  }

  async function handleRestartVerification() {
    setPageError(null);
    setIdentityEnvelope(null);
    setCertificateEnvelope(null);
    setRestartEnvelope(null);
    setRestartSubmitting(true);

    try {
      const response = await restartTeacherVerification();
      setRestartEnvelope(response);
      setCertificateFile(null);
      setCertificateCode('');
      setAgreementAccepted(false);
      setErrors({});
      await refreshStatus();
    } catch (error) {
      setPageError(readErrorMessage(error));
    } finally {
      setRestartSubmitting(false);
    }
  }

  function handleCertificateChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setCertificateFile(file);
    setErrors((current) => ({ ...current, certificate: undefined }));
    setCertificateEnvelope(null);
  }

  async function handleCertificateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError(null);
    setCertificateEnvelope(null);

    const nextErrors = validateCertificateForm(certificateFile, certificateCode, agreementAccepted);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setCertificateSubmitting(true);

    try {
      const response = await submitTeacherCertificate({
        certificate: certificateFile as File,
        certificateCode,
        copyrightAgreementAccepted: agreementAccepted,
      });
      setCertificateEnvelope(response);
      await refreshStatus();
    } catch (error) {
      setPageError(readErrorMessage(error));
    } finally {
      setCertificateSubmitting(false);
    }
  }

  const activeStep = useMemo(() => {
    if (certificateStatus.status === 'PENDING_REVIEW' || certificateStatus.status === 'APPROVED') return 2;
    if (identityVerified) return 1;
    return 0;
  }, [identityVerified, certificateStatus.status]);

  const steps = ['Xác minh danh tính', 'Cung cấp chứng chỉ', 'Hoàn tất'];

  return (
    <Stack spacing={3}>
      {/* Page header */}
      <Paper
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          p: { xs: 2.5, md: 3.5 },
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography component="h2" sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 800, mt: 0.5 }}>
              Xác minh giáo viên
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 720, mt: 1, fontSize: 15, lineHeight: 1.6 }}>
              Để trở thành giáo viên, vui lòng hoàn tất 2 bước: Xác minh danh tính và Cung cấp chứng chỉ chuyên môn.
              Quá trình này giúp bảo vệ tài khoản và chứng thực chuyên môn của bạn trên hệ thống.
            </Typography>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ alignItems: { sm: 'center' }, flexShrink: 0 }}>
            <StatusChip status={status?.teacherKycStatus ?? 'UNKNOWN'} label={status?.teacherKycStatusLabel ?? 'Đang tải...'} />
            {showRestartVerification && (
              <Button
                disabled={!canRestartVerification}
                onClick={handleRestartVerification}
                startIcon={<RestartAltIcon />}
                variant="outlined"
                sx={{
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': { borderColor: 'primary.dark', bgcolor: KYC_COLORS.primaryTint },
                }}
              >
                {restartSubmitting ? 'Đang tạo lượt mới...' : 'Xác thực lại từ đầu'}
              </Button>
            )}
          </Stack>
        </Stack>
      </Paper>

      {/* Loading and error states */}
      {loadingStatus && !pageError && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress color="primary" size={32} />
          <Typography sx={{ ml: 2, color: 'text.secondary' }}>Đang tải thông tin xác minh...</Typography>
        </Box>
      )}
      {pageError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => { setPageError(null); refreshStatus(); }}>
              Thử lại
            </Button>
          }
        >
          {pageError === 'Network Error' ? 'Lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.' : pageError}
        </Alert>
      )}

      {/* Progress stepper */}
      <Box sx={{ py: 1 }}>
        <Stepper
          activeStep={activeStep}
          alternativeLabel
          sx={{
            '& .MuiStepIcon-root.Mui-active': { color: 'primary.main' },
            '& .MuiStepIcon-root.Mui-completed': { color: 'primary.main' },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Contextual alerts */}
      {identityEnvelope && (
        <Alert severity={identityEnvelope.data.identityVerification.status === 'VERIFIED' ? 'success' : 'warning'} icon={<VerifiedUserIcon />}>
          {identityEnvelope.data.identityVerification.statusLabel}
        </Alert>
      )}
      {certificateEnvelope && (
        <Alert severity="success" icon={<AssignmentTurnedInIcon />}>
          Chứng chỉ đã được ghi nhận và chuyển sang bước kiểm tra.
        </Alert>
      )}
      {restartEnvelope && (
        <Alert severity="success" icon={<RestartAltIcon />}>
          Đã tạo lượt xác thực mới. Bạn có thể bắt đầu lại từ Bước 1.
        </Alert>
      )}

      {/* Identity step */}
      <Stack spacing={3}>
        <ModuleCard
          icon={identityVerified ? <VerifiedUserIcon sx={{ color: 'primary.main' }} /> : <BadgeIcon sx={{ color: 'primary.main' }} />}
          index="Bước 1"
          status={identityStatus}
          title="Xác minh danh tính"
        >
          <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1, lineHeight: 1.6 }}>
            Chuẩn bị CCCD gốc, cho phép camera và làm theo hướng dẫn trên màn hình.
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 1, fontStyle: 'italic' }}>
            Lưu ý: Màn hình chụp ảnh bảo mật sẽ hiển thị ở chế độ nền tối. Vui lòng chuẩn bị CCCD và ngồi ở nơi đủ ánh sáng.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
            <Button
              disabled={!canStartIdentity}
              onClick={handleStartIdentity}
              startIcon={identityStatus.status === 'FAILED' ? <RefreshIcon /> : <GppGoodIcon />}
              variant="contained"
              sx={{
                bgcolor: 'primary.main',
                '&:hover': { bgcolor: 'primary.dark' },
                '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
              }}
            >
              {identityLaunching ? 'Đang mở xác thực...' : identityStatus.status === 'FAILED' ? 'Thực hiện lại' : 'Bắt đầu xác minh danh tính'}
            </Button>
          </Stack>
          {identityStatus.status === 'FAILED' && <IdentityFailureDiagnosticsCard diagnostics={identityDiagnostics} />}
          {identityVerified && <IdentityOcrSummaryCard summary={identitySummary} />}
        </ModuleCard>

        {/* Certificate step */}
        {!identityVerified ? (
          /* Collapsed/locked Module 2 */
          <Card
            variant="outlined"
            sx={{
              opacity: 0.6,
              borderStyle: 'dashed',
              borderColor: 'grey.300',
            }}
          >
            <CardContent sx={{ p: { xs: 2, md: 2.5 }, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <LockIcon color="disabled" />
                <Box>
                  <Typography sx={{ color: 'text.disabled', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    Bước 2
                  </Typography>
                  <Typography component="h3" sx={{ fontSize: 18, fontWeight: 700, color: 'text.disabled' }}>
                    Cung cấp chứng chỉ chuyên môn (Khóa)
                  </Typography>
                </Box>
              </Stack>
              <Typography sx={{ color: 'text.disabled', fontSize: 13, mt: 1 }}>
                Hoàn tất xác minh danh tính trước khi nộp chứng chỉ.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box component="form" onSubmit={handleCertificateSubmit}>
            <Stack spacing={3}>
              <ModuleCard
                icon={<SchoolIcon sx={{ color: 'primary.main' }} />}
                index="Bước 2"
                status={certificateStatus}
                title="Cung cấp chứng chỉ chuyên môn"
              >
                <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                  Vui lòng tải lên chứng chỉ (JLPT / J-Test / NAT-TEST) và nhập mã chứng chỉ.
                  Hệ thống sẽ tự động kiểm tra tính hợp lệ dựa trên thông tin đã xác minh ở Bước 1.
                </Typography>

                <Paper elevation={0} sx={{ bgcolor: KYC_COLORS.surfaceMuted, border: '1px solid', borderColor: errors.certificate ? 'error.light' : KYC_COLORS.primaryBorder, borderRadius: 2, mt: 2, p: 2 }}>
                  <Stack spacing={1.25}>
                    <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Chứng chỉ chuyên môn</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Ảnh hoặc PDF, tối đa 5MB.</Typography>
                    <Button
                      component="label"
                      disabled={!canSubmitCertificate}
                      startIcon={<UploadFileIcon />}
                      variant="outlined"
                      sx={{ borderColor: 'primary.main', color: 'primary.main', '&:hover': { borderColor: 'primary.dark', bgcolor: KYC_COLORS.primaryTint } }}
                    >
                      Tải chứng chỉ
                      <input hidden accept="image/jpeg,image/png,application/pdf" type="file" onChange={handleCertificateChange} />
                    </Button>
                    {certificateFile && (
                      <Typography sx={{ color: 'primary.main', fontSize: 13, fontWeight: 700, overflowWrap: 'anywhere' }}>
                        {certificateFile.name}
                      </Typography>
                    )}
                    {errors.certificate && <FieldError>{errors.certificate}</FieldError>}
                  </Stack>
                </Paper>

                <TextField
                  fullWidth
                  disabled={!canSubmitCertificate}
                  error={Boolean(errors.certificateCode)}
                  helperText={errors.certificateCode}
                  label="Mã chứng chỉ"
                  placeholder="Nhập mã số ghi trên chứng chỉ"
                  margin="normal"
                  required
                  value={certificateCode}
                  sx={{
                    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                    '& .MuiInputLabel-root.Mui-focused': { color: 'primary.main' },
                  }}
                  onChange={(event) => {
                    setCertificateCode(event.target.value);
                    setErrors((current) => ({ ...current, certificateCode: undefined }));
                  }}
                />
              </ModuleCard>

              <Card variant="outlined">
                <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <AssignmentTurnedInIcon sx={{ color: 'primary.main' }} />
                      <Box>
                        <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                          Cam kết bản quyền
                        </Typography>
                        <Typography component="h3" sx={{ fontSize: 20, fontWeight: 800 }}>
                          Thỏa thuận trách nhiệm bản quyền nội dung số
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                      Cam kết này áp dụng cho toàn bộ vai trò Giáo viên và các sản phẩm bạn tạo trên nền tảng.
                    </Typography>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={agreementAccepted}
                          disabled={!canSubmitCertificate}
                          onChange={(event) => {
                            setAgreementAccepted(event.target.checked);
                            setErrors((current) => ({ ...current, agreement: undefined }));
                          }}
                          sx={{ '&.Mui-checked': { color: 'primary.main' } }}
                        />
                      }
                      label="Tôi chấp nhận Thỏa thuận trách nhiệm bản quyền nội dung số và điều khoản dịch vụ của nền tảng."
                      sx={{ alignItems: 'flex-start' }}
                    />
                    {errors.agreement && <FieldError>{errors.agreement}</FieldError>}
                  </Stack>
                </CardContent>
              </Card>

              <Button
                disabled={!canSubmitCertificate}
                fullWidth
                size="large"
                sx={{
                  py: 1.5,
                  fontWeight: 800,
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  '&.Mui-disabled': { bgcolor: 'action.disabledBackground', color: 'action.disabled' },
                }}
                type="submit"
                variant="contained"
              >
                {certificateSubmitting ? 'Đang nộp chứng chỉ...' : 'Nộp chứng chỉ'}
              </Button>
            </Stack>
          </Box>
        )}
      </Stack>

      {/* VNPT SDK dialog */}
      <Dialog 
        open={identityLaunching} 
        maxWidth="md" 
        fullWidth 
        keepMounted
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') {
            handleCloseIdentityDialog();
          }
        }}
        sx={{
          '& .MuiDialog-paper': {
            bgcolor: KYC_COLORS.sdkShell,
            height: '90vh',
            p: 0,
            m: 2,
            position: 'relative',
            borderRadius: 2,
          },
        }}
      >
        {/* Keep the close button above SDK controls. */}
        <IconButton
          aria-label="Đóng xác minh VNPT"
          onClick={handleCloseIdentityDialog}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 9999,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
            width: 40,
            height: 40,
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            id="ekyc_sdk_intergrated"
            sx={{ 
              flexGrow: 1, 
              width: '100%', 
              position: 'relative',
              /* Push SDK language dropdown away from close button */
              '& select, & [class*="language"], & [class*="lang"]': {
                marginRight: '48px !important',
              },
              '& video': {
                objectFit: 'cover',
                width: '100% !important',
                height: '100% !important',
                maxWidth: 'none !important',
              },
            }}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

/* Reusable components */

function ModuleCard({
  children,
  icon,
  index,
  status,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  index: string;
  status: KycModuleStatusResponse;
  title: string;
}) {
  return (
    <Card variant="outlined" sx={{ borderColor: KYC_COLORS.primaryBorder, borderRadius: 2 }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', mb: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            {icon}
            <Box>
              <Typography sx={{ color: 'primary.main', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {index}
              </Typography>
              <Typography component="h3" sx={{ fontSize: 20, fontWeight: 800 }}>
                {title}
              </Typography>
            </Box>
          </Stack>
          <StatusChip status={status.status} label={status.statusLabel} />
        </Stack>
        {status.detail && (
          <Typography sx={{ color: 'text.secondary', fontSize: 14, mb: 2 }}>
            {status.detail}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

function FieldError({ children }: { children: string }) {
  return <Typography sx={{ color: 'error.main', fontSize: 13, fontWeight: 700 }}>{children}</Typography>;
}

function StatusChip({ status, label }: { status: string; label: string }) {
  return <Chip color={statusChipColor(status)} label={label} sx={{ fontWeight: 800, borderRadius: 1.5 }} />;
}

function IdentityOcrSummaryCard({ summary }: { summary: IdentitySummary }) {
  return (
    <Paper elevation={0} sx={{ bgcolor: KYC_COLORS.surfaceMuted, border: '1px solid', borderColor: KYC_COLORS.primaryBorder, borderRadius: 2, mt: 2, p: 2 }}>
      <Stack spacing={1.5}>
        <Typography sx={{ fontSize: 14, fontWeight: 800 }}>Thông tin đã xác minh từ CCCD</Typography>
        {summary.hasData ? (
          <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' } }}>
            <SummaryField label="Họ và tên" value={summary.fullName} />
            <SummaryField label="Số CCCD" value={summary.idNumber} />
            <SummaryField label="Ngày sinh" value={summary.dateOfBirth} />
            <SummaryField label="Giới tính" value={summary.gender} />
            <SummaryField label="Nơi thường trú" value={summary.address} wide />
          </Box>
        ) : (
          <Alert severity="warning">
            Hệ thống chưa nhận được đủ dữ liệu từ giấy tờ tùy thân.
            Bạn có thể bấm "Xác thực lại từ đầu" để thử lại.
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}

function IdentityFailureDiagnosticsCard({ diagnostics }: { diagnostics: IdentityDiagnostics }) {
  if (!diagnostics.hasData) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Hệ thống chưa nhận được kết quả xác minh. Vui lòng đóng cửa sổ và thực hiện lại.
      </Alert>
    );
  }

  return (
    <Paper elevation={0} sx={{ bgcolor: 'rgba(211, 47, 47, 0.04)', border: '1px solid', borderColor: 'error.light', borderRadius: 2, mt: 2, p: 2 }}>
      <Stack spacing={1.25}>
        <Typography sx={{ color: 'error.dark', fontSize: 14, fontWeight: 800 }}>
          Nguyên nhân chưa xác minh thành công
        </Typography>
        {diagnostics.providerStatus && <SummaryField label="Trạng thái" value={diagnostics.providerStatus} />}
        {diagnostics.failureReasons.length > 0 && (
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {diagnostics.failureReasons.map((reason) => (
              <Typography component="li" key={reason} sx={{ color: 'error.dark', fontSize: 14 }}>
                {reason}
              </Typography>
            ))}
          </Box>
        )}
        {diagnostics.validationHints.length > 0 && (
          <Collapse in>
            <Box>
              <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Chi tiết kỹ thuật
              </Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                {diagnostics.validationHints.join(' | ')}
              </Typography>
            </Box>
          </Collapse>
        )}
      </Stack>
    </Paper>
  );
}

function SummaryField({ label, value, wide = false }: { label: string; value?: string; wide?: boolean }) {
  return (
    <Box sx={{ minWidth: 0, gridColumn: { sm: wide ? '1 / -1' : 'auto' } }}>
      <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 800, overflowWrap: 'anywhere' }}>{value || 'N/A'}</Typography>
    </Box>
  );
}

function statusChipColor(status: string): 'default' | 'success' | 'warning' | 'error' {
  if (['APPROVED', 'VERIFIED'].includes(status)) {
    return 'success';
  }

  if (['PENDING', 'PENDING_REVIEW', 'PROCESSING'].includes(status)) {
    return 'warning';
  }

  if (['REJECTED', 'CORRECTION_REQUIRED', 'FAILED'].includes(status)) {
    return 'error';
  }

  return 'default';
}

function validateCertificateForm(certificateFile: File | null, certificateCode: string, agreementAccepted: boolean) {
  const nextErrors: CertificateErrors = {};

  if (!certificateFile) {
    nextErrors.certificate = 'Vui lòng tải lên chứng chỉ chuyên môn (JLPT / J-Test / NAT-TEST).';
  } else if (certificateFile.size > MAX_FILE_SIZE) {
    nextErrors.certificate = 'Chứng chỉ không được vượt quá 5MB.';
  } else if (certificateFile.type && !CERTIFICATE_TYPES.has(certificateFile.type)) {
    nextErrors.certificate = 'Chỉ chấp nhận định dạng JPG, PNG hoặc PDF.';
  }

  if (!certificateCode.trim()) {
    nextErrors.certificateCode = 'Vui lòng nhập mã chứng chỉ.';
  }

  if (!agreementAccepted) {
    nextErrors.agreement = 'Vui lòng đọc và chấp nhận Thỏa thuận bản quyền nội dung số.';
  }

  return nextErrors;
}

function extractIdentitySummary(payload?: Record<string, unknown> | null): IdentitySummary {
  const entries = flattenPayloadEntries(payload);
  const rawDob = findPayloadValue(entries, ['dateOfBirth', 'birthDate', 'birthday', 'dob', 'ngaySinh']);
  const summary = {
    fullName: findPayloadValue(entries, ['fullName', 'full_name', 'hoTen', 'ho_ten', 'customerName', 'name']),
    idNumber: findPayloadValue(entries, ['idNumber', 'idNo', 'identityNumber', 'documentNumber', 'cardNumber', 'soCccd', 'cccd', 'id']),
    dateOfBirth: formatDateOfBirth(rawDob),
    gender: findPayloadValue(entries, ['gender', 'sex', 'gioiTinh']),
    address: findPayloadValue(entries, ['address', 'residentAddress', 'permanentAddress', 'noiThuongTru', 'thuongTru']),
  };

  return {
    ...summary,
    hasData: Object.values(summary).some(Boolean),
  };
}

/** Normalize raw OCR date formats to dd/MM/yyyy for display */
function formatDateOfBirth(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();

  // Format: ddMMyyyy (8 digits, no separator) → dd/MM/yyyy
  if (/^\d{8}$/.test(trimmed)) {
    return `${trimmed.slice(0, 2)}/${trimmed.slice(2, 4)}/${trimmed.slice(4)}`;
  }

  // Format: yyyy-MM-dd → dd/MM/yyyy
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }

  // Already dd/MM/yyyy or other format → keep as-is
  return trimmed;
}

function extractIdentityDiagnostics(payload?: Record<string, unknown> | null): IdentityDiagnostics {
  const entries = flattenPayloadEntries(payload);
  const providerStatus = findPayloadValue(entries, ['providerStatus']);
  const failureReasons = extractStringList(findRawPayloadValue(entries, ['failureReasons'])).map(localizeIdentityFailureReason);
  const validationHints = uniqueStrings(
    entries
      .map((entry) => toDisplayValue(entry.value))
      .filter((value): value is string => Boolean(value))
      .filter((value) => isVnptValidationHint(value))
      .map((value) => value.trim()),
  ).slice(0, 6);

  return {
    providerStatus,
    failureReasons,
    validationHints,
    hasData: Boolean(providerStatus) || failureReasons.length > 0 || validationHints.length > 0,
  };
}

function flattenPayloadEntries(value: unknown) {
  const entries: Array<{ path: string; key: string; value: unknown }> = [];

  function visit(current: unknown, path: string, depth: number) {
    if (current == null || depth > 8) {
      return;
    }

    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}.${index}`, depth + 1));
      return;
    }

    if (typeof current === 'object') {
      Object.entries(current as Record<string, unknown>).forEach(([key, nestedValue]) => {
        const nextPath = path ? `${path}.${key}` : key;
        entries.push({ path: nextPath, key, value: nestedValue });
        visit(nestedValue, nextPath, depth + 1);
      });
    }
  }

  visit(value, '', 0);
  return entries;
}

function findRawPayloadValue(entries: Array<{ path: string; key: string; value: unknown }>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizePayloadKey);
  return entries.find((entry) => normalizedAliases.includes(normalizePayloadKey(entry.key)))?.value;
}

function findPayloadValue(entries: Array<{ path: string; key: string; value: unknown }>, aliases: string[]) {
  const normalizedAliases = aliases.map(normalizePayloadKey);
  const exact = entries.find((entry) => normalizedAliases.includes(normalizePayloadKey(entry.key)));
  const relaxed = exact ?? entries.find((entry) => {
    const normalizedPath = normalizePayloadKey(entry.path);
    return normalizedAliases.some((alias) => alias.length > 2 && normalizedPath.endsWith(alias));
  });

  return toDisplayValue(relaxed?.value);
}

function extractStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(toDisplayValue).filter((item): item is string => Boolean(item));
  }

  const scalar = toDisplayValue(value);
  return scalar ? [scalar] : [];
}

function localizeIdentityFailureReason(reason: string) {
  const normalized = normalizePayloadKey(reason);

  if (normalized.includes('invaliddocument') || normalized.includes('mismatch') || normalized.includes('nullresult')) {
    return 'Giấy tờ không hợp lệ hoặc mặt trước/sau không cùng loại.';
  }

  if (normalized.includes('ocr') && normalized.includes('cccd')) {
    return 'Chưa đọc được đầy đủ số CCCD và họ tên từ ảnh.';
  }

  if (normalized.includes('liveness') || normalized.includes('facecompare')) {
    return 'Chưa xác nhận được khuôn mặt khớp với ảnh trên giấy tờ.';
  }

  if (normalized.includes('didnotreturn') && normalized.includes('payload')) {
    return 'Hệ thống chưa nhận được kết quả xác minh.';
  }

  return reason;
}

function isVnptValidationHint(value: string) {
  const normalized = normalizePayloadKey(value);
  return normalized.includes('khonghople')
    || normalized.includes('khongcungloai')
    || normalized.includes('khongkhop')
    || normalized.includes('thatbai')
    || normalized.includes('invalid')
    || normalized.includes('mismatch')
    || normalized.includes('failed')
    || normalized.includes('failure')
    || normalized.includes('null');
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function normalizePayloadKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}

function toDisplayValue(value: unknown) {
  if (typeof value === 'string') {
    const text = value.trim();
    return text.length > 0 && text.length <= 240 ? text : undefined;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function fallbackIdentityStatus(): KycModuleStatusResponse {
  return {
    status: 'NOT_STARTED',
    statusLabel: 'Chưa xác minh danh tính',
    canInteract: false,
    completedAt: null,
    detail: 'Đang tải thông tin...',
  };
}

function fallbackCertificateStatus(): KycModuleStatusResponse {
  return {
    status: 'LOCKED',
    statusLabel: 'Chưa mở khóa',
    canInteract: false,
    completedAt: null,
    detail: 'Hoàn tất xác minh danh tính trước khi nộp chứng chỉ.',
  };
}

function readErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; messageCode?: string } } }).response;
    const messageCode = response?.data?.messageCode;
    const message = response?.data?.message;

    return [messageCode, message].filter(Boolean).join(': ') || 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }

  return error instanceof Error ? error.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';
}
