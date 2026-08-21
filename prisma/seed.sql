INSERT INTO "jobs" ("id", "title", "company_name", "location", "description", "status", "published_at", "expires_at", "updated_at")
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Frontend Developer (React)', 'Baan Software', 'กรุงเทพฯ', 'ร่วมพัฒนา web application หลักของบริษัทด้วย React และ TypeScript', 'PUBLISHED', CURRENT_TIMESTAMP, '2027-01-01T00:00:00Z', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000002', 'Backend Engineer (Go)', 'Fintopia Thailand', 'กรุงเทพฯ', 'ออกแบบและพัฒนา service สำหรับผลิตภัณฑ์สินเชื่อดิจิทัล', 'PUBLISHED', CURRENT_TIMESTAMP, '2027-01-01T00:00:00Z', CURRENT_TIMESTAMP),
  ('00000000-0000-0000-0000-000000000003', 'Product Designer', 'Nimbus Studio', 'เชียงใหม่ / Remote', 'ออกแบบประสบการณ์ผู้ใช้ให้ผลิตภัณฑ์ดิจิทัล', 'PUBLISHED', CURRENT_TIMESTAMP, '2027-01-01T00:00:00Z', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE SET
  "title" = EXCLUDED."title",
  "company_name" = EXCLUDED."company_name",
  "location" = EXCLUDED."location",
  "description" = EXCLUDED."description",
  "status" = EXCLUDED."status",
  "published_at" = EXCLUDED."published_at",
  "expires_at" = EXCLUDED."expires_at",
  "updated_at" = CURRENT_TIMESTAMP;
