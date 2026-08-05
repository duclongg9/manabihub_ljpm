import {useEffect, useState} from "react";

import {Alert, Box, Button, Card, CardContent, Snackbar, TextField,} from "@mui/material";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";

import {PageHeader} from "../../shared/components/PageHeader/PageHeader";
import {LoadingState} from "../../shared/components/LoadingState/LoadingState";
import AvatarUpload from "../../shared/components/AvatarUpload/AvatarUpload";

import {avatarUploadErrorMessage, getMyTeacherProfile, updateMyTeacherProfile, uploadAvatar} from "./profileApi";
import {resolvePublicAssetUrl} from "../../shared/utils/assetUtils";

export default function TeacherProfilePage() {

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

            setSnackbar({

                open: true,

                message: "Không thể tải hồ sơ. Vui lòng thử lại.",

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

            newErrors.fullName = "Vui lòng nhập họ và tên.";

            valid = false;

        }

        const phoneRegex = /^(0\d{9}|\+84\d{9})$/;

        if (!phoneRegex.test(form.phoneNumber)) {

            newErrors.phoneNumber = "Số điện thoại không hợp lệ.";

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

            await updateMyTeacherProfile({

                fullName: form.fullName,

                phoneNumber: form.phoneNumber,

                displayName: form.displayName,

                jlptGoal: form.jlptGoal,

                bio: form.bio,

            });

            await loadProfile();

            setSnackbar({

                open: true,

                message: "Cập nhật hồ sơ thành công.",

                severity: "success",

            });

        } catch (error: any) {

            console.error(error);

            const response = error.response?.data;

            if (response?.messageCode === "MSG-PRO-002") {

                setErrors(prev => ({

                    ...prev,

                    phoneNumber: response.message,

                }));

            }

            setSnackbar({

                open: true,

                message: response?.message ?? "Không thể cập nhật hồ sơ. Vui lòng thử lại.",

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

                setErrors(prev => ({

                    ...prev,

                    fullName: "",

                }));

            }

            if (field === "phoneNumber") {

                setErrors(prev => ({

                    ...prev,

                    phoneNumber: "",

                }));

            }

        };

    }

    async function handleAvatar(file: File) {
        if (file.size > 2 * 1024 * 1024) {
            setSnackbar({ open: true, message: "Dung lượng ảnh không được vượt quá 2 MB.", severity: "error" });
            return;
        }

        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            setSnackbar({ open: true, message: "Định dạng không hợp lệ. Chỉ hỗ trợ ảnh JPEG, PNG và WebP.", severity: "error" });
            return;
        }

        const previousAvatarUrl = form.avatarUrl;
        const preview = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, avatarUrl: preview }));

        try {
            setSaving(true);
            const serverUrl = await uploadAvatar(file);
            setForm(prev => ({ ...prev, avatarUrl: serverUrl }));
            setSnackbar({ open: true, message: "Cập nhật ảnh đại diện thành công.", severity: "success" });
        } catch (error) {
            console.error("Avatar upload failed:", error);
            setForm(prev => ({ ...prev, avatarUrl: previousAvatarUrl }));
            setSnackbar({ open: true, message: avatarUploadErrorMessage(error), severity: "error" });
        } finally {
            setSaving(false);
            URL.revokeObjectURL(preview);
        }
    }

    if (loading) {

        return (

            <LoadingState

                fullHeight

                message="Đang tải hồ sơ..."

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
                    title="Quản lý hồ sơ giảng viên"
                    breadcrumbs={[
                        {
                            label: "Giảng viên",
                        },
                        {
                            label: "Hồ sơ",
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

                    <CardContent
                        sx={{
                            p: 5,
                        }}
                    >

                        <AvatarUpload
                            avatarUrl={resolvePublicAssetUrl(form.avatarUrl) || ""}
                            onSelect={handleAvatar}
                            disabled={saving}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Họ và tên"
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
                            label="Số điện thoại"
                            value={form.phoneNumber}
                            onChange={handleChange("phoneNumber")}
                            error={!!errors.phoneNumber}
                            helperText={errors.phoneNumber}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Tên hiển thị"
                            value={form.displayName}
                            onChange={handleChange("displayName")}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            label="Mục tiêu JLPT"
                            value={form.jlptGoal}
                            onChange={handleChange("jlptGoal")}
                        />

                        <TextField
                            fullWidth
                            margin="normal"
                            multiline
                            rows={5}
                            label="Tiểu sử"
                            value={form.bio}
                            onChange={handleChange("bio")}
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

                            {saving ? "Đang lưu..." : "Lưu thay đổi"}

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
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >

                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                        width: "100%",
                    }}
                >

                    {snackbar.message}

                </Alert>

            </Snackbar>

        </>

    );

}
