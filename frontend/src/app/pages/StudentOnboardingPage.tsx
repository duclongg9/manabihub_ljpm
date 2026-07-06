import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Stack, Card,
  TextField, Stepper, Step, StepLabel,
  Avatar, Container, InputAdornment,
  FormControl, InputLabel, Select, FormHelperText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Validation errors
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});

  // Store token after returning from Google Login
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('auth_token', token);
    }
  }, [searchParams]);

  const steps = ['Cập nhật thông tin Học viên', 'Hoàn tất'];

  const validateStep0 = () => {
    const newErrors: { name?: string; phone?: string } = {};
    if (!name.trim()) {
      newErrors.name = 'Vui lòng nhập họ và tên';
    }
    // Optional phone, but if provided must be valid (10-11 digits)
    if (phone.trim() && !/^\d{10,11}$/.test(phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ (gồm 10-11 số)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      const isValid = validateStep0();
      if (!isValid) return;
      setActiveStep((prev) => prev + 1);
    } else if (activeStep === 1) {
      // In real scenario, here we'd call backend to update profile (avatarFile, name, phone, goal)
      navigate('/student', { replace: true });
    }
  };

  const handleBack = () => setActiveStep((prev) => prev - 1);

  // [CODE NOTE]: Hàm xử lý chọn ảnh từ máy tính (Upload Avatar).
  // Đọc file thành chuỗi objectURL để hiển thị ảnh preview tạm thời trên giao diện.
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
    }
  };

  return (
    <Box sx={{ minHeight: 'calc(100vh - 140px)', bgcolor: 'grey.50', py: { xs: 4, md: 6 }, display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="md">

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 48, height: 48, bgcolor: '#2563eb', borderRadius: 2,
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
        <Card sx={{ borderRadius: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.08)', border: '1px solid #f3f4f6', bgcolor: 'white' }}>
          <Box sx={{ p: { xs: 3, md: 4 } }}>

            {/* STEP 0: STUDENT PROFILE SETUP */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, color: 'grey.900' }}>
                  Cập nhật thông tin cá nhân
                </Typography>

                <Stack spacing={3}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Avatar 
                      src={avatarPreview || undefined} 
                      sx={{ width: 80, height: 80, bgcolor: '#eff6ff', color: '#3b82f6', border: avatarPreview ? '2px solid #e5e7eb' : 'none' }}
                    >
                      {!avatarPreview && <PersonIcon sx={{ fontSize: 40 }} />}
                    </Avatar>
                    
                    <Box>
                      <input
                        accept="image/*"
                        style={{ display: 'none' }}
                        id="avatar-upload-button"
                        type="file"
                        onChange={handleImageChange}
                      />
                      <label htmlFor="avatar-upload-button">
                        <Button
                          variant="outlined"
                          component="span"
                          startIcon={<CloudUploadIcon />}
                          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: 'grey.300', color: 'grey.700' }}
                        >
                          Tải ảnh lên
                        </Button>
                      </label>
                      <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'grey.500' }}>
                        Khuyến nghị ảnh vuông, tối đa 2MB
                      </Typography>
                    </Box>
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
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: 'grey.400' }} /></InputAdornment> } }}
                    />
                    <TextField
                      label="Số điện thoại"
                      placeholder="Ví dụ: 0912345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      fullWidth
                      variant="outlined"
                      error={!!errors.phone}
                      helperText={errors.phone || 'Để trống hoặc nhập 10-11 chữ số'}
                      slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: 'grey.400' }} /></InputAdornment> } }}
                    />
                  </Box>

                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="jlpt-goal-label">Mục tiêu JLPT của bạn</InputLabel>
                    <Select
                      native
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      title="Mục tiêu JLPT của bạn"
                      aria-label="Mục tiêu JLPT của bạn"
                      labelId="jlpt-goal-label"
                      id="jlpt-goal"
                      label="Mục tiêu JLPT của bạn"
                      inputProps={{
                        title: 'Mục tiêu JLPT của bạn',
                        'aria-label': 'Mục tiêu JLPT của bạn',
                        id: 'jlpt-goal-select'
                      }}
                    >
                      <option value="n5">N5 - Sơ cấp</option>
                      <option value="n4">N4 - Sơ trung cấp</option>
                      <option value="n3">N3 - Trung cấp</option>
                      <option value="n2">N2 - Thượng cấp</option>
                      <option value="n1">N1 - Cao cấp</option>
                    </Select>
                    <FormHelperText>Giúp chúng tôi đề xuất lộ trình và khóa học phù hợp nhất với bạn.</FormHelperText>
                  </FormControl>

                  <Box
                    sx={{
                      p: 2.5,
                      bgcolor: '#eff6ff',
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: '#bfdbfe',
                      display: 'flex',
                      gap: 2,
                      alignItems: 'flex-start'
                    }}
                  >
                    <InfoOutlinedIcon sx={{ color: '#2563eb', fontSize: 24, mt: 0.25 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'grey.900', mb: 0.5 }}>
                        Bạn muốn trở thành Giảng viên?
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'grey.700', lineHeight: 1.5 }}>
                        Hãy hoàn tất bước đăng ký Học viên này trước nhé. Sau đó, bạn có thể gửi hồ sơ nâng cấp (KYC & Chứng chỉ) thông qua mục "Trở thành Giảng viên" tại Trang chủ của hệ thống.
                      </Typography>
                    </Box>
                  </Box>

                </Stack>
              </Box>
            )}

            {/* STEP 1: FINISH */}
            {activeStep === 1 && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CheckCircleIcon sx={{ fontSize: 80, color: '#22c55e', mb: 3 }} />
                <Typography variant="h4" sx={{ fontWeight: 800, mb: 2, color: 'grey.900' }}>
                  Hoàn tất thiết lập!
                </Typography>
                <Typography variant="body1" sx={{ color: 'grey.600', maxWidth: 400, mx: 'auto', lineHeight: 1.6 }}>
                  Tài khoản Học viên của bạn đã sẵn sàng. Cùng bắt đầu hành trình chinh phục tiếng Nhật cùng ManabiHub ngay thôi!
                </Typography>
              </Box>
            )}

          </Box>

          {/* Footer Actions */}
          <Box sx={{ p: { xs: 3, md: 4 }, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'grey.200', display: 'flex', justifyContent: 'space-between', borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
            <Button
              color="error"
              onClick={() => {
                if (activeStep === 0) {
                  navigate('/login');
                } else {
                  handleBack();
                }
              }}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Quay lại
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              sx={{ px: 4, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 700, boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
            >
              {activeStep === steps.length - 1 ? 'Khám phá Trang chủ' : 'Tiếp tục'}
            </Button>
          </Box>
        </Card>

      </Container>
    </Box>
  );
}
