import {
    Card,
    CardContent,
    Typography,
} from "@mui/material";

interface Props {

    title: string;

    prompt: string;

    rubric: string;

}

export default function WritingPromptCard({

                                              title,
                                              prompt,
                                              rubric,

                                          }: Props) {

    return (

        <Card variant="outlined">

            <CardContent>

                <Typography
                    variant="h5"
                    fontWeight={700}
                >
                    {title}
                </Typography>

                <Typography
                    mt={3}
                    fontWeight={700}
                >
                    Đề bài
                </Typography>

                <Typography
                    mt={1}
                    whiteSpace="pre-line"
                >
                    {prompt}
                </Typography>

                <Typography
                    mt={3}
                    fontWeight={700}
                >
                    Tiêu chí chấm
                </Typography>

                <Typography
                    mt={1}
                    color="text.secondary"
                    whiteSpace="pre-line"
                >
                    {rubric}
                </Typography>

            </CardContent>

        </Card>

    );

}