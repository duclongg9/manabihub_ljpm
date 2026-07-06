-- V011__seed_demo_notifications.sql
-- Mock notifications covering all types defined in frontend (PAYMENT, AI_FEEDBACK, REFUND, COURSE, SYSTEM)
-- For Student (d0000000-0000-0000-0000-000000000001)
-- For Teacher (d0000000-0000-0000-0000-000000000002)

-- 1. Student Notifications
INSERT INTO notifications (recipient_user_id, title, message, notification_type, is_read, created_at)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Thanh toÃ¡n thÃ nh cÃ´ng', 'Báº¡n Ä‘Ã£ thanh toÃ¡n thÃ nh cÃ´ng khoÃ¡ há»c "Tiáº¿ng Nháº­t N4 Cáº¥p tá»‘c" qua VNPay.', 'PAYMENT', false, NOW() - INTERVAL '1 hour'),
    ('d0000000-0000-0000-0000-000000000001', 'Pháº£n há»“i tá»« AI', 'AI Ä‘Ã£ nháº­n xÃ©t bÃ i phÃ¡t Ã¢m cá»§a báº¡n. CÃ³ 2 lá»—i cáº§n kháº¯c phá»¥c, hÃ£y vÃ o xem ngay.', 'AI_FEEDBACK', false, NOW() - INTERVAL '3 hours'),
    ('d0000000-0000-0000-0000-000000000001', 'Cáº­p nháº­t khoÃ¡ há»c', 'GiÃ¡o viÃªn vá»«a thÃªm bÃ i giáº£ng má»›i vÃ o khoÃ¡ "Giao tiáº¿p cÆ¡ báº£n".', 'COURSE', true, NOW() - INTERVAL '1 day'),
    ('d0000000-0000-0000-0000-000000000001', 'ThÃ´ng bÃ¡o há»‡ thá»‘ng', 'Há»‡ thá»‘ng sáº½ báº£o trÃ¬ tá»« 00:00 Ä‘áº¿n 02:00 ngÃ y mai.', 'SYSTEM', true, NOW() - INTERVAL '2 days'),
    ('d0000000-0000-0000-0000-000000000001', 'YÃªu cáº§u hoÃ n tiá»n Ä‘Æ°á»£c cháº¥p nháº­n', 'YÃªu cáº§u hoÃ n tiá»n khoÃ¡ há»c JLPT N5 cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c cháº¥p nháº­n vÃ  Ä‘ang xá»­ lÃ½.', 'REFUND', false, NOW() - INTERVAL '5 days');

-- 2. Teacher Notifications
INSERT INTO notifications (recipient_user_id, title, message, notification_type, is_read, created_at)
VALUES
    ('d0000000-0000-0000-0000-000000000002', 'KhoÃ¡ há»c Ä‘Ã£ Ä‘Æ°á»£c xuáº¥t báº£n', 'KhoÃ¡ há»c "Tiáº¿ng Nháº­t N3" cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c Admin phÃª duyá»‡t.', 'COURSE', false, NOW() - INTERVAL '30 minutes'),
    ('d0000000-0000-0000-0000-000000000002', 'Doanh thu thÃ¡ng 6', 'Báº¡n Ä‘Ã£ nháº­n Ä‘Æ°á»£c thanh toÃ¡n doanh thu khoÃ¡ há»c thÃ¡ng 6.', 'PAYMENT', true, NOW() - INTERVAL '1 day'),
    ('d0000000-0000-0000-0000-000000000002', 'Há»‡ thá»‘ng Ä‘Ã¡nh giÃ¡', 'TÃ­nh nÄƒng Ä‘Ã¡nh giÃ¡ bÃ i táº­p tá»± Ä‘á»™ng báº±ng AI Ä‘Ã£ Ä‘Æ°á»£c báº­t cho khoÃ¡ há»c cá»§a báº¡n.', 'SYSTEM', false, NOW() - INTERVAL '2 days');

-- 3. Admin Notifications (if needed by another view, using ID c0000000-0000-0000-0000-000000000001)
INSERT INTO notifications (recipient_admin_id, title, message, notification_type, is_read, created_at)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'YÃªu cáº§u hoÃ n tiá»n má»›i', 'Há»c viÃªn A yÃªu cáº§u hoÃ n tiá»n khoÃ¡ há»c N2. Vui lÃ²ng kiá»ƒm tra.', 'REFUND', false, NOW() - INTERVAL '2 hours'),
    ('c0000000-0000-0000-0000-000000000001', 'YÃªu cáº§u xuáº¥t báº£n khoÃ¡ há»c', 'GiÃ¡o viÃªn B vá»«a gá»­i yÃªu cáº§u xuáº¥t báº£n khoÃ¡ há»c má»›i.', 'COURSE', false, NOW() - INTERVAL '4 hours');
