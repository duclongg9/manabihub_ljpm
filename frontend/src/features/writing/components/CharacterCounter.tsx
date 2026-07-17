import {
    Box,
    Typography,
} from "@mui/material";

interface Props {

    current: number;

    min: number;

    max: number;

}

export default function CharacterCounter({

                                             current,

                                             min,

                                             max,

                                         }: Props) {

    const valid =
        current >= min && current <= max;

    return (

        <Box
            display="flex"
            justifyContent="space-between"
        >

            <Typography
                color={
                    valid
                        ? "success.main"
                        : "error.main"
                }
            >
                {current}/{max}
            </Typography>

            <Typography>

                Tối thiểu {min} ký tự

            </Typography>

        </Box>

    );

}