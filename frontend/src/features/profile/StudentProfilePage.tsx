import {useEffect, useState} from "react";

import {Alert, Box, Button, Card, CardContent, Snackbar, TextField,} from "@mui/material";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import {PageHeader} from "../../shared/components/PageHeader/PageHeader";
import {LoadingState} from "../../shared/components/LoadingState/LoadingState";
import AvatarUpload from "../../shared/components/AvatarUpload/AvatarUpload";

import {getMyStudentProfile, updateMyStudentProfile,} from "./profileApi";

export default function StudentProfilePage() {

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success" as "success" | "error",
    });

    const [errors, setErrors] = useState({
        fullName: "",
        phoneNumber: "",
    });

    const [form, setForm] = useState({

        avatarUrl: "",

        fullName: "",

        email: "",

        phoneNumber: "",

        displayName: "",

        jlptGoal: "",

    });

    useEffect(() => {

        loadProfile();

    }, []);

    async function loadProfile() {

        try {

            const profile = await getMyStudentProfile();

            setForm({

                avatarUrl: profile.avatarUrl ?? "",

                fullName: profile.fullName ?? "",

                email: profile.email ?? "",

                phoneNumber: profile.phoneNumber ?? "",

                displayName: profile.displayName ?? "",

                jlptGoal: profile.jlptGoal ?? "",

            });

        } catch (error) {

            console.error(error);

            setSnackbar({
                open: true,
                message: "Cannot load profile.",
                severity: "error",
            });

        } finally {

            setLoading(false);

        }

    }

    function validate() {

        const newErrors = {

            fullName: "",

            phoneNumber: "",

        };

        let valid = true;

        if (!form.fullName.trim()) {

            newErrors.fullName = "Full name is required.";

            valid = false;

        }

        const phoneRegex = /^(0\d{9}|\+84\d{9})$/;

        if (!phoneRegex.test(form.phoneNumber)) {

            newErrors.phoneNumber = "Invalid phone number.";

            valid = false;

        }

        setErrors(newErrors);

        return valid;

    }

    async function handleSave() {

        if (!validate()) {

            return;

        }

        try {

            setSaving(true);

            await updateMyStudentProfile({

                fullName: form.fullName,

                phoneNumber: form.phoneNumber,

                avatarUrl: form.avatarUrl,

                displayName: form.displayName,

                jlptGoal: form.jlptGoal,

            });

            await loadProfile();

            setSnackbar({

                open: true,

                message: "Profile updated successfully.",

                severity: "success",

            });

        } catch (error: any) {

            console.error(error);

            const response = error.response?.data;

            if (response?.messageCode === "MSG-PRO-002") {

                setErrors((prev) => ({

                    ...prev,

                    phoneNumber: response.message,

                }));

            }

            setSnackbar({

                open: true,

                message: response?.message ?? "Update failed.",

                severity: "error",

            });

        } finally {

            setSaving(false);

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

            if (field === "fullName") {

                setErrors((prev) => ({

                    ...prev,

                    fullName: "",

                }));

            }

            if (field === "phoneNumber") {

                setErrors((prev) => ({

                    ...prev,

                    phoneNumber: "",

                }));

            }

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

        <>

            <Box
                sx={{
                    backgroundColor: "#F8FAFC",
                    minHeight: "100vh",
                    p: 4,
                }}
            >

                <PageHeader
                    title="Manage Profile"
                    breadcrumbs={[
                        {label: "Student"},
                        {label: "Profile"},
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

                    <CardContent sx={{p: 5}}>

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
                            error={!!errors.fullName}
                            helperText={errors.fullName}
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
                            error={!!errors.phoneNumber}
                            helperText={errors.phoneNumber}
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

                        <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={saving}
                            startIcon={<SaveOutlinedIcon/>}
                            sx={{
                                mt: 4,
                                height: 52,
                                borderRadius: 3,
                                textTransform: "none",
                                fontWeight: 600,
                            }}
                            onClick={handleSave}
                        >
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>

                    </CardContent>

                </Card>

            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() =>
                    setSnackbar({
                        ...snackbar,
                        open: false,
                    })
                }
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </>

    );

}
