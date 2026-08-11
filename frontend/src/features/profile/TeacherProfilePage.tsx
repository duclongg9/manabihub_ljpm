import {useEffect, useState} from "react";

import {Alert, Box, Button, Card, CardContent, Snackbar, TextField, Stack,} from "@mui/material";

import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";

import {PageHeader} from "../../shared/components/PageHeader/PageHeader";
import {LoadingState} from "../../shared/components/LoadingState/LoadingState";
import AvatarUpload from "../../shared/components/AvatarUpload/AvatarUpload";

import {avatarUploadErrorMessage, confirmTeacherPhoneVerification, getMyTeacherProfile, requestTeacherPhoneVerification, updateMyTeacherProfile, uploadAvatar} from "./profileApi";
import {resolvePublicAssetUrl} from "../../shared/utils/assetUtils";
import {PHONE_PATTERN, sanitizeOtpInput, sanitizePhoneInput} from "./phoneValidation";

export default function TeacherProfilePage() {

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);
    const [phoneVerified, setPhoneVerified] = useState(false);
    const [phoneCode, setPhoneCode] = useState("");
    const [phoneOtpSent, setPhoneOtpSent] = useState(false);
    const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
    const [confirmingPhoneOtp, setConfirmingPhoneOtp] = useState(false);
    const [initialPhoneNumber, setInitialPhoneNumber] = useState("");

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
            setPhoneVerified(profile.phoneVerified === true);
            setInitialPhoneNumber(profile.phoneNumber ?? "");
            setPhoneCode("");
            setPhoneOtpSent(false);

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

        if (!PHONE_PATTERN.test(form.phoneNumber)) {

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

        if (!phoneVerified && form.phoneNumber !== initialPhoneNumber) {
            setSnackbar({ open: true, message: "Hãy xác thực số điện thoại bằng mã SMS trước khi lưu.", severity: "error" });
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

    function validatePhone() {
        if (!PHONE_PATTERN.test(form.phoneNumber)) {
            setErrors(prev => ({ ...prev, phoneNumber: "Số điện thoại không hợp lệ." }));
            return false;
        }
        return true;
    }

    async function handleRequestPhoneOtp() {
        if (phoneVerified || !validatePhone()) return;
        try {
            setSendingPhoneOtp(true);
            await requestTeacherPhoneVerification(form.phoneNumber);
            setPhoneOtpSent(true);
            setSnackbar({ open: true, message: "Đã gửi mã xác thực SMS.", severity: "success" });
        } catch (error: any) {
            setSnackbar({ open: true, message: error.response?.data?.message ?? "Không thể gửi mã SMS.", severity: "error" });
        } finally {
            setSendingPhoneOtp(false);
        }
    }

    async function handleConfirmPhoneOtp() {
        if (phoneVerified || !validatePhone() || !/^\d{6}$/.test(phoneCode)) {
            setSnackbar({ open: true, message: "Mã xác thực phải gồm 6 chữ số.", severity: "error" });
            return;
        }
        try {
            setConfirmingPhoneOtp(true);
            await confirmTeacherPhoneVerification(form.phoneNumber, phoneCode);
            await loadProfile();
            setSnackbar({ open: true, message: "Số điện thoại đã được xác thực và khóa thay đổi.", severity: "success" });
        } catch (error: any) {
            setSnackbar({ open: true, message: error.response?.data?.message ?? "Mã xác thực không hợp lệ.", severity: "error" });
        } finally {
            setConfirmingPhoneOtp(false);
        }
    }

    function handleChange(field: keyof typeof form) {

        return (
            event: React.ChangeEvent<HTMLInputElement>
        ) => {

            const value = field === "phoneNumber"
                ? sanitizePhoneInput(event.target.value)
                : event.target.value;

            setForm({

                ...form,

                [field]: value,

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

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                label="Số điện thoại"
                                value={form.phoneNumber}
                                disabled={phoneVerified}
                                type="tel"
                                onChange={handleChange("phoneNumber")}
                                error={!!errors.phoneNumber}
                                helperText={errors.phoneNumber || (phoneVerified ? "Đã xác thực — không thể thay đổi số điện thoại." : "Bạn cần xác thực số điện thoại bằng SMS.")}
                                slotProps={{
                                    ...(phoneVerified ? { input: { endAdornment: <LockOutlinedIcon fontSize="small" /> } } : {}),
                                    htmlInput: { inputMode: "tel", maxLength: 12, autoComplete: "tel" },
                                }}
                            />
                            {!phoneVerified && (
                                <Button variant="outlined" onClick={handleRequestPhoneOtp} disabled={saving || sendingPhoneOtp || !form.phoneNumber} sx={{ minWidth: 150, height: 56, whiteSpace: "nowrap" }}>
                                    {sendingPhoneOtp ? "Đang gửi..." : "Gửi mã SMS"}
                                </Button>
                            )}
                        </Stack>
                        {!phoneVerified && phoneOtpSent && (
                            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1 }}>
                                <TextField size="small" label="Mã SMS 6 số" value={phoneCode} onChange={(event) => setPhoneCode(sanitizeOtpInput(event.target.value))} slotProps={{ htmlInput: { inputMode: "numeric", maxLength: 6 } }} />
                                <Button variant="contained" onClick={handleConfirmPhoneOtp} disabled={confirmingPhoneOtp || phoneCode.length !== 6} startIcon={<VerifiedUserOutlinedIcon />}>
                                    {confirmingPhoneOtp ? "Đang xác thực..." : "Xác thực"}
                                </Button>
                            </Stack>
                        )}

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
