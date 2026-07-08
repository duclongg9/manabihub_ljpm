import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, Box, Button, Chip, CircularProgress, Divider, Paper, Stack, Typography } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/components/PageHeader/PageHeader';
import { ROUTES } from '../../../shared/constants/routes';
import {
  fetchCourseCategories,
  fetchCourseDrafts,
  type CourseCategory,
  type CourseDraftResponse,
} from '../services/courseDraftService';

interface CourseDraftSavedState {
  draftSaved?: boolean;
  draftId?: string;
  draftTitle?: string;
}

const priceFormatter = new Intl.NumberFormat('vi-VN', {
  currency: 'VND',
  maximumFractionDigits: 0,
  style: 'currency',
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function TeacherCoursesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const draftState = location.state as CourseDraftSavedState | null;
  const recentlySaved = Boolean(draftState?.draftSaved);
  const [drafts, setDrafts] = useState<CourseDraftResponse[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const categoryNames = useMemo(
    () => new Map(categories.map((category) => [category.code, category.name])),
    [categories],
  );

  const loadDrafts = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [draftList, categoryList] = await Promise.all([
        fetchCourseDrafts(),
        fetchCourseCategories().catch(() => []),
      ]);

      setDrafts(draftList);
      setCategories(categoryList);
    } catch {
      setLoadError('Không thể tải danh sách bản nháp. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  return (
    <Box>
      <PageHeader
        title="Khóa học của tôi"
        breadcrumbs={[
          { label: 'Giảng viên' },
          { label: 'Khóa học' },
        ]}
        action={(
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(ROUTES.TEACHER.COURSE_CREATE)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Tạo bản nháp
          </Button>
        )}
      />

      {recentlySaved && (
        <Alert
          severity="success"
          action={(
            <Button
              color="inherit"
              size="small"
              onClick={() => navigate(ROUTES.TEACHER.COURSES, { replace: true })}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Ẩn thông báo
            </Button>
          )}
          sx={{ mb: 2 }}
        >
          Đã lưu bản nháp “{draftState?.draftTitle || 'khóa học mới'}”. Bạn có thể xem lại khóa học trong danh sách bản nháp bên dưới.
        </Alert>
      )}

      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          p: { xs: 2, md: 3 },
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2 }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Danh sách bản nháp
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Các khóa học đang được soạn thảo sẽ xuất hiện tại đây để bạn kiểm tra trước khi gửi duyệt.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={isLoading}
            onClick={() => void loadDrafts()}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Tải lại
          </Button>
        </Stack>

        {isLoading && <DraftLoadingState />}

        {!isLoading && loadError && (
          <Alert
            severity="error"
            action={(
              <Button color="inherit" size="small" onClick={() => void loadDrafts()} sx={{ textTransform: 'none' }}>
                Thử lại
              </Button>
            )}
          >
            {loadError}
          </Alert>
        )}

        {!isLoading && !loadError && drafts.length === 0 && (
          <DraftEmptyState onCreate={() => navigate(ROUTES.TEACHER.COURSE_CREATE)} />
        )}

        {!isLoading && !loadError && drafts.length > 0 && (
          <Stack divider={<Divider flexItem />} spacing={0}>
            {drafts.map((course) => (
              <CourseDraftRow
                key={course.id}
                course={course}
                categoryName={categoryNames.get(course.category)}
                highlighted={course.id === draftState?.draftId}
              />
            ))}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}

interface CourseDraftRowProps {
  categoryName?: string;
  course: CourseDraftResponse;
  highlighted: boolean;
}

function CourseDraftRow({ categoryName, course, highlighted }: CourseDraftRowProps) {
  const thumbnailSrc = resolveAssetUrl(course.thumbnailUrl);
  const summary = toPlainText(course.introduction) || 'Chưa có mô tả ngắn cho bản nháp này.';

  return (
    <Box
      sx={{
        bgcolor: highlighted ? 'action.hover' : 'transparent',
        borderLeft: '4px solid',
        borderLeftColor: highlighted ? 'primary.main' : 'transparent',
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: '132px 1fr' },
        px: { xs: 0, sm: 1.5 },
        py: 2.5,
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          aspectRatio: '16 / 9',
          bgcolor: 'grey.100',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          display: 'flex',
          justifyContent: 'center',
          minHeight: { xs: 160, sm: 74 },
          overflow: 'hidden',
        }}
      >
        {thumbnailSrc ? (
          <Box
            component="img"
            src={thumbnailSrc}
            alt={course.title}
            sx={{ height: '100%', objectFit: 'cover', width: '100%' }}
          />
        ) : (
          <MenuBookIcon color="primary" sx={{ fontSize: 32 }} />
        )}
      </Box>

      <Stack spacing={1}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{ justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            {course.title}
          </Typography>
          <Chip color="warning" label="Bản nháp" size="small" />
        </Stack>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            overflow: 'hidden',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
          }}
        >
          {summary}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1 }}>
          <Chip color="primary" label={course.jlptLevel} size="small" variant="outlined" />
          <Chip label={categoryName || course.category} size="small" variant="outlined" />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {formatPrice(course.price)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Lưu lúc {formatDate(course.createdAt)}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

function DraftLoadingState() {
  return (
    <Stack spacing={1.5} sx={{ alignItems: 'center', py: 6 }}>
      <CircularProgress size={28} />
      <Typography variant="body2" color="text.secondary">
        Đang tải danh sách bản nháp...
      </Typography>
    </Stack>
  );
}

interface DraftEmptyStateProps {
  onCreate: () => void;
}

function DraftEmptyState({ onCreate }: DraftEmptyStateProps) {
  return (
    <Stack spacing={2} sx={{ alignItems: 'center', py: 6, textAlign: 'center' }}>
      <MenuBookIcon color="primary" sx={{ fontSize: 48 }} />
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Chưa có bản nháp khóa học
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 520 }}>
          Khi bạn lưu bản nháp, khóa học sẽ xuất hiện tại đây để kiểm tra và hoàn thiện trước khi gửi duyệt.
        </Typography>
      </Box>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} sx={{ textTransform: 'none', fontWeight: 700 }}>
        Tạo bản nháp đầu tiên
      </Button>
    </Stack>
  );
}

function formatPrice(price: number) {
  if (!price) {
    return 'Miễn phí';
  }

  return priceFormatter.format(price);
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'chưa rõ thời gian';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'chưa rõ thời gian';
  }

  return dateFormatter.format(date);
}

function resolveAssetUrl(url?: string | null) {
  if (!url) {
    return undefined;
  }

  if (/^(https?:|blob:|data:)/i.test(url)) {
    return url;
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api';
  const assetOrigin = apiBaseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');

  return `${assetOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
}

function toPlainText(value?: string | null) {
  if (!value) {
    return '';
  }

  const document = new DOMParser().parseFromString(value, 'text/html');
  return document.body.textContent?.replace(/\s+/g, ' ').trim() || '';
}
