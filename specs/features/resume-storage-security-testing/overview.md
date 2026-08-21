# Resume Storage, Malware Scanning and Automated Tests

## Goal

ทำให้ Resume รองรับ private Cloudflare R2, ตรวจ malware ก่อนสร้าง record และมี automated tests สำหรับ security-critical behavior โดยยังให้ local MVP ใช้ PostgreSQL fallback ได้

## Decisions and Assumptions

- R2 ใช้ S3-compatible API ผ่าน `@aws-sdk/client-s3`; bucket ไม่เปิด public และแอปอ่านไฟล์ผ่าน server-side credentials เท่านั้น
- `RESUME_STORAGE_PROVIDER=postgres` ใช้ local development; production ที่ไม่กำหนด provider หรือกำหนดค่าไม่ครบจะ fail closed
- Malware scanner ใช้ ClamAV `clamd` ผ่าน `INSTREAM`; local/test ใช้ `disabled` ได้ แต่ production ต้องใช้ `clamav`
- ใช้ Vitest เป็น test runner โดยไม่เพิ่ม E2E browser framework ใน slice นี้
- Resume เดิมถูก mark เป็น `postgres` และยังอ่านได้หลัง migration; Resume R2 เก็บ `content = NULL` และมี checksum

## Scope

- reversible migration: nullable content, storage provider, checksum และ index
- R2 put/get/delete adapter และ configuration validation
- ClamAV scanner adapter, timeout และ fail-closed errors
- upload flow: validate → scan → store → create metadata, cleanup R2 object เมื่อ DB create ล้มเหลว
- download flow: read provider and verify checksum
- Vitest config, scripts และ unit tests สำหรับ token, validation และ scanner config

## Acceptance Criteria

- AC-001: เมื่อ provider เป็น `postgres`, upload/read legacy flow ยังทำงานได้
- AC-002: เมื่อ provider เป็น `r2`, upload เก็บ object private และ DB เก็บ provider/key/checksum โดยไม่เก็บ content
- AC-003: R2 configuration ไม่ครบหรือ production ไม่มี R2 provider ทำให้ upload fail closed
- AC-004: Resume ถูก scan ก่อน persistence; malware หรือ scanner unavailable ไม่สร้าง Resume row
- AC-005: Production scanner ต้องเป็น ClamAV และ timeout/error ไม่ถูกแปลงเป็น success
- AC-006: Download อ่านจาก provider ตาม row และ reject เมื่อ checksum ไม่ตรง
- AC-007: Migration deploy สำเร็จและ down migration ปฏิเสธอย่างปลอดภัยหากยังมี R2 rows
- AC-008: `npm run test` รันผ่านและครอบคลุม token tamper/expiry, file signature และ scanner mode

## API Impact

- Existing `POST /api/profile/resumes` keeps its contract; errors add `503` when scanner is unavailable
- Existing employer Resume routes keep their contract; backend storage source becomes provider-aware

## Non-goals

- live R2 credential provisioning or bucket policy API calls
- live ClamAV service provisioning
- malware signature database management
- browser E2E test runner

## Verification Plan

- `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`
- Prisma migration status and `information_schema` checks on PostgreSQL `localhost:5435`
- local provider compatibility integration; live R2/ClamAV marked environment-dependent when credentials/services are absent
