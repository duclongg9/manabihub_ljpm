import { Button } from "@mui/material";

interface Props {

    disabled: boolean;

    loading: boolean;

    onSubmit: () => void;

}

export default function SubmitWritingButton({

                                                disabled,

                                                loading,

                                                onSubmit,

                                            }: Props) {

    return (

        <Button

            variant="contained"

            color="success"

            disabled={disabled}

            onClick={onSubmit}

        >

            {

                loading

                    ? "Đang gửi..."

                    : "Gửi bài chấm điểm"

            }

        </Button>

    );

}