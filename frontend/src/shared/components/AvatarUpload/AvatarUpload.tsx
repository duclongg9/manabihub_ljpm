import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import {Avatar, Box, Button,} from "@mui/material";

interface AvatarUploadProps {

    avatarUrl: string;

    onSelect?: (
        file: File
    ) => void;

    disabled?: boolean;
    label?: string;
}

export default function AvatarUpload({

                                         avatarUrl,
                                         onSelect,
                                         disabled = false,
                                         label = "Change Avatar",
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
                    boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.1), 0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
            />

            <Button
                component="label"
                variant="outlined"
                startIcon={<CameraAltOutlinedIcon/>}
                disabled={disabled}
                sx={{
                    mt: 2,
                }}
            >

                {label}

                <input
                    hidden
                    type="file"
                    accept="image/*"
                    disabled={disabled}
                    onChange={handleChange}
                />

            </Button>

        </Box>

    );

}
