# Job Expiration

## Goal

ทำให้ประกาศที่เผยแพร่หรือพักไว้และผ่านวันหมดอายุเปลี่ยนเป็น `EXPIRED` อย่างปลอดภัยและทำซ้ำได้ โดยไม่ต้องมี schema หรือ dependency ใหม่

## Scope

- เพิ่ม service `expireDueJobs` ที่เปลี่ยนเฉพาะ `PUBLISHED` และ `PAUSED` ซึ่ง `expiresAt <= now` เป็น `EXPIRED`
- บันทึก `JOB_EXPIRED` audit log ใน transaction เดียวกับการเปลี่ยนสถานะ
- เรียก expiration ก่อนอ่าน public jobs, public job detail และ Employer jobs เพื่อให้สถานะที่แสดงเป็นปัจจุบัน
- เพิ่ม Admin-only trigger สำหรับ maintenance/cron ภายหลัง
- ป้องกัน Admin approve งานที่หมดอายุแล้ว
- คง invariant เดิม: public search/detail และ apply ไม่อนุญาตงานหมดอายุ

## Out of Scope

- การเพิ่ม scheduler, queue หรือ external cron provider
- การส่ง notification เมื่อ job หมดอายุ
- การ expire งาน `DRAFT` หรือ `PENDING_REVIEW`; งาน pending ที่หมดอายุให้ Admin reject กลับ Draft เพื่อแก้ไขได้
- การแก้ไข migration/schema

## Decisions

- `PUBLISHED` และ `PAUSED` เป็นสถานะที่ระบบ expire อัตโนมัติ
- การเปลี่ยนสถานะใช้ `updateMany` แบบมีเงื่อนไข เพื่อให้ concurrent trigger และ retry ปลอดภัย
- `POST /api/admin/maintenance/expire-jobs` ใช้ server session และ role `ADMIN`; ยังไม่เปิด endpoint แบบ secret เพราะยังไม่มี scheduler requirement
- Read-path expiration เป็น best-effort heartbeat; Admin trigger ใช้สำหรับงาน maintenance ที่ต้องการกวาดข้อมูลทันที

## Acceptance Criteria

- AC-001: Job ที่เป็น `PUBLISHED` หรือ `PAUSED` และ `expiresAt` ถึงแล้วถูกเปลี่ยนเป็น `EXPIRED`
- AC-002: Job ที่ยังไม่ถึงวันหมดอายุ, `DRAFT`, `PENDING_REVIEW`, `CLOSED` หรือ `EXPIRED` ไม่ถูกเปลี่ยน
- AC-003: การเรียก expiration ซ้ำหรือพร้อมกันไม่ทำให้เกิดการเปลี่ยนซ้ำหรือ error ที่ไม่จำเป็น และคืนจำนวน row ที่เปลี่ยนจริง
- AC-004: Public search/detail และ Employer job list ไม่แสดงสถานะ active ที่หมดอายุค้างอยู่
- AC-005: Admin ที่ login แล้วเรียก maintenance endpoint ได้; unauthenticated/Candidate/Employer ถูกปฏิเสธ
- AC-006: Admin approve งานที่หมดอายุแล้วไม่ได้ และระบบไม่เปลี่ยนงานเป็น `PUBLISHED`
- AC-007: Apply งานที่หมดอายุยังถูกปฏิเสธ และการเปลี่ยนสถานะไม่เปิดข้อมูลภายในออกไป
- AC-008: ทุก Job ที่ถูก expire มี `JOB_EXPIRED` audit log หนึ่งรายการ พร้อม previous status

## API Candidate

- `POST /api/admin/maintenance/expire-jobs` → `{ expiredCount: number }`

## Edge Cases

- `expiresAt` เท่ากับเวลาปัจจุบันให้ถือว่าหมดอายุ (`<= now`)
- Job ที่ถูกปิดหรือหมดอายุไปแล้วไม่ถูกแตะต้อง
- Database failure ส่ง error ทั่วไปโดยไม่เปิดเผย SQL/details

## Implementation Readiness

- Database: skipped; no schema/index/config data change
- Backend: required
- Frontend: skipped; no user-facing page contract change
- Ready for implementation: Yes
