# Admin Job Moderation

## Goal

ให้ Admin ตรวจประกาศงานที่ Employer ส่งเข้าคิวได้จริง โดยอนุมัติให้เผยแพร่หรือปฏิเสธพร้อมเหตุผล และมี audit log ที่ตรวจสอบย้อนหลังได้

## Scope

- Admin ดูเฉพาะ Job ที่อยู่สถานะ `PENDING_REVIEW` และมี moderation status เป็น `PENDING`
- Approve: เปลี่ยน Job เป็น `PUBLISHED` และ moderation status เป็น `APPROVED` ใน transaction เดียว
- Reject: เปลี่ยน Job กลับเป็น `DRAFT`, moderation status เป็น `REJECTED` และบันทึกเหตุผลที่บังคับกรอก
- บันทึก actor, action, resource และ metadata ใน `audit_logs` transaction เดียวกับการเปลี่ยนสถานะ
- Admin UI มี loading, empty, error, retry และ action pending states

## Out of Scope

- ระงับ Company หรือ User
- แก้ไขเนื้อหา Job โดย Admin
- Email/notification ถึง Employer
- Audit viewer แบบค้นหา/กรองย้อนหลัง

## Acceptance Criteria

### AC-001 — Queue authorization

Given an authenticated Admin When it reads the moderation queue Then it receives only pending review jobs. Candidate, Employer และ unauthenticated request ต้องได้ 403/401 ตามลำดับ

### AC-002 — Approve

Given a pending review Job When Admin approves it Then Job status เป็น `PUBLISHED`, moderation status เป็น `APPROVED`, `publishedAt` และ moderation actor/time ถูกบันทึก และมี audit log `JOB_APPROVED`

### AC-003 — Reject with reason

Given a pending review Job When Admin rejects it without a valid reason Then request fails without mutation. เมื่อส่งเหตุผล 5–1000 ตัวอักษรแล้ว Job กลับเป็น `DRAFT`, เก็บเหตุผล และมี audit log `JOB_REJECTED`

### AC-004 — Idempotent conflict handling

Given a Job ที่ถูกตัดสินไปแล้ว When Admin ส่ง action ซ้ำ Then request ถูกปฏิเสธอย่างปลอดภัยและไม่สร้าง audit log ซ้ำ

### AC-005 — Employer resubmission

Given a rejected/draft Job When Employer edits and submits it again Then moderation reason/previous decision is cleared and Job กลับเข้า `PENDING_REVIEW`

### AC-006 — UI states

Given queue loading, empty, API failure or action in progress When Admin interacts with page Then state is communicated, duplicate action is disabled, and retry/recovery is available

## API Candidates

- `GET /api/admin/moderation/jobs`
- `PATCH /api/admin/moderation/jobs/:id` with `{ action: "approve" | "reject", reason?: string }`

## Decision Log

- D-301: ใช้ `moderation_status` แยกจาก `job.status` เพื่อไม่ให้สถานะ workflow กับผลตรวจสอบปะปนกัน
- D-302: Queue ใช้คู่เงื่อนไข `status=PENDING_REVIEW` และ `moderation_status=PENDING`; Admin approve จะ publish ใน transaction เดียว
- D-303: Reject ต้องมีเหตุผล 5–1000 ตัวอักษร และส่ง Job กลับ Draft เพื่อให้ Employer แก้ไขแล้ว resubmit
- D-304: Audit log เก็บ metadata แบบ JSON และสร้างใน transaction เดียวกับ moderation mutation
- D-305: ไม่มี demo Admin credential ใน source หรือ migration ใหม่; local verification ต้องสร้างบัญชี Admin ที่ควบคุมได้แยกต่างหาก

## Planned Test Cases

- TC-001: Admin queue returns pending jobs only; non-Admin is forbidden
- TC-002: Admin approves pending job and audit log is atomic
- TC-003: Reject requires reason and stores it with audit log
- TC-004: Repeated decision returns conflict without duplicate audit log
- TC-005: Employer can resubmit rejected job and clears prior moderation decision
- TC-006: UI loading, empty, retry, saving and double-submit states behave correctly
