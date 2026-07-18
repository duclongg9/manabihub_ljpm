import { useState } from 'react';
import axios from 'axios';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useAiChatEligibility } from '../hooks/useAiChatEligibility';
import { useSendAiChatMessage } from '../hooks/useSendAiChatMessage';

interface ChatMessage {
  id: string;
  sender: 'student' | 'assistant';
  content: string;
}

interface AiChatPanelProps {
  courseId: string;
  lessonBlockId: string;
}

function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? 'Unable to get an AI response right now.';
  }
  return 'Unable to get an AI response right now.';
}

export function AiChatPanel({ courseId, lessonBlockId }: AiChatPanelProps) {
  const eligibility = useAiChatEligibility(courseId, lessonBlockId);
  const sendMessage = useSendAiChatMessage();
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [requestError, setRequestError] = useState<string | null>(null);

  const handleSend = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || !eligibility.data?.eligible) {
      return;
    }

    const studentMessage: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'student',
      content: trimmedQuestion,
    };
    setMessages((current) => [...current, studentMessage]);
    setQuestion('');
    setRequestError(null);

    try {
      const response = await sendMessage.mutateAsync({
        courseId,
        lessonBlockId,
        question: trimmedQuestion,
      });
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          sender: 'assistant',
          content: response.answer,
        },
      ]);
    } catch (error) {
      setRequestError(errorMessage(error));
    }
  };

  if (eligibility.isLoading) {
    return (
      <Box sx={{ minHeight: 240, display: 'grid', placeItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (eligibility.isError) {
    return (
      <Alert
        severity="error"
        action={<Button color="inherit" size="small" onClick={() => eligibility.refetch()}>Retry</Button>}
      >
        Unable to check AI chat availability for this lesson.
      </Alert>
    );
  }

  const available = eligibility.data?.eligible === true;

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        sx={{ px: 2, py: 1.5, alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>AI Study Assistant</Typography>
          <Typography variant="body2" color="text.secondary">Current lesson context only</Typography>
        </Box>
        <Chip
          label={available ? 'Available' : 'Unavailable'}
          color={available ? 'success' : 'default'}
          size="small"
          sx={{ alignSelf: { xs: 'flex-start', sm: 'center' } }}
        />
      </Stack>
      <Divider />

      {!available ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="info">{eligibility.data?.message ?? 'AI chat is unavailable for this lesson.'}</Alert>
        </Box>
      ) : (
        <Stack spacing={2} sx={{ p: 2 }}>
          <Box
            role="log"
            aria-live="polite"
            sx={{ minHeight: 280, maxHeight: 400, overflowY: 'auto', display: 'grid', alignContent: 'start', gap: 1.25 }}
          >
            {messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Ask a question about this lesson.</Typography>
            ) : messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  maxWidth: '82%',
                  justifySelf: message.sender === 'student' ? 'end' : 'start',
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: message.sender === 'student' ? 'primary.main' : 'action.hover',
                  color: message.sender === 'student' ? 'primary.contrastText' : 'text.primary',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere',
                }}
              >
                <Typography variant="body2">{message.content}</Typography>
              </Box>
            ))}
            {sendMessage.isPending && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">Thinking...</Typography>
              </Box>
            )}
          </Box>

          {requestError && <Alert severity="error">{requestError}</Alert>}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: 'stretch' }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={5}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about the current lesson"
              slotProps={{ htmlInput: { maxLength: 2000 } }}
            />
            <Button
              variant="contained"
              endIcon={<SendOutlinedIcon />}
              onClick={handleSend}
              disabled={!question.trim() || sendMessage.isPending}
              sx={{ minWidth: { sm: 112 }, alignSelf: { sm: 'flex-end' } }}
            >
              Send
            </Button>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            AI guidance is non-official learning support.
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
