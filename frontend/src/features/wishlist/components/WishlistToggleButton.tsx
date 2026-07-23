import { useState, type MouseEvent } from 'react';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import {
  Alert,
  Button,
  IconButton,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { rememberPostLoginRoute } from '../../../shared/auth/authSession';
import { useWishlist } from '../hooks/useWishlist';

interface WishlistToggleButtonProps {
  courseId: string;
  variant: 'icon' | 'button';
}

export function WishlistToggleButton({
  courseId,
  variant,
}: WishlistToggleButtonProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isStudent,
    courseIds,
    addCourse,
    removeCourse,
    isUpdating,
  } = useWishlist();
  const [errorOpen, setErrorOpen] = useState(false);
  const isSaved = courseIds.has(courseId);

  const handleToggle = async (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isStudent) {
      rememberPostLoginRoute('public', `${location.pathname}${location.search}`);
      navigate('/login');
      return;
    }

    try {
      if (isSaved) {
        await removeCourse(courseId);
      } else {
        await addCourse(courseId);
      }
    } catch {
      setErrorOpen(true);
    }
  };

  const label = isSaved ? 'Remove from wishlist' : 'Add to wishlist';

  return (
    <>
      {variant === 'icon' ? (
        <Tooltip title={label}>
          <IconButton
            aria-label={label}
            disabled={isUpdating}
            onClick={handleToggle}
            sx={{
              position: 'absolute',
              zIndex: 2,
              top: 8,
              right: 8,
              width: 40,
              height: 40,
              bgcolor: 'background.paper',
              boxShadow: 1,
              '&:hover': { bgcolor: 'background.paper' },
            }}
          >
            {isSaved ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          fullWidth
          variant="outlined"
          color={isSaved ? 'error' : 'primary'}
          startIcon={isSaved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          disabled={isUpdating}
          onClick={handleToggle}
          sx={{ mb: 3 }}
        >
          {label}
        </Button>
      )}
      <Snackbar
        open={errorOpen}
        autoHideDuration={4000}
        onClose={() => setErrorOpen(false)}
      >
        <Alert severity="error" onClose={() => setErrorOpen(false)}>
          Wishlist could not be updated. Please try again.
        </Alert>
      </Snackbar>
    </>
  );
}
