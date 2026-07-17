import { Box, CircularProgress } from "@mui/material";

export default function WritingLoading() {

    return (

        <Box
            display="flex"
            justifyContent="center"
            py={5}
        >

            <CircularProgress />

        </Box>

    );

}