# CLAUDE.md — Job Platform

Full product & architecture detail: [`job-platform-architecture.md`](./specs/design/job-platform-architecture.md).
This file is the working contract. If the two disagree, the brief wins — and update this file.

## What we are building

แพลตฟอร์มหางาน full-stack Next.js. ผู้ใช้หลัก: **Candidate** (ค้นหา/บันทึก/สมัครงาน), **Employer** (ลงประกาศ/จัดการผู้สมัคร), **Admin** (ตรวจสอบประกาศ, จัดการรายงาน).

เป้าหมายรอบแรก: Candidate ค้นหาและสมัครงานได้จริง และ Employer ลงประกาศพร้อมจัดการผู้สมัครได้ครบ end-to-end.

## Architecture

**Modular Monolith บน Next.js** — ไม่ใช่ microservices.

```
Next.js UI → Route Handlers / Server Actions → Application Services → Domain Modules → Infrastructure (PostgreSQL, Object Storage, Email, Jobs)
```

- Presentation: App Router. Server Components สำหรับหน้าอ่าน, Client Components เฉพาะส่วน interactive. **ห้ามใส่ business rule ใน component.**
- Application: use cases (`CreateJob`, `SearchJobs`, `ApplyToJob`, `UpdateApplicationStatus`). ตรวจ authz ก่อนทำ operation. ใช้ transaction เมื่อเขียนหลายตาราง.
- Domain: entity + สถานะธุรกิจ + invariants ด้านล่าง.
- Infrastructure: db client, repositories, auth adapter, storage, email, background jobs.

Server Actions ใช้ได้กับฟอร์มภายใน แต่ **ต้องเรียกผ่าน service layer** และผ่าน auth + authz + Zod validation เสมอ.

## Stack

Next.js App Router · TypeScript · PostgreSQL · Prisma หรือ Drizzle · Tailwind + shadcn/ui · Zod · React Hook Form · Auth.js/Clerk/Supabase Auth · S3 หรือ R2 (resume, logo) · Resend หรือ Postmark · Sentry.

Search ใช้ **PostgreSQL Full-Text Search** ใน MVP. Redis / Meilisearch ค่อยเพิ่มเมื่อข้อมูลโต.

**ห้ามเพิ่ม dependency ใหม่โดยไม่อธิบายเหตุผล.**

## Structure

```
src/app/{(public),(auth),candidate,employer,admin,api}
src/modules/{auth,users,candidates,companies,jobs,applications,saved-jobs,notifications,moderation}
src/components/{ui,layout,jobs,applications,forms}
src/lib/{db,auth,storage,validation}
prisma/{schema.prisma,migrations}
```

แต่ละ module มีขอบเขตของตัวเอง: `job.entity.ts` · `job.schema.ts` · `job.types.ts` · `job.repository.ts` · `job.service.ts`.

## Domain invariants — อย่าทำหลุด

- `applications` มี unique constraint `(job_id, candidate_id)` — กัน duplicate ที่ระดับ database ไม่ใช่แค่ที่ code.
- Job ที่ไม่ใช่ `published` ห้ามโผล่ใน public search.
- Job ที่ `expired` หรือ `closed` สมัครไม่ได้.
- Company ต้องมี owner อย่างน้อยหนึ่งคน.
- Resume อยู่ใน private bucket, เข้าถึงผ่าน signed URL อายุจำกัดเท่านั้น.
- Index: `status`, `published_at`, `expires_at`, `location`, `category_id`.

Job status: `draft → pending_review → published → paused | closed | expired`
Application status: `submitted → reviewing → shortlisted → interview → offered` (+ `withdrawn` โดย candidate, `rejected` โดย employer)

## Security checklist (ทุก endpoint)

- ตรวจ role **และ** resource ownership ทุกครั้ง; ห้ามเชื่อ role จาก client.
- Validate ด้วย Zod ทั้ง client และ server.
- Rate limit: apply, job post, file upload.
- ตรวจ MIME type และขนาดไฟล์ resume.
- Sanitize rich text ของ job description (XSS).
- Audit log สำหรับการเปลี่ยนสถานะสำคัญ.
- Error ที่ส่งออกต้องไม่เปิดเผยข้อมูลภายใน.

## UI/UX

แนวทาง: **Clean, Trustworthy, Content-first Marketplace.** เลี่ยง glassmorphism, gradient, animation เกินจำเป็น.

- พื้นหลัง white / slate อ่อน, ข้อความ navy / slate เข้ม, primary action blue หรือ teal.
- Card: ขอบบาง เงาเบา radius 12–16px. Spacing ระบบ 4/8px. Icon ชุดเดียว (Lucide).
- Font ไทย: Noto Sans Thai หรือ IBM Plex Sans Thai. Body ≥16px บนมือถือ, line-height 1.5–1.75.
- หนึ่งหน้า = หนึ่ง primary CTA.
- Accessibility: contrast ≥4.5:1, target ≥44×44px, visible label ทุก input, error ใกล้ field พร้อมวิธีแก้, keyboard nav + focus state, accessible label สำหรับ icon-only button, รองรับ `prefers-reduced-motion`, ห้ามใช้สีอย่างเดียวสื่อสถานะ, มือถือห้ามมี horizontal scroll.
- ทุกหน้าต้องมี loading, empty และ error state. Primary action ต้องมี loading feedback และกัน double submit.

## Scope

**Phase 1 (MVP)** — auth + role separation, candidate profile, company profile, job CRUD, search/filter, save job, apply พร้อม resume, employer applicant status, admin job moderation, job expiration, states ครบ.

**Phase 2** — notification, employer verification, chat, resume builder, spam protection, featured job.

**ไม่ทำใน MVP** — video interview, payroll, AI screening, chat ซับซ้อน, microservices, search infra ใหญ่, native mobile app.

## Implementation order

Schema/migration → auth/authz → profiles → job CRUD + moderation state → public search + detail → save + apply → employer applicant management → admin moderation → notification/monitoring/hardening → UX, a11y, tests.

## How to work here

1. อ่าน repo และสรุปสิ่งที่มีอยู่จริงกับสิ่งที่ยังขาด ก่อนเขียนโค้ด.
2. เสนอแผนเล็กและตรวจสอบได้ ก่อนแก้ไฟล์.
3. ทำเป็น **vertical slice** ที่ทดสอบได้ — ไม่ใช่ layer ละรอบ.
4. ทุก slice ต้องคิดถึง authorization, validation และ failure state ไม่ใช่แค่ happy path.
5. ห้ามต่อ external API ถ้ายังไม่มี requirement.
6. รัน test / lint / build ที่เกี่ยวข้อง แล้วสรุปไฟล์ที่เปลี่ยน วิธีตรวจสอบ และข้อจำกัดที่เหลือ.

## Open questions → Decision Log

ยังไม่ตัดสินใจ (ดูรายการเต็มใน brief §14): apply โดยไม่ login, บังคับ resume ก่อนสมัคร, บังคับ verify บริษัท, remote/hybrid/onsite model, salary ช่วงหรือตัวเลขเดียว, หลายทีมต่อบริษัท, เหตุผลการปฏิเสธ, chat ใน MVP, i18n, external apply URL.

ถ้ายังไม่มีคำตอบ: ใช้สมมติฐานที่เรียบง่ายที่สุด แล้ว**บันทึกไว้ใน Decision Log** — อย่าตัดสินใจเงียบ ๆ.
