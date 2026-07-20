import { useMemo, useState } from "react";
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    LinearProgress,
    Stack,
    Typography,
} from "@mui/material";

import {
    useFlashcards,
    useFlashcardSummary,
    useReviewFlashcard,
} from "../hooks/useFlashcard";

import type {
    FlashcardItem,
    FlashcardReviewStatus,
} from "../api/flashcardTypes";

interface FlashcardBlockProps {
    lessonBlockId: string;
}

export default function FlashcardBlock({
                                           lessonBlockId,
                                       }: FlashcardBlockProps) {

    const {
        data,
        isLoading,
        isError,
        refetch,
    } = useFlashcards(lessonBlockId);

    const summaryQuery =
        useFlashcardSummary(lessonBlockId);

    const reviewMutation =
        useReviewFlashcard();

    const [currentIndex, setCurrentIndex] =
        useState(0);

    const [showBack, setShowBack] =
        useState(false);

    const [finished, setFinished] =
        useState(false);

    const cards: FlashcardItem[] =
        data?.flashcards ?? [];

    const currentCard =
        cards[currentIndex];

    const progress = useMemo(() => {

        if (cards.length === 0) {
            return 0;
        }

        return (
            ((currentIndex + 1) /
                cards.length) *
            100
        );

    }, [cards.length, currentIndex]);

    async function handleReview(
        status: FlashcardReviewStatus,
    ) {

        if (!currentCard) {
            return;
        }

        await reviewMutation.mutateAsync({
            lessonBlockId,
            cardIndex: currentIndex,
            status,
        });

        if (
            currentIndex ===
            cards.length - 1
        ) {

            setFinished(true);

            await summaryQuery.refetch();

            return;
        }

        setCurrentIndex((prev) => prev + 1);
        setShowBack(false);
    }

    function handlePrevious() {

        if (currentIndex === 0) {
            return;
        }

        setCurrentIndex((prev) => prev - 1);
        setShowBack(false);
    }

    function handleNext() {

        if (
            currentIndex >=
            cards.length - 1
        ) {
            return;
        }

        setCurrentIndex((prev) => prev + 1);
        setShowBack(false);
    }

    function handleRestart() {

        setFinished(false);
        setCurrentIndex(0);
        setShowBack(false);

        refetch();
    }

    if (isLoading) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                py={6}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (isError) {
        return (
            <Alert severity="error">
                Không thể tải bộ flashcard.
            </Alert>
        );
    }

    if (cards.length === 0) {
        return (
            <Alert severity="info">
                Chưa có flashcard.
            </Alert>
        );
    }
    if (finished) {

        const summary = summaryQuery.data;

        return (
            <Card sx={{ mt: 2 }}>
                <CardContent>

                    <Typography
                        variant="h5"
                        fontWeight={700}
                        gutterBottom
                    >
                        Hoàn thành ôn tập
                    </Typography>

                    <Stack spacing={2} mt={3}>

                        <Typography>
                            Tổng số thẻ:
                            <strong>
                                {" "}
                                {summary?.totalCards ?? cards.length}
                            </strong>
                        </Typography>

                        <Typography color="success.main">
                            Đã nhớ:
                            <strong>
                                {" "}
                                {summary?.remembered ?? 0}
                            </strong>
                        </Typography>

                        <Typography color="warning.main">
                            Cần ôn lại:
                            <strong>
                                {" "}
                                {summary?.needReview ?? 0}
                            </strong>
                        </Typography>

                        <Typography color="text.secondary">
                            Bỏ qua:
                            <strong>
                                {" "}
                                {summary?.skipped ?? 0}
                            </strong>
                        </Typography>

                        <Button
                            variant="contained"
                            onClick={handleRestart}
                        >
                            Ôn tập lại
                        </Button>

                    </Stack>

                </CardContent>
            </Card>
        );
    }

    return (

        <Card sx={{ mt: 2 }}>

            <CardContent>

                <Stack spacing={3}>

                    <Box>

                        <Typography
                            variant="h6"
                            fontWeight={700}
                        >
                            {data?.title}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                        >
                            Thẻ {currentIndex + 1} / {cards.length}
                        </Typography>

                    </Box>

                    <LinearProgress
                        variant="determinate"
                        value={progress}
                    />

                    <Card
                        variant="outlined"
                        sx={{
                            cursor: "pointer",
                            minHeight: 260,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            textAlign: "center",
                            p: 3,
                        }}
                        onClick={() =>
                            setShowBack(!showBack)
                        }
                    >

                        <Stack spacing={2}>

                            {!showBack ? (

                                <>

                                    <Typography
                                        variant="h4"
                                        fontWeight={700}
                                    >
                                        {currentCard.front}
                                    </Typography>

                                    {currentCard.reading && (

                                        <Typography
                                            color="text.secondary"
                                        >
                                            {currentCard.reading}
                                        </Typography>

                                    )}

                                    <Typography
                                        variant="caption"
                                    >
                                        Nhấn để xem đáp án
                                    </Typography>

                                </>

                            ) : (

                                <>

                                    <Typography
                                        variant="h5"
                                        color="primary"
                                        fontWeight={700}
                                    >
                                        {currentCard.back}
                                    </Typography>

                                    {currentCard.example && (

                                        <Typography>
                                            {currentCard.example}
                                        </Typography>

                                    )}

                                    <Typography
                                        variant="caption"
                                    >
                                        Nhấn để quay lại
                                    </Typography>

                                </>

                            )}

                        </Stack>

                    </Card>
                    <Stack
                        direction="row"
                        justifyContent="space-between"
                    >
                        <Button
                            variant="outlined"
                            onClick={handlePrevious}
                            disabled={currentIndex === 0}
                        >
                            Trước
                        </Button>

                        <Button
                            variant="outlined"
                            onClick={handleNext}
                            disabled={
                                currentIndex ===
                                cards.length - 1
                            }
                        >
                            Tiếp
                        </Button>
                    </Stack>

                    <Stack
                        direction="row"
                        spacing={2}
                    >

                        <Button
                            fullWidth
                            variant="contained"
                            color="success"
                            disabled={
                                reviewMutation.isPending
                            }
                            onClick={() =>
                                handleReview(
                                    "REMEMBERED",
                                )
                            }
                        >
                            Đã nhớ
                        </Button>

                        <Button
                            fullWidth
                            variant="contained"
                            color="warning"
                            disabled={
                                reviewMutation.isPending
                            }
                            onClick={() =>
                                handleReview(
                                    "NEED_REVIEW",
                                )
                            }
                        >
                            Cần ôn
                        </Button>

                        <Button
                            fullWidth
                            variant="outlined"
                            disabled={
                                reviewMutation.isPending
                            }
                            onClick={() =>
                                handleReview(
                                    "SKIPPED",
                                )
                            }
                        >
                            Bỏ qua
                        </Button>

                    </Stack>

                </Stack>

            </CardContent>

        </Card>

    );
}