import {useEffect, useState} from "react";
import {Alert, Box, Button, Card, CardContent, Snackbar, TextField, Grid, Typography, Divider} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {PageHeader} from "../../shared/components/PageHeader/PageHeader";
import {LoadingState} from "../../shared/components/LoadingState/LoadingState";
import AvatarUpload from "../../shared/components/AvatarUpload/AvatarUpload";
import {getMyStudentProfile, updateMyStudentProfile, uploadAvatar} from "./profileApi";
import {resolvePublicAssetUrl} from "../../shared/utils/assetUtils";

const JLPT_LEVELS = [
    { level: "N5", label: "N5 • 初級" },
    { level: "N4", label: "N4 • 初中級" },
    { level: "N3", label: "N3 • 中級" },
    { level: "N2", label: "N2 • 準上級" },
    { level: "N1", label: "N1 • 上級" }
];

export default function StudentProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
    const [errors, setErrors] = useState({ fullName: "", phoneNumber: "" });
    const [form, setForm] = useState({ avatarUrl: "", fullName: "", email: "", phoneNumber: "", displayName: "", jlptGoal: "" });
    const [initialForm, setInitialForm] = useState({ avatarUrl: "", fullName: "", email: "", phoneNumber: "", displayName: "", jlptGoal: "" });

    useEffect(() => {
        loadProfile();
    }, []);

    async function loadProfile() {
        try {
            const profile = await getMyStudentProfile();
            const profileData = {
                avatarUrl: profile.avatarUrl ?? "",
                fullName: profile.fullName ?? "",
                email: profile.email ?? "",
                phoneNumber: profile.phoneNumber ?? "",
                displayName: profile.displayName ?? "",
                jlptGoal: profile.jlptGoal ?? "",
            };
            setForm(profileData);
            setInitialForm(profileData);
        } catch (error) {
            console.error(error);
            setSnackbar({ open: true, message: "Không thể tải hồ sơ.", severity: "error" });
        } finally {
            setLoading(false);
        }
    }

    const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

    function validate() {
        const newErrors = { fullName: "", phoneNumber: "" };
        let valid = true;
        if (!form.fullName.trim()) {
            newErrors.fullName = "Họ và tên là bắt buộc.";
            valid = false;
        }
        const phoneRegex = /^(0\d{9}|\+84\d{9})$/;
        if (form.phoneNumber && !phoneRegex.test(form.phoneNumber)) {
            newErrors.phoneNumber = "Số điện thoại không hợp lệ.";
            valid = false;
        }
        setErrors(newErrors);
        return valid;
    }

    async function handleSave() {
        if (!validate()) return;
        try {
            setSaving(true);
            await updateMyStudentProfile({
                fullName: form.fullName,
                phoneNumber: form.phoneNumber,
                displayName: form.displayName,
                jlptGoal: form.jlptGoal,
            });
            await loadProfile();
            setSnackbar({ open: true, message: "Đã cập nhật hồ sơ thành công.", severity: "success" });
        } catch (error: any) {
            console.error(error);
            const response = error.response?.data;
            if (response?.messageCode === "MSG-PRO-002") {
                setErrors((prev) => ({ ...prev, phoneNumber: response.message }));
            }
            setSnackbar({ open: true, message: response?.message ?? "Cập nhật thất bại.", severity: "error" });
        } finally {
            setSaving(false);
        }
    }

    function handleChange(field: keyof typeof form) {
        return (event: React.ChangeEvent<HTMLInputElement>) => {
            setForm({ ...form, [field]: event.target.value });
            if (field === "fullName") setErrors((prev) => ({ ...prev, fullName: "" }));
            if (field === "phoneNumber") setErrors((prev) => ({ ...prev, phoneNumber: "" }));
        };
    }

    async function handleAvatar(file: File) {
        if (file.size > 2 * 1024 * 1024) {
            setSnackbar({ open: true, message: "Kích thước file vượt quá 2MB", severity: "error" });
            return;
        }
        const validTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!validTypes.includes(file.type)) {
            setSnackbar({ open: true, message: "Định dạng không hợp lệ. Chỉ nhận JPEG, PNG, WebP", severity: "error" });
            return;
        }
        const previousAvatarUrl = form.avatarUrl;
        const preview = URL.createObjectURL(file);
        setForm(prev => ({ ...prev, avatarUrl: preview }));
        try {
            setSaving(true);
            const serverUrl = await uploadAvatar(file);
            setForm(prev => ({ ...prev, avatarUrl: serverUrl }));
            // We should also update the profile with the new avatarUrl
            await updateMyStudentProfile({
                fullName: form.fullName,
                phoneNumber: form.phoneNumber,
                displayName: form.displayName,
                jlptGoal: form.jlptGoal,
                avatarUrl: serverUrl,
            } as any); // Type cast since updateMyStudentProfile param type might not have avatarUrl yet
            
            setInitialForm(prev => ({ ...prev, avatarUrl: serverUrl }));
            
            setSnackbar({ open: true, message: "Tải ảnh đại diện thành công", severity: "success" });
        } catch (error) {
            console.error("Avatar upload failed:", error);
            setForm(prev => ({ ...prev, avatarUrl: previousAvatarUrl }));
            setSnackbar({ open: true, message: "Lỗi tải ảnh đại diện", severity: "error" });
        } finally {
            setSaving(false);
            URL.revokeObjectURL(preview);
        }
    }

    if (loading) return <LoadingState fullHeight message="Đang tải hồ sơ..." />;

    return (
        <>
            <Box component="main" sx={{ bgcolor: "#FAF9F6", minHeight: "100vh", py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
                <Box sx={{ maxWidth: '1280px', mx: 'auto', width: '100%', position: 'relative' }}>
                {/* Background Watermark */}
                <Typography variant="h1" sx={{ position: 'absolute', top: -40, right: -20, fontSize: '15rem', fontWeight: 900, color: 'rgba(0,0,0,0.025)', userSelect: 'none', pointerEvents: 'none', zIndex: 0, writingMode: 'vertical-rl' }}>
                  精進
                </Typography>
                <PageHeader
                    title="Hồ sơ cá nhân"
                    subtitle="プロフィール設定"
                    watermark="精進"
                    breadcrumbs={[
                        {label: "Học viên"},
                        {label: "Hồ sơ"},
                    ]}
                />
                
                <Typography color="text.secondary" sx={{ mb: 4, mt: -2 }}>
                    Cập nhật thông tin tài khoản và thiết lập học tập của bạn.
                </Typography>

                <Grid container spacing={4}>
                    {/* Left Card - Avatar & Status */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Card elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRadius: 4, border: "1px solid", borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', bgcolor: '#FFFFFF', textAlign: 'center', p: 4 }}>
                            <AvatarUpload
                                avatarUrl={resolvePublicAssetUrl(form.avatarUrl) || ""}
                                onSelect={handleAvatar}
                                disabled={saving}
                            />
                            <Typography variant="h6" sx={{ fontWeight: 700, mt: 2 }}>
                                {form.displayName || form.fullName || "Học viên ManabiHub"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                {form.email}
                            </Typography>
                            
                            <Divider sx={{ my: 3 }} />
                            
                            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>
                                Mục tiêu hiện tại
                            </Typography>
                            <Box sx={{ display: 'inline-block', px: 2, py: 0.5, bgcolor: '#fee2e2', color: '#C41E3A', borderRadius: 2, fontWeight: 800, fontSize: '1.25rem' }}>
                                {initialForm.jlptGoal || "Chưa thiết lập"}
                            </Box>
                            
                            <Divider sx={{ my: 3 }} />
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary">
                                    Ngày tham gia: 24/07/2026
                                </Typography>
                            </Box>
                        </Card>
                    </Grid>

                    {/* Right Card - Profile Form */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Card elevation={0} sx={{ borderRadius: 4, border: "1px solid", borderColor: 'divider', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', bgcolor: '#FFFFFF' }}>
                            <CardContent sx={{ p: { xs: 3, md: 5 } }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                        Thông tin cá nhân
                                    </Typography>
                                    {isDirty && (
                                        <Typography variant="caption" sx={{ color: '#C41E3A', fontWeight: 700 }}>
                                            * BẠN CÓ THAY ĐỔI CHƯA LƯU
                                        </Typography>
                                    )}
                                </Box>
                                
                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Họ và tên (*)"
                                            value={form.fullName}
                                            onChange={handleChange("fullName")}
                                            error={!!errors.fullName}
                                            helperText={errors.fullName}
                                            sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C41E3A' } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Tên hiển thị"
                                            value={form.displayName}
                                            onChange={handleChange("displayName")}
                                            placeholder="Tên gọi ngắn gọn..."
                                            sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C41E3A' } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            value={form.email}
                                            disabled
                                            sx={{ bgcolor: 'grey.50' }}
                                            helperText="🔒 Email đăng nhập - Không thể thay đổi"
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField
                                            fullWidth
                                            label="Số điện thoại"
                                            value={form.phoneNumber}
                                            onChange={handleChange("phoneNumber")}
                                            error={!!errors.phoneNumber}
                                            helperText={errors.phoneNumber}
                                            sx={{ '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#C41E3A' } }}
                                        />
                                    </Grid>
                                </Grid>

                                <Divider sx={{ my: 5 }} />

                                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                                    Mục tiêu JLPT
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Chọn cấp độ JLPT bạn muốn chinh phục trong năm nay:
                                </Typography>
                                
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 5 }}>
                                    {JLPT_LEVELS.map(({ level, label }) => {
                                        const isSelected = form.jlptGoal === level;
                                        return (
                                            <Box
                                                key={level}
                                                onClick={() => setForm(prev => ({ ...prev, jlptGoal: level }))}
                                                sx={{
                                                    px: 4,
                                                    py: 2,
                                                    borderRadius: 3,
                                                    border: '2px solid',
                                                    borderColor: isSelected ? '#C41E3A' : 'grey.200',
                                                    bgcolor: isSelected ? '#fff1f2' : 'transparent',
                                                    color: isSelected ? '#C41E3A' : 'text.secondary',
                                                    fontWeight: isSelected ? 800 : 500,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        borderColor: isSelected ? '#C41E3A' : 'grey.400',
                                                        transform: 'translateY(-2px)'
                                                    }
                                                }}
                                            >
                                                {label}
                                            </Box>
                                        );
                                    })}
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button
                                        variant="outlined"
                                        size="large"
                                        disabled={saving || !isDirty}
                                        onClick={() => {
                                            setForm(initialForm);
                                            setErrors({ fullName: "", phoneNumber: "" });
                                        }}
                                        sx={{
                                            px: 4,
                                            borderRadius: 2,
                                            textTransform: "none",
                                            fontWeight: 600,
                                            color: 'text.secondary',
                                            borderColor: 'grey.300',
                                            '&:hover': { bgcolor: 'grey.50', borderColor: 'grey.400' }
                                        }}
                                    >
                                        Hủy
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        disabled={saving || !isDirty}
                                        startIcon={<SaveOutlinedIcon/>}
                                        sx={{
                                            px: 4,
                                            borderRadius: 2,
                                            textTransform: "none",
                                            fontWeight: 600,
                                            bgcolor: '#C41E3A',
                                            '&:hover': { bgcolor: '#a01830' },
                                            '&.Mui-disabled': { bgcolor: 'grey.300', color: 'grey.500' }
                                        }}
                                        onClick={handleSave}
                                    >
                                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                                    </Button>
                                </Box>

                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
                </Box>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}
