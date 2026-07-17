const [submitting, setSubmitting] = useState(false);

const [content, setContent] = useState("");

const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
});

function validate() {

    if (!content.trim()) {

        setSnackbar({

            open: true,

            severity: "error",

            message: "Writing content is required.",

        });

        return false;

    }

    return true;

}

async function handleSubmit() {

    if (!validate()) {

        return;

    }

    try {

        setSubmitting(true);

        await submitWriting({

            lessonBlockId,

            content,

        });

        setSnackbar({

            open: true,

            severity: "success",

            message: "Writing submitted successfully.",

        });

    } catch (error: any) {

        const response = error.response?.data;

        setSnackbar({

            open: true,

            severity: "error",

            message:
                response?.message ??
                "Submit failed.",

        });

    } finally {

        setSubmitting(false);

    }

}