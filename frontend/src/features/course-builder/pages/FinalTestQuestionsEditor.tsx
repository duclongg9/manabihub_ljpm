import { Button, Card, CardContent, IconButton, Stack, TextField, Typography, Checkbox, FormControlLabel, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import type { FinalTestQuestion, FinalTestChoice } from '../services/finalTestService';

interface Props {
  questions: FinalTestQuestion[];
  onChange: (questions: FinalTestQuestion[]) => void;
}

export const FinalTestQuestionsEditor = ({ questions, onChange }: Props) => {

  const handleAddQuestion = () => {
    const newQuestion: FinalTestQuestion = {
      content: '',
      explanation: '',
      choices: [
        { content: '', isCorrect: true },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
        { content: '', isCorrect: false },
      ],
    };
    onChange([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (index: number) => {
    onChange(questions.filter((_, i) => i !== index));
  };

  const handleChangeQuestion = (index: number, field: keyof FinalTestQuestion, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    onChange(newQuestions);
  };

  const handleChoiceChange = (qIndex: number, cIndex: number, field: keyof FinalTestChoice, value: any) => {
    const newQuestions = [...questions];
    const choices = [...newQuestions[qIndex].choices];
    
    if (field === 'isCorrect' && value === true) {
      // Ensure only one is correct
      choices.forEach(c => c.isCorrect = false);
    }
    
    choices[cIndex] = { ...choices[cIndex], [field]: value };
    newQuestions[qIndex].choices = choices;
    onChange(newQuestions);
  };

  return (
    <Stack spacing={3}>
      {questions.map((q, qIndex) => (
        <Card key={qIndex} variant="outlined">
          <CardContent>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Câu {qIndex + 1}</Typography>
              <Tooltip title="Xóa câu hỏi">
                <IconButton color="error" onClick={() => handleRemoveQuestion(qIndex)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Stack>

            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Nội dung câu hỏi"
                multiline
                rows={2}
                fullWidth
                value={q.content}
                onChange={(e) => handleChangeQuestion(qIndex, 'content', e.target.value)}
                required
              />

              <Typography variant="subtitle2" sx={{ mt: 1 }}>Các lựa chọn (chọn 1 đáp án đúng):</Typography>
              <Stack spacing={1}>
                {q.choices.map((choice, cIndex) => (
                  <Stack direction="row" spacing={2} key={cIndex} sx={{ alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={choice.isCorrect}
                          onChange={(e) => handleChoiceChange(qIndex, cIndex, 'isCorrect', e.target.checked)}
                        />
                      }
                      label=""
                    />
                    <TextField
                      size="small"
                      fullWidth
                      placeholder={`Lựa chọn ${cIndex + 1}`}
                      value={choice.content}
                      onChange={(e) => handleChoiceChange(qIndex, cIndex, 'content', e.target.value)}
                      required
                    />
                  </Stack>
                ))}
              </Stack>

              <TextField
                label="Giải thích đáp án"
                multiline
                rows={2}
                fullWidth
                value={q.explanation}
                onChange={(e) => handleChangeQuestion(qIndex, 'explanation', e.target.value)}
                required
                sx={{ mt: 2 }}
              />
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddQuestion}
        sx={{ borderStyle: 'dashed' }}
      >
        Thêm câu hỏi
      </Button>
    </Stack>
  );
};
