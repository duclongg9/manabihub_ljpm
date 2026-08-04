import AttachFileOutlinedIcon from '@mui/icons-material/AttachFileOutlined';
import { Alert, Button, Card, CardContent, CardHeader, Divider, Stack, Typography } from '@mui/material';
import type { ViolationEvidence } from '../types/violation.types';

export function EvidencePanel({ evidence }: { evidence: ViolationEvidence[] }) {
  return (
    <Card variant="outlined">
      <CardHeader title="Bằng chứng" avatar={<AttachFileOutlinedIcon color="action" />} />
      <Divider />
      <CardContent>
        {evidence.length === 0 ? (
          <Alert severity="warning">
            Báo cáo chưa có bằng chứng đính kèm. Không nên áp dụng biện pháp nghiêm trọng
            khi chưa đủ căn cứ.
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            {evidence.map((item) => (
              <Stack
                key={item.evidenceId}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
              >
                <div>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {item.displayName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.evidenceType} · {new Date(item.submittedAt).toLocaleString('vi-VN')}
                  </Typography>
                </div>
                <Button
                  component="a"
                  href={item.accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="outlined"
                >
                  Mở bằng chứng
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
