import { Box, Button, MenuItem, TextField } from '@mui/material';
import type { WalletActivityFilter, WalletTransactionSection } from '../types';
import { EMPTY_ACTIVITY_FILTER } from '../types';
import { SECTION_LABELS } from '../utils';

interface WalletActivityFiltersProps {
  value: WalletActivityFilter;
  /** Sections actually present in the data, so the dropdown never offers an empty result. */
  availableSections: WalletTransactionSection[];
  onChange: (next: WalletActivityFilter) => void;
}

/**
 * UC-17 normal flow step 6 — narrows the transaction history by type, date range and
 * free-text reference. Filtering is client-side: the history is owner-scoped and small.
 */
export const WalletActivityFilters = ({
  value,
  availableSections,
  onChange,
}: WalletActivityFiltersProps) => {
  const isDirty = JSON.stringify(value) !== JSON.stringify(EMPTY_ACTIVITY_FILTER);

  const set = <K extends keyof WalletActivityFilter>(key: K, next: WalletActivityFilter[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 1.5,
        alignItems: 'center',
        p: 2,
        mb: 2,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        bgcolor: '#fff',
      }}
    >
      <TextField
        select
        size="small"
        label="Loại giao dịch"
        value={value.section}
        onChange={(event) => set('section', event.target.value as WalletActivityFilter['section'])}
        sx={{ minWidth: 190 }}
      >
        <MenuItem value="ALL">Tất cả</MenuItem>
        {availableSections.map((section) => (
          <MenuItem key={section} value={section}>
            {SECTION_LABELS[section]}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        size="small"
        type="date"
        label="Từ ngày"
        value={value.from}
        onChange={(event) => set('from', event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        size="small"
        type="date"
        label="Đến ngày"
        value={value.to}
        onChange={(event) => set('to', event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />

      <TextField
        size="small"
        label="Mã tham chiếu"
        placeholder="OD… / TU…"
        value={value.query}
        onChange={(event) => set('query', event.target.value)}
        sx={{ minWidth: 180 }}
      />

      {isDirty && (
        <Button
          size="small"
          onClick={() => onChange(EMPTY_ACTIVITY_FILTER)}
          sx={{ textTransform: 'none' }}
        >
          Xoá bộ lọc
        </Button>
      )}
    </Box>
  );
};
