# JobJing — UI Prototype

Static HTML + CSS + vanilla JS prototype of the job platform described in
[`../job-platform-architecture.md`](../job-platform-architecture.md) / [`../../../CLAUDE.md`](../../../CLAUDE.md).
No build step, no framework, no backend — all data is mocked in `js/data.js` and
persisted to `localStorage` so saves/applies/status-changes survive a reload.

## Run it

```bash
cd ui
python3 -m http.server 8080
# open http://localhost:8080
```

(Any static file server works — this is plain HTML, nothing to build.)

## Pages

| Page | Role | What it shows |
|---|---|---|
| `index.html` | candidate | Job search — keyword/location filters, category pills, sort, save toggle |
| `job-detail.html?id=` | candidate | Full job detail, company card, apply modal, save |
| `login.html` / `register.html` | guest | Auth forms with client-side validation (any input works — demo only) |
| `candidate-profile.html` | candidate | Tabs: profile form + resume upload mock, saved jobs, applications w/ status timeline + withdraw |
| `employer-dashboard.html` | employer | Stat cards, job table with status filter, publish/pause/close actions |
| `employer-post-job.html?id=` | employer | Create or edit a job posting; save as draft or submit for review |
| `employer-applicants.html?id=` | employer | Applicant table for one job, status changes, reject-with-reason |
| `admin-moderation.html` | admin | Pending job approvals + open user reports |

Each page now uses role-specific navigation. Open the relevant HTML page directly when
reviewing a role; production authorization must be enforced on the server.

## Structure

```
ui/
  css/style.css       design tokens (light + dark via prefers-color-scheme), components
  js/icons.js          inline SVG icon set (no emoji, no external requests)
  js/data.js            mock dataset + localStorage-backed Store (jobs, applications, saves, reports)
  js/app.js              shared: nav toggle, toasts, modal controller, role switch, icon injection
  js/cards.js            shared job-card renderer (index.html + saved jobs tab)
  js/search.js, job-detail.js, auth.js, candidate.js,
  js/employer-dashboard.js, employer-post-job.js, employer-applicants.js, admin.js
                          one script per page
  *.html                  9 pages, listed above
```

## Design notes

- Palette / type: clean, trustworthy, content-first marketplace — navy/slate text on white/slate-50,
  blue (`#0369A1`) primary action, per the architecture brief's UI/UX section.
- One primary CTA per page; every list has loading (skeleton), empty, and error states.
- Thai body copy throughout; layout assumes Thai text can run long — no fixed-height truncation.
- Accessibility: skip link, visible focus rings, 44px touch targets, labeled icon-only buttons,
  `aria-live` toasts, `prefers-reduced-motion` respected, dark mode via `prefers-color-scheme`.
- Domain invariants from the brief are simulated: duplicate apply is blocked client-side,
  closed/expired/paused jobs can't be applied to, non-published jobs never appear in search.

## Known simplifications (prototype, not production)

- No real backend/auth — `Store` in `js/data.js` is the "database", backed by `localStorage`.
- Employer pages assume a single demo company (Baan Software / `c1`).
- Applicant lists mix a static mock pool with any real applications submitted in-session.
- File upload is validated (type/size) but never actually uploaded anywhere.
- The mock only simulates lifecycle and authorization constraints; it is not a security boundary.
