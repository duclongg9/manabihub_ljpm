import { useEffect, useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import axios from 'axios';
import {
  Link as RouterLink,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';
import { axiosClient } from '../../shared/api/axiosClient';
import { ENDPOINTS } from '../../shared/api/endpoints';
import { refreshAdminSession } from '../../shared/auth/adminAuthApi';
import {
  clearAuthSession,
  consumePostLoginRoute,
  getAuthSession,
  hasAdminRefreshSession,
  hasAnyRole,
  rememberPostLoginRoute,
  storeAdminSession,
  subscribeToAuthSessionChanges,
  type AdminSessionCredentials,
} from '../../shared/auth/authSession';
import { ROLES } from '../../shared/constants/roles';
import { ROUTES } from '../../shared/constants/routes';
import { getAsset } from '../../shared/utils/assets';

const INTERNAL_ROLES = [
  ROLES.SYSTEM_ADMIN,
  ROLES.COURSE_MANAGER,
  ROLES.FINANCE_MANAGER,
];

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(hasAdminRefreshSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    searchParams.get('reason') === 'session-expired'
      ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      : null,
  );

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const existing = getAuthSession('admin');
      if (existing && hasAnyRole(existing, INTERNAL_ROLES)) {
        navigate(consumePostLoginRoute('admin', existing), { replace: true });
        return;
      }
      if (!hasAdminRefreshSession()) {
        if (active) setRestoring(false);
        return;
      }

      if (active) setRestoring(true);
      const session = await refreshAdminSession();
      if (!active) return;
      if (session && hasAnyRole(session, INTERNAL_ROLES)) {
        navigate(consumePostLoginRoute('admin', session), { replace: true });
        return;
      }
      setRestoring(false);
    };
    const unsubscribe = subscribeToAuthSessionChanges(() => {
      void restore();
    });
    void restore();

    return () => {
      active = false;
      unsubscribe();
    };
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const response = await axiosClient.post(ENDPOINTS.ADMIN_LOGIN, {
        email,
        password,
        rememberMe,
      });
      const credentials = response.data?.data as AdminSessionCredentials | undefined;
      const session = credentials
        ? storeAdminSession(credentials)
        : null;

      if (!session || !hasAnyRole(session, INTERNAL_ROLES)) {
        clearAuthSession('admin');
        setErrorMessage('Tài khoản không có quyền truy cập Cổng quản trị.');
        return;
      }

      const returnTo = (location.state as { from?: unknown } | null)?.from;
      if (typeof returnTo === 'string') {
        rememberPostLoginRoute('admin', returnTo);
      }
      navigate(consumePostLoginRoute('admin', session), { replace: true });
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && !error.response) {
        setErrorMessage('Không thể kết nối máy chủ. Vui lòng thử lại sau.');
      } else {
        const responseData = axios.isAxiosError(error)
          ? error.response?.data as { messageCode?: string; errorCode?: string }
          : undefined;
        const code = responseData?.messageCode ?? responseData?.errorCode;
        setErrorMessage(
          code === 'MSG-AUTH-008'
            ? 'Tài khoản đang bị khóa tạm thời. Vui lòng thử lại sau.'
            : 'Email hoặc mật khẩu không chính xác.',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (restoring) {
    return (
      <Box
        aria-label="Đang khôi phục phiên quản trị"
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', display: 'flex', minHeight: '100vh' }}>
      <Box
        sx={{
          display: { xs: 'none', lg: 'block' },
          flex: 1,
          minWidth: 0,
          position: 'relative',
        }}
      >
        <Box
          alt=""
          component="img"
          src={getAsset('hero.png')}
          sx={{ height: '100%', objectFit: 'cover', width: '100%' }}
        />
        <Box
          sx={{
            bgcolor: 'rgba(15, 23, 42, 0.72)',
            color: 'common.white',
            display: 'flex',
            flexDirection: 'column',
            inset: 0,
            justifyContent: 'space-between',
            p: 8,
            position: 'absolute',
          }}
        >
          <Brand color="common.white" />
          <Box sx={{ maxWidth: 520 }}>
            <Typography component="h1" sx={{ fontSize: '3rem', fontWeight: 800, mb: 2 }}>
              Cổng quản trị
            </Typography>
            <Typography color="grey.300" variant="h6">
              Không gian vận hành nội bộ của ManabiHub.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        component="main"
        sx={{
          alignItems: 'center',
          display: 'flex',
          flex: { xs: 1, lg: '0 0 480px' },
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Box sx={{ maxWidth: 400, width: '100%' }}>
          <Box sx={{ display: { xs: 'flex', lg: 'none' }, mb: 6 }}>
            <Brand color="primary.main" />
          </Box>
          <Typography component="h1" sx={{ fontSize: '2rem', fontWeight: 800, mb: 1 }}>
            Đăng nhập
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Sử dụng tài khoản nội bộ được ManabiHub cấp.
          </Typography>

          {errorMessage && <Alert severity="error" sx={{ mb: 3 }}>{errorMessage}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              autoComplete="username"
              disabled={loading}
              fullWidth
              label="Email"
              margin="normal"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlinedIcon />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              autoComplete="current-password"
              disabled={loading}
              fullWidth
              label="Mật khẩu"
              margin="normal"
              onChange={(event) => setPassword(event.target.value)}
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                        edge="end"
                        onClick={() => setShowPassword((visible) => !visible)}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                justifyContent: 'space-between',
                mb: 3,
                mt: 1,
              }}
            >
              <FormControlLabel
                control={(
                  <Checkbox
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                )}
                label="Ghi nhớ đăng nhập"
              />
              <Link component={RouterLink} to={ROUTES.ADMIN.FORGOT_PASSWORD}>
                Quên mật khẩu?
              </Link>
            </Box>
            <Button
              disabled={loading}
              fullWidth
              size="large"
              type="submit"
              variant="contained"
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập'}
            </Button>
          </Box>
          <Button
            component={RouterLink}
            sx={{ mt: 2 }}
            to={ROUTES.PUBLIC.HOME}
            fullWidth
          >
            Về trang chủ
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

function Brand({ color }: { color: string }) {
  return (
    <Box sx={{ alignItems: 'center', color, display: 'flex', gap: 1.5 }}>
      <MenuBookIcon />
      <Typography sx={{ fontSize: '1.25rem', fontWeight: 800 }}>
        ManabiHub
      </Typography>
    </Box>
  );
}
