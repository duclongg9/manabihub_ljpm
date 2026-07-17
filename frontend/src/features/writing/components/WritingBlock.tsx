import { useEffect, useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";

import type { LearningLessonBlock } from "../../learning/types";

import {
    getWritingAssignment,
    submitWriting,
} from "../api/writingApi";

import type {
    WritingAssignmentResponse,
} from "../api/writingTypes";

import WritingPromptCard from "./WritingPromptCard";
import WritingEditor from "./WritingEditor";
import CharacterCounter from "./CharacterCounter";
import SubmitWritingButton from "./SubmitWritingButton";
import WritingLoading from "./WritingLoading";
import WritingError from "./WritingError";

interface WritingBlockProps {
    block: LearningLessonBlock;
}

export default function WritingBlock({
                                         block,
                                     }: WritingBlockProps) {

    const navigate = useNavigate();

    const [assignment, setAssignment] =
        useState<WritingAssignmentResponse | null>(null);

    const [content, setContent] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {

        let active = true;

        const loadAssignment = async () => {

            try {

                const response =
                    await getWritingAssignment(block.id);

                if (!active) return;

                setAssignment(response);

            } catch {

                if (!active) return;

                setError("Không thể tải đề bài viết.");

            } finally {

                if (active) {

                    setLoading(false);

                }

            }

        };

        loadAssignment();

        return () => {

            active = false;

        };

    }, [block.id]);

    const characterCount = useMemo(
        () => content.trim().length,
        [content],
    );

    const canSubmit = useMemo(() => {

        if (!assignment) {

            return false;

        }

        return (
            characterCount >= assignment.minCharacters &&
            characterCount <= assignment.maxCharacters
        );

    }, [assignment, characterCount]);

    const handleSubmit = async () => {

        if (!assignment) {

            return;

        }

        try {

            setSubmitting(true);

            const result =
                await submitWriting({

                    lessonBlockId:
                    assignment.lessonBlockId,

                    content,

                });

            navigate(
                `/student/writing/${result.submission.id}/feedback`
            );

        } catch {

            setError("Không thể nộp bài viết.");

        } finally {

            setSubmitting(false);

        }

    };

    if (loading) {

        return <WritingLoading />;

    }

    if (error) {

        return (
            <WritingError
                message={error}
            />
        );

    }

    if (!assignment) {

        return (
            <WritingError
                message="Không tìm thấy đề bài."
            />
        );

    }

    return (

        <Stack spacing={3}>

            <WritingPromptCard
                title={assignment.title}
                prompt={assignment.prompt}
                rubric={assignment.rubric}
            />

            <WritingEditor
                value={content}
                onChange={setContent}
            />

            <CharacterCounter
                current={characterCount}
                min={assignment.minCharacters}
                max={assignment.maxCharacters}
            />

            <Box
                display="flex"
                justifyContent="flex-end"
            >

                <SubmitWritingButton
                    disabled={!canSubmit || submitting}
                    loading={submitting}
                    onSubmit={handleSubmit}
                />

            </Box>

        </Stack>

    );

}