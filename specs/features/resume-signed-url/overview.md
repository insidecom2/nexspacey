# Resume Signed URL

## Goal

ให้ Employer ขอ URL ชั่วคราวสำหรับดาวน์โหลด Resume ได้ หลังระบบตรวจสอบสิทธิ์ความเป็นสมาชิกบริษัทของใบสมัครแล้ว โดยไม่ส่ง session cookie ไปกับ URL ที่นำไปเปิดดาวน์โหลด

## Scope

- เพิ่ม service สำหรับสร้างและตรวจ HMAC-signed token ที่ผูกกับ `applicationId` และ `expiresAt`
- เพิ่ม endpoint สำหรับ Employer ขอ signed URL โดยตรวจ company ownership ก่อน
- เพิ่ม endpoint สำหรับดาวน์โหลดผ่าน signed token โดยไม่ต้องมี session cookie
- ปรับปุ่มดาวน์โหลดในหน้า Employer ให้ขอ URL ก่อนดาวน์โหลด และแสดง loading/error state
- เพิ่มค่า `RESUME_SIGNING_SECRET` ใน `.env.example`; local development ใช้ fallback เฉพาะเมื่อไม่ใช่ production เพื่อไม่ให้ flow เดิมหยุดทำงาน
- คง endpoint `/api/employer/applications/:id/resume` เดิมไว้และคง session/ownership check

## Out of Scope

- ย้ายไฟล์จาก PostgreSQL ไป Cloudflare R2/S3
- malware scanning, bucket policy หรือ object-storage credentials
- การเพิกถอน token รายตัวก่อนหมดอายุ
- การเปิดให้ candidate หรือ public user ขอ signed URL

## Actors and Flow

1. Employer ที่ login แล้วเรียก `GET /api/employer/applications/:id/resume-url`
2. Server ตรวจ role และตรวจว่า application อยู่ใน company ของ Employer
3. Server ส่ง relative URL พร้อม `expiresAt` กลับไป
4. Browser เปิด `GET /api/resumes/download?token=...`
5. Server ตรวจ signature, application id และอายุ token แล้วอ่าน Resume ผ่าน application service

## Acceptance Criteria

- AC-001: Employer ที่เป็นสมาชิกบริษัทเจ้าของใบสมัครได้รับ signed URL และวันหมดอายุไม่เกิน 60 วินาทีจากเวลาสร้าง
- AC-002: ผู้ที่ไม่มี session, เป็น Candidate หรือเป็น Employer คนละบริษัทไม่สามารถขอ signed URL ได้
- AC-003: Signed URL ที่มี token ถูกต้องดาวน์โหลดไฟล์ได้โดยไม่ต้องมี session cookie และ response มี `Cache-Control: private, no-store` กับ `X-Content-Type-Options: nosniff`
- AC-004: token ที่ถูกแก้ไข, ไม่มี token, รูปแบบไม่ถูกต้อง หรือหมดอายุ ถูกปฏิเสธโดยไม่อ่านข้อมูล Resume
- AC-005: การดาวน์โหลดผ่าน endpoint เดิมยังตรวจ session และ company ownership และยังทำงานได้
- AC-006: ปุ่มดาวน์โหลดแสดงสถานะกำลังเตรียมไฟล์, ป้องกันการกดซ้ำ และแสดงข้อผิดพลาดที่ retry ได้
- AC-007: ระบบไม่ใส่เนื้อหา Resume หรือ secret ลงใน URL/token/log; token มีเพียง application id และ expiry ที่เซ็นแล้ว

## Error Contract

- `401`: ไม่มี session สำหรับ endpoint ขอ URL หรือ token ไม่ถูกต้อง/หมดอายุสำหรับ endpoint download
- `403`: role หรือ company ownership ไม่ผ่านสำหรับ endpoint ขอ URL
- `404`: application id ไม่พบ/รูปแบบ id ไม่ถูกต้องสำหรับ endpoint ที่อิง application
- `500`: signing secret/configuration หรือ storage/database ผิดพลาด โดยไม่เปิดเผยรายละเอียดภายใน

## Decisions and Risks

- ใช้ HMAC-SHA256 จาก `node:crypto` ไม่เพิ่ม dependency
- ใช้ `RESUME_SIGNING_SECRET`; production ที่ไม่มี secret ต้อง fail closed ส่วน development มี deterministic fallback เพื่อให้ local MVP รันได้
- Token เป็น bearer token และ replay ได้ภายใน 60 วินาที; การย้ายไป object storage signed URL และ revoke รายตัวเป็นงาน hardening ภายหลัง
- Database stage: skipped; ไม่มี schema/index/seed เปลี่ยน

## Planned Test Cases

- Employer owner/member ขอ URL สำเร็จและดาวน์โหลดโดยไม่ใช้ cookie
- Candidate, unauthenticated user และ Employer ต่างบริษัทถูกปฏิเสธ
- token ถูกแก้ไข, หมดอายุ, หาย หรือ malformed ถูกปฏิเสธ
- endpoint เดิมยังดาวน์โหลดได้เมื่อ ownership ถูกต้องและปฏิเสธเมื่อไม่ถูกต้อง
- UI แสดง pending/error และไม่ยิงคำขอซ้ำระหว่างรอ
