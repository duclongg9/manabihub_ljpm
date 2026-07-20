-- V023__seed_test_courses.sql
INSERT INTO courses (
    id, teacher_id, title, slug, description, level_code, category,
    thumbnail_url, price, currency, status, ai_supported, published_at, average_rating
) VALUES
('f9000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002', 'Khóa học N2 Chuyên sâu', 'khoa-hoc-n2-chuyen-sau', 'Master N2 trong 3 tháng với phương pháp độc quyền.', 'N2', 'JLPT_PRACTICE', 'https://images.unsplash.com/photo-1542385151-efd9000785a0?w=800', 500000, 'VND', 'PUBLISHED', TRUE, NOW(), 4.8),

('f9000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'Từ vựng N3 siêu tốc', 'tu-vung-n3-sieu-toc', 'Học 2000 từ vựng N3 cực nhanh chỉ trong 30 ngày.', 'N3', 'VOCABULARY', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800', 250000, 'VND', 'PUBLISHED', FALSE, NOW(), 3.5),

('f9000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'Ngữ pháp N4 dễ hiểu', 'ngu-phap-n4-de-hieu', 'Nắm vững toàn bộ ngữ pháp N4 một cách logic và dễ nhớ.', 'N4', 'GRAMMAR', 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800', 100000, 'VND', 'PUBLISHED', FALSE, NOW(), 4.2),

('f9000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'Hội thoại N5 hàng ngày', 'hoi-thoai-n5-hang-ngay', 'Tự tin giao tiếp tiếng Nhật cơ bản với 100 mẫu câu thông dụng.', 'N5', 'SPEAKING', 'https://images.unsplash.com/photo-1528696892704-5e1122852276?w=800', 0, 'VND', 'PUBLISHED', FALSE, NOW(), 5.0);
