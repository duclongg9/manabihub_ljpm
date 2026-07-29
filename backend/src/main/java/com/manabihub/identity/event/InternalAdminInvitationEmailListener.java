package com.manabihub.identity.event;

import com.manabihub.common.mail.EmailService;
import com.manabihub.identity.enums.RoleCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class InternalAdminInvitationEmailListener {

    private static final DateTimeFormatter EXPIRY_FORMAT =
            DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy")
                    .withZone(ZoneId.of("Asia/Ho_Chi_Minh"));

    private final EmailService emailService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendInvitation(InternalAdminInvitationIssuedEvent event) {
        String setupUrl = UriComponentsBuilder
                .fromUriString(frontendBaseUrl.replaceAll("/+$", ""))
                .path("/admin/setup-password")
                .fragment("token=" + event.rawToken())
                .build()
                .encode()
                .toUriString();
        String safeName = HtmlUtils.htmlEscape(event.fullName());
        String safeRole = HtmlUtils.htmlEscape(roleLabel(event.role()));
        String safeUrl = HtmlUtils.htmlEscape(setupUrl);
        String expiry = HtmlUtils.htmlEscape(EXPIRY_FORMAT.format(event.expiresAt()));

        String body = """
                <p>Xin chào %s,</p>
                <p>Bạn đã được mời tham gia Cổng quản trị ManabiHub với vai trò
                <strong>%s</strong>.</p>
                <p><a href="%s">Thiết lập mật khẩu quản trị</a></p>
                <p>Liên kết chỉ dùng được một lần và hết hạn lúc %s (giờ Việt Nam).
                Nếu bạn không mong đợi lời mời này, hãy bỏ qua email.</p>
                <p>ManabiHub không gửi mật khẩu qua email và không bao giờ yêu cầu
                bạn cung cấp mã mời cho người khác.</p>
                """.formatted(safeName, safeRole, safeUrl, expiry);

        emailService.sendEmail(
                event.email(),
                "Thiết lập tài khoản quản trị ManabiHub",
                body
        );
    }

    private String roleLabel(RoleCode role) {
        return switch (role) {
            case SYSTEM_ADMIN -> "Quản trị hệ thống";
            case COURSE_MANAGER -> "Quản lý khóa học";
            case FINANCE_MANAGER -> "Quản lý tài chính";
            default -> throw new IllegalArgumentException("Unsupported internal role");
        };
    }
}
