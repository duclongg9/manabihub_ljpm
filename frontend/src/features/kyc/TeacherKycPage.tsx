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
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import GppMaybeIcon from '@mui/icons-material/GppMaybe';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  getTeacherKycStatus,
  submitTeacherKyc,
  type ApiEnvelope,
  type KycStatusResponse,
  type KycSubmissionResponse,
} from './teacherKycApi';

type FileFieldName = 'cccdFront' | 'cccdBack' | 'selfie' | 'certificate' | 'copyrightAgreement';

interface FileFieldConfig {
  name: FileFieldName;
  label: string;
  hint: string;
  accept: string;
  allowPdf: boolean;
}

type FileState = Record<FileFieldName, File | null>;
type FileErrors = Partial<Record<FileFieldName | 'agreement', string>>;

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png']);
const DOCUMENT_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const fileFields: FileFieldConfig[] = [
  {
    name: 'cccdFront',
    label: 'CCCD front',
    hint: 'Front side identity document image, JPG or PNG, max 5MB.',
    accept: 'image/jpeg,image/png',
    allowPdf: false,
  },
  {
    name: 'cccdBack',
    label: 'CCCD back',
    hint: 'Back side identity document image, JPG or PNG, max 5MB.',
    accept: 'image/jpeg,image/png',
    allowPdf: false,
  },
  {
    name: 'selfie',
    label: 'Selfie / liveness placeholder',
    hint: 'Teacher selfie image for later liveness provider integration.',
    accept: 'image/jpeg,image/png',
    allowPdf: false,
  },
  {
    name: 'certificate',
    label: 'JLPT / professional certificate',
    hint: 'Certificate image or PDF. Registry checks are deferred to MHB-12.',
    accept: 'image/jpeg,image/png,application/pdf',
    allowPdf: true,
  },
  {
    name: 'copyrightAgreement',
    label: 'Digital Copyright Liability Agreement',
    hint: 'Signed agreement file, image or PDF.',
    accept: 'image/jpeg,image/png,application/pdf',
    allowPdf: true,
  },
];

const emptyFiles: FileState = {
  cccdFront: null,
  cccdBack: null,
  selfie: null,
  certificate: null,
  copyrightAgreement: null,
};

export function TeacherKycPage() {
  const [files, setFiles] = useState<FileState>(emptyFiles);
  const [certificateCode, setCertificateCode] = useState('');
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [errors, setErrors] = useState<FileErrors>({});
  const [status, setStatus] = useState<KycStatusResponse | null>(null);
  const [submissionEnvelope, setSubmissionEnvelope] = useState<ApiEnvelope<KycSubmissionResponse> | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getTeacherKycStatus()
      .then((response) => {
        if (mounted) {
          setStatus(response);
        }
      })
      .catch((error) => {
        if (mounted) {
          setPageError(readErrorMessage(error));
        }
      })
      .finally(() => {
        if (mounted) {
          setLoadingStatus(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const canSubmit = useMemo(() => {
    if (!status) {
      return true;
    }

    return ['NOT_SUBMITTED', 'REJECTED', 'CORRECTION_REQUIRED'].includes(status.teacherKycStatus);
  }, [status]);

  const submittedRequest = submissionEnvelope?.data.request ?? status?.latestRequest ?? null;

  function handleFileChange(name: FileFieldName, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setFiles((current) => ({ ...current, [name]: file }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setSubmissionEnvelope(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPageError(null);
    setSubmissionEnvelope(null);

    const nextErrors = validateForm(files, agreementAccepted);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await submitTeacherKyc({
        cccdFront: files.cccdFront as File,
        cccdBack: files.cccdBack as File,
        selfie: files.selfie as File,
        certificate: files.certificate as File,
        copyrightAgreement: files.copyrightAgreement as File,
        copyrightAgreementAccepted: agreementAccepted,
        certificateCode,
      });
      const nextStatus = await getTeacherKycStatus();

      setSubmissionEnvelope(response);
      setStatus(nextStatus);
    } catch (error) {
      setPageError(readErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: { xs: 2, md: 3 },
        }}
      >
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ color: 'success.main', fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              UC-22 Teacher Verification
            </Typography>
            <Typography component="h2" sx={{ fontSize: { xs: 28, md: 34 }, fontWeight: 800, mt: 1 }}>
              Submit KYC Documents
            </Typography>
            <Typography sx={{ color: 'text.secondary', maxWidth: 800, mt: 1 }}>
              Upload identity, selfie/liveness placeholder, JLPT or professional certificate, and copyright agreement. Product authoring remains
              locked until admin approval.
            </Typography>
          </Box>
          <StatusChip status={status?.teacherKycStatus ?? 'UNKNOWN'} label={status?.teacherKycStatusLabel ?? 'Loading'} />
        </Stack>
      </Paper>

      {loadingStatus ? <LinearProgress color="success" /> : null}
      {pageError ? <Alert severity="error">{pageError}</Alert> : null}
      {submissionEnvelope ? (
        <Alert severity="success" icon={<AssignmentTurnedInIcon />}>
          {submissionEnvelope.message} Admin notification: {submissionEnvelope.data.adminNotificationCreated ? 'created' : 'not created'}.
          Audit log: {submissionEnvelope.data.auditLogged ? 'recorded' : 'not recorded'}.
        </Alert>
      ) : null}

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.6fr) minmax(320px, 0.9fr)' },
          alignItems: 'start',
        }}
      >
        <Card component="form" onSubmit={handleSubmit} variant="outlined">
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography component="h3" sx={{ fontSize: 20, fontWeight: 800 }}>
                  Required documents
                </Typography>
                <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 0.5 }}>
                  JPG/PNG for identity and selfie, JPG/PNG/PDF for certificate and agreement. Max 5MB each.
                </Typography>
              </Box>
              <Chip label={loadingStatus ? 'Checking status...' : canSubmit ? 'Ready for submission' : 'Submission locked'} />
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              }}
            >
              {fileFields.map((field) => (
                <FileUploadCard
                  key={field.name}
                  disabled={!canSubmit || submitting}
                  error={errors[field.name]}
                  field={field}
                  file={files[field.name]}
                  onChange={handleFileChange}
                />
              ))}
            </Box>

            <TextField
              fullWidth
              disabled={!canSubmit || submitting}
              label="Certificate code (optional)"
              margin="normal"
              placeholder="JLPT or professional certificate code"
              value={certificateCode}
              onChange={(event) => setCertificateCode(event.target.value)}
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={agreementAccepted}
                  disabled={!canSubmit || submitting}
                  onChange={(event) => {
                    setAgreementAccepted(event.target.checked);
                    setErrors((current) => ({ ...current, agreement: undefined }));
                  }}
                />
              }
              label="I accept the Digital Copyright Liability Agreement for teacher-published content."
              sx={{ alignItems: 'flex-start', mt: 1 }}
            />
            {errors.agreement ? (
              <Typography sx={{ color: 'error.main', fontSize: 13, fontWeight: 700 }}>
                {errors.agreement}
              </Typography>
            ) : null}

            <Button
              fullWidth
              color="success"
              disabled={!canSubmit || submitting}
              size="large"
              sx={{ mt: 2, py: 1.25, fontWeight: 800 }}
              type="submit"
              variant="contained"
            >
              {submitting ? 'Submitting KYC...' : 'Submit Verification'}
            </Button>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ position: { lg: 'sticky' }, top: 16 }}>
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <GppMaybeIcon color="success" />
              <Typography component="h3" sx={{ fontSize: 20, fontWeight: 800 }}>
                Status evidence
              </Typography>
            </Stack>

            <Stack divider={<Divider flexItem />} spacing={1.5} sx={{ my: 2 }}>
              <EvidenceRow label="KYC status" value={status?.teacherKycStatusLabel ?? 'Loading'} />
              <EvidenceRow label="Authoring unlocked" value={status?.canPublishCourse ? 'Yes' : 'No'} />
              <EvidenceRow label="Latest request" value={submittedRequest?.requestId ?? '-'} />
              <EvidenceRow label="Provider status" value={submittedRequest?.ekycProvider ?? 'Manual review pending'} />
              <EvidenceRow label="Risk level" value={submittedRequest?.riskLevel ?? '-'} />
            </Stack>

            {submittedRequest ? (
              <>
                <Typography sx={{ fontSize: 15, fontWeight: 800, mt: 2 }}>
                  Stored documents
                </Typography>
                <List dense disablePadding sx={{ mt: 1 }}>
                  {submittedRequest.documents.map((document) => (
                    <ListItem key={document.id} disableGutters divider>
                      <ListItemText
                        primary={
                          <Typography sx={{ color: 'text.secondary', fontSize: 12, fontWeight: 800 }}>
                            {document.documentType}
                          </Typography>
                        }
                        secondary={
                          <Typography sx={{ color: 'text.primary', overflowWrap: 'anywhere' }}>
                            {document.fileName}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </>
            ) : null}

            <Typography sx={{ fontSize: 15, fontWeight: 800, mt: 2 }}>
              SRS traceability
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1 }}>
              UC-22, BR-KYC, BR-RBAC, BR-AUD, MSG-KYC.
            </Typography>
            <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1 }}>
              VNPT, National ID, and JLPT registry adapters are deferred to MHB-12.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}

function FileUploadCard({
  disabled,
  error,
  field,
  file,
  onChange,
}: {
  disabled: boolean;
  error?: string;
  field: FileFieldConfig;
  file: File | null;
  onChange: (name: FileFieldName, event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: error ? 'error.light' : 'divider',
        borderRadius: 2,
        bgcolor: 'grey.50',
        p: 2,
      }}
    >
      <Stack spacing={1.25}>
        <Box>
          <Typography sx={{ fontSize: 14, fontWeight: 800 }}>
            {field.label}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
            {field.hint}
          </Typography>
        </Box>
        <Button component="label" disabled={disabled} startIcon={<CloudUploadIcon />} variant="outlined">
          Choose file
          <input hidden accept={field.accept} type="file" onChange={(event) => onChange(field.name, event)} />
        </Button>
        {file ? (
          <Typography sx={{ color: 'success.main', fontSize: 13, fontWeight: 700, overflowWrap: 'anywhere' }}>
            {file.name}
          </Typography>
        ) : null}
        {error ? (
          <Typography sx={{ color: 'error.main', fontSize: 13, fontWeight: 700 }}>
            {error}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}

function StatusChip({ status, label }: { status: string; label: string }) {
  const color = statusChipColor(status);

  return <Chip color={color} label={label} sx={{ fontWeight: 800 }} />;
}

function statusChipColor(status: string): 'default' | 'success' | 'warning' | 'error' {
  if (status === 'APPROVED') {
    return 'success';
  }

  if (status === 'PENDING') {
    return 'warning';
  }

  if (status === 'REJECTED' || status === 'CORRECTION_REQUIRED') {
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
      <Typography sx={{ fontSize: 15, fontWeight: 800, overflowWrap: 'anywhere' }}>
        {value}
      </Typography>
    </Box>
  );
}

function validateForm(files: FileState, agreementAccepted: boolean) {
  const nextErrors: FileErrors = {};

  for (const field of fileFields) {
    const file = files[field.name];

    if (!file) {
      nextErrors[field.name] = `${field.label} is required.`;
      continue;
    }

    if (file.size > MAX_FILE_SIZE) {
      nextErrors[field.name] = 'File must not exceed 5MB.';
      continue;
    }

    const allowedTypes = field.allowPdf ? DOCUMENT_TYPES : IMAGE_TYPES;
    if (file.type && !allowedTypes.has(file.type)) {
      nextErrors[field.name] = field.allowPdf ? 'Use JPG, PNG, or PDF.' : 'Use JPG or PNG.';
    }
  }

  if (!agreementAccepted) {
    nextErrors.agreement = 'Digital Copyright Liability Agreement must be accepted.';
  }

  return nextErrors;
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
