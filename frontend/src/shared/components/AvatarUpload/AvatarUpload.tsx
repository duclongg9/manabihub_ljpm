import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import {
    Avatar,
    Box,
    Button,
} from "@mui/material";

interface AvatarUploadProps {

    avatarUrl: string;

    onSelect?: (
        file: File
    ) => void;

}

export default function AvatarUpload({

                                         avatarUrl,

                                         onSelect,

                                     }: AvatarUploadProps) {

    function handleChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {

        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        onSelect?.(file);

    }

    return (

        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 4,
            }}
        >

            <Avatar
                src={avatarUrl}
                sx={{
                    width: 120,
                    height: 120,
                }}
            />

            <Button
                component="label"
                variant="outlined"
                startIcon={<CameraAltOutlinedIcon />}
                sx={{
                    mt: 2,
                }}
            >

                Change Avatar

                <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                />

            </Button>

        </Box>

    );

}