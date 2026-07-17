import { Alert } from "@mui/material";

interface Props {

    message: string;

}

export default function WritingError({

                                         message,

                                     }: Props) {

    return (

        <Alert severity="error">

            {message}

        </Alert>

    );

}