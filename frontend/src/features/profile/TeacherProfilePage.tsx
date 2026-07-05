import { useEffect, useState } from "react";

import {
    Box,
    Button,
    Card,
    CardContent,
    TextField,
} from "@mui/material";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import { PageHeader } from "../../shared/components/PageHeader/PageHeader";
import { LoadingState } from "../../shared/components/LoadingState/LoadingState";
import AvatarUpload from "../../shared/components/AvatarUpload/AvatarUpload";

import {
    getMyTeacherProfile,
    updateMyTeacherProfile,
} from "./profileApi";

export default function TeacherProfilePage() {

    const [loading, setLoading] = useState(true);

    const [form, setForm] = useState({

        avatarUrl: "",

        fullName: "",

        email: "",

        phoneNumber: "",

        displayName: "",

        jlptGoal: "",

        bio: "",

    });

    useEffect(() => {

        loadProfile();

    }, []);

    async function loadProfile() {

        try {

            const profile = await getMyTeacherProfile();

            setForm({

                avatarUrl: profile.avatarUrl ?? "",

                fullName: profile.fullName ?? "",

                email: profile.email ?? "",

                phoneNumber: profile.phoneNumber ?? "",

                displayName: profile.displayName ?? "",

                jlptGoal: profile.jlptGoal ?? "",

                bio: profile.bio ?? "",

            });

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

        }

    }

    async function handleSave() {

        try {

            await updateMyTeacherProfile({

                fullName: form.fullName,

                phoneNumber: form.phoneNumber,

                avatarUrl: form.avatarUrl,

                displayName: form.displayName,

                jlptGoal: form.jlptGoal,

                bio: form.bio,

            });

            await loadProfile();

            alert("Profile updated successfully.");

        } catch (error) {

            console.error(error);

            alert("Update failed.");

        }

    }

    function handleChange(field: keyof typeof form) {

        return (
            event: React.ChangeEvent<HTMLInputElement>
        ) => {

            setForm({

                ...form,

                [field]: event.target.value,

            });

        };

    }

    function handleAvatar(file: File) {

        const preview = URL.createObjectURL(file);

        setForm({

            ...form,

            avatarUrl: preview,

        });

    }

    if (loading) {

        return (
            <LoadingState
                fullHeight
                message="Loading profile..."
            />
        );

    }

    return (

        <Box
            sx={{
                backgroundColor: "#F8FAFC",
                minHeight: "100vh",
                p: 4,
            }}
        >

            <PageHeader
                title="Manage Teacher Profile"
                breadcrumbs={[
                    {
                        label: "Teacher",
                    },
                    {
                        label: "Profile",
                    },
                ]}
            />

            <Card
                elevation={0}
                sx={{
                    maxWidth: 900,
                    mx: "auto",
                    borderRadius: 4,
                    border: "1px solid #E5E7EB",
                }}
            >

                <CardContent sx={{ p: 5 }}>

                    <AvatarUpload
                        avatarUrl={form.avatarUrl}
                        onSelect={handleAvatar}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Full Name"
                        value={form.fullName}
                        onChange={handleChange("fullName")}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Email"
                        value={form.email}
                        disabled
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Phone Number"
                        value={form.phoneNumber}
                        onChange={handleChange("phoneNumber")}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="Display Name"
                        value={form.displayName}
                        onChange={handleChange("displayName")}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        label="JLPT Goal"
                        value={form.jlptGoal}
                        onChange={handleChange("jlptGoal")}
                    />

                    <TextField
                        fullWidth
                        margin="normal"
                        multiline
                        rows={5}
                        label="Biography"
                        value={form.bio}
                        onChange={handleChange("bio")}
                    />

                    <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        startIcon={<SaveOutlinedIcon />}
                        sx={{
                            mt: 4,
                            height: 52,
                            borderRadius: 3,
                            textTransform: "none",
                            fontWeight: 600,
                        }}
                        onClick={handleSave}
                    >
                        Save Changes
                    </Button>

                </CardContent>

            </Card>

        </Box>

    );

}