import { useState, useEffect } from 'react';
import {
  Alert, Box, Typography, Button, CircularProgress, Stack, Card,
  TextField, Stepper, Step, StepLabel,
  Container, InputAdornment, Avatar,
  FormControl, InputLabel, Select, FormHelperText, MenuItem
} from '@mui/material';
import { isAxiosError } from 'axios';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import FaceIcon from '@mui/icons-material/Face';
import Face2Icon from '@mui/icons-material/Face2';
import Face3Icon from '@mui/icons-material/Face3';
import Face4Icon from '@mui/icons-material/Face4';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  clearAuthSession,
  consumePostLoginRoute,
  getAuthSession,
  hasAnyRole,
  peekPostLoginRoute,
  storeAuthToken,
} from '../../shared/auth/authSession';
import { ROLES } from '../../shared/constants/roles';
import { ROUTES } from '../../shared/constants/routes';
import { updateMyStudentProfile } from '../../features/profile/profileApi';

// [CODE NOTE]: Giao diện Onboarding cho Học viên mới lần đầu login bằng Google (UC-01/02).
// User bắt buộc phải điền đủ thông tin (Tên) mới được vào hệ thống.
export function StudentOnboardingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [goal, setGoal] = useState('n3');
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const session = getAuthSession('public');
  const completionDestination = session ? peekPostLoginRoute('public', session) : '/login';
  const continuesToTeacherKyc = completionDestination.startsWith(ROUTES.TEACHER.KYC);

  useEffect(() => {
    const token = searchParams.get('token');
    const session = token
      ? storeAuthToken('public', token)
      : getAuthSession('public');

    if (!session || !hasAnyRole(session, [ROLES.STUDENT])) {
      navigate('/login', { replace: true });
      return;
    }

    if (token) {
      navigate('/onboarding/student', { replace: true });
    }
  }, [navigate, searchParams]);

  const steps = ['Cập nhật thông tin Học viên', 'Hoàn tất'];

  const validateStep0 = () => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập họ và tên';
    }
    if (phone.trim() && !/^(0\d{9}|\+84\d{9})$/.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (activeStep === 1) {
      const session = getAuthSession('public');
      navigate(session ? consumePostLoginRoute('public', session) : '/login', { replace: true });
      return;
    }

    if (!validateStep0()) return;

    setSaving(true);
    setSubmitError(null);

    try {
      await updateMyStudentProfile({
        displayName: name.trim(),
        fullName: name.trim(),
        jlptGoal: goal.toUpperCase(),
        phoneNumber: phone.trim() || null,
        // (In a real app, we would send the avatar index or URL)
      });
      setActiveStep(1);
    } catch (requestError) {
      const responseMessage = isAxiosError<{ message?: string }>(requestError)
        ? requestError.response?.data?.message
        : null;
      setSubmitError(responseMessage || 'Không thể lưu hồ sơ. Vui lòng kiểm tra kết nối và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#F8FAFC', backgroundImage: 'radial-gradient(at 100% 0%, rgba(254, 226, 226, 0.4) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(255, 237, 213, 0.4) 0px, transparent 50%)', display: 'flex', flexDirection: 'column' }}>
      {/* Minimal Header */}
      <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid', borderColor: 'grey.200', display: 'flex', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 900, color: '#C41E3A', letterSpacing: '-0.5px' }}>
          <MenuBookIcon sx={{ verticalAlign: 'middle', mr: 1, mb: 0.5 }} />
          ManabiHub
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, py: { xs: 4, md: 6 }, display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="md">
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 48, height: 48, bgcolor: '#C41E3A', borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <MenuBookIcon sx={{ color: 'white', fontSize: 28 }} />
            </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
            Chào mừng bạn mới!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 600, mx: 'auto', lineHeight: 1.6 }}>
            Xin chào hãy hoàn tất một số thông tin cơ bản để có trải nghiệm học tập tốt nhất trên ManabiHub.
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Content Box */}
        <Card sx={{ borderRadius: 4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', bgcolor: 'white' }}>
          <Box sx={{ p: { xs: 3, md: 4 } }}>

            {/* STEP 0: STUDENT PROFILE SETUP */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'grey.900' }}>
                  Cập nhật thông tin cá nhân
                </Typography>

                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}>
                      Chọn một nhân vật yêu thích
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      {[<FaceIcon fontSize="large" />, <Face2Icon fontSize="large" />, <Face3Icon fontSize="large" />, <Face4Icon fontSize="large" />].map((icon, idx) => (
                        <Box
                          key={idx}
                          onClick={() => setAvatarIndex(idx)}
                          sx={{
                            width: 64, height: 64, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s',
                            border: '3px solid',
                            borderColor: avatarIndex === idx ? '#C41E3A' : 'transparent',
                            bgcolor: avatarIndex === idx ? '#fff1f2' : 'grey.100',
                            color: avatarIndex === idx ? '#C41E3A' : 'grey.500',
                            '&:hover': {
                              bgcolor: avatarIndex === idx ? '#fff1f2' : 'grey.200'
                            }
                          }}
                        >
                          {icon}
                        </Box>
                      ))}
                    </Stack>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label="Họ và tên *"
                      placeholder="Tên đầy đủ"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      fullWidth
                      variant="outlined"
                      error={!!errors.name}
                      helperText={errors.name}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start" sx={{ mr: 0.5 }}><PersonIcon sx={{ color: 'grey.400' }} /></InputAdornment> } }}
                    />
                    <TextField
                      label="Số điện thoại"
                      placeholder="Ví dụ: 0912345678"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^\d+]/g, '');
                        setPhone(val);
                      }}
                      type="tel"
                      fullWidth
                      variant="outlined"
                      error={!!errors.phone}
                      helperText={errors.phone || 'Không bắt buộc. Ví dụ: 0912345678'}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start" sx={{ mr: 0.5 }}><PhoneIcon sx={{ color: 'grey.400' }} /></InputAdornment> } }}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1.5 }}>
                      Mục tiêu JLPT của bạn
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 6 }, '&::-webkit-scrollbar-thumb': { bgcolor: 'grey.300', borderRadius: 3 } }}>
                      {[
                        { id: 'n5', label: 'N5', sub: 'Sơ cấp' },
                        { id: 'n4', label: 'N4', sub: 'Sơ trung cấp' },
                        { id: 'n3', label: 'N3', sub: 'Trung cấp' },
                        { id: 'n2', label: 'N2', sub: 'Thượng cấp' },
                        { id: 'n1', label: 'N1', sub: 'Cao cấp' }
                      ].map(item => (
                        <Box
                          key={item.id}
                          onClick={() => setGoal(item.id)}
                          sx={{
                            flex: 1, minWidth: 80,
                            p: 1.5,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: goal === item.id ? '#C41E3A' : 'grey.300',
                            bgcolor: goal === item.id ? '#fff1f2' : 'white',
                            cursor: 'pointer',
                            textAlign: 'center',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: goal === item.id ? '#C41E3A' : 'grey.400',
                              bgcolor: goal === item.id ? '#fff1f2' : 'grey.50'
                            }
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: goal === item.id ? '#C41E3A' : 'text.primary' }}>
                            {item.label}
                          </Typography>
                          <Typography variant="caption" sx={{ color: goal === item.id ? '#C41E3A' : 'text.secondary', display: 'block' }}>
                            {item.sub}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                    <FormHelperText sx={{ mt: 1, mx: 0 }}>Giúp chúng tôi đề xuất lộ trình và khóa học phù hợp nhất với bạn.</FormHelperText>
                  </Box>



                  {submitError && <Alert severity="error">{submitError}</Alert>}

                </Stack>
              </Box>
            )}

            {/* STEP 1: FINISH */}
            {activeStep === 1 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <TaskAltIcon sx={{ fontSize: 80, color: '#22c55e', mb: 3 }} />
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: 'grey.900' }}>
                  Hoàn tất thiết lập!
                </Typography>
                <Typography variant="body1" sx={{ color: 'grey.600', maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}>
                  {continuesToTeacherKyc
                    ? 'Tài khoản Học viên của bạn đã sẵn sàng. Tiếp theo, hãy xác minh danh tính và chứng chỉ để đăng ký trở thành Giảng viên.'
                    : 'Tài khoản Học viên của bạn đã sẵn sàng. Cùng bắt đầu hành trình chinh phục tiếng Nhật cùng ManabiHub ngay thôi!'}
                </Typography>
              </Box>
            )}

          </Box>

          {/* Footer Actions */}
          <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'grey.200', display: 'flex', justifyContent: activeStep === 0 ? 'flex-end' : 'space-between', alignItems: 'center', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
            {activeStep === 0 ? (
              <Button
                variant="text"
                color="inherit"
                disabled={saving}
                onClick={() => {
                  clearAuthSession('public');
                  navigate('/login');
                }}
                sx={{ textTransform: 'none', fontWeight: 500, color: 'text.secondary', position: 'absolute', left: 32 }}
              >
                Đăng xuất
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="inherit"
                disabled={saving}
                onClick={handleBack}
                sx={{ textTransform: 'none', fontWeight: 600, color: 'text.secondary', borderColor: 'grey.300', '&:hover': { bgcolor: 'grey.100', borderColor: 'grey.400' } }}
              >
                Quay lại
              </Button>
            )}
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={saving}
              startIcon={saving ? <CircularProgress color="inherit" size={18} /> : undefined}
              sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
            >
              {saving
                ? 'Đang lưu...'
                : activeStep === steps.length - 1
                  ? continuesToTeacherKyc
                    ? 'Tiếp tục xác minh Giảng viên'
                    : 'Đến trang của tôi'
                  : 'Tiếp tục'}
            </Button>
          </Box>
        </Card>

        </Container>
      </Box>
    </Box>
  );
}
