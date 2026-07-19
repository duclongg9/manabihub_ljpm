import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Snackbar,
    Stack,
    TextField,
    Typography,
} from "@mui/material";

import { writingService } from "../services/writingService";

import type {
    SubmitWritingRequest,
    WritingAssignmentResponse,
} from "../types";

export function WritingAssignmentPage() {

    const { lessonBlockId } = useParams();

    const [assignment, setAssignment] =
        useState<WritingAssignmentResponse>();

    const [content, setContent] = useState("");

    const [loading, setLoading] = useState(true);

    const [submitting, setSubmitting] = useState(false);

    const [successOpen, setSuccessOpen] = useState(false);

    const [error, setError] = useState("");

    useEffect(() => {

        if (!lessonBlockId) {
            return;
        }

        loadAssignment();

    }, [lessonBlockId]);

    async function loadAssignment() {

        try {

            setLoading(true);

            const result =
                await writingService.getAssignment(lessonBlockId!);

            setAssignment(result);

        } catch (err) {

            console.error(err);

            setError("Không tải được bài viết.");

        } finally {

            setLoading(false);

        }

    }

    async function handleSubmit() {

        if (!lessonBlockId) {
            return;
        }

        if (!content.trim()) {

            setError("Vui lòng nhập nội dung.");

            return;

        }

        try {

            setSubmitting(true);

            const payload: SubmitWritingRequest = {

                lessonBlockId,

                content,

            };

            const result =
                await writingService.submitWriting(payload);

            setSuccessOpen(true);

            console.log(result);

            // UC15 sau này
            // navigate(`/student/writing-feedback/${result.submission.id}`);

        } catch (err) {

            console.error(err);

            setError("Nộp bài thất bại.");

        } finally {

            setSubmitting(false);

        }

    }

    if (loading) {

        return (

            <Box
                sx={{
                    display: "flex",
                    justifyContent: "center",
                    mt: 10,
                }}
            >

                <CircularProgress />

            </Box>

        );

    }

    if (!assignment) {

        return (

            <Alert severity="error">

                Không tìm thấy bài viết.

            </Alert>

        );

    }

    return (

        <Box
            sx={{
                maxWidth: 900,
                mx: "auto",
                mt: 4,
            }}
        >

            <Stack spacing={3}>

                <Card>

                    <CardContent>

                        <Typography
                            variant="h5"
                            gutterBottom
                        >

                            {assignment.title}

                        </Typography>

                        <Typography
                            sx={{
                                whiteSpace: "pre-wrap",
                                mb: 2,
                            }}
                        >

                            {assignment.prompt}

                        </Typography>

                        <Alert severity="info">

                            {assignment.rubric}

                        </Alert>

                    </CardContent>

                </Card>

                <Card>

                    <CardContent>

                        <TextField
                            multiline
                            minRows={12}
                            fullWidth
                            value={content}
                            onChange={(e) =>
                                setContent(e.target.value)
                            }
                            placeholder="Nhập bài viết của bạn..."
                        />

                        <Box
                            sx={{
                                mt: 2,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >

                            <Typography
                                color="text.secondary"
                            >

                                {content.length} ký tự

                            </Typography>

                            <Button
                                variant="contained"
                                disabled={submitting}
                                onClick={handleSubmit}
                            >

                                {submitting
                                    ? "Đang nộp..."
                                    : "Nộp bài"}

                            </Button>

                        </Box>

                    </CardContent>

                </Card>

            </Stack>

            <Snackbar
                open={successOpen}
                autoHideDuration={3000}
                onClose={() => setSuccessOpen(false)}
            >

                <Alert severity="success">

                    Nộp bài thành công.

                </Alert>

            </Snackbar>

            <Snackbar
                open={!!error}
                autoHideDuration={4000}
                onClose={() => setError("")}
            >

                <Alert severity="error">

                    {error}

                </Alert>

            </Snackbar>

        </Box>

    );

}