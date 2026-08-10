import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  targetId?: string;
}

export interface OnboardingGuideProps {
  /** Stable scope name. A separate completion flag is stored for every scope. */
  scope: string;
  title: string;
  intro: string;
  steps: OnboardingStep[];
  /** Prefer a stable user id. The public JWT subject is used when omitted. */
  accountKey?: string | null;
}

export const ONBOARDING_STORAGE_PREFIX = 'manabihub.onboarding.v1';

function storageKey(scope: string, accountKey?: string | null) {
  const account = accountKey?.trim() || 'anonymous';
  return `${ONBOARDING_STORAGE_PREFIX}.${scope}.${encodeURIComponent(account)}`;
}

function readCompleted(key: string) {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(key) === 'completed';
  } catch {
    return false;
  }
}

function markCompleted(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, 'completed');
  } catch {
    // Private browsing or a storage policy must not prevent the guide from closing.
  }
}

/**
 * A small, reusable first-run guide for authenticated workspaces.
 * Closing without checking “không hiển thị lại” only dismisses this visit;
 * the guide will be offered again the next time that account opens the scope.
 */
export function OnboardingGuide({
  scope,
  title,
  intro,
  steps,
  accountKey,
}: OnboardingGuideProps) {
  const key = useMemo(() => storageKey(scope, accountKey), [scope, accountKey]);
  const [open, setOpen] = useState(() => steps.length > 0 && !readCompleted(key));
  const [stepIndex, setStepIndex] = useState(0);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const highlightedNode = useRef<HTMLElement | null>(null);
  const previousShadow = useRef<string>('');

  const activeStep = steps[stepIndex];

  useEffect(() => {
    setOpen(steps.length > 0 && !readCompleted(key));
    setStepIndex(0);
    setDoNotShowAgain(false);
  }, [key, steps.length]);

  useEffect(() => {
    const previous = highlightedNode.current;
    if (previous) {
      previous.style.boxShadow = previousShadow.current;
      previous.removeAttribute('data-onboarding-active');
    }

    highlightedNode.current = null;
    if (!open || !activeStep?.targetId || typeof document === 'undefined') return undefined;

    const node = document.querySelector<HTMLElement>(
      `[data-onboarding-target="${activeStep.targetId}"]`,
    );
    if (!node) return undefined;

    previousShadow.current = node.style.boxShadow;
    node.style.boxShadow = '0 0 0 4px rgba(196, 30, 58, 0.22), 0 8px 28px rgba(27, 42, 74, 0.12)';
    node.setAttribute('data-onboarding-active', 'true');
    highlightedNode.current = node;
    node.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });

    return () => {
      node.style.boxShadow = previousShadow.current;
      node.removeAttribute('data-onboarding-active');
      highlightedNode.current = null;
    };
  }, [activeStep?.targetId, open]);

  useEffect(() => () => {
    if (highlightedNode.current) {
      highlightedNode.current.style.boxShadow = previousShadow.current;
      highlightedNode.current.removeAttribute('data-onboarding-active');
    }
  }, []);

  if (!open || !activeStep || steps.length === 0) return null;

  const isLastStep = stepIndex === steps.length - 1;
  const closeGuide = () => {
    if (doNotShowAgain) markCompleted(key);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={closeGuide}
      fullWidth
      maxWidth="sm"
      aria-labelledby={`${scope}-onboarding-title`}
      aria-describedby={`${scope}-onboarding-description`}
    >
      <DialogTitle
        id={`${scope}-onboarding-title`}
        sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pb: 1 }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '50%',
            bgcolor: '#FFF1F3',
            color: '#C41E3A',
          }}
        >
          <HelpOutlineRoundedIcon />
        </Box>
        <Box>
          <Typography component="div" sx={{ fontWeight: 900, color: '#172033' }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Hướng dẫn nhanh · Bước {stepIndex + 1}/{steps.length}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent id={`${scope}-onboarding-description`} sx={{ pt: 1 }}>
        <LinearProgress
          variant="determinate"
          value={((stepIndex + 1) / steps.length) * 100}
          sx={{
            height: 6,
            mb: 2.5,
            borderRadius: 999,
            bgcolor: '#F4D7DC',
            '& .MuiLinearProgress-bar': { bgcolor: '#C41E3A', borderRadius: 999 },
          }}
        />
        {stepIndex === 0 && (
          <Typography sx={{ mb: 2, color: '#5B6472', lineHeight: 1.6 }}>
            {intro}
          </Typography>
        )}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Box
            sx={{
              flexShrink: 0,
              width: 34,
              height: 34,
              display: 'grid',
              placeItems: 'center',
              borderRadius: 1.5,
              bgcolor: '#C41E3A',
              color: 'common.white',
              fontWeight: 900,
            }}
          >
            {stepIndex + 1}
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#172033', fontWeight: 900, mb: 0.75 }}>
              {activeStep.title}
            </Typography>
            <Typography sx={{ color: '#5B6472', lineHeight: 1.65 }}>
              {activeStep.description}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        <FormControlLabel
          sx={{ mr: 'auto', color: '#667085' }}
          control={(
            <Checkbox
              checked={doNotShowAgain}
              onChange={(event) => setDoNotShowAgain(event.target.checked)}
              slotProps={{ input: { 'aria-label': 'Không hiển thị lại hướng dẫn này' } }}
              size="small"
              sx={{ color: '#A8B0BC', '&.Mui-checked': { color: '#C41E3A' } }}
            />
          )}
          label={<Typography variant="caption">Không hiển thị lại trên tài khoản này</Typography>}
        />
        <Button onClick={closeGuide} color="inherit">
          Đóng
        </Button>
        {stepIndex > 0 && (
          <Button
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            startIcon={<ArrowBackRoundedIcon />}
          >
            Quay lại
          </Button>
        )}
        <Button
          variant="contained"
          onClick={() => (isLastStep ? closeGuide() : setStepIndex((current) => current + 1))}
          endIcon={isLastStep ? <CheckRoundedIcon /> : <ArrowForwardRoundedIcon />}
          sx={{ bgcolor: '#C41E3A', '&:hover': { bgcolor: '#A71931' } }}
        >
          {isLastStep ? 'Hoàn tất' : 'Tiếp theo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
