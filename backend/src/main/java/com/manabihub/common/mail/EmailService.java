package com.manabihub.common.mail;

public interface EmailService {

    /**
     * Send a notification email.
     *
     * @param to      recipient email address
     * @param subject email subject
     * @param body    email body
     */
    void sendEmail(String to, String subject, String body);
}
