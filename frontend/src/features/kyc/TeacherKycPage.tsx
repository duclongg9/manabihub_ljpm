import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import GppGoodIcon from '@mui/icons-material/GppGood';
import LockIcon from '@mui/icons-material/Lock';
import RefreshIcon from '@mui/icons-material/Refresh';
import SchoolIcon from '@mui/icons-material/School';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  getTeacherKycStatus,
  submitTeacherCertificate,
  verifyTeacherIdentity,
  type ApiEnvelope,
  type KycCertificateSubmissionResponse,
  type KycIdentityVerificationResponse,
  type KycModuleStatusResponse,
  type KycStatusResponse,
} from './teacherKycApi';
import { launchVnptIdentitySdk } from './vnptIdentitySdk';

type CertificateErrors = Partial<Record<'certificate' | 'certificateCode' | 'agreement', string>>;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const CERTIFICATE_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

export function TeacherKycPage() {
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateCode, setCertificateCode] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [errors, setErrors] = useState<CertificateErrors>({});
  const [status, setStatus] = useState<KycStatusResponse | null>(null);
  const [identityEnvelope, setIdentityEnvelope] = useState<ApiEnvelope<KycIdentityVerificationResponse> | null>(null);
  const [certificateEnvelope, setCertificateEnvelope] = useState<ApiEnvelope<KycCertificateSubmissionResponse> | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [identityLaunching, setIdentityLaunching] = useState(false);
  const [certificateSubmitting, setCertificateSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    refreshStatus().finally(() => setLoadingStatus(false));
  }, []);

  const identityStatus = status?.identityVerification ?? fallbackIdentityStatus();
  const certificateStatus = status?.certificateVerification ?? fallbackCertificateStatus();
  const latestRequest = certificateEnvelope?.data.request ?? identityEnvelope?.data.request ?? status?.latestRequest ?? null;
  const identityVerified = identityStatus.status === 'VERIFIED';
  const canStartIdentity =
    !identityLaunching
    && status?.teacherKycStatus !== 'APPROVED'
    && certificateStatus.status !== 'PENDING_REVIEW'
    && (identityStatus.canInteract || ['NOT_STARTED', 'FAILED'].includes(identityStatus.status));
  const canSubmitCertificate = identityVerified && certificateStatus.canInteract && !certificateSubmitting;

  async function refreshStatus() {
    try {
      const response = await getTeacherKycStatus();
      setStatus(response);
    } catch (error) {
      setPageError(readErrorMessage(error));
    }
  }

  async function handleStartIdentity() {
    setPageError(null);
    setIdentityEnvelope(null);
    setIdentityLaunching(true);

    try {
      await launchVnptIdentitySdk(async (result) => {
        try {
          const response = await verifyTeacherIdentity(result);
          setIdentityEnvelope(response);
          await refreshStatus();
        } catch (error) {
          setPageError(readErrorMessage(error));
        } finally {
          setIdentityLaunching(false);
        }
      });
    } catch (error) {
      setPageError(readErrorMessage(error));
      setIdentityLaunching(false);
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

  const dashboardMessage = useMemo(() => {
    if (identityStatus.status === 'FAILED') {
      return 'VNPT eKYC chưa xác thực được danh tính. Giáo viên có thể thực hiện lại ngay, không cần chờ Admin mở lại.';
    }

    if (identityStatus.status === 'NOT_STARTED') {
      return 'Bắt đầu bằng VNPT eKYC realtime: hệ thống sẽ mở hướng dẫn chụp CCCD và liveness khuôn mặt trong SDK.';
    }

    if (certificateStatus.status === 'PENDING_REVIEW') {
      return 'Danh tính đã xác thực. Chứng chỉ đang chờ kiểm tra/đối soát; quyền tạo và xuất bản sản phẩm vẫn khóa cho đến khi KYC đạt.';
    }

    if (identityVerified) {
      return 'Danh tính đã xác thực thành công. Hãy nộp JLPT / J-Test / NAT-TEST Certificate để hệ thống đối soát chứng chỉ.';
    }

    return 'Bắt đầu bằng VNPT eKYC realtime. Phần chứng chỉ chỉ mở sau khi xác thực danh tính thành công.';
  }, [certificateStatus.status, identityStatus.status, identityVerified]);

  return (
    <Stack spacing={3}>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ color: 'success.main', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              UC-22 Teacher Verification
            </Typography>
            <Typography component="h2" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 800, mt: 1 }}>
              Xác thực giáo viên
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 860, mt: 1 }}>
              Luồng KYC được tách thành từng module: VNPT eKYC xử lý danh tính realtime, còn chứng chỉ chuyên môn đi qua kiểm tra/đối soát riêng.
              Nếu một bước lỗi, giáo viên chỉ làm lại đúng bước đó.
            </Typography>
          </Box>
          <StatusChip status={status?.teacherKycStatus ?? 'UNKNOWN'} label={status?.teacherKycStatusLabel ?? 'Loading'} />
        </Stack>
      </Paper>

      {loadingStatus ? <LinearProgress color="success" /> : null}
      {pageError ? <Alert severity="error">{pageError}</Alert> : null}
      <Alert severity="info">{dashboardMessage}</Alert>
      {identityEnvelope ? (
        <Alert severity={identityEnvelope.data.identityVerification.status === 'VERIFIED' ? 'success' : 'warning'} icon={<VerifiedUserIcon />}>
          {identityEnvelope.data.identityVerification.statusLabel}
        </Alert>
      ) : null}
      {certificateEnvelope ? (
        <Alert severity="success" icon={<AssignmentTurnedInIcon />}>
          Chứng chỉ đã được ghi nhận và chuyển sang bước kiểm tra/đối soát.
        </Alert>
      ) : null}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.45fr) minmax(320px, 0.9fr)' }, alignItems: 'start' }}>
        <Stack spacing={3}>
          <ModuleCard
            icon={<VerifiedUserIcon color="success" />}
            index="Module 1"
            status={identityStatus}
            title="Xác thực danh tính"
          >
            <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
              VNPT eKYC sẽ chụp CCCD và kiểm tra liveness khuôn mặt theo thời gian thực. Module này không dùng upload file CCCD/selfie tĩnh.
            </Typography>
            <Alert severity="info" sx={{ mt: 2 }}>
              Chuẩn bị CCCD gốc, cho phép camera, đặt giấy tờ vào đúng khung và làm theo hướng dẫn video/overlay của VNPT SDK.
              Nếu SDK báo lỗi, đóng popup và bấm thực hiện lại ngay.
            </Alert>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2 }}>
              <Button
                color="success"
                disabled={!canStartIdentity}
                onClick={handleStartIdentity}
                startIcon={identityStatus.status === 'FAILED' ? <RefreshIcon /> : <GppGoodIcon />}
                variant="contained"
              >
                {identityLaunching ? 'Đang mở VNPT eKYC...' : identityStatus.status === 'FAILED' ? 'Thực hiện lại' : 'Bắt đầu xác thực danh tính'}
              </Button>
            </Stack>
            {latestRequest?.providerTransactionId ? (
              <Typography sx={{ color: 'text.secondary', fontSize: 13, mt: 1.5 }}>
                Transaction: {latestRequest.providerTransactionId}
              </Typography>
            ) : null}
          </ModuleCard>

          <ModuleCard
            icon={identityVerified ? <SchoolIcon color="success" /> : <LockIcon color="disabled" />}
            index="Module 2"
            status={certificateStatus}
            title="JLPT / J-Test / NAT-TEST Certificate"
          >
            {!identityVerified ? (
              <Alert severity="warning">Module này chỉ mở sau khi Module 1 xác thực danh tính thành công.</Alert>
            ) : (
              <Box component="form" onSubmit={handleCertificateSubmit}>
                <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
                  Giáo viên chỉ nộp chứng chỉ chuyên môn ở bước này. Nếu chứng chỉ cần bổ sung, chỉ cần nộp lại chứng chỉ, không phải xác thực lại danh tính.
                </Typography>

                <Paper elevation={0} sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: errors.certificate ? 'error.light' : 'divider', borderRadius: 2, mt: 2, p: 2 }}>
                  <Stack spacing={1.25}>
                    <Typography sx={{ fontSize: 14, fontWeight: 800 }}>JLPT / J-Test / NAT-TEST Certificate</Typography>
                    <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>Ảnh hoặc PDF, tối đa 5MB.</Typography>
                    <Button component="label" disabled={!canSubmitCertificate} startIcon={<UploadFileIcon />} variant="outlined">
                      Tải chứng chỉ
                      <input hidden accept="image/jpeg,image/png,application/pdf" type="file" onChange={handleCertificateChange} />
                    </Button>
                    {certificateFile ? (
                      <Typography sx={{ color: 'success.main', fontSize: 13, fontWeight: 700, overflowWrap: 'anywhere' }}>
                        {certificateFile.name}
                      </Typography>
                    ) : null}
                    {errors.certificate ? <FieldError>{errors.certificate}</FieldError> : null}
                  </Stack>
                </Paper>

                <TextField
                  fullWidth
                  disabled={!canSubmitCertificate}
                  error={Boolean(errors.certificateCode)}
                  helperText={errors.certificateCode}
                  label="Mã chứng chỉ (Hệ thống tự bóc tách hoặc nhập tay nếu ảnh mờ)"
                  margin="normal"
                  required
                  value={certificateCode}
                  onChange={(event) => {
                    setCertificateCode(event.target.value);
                    setErrors((current) => ({ ...current, certificateCode: undefined }));
                  }}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreementAccepted}
                      disabled={!canSubmitCertificate}
                      onChange={(event) => {
                        setAgreementAccepted(event.target.checked);
                        setErrors((current) => ({ ...current, agreement: undefined }));
                      }}
                    />
                  }
                  label="Tôi chấp nhận Digital Copyright Liability Agreement và điều khoản dịch vụ của nền tảng."
                  sx={{ alignItems: 'flex-start', mt: 1 }}
                />
                {errors.agreement ? <FieldError>{errors.agreement}</FieldError> : null}

                <Button
                  color="success"
                  disabled={!canSubmitCertificate}
                  fullWidth
                  size="large"
                  sx={{ mt: 2, py: 1.25, fontWeight: 800 }}
                  type="submit"
                  variant="contained"
                >
                  {certificateSubmitting ? 'Đang nộp chứng chỉ...' : 'Nộp chứng chỉ'}
                </Button>
              </Box>
            )}
          </ModuleCard>
        </Stack>

        <Card variant="outlined" sx={{ position: { lg: 'sticky' }, top: 16 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <GppGoodIcon color="success" />
              <Typography component="h3" sx={{ fontSize: 20, fontWeight: 800 }}>
                Bằng chứng trạng thái
              </Typography>
            </Stack>

            <Stack divider={<Divider flexItem />} spacing={1.5} sx={{ my: 2 }}>
              <EvidenceRow label="Trạng thái KYC" value={status?.teacherKycStatusLabel ?? 'Đang tải'} />
              <EvidenceRow label="Module danh tính" value={identityStatus.statusLabel} />
              <EvidenceRow label="Module chứng chỉ" value={certificateStatus.statusLabel} />
              <EvidenceRow label="Mở khóa authoring" value={status?.canPublishCourse ? 'Có' : 'Không'} />
              <EvidenceRow label="Request mới nhất" value={latestRequest?.requestId ?? 'N/A'} />
              <EvidenceRow label="Provider status" value={latestRequest?.ekycProvider ?? 'N/A'} />
              <EvidenceRow label="Risk level" value={latestRequest?.riskLevel ?? 'N/A'} />
              <EvidenceRow label="Mã chứng chỉ" value={latestRequest?.certificateCode ?? 'N/A'} />
            </Stack>

            <Typography sx={{ fontSize: 15, fontWeight: 800, mt: 2 }}>File chứng chỉ đã lưu</Typography>
            {latestRequest?.documents.length ? (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {latestRequest.documents.map((document) => (
                  <Paper key={document.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5 }}>
                    <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>{document.documentType}</Typography>
                    <Typography sx={{ overflowWrap: 'anywhere' }}>{document.fileName}</Typography>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1 }}>N/A</Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

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
    <Card variant="outlined">
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', mb: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            {icon}
            <Box>
              <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {index}
              </Typography>
              <Typography component="h3" sx={{ fontSize: 20, fontWeight: 800 }}>
                {title}
              </Typography>
            </Box>
          </Stack>
          <StatusChip status={status.status} label={status.statusLabel} />
        </Stack>
        {status.detail ? (
          <Typography sx={{ color: 'text.secondary', fontSize: 14, mb: 2 }}>
            {status.detail}
          </Typography>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}

function FieldError({ children }: { children: string }) {
  return <Typography sx={{ color: 'error.main', fontSize: 13, fontWeight: 700 }}>{children}</Typography>;
}

function StatusChip({ status, label }: { status: string; label: string }) {
  return <Chip color={statusChipColor(status)} label={label} sx={{ fontWeight: 800 }} />;
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

function EvidenceRow({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 800, overflowWrap: 'anywhere' }}>{value}</Typography>
    </Box>
  );
}

function validateCertificateForm(certificateFile: File | null, certificateCode: string, agreementAccepted: boolean) {
  const nextErrors: CertificateErrors = {};

  if (!certificateFile) {
    nextErrors.certificate = 'Bắt buộc tải JLPT / J-Test / NAT-TEST Certificate.';
  } else if (certificateFile.size > MAX_FILE_SIZE) {
    nextErrors.certificate = 'Chứng chỉ không được vượt quá 5MB.';
  } else if (certificateFile.type && !CERTIFICATE_TYPES.has(certificateFile.type)) {
    nextErrors.certificate = 'Chỉ chấp nhận JPG, PNG hoặc PDF.';
  }

  if (!certificateCode.trim()) {
    nextErrors.certificateCode = 'Bắt buộc nhập mã chứng chỉ để đối soát registry.';
  }

  if (!agreementAccepted) {
    nextErrors.agreement = 'Bạn cần chấp nhận Digital Copyright Liability Agreement.';
  }

  return nextErrors;
}

function fallbackIdentityStatus(): KycModuleStatusResponse {
  return {
    status: 'NOT_STARTED',
    statusLabel: 'Chưa xác thực danh tính',
    canInteract: false,
    completedAt: null,
    detail: 'Đang tải trạng thái xác thực danh tính.',
  };
}

function fallbackCertificateStatus(): KycModuleStatusResponse {
  return {
    status: 'LOCKED',
    statusLabel: 'Chưa mở khóa',
    canInteract: false,
    completedAt: null,
    detail: 'Hoàn tất xác thực danh tính trước khi nộp chứng chỉ.',
  };
}

function readErrorMessage(error: unknown) {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string; messageCode?: string } } }).response;
    const messageCode = response?.data?.messageCode;
    const message = response?.data?.message;

    return [messageCode, message].filter(Boolean).join(': ') || 'Request failed.';
  }

  return error instanceof Error ? error.message : 'Request failed.';
}
